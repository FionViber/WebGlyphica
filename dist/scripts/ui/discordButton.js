import { Node, Text, Yoga, Tween, Easing } from 'sphere-runtime'
import { Button } from '../core/button.js'

export class DiscordButton extends Button
{
	constructor()
	{
		super()
			.setWidth("75%")
			.setHeight("5%")
			.setRenderMode(renderMode.colorRounded)
			.setMargin(Yoga.EDGE_TOP, scalePix(7))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setTexture(midGray.fadeTo(0))
		
		this.logo = new Text()
			.setFont(interfaceIcons)
			.setColor(paleYellow.fadeTo(0))
			.setWidth(interfaceIcons.widthOf("#"))
			.setMargin(Yoga.EDGE_RIGHT, scalePix(10))
			.setText("$")
			.setChildOf(this)
		
		this.text = new Text()
			.setFont(typingFont)
			.setColor(paleYellow.fadeTo(0))
			.setWidth(typingFont.widthOf("Discord"))
			.setText("Discord")
			.setChildOf(this)
		
		this.opacity = 0
		this.tween = new Tween(this, Easing.Linear)
		
		return this
	}

	focusStart()
	{
		if (!inConfirmPopUp)
		{
			audioHandler.playAudioHookUI("main_menu_navigation_hover")
			this.setTexture(secondColorDark)
		}
	}
	
	focusEnd()
	{
		this.setTexture(midGray.fadeTo(.7))
	}

	setOpacity(opacity)
	{
		this.opacity = opacity
		this.setTexture(midGray.fadeTo(opacity * .7))
		this.logo.setColor(paleYellow.fadeTo(opacity))
		this.text.setColor(paleYellow.fadeTo(opacity))
	}

	prepareForExtro() {}

	startIntro()
	{
		this.setAnimating(true)
		return new Promise((resolve) => {
			this.tween.easeIn({opacity: 1}, 50)
				.then(() => {
					this.setAnimating(false)
					resolve()
				})
		})
	}

	startExtro()
	{
		this.setAnimating(true)
		return new Promise((resolve) => {
			this.tween.easeOut({opacity: 0}, 50)
				.then(() => {
					this.setAnimating(false)
					resolve()
				})
		})
	}

	update()
	{
		super.update()
		if (this.animating)
			this.setOpacity(this.opacity)
	}

	pressMouseLeftStart() { this.interact() }
	pressButtonBottomStart() { this.interact() }
	interact()
	{
		if (!inConfirmPopUp)
		{
			audioHandler.playAudioHookUI("main_menu_navigation_click")
			Sphere.openURL("https://discord.gg/vz6WvMxafd")
		}
	}
}