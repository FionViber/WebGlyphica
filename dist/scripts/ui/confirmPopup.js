import { Node, Text, Yoga, Tween, Easing } from 'sphere-runtime'
import { Button } from '../core/button.js'

export class ConfirmPopUp extends Node
{
	constructor()
	{
		super()
			.setRenderMode(renderMode.color)
			.setTexture(bgColor.fadeTo(0))
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setHeight("100%")

		this.tween = new Tween(this, Easing.Linear)
		this.confirmAction = null
		this.lastFocus = null
		this.opacity = 0
		
		this.panel = new ConfirmPanel(this)
			.setChildOf(this)
		
		return this
	}

	trigger(message, confirmAction)
	{
		if (usingController || keyboardArrows)
		{
			this.lastFocus = currentFocus
			this.panel.confirmButton.takeFocus()
		}
		this.show()
		this.panel.message.setText(localize(message))
		this.confirmAction = confirmAction
		this.startIntro()
	}

	startIntro()
	{
		inConfirmPopUp = true
		if (!ui.main_menu.turrets.hidden)
			ui.disableAllTurretButtons()
		audioHandler.playAudioHookUI("main_menu_confirmation_popup_intro")
		this.setAnimating(true)
		control.suspend(true)
		this.tween.easeIn({opacity: 1}, 40)
			.then(() => this.setAnimating(false))
		this.panel.animYOffset = this.getComputedHeight() - this.panel.getComputedTop()
		Sphere.sleep(20).then(() => {
			this.panel.startIntro()
				.then(() => control.suspend(false))
		})
		this.show()
	}

	startExtro()
	{
		this.setAnimating(true)
		control.suspend(true)
		audioHandler.playAudioHookUI("main_menu_confirmation_popup_extro")
		this.panel.startExtro()
		Sphere.sleep(10).then(() => {
			this.tween.easeIn({opacity: 0}, 40)
				.then(() => {
					this.setAnimating(false)
					control.suspend(false)
					inConfirmPopUp = false
					if (usingController || keyboardArrows)
					{
						currentFocus.focusEnd()
						if (this.lastFocus)
						{
							this.lastFocus.takeFocus()
							this.lastFocus = null
						}
						else ui.main_menu.left.main_menu_buttons[4].takeFocus()
					}
					if (!ui.main_menu.turrets.hidden)
						ui.disableAllTurretButtons(false)
					this.hide()
				})
		})
	}

	update()
	{
		if (this.animating)
			this.setTexture(bgColor.fadeTo(this.opacity))
	}
}

class ConfirmPanel extends Node
{
	constructor(parent)
	{
		super()
			.setRenderMode(renderMode.color)
			.setTexture(paleYellow)
			.setWidth("40%")
			.setHeight("40%")
		
		this.messageGroup = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setHeight("70%")
			.setChildOf(this)
		
		this.message = new Text()
			.setFont(regularFontUI())
			.setColor(midGray)
			.setText("Message here.")
			.setWidth("80%")
			.setTextAlign(textAlign.center)
			.setChildOf(this.messageGroup)
		
		this.buttonGroup = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setHeight("30%")
			.setChildOf(this)
		
		this.confirmButton = new ConfirmButton(parent)
			.setChildOf(this.buttonGroup)
		
		this.cancelButton = new CancelButton(parent)
			.setChildOf(this.buttonGroup)

		this.confirmButton.setRightNext(this.cancelButton)
		this.cancelButton.setLeftNext(this.confirmButton)
		this.tween = new Tween(this, Easing.Exponential)
		return this
	}

	startIntro()
	{
		this.setAnimating(true)
		return new Promise((resolve) => {
			this.tween.easeOut({animYOffset: 0}, 20)
				.then(() => {
					this.setAnimating(false)
					resolve()
			})
		})
	}

	startExtro()
	{
		this.setAnimating(true)
		this.tween.easeIn({animYOffset: -(this.getComputedTop() + this.getComputedHeight())}, 20)
			.then(() => {
				this.setAnimating(false)
			})
	}
}

class ConfirmButton extends Button
{
	constructor(parent)
	{
		super()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setWidth("30%")
			.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(5))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setDefault()
			.setHeight(regularFontUI().height + scalePix(25))
		
		this.text = new Text()
			.setColor(paleYellow)
			.setFont(regularFontUI())
			.setText(localize("confirm_text"))
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setChildOf(this)

		this.parent = parent
		return this
	}

	focusStart()
	{
		audioHandler.playAudioHookUI("main_menu_confirmation_hover")
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
		audioHandler.playAudioHookUI("main_menu_confirmation_click")
		this.parent.confirmAction()
		this.parent.startExtro()
	}
}

class CancelButton extends Button
{
	constructor(parent)
	{
		super()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setWidth("30%")
			.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(5))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setDefault()
			.setHeight(regularFontUI().height + scalePix(25))
		
		this.text = new Text()
			.setColor(paleYellow)
			.setFont(regularFontUI())
			.setText(localize("cancel_text"))
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setChildOf(this)

		this.parent = parent
		return this
	}

	focusStart()
	{
		audioHandler.playAudioHookUI("main_menu_confirmation_hover")
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
		audioHandler.playAudioHookUI("main_menu_confirmation_click")
		this.parent.startExtro()
	}
}