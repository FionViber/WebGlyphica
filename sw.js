const CACHE_NAME = 'glyphica-offline-v50';
const RUNTIME_FILES = [
	'scripts/audialis.js',
	'scripts/data-stream.js',
	'scripts/deque.js',
	'scripts/fido.js',
	'scripts/fontso.js',
	'scripts/galileo.js',
	'scripts/game.js',
	'scripts/input-engine.js',
	'scripts/job-queue.js',
	'scripts/main.js',
	'scripts/package.js',
	'scripts/pegasus.js',
	'scripts/utilities.js',
	'scripts/version.js',
];

self.addEventListener('install', event => {
	event.waitUntil((async () => {
		const cache = await caches.open(CACHE_NAME);
		const scope = self.registration.scope;
		try {
			await cache.addAll([
				new URL('index.html', scope).href,
				new URL('styles.css', scope).href,
				new URL('oozaru.json', scope).href,
				new URL('assets/default.vert.glsl', scope).href,
				new URL('assets/default.frag.glsl', scope).href,
				new URL('assets/default.rfn', scope).href,
				new URL('dist/directory-index.js', scope).href,
				new URL('dist/game.json', scope).href,
				new URL('dist/game.sgm', scope).href,
				new URL('dist/icon.png', scope).href,
				...RUNTIME_FILES.map(file => new URL(file, scope).href),
			]);
			await reportProgress({ stage: 'prepare' }, true);
			await cacheEveryGameAsset(cache, scope);
			await self.skipWaiting();
		}
		catch (error) {
			await reportProgress({ stage: 'error', message: error?.message || String(error) }, true);
			throw error;
		}
	})());
});

self.addEventListener('activate', event => {
	event.waitUntil((async () => {
		for (const key of await caches.keys()) {
			if (key.startsWith('glyphica-offline-') && key !== CACHE_NAME)
				await caches.delete(key);
		}
		await self.clients.claim();
	})());
});

self.addEventListener('fetch', event => {
	const request = event.request;
	if (request.method !== 'GET')
		return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin)
		return;

	event.respondWith((async () => {
		const cache = await caches.open(CACHE_NAME);
		const fullRequest = new Request(request.url, { method: 'GET', credentials: 'same-origin' });
		const isNavigation = request.mode === 'navigate';
		const lookupRequest = isNavigation ? new URL('index.html', self.registration.scope).href : fullRequest;
		const cached = await cache.match(lookupRequest);
		if (cached)
			return request.headers.has('range') ? rangeFromResponse(cached, request.headers.get('range')) : cached;

		try {
			const networkRequest = request.headers.has('range') ? fullRequest : request;
			const response = await fetch(networkRequest);
			if (response.ok && response.status === 200) {
				event.waitUntil(cache.put(fullRequest, response.clone()).catch(() => {}));
			}
			return request.headers.has('range') && response.ok
				? rangeFromResponse(response, request.headers.get('range'))
				: response;
		}
		catch (error) {
			if (isNavigation) {
				const appShell = await cache.match(new URL('index.html', self.registration.scope).href);
				if (appShell)
					return appShell;
			}
			return Response.error();
		}
	})());
});

async function rangeFromResponse(response, rangeHeader)
{
	if (!rangeHeader || !response.ok)
		return response;
	const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
	if (!match)
		return response;
	const bytes = await response.arrayBuffer();
	const size = bytes.byteLength;
	let start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
	let end = match[2] && match[1] ? Number(match[2]) : size - 1;
	if (start >= size || start > end)
		return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
	end = Math.min(end, size - 1);
	const headers = new Headers({
		'Accept-Ranges': 'bytes',
		'Content-Length': String(end - start + 1),
		'Content-Range': `bytes ${start}-${end}/${size}`,
	});
	const contentType = response.headers.get('Content-Type');
	if (contentType)
		headers.set('Content-Type', contentType);
	return new Response(bytes.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers });
}

let lastProgressMessageAt = 0;

async function reportProgress(data, force = false)
{
	const now = Date.now();
	if (!force && now - lastProgressMessageAt < 100)
		return;
	lastProgressMessageAt = now;
	const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
	const message = { type: 'glyphica-load-progress', ...data };
	for (const client of clients)
		client.postMessage(message);
}

