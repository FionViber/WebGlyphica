import { Yoga, Text, Tween, Easing } from 'sphere-runtime'
import { Button } from "../core/button.js"

// Abstract class for all title menu buttons.
export class MainMenuButton extends Button
{
	constructor()
	{
		super()
			.setRenderMode(renderMode.color)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setWidth("100%")
			.setHeight("9%")
		
		this.quitGame = false
		this.opacity = 0
		this.animation = new Tween(this, Easing.Cubic)
		this.buttonText = new Text()
			.setText("Lorem Ipsum")
			.setFont(titleFontUI())
			.setColor(darkGray)
			.setTextAlign(textAlign.center)
			.setWidth("100%")
			.setHeight(titleFontUI().height)
			.setChildOf(this)
		
		return this
	}

	focusStart()
	{
		if (!inConfirmPopUp)
		{
			audioHandler.playAudioHookUI("main_menu_navigation_hover")
			if (usingController || keyboardArrows)
				this.getParent().changeContext(this)
			this.buttonText.setColor(paleYellow)
			this.setTexture(secondColorDark)
		}
		else if (!ui.omenSelect.hidden)
			ui.omenSelect.panel.cancelButton.takeFocus()
		else ui.confirmPopUp.panel.cancelButton.takeFocus()
	}

	focusEnd()
	{
		if (this.getParent().currentContext != this)
		{
			this.buttonText.setColor(darkGray)
			this.setTexture(null)
		}
		else
		{
			this.buttonText.setColor(paleYellow)
			this.setTexture(midGray)
		}
	}

	pressMouseLeftStart() { this.interact() }
	pressButtonBottomStart() { this.interact() }
	interact()
	{
		if (!inConfirmPopUp)
		{
			audioHandler.playAudioHookUI("main_menu_navigation_click")
			if (this.quitGame)
			{
				ui.confirmPopUp.trigger("really_shut_down", () => Sphere.shutDown())
				return
			}
			if (!usingController && !keyboardArrows)
				this.getParent().changeContext(this)
		}
	}

	pressShoulderButtonLeftStart() { this.getParent().menuButtonShoulder(this, shoulder_button_left) }
	pressShoulderButtonRightStart() { this.getParent().menuButtonShoulder(this, shoulder_button_right) }

	setOpacity(opacity)
	{
		this.opacity = opacity
		this.buttonText.setColor(darkGray.fadeTo(opacity))
	}

	prepareForExtro()
	{
		this.buttonText.setColor(darkGray)
		this.setTexture(null)
	}

	startIntro(delay = 0)
	{
		this.animXOffset = -(this.getParent().getComputedLeft() + this.getComputedLeft() + this.getComputedWidth())
		return new Promise(resolve => {
			Sphere.sleep(delay)
			.then(() => {
				this.animation.easeOut({animXOffset: 0, opacity: 1}, 40)
					.then(() => {
						resolve()
					})
			})
		})
	}

	startExtro(delay = 0)
	{
		return new Promise(resolve => {
			Sphere.sleep(delay)
			.then(() => {
				this.animation.easeIn({animXOffset: -(this.getParent().getComputedLeft() + this.getComputedLeft() + this.getComputedWidth()), opacity: 0}, 40)
					.then(() => {
						resolve()
					})
			})
		})
	}

	setText(text)
	{
		this.buttonText.setText(localize(text))
		if (text == "quit_game")
			this.quitGame = true
		return this
	}

	update()
	{
		super.update()
		if (this.animating)
			this.buttonText.setColor(darkGray.fadeTo(this.opacity))
	}
}