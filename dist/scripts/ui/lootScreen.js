import { Node, Yoga, Text, Easing } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { LootOption } from './lootOption.js'
import { LootItems, Ascetic } from '../data/lootItems.js'

export class LootScreen extends Node
{
	constructor()
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setWidth("100%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		// Top.
		this.top = new Node()
			.setWidth("100%")
			.setHeight("8%")
			.setTexture(darkGray.fadeTo(0))
			.setRenderMode(renderMode.color)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setPadding(Yoga.EDGE_TOP, scalePix(8))
			.setMargin(Yoga.EDGE_TOP, scalePix(120))
			.setChildOf(this)

		// Loot title.
		this.title = new Text()
			.setWidth("100%")
			.setFont(titleFontUI())
			.setText(localize("loot_pickup"))
			.setTextAlign(textAlign.center)
			.setColor(paleYellow.fadeTo(0))
			.setChildOf(this.top)

		// Middle.
		this.middle = new Node()
			.setWidth("100%")
			.setHeight("70%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this)

		// Loot Window.
		this.window = new Node()
			.setWidth("100%")
			.setHeight("100%")
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setTexture(midGray.fadeTo(0))
			.setRenderMode(renderMode.color)
			.setChildOf(this.middle)

		// Upgrade options.
		this.lootOptions = []
		for (let i = 0; i < 4; i++)
		{
			let lootOption = new LootOption().setChildOf(this.window)
			lootOption.itemCount.hide()
			this.lootOptions.push(lootOption)
		}

		// Bottom.
		this.bottom = new Node()
			.setWidth("100%")
			.setHeight("12%")
			.setPadding(Yoga.EDGE_LEFT, scalePix(200))
			.setPadding(Yoga.EDGE_TOP, scalePix(15))
			.setChildOf(this)
		
		this.opacity = 0
		this.tween = new FastTween(Easing.Linear)
		this.bossLoot = false

		return this
	}

	startIntro(numItems, bossLoot = false)
	{
		this.show()
		this.setAnimating(true)
		this.bossLoot = bossLoot
		control.suspend(true)
		if (!bossLoot) bgm.fadeTo(bgm.getMusicInSet('lootScreen'))
		let animPromises = []

		// Seer.
		if ("item_seer" in serializedLoot && reroll == 0) reroll++

		// Change title.
		this.title.setText(localize(bossLoot ? "loot_pickup_boss" : "loot_pickup"))

		// Animate in BG.
		this.tween.easeIn([0], [1], t => this.opacity = t[0], 20)
			.then(() => this.setAnimating(false))
		
		// Timing for individual loot options.
		let offset = this.getComputedWidth() - this.lootOptions[0].getComputedLeft()
		for (let i = 0; i < numItems; i++)
			this.lootOptions[i].animXOffset = offset
		
		let delay = 10
		for (let i = 0; i < numItems; i++)
		{
			animPromises.push(this.lootOptions[i].startIntro(delay))
			delay += 10
		}

		// Animate in button hints.
		animPromises.push(ui.setHUDState(bossLoot ? "end" : "menu"))

		// When everything has animated in, finalize.
		Promise.all(animPromises).then(() => control.suspend(false))
	}

	startExtro(forceClose = false)
	{
		this.setAnimating(true)
		control.suspend(true)
		if (!forceClose)
		{
			audioHandler.playAudioHookUI("loot_option_extro")
			if (!this.bossLoot)
				bgm.resume()
		}

		// Timing for individual loot options.
		let numItems = this.lootOptions.reduce((countVisible, loot) => {
			return loot.hidden ? countVisible : countVisible + 1
		}, 0)
		let delay = 0
		let offset = -(this.lootOptions[numItems - 1].getComputedLeft() + this.lootOptions[0].getComputedWidth())
		let animPromises = []
		for (let i = 0; i < numItems; i++)
		{
			animPromises.push(this.lootOptions[i].startExtro(offset, delay))
			delay += 10
		}

		// Animate out button hints.
		animPromises.push(new Promise(resolve => {
			Sphere.sleep(20).then(() => {
				ui.setHUDState(this.bossLoot ? "end" : "game").then(() => resolve())
			})
		}))

		// Animate out BG.
		animPromises.push(new Promise(resolve => {
			Sphere.sleep(10 * numItems). then(() => {
				this.tween.easeIn([1], [0], t => this.opacity = t[0], 20).then(() => resolve())
			})
		}))

		// When all loot options have exited, finalize.
		Promise.all(animPromises).then(() => {
			this.setAnimating(false)
			clearMenuWords()
			unpause("loot")
			this.hide()
			if (this.bossLoot)
			{
				pause("endgame")
				ui.summaryScreen.panel.refresh(false)
				ui.summaryScreen.startIntro(false)
			}
			else
			{
				inUpgradeMenu = false
				control.suspend(false)
				if ("item_ascetic" in serializedLoot && reroll > 0)
				{
					let asceticPowerup = powerups.find((powerup) => powerup.constructor.name == "Ascetic")
					if (asceticPowerup)
						asceticPowerup.node.currentProgress = asceticPowerup.node.maxProgress
					else
						asceticPowerup = factory.spawn(Ascetic, 1200)
					asceticPowerup.trigger(reroll)
				}
			}
		})
	}

	reroll(bossLoot = false)
	{
		// Slide loot options out.
		control.suspend(true)
		let numItems = this.lootOptions.reduce((countVisible, loot) => countVisible += !loot.hidden, 0)
		let delay = 0
		let offset = -(this.lootOptions[numItems - 1].getComputedLeft() + this.lootOptions[0].getComputedWidth())
		let animPromises = []
		for (let i = 0; i < numItems; i++)
		{
			animPromises.push(this.lootOptions[i].startExtro(offset, delay))
			delay += 10
		}
		Promise.all(animPromises).then(() => {
			
			// Reroll loot items.
			clearMenuWords()
			let inventory = ui.generateLoot(bossLoot)
			this.lootOptions.forEach((v, i) => {
				if (inventory.length <= i)
					v.hide()
				else
					v.setUpgrade(inventory[i])
			})

			// Slide loot options out again.
			let offset = this.getComputedWidth() - this.lootOptions[0].getComputedLeft()
			for (let i = 0; i < numItems; i++)
				this.lootOptions[i].animXOffset = offset
			delay = 0
			animPromises = []
			for (let i = 0; i < numItems; i++)
			{
				animPromises.push(this.lootOptions[i].startIntro(delay))
				delay += 10
			}
			Promise.all(animPromises).then(() => control.suspend(false))
		})
	}

	update()
	{
		if (this.animating)
		{
			this.top.setTexture(darkGray.fadeTo(this.opacity))
			this.title.setColor(paleYellow.fadeTo(this.opacity))
			this.window.setTexture(midGray.fadeTo(this.opacity * .3))
		}
	}
}
