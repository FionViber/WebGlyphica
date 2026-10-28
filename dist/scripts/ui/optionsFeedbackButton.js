import { Yoga, Text } from 'sphere-runtime'
import { Button } from '../core/button.js'

export class OptionsFeedbackButton extends Button
{
	constructor(navigationMenu)
	{
		super()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setWidth(300)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setMargin(Yoga.EDGE_LEFT, 10)
			.setMargin(Yoga.EDGE_TOP, 40)
			.setHeight(regularFontUI().height + 25)
		
		this.icon = new Text()
			.setFont(interfaceIcons)
			.setText("%")
			.setColor(paleYellow)
			.setMargin(Yoga.EDGE_RIGHT, 10)
			.setWidth(interfaceIcons.widthOf("%"))
			.setChildOf(this)
		
		this.text = new Text()
			.setText(localize("feedback_question"))
			.setColor(paleYellow)
			.setFont(regularFontUI())
			.setWidth(regularFontUI().widthOf(localize("feedback_question")))
			.setTextAlign(textAlign.center)
			.setChildOf(this)
		
		this.setLeftNext(navigationMenu.main_menu_buttons[2])
		return this
	}

	refresh() {}

	focusStart()
	{
		audioHandler.playAudioHookUI("main_menu_options_controller_hover")
		this.setTexture(secondColorDark)
	}

	focusEnd()
	{
		this.setTexture(midGray)
	}

	pressMouseLeftStart() { this.activate() }
	pressButtonBottomStart() { this.activate() }
	activate()
	{
		audioHandler.playAudioHookUI("main_menu_options_change_value")
		Sphere.openURL("https://docs.google.com/forms/d/e/1FAIpQLSfeCh23g5LbJPTFtLqHsCV2mCzMSSJiW-hW4h9Qcd45KKMZ_A/viewform?usp=sharing")
	}
}