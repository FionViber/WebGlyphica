import { Yoga, Text, Node, Tween, Easing } from 'sphere-runtime'

export class TitleScreen extends Node
{
	constructor()
	{
		// Init superclass.
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setWidth("100%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		// Setup variables.
		this.animation = new Tween(this, Easing.Linear)
		this.opacity = 0
		
		// Create Glyphica text.
		this.aliasBlack1 = new Text()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_TOP, "23%")
			.setFont(interfaceIconsExtraLarge)
			.setWidth("100%")
			.setColor(midGray.fadeTo(this.opacity * .5))
			.setTextAlign(textAlign.center)
			.setText(":")
			.setChildOf(this)

		this.aliasBlack2 = new Text()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_TOP, "23%")
			.setFont(interfaceIconsExtraLarge)
			.setWidth("100%")
			.setColor(midGray.fadeTo(this.opacity))
			.setTextAlign(textAlign.center)
			.setText("9")
			.setChildOf(this)
		
		this.rowTwo = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setPosition(Yoga.EDGE_TOP, "52%")
			.setWidth("100%")
			.setChildOf(this)

		this.squeakyWheel = new Text()
			.setFont(interfaceIconsLarger)
			.setColor(midGray.fadeTo(this.opacity * .75))
			.setWidth(interfaceIconsLarger.widthOf("8"))
			.setTextAlign(textAlign.center)
			.setMargin(Yoga.EDGE_RIGHT, "2%")
			.setText("8")
			.setChildOf(this.rowTwo)
		
		this.imba = new Text()
			.setFont(interfaceIconsLarger)
			.setColor(midGray.fadeTo(this.opacity * .75))
			.setWidth(interfaceIconsLarger.widthOf(";"))
			.setTextAlign(textAlign.center)
			.setText(";")
			.setChildOf(this.rowTwo)
		
		// Setup fade-in.
		this.setAnimating(true)
		this.animation.easeIn({opacity: 1}, 50)
			.then(() => { this.setAnimating(false) })

		// Return reference.
		return this
	}

	update()
	{
		// If intro or extro, update title color.
		if (this.animating)
		{
			this.aliasBlack1.setColor(midGray.fadeTo(this.opacity * .5))
			this.aliasBlack2.setColor(midGray.fadeTo(this.opacity))
			this.squeakyWheel.setColor(midGray.fadeTo(this.opacity * .75))
			this.imba.setColor(midGray.fadeTo(this.opacity * .75))
		}

		// Listen for key presses on controller, mouse or keyboard.
		if (!this.hidden && !this.animating)
			if (control.lastButton || Mouse.Default.getEvent().key != null)
			{
				// Fade out and switch to main menu.
				this.setAnimating(true)
				audioHandler.playAudioHookUI("main_menu_title_fade_out")
				this.animation.easeOut({opacity: 0}, 50)
					.then(() => {
						this.setAnimating(false)
						this.hide()
						ui.showMainMenu()
					})
			}
	}
}