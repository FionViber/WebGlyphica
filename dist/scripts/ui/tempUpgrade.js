import { Node, Text, Yoga } from 'sphere-runtime'

export class TempUpgrade extends Node
{
	constructor(uiContainer)
	{
		// Superclass constructor
		super()
			.setMargin(Yoga.EDGE_TOP, scalePix(15))
			.setPadding(Yoga.EDGE_BOTTOM, scalePix(20))
			.setWidth(scalePix(250))
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE)
			.setChildOf(uiContainer)
		
		// Subtitle.
		this.subText = new Text()
			.setFont(smallFont())
			.setColor(midGray.fadeTo(.5))
			.setText("+1% Crit Chance")
			.setMargin(Yoga.EDGE_TOP, scalePix(5))
			.setTextAlign(textAlign.center)
			.setChildOf(this)
		
		// Effect desc.
		this.effect = new Text()
			.setFont(regularFontUI())
			.setColor(midGray)
			.setText("Double Damage")
			.setTextAlign(textAlign.center)
			.setChildOf(this)
		
		// Define vars.
		this.progressWidth = 100
		this.currentProgress = 0
		this.maxProgress = 100

		// Return reference to this node.
		return this
	}

	setText(effect, subText = null)
	{
		this.effect.setText(effect)
		if (subText)
		{
			this.subText.setText(subText)
			this.subText.show()
		}
		else this.subText.hide()
	}

	render(surface, xOffset = 0, yOffset = 0)
	{
		super.render(surface, xOffset, yOffset)
		if (!this.hidden && this.currentProgress != Infinity)
		{
			let y = yOffset + this.getComputedTop() + this.getComputedHeight() - 5
			let x = this.getComputedLeft() + xOffset + this.getComputedWidth() / 2
			drawProgress(x, y, this.progressWidth, 5, this.currentProgress / this.maxProgress)
		}
	}
}