async function cacheEveryGameAsset(cache, scope)
{
	const indexURL = new URL('dist/directory-index.js', scope);
	const indexSource = await (await cache.match(indexURL)).text();
	const match = indexSource.match(/globalThis\.GLYPHICA_DIRECTORY_INDEX\s*=\s*(\{[\s\S]*?\})\s*;/);
	if (!match)
		throw new Error('Could not read the game asset index for offline caching.');
	const sizesMatch = indexSource.match(/globalThis\.GLYPHICA_FILE_SIZES\s*=\s*(\{[\s\S]*?\})\s*;/);
	if (!sizesMatch)
		throw new Error('Could not read asset sizes for offline progress.');
	const hashesMatch = indexSource.match(/globalThis\.GLYPHICA_FILE_HASHES\s*=\s*(\{[\s\S]*?\})\s*;/);
	if (!hashesMatch)
		throw new Error('Could not read asset hashes for offline updates.');

	const directories = JSON.parse(match[1]);
	const sizes = JSON.parse(sizesMatch[1]);
	const hashes = JSON.parse(hashesMatch[1]);
	const indexedGameFiles = new Set(Object.values(directories).flat());
	const assets = Object.keys(sizes)
		.filter(key => indexedGameFiles.has(key) || key.startsWith('#/'))
		.map(key => {
			if (key.startsWith('@/'))
				return { key, url: new URL(`dist/${key.slice(2)}`, scope), size: sizes[key] ?? 0, hash: hashes[key] };
			if (key.startsWith('#/'))
				return { key, url: new URL(`assets/${key.slice(2)}`, scope), size: sizes[key] ?? 0, hash: hashes[key] };
			return null;
		})
		.filter(asset => asset && asset.hash && asset.url.origin === self.location.origin);
	const totalFiles = assets.length;
	const totalBytes = assets.reduce((total, asset) => total + asset.size, 0);
	let completedFiles = 0;
	let completedBytes = 0;
	const activeBytes = new Map();
	const previousCaches = (await caches.keys())
		.filter(name => name.startsWith('glyphica-offline-') && name !== CACHE_NAME);
	const previousCacheHandles = await Promise.all(previousCaches.map(name => caches.open(name)));
	const sendAssetProgress = async (asset, currentBytes = 0, source = 'network', force = false) => {
		const loadedBytes = Math.min(totalBytes, completedBytes + [...activeBytes.values()].reduce((sum, value) => sum + value, 0));
		await reportProgress({
			stage: 'assets',
			source,
			completedFiles,
			totalFiles,
			loadedBytes,
			totalBytes,
			currentFile: asset?.url.pathname.replace(/^\//, '') ?? '',
			currentBytes,
			currentTotalBytes: asset?.size ?? 0,
		}, force);
	};
	await reportProgress({ stage: 'assets', source: 'network', completedFiles, totalFiles, loadedBytes: 0, totalBytes, currentFile: '', currentBytes: 0, currentTotalBytes: 0 }, true);

	for (let i = 0; i < assets.length; i += 8) {
		await Promise.all(assets.slice(i, i + 8).map(async asset => {
			const currentCacheEntry = await cache.match(asset.url);
			if (currentCacheEntry?.headers.get('X-Glyphica-Asset-Hash') === asset.hash) {
				completedFiles++;
				completedBytes += asset.size;
				await sendAssetProgress(asset, asset.size, 'cache', true);
				return;
			}
			for (const previousCache of previousCacheHandles) {
				const cached = await previousCache.match(asset.url);
				if (cached?.headers.get('X-Glyphica-Asset-Hash') === asset.hash) {
					await cache.put(asset.url, cached);
					completedFiles++;
					completedBytes += asset.size;
					await sendAssetProgress(asset, asset.size, 'cache', true);
					return;
				}
			}
			const response = await fetch(asset.url);
			if (!response.ok || response.status !== 200)
				throw new Error(`Could not cache game asset ${asset.url.pathname}: HTTP ${response.status}`);
			if (!response.body)
				throw new Error(`Could not read game asset ${asset.url.pathname}.`);

			const [cacheStream, progressStream] = response.body.tee();
			const responseHeaders = new Headers(response.headers);
			responseHeaders.set('X-Glyphica-Asset-Hash', asset.hash);
			const cachedResponse = new Response(cacheStream, {
				status: response.status,
				statusText: response.statusText,
				headers: responseHeaders,
			});
			const cacheWrite = cache.put(asset.url, cachedResponse);
			const reader = progressStream.getReader();
			let currentBytes = 0;
			activeBytes.set(asset.key, currentBytes);
			await sendAssetProgress(asset, currentBytes, 'network', true);
			try {
				while (true) {
					const result = await reader.read();
					if (result.done)
						break;
					currentBytes += result.value.byteLength;
					activeBytes.set(asset.key, currentBytes);
					await sendAssetProgress(asset, currentBytes);
				}
			}
			finally {
				reader.releaseLock();
			}
			await cacheWrite;
			activeBytes.delete(asset.key);
			completedFiles++;
			completedBytes += asset.size || currentBytes;
			await sendAssetProgress(asset, asset.size || currentBytes, 'network', true);
		}));
	}
	await reportProgress({ stage: 'complete', completedFiles, totalFiles, loadedBytes: totalBytes, totalBytes }, true);
}
