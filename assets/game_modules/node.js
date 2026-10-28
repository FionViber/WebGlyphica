import { Yoga } from 'yoga'

// Enums
globalThis.renderMode = {
	colorRounded: 0,
	color: 1,
	tiled: 2,
	stretch: 3,
	ninePatch: 4
}
globalThis.textAlign = {
	left: 0,
	right: 1,
	center: 2
}

// Some shared functionality between layout nodes.
class NodeAbstract extends Yoga.Node
{
    constructor()
    {
        super()
        this.hidden = false
		this.redirectFocus = null
		this.xOffset = 0
		this.yOffset = 0
		this.animXOffset = 0
		this.animYOffset = 0
		this.animating = false
		this.originalPositionType = Yoga.POSITION_TYPE_ABSOLUTE

        // Redefine setters for builder pattern.
		for (const property of Object.getOwnPropertyNames(Yoga.Node.prototype))
        if (property.includes("set"))
            this[property] = function(...args)
            {
                Yoga.Node.prototype[property].call(this, ...args)
                return this
            }
    }

	setChildOf(parent)
	{
		parent.insertChild(this, parent.getChildCount())
		return this
	}

	detach()
	{
		if (this.getParent())
			this.getParent().removeChild(this)
	}

	takeFocus()
	{
		if (this.redirectFocus)
			this.redirectFocus.takeFocus()
	}

	setAnimating(animating)
	{
		this.animating = animating
		for (let i = 0; i < this.getChildCount(); i++)
			this.getChild(i).setAnimating(animating)
	}

    checkIfDirtied() {
		if (this.isDirty()) {
			return true
		} else {
			for (let i = 0; i < this.getChildCount(); i++) {
				if (this.getChild(i).checkIfDirtied()) {
					return true
				}
			}
			return false
		}
	}

	isHidden()
	{
		let result = this.hidden
		if (!result)
		{
			let parent = this.getParent()
			if (parent && parent.isHidden)
				result = parent.isHidden()
		}
		return result
	}

	hide()
	{
		if (!this.hidden)
		{
			this.originalPositionType = this.getPositionType()
			if (this.originalPositionType !=Yoga.POSITION_TYPE_ABSOLUTE )
				this.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			this.hidden = true
		}
		return this
	}

	show()
	{
		if (this.hidden)
		{
			if (this.originalPositionType != Yoga.POSITION_TYPE_ABSOLUTE)
				this.setPositionType(this.originalPositionType)
			this.hidden = false
		}
		return this
	}

    renderChildren(surface, xOffset, yOffset)
	{
		this.xOffset = xOffset
		this.yOffset = yOffset
		for (let i = 0; i < this.getChildCount(); i++)
			this.getChild(i).render(surface, xOffset + this.getComputedLeft() + this.animXOffset, yOffset + this.getComputedTop() + this.animYOffset)
	}

	updateChildren()
	{
		for (let i = 0; i < this.getChildCount(); i++)
		{
			let child = this.getChild(i)
			if (!child.hidden)
			{
				child.update()
				child.updateChildren()
			}
		}
	}

	update() {}
}

export class Node extends NodeAbstract
{
	constructor()
	{
		super()
		this.texture = null
		this.shape = Array(9).fill(null)
		this.transform = Array(9).fill(new Transform())
		this.renderMode = "stretch"
		return this
	}

	setTexture(texture)
	{
		this.texture = texture
		this.shape.fill(null)
		return this
	}

	setRenderMode(renderMode)
	{
		this.renderMode = renderMode
		return this
	}	

	render(surface, xOffset = 0, yOffset = 0)
	{
		if (!this.hidden)
		{
			this.renderTexture(surface, xOffset + this.animXOffset, yOffset + this.animYOffset)
			this.renderChildren(surface, xOffset, yOffset)
		}
	}

