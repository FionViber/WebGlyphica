import { Yoga, Node } from 'sphere-runtime'
import { MainMenuLeft } from './mainMenuLeft.js'
import { MainMenuLogo } from './mainMenuLogo.js'
import { MainMenuTurrets } from './mainMenuTurrets.js'
import { MainMenuCredits } from './mainMenuCredits.js'
import { MainMenuAugments } from './mainMenuAugments.js'
import { MainMenuOptions } from './mainMenuOptions.js'

export class MainMenu extends Node
{
	constructor()
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setWidth("100%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		// Left hand side.
		this.left = new MainMenuLeft()
			.setChildOf(this)
		
		// Right hand side.
		this.right = new Node()
			.setWidth("68%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this)
		
		// Default (Game Logo)
		this.logo = new MainMenuLogo()
			.setChildOf(this.right)
			// .hide()
		
		// Turrets Menu.		
		this.turrets = new MainMenuTurrets(this.left)
			.setChildOf(this.right)
			.hide()
		
		// Augmentations menu.
		this.augments = new MainMenuAugments(this.left)
			.setChildOf(this.right)
			.hide()
		
		// Options menu.
		this.options = new MainMenuOptions(this.left)
			.setChildOf(this.right)
			.hide()
		
		// Credits.
		this.credits = new MainMenuCredits()
			.setChildOf(this.right)
			.hide()
	}
}