import { Node, Yoga, Text, Easing } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { UpgradeOption } from './upgradeOption.js'

export class UpgradeScreen extends Node
{
	constructor()
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setWidth("100%")
			.setHeight("100%")
			.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
		
		this.lhs = new UpgradeScreen_LHS()
			.setChildOf(this)
		
		this.rhs = new UpgradeScreen_RHS()
			.setChildOf(this)

		this.upgradeOptions = []
		for (let i = 0; i < 3; i++)
			this.upgradeOptions.push(new UpgradeOption()
				.setChildOf(this.rhs))
		
		return this
	}

	startIntro(chainLevel)
	{
		// Settings if not chain-leveling.
		if (!chainLevel)
		{
			inUpgradeMenu = true
			control.suspend(true)
			pause("levelup")
			this.show()
			bgm.fadeTo(bgm.getMusicInSet("levelUpScreen"))
		}

		// Seer.
		if ("item_seer" in serializedLoot && reroll == 0) reroll++
		
		// Play UI SFX.
		audioHandler.playAudioHookUI("upgrade_screen_intro")
		
		// Animate UI.
		let time = 40
		Promise.all([
			ui.setHUDState("menu"),
			this.lhs.startIntro(time),
			this.rhs.startIntro(time)
		]).then(() => control.suspend(false))
	}

	startExtro(forceClose = false)
	{
		// Suspend controls during UI animation.
		control.suspend(true)

		// Animate UI.
		let time = 40
		Promise.all([
			ui.setHUDState("game"),
			this.rhs.startExtro(time),
			this.lhs.startExtro(time)
		]).then(() => {

			// Clear words used in menu.
			clearMenuWords()
			
			// If quitting to main menu.
			if (forceClose)
			{
				this.hide()
				inUpgradeMenu = false
			}
			else
			{
				// If there are still pending level-ups, continue leveling.
				if (levelUpCount > 0)
					levelUp(true)
	
				// Else, go back to game.
				else
				{
					audioHandler.playAudioHookUI("upgrade_screen_extro")
					inUpgradeMenu = false
					control.suspend(false)
					unpause("levelup")
					this.hide()
					bgm.resume()
				}
			}
		})
	}

	reroll()
	{
		control.suspend(true)
		this.rhs.startExtro(30).then(() => {
			clearMenuWords()
			ui.upgradeScreen.upgradeOptions.forEach((u) => u.hide())
			getUpgrades().forEach((v, i) => {
				ui.upgradeScreen.upgradeOptions[i].setUpgrade(v)
			})
			this.rhs.tween.easeOut(
				[this.rhs.getComputedWidth()],
				[0],
				t => this.rhs.animXOffset = t[0],
				30
			).then(() => {
				control.suspend(false)
			})
		})
	}
}

class UpgradeScreen_RHS extends Node
{
	constructor()
	{
		super()
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(.3))
			.setWidth("74%")
			.setHeight("75%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		this.border = new Node()
			.setRenderMode(renderMode.color)
			.setTexture(midGray)
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_LEFT, 0)
			.setWidth("1%")
			.setHeight("100%")
			.setChildOf(this)
		
		this.tween = new FastTween(Easing.Exponential)
		return this
	}

	startIntro(time)
	{
		this.setAnimating(true)
		this.animXOffset = this.getComputedWidth()
		let promise = this.tween.easeIn([this.getComputedWidth()], [0], t => this.animXOffset = t[0], time)
		promise.then(() => this.setAnimating(false))
		return promise
	}

	startExtro(time)
	{
		this.setAnimating(true)
		let promise = this.tween.easeIn([0], [this.getComputedWidth()], t => this.animXOffset = t[0], time)
		promise.then(() =>  this.setAnimating(false))
		return promise
	}
}

