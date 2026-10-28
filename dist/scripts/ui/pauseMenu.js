import { Node, Yoga, Text, Easing, Tween } from 'sphere-runtime'
import { Button } from '../core/button.js'

export class PauseMenu extends Node
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
		
		this.panel = new PauseMenuPanel(this)
			.setChildOf(this)

		this.tween = new Tween(this, Easing.Linear)
		this.opacity = 0
		this.active = false

		return this
	}

	startIntro()
	{
		this.setAnimating(true)
		this.active = true
		control.suspend(true)
		inUpgradeMenu = true
		pause("pauseMenu")
		this.panel.animYOffset = this.getComputedHeight() - this.panel.getComputedTop()
		this.show()
		let bgPromise = this.tween.easeIn({opacity: 1}, 40)
		bgPromise.then(() => this.setAnimating(false))
		Promise.all([
			bgPromise,
			new Promise(resolve => Sphere.sleep(10).then(() => ui.setHUDState("menu").then(() => resolve()))),
			new Promise(resolve => Sphere.sleep(20).then(() => this.panel.startIntro().then(() => resolve())))
		]).then(() => {
			control.suspend(false)
			this.panel.pauseMenuButtons[0].takeFocus()
		})
	}

	startExtro(surrender = false)
	{
		this.setAnimating(true)
		this.active = false
		control.suspend(true)
		ui.setHUDState(!ui.upgradeScreen.hidden || !ui.lootScreen.hidden || !ui.evolutionComplete.hidden ? "menu" : "game")
		if (currentFocus) currentFocus.focusEnd()
		currentFocus = null
		this.panel.startExtro()
		Sphere.sleep(10).then(() => {
			this.tween.easeIn({opacity: 0}, 40)
				.then(() => {
					this.setAnimating(false)
					this.hide()
					control.suspend(false)
					unpause("pauseMenu")
					if (
						ui.upgradeScreen.hidden &&
						ui.lootScreen.hidden &&
						ui.evolutionComplete.hidden
					)
						inUpgradeMenu = false
					if (surrender)
						endGame()
				})
		})
	}

	keyboardEnter()
	{
		if (!this.hidden && !this.animating && ui.weaponDetail.hidden)
		{
			keyboardArrows = true
			if (!currentFocus)
				this.panel.pauseMenuButtons[0].takeFocus()
			else
				currentFocus.activate()
		}
	}

	keyboardArrows(key)
	{
		if (!this.hidden && !this.animating && ui.weaponDetail.hidden)
		{
			keyboardArrows = true
			if (!currentFocus)
				this.panel.pauseMenuButtons[0].takeFocus()
			else
				switch(key)
				{
					case Key.Up: currentFocus.selectTop(); break
					case Key.Down: currentFocus.selectBottom(); break
				}
		}
	}

	update()
	{
		if (this.animating)
			this.setTexture(bgColor.fadeTo(this.opacity))
	}
}

class PauseMenuPanel extends Node
{
	constructor(parent)
	{
		super()
			.setRenderMode(renderMode.color)
			.setTexture(paleYellow)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("30%")
			.setHeight("55%")
		
		this.title = new Text()
			.setFont(titleFontUI())
			.setColor(midGray)
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setText(localize("pause_menu_title"))
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(40))
			.setChildOf(this)

		this.pauseMenuButtons = []
		this.pauseMenuButtons.push(new ResumeButton(parent))
		this.pauseMenuButtons.push(new WeaponDetailsButton())
		this.pauseMenuButtons.push(new ReturnToMainMenuButton(parent))

		this.pauseMenuButtons.forEach((v, i) => {
			v.setChildOf(this)
			if (i < this.pauseMenuButtons.length - 1) v.setBottomNext(this.pauseMenuButtons[i + 1])
			if (i > 0) v.setTopNext(this.pauseMenuButtons[i - 1])
		})
		
		this.tween = new Tween(this, Easing.Exponential)
		return this
	}

	startIntro()
	{
		this.setAnimating(true)
		audioHandler.playAudioHookUI("pause_menu_intro")
		let promise = this.tween.easeOut({animYOffset: 0}, 20)
		promise.then(() => this.setAnimating(false))
		return promise
	}

	startExtro()
	{
		this.setAnimating(true)
		audioHandler.playAudioHookUI("pause_menu_extro")
		this.tween.easeIn({animYOffset: -(this.getComputedTop() + this.getComputedHeight())}, 20)
			.then(() => this.setAnimating(false))
	}
}

class PauseMenuButton extends Button
{
	constructor(text)
	{
		super()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setWidth('75%')
			.setMargin(Yoga.EDGE_TOP, scalePix(5))
			.setHeight(regularFontUI().height + scalePix(25))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		this.text = new Text()
			.setWidth('100%')
			.setTextAlign(textAlign.center)
			.setFont(regularFontUI())
			.setColor(paleYellow)
			.setText(text)
			.setChildOf(this)
		
		return this
	}

	focusStart()
	{
		if (ui.weaponDetail.hidden)
		{
			audioHandler.playAudioHookUI("pause_menu_button_hover")
			this.setTexture(secondColorDark)
		}
	}

	focusEnd()
	{
		this.setTexture(midGray)
	}

	pressMouseLeftStart() { if (ui.weaponDetail.hidden) this.activate() }
	pressButtonBottomStart() { if (ui.weaponDetail.hidden) this.activate() }
	activate() {}
}

class ResumeButton extends PauseMenuButton
{
	constructor(parent)
	{
		super(localize("resume_game"))
		this.parent = parent
	}

	activate()
	{
		audioHandler.playAudioHookUI("pause_menu_button_click")
		this.parent.startExtro()
	}
}

class WeaponDetailsButton extends PauseMenuButton
{
	constructor()
	{
		super(localize("run_information"))
	}

	activate()
	{
		audioHandler.playAudioHookUI("pause_menu_button_click")
		control.triggerWeaponDetailTab()
	}
}

class ReturnToMainMenuButton extends PauseMenuButton
{
	constructor(parent)
	{
		super(localize("surrender_text"))
		this.parent = parent
	}

	activate()
	{
		audioHandler.playAudioHookUI("pause_menu_button_click")
		if (!ui.levelUpPrompt.hidden)
			ui.levelUpPrompt.hide()
		if (!ui.hud.bottom.evolutionPopUp.hidden)
			ui.hud.bottom.evolutionPopUp.hide()
		if (!ui.upgradeScreen.hidden)
			ui.upgradeScreen.startExtro(true)
		else if (!ui.lootScreen.hidden)
			ui.lootScreen.startExtro(true)
		else if (!ui.evolutionComplete.hidden)
			ui.evolutionComplete.startExtro(true)
		this.parent.startExtro(true)
	}
}