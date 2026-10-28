import { Yoga, Node } from 'sphere-runtime'
import { HUDBottom } from './hudBottom.js'
import { HUDTop } from './hudTop.js'

export class Hud extends Node
{
	constructor()
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setWidth("100%")
			.setHeight("100%")
			.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setAlignItems(Yoga.ALIGN_CENTER)

		this.top = new HUDTop()
			.setChildOf(this)
		
		this.middle = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_TOP, Surface.Screen.height * .6)
			.setHeight("33%")
			.setFlexWrap(Yoga.FLEX_FLEX)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this)

		this.bottom = new HUDBottom()
			.setChildOf(this)
	}
}