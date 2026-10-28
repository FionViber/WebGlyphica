import { Node, Text, Yoga, Easing } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'

export class MainMenuLogo extends Node
{
	constructor()
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setWidth("100%")
			.setHeight("100%")
			.setMargin(Yoga.EDGE_LEFT, scalePix(80))
		
		this.bottomLayer = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setHeight("100%")
			.setWidth("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this)
		
		this.bottomLayerText = new Text()
			.setWidth("100%")
			.setHeight(interfaceIconsExtraLarge.height)
			.setFont(interfaceIconsExtraLarge)
			.setTextAlign(textAlign.center)
			.setText(currentUILanguage == "schinese" ? ">" : "-")
			.setColor(midGray.fadeTo(0))
			.setChildOf(this.bottomLayer)

		this.topLayer = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setHeight("100%")
			.setWidth("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this)
		
		this.topLayerText = new Text()
			.setWidth("100%")
			.setHeight(interfaceIconsExtraLarge.height)
			.setFont(interfaceIconsExtraLarge)
			.setTextAlign(textAlign.center)
			.setText(".")
			.setColor(secondColor.fadeTo(0))
			.setChildOf(this.topLayer)
		
		this.tween = new FastTween(Easing.Linear)
		return this
	}

	skipIntro()
	{
		this.bottomLayerText.setColor(midGray.fadeTo(0))
		this.topLayerText.setColor(secondColor.fadeTo(0))
	}

	startIntro()
	{
		this.skipIntro()
		this.show()
		this.setAnimating(true)
		this.tween.easeIn([0], [1], t => {
			this.bottomLayerText.setColor(midGray.fadeTo(t[0]))
			this.topLayerText.setColor(secondColor.fadeTo(t[0]))
		}, 40)
			.then(() => this.setAnimating(false))
	}
}