	renderTexture(surface, xOffset, yOffset)
	{
		if (this.texture != null)
		{
			let x = xOffset + this.getComputedLeft()
			let y = yOffset + this.getComputedTop()
			switch (this.renderMode)
			{
				case renderMode.colorRounded:
					PrimNative.drawFilledRoundedRectangle(
						surface,
						x,
						y,
						x + this.getComputedWidth(),
						y + this.getComputedHeight(),
						.005 * Surface.Screen.height,
						.005 * Surface.Screen.height,
						this.texture
					)
					break;

				case renderMode.color:
					PrimNative.drawFilledRectangle(
						surface,
						x,
						y,
						x + this.getComputedWidth(),
						y + this.getComputedHeight(),
						this.texture
					)
					break;

				case renderMode.tiled:
					// TODO: Tiled.
					break
				
				case renderMode.stretch:
					if (this.shape[0] == null)
						this.shape[0] = this.textureShape(this.texture, false)
					this.transform[0].identity()
					this.transform[0].scale(this.getComputedWidth() / this.texture.width, this.getComputedHeight() / this.texture.height)
					this.transform[0].translate(x, y)
					this.shape[0].draw(surface, this.transform[0])
					break
				
				case renderMode.ninePatch:
					let hor = this.texture.width / 3
					let ver = this.texture.height / 3
					let horStretch = (this.getComputedWidth() - hor * 2) / hor
					let verStretch = (this.getComputedHeight() - ver * 2) / ver

					if (horStretch <= 0 || verStretch <= 0)
						break

					// Top-left.
					if (this.shape[0] == null)
						this.shape[0] = this.textureShape(this.texture, false, 0, 0, hor, ver)
					this.transform[0].identity()
					this.transform[0].translate(x, y)
					this.shape[0].draw(surface, this.transform[0])

					// Top-center.
					if (this.shape[1] == null)
						this.shape[1] = this.textureShape(this.texture, false, hor, 0, hor, ver)
					this.transform[1].identity()
					this.transform[1].scale(horStretch, 1.0)
					this.transform[1].translate(x + hor, y)
					this.shape[1].draw(surface, this.transform[1])

					// Top-right.
					if (this.shape[2] == null)
						this.shape[2] = this.textureShape(this.texture, false, hor * 2, 0, hor, ver)
					this.transform[2].identity()
					this.transform[2].translate(x + this.getComputedWidth() - hor, y)
					this.shape[2].draw(surface, this.transform[2])

					// Center-left.
					if (this.shape[3] == null)
						this.shape[3] = this.textureShape(this.texture, false, 0, ver, hor, ver)
					this.transform[3].identity()
					this.transform[3].scale(1, verStretch)
					this.transform[3].translate(x, y + ver)
					this.shape[3].draw(surface, this.transform[3])

					// Center-center.
					if (this.shape[4] == null)
						this.shape[4] = this.textureShape(this.texture, false, hor, ver, hor, ver)
					this.transform[4].identity()
					this.transform[4].scale(horStretch, verStretch)
					this.transform[4].translate(x + hor, y + ver)
					this.shape[4].draw(surface, this.transform[4])

					// Center-right.
					if (this.shape[5] == null)
						this.shape[5] = this.textureShape(this.texture, false, hor * 2, ver, hor, ver)
					this.transform[5].identity()
					this.transform[5].scale(1, verStretch)
					this.transform[5].translate(x + this.getComputedWidth() - hor, y + ver)
					this.shape[5].draw(surface, this.transform[5])

					// Bottom-left.
					if (this.shape[6] == null)
						this.shape[6] = this.textureShape(this.texture, false, 0, ver * 2, hor, ver)
					this.transform[6].identity()
					this.transform[6].translate(x, y + this.getComputedHeight() - ver)
					this.shape[6].draw(surface, this.transform[6])

					// Bottom-center.
					if (this.shape[7] == null)
						this.shape[7] = this.textureShape(this.texture, false, hor, ver * 2, hor, ver)
					this.transform[7].identity()
					this.transform[7].scale(horStretch, 1)
					this.transform[7].translate(x + hor, y + this.getComputedHeight() - ver)
					this.shape[7].draw(surface, this.transform[7])

					// Bottom-right.
					if (this.shape[8] == null)
						this.shape[8] = this.textureShape(this.texture, false, hor * 2, ver * 2, hor, ver)
					this.transform[8].identity()
					this.transform[8].translate(x + this.getComputedWidth() - hor, y + this.getComputedHeight() - ver)
					this.shape[8].draw(surface, this.transform[8])
					break
			}
		}
	}

	textureShape(texture, originAtCenter = true, sx = 0, sy = 0, sw = 0, sh = 0)
	{
		let tex = texture
		if (sw > 0 && sh > 0)
		{
			tex = new Surface(sw, sh)
			Prim.blitSection(tex, 0, 0, texture, sx, sy, sw, sh)
		}

		let left = originAtCenter ? -tex.width / 2 : 0
		let right = originAtCenter ? tex.width / 2  : tex.width
		let top = originAtCenter ? -tex.height / 2 : 0
		let bottom = originAtCenter ? tex.height / 2 : tex.height

		return new Shape(ShapeType.Fan, tex, new VertexList(
			[
				{x: left, y: top, u: 0, v: 1},
				{x: right, y: top, u: 1, v: 1},
				{x: right, y: bottom, u: 1, v: 0},
				{x: left, y: bottom, u: 0, v: 0}
			]
		))
	}
}

export class Text extends NodeAbstract
{
	constructor() {
		super()
        this.text = ""
		this.multiLine = []
		this.font = Font.Default
        this.textAlign = textAlign.left
        this.color = Color.White
        this.cachedWidth = 0
		this.isEastAsian = false
        return this
	}

    setText(text)
    {
        this.text = text
        this.updateText(this.text)
        return this
    }

	setEastAsian(bool)
	{
		this.isEastAsian = bool
		return this
	}

    setTextAlign(align)
    {
        this.textAlign = align
        return this
    }
	
	setFont(font)
    {
		this.font = font
		this.updateText(this.text)
        return this
	}

    setColor(color)
    {
        this.color = color
        return this
    }

    updateText(text) {

        // Update text.
        this.text = text

        // Updated cached width, so we know if layout has changed.
        this.cachedWidth = this.getComputedWidth()

        // Grab allowed width.
        let contentWidth = this.cachedWidth
        contentWidth -= this.getComputedPadding(Yoga.EDGE_LEFT)
        contentWidth -= this.getComputedPadding(Yoga.EDGE_RIGHT)

        // Break text up into array of lines limited by width.
		this.multiLine = this.isEastAsian ?
            this.eastAsianWordWrap(this.font, text, contentWidth) :
            this.font.wordWrap(text, contentWidth)

        // Calculate min height based on text and font.
        let contentHeight = this.font.height * this.multiLine.length
        contentHeight += this.getComputedPadding(Yoga.EDGE_TOP)
        contentHeight += this.getComputedPadding(Yoga.EDGE_BOTTOM)

		// Change min height if different from before.
		if (contentHeight != this.getMinHeight().value)
        	this.setMinHeight(contentHeight)
	}

	eastAsianWordWrap(font, text, width)
	{
		let isNumeric = (string) => /^[\.\d+\-%]$/.test(string)
		let isAsianPunctuation = (string) => /^[\u3000-\u303F]$/.test(string)
		let textArray = text.split("\n")
		let result = []
		let currentLength = 0
		let currentString = ""
		for (const line of textArray)
		{
			for (let i = 0; i < line.length; i++)
			{
				let char = line[i]

				// Check for non-breaking character patterns.
				if (isNumeric(char))
					while(i + 1 < line.length && isNumeric(line[i + 1]))
						char += line[++i]
				else if (i + 1 < line.length && isAsianPunctuation(line[i + 1]))
					char += line[++i]

				let charWidth = font.widthOf(char)
				if (currentLength + charWidth > width)
				{
					result.push(currentString)
					currentString = char
					currentLength = charWidth
				}
				else
				{
					currentString += char
					currentLength += charWidth
				}
			}
			result.push(currentString)
			currentLength = 0
			currentString = ""
		}
		return result
	}
	
	render(surface, xOffset = 0, yOffset = 0)
    {
        if (!this.hidden)
		{
			this.renderText(surface, xOffset + this.animXOffset, yOffset + this.animYOffset)
			this.renderChildren(surface, xOffset, yOffset)
		}
    }

    renderText(surface, xOffset, yOffset)
    {
        // If layout has changed, recalculate text formatting.
        if (this.getComputedWidth() != this.cachedWidth)
            this.updateText(this.text)
        
        // Render text.
        let top = yOffset + this.getComputedTop() + this.getComputedPadding(Yoga.EDGE_TOP)
        let left = xOffset + this.getComputedLeft() + this.getComputedPadding(Yoga.EDGE_LEFT)
		switch (this.textAlign)
        {
            case textAlign.left:
                for (let i = 0; i < this.multiLine.length; i++)
                    this.font.drawText (
                        surface,
                        Math.round(left),
                        Math.round(top + i * this.font.height),
                        this.multiLine[i],
                        this.color
                    )
                break
            
            case textAlign.right:
                let right = xOffset + this.getComputedLeft() + this.getComputedWidth() - this.getComputedPadding(Yoga.EDGE_RIGHT)
                for (let i = 0; i < this.multiLine.length; i++)
                {
                    let line = this.multiLine[i]
                    this.font.drawText (
                        surface,
                        Math.round(right - this.font.widthOf(line)),
                        Math.round(top + i * this.font.height),
                        line,
                        this.color
                    )
                }
                break
            
            case textAlign.center:
                let width = this.getComputedWidth()
                width -= this.getComputedPadding(Yoga.EDGE_LEFT)
                width -= this.getComputedPadding(Yoga.EDGE_RIGHT)
                for (let i = 0; i < this.multiLine.length; i++)
                {
                    let line = this.multiLine[i]
                    this.font.drawText (
                        surface,
                        Math.round(left + (width - this.font.widthOf(line)) / 2),
                        Math.round(top + i * this.font.height),
                        line,
                        this.color
                    )
                }
                break
        }
	}
}