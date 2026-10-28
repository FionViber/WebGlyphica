/**
 *  Oozaru: Sphere for the Web
 *  Copyright (c) 2016-2025, Where'd She Go? LLC
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 *  * Neither the name of Spherical nor the names of its contributors may be
 *    used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
**/

import { Mixer, Sample, Sound, SoundStream } from './audialis.js';
import { DataStream } from './data-stream.js';
import Fido from './fido.js';
import { Font } from './fontso.js';
import Game from './game.js';
import Galileo, { BlendOp, Color, DepthOp, IndexList, Model, Shader, Shape, ShapeType, Surface, Texture, Transform, VertexList } from './galileo.js';
import InputEngine, { Joystick, Key, Keyboard, Mouse, MouseKey } from './input-engine.js';
import JobQueue, { Dispatch, JobToken, JobType } from './job-queue.js';
import Prim from '../assets/game_modules/prim.js';
import Version from './version.js';

const DataType =
{
	Bytes: 0,
	JSON: 1,
	Lines: 2,
	Raw: 3,
	Text: 4,
};

const FileOp =
{
	Read: 0,
	Update: 1,
	Write: 2,
};

const console = globalThis.console;

var mainObject;
var fullScreenState = document.fullscreenElement !== null;

document.addEventListener('fullscreenchange', () => {
	fullScreenState = document.fullscreenElement !== null;
});

// NeoSphere exposes these routines through its native renderer.  Recreate the
// same immediate-mode primitives using Oozaru's WebGL renderer for the game.
const PrimNative = {
	drawFilledCircle(surface, x, y, radius, color)
	{
		Prim.drawSolidCircle(surface, x, y, Math.max(0, radius), color);
	},
	drawCircle(surface, x, y, radius, thickness, color)
	{
		drawArc(surface, x, y, radius, 0, 2 * Math.PI, thickness, color);
	},
	drawFilledRectangle(surface, x1, y1, x2, y2, color)
	{
		Prim.drawSolidRectangle(surface, x1, y1, x2 - x1, y2 - y1, color);
	},
	drawRectangle(surface, x1, y1, x2, y2, thickness, color)
	{
		Prim.drawRectangle(surface, x1, y1, x2 - x1, y2 - y1, thickness, color);
	},
	drawLine(surface, x1, y1, x2, y2, thickness, color)
	{
		Prim.drawLine(surface, x1, y1, x2, y2, thickness, color);
	},
	drawFilledTriangle(surface, x1, y1, x2, y2, x3, y3, color)
	{
		Prim.drawSolidTriangle(surface, x1, y1, x2, y2, x3, y3, color);
	},
	drawTriangle(surface, x1, y1, x2, y2, x3, y3, thickness, color)
	{
		Prim.drawLine(surface, x1, y1, x2, y2, thickness, color);
		Prim.drawLine(surface, x2, y2, x3, y3, thickness, color);
		Prim.drawLine(surface, x3, y3, x1, y1, thickness, color);
	},
	drawArc,
	drawFilledRoundedRectangle(surface, x1, y1, x2, y2, radiusX, radiusY, color)
	{
		const path = roundedRectanglePath(x1, y1, x2, y2, radiusX, radiusY);
		const center = { x: (x1 + x2) / 2, y: (y1 + y2) / 2, color };
		Shape.drawImmediate(surface, ShapeType.Fan, [center, ...path, path[0]]);
	},
	drawRoundedRectangle(surface, x1, y1, x2, y2, radiusX, radiusY, thickness, color)
	{
		const half = Math.max(0, thickness) / 2;
		const outer = roundedRectanglePath(x1 - half, y1 - half, x2 + half, y2 + half, radiusX + half, radiusY + half);
		const inner = roundedRectanglePath(x1 + half, y1 + half, x2 - half, y2 - half, radiusX - half, radiusY - half);
		const vertices = [];
		for (let i = 0; i < outer.length; ++i)
			vertices.push({ ...outer[i], color }, { ...inner[i], color });
		vertices.push({ ...outer[0], color }, { ...inner[0], color });
		Shape.drawImmediate(surface, ShapeType.TriStrip, vertices);
	},
};

PrimNative.drawArc = drawArc;

function drawArc(surface, x, y, radius, startAngle, sweepAngle, thickness, color)
{
	const outer = Math.max(0, radius + thickness / 2);
	const inner = Math.max(0, radius - thickness / 2);
	const segments = Math.max(1, Math.ceil(Math.abs(sweepAngle) * Math.max(outer, 1) / 3));
	const vertices = [];
	for (let i = 0; i <= segments; ++i) {
		const angle = startAngle + sweepAngle * i / segments;
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		vertices.push(
			{ x: x + cos * outer, y: y - sin * outer, color },
			{ x: x + cos * inner, y: y - sin * inner, color },
		);
	}
	Shape.drawImmediate(surface, ShapeType.TriStrip, vertices);
}

