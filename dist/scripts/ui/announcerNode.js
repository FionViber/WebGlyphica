import { Node, Yoga, Text } from 'sphere-runtime'

export class AnnouncerNode extends Node
{
	constructor()
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setWidth("100%")
			.setHeight("100%")
			.setRenderMode(renderMode.color)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setTexture(bgColor)

		this.subtitle = new Text()
			.setFont(regularFontUI())
			.setWidth("100%")
			.setMargin(Yoga.EDGE_TOP, Surface.Screen.height * .3 - regularFontUI().height - scalePix(5))
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(5))
			.setTextAlign(textAlign.center)
			.setChildOf(this)
		
		this.title = new Text()
			.setFont(titleFontUI())
			.setMargin(Yoga.EDGE_BOTTOM, "8%")
			.setChildOf(this)
		
		this.instructionsBox = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(bgColorOpaque)
			.setWidth("40%")
			.setHeight("27%")
			.setPadding(Yoga.EDGE_ALL, scalePix(30))
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this)

		this.infoIcon = new Text()
			.setFont(interfaceIconsMedium)
			.setWidth("100%")
			.setText("<")
			.setTextAlign(textAlign.center)
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(20))
			.setColor(paleYellow.fadeTo(.3))
			.setChildOf(this.instructionsBox)
		
		this.instructions = new Text()
			.setFont(regularFontUI())
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setColor(paleYellow)
			.setChildOf(this.instructionsBox)
		
		this.pressAnyButtonToContinue = new Text()
			.setFont(regularFontUI())
			.setWidth("100%")
			.setText(localize("press_any_button"))
			.setTextAlign(textAlign.center)
			.setMargin(Yoga.EDGE_TOP, scalePix(30))
			.setColor(paleYellow.fadeTo(.3))
			.setChildOf(this.instructionsBox)
	}
}