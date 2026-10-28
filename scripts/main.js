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
 *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE) ARISING IN ANY
 *  WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 *  SUCH DAMAGE.
**/

import Audialis, { Mixer } from './audialis.js';
import Fontso from './fontso.js';
import Galileo from './galileo.js';
import InputEngine from './input-engine.js';
import Pegasus from './pegasus.js';
import Version from './version.js';

const nativeConsole = globalThis.console;
globalThis.nativeConsole = nativeConsole;
let gameErrorReported = false;

main();

async function main()
{
	window.addEventListener('error', event => reportException(event.error ?? new Error(event.message || 'A browser runtime error occurred.')));
	window.addEventListener('unhandledrejection', event => reportException(event.reason));
	await Version.initialize();
	const canvas = document.getElementById('screen');
	canvas.focus();
	canvas.addEventListener('webglcontextlost', event => {
		event.preventDefault();
		reportException(new Error('The browser lost the WebGL graphics context. Reload the page to continue.'));
	});
	try {
		const audioReady = Audialis.initialize();
		await Galileo.initialize(canvas);
		await audioReady;
		await Fontso.initialize();
		InputEngine.initialize(canvas);
		window.addEventListener('pointerdown', () => Mixer.resumeAll(), { capture: true });
		window.addEventListener('keydown', () => Mixer.resumeAll(), { capture: true });
		Pegasus.initialize();
		await Pegasus.launchGame('dist');
	}
	catch (error) {
		reportException(error);
	}
}

function reportException(thrownValue)
{
	nativeConsole.error(thrownValue);
	if (gameErrorReported)
		return;
	gameErrorReported = true;
	const message = thrownValue instanceof Error
		? thrownValue.message
		: String(thrownValue ?? 'An unexpected game error occurred.');
	globalThis.dispatchEvent(new CustomEvent('glyphica-game-error', { detail: { message } }));
}