function roundedRectanglePath(x1, y1, x2, y2, radiusX, radiusY)
{
	const width = Math.max(0, x2 - x1);
	const height = Math.max(0, y2 - y1);
	const rx = Math.min(Math.max(0, radiusX), width / 2);
	const ry = Math.min(Math.max(0, radiusY), height / 2);
	const steps = Math.max(2, Math.min(16, Math.ceil(Math.PI * Math.max(rx, ry) / 8)));
	const corners = [
		{ x: x2 - rx, y: y1 + ry, start: -Math.PI / 2 },
		{ x: x2 - rx, y: y2 - ry, start: 0 },
		{ x: x1 + rx, y: y2 - ry, start: Math.PI / 2 },
		{ x: x1 + rx, y: y1 + ry, start: Math.PI },
	];
	const path = [];
	for (const corner of corners) {
		for (let i = 0; i <= steps; ++i) {
			const angle = corner.start + Math.PI / 2 * i / steps;
			path.push({ x: corner.x + Math.cos(angle) * rx, y: corner.y + Math.sin(angle) * ry });
		}
	}
	return path;
}

export default
class Pegasus
{
	static initialize()
	{
		// register Sphere v2 API globals
		Object.assign(globalThis, {
			// enumerations
			BlendOp,
			DataType,
			DepthOp,
			FileOp,
			JobType,
			Key,
			MouseKey,
			ShapeType,

			// classes and namespaces
			Sphere,
			Color,
			Dispatch,
			DirectoryStream,
			FS,
			File,
			FileStream,
			Font,
			IndexList,
			JobToken,
			Joystick,
			Keyboard,
			Mixer,
			Sample,
			Model,
			Mouse,
			SSj,
			Shader,
			Shape,
			PrimNative,
			Sound,
			SoundStream,
			Surface,
			Texture,
			Transform,
			VertexList,
		});
	}

	static async launchGame(rootPath)
	{
		// load the game's JSON manifest
		await Game.initialize(rootPath);

		let lastLoadingProgressAt = 0;
		const reportLoadingProgress = detail => {
			if (document.getElementById('loading-screen')?.hidden)
				return;
			const now = Date.now();
			if (now - lastLoadingProgressAt < 120)
				return;
			lastLoadingProgressAt = now;
			globalThis.dispatchEvent(new CustomEvent('glyphica-game-progress', { detail }));
		};

		Dispatch.onRender(() => {
			if (Fido.numJobs === 0)
				return;
			const jobs = Fido.jobDetails;
			const currentJob = [...jobs].reverse().find(job => !job.finished) ?? jobs[jobs.length - 1];
			const loadedBytes = jobs.reduce((total, job) => total + job.bytesDone, 0);
			const totalBytes = jobs.reduce((total, job) => total + (job.totalSize ?? 0), 0);
			reportLoadingProgress({
				fileCount: jobs.length,
				loadedBytes,
				totalBytes,
				currentFile: currentJob?.url ?? '',
				currentBytes: currentJob?.bytesDone ?? 0,
				currentTotalBytes: currentJob?.totalSize ?? 0,
			});
			const status = Fido.progress < 1.0
				? `${Math.floor(100.0 * Fido.progress)}% - ${Fido.numJobs} files`
				: `loading ${Fido.numJobs} files`;
			const textSize = Font.Default.getTextSize(status);
			const x = Surface.Screen.width - textSize.width - 5;
			const y = Surface.Screen.height - textSize.height - 5;
			Font.Default.drawText(Surface.Screen, x + 1, y + 1, status, Color.Black);
			Font.Default.drawText(Surface.Screen, x, y, status, Color.Silver);
		}, {
			inBackground: true,
			priority: Infinity,
		});

		// start the Sphere v2 event loop
		JobQueue.start();

		await Game.launch();
	}
}

class Sphere
{
	static get desktopResolution()
	{
		const deviceScale = Number.isFinite(window.devicePixelRatio) && window.devicePixelRatio > 0
			? window.devicePixelRatio
			: 1;
		const width = Math.round((window.screen?.width ?? window.innerWidth ?? 1920) * deviceScale);
		const height = Math.round((window.screen?.height ?? window.innerHeight ?? 1080) * deviceScale);
		return width < 1920 || height < 1080
			? { width: 1920, height: 1080 }
			: { width, height };
	}