class UpgradeScreen_LHS extends Node
{
	constructor()
	{
		super()
			.setHeight("100%")
			.setWidth("24%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_STRETCH)

		// Level Background.
		this.bg = new Node()
			.setTexture(midGray)
			.setRenderMode(renderMode.color)
			.setWidth("100%")
			.setHeight("20%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_STRETCH)
			.setPadding(Yoga.EDGE_LEFT, scalePix(50))
			.setChildOf(this)

		// Level.
		this.level = new Text()
			.setFont(titleFontUI())
			.setText("LEVEL 2")
			.setColor(paleYellow)
			.setChildOf(this.bg)

		// Best Weapon.
		this.topWeapon = new Text()
			.setFont(regularFontUI())
			.setText("Repeater")
			.setColor(paleYellow)
			.setChildOf(this.bg)

		// Weapon Ranking.
		this.weaponRanking = new WeaponRanking()
			.setChildOf(this)
		
		// Hint for typing upgrade name.
		this.typeHint = new TypeHint()
			.setChildOf(this)
		
		this.tween = new FastTween(Easing.Exponential)

		return this
	}

	startIntro(time)
	{
		this.setAnimating(true)
		this.bg.animXOffset = -this.bg.getComputedWidth()
		let promise = Promise.all([
			this.weaponRanking.startIntro(time),
			this.tween.easeIn([-this.bg.getComputedWidth()], [0], t => this.bg.animXOffset = t[0], time)
		])
		promise.then(() => this.setAnimating(false))
		return promise
	}

	startExtro(time)
	{
		this.setAnimating(true)
		let promise = Promise.all([
			this.weaponRanking.startExtro(time),
			this.tween.easeIn([0], [-this.bg.getComputedWidth()], t => this.bg.animXOffset = t[0], time)
		])
		promise.then(() => this.setAnimating(false))
		return promise
	}
}

class TypeHint extends Node
{
	constructor()
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_TOP, "77%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW_REVERSE)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
		
		this.arrow = new Text()
			.setFont(typingFontLarge)
			.setText('▶')
			.setWidth(typingFontLarge.widthOf('▶'))
			.setHeight(40)
			.setColor(midGray.fadeTo(0))
			.setMargin(Yoga.EDGE_LEFT, scalePix(10))
			.setChildOf(this)

		this.text = new Text()
			.setFont(titleFontUI())
			.setText(localize("hint_type"))
			.setWidth(titleFontUI().widthOf(localize("hint_type")))
			.setColor(midGray.fadeTo(0))
			.setChildOf(this)
		
		this.opacity = 0
		this.tween = new FastTween(Easing.Linear)

		return this
	}

	blink()
	{
		if (!this.isHidden())
		{
			this.setAnimating(true)
			this.tween.easeIn([0], [1], t => this.opacity = t[0], 15).then(() => {
				this.tween.easeIn([1], [0], t => this.opacity = t[0], 15).then(() => {
					this.blink()
				})
			})
		}
		else
			this.setAnimating(false)
	}

	update()
	{
		if (this.animating)
		{
			this.arrow.setColor(midGray.fadeTo(this.opacity))
			this.text.setColor(midGray.fadeTo(this.opacity))
		}
	}
}

class WeaponRanking extends Text
{
	constructor()
	{
		super()
			.setPadding(Yoga.EDGE_TOP, scalePix(40))
			.setPadding(Yoga.EDGE_LEFT, scalePix(50))
			.setFont(regularFontUI())
			.setText("1. Repeater - 24.1 dps\n2. Spectre - 20.5 dps")
			.setColor(midGray.fadeTo(0))
		
		this.opacity = 0
		this.tween = new FastTween(Easing.Linear)

		return this
	}

	startIntro(time)
	{
		this.setAnimating(true)
		let promise = this.tween.easeIn([0], [1], t => this.opacity = t[0], time)
		promise.then(() => this.setAnimating(false))
		return promise
	}

	startExtro(time)
	{
		this.setAnimating(true)
		let promise = this.tween.easeIn([1], [0], t => this.opacity = t[0], time)
		promise.then(() => this.setAnimating(false))
		return promise
	}

	update()
	{
		if (this.animating)
			this.setColor(midGray.fadeTo(this.opacity))
	}
}