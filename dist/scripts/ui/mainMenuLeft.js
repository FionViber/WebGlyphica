import { Node, Yoga, Tween, Easing } from 'sphere-runtime'
import { MainMenuButton } from './mainMenuButtons.js'
import { WishlistButton } from './wishlistButton.js'
import { DiscordButton } from './discordButton.js'
import { WikiButton } from './wikiButton.js'

export class MainMenuLeft extends Node
{
	constructor()
	{
		// Superclass constructor.
		super()
			.setRenderMode(renderMode.color)
			.setWidth("20%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		// Build title menu buttons.
		this.main_menu_buttons = []
		for (let i = 0; i < 5; i++)
		{
			let text = ""
			switch (i)
			{
				case 0: text = "new_game"; break
				case 1: text = "augmentations"; break
				case 2: text = "options"; break
				case 3: text = "credits"; break
				case 4: text = "quit_game"; break
			}
			this.main_menu_buttons.push(
				new MainMenuButton()
					.setText(text)
					.setChildOf(this)
			)
		}

		// Push wishlist button if demo and steam build.
		if (demo) 
			this.main_menu_buttons.push(
				new WishlistButton()
					.setChildOf(this)
			)
		
		// Wiki button.
		this.main_menu_buttons.push(
			new WikiButton()
				.setChildOf(this)
		)
		
		// Discord button.
		this.main_menu_buttons.push(
			new DiscordButton()
				.setChildOf(this)
		)

		// Set controller focus changes.
		this.main_menu_buttons[0].setDefault()
		for (let i = 1; i < this.main_menu_buttons.length; i++)
		{
			this.main_menu_buttons[i - 1]
				.setBottomNext(this.main_menu_buttons[i])
			this.main_menu_buttons[i]
				.setTopNext(this.main_menu_buttons[i - 1])
		}
		
		// Setup variables.
		this.opacity = 0
		this.animation = new Tween(this, Easing.Linear)
		
		// Return reference to this.
		return this
	}

	// Change contextual menu on the right.
	changeContext(context)
	{
		// If context has not changed, ignore.
		if (this.currentContext == context)
			return

		// Else, swap context.
		else
		{
			// If logo not yet hidden, hide.
			if (!ui.main_menu.logo.hidden)
				ui.main_menu.logo.hide()

			// Hide old context.
			switch (this.currentContext)
			{
				case (this.main_menu_buttons[0]):
					ui.main_menu.turrets.hide()
					break

				case (this.main_menu_buttons[1]):
					ui.main_menu.augments.hide()
					break

				case (this.main_menu_buttons[2]):
					ui.main_menu.options.hide()
					break

				case (this.main_menu_buttons[3]):
					ui.main_menu.credits.hide()
					break
				
				case (this.main_menu_buttons[4]):
					break
			}

			// Show new context.
			switch (context)
			{
				case (this.main_menu_buttons[0]):
					ui.main_menu.turrets.refresh()
					ui.main_menu.turrets.show()
					break

				case (this.main_menu_buttons[1]):
					ui.main_menu.augments.refresh()
					ui.main_menu.augments.show()
					break

				case (this.main_menu_buttons[2]):
					ui.main_menu.options.refresh(true)
					ui.main_menu.options.show()
					break

				case (this.main_menu_buttons[3]):
					ui.main_menu.credits.show()
					break
			}

			// Update default focus for controller.
			if (this.currentContext) this.currentContext.defaultFocus = false
			for (const button of ui.main_menu.turrets.turrets)
				button.defaultFocus = false
			context.setDefault()
			
			// Update current context.
			let lastContext = this.currentContext
			this.currentContext = context
			if (lastContext) lastContext.focusEnd()
		}
	}

	// If controller shoulder buttons are pressed when current context is Augmentations.
	menuButtonShoulder(context, button)
	{
		if (usingController || keyboardArrows)
			switch(context)
			{
				case this.main_menu_buttons[0]:
					// ui.main_menu.turrets.changePageController(button)
					break

				case this.main_menu_buttons[1]:
					ui.main_menu.augments.categoryChange(button == shoulder_button_left ? -1 : 1)
					break
				
				case this.main_menu_buttons[2]:
					ui.main_menu.options.categoryChange(button == shoulder_button_left ? -1 : 1)
					break
			}
	}

	skipIntro()
	{
		this.opacity = 0.3
		this.setTexture(midGray.fadeTo(.3))
		this.main_menu_buttons.forEach(button => button.setOpacity(1))
	}

	startIntro()
	{
		this.setAnimating(true)
		audioHandler.playAudioHookUI("main_menu_intro")
		this.animation.easeIn({opacity: 0.3}, 40)
		let delay = 0
		for (let i = 0; i < this.main_menu_buttons.length; i++)
		{
			if (i == this.main_menu_buttons.length - 1)
				this.main_menu_buttons[i].startIntro(delay)
					.then(() => {
						this.setAnimating(false)
						if (this.currentContext && !usingController && !keyboardArrows)
							this.currentContext.focusEnd()
					})
			else
				this.main_menu_buttons[i].startIntro(delay)
			delay += 5
		}
	}

	startExtro()
	{
		this.setAnimating(true)
		audioHandler.playAudioHookUI("main_menu_extro")
		for (const button of this.main_menu_buttons)
			button.prepareForExtro()
		return new Promise(resolve => {
			this.animation.easeIn({opacity: 0}, 40)
			let wait = 0
			let allPromises = []
			for (let i = 0; i < this.main_menu_buttons.length; i++)
				allPromises.push(this.main_menu_buttons[i].startExtro(wait + i * 5))
			Promise.all(allPromises)
				.then(() => {
					this.setAnimating(false)
					if (this.currentContext) this.currentContext.defaultFocus = false
					for (const button of ui.main_menu.turrets.turrets)
						button.defaultFocus = false
					this.main_menu_buttons[0].setDefault()
					resolve()
				})
		})
	}

	update()
	{
		if (this.animating)
			this.setTexture(midGray.fadeTo(this.opacity))
	}
}