	static get APILevel()
	{
		return Version.apiLevel;
	}

	static get Compiler()
	{
		return undefined;
	}

	static get Engine()
	{
		return `${Version.engine} ${Version.version}`;
	}

	static get Game()
	{
		return Game.manifest;
	}

	static get Version()
	{
		return Version.apiVersion;
	}

	static get frameRate()
	{
		return 60;
	}

	static get frameSkip()
	{
		return 0;
	}

	static get fullScreen()
	{
		return fullScreenState;
	}

	static set frameRate(value)
	{
		throw Error(`'Sphere.frameRate' cannot be set in Oozaru`);
	}

	static set frameSkip(value)
	{
		throw Error(`'Sphere.frameSkip' cannot be set in Oozaru`);
	}

	static set fullScreen(value)
	{
		const target = document.getElementById('screen-container') ?? document.getElementById('screen');
		fullScreenState = Boolean(value);
		if (fullScreenState && !document.fullscreenElement) {
			if (target?.requestFullscreen)
				target.requestFullscreen().catch(() => { fullScreenState = document.fullscreenElement !== null; });
			else
				fullScreenState = false;
		}
		else if (!fullScreenState && document.fullscreenElement)
			document.exitFullscreen().catch(() => { fullScreenState = document.fullscreenElement !== null; });
	}

	static audioEnabled()
	{
		return true;
	}

	static openURL(url)
	{
		return window.open(url, '_blank', 'noopener,noreferrer');
	}

	static restart()
	{
		location.reload();
	}

	static shutDown()
	{
		location.reload();
	}

	static get main()
	{
		return mainObject;
	}

	static now()
	{
		return JobQueue.now();
	}

	static sleep(numFrames)
	{
		return new Promise((resolve) => {
			Dispatch.later(numFrames, resolve);
		});
	}

	static setResolution(width, height)
	{
		Galileo.rerez(width, height);
	}
}

class FS
{
	static fullPath(pathName, baseDirName)
	{
		return Game.fullPath(pathName, baseDirName);
	}

	static directoryExists(pathName)
	{
		const directory = `${Game.fullPath(pathName).replace(/\/+$/, '')}/`;
		return Object.prototype.hasOwnProperty.call(globalThis.GLYPHICA_DIRECTORY_INDEX ?? {}, directory);
	}

	static createDirectory(pathName)
	{
		if (!Game.fullPath(pathName).startsWith('~/'))
			throw Error('The game package is read-only.');
	}

	static readFile(pathName, dataType = DataType.Text)
	{
		const filePath = Game.fullPath(pathName);
		if (!filePath.startsWith('~/'))
			throw Error('Synchronous reads are only available for browser save data.');
		const record = readSaveRecord(filePath);
		if (record === null)
			throw Error(`File not found: ${filePath}`);
		return decodeSaveRecord(record, dataType);
	}

	static writeFile(pathName, data)
	{
		const filePath = Game.fullPath(pathName);
		if (!filePath.startsWith('~/'))
			throw Error('The game package is read-only.');
		writeSaveRecord(filePath, data);
	}
}

class File
{
	static async exists(fileName)
	{
		const filePath = Game.fullPath(fileName);
		if (filePath.startsWith('~/'))
			return readSaveRecord(filePath) !== null;
		return (globalThis.GLYPHICA_FILE_PATHS ?? new Set()).has(filePath);
	}

	static async load(fileName, dataType = DataType.Text)
	{
		const filePath = Game.fullPath(fileName);
		if (filePath.startsWith('~/')) {
			const record = readSaveRecord(filePath);
			if (record === null)
				throw Error(`File not found: ${filePath}`);
			return decodeSaveRecord(record, dataType);
		}
		const url = Game.urlOf(filePath);
		switch (dataType) {
			case DataType.Bytes:
				const data = await Fido.fetchData(url);
				return new Uint8Array(data);
			case DataType.JSON:
				return Fido.fetchJSON(url);
			case DataType.Lines:
				const text = await Fido.fetchText(url);
				return text.split(/\r?\n/);
			case DataType.Raw:
				return Fido.fetchData(url);
			case DataType.Text:
				return Fido.fetchText(url);
		}
	}

	static async remove(fileName)
	{
		const filePath = Game.fullPath(fileName);
		if (!filePath.startsWith('~/'))
			throw Error('The game package is read-only.');
		localStorage.removeItem(storageKey(filePath));
	}

	static async rename(fileName, newFileName)
	{
		throw Error(`'File.rename' is not implemented`)
	}

	static async run(fileName)
	{
		const url = Game.urlOf(fileName);
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.onload = () => {
				resolve();
				script.remove();
			}
			script.onerror = () => {
				reject(Error(`Couldn't load JS script '${url}'`));
				script.remove();
			}
			script.src = url;
			document.head.appendChild(script);
		});
	}

	static async save(fileName, data)
	{
		const filePath = Game.fullPath(fileName);
		if (!filePath.startsWith('~/'))
			throw Error('The game package is read-only.');
		await writeSaveRecord(filePath, data);
	}
}

class DirectoryStream
{
	#files;
	#index = 0;

	constructor(pathName)
	{
		const directory = `${Game.fullPath(pathName).replace(/\/+$/, '')}/`;
		this.#files = globalThis.GLYPHICA_DIRECTORY_INDEX?.[directory] ?? [];
	}

	next()
	{
		if (this.#index >= this.#files.length)
			return { done: true };
		const fullPath = this.#files[this.#index++];
		const fileName = fullPath.slice(fullPath.lastIndexOf('/') + 1);
		const dot = fileName.lastIndexOf('.');
		return {
			done: false,
			value: {
				extension: dot >= 0 ? fileName.slice(dot) : '',
				fileName,
				fullPath,
			},
		};
	}

	static async fromURL(pathName)
	{
		return new DirectoryStream(pathName);
	}
}

function storageKey(filePath)
{
	return `glyphica-web:${Game.manifest?.saveID ?? 'glyphica'}:${filePath}`;
}

function readSaveRecord(filePath)
{
	const value = localStorage.getItem(storageKey(filePath));
	return value === null ? null : JSON.parse(value);
}

async function writeSaveRecord(filePath, data)
{
	if (typeof data === 'string') {
		localStorage.setItem(storageKey(filePath), JSON.stringify({ encoding: 'text', value: data }));
		return;
	}
	if (data instanceof Blob)
		data = await data.arrayBuffer();
	let bytes;
	if (data instanceof ArrayBuffer)
		bytes = new Uint8Array(data);
	else if (ArrayBuffer.isView(data))
		bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
	else
		bytes = new TextEncoder().encode(JSON.stringify(data));
	let binary = '';
	for (let i = 0; i < bytes.length; i += 0x8000)
		binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	localStorage.setItem(storageKey(filePath), JSON.stringify({ encoding: 'base64', value: btoa(binary) }));
}

function decodeSaveRecord(record, dataType)
{
	const bytes = record.encoding === 'base64'
		? Uint8Array.from(atob(record.value), character => character.charCodeAt(0))
		: new TextEncoder().encode(record.value);
	if (dataType === DataType.Bytes)
		return bytes;
	if (dataType === DataType.Raw)
		return bytes.buffer;
	const text = new TextDecoder().decode(bytes);
	if (dataType === DataType.JSON)
		return JSON.parse(text);
	if (dataType === DataType.Lines)
		return text.split(/\r?\n/);
	return text;
}

class FileStream
{
	#dataStream;
	#fullPath;

	static async fromFile(fileName, fileOp)
	{
		if (fileOp !== FileOp.Read)
			throw RangeError(`Opening files in write mode is not yet supported`);

		const url = Game.urlOf(fileName);
		const data = await Fido.fetchData(url);
		const fileStream = Object.create(this.prototype);
		fileStream.#fullPath = fileName;
		fileStream.#dataStream = new DataStream(data);
		return fileStream;
	}

	constructor()
	{
		throw RangeError(`'new FileStream()' is not supported`);
	}

	get fileName()
	{
		return this.#fullPath;
	}

	get fileSize()
	{
		if (this.#dataStream === null)
			throw Error(`The FileStream has already been disposed`);
		return this.#dataStream.bufferSize;
	}

	get position()
	{
		if (this.#dataStream === null)
			throw Error(`The FileStream has already been disposed`);
		return this.#dataStream.position;
	}

	set position(value)
	{
		if (this.#dataStream === null)
			throw Error(`The FileStream has already been disposed`);
		this.#dataStream.position = value;
	}

	dispose()
	{
		this.#dataStream = null;
	}

	read(numBytes)
	{
		if (this.#dataStream === null)
			throw Error(`The FileStream has already been disposed`);
		return this.#dataStream.readBytes(numBytes).buffer;
	}

	write(data)
	{
		if (this.#dataStream === null)
			throw Error(`The FileStream has already been disposed`);
		throw Error(`'FileStream#write' is not yet implemented.`);
	}
}

class SSj
{
	static log(object)
	{
		console.log(object);
	}

	static now()
	{
		return performance.now() / 1000.0;
	}
}
