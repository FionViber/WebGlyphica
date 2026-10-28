import { Yoga, Text, Prim } from 'sphere-runtime'

export class TwoToneText extends Text
{
	constructor(parent)
	{
		super()
		this.color2
		this.parent = parent
		return this
	}

	setIndex(index)
	{
		let partialMatch = index % 1
		this.switchIndex = Math.floor(index > this.multiLine[0].length ? this.multiLine[0].length : index)
		this.matchedString = this.multiLine[0].slice(0, this.switchIndex)
		this.unmatchedString = this.multiLine[0].slice(this.switchIndex + (partialMatch > 0))
		this.matchedStringWidth = this.font.widthOf(this.matchedString)
		this.partialMatchWidth = partialMatch > 0 ? this.font.widthOf(this.multiLine[0][this.switchIndex]) * partialMatch : 0
		this.partialUnmatchedWidth = partialMatch > 0 ? this.font.widthOf(this.multiLine[0][this.switchIndex]) - this.partialMatchWidth : 0
	}

	setColor2(color)
	{
		this.color2 = color
		return this
	}

	renderText(surface, xOffset, yOffset)
	{
		// If layout has changed, recalculate text formatting.
		if (this.getComputedWidth() != this.cachedWidth)
			this.updateText(this.text)
		
		// Render text.
		let top = Math.round(yOffset + this.getComputedTop() + this.getComputedPadding(Yoga.EDGE_TOP))
		let left = Math.round(xOffset + this.getComputedLeft() + this.getComputedPadding(Yoga.EDGE_LEFT))
		switch (this.textAlign)
		{
			case textAlign.right:
				left = Math.round(xOffset + this.getComputedRight() - this.getComputedPadding(Yoga.EDGE_RIGHT)) - this.font.widthOf(this.multiLine[0])
				break

			case textAlign.center:
				let width = this.getComputedWidth()
				width -= this.getComputedPadding(Yoga.EDGE_LEFT)
				width -= this.getComputedPadding(Yoga.EDGE_RIGHT)
				left = Math.round(left + (width - this.font.widthOf(this.multiLine[0])) / 2)
				break
		}
		this.font.drawText(surface, left, top, this.matchedString, this.color)
		this.font.drawText(surface, left + this.matchedStringWidth + this.partialMatchWidth + this.partialUnmatchedWidth, top, this.unmatchedString, this.color2)
		if (this.partialMatchWidth > 0 && this.parent.wordSurface)
		{
			Prim.blitSection(
				Surface.Screen,
				left + this.matchedStringWidth,
				top,
				this.parent.wordSurface,
				this.matchedStringWidth,
				0,
				this.partialMatchWidth,
				this.font.height,
				this.color
			)
			Prim.blitSection(
				Surface.Screen,
				left + this.matchedStringWidth + this.partialMatchWidth,
				top,
				this.parent.wordSurface,
				this.matchedStringWidth + this.partialMatchWidth,
				0,
				this.partialUnmatchedWidth,
				this.font.height,
				this.color2
			)
		}
	}
}