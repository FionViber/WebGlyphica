import { Node, Yoga, Text, Easing } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'

export class LevelUpPrompt extends Node
{
	constructor()
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setHeight("50%")
			.setPosition(Yoga.EDGE_TOP, "32%")
		
		this.levelUpText = new Text()
			.setFont(titleFontUI())
			.setColor(midGray)
			.setText(localize("level_up").toUpperCase())
			.setWidth(titleFontUI().widthOf(localize("level_up").toUpperCase()))
			.setTextAlign(textAlign.center)
			.setChildOf(this)
		
		this.pressButtonGroup = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setHeight(scalePix(50))
			.setChildOf(this)

		this.pressText = new Text()
			.setFont(regularFontUI())
			.setColor(midGray)
			.setText(localize("press_text"))
			.setWidth(regularFontUI().widthOf(localize("press_text")))
			.setMargin(Yoga.EDGE_RIGHT, scalePix(10))
			.setChildOf(this.pressButtonGroup)
		
		this.rightStickButton = new Text()
			.setFont(quicktimeFont)
			.setColor(midGray)
			.setText(getQuickTimeString([stick_down_right]))
			.setWidth(quicktimeFont.widthOf(getQuickTimeString([stick_down_right])))
			.setChildOf(this.pressButtonGroup)
		
		this.spaceButton = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setWidth(typingFont.widthOf(levelUpKey) + scalePix(30))
			.setHeight(scalePix(40))
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this.pressButtonGroup)

		this.spaceButtonText = new Text()
			.setColor(paleYellow)
			.setFont(typingFont)
			.setTextAlign(textAlign.center)
			.setWidth("100%")
			.setHeight(typingFont.height)
			.setText(levelUpKey)
			.setChildOf(this.spaceButton)

		this.tween = new FastTween(Easing.Linear)
		return this
	}

	updateLevelUpCount()
	{
		let text = localize("level_up").toUpperCase()
			+ (levelUpCount > 1 ? " x" + levelUpCount : "")
		this.levelUpText
			.setWidth(titleFontUI().widthOf(text))
			.setText(text)
	}

	init()
	{
		this.show()
		this.pressText.setColor(midGray)
		if (usingController)
		{
			this.rightStickButton.setText(getQuickTimeString([stick_down_right]))
			this.rightStickButton.setWidth(quicktimeFont.widthOf(getQuickTimeString([stick_down_right])))
			this.rightStickButton.setColor(midGray)
			this.rightStickButton.show()
			this.spaceButton.hide()
		}
		else
		{
			this.spaceButton.setTexture(midGray)
			this.spaceButtonText.setColor(paleYellow)
			this.spaceButton.show()
			this.rightStickButton.hide()
		}
		this.blink()
	}

	blink()
	{
		this.setAnimating(true)
		this.tween.easeIn([1], [0], (t) => { this.changeOpacity(t[0]) }, 30)
			.then(() => {
				this.tween.easeIn([0], [1], (t) => { this.changeOpacity(t[0]) }, 30)
					.then(() => {
						this.setAnimating(false)
						if (!this.hidden)
							this.blink()
					})
			})
	}

	changeOpacity(opacity)
	{
		this.pressText.setColor(midGray.fadeTo(opacity))
		this.rightStickButton.setColor(midGray.fadeTo(opacity))
		this.spaceButton.setTexture(midGray.fadeTo(opacity))
		this.spaceButtonText.setColor(paleYellow.fadeTo(opacity))
	}
}