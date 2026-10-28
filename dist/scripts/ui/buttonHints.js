import { Node, Text, Yoga } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { Damage } from '../effects/damage.js'

export class ButtonHints extends Node
{
	constructor()
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setPosition(Yoga.EDGE_BOTTOM, "-1%")
			.setHeight("8%")
			.setWidth("100%")

		this.bg = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setHeight("100%")
			.setPadding(Yoga.EDGE_BOTTOM, ".5%")
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setChildOf(this)
		
		this.F1Group = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(paleYellow)
			.setHeight(scalePix(40))
			.setWidth(regularFontUI().widthOf("Tab") + scalePix(30))
			.setMargin(Yoga.EDGE_RIGHT, scalePix(10))
			.setMargin(Yoga.EDGE_LEFT, scalePix(30))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.bg)

		this.F1 = new Text()
			.setFont(typingFont)
			.setColor(midGray)
			.setTextAlign(textAlign.center)
			.setText("Tab")
			.setTextAlign(textAlign.center)
			.setWidth(regularFontUI().widthOf("Tab"))
			.setChildOf(this.F1Group)
		
		this.controllerY = new Text()
			.setFont(quicktimeFont)
			.setColor(paleYellow)
			.setTextAlign(textAlign.center)
			.setText(getQuickTimeString([button_top]))
			.setTextAlign(textAlign.center)
			.setMargin(Yoga.EDGE_RIGHT, scalePix(10))
			.setMargin(Yoga.EDGE_LEFT, scalePix(30))
			.setWidth(quicktimeFont.widthOf(getQuickTimeString([button_top])))
			.setHeight(scalePix(40))
			.setChildOf(this.bg)
		
		this.currentWeaponsText = new Text()
			.setFont(regularFontUI())
			.setColor(paleYellow)
			.setTextAlign(textAlign.center)
			.setText(localize("run_information"))
			.setMargin(Yoga.EDGE_RIGHT, scalePix(30))
			.setWidth(regularFontUI().widthOf(localize("run_information")))
			.setChildOf(this.bg)
		
		this.spaceGroup = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(paleYellow)
			.setHeight(scalePix(40))
			.setWidth(regularFontUI().widthOf(levelUpKey) + scalePix(30))
			.setMargin(Yoga.EDGE_RIGHT, scalePix(10))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.bg)
		
		this.space = new Text()
			.setFont(typingFont)
			.setColor(midGray)
			.setTextAlign(textAlign.center)
			.setText(levelUpKey)
			.setTextAlign(textAlign.center)
			.setWidth(regularFontUI().widthOf(levelUpKey))
			.setChildOf(this.spaceGroup)
		
		this.controllerRS = new Text()
			.setFont(quicktimeFont)
			.setColor(paleYellow)
			.setTextAlign(textAlign.center)
			.setText(getQuickTimeString([stick_down_right]))
			.setTextAlign(textAlign.center)
			.setMargin(Yoga.EDGE_RIGHT, scalePix(10))
			.setWidth(quicktimeFont.widthOf(getQuickTimeString([stick_down_right])))
			.setHeight(scalePix(40))
			.setChildOf(this.bg)
		
		this.rerollCountGroup = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(darkGray)
			.setHeight(scalePix(40))
			.setWidth(scalePix(50))
			.setMargin(Yoga.EDGE_RIGHT, scalePix(5))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.bg)
		
		this.rerollCount = new Text()
			.setFont(typingFont)
			.setColor(paleYellow)
			.setTextAlign(textAlign.center)
			.setText("99")
			.setTextAlign(textAlign.center)
			.setWidth(regularFontUI().widthOf("99"))
			.setChildOf(this.rerollCountGroup)
		
		this.rerollText = new Text()
			.setFont(regularFontUI())
			.setColor(paleYellow)
			.setTextAlign(textAlign.center)
			.setText(localize("reroll"))
			.setMargin(Yoga.EDGE_RIGHT, scalePix(30))
			.setWidth(regularFontUI().widthOf(localize("reroll")))
			.setChildOf(this.bg)
		
		this.closeImmediately = false
		this.ready = false
		this.tween = new FastTween()
		Sphere.sleep(1).then(() => this.animYOffset = this.getComputedHeight())
		return this
	}

	startIntro()
	{
		this.refresh()
		let promise = this.tween.easeOut([this.animYOffset], [0], t => this.animYOffset = t[0], 20)
		promise.then(() => this.ready = true)
		return promise
	}

	startExtro()
	{
		let promise = this.tween.easeOut([this.animYOffset], [this.getComputedHeight()], t => this.animYOffset = t[0], 20)
		promise.then(() => this.ready = false)
		return promise
	}

	refreshReRoll()
	{
		factory.spawn(
			Damage,
			this.bg.getComputedLeft() + this.rerollText.getComputedLeft(),
			this.getComputedTop() + this.rerollText.getComputedTop(),
			localize("powerup_reroll", "-1"),
			false, true, true
		)
		this.rerollCount.setText(reroll.toString())
	}

	refresh()
	{
		let hideReroll = ui.pauseMenu.active || !ui.summaryScreen.hidden
		if (usingController)
		{
			this.F1Group.hide()
			this.spaceGroup.hide()
			this.controllerY.show()
			this.controllerRS[hideReroll ? "hide" : "show"]()
		}
		else
		{
			this.F1Group.show()
			this.spaceGroup[hideReroll ? "hide" : "show"]()
			this.controllerY.hide()
			this.controllerRS.hide()
		}
		if (!hideReroll) this.rerollCount.setText(reroll.toString())
		this.rerollCountGroup[hideReroll ? "hide" : "show"]()
		this.rerollText[hideReroll ? "hide" : "show"]()
	}
}