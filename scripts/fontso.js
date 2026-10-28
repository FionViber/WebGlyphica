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

import { DataStream } from './data-stream.js';
import Fido from './fido.js';
import { Color, Shape, ShapeType, Texture } from './galileo.js';
import Game from './game.js';

var defaultFont;
const fontDataCache = new Map();
const fontFaceCache = new Map();
let fontMetricsPromise;

async function getStaticFontMetrics()
{
	if (!fontMetricsPromise) {
		fontMetricsPromise = (async () => {
			const data = await Fido.fetchData(Game.urlOf('#/font-metrics.json'));
			const metrics = JSON.parse(new TextDecoder().decode(data));
			if (metrics.schema !== 1)
				throw Error('Unsupported static font metrics schema.');
			return metrics;
		})().catch(error => {
			fontMetricsPromise = undefined;
			throw error;
		});
	}
	return fontMetricsPromise;
}

export default
class Fontso
{
    static async initialize()
    {
		defaultFont = await Font.fromFile('#/default.rfn');
    }
}

export
class Font
{
	#fileName;
	#glyphAtlas;
	#glyphData = [];
	#lineHeight = 0;
	#maxWidth = 0;
	#numGlyphs = 0;
	#stride;

	static get Default()
	{
		return defaultFont;
	}

	static async fromFile(fileName, size = 24, options = {})
	{
		const fullPath = Game.fullPath(fileName);
		let fileDataPromise = fontDataCache.get(fullPath);
		if (!fileDataPromise) {
			fileDataPromise = Fido.fetchData(Game.urlOf(fullPath));
			fontDataCache.set(fullPath, fileDataPromise);
		}
		const fileData = await fileDataPromise;
		const signature = new TextDecoder().decode(fileData.slice(0, 4));
		if (signature === '.rfn') {
			const font = new Font(fileData);
			font.#fileName = fullPath;
			return font;
		}

		let facePromise = fontFaceCache.get(fullPath);
		if (!facePromise) {
			const family = `Glyphica_${fullPath.replace(/[^a-zA-Z0-9_]/g, '_')}`;
			facePromise = (async () => {
				// A unique, explicitly normal face per bundled font prevents platform
				// font matching and synthetic weights from changing Glyphica's UI.
				const face = new FontFace(family, fileData, {
					style: 'normal',
					weight: '400',
					stretch: 'normal',
					display: 'block',
				});
				await face.load();
				document.fonts.add(face);
				return family;
			})();
			fontFaceCache.set(fullPath, facePromise);
		}
		const family = await facePromise;
		const metrics = await getStaticFontMetrics();
		const fileMetrics = metrics[fullPath];
		if (!fileMetrics)
			throw Error(`Static metrics are missing for font '${fullPath}'.`);
		return new CanvasFont(family, fullPath, size, options, fileMetrics);
	}

	constructor(...args)
	{
		if (typeof args[0] === 'string') {
			throw Error("'new Font' from filename is not supported");
		}
		else if (args[0] instanceof ArrayBuffer) {
			let dataStream = new DataStream(args[0]);
			let rfnHeader = dataStream.readStruct({
				signature: 'string/4',
				version:   'uint16-le',
				numGlyphs: 'uint16-le',
				reserved:  'reserve/248',
			});
			if (rfnHeader.signature !== '.rfn')
				throw Error(`Unable to load RFN font file`);
			if (rfnHeader.version < 2 || rfnHeader.version > 2)
				throw Error(`Unsupported RFN version '${rfnHeader.version}'`);
			if (rfnHeader.numGlyphs <= 0)
				throw Error(`Malformed RFN font (no glyphs)`);
			const numAcross = Math.ceil(Math.sqrt(rfnHeader.numGlyphs));
			this.#stride = 1.0 / numAcross;
			for (let i = 0; i < rfnHeader.numGlyphs; ++i) {
				let charInfo = dataStream.readStruct({
					width:    'uint16-le',
					height:   'uint16-le',
					reserved: 'reserve/28',
				});
				this.#lineHeight = Math.max(this.#lineHeight, charInfo.height);
				this.#maxWidth = Math.max(this.#maxWidth, charInfo.width);
				const pixelData = dataStream.readBytes(charInfo.width * charInfo.height * 4);
				this.#glyphData.push({
					width: charInfo.width,
					height: charInfo.height,
					u: i % numAcross / numAcross,
					v: 1.0 - Math.floor(i / numAcross) / numAcross,
					pixelData,
				});
			}
			this.#glyphAtlas = new Texture(numAcross * this.#maxWidth, numAcross * this.#lineHeight);
			this.#numGlyphs = rfnHeader.numGlyphs;
			for (let i = 0; i < this.#numGlyphs; ++i) {
				const glyph = this.#glyphData[i];
				const x = i % numAcross * this.#maxWidth;
				const y = Math.floor(i / numAcross) * this.#lineHeight;
				this.#glyphAtlas.upload(glyph.pixelData, x, y, glyph.width, glyph.height);
			}
		}
		else {
			throw RangeError("Invalid argument(s) passed to 'new Font'.");
		}
	}

	get fileName()
	{
		return this.#fileName;
	}

	get height()
	{
		return this.#lineHeight;
	}

	drawText(surface, x, y, text, color = Color.White, wrapWidth)
	{
		text = text.toString();
		const lines = wrapWidth !== undefined
			? this.wordWrap(text, wrapWidth)
			: [ text ];
		for (let i = 0, len = lines.length; i < len; ++i)
			this.#renderString(surface, x, y + i * this.#lineHeight, lines[i], color);
	}

	getTextSize(text, wrapWidth)
	{
		text = text.toString();
		if (wrapWidth !== undefined) {
			const lines = this.wordWrap(text, wrapWidth);
			return {
				width: wrapWidth,
				height: lines.length * this.#lineHeight,
			};
		}
		else {
			return {
				width: this.widthOf(text),
				height: this.#lineHeight,
			};
		}
	}

	heightOf(text, wrapWidth)
	{
		return this.getTextSize(text, wrapWidth).height;
	}

	widthOf(text)
	{
		text = text.toString();
		let cp;
		let ptr = 0;
		let width = 0;
		while ((cp = text.codePointAt(ptr++)) !== undefined) {
			if (cp > 0xFFFF)  // surrogate pair?
				++ptr;
			cp = toCP1252(cp);
			if (cp >= this.#numGlyphs)
				cp = 0x1A;
			width += this.#glyphData[cp].width;
		}
		return width;
	}

	wordWrap(text, wrapWidth)
	{
		text = text.toString();
		const lines = [];
		const codepoints = [];
		let currentLine = "";
		let lineWidth = 0;
		let lineFinished = false;
		let wordWidth = 0;
		let wordFinished = false;
		let cp;
		let ptr = 0;
		while ((cp = text.codePointAt(ptr++)) !== undefined) {
			if (cp > 0xFFFF)  // surrogate pair?
				++ptr;
			cp = toCP1252(cp);
			if (cp >= this.#numGlyphs)
				cp = 0x1A;
			const glyph = this.#glyphData[cp];
			switch (cp) {
				case 13: case 10:  // newline
					if (cp === 13 && text.codePointAt(ptr) == 10)
						++ptr;  // treat CRLF as a single newline
					lineFinished = true;
					break;
				case 8:  // tab
					codepoints.push(cp);
					wordWidth += this.#glyphData[32].width * 3;
					wordFinished = true;
					break;
				case 32:  // space
					codepoints.push(cp);
					wordWidth += glyph.width;
					wordFinished = true;
					break;
				default:
					codepoints.push(cp);
					wordWidth += glyph.width;
					break;
			}
			if (wordFinished || lineFinished) {
				currentLine += String.fromCodePoint(...codepoints);
				lineWidth += wordWidth;
				codepoints.length = 0;
				wordWidth = 0;
				wordFinished = false;
			}
			if (lineWidth + wordWidth > wrapWidth || lineFinished) {
				lines.push(currentLine);
				currentLine = "";
				lineWidth = 0;
				lineFinished = false;
			}
		}
		currentLine += String.fromCodePoint(...codepoints);
		if (currentLine !== "")
			lines.push(currentLine);
		return lines;
	}

	#renderString(surface, x, y, text, color)
	{
		x = Math.trunc(x);
        y = Math.trunc(y);
        if (text === "")
			return;  // empty string, nothing to render
		let cp;
		let ptr = 0;
		let xOffset = 0;
		const vertices = [];
		while ((cp = text.codePointAt(ptr++)) !== undefined) {
			if (cp > 0xFFFF)  // surrogate pair?
				++ptr;
			cp = toCP1252(cp);
			if (cp >= this.#numGlyphs)
				cp = 0x1A;
			const glyph = this.#glyphData[cp];
			const x1 = x + xOffset, x2 = x1 + glyph.width;
			const y1 = y, y2 = y1 + glyph.height;
			const u1 = glyph.u;
			const u2 = u1 + glyph.width / this.#maxWidth * this.#stride;
			const v1 = glyph.v;
			const v2 = v1 - glyph.height / this.#lineHeight * this.#stride;
			vertices.push(
				{ x: x1, y: y1, u: u1, v: v1, color },
				{ x: x2, y: y1, u: u2, v: v1, color },
				{ x: x1, y: y2, u: u1, v: v2, color },
				{ x: x2, y: y1, u: u2, v: v1, color },
				{ x: x1, y: y2, u: u1, v: v2, color },
				{ x: x2, y: y2, u: u2, v: v2, color },
			);
			xOffset += glyph.width;
		}
        Shape.drawImmediate(surface, ShapeType.Triangles, this.#glyphAtlas, vertices);
	}
}

class CanvasFont
{
	#atlasPages = [];
	#family;
	#fileName;
	#fontSize;
	#fontSpec;
	#glyphs = new Map();
	#kerning;
	#fontMetrics;
	#unitsPerEm;
	#kerningPairs;
	#lineAscent;
	#lineDescent;
	#lineHeight;

	constructor(family, fileName, size, options, fontMetrics)
	{
		this.#family = family;
		this.#fileName = fileName;
		this.#fontSize = Math.max(1, Number(size) || 24);
		this.#fontSpec = `${this.#fontSize}px "${family}"`;
		this.#kerning = options.kerning !== false;
		if (!fontMetrics || !Number.isFinite(fontMetrics.unitsPerEm) || fontMetrics.unitsPerEm <= 0 || !fontMetrics.glyphs)
			throw Error(`Static metrics are malformed for font '${fileName}'.`);
		this.#fontMetrics = fontMetrics;
		this.#unitsPerEm = fontMetrics.unitsPerEm;
		this.#kerningPairs = new Map(fontMetrics.kerning.map(([left, right, adjustment]) => [`${left}:${right}`, adjustment]));
		const scale = this.#fontSize / this.#unitsPerEm;
		this.#lineAscent = Math.ceil(fontMetrics.lineAscent * scale);
		this.#lineDescent = Math.ceil(fontMetrics.lineDescent * scale);
		this.#lineHeight = Math.max(1, this.#lineAscent + this.#lineDescent);
	}

	get fileName() { return this.#fileName; }
	get height() { return this.#lineHeight; }

	drawText(surface, x, y, text, color = Color.White, wrapWidth)
	{
		const lines = wrapWidth !== undefined ? this.wordWrap(text, wrapWidth) : String(text).split(/\r?\n/);
		for (let i = 0; i < lines.length; ++i)
			this.#renderLine(surface, x, y + i * this.#lineHeight, lines[i], color);
	}

	getTextSize(text, wrapWidth)
	{
		if (wrapWidth !== undefined) {
			const lines = this.wordWrap(text, wrapWidth);
			return { width: wrapWidth, height: lines.length * this.#lineHeight };
		}
		const lines = String(text).split(/\r?\n/);
		return {
			width: Math.max(0, ...lines.map(line => this.widthOf(line))),
			height: Math.max(1, lines.length) * this.#lineHeight,
		};
	}

	heightOf(text, wrapWidth)
	{
		return this.getTextSize(text, wrapWidth).height;
	}

	widthOf(text)
	{
		let width = 0;
		let previousCodePoint = null;
		for (const character of String(text)) {
			if (character === '\t') {
				width += this.#advanceFor(' ') * 3;
				previousCodePoint = null;
				continue;
			}
			const resolved = this.#resolveCharacter(character);
			if (!resolved) {
				previousCodePoint = null;
				continue;
			}
			if (previousCodePoint !== null)
				width += this.#kerningAdjustment(previousCodePoint, resolved.codePoint);
			width += resolved.metrics[0] * this.#fontSize / this.#unitsPerEm;
			previousCodePoint = resolved.codePoint;
		}
		return width;
	}

	wordWrap(text, wrapWidth)
	{
		const lines = [];
		let line = '';
		for (const paragraph of String(text).split(/\r?\n/)) {
			const words = paragraph.split(/(\s+)/);
			for (const word of words) {
				if (line && this.widthOf(line + word) > wrapWidth) {
					lines.push(line);
					line = word.trimStart();
				}
				else {
					line += word;
				}
			}
			lines.push(line);
			line = '';
		}
		return lines.length ? lines : [''];
	}

	#resolveCharacter(character)
	{
		const codePoint = character.codePointAt(0);
		const key = String(codePoint);
		if (Object.prototype.hasOwnProperty.call(this.#fontMetrics.glyphs, key))
			return { codePoint, character, metrics: this.#fontMetrics.glyphs[key] };
		const fallbackCodePoint = this.#fontMetrics.fallbackCodePoint;
		if (fallbackCodePoint === null || fallbackCodePoint === undefined)
			return null;
		const fallbackKey = String(fallbackCodePoint);
		const fallbackMetrics = this.#fontMetrics.glyphs[fallbackKey];
		return fallbackMetrics
			? { codePoint: fallbackCodePoint, character: String.fromCodePoint(fallbackCodePoint), metrics: fallbackMetrics }
			: null;
	}

	#advanceFor(character)
	{
		const resolved = this.#resolveCharacter(character);
		return resolved ? resolved.metrics[0] * this.#fontSize / this.#unitsPerEm : 0;
	}

	#kerningAdjustment(leftCodePoint, rightCodePoint)
	{
		if (!this.#kerning)
			return 0;
		const adjustment = this.#kerningPairs.get(`${leftCodePoint}:${rightCodePoint}`) ?? 0;
		return adjustment * this.#fontSize / this.#unitsPerEm;
	}

	#getGlyph(character)
	{
		const existing = this.#glyphs.get(character);
		if (existing)
			return existing;

		const resolved = this.#resolveCharacter(character);
		if (!resolved) {
			const emptyGlyph = { advance: 0, codePoint: null, left: 0, ascent: 0, width: 0, height: 0, page: -1, x: 0, y: 0 };
			this.#glyphs.set(character, emptyGlyph);
			return emptyGlyph;
		}
		const [, xMin, yMin, xMax, yMax] = resolved.metrics;
		const scale = this.#fontSize / this.#unitsPerEm;
		const safetyPixel = 1;
		const left = Math.max(0, Math.ceil(Math.max(0, -xMin) * scale)) + safetyPixel;
		const right = Math.max(0, Math.ceil(Math.max(0, xMax) * scale)) + safetyPixel;
		const ascent = Math.max(0, Math.ceil(Math.max(0, yMax) * scale)) + safetyPixel;
		const descent = Math.max(0, Math.ceil(Math.max(0, -yMin) * scale)) + safetyPixel;
		const glyphWidth = left + right;
		const glyphHeight = ascent + descent;
		const glyph = {
			advance: resolved.metrics[0] * scale,
			codePoint: resolved.codePoint,
			left,
			ascent,
			width: glyphWidth,
			height: glyphHeight,
			page: -1,
			x: 0,
			y: 0,
		};
		if (xMin === xMax || yMin === yMax) {
			this.#glyphs.set(character, glyph);
			return glyph;
		}

		const padding = 2;
		const cellWidth = glyphWidth + padding * 2;
		const cellHeight = glyphHeight + padding * 2;
		let pageIndex = this.#atlasPages.length - 1;
		let page = pageIndex >= 0 ? this.#atlasPages[pageIndex] : null;
		let position = page ? this.#findSpace(page, cellWidth, cellHeight) : null;
		if (!position) {
			page = this.#createPage(Math.max(cellWidth, cellHeight) + 4);
			pageIndex = this.#atlasPages.length - 1;
			position = this.#findSpace(page, cellWidth, cellHeight);
		}

		const x = position.x;
		const y = position.y;
		page.context.font = this.#fontSpec;
		page.context.textBaseline = 'alphabetic';
		page.context.textAlign = 'left';
		if ('fontKerning' in page.context)
			page.context.fontKerning = 'none';
		if ('fontStretch' in page.context)
			page.context.fontStretch = 'normal';
		page.context.fillStyle = '#fff';
		page.context.fillText(resolved.character, x + padding + left, y + padding + ascent);
		const pixels = page.context.getImageData(x, y, cellWidth, cellHeight).data;
		page.texture.upload(pixels, x, y, cellWidth, cellHeight);
		Object.assign(glyph, { page: pageIndex, x: x + padding, y: y + padding });
		this.#glyphs.set(character, glyph);
		return glyph;
	}

	#findSpace(page, width, height)
	{
		const padding = 2;
		const cellWidth = width;
		const cellHeight = height;
		if (page.x + cellWidth > page.size) {
			page.x = padding;
			page.y += page.rowHeight;
			page.rowHeight = 0;
		}
		if (page.y + cellHeight > page.size)
			return null;
		const result = { x: page.x, y: page.y };
		page.x += cellWidth;
		page.rowHeight = Math.max(page.rowHeight, cellHeight);
		return result;
	}

	#createPage(minimumSize)
	{
		const size = Math.min(2048, nextPowerOfTwo(Math.max(512, this.#fontSize * 2, minimumSize)));
		if (minimumSize > size)
			throw RangeError(`Glyph in font '${this.#fileName}' exceeds the browser texture limit.`);
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		this.#atlasPages.push({ canvas, context, texture: new Texture(size, size), size, x: 2, y: 2, rowHeight: 0 });
		return this.#atlasPages[this.#atlasPages.length - 1];
	}

	#renderLine(surface, x, y, text, color)
	{
		const verticesByPage = new Map();
		let cursorX = 0;
		let previousCodePoint = null;
		for (const character of String(text)) {
			if (character === '\t') {
				cursorX += this.#advanceFor(' ') * 3;
				previousCodePoint = null;
				continue;
			}
			const glyph = this.#getGlyph(character);
			if (previousCodePoint !== null && glyph.codePoint !== null)
				cursorX += this.#kerningAdjustment(previousCodePoint, glyph.codePoint);
			if (glyph.page >= 0) {
				const page = this.#atlasPages[glyph.page];
				const vertices = verticesByPage.get(glyph.page) ?? [];
				const x1 = x + cursorX - glyph.left;
				const x2 = x1 + glyph.width;
				const y1 = y + this.#lineAscent - glyph.ascent;
				const y2 = y1 + glyph.height;
				const u1 = glyph.x / page.size;
				const u2 = (glyph.x + glyph.width) / page.size;
				const v1 = 1 - glyph.y / page.size;
				const v2 = 1 - (glyph.y + glyph.height) / page.size;
				vertices.push(
					{ x: x1, y: y1, u: u1, v: v1, color },
					{ x: x2, y: y1, u: u2, v: v1, color },
					{ x: x1, y: y2, u: u1, v: v2, color },
					{ x: x2, y: y1, u: u2, v: v1, color },
					{ x: x1, y: y2, u: u1, v: v2, color },
					{ x: x2, y: y2, u: u2, v: v2, color },
				);
				verticesByPage.set(glyph.page, vertices);
			}
			cursorX += glyph.advance;
			previousCodePoint = glyph.codePoint;
		}
		for (const [pageIndex, vertices] of verticesByPage)
			Shape.drawImmediate(surface, ShapeType.Triangles, this.#atlasPages[pageIndex].texture, vertices);
	}
}

function nextPowerOfTwo(value)
{
	return 2 ** Math.ceil(Math.log2(Math.max(1, value)));
}

function toCP1252(codepoint)
{
	return codepoint == 0x20AC ? 128
		: codepoint == 0x201A ? 130
		: codepoint == 0x0192 ? 131
		: codepoint == 0x201E ? 132
		: codepoint == 0x2026 ? 133
		: codepoint == 0x2020 ? 134
		: codepoint == 0x2021 ? 135
		: codepoint == 0x02C6 ? 136
		: codepoint == 0x2030 ? 137
		: codepoint == 0x0160 ? 138
		: codepoint == 0x2039 ? 139
		: codepoint == 0x0152 ? 140
		: codepoint == 0x017D ? 142
		: codepoint == 0x2018 ? 145
		: codepoint == 0x2019 ? 146
		: codepoint == 0x201C ? 147
		: codepoint == 0x201D ? 148
		: codepoint == 0x2022 ? 149
		: codepoint == 0x2013 ? 150
		: codepoint == 0x2014 ? 151
		: codepoint == 0x02DC ? 152
		: codepoint == 0x2122 ? 153
		: codepoint == 0x0161 ? 154
		: codepoint == 0x203A ? 155
		: codepoint == 0x0153 ? 156
		: codepoint == 0x017E ? 158
		: codepoint == 0x0178 ? 159
		: codepoint;
}
