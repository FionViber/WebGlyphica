import { Node, Text, Yoga, Tween, Easing } from 'sphere-runtime'
import { Button } from '../core/button.js'

export class WishlistButton extends Button
{
	constructor()
	{
		super()
			.setWidth("80%")
			.setHeight("10%")
			.setRenderMode(renderMode.colorRounded)
			.setMargin(Yoga.EDGE_TOP, scalePix(40))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setPadding(Yoga.EDGE_HORIZONTAL, scalePix(5))
			.setTexture(midGray.fadeTo(0))
		
		this.logo = new Text()
			.setFont(interfaceIconsMedium)
			.setColor(paleYellow.fadeTo(0))
			.setWidth(interfaceIconsMedium.widthOf("#"))
			.setMargin(Yoga.EDGE_RIGHT, scalePix(20))
			.setText("#")
			.setChildOf(this)
		
		this.textGroup = new Node()
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setChildOf(this)
		
		this.wishlistText = new Text()
			.setFont(grandRegular)
			.setColor(paleYellow.fadeTo(0))
			.setWidth(grandRegular.widthOf("Wishlist"))
			.setText("Wishlist")
			.setChildOf(this.textGroup)
		
		this.onSteamText = new Text()
			.setFont(typingFont)
			.setColor(paleYellow.fadeTo(0))
			.setWidth(typingFont.widthOf("on Steam"))
			.setText("on Steam")
			.setChildOf(this.textGroup)
		
		this.opacity = 0
		this.tween = new Tween(this, Easing.Linear)
		
		return this
	}

	focusStart()
	{
		audioHandler.playAudioHookUI("main_menu_navigation_hover")
		this.setTexture(secondColorDark)
	}
	
	focusEnd()
	{
		this.setTexture(midGray)
	}

	setOpacity(opacity)
	{
		this.opacity = opacity
		this.setTexture(midGray.fadeTo(opacity))
		this.logo.setColor(paleYellow.fadeTo(opacity))
		this.wishlistText.setColor(paleYellow.fadeTo(opacity))
		this.onSteamText.setColor(paleYellow.fadeTo(opacity))
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
		audioHandler.playAudioHookUI("main_menu_navigation_click")
		if (steamEnabled && ISteamUtils.IsOverlayEnabled())
			ISteamFriends.ActivateGameOverlayToWebPage(
				"https://store.steampowered.com/app/2400160/Glyphica_Typing_Survival/?utm_source=ingamebutton#game_purchase_area",
				EActivateGameOverlayToWebPageMode.k_EActivateGameOverlayToWebPageMode_Modal
			)
		else Sphere.openURL("steam://store/2400160?utm_source=ingamebutton")
	}
}