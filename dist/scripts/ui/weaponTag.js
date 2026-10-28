import { Node, Yoga, Text }  from 'sphere-runtime'

export class WeaponTag extends Node
{
	constructor(tagName)
	{
		super()
			.setHeight(smallFont().height + scalePix(6))
			.setRenderMode(renderMode.colorRounded)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setMargin(Yoga.EDGE_ALL, scalePix(3))
			.setTexture(midGray)
		
		let text = localize(tagName)
		this.tagText = new Text()
			.setColor(paleYellow)
			.setFont(smallFont())
			.setText(text)
			.setWidth("100%")
			.setHeight(smallFont().height)
			.setTextAlign(textAlign.center)
			.setChildOf(this)
		
		this.setWidth(smallFont().widthOf(text) + scalePix(25))

		return this
	}

	setOpacity(opacity)
	{
		this.setTexture(midGray.fadeTo(opacity))
		this.tagText.setColor(paleYellow.fadeTo(opacity))
	}
}