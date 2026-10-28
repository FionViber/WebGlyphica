import { Node, Text, Yoga, Tween, Easing } from 'sphere-runtime'
import { Button } from '../core/button.js'
import { UpgradeOption } from './upgradeOption.js'
import { WeaponsList } from '../data/weaponsList.js'
import { Turret } from '../turrets/turret.js'
import { OptionsToggle } from './optionsToggle.js'
import { PageChangeButton } from './pageChangeButton.js'
import { PageCounter } from './pageCounter.js'
import { LootOption } from './lootOption.js'
import { LootItems } from '../data/lootItems.js'
import { augmentsList } from '../data/augmentsList.js'
import { MainMenuAugment } from './mainMenuAugments.js'

export class WeaponDetail extends Node
{
	constructor()
	{
		// ----------
		// BACKGROUND
		// ----------

		super()
			.setRenderMode(renderMode.color)
			.setTexture(midGray)
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setHeight("100%")
		
		this.panel = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(paleYellow.fadeTo(.6))
			.setWidth("92%")
			.setHeight("95%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this)

		// ------------------------
		// TOP NAVIGATION PAGINATOR
		// ------------------------

		this.sectionSelect = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("50%")
			.setHeight("6%")
			.setChildOf(this.panel)

		this.sectionSelectLeft = new PageChangeButton(-1, this.changeSectionCheck.bind(this), this.changeSection.bind(this))
			.setWidth("10%")
			.setHeight("100%")
			.setChildOf(this.sectionSelect)
        
        this.sectionTitleBG = new Node()
            .setWidth("78%")
            .setHeight("100%")
            .setRenderMode(renderMode.colorRounded)
            .setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
            .setJustifyContent(Yoga.JUSTIFY_CENTER)
            .setTexture(midGray.fadeTo(.2))
            .setChildOf(this.sectionSelect)
        
        this.sectionTitleText = new Text()
            .setWidth("100%")
            .setHeight(regularFontUI().height)
            .setFont(regularFontUI())
            .setColor(darkGray)
			.setText("Current Weapons")
            .setTextAlign(textAlign.center)
            .setChildOf(this.sectionTitleBG)

		this.sectionSelectRight = new PageChangeButton(1, this.changeSectionCheck.bind(this), this.changeSection.bind(this))
			.setWidth("10%")
			.setHeight("100%")
			.setChildOf(this.sectionSelect)

		this.sectionCounter = new PageCounter(true)
			.setWidth("100%")
			.setMargin(Yoga.EDGE_BOTTOM, "2%")
			.setChildOf(this.panel)

		// ------------------------
		// MIDDLE CONTENT CONTAINER
		// ------------------------

		this.contentContainer = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setHeight("72%")
			.setChildOf(this.panel)

		// ---------------
		// CURRENT WEAPONS
		// ---------------

		this.currentWeapons = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setHeight("100%")
			.setChildOf(this.contentContainer)
			.hide()

		this.dpsRanking = new Node()
			.setHeight("100%")
			.setWidth("27%")
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(.2))
			.setPadding(Yoga.EDGE_ALL, scalePix(30))
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setChildOf(this.currentWeapons)
		
		this.dpsRankingHeader = new Text()
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(20))
			.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(10))
			.setFont(titleFontUI())
			.setText(localize("current_weapons"))
			.setColor(darkGray)
			.setChildOf(this.dpsRanking)

		this.dpsRankingEntries = []
		for (let i = 0; i < 8; i++)
			this.dpsRankingEntries.push(new DPSRow(this, i)
				.setChildOf(this.dpsRanking))
		this.dpsRankingEntries.forEach((v, i) => {
			if (i > 0) v.setTopNext(this.dpsRankingEntries[i - 1])
		})

		this.instructionsGroup = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_BOTTOM, scalePix(20))
			.setPosition(Yoga.EDGE_LEFT, scalePix(30))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setChildOf(this.dpsRanking)
		
		this.instructionsArrowUp = new InstructionsArrow("↑")
			.setChildOf(this.instructionsGroup)

		this.instructionsArrowDown = new InstructionsArrow("↓")
			.setChildOf(this.instructionsGroup)

		this.instructionsText = new Text()
			.setFont(regularFontUI())
			.setColor(midGray)
			.setText(localize("to_select_weapon"))
			.setMargin(Yoga.EDGE_LEFT, scalePix(10))
			.setWidth(regularFontUI().widthOf(localize("to_select_weapon")))
			.setChildOf(this.instructionsGroup)

		this.details = new Node()
			.setHeight("100%")
			.setWidth("65%")
			.setPadding(Yoga.EDGE_HORIZONTAL, scalePix(40))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.currentWeapons)
		
		this.weaponCard = new WeaponCard()
			.setHeight("100%")
			.setChildOf(this.details)
		
		this.modifiers = new Node()
			.setWidth("60%")
			.setHeight("100%")
			.setMargin(Yoga.EDGE_LEFT, "1%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setRenderMode(renderMode.color)
			.setPadding(Yoga.EDGE_ALL, "3%")
			.setTexture(midGray.fadeTo(.2))
			.setChildOf(this.details)
		
		this.modifiersTitle = new Text()
			.setFont(titleFontUI())
			.setColor(darkGray)
			.setText(localize("modifiers_title"))
			.setHeight("12%")
			.setChildOf(this.modifiers)
		
		this.modifiersBody = new Text()
			.setFont(regularFontUI())
			.setColor(darkGray)
			.setHeight("78%")
			.setWidth("100%")
			.setChildOf(this.modifiers)

		this.modifiersPageGroup = new Node()
			.setWidth("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setMargin(Yoga.EDGE_TOP, "1%")
			.setChildOf(this.modifiers)
		
		this.modifiersPaginator = new Paginator()
			.setChildOf(this.modifiersPageGroup)
		
		// ----------
		// LOOT ITEMS
		// ----------

		this.currentLoot = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setHeight("100%")
			.setChildOf(this.contentContainer)
			.hide()
		
		this.lootOptions = []
		for (let i = 0; i < 4; i++)
		{
			let lootContainer = new Node()
				.setWidth("23.5%")
				.setHeight("100%")
				.setRenderMode(renderMode.colorRounded)
				.setTexture(midGray.fadeTo(.2))
				.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(5))
				.setChildOf(this.currentLoot)

			this.lootOptions.push(new LootOption()
				.setWidth("100%")
				.setHeight("100%")
				.setMargin(Yoga.EDGE_HORIZONTAL, 0)
				.setChildOf(lootContainer))
		}
		this.lootOptions.forEach(loot => {
			loot.bottomBar.hide()
			loot.bottomGroup.hide()
			loot.topGroup.setHeight("95%")
		})

		// --------
		// AUGMENTS
		// --------

		this.currentAugments = new Node()
			.setWidth("100%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_FLEX_START)
			.setFlexWrap(Yoga.FLEX_FLEX)
			.setChildOf(this.contentContainer)
			.hide()
		
		this.augmentOptions = []
		for (let i = 0; i < 9; i++)
		{
			let augmentContainer = new Node()
				.setWidth("30%")
				.setHeight("31%")
				.setRenderMode(renderMode.colorRounded)
				.setTexture(midGray.fadeTo(.2))
				.setMargin(Yoga.EDGE_VERTICAL, ".3%")
				.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(15))
				.setChildOf(this.currentAugments)

			this.augmentOptions.push(
				new MainMenuAugment()
					.setWidth("100%")
					.setHeight("100%")
					.setMargin(Yoga.EDGE_HORIZONTAL, 0)
					.setMargin(Yoga.EDGE_VERTICAL, 0)
					.setRenderMode(renderMode.colorRounded)
					.setTexture(paleYellow)
					.setChildOf(augmentContainer)
			)
		}
		this.augmentOptions.forEach(augment => {
			augment.leftSide.hide()
			augment.level.hide()
			augment.rightSide.setWidth("100%")
		})

		// ------------------
		// BOTTOM BACK BUTTON
		// ------------------

		this.bottomBar = new Node()
			.setWidth("85%")
			.setHeight("5%")
			.setMargin(Yoga.EDGE_TOP, "1%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW_REVERSE)
			.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.panel)
			
		this.returnButtonGroup = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.bottomBar)

		this.returnGroup = new Node()
			.setWidth("100%")
			.setHeight(scalePix(50))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.returnButtonGroup)
		
		this.returnF1 = new InstructionsArrow("Tab")
			.setChildOf(this.returnGroup)

		this.returnSlash = new Text()
			.setFont(typingFont)
			.setColor(midGray)
			.setText(" / ")
			.setWidth(typingFont.widthOf(" / "))
			.setChildOf(this.returnGroup)

		this.returnEscape = new InstructionsArrow("Esc")
			.setChildOf(this.returnGroup)

		this.returnController = new Text()
			.setFont(quicktimeFont)
			.setColor(midGray)
			.setTextAlign(textAlign.center)
			.setText(getQuickTimeString([button_top]))
			.setTextAlign(textAlign.center)
			.setMargin(Yoga.EDGE_RIGHT, scalePix(5))
			.setWidth(quicktimeFont.widthOf(getQuickTimeString([button_top])))
			.setChildOf(this.returnGroup)

		this.returnText = new Text()
			.setFont(regularFontUI())
			.setColor(midGray)
			.setTextAlign(textAlign.center)
			.setMargin(Yoga.EDGE_LEFT, scalePix(10))
			.setText(localize("back"))
			.setWidth(regularFontUI().widthOf(localize("back")))
			.setChildOf(this.returnGroup)

		this.bottomPaginator = new Node()
			.setWidth("25%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.bottomBar)

		this.bottomPaginatorLeftArrow = new PageChangeButton(-1, this.changeCurrentLootPageCheck.bind(this), this.changeCurrentLootPage.bind(this))
			.setWidth("18%")
			.setChildOf(this.bottomPaginator)
		this.bottomPaginatorLeftArrow.keyboardText.setText("←")
		this.bottomPaginatorLeftArrow.controllerText.setText(getQuickTimeString([direction_left]))

		this.bottomPaginatorBG = new Node()
			.setHeight("100%")
			.setWidth("60%")
			.setChildOf(this.bottomPaginator)
		
		this.bottomPaginatorText = new Text()
			.setFont(regularFontUI())
			.setColor(midGray)
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setChildOf(this.bottomPaginatorBG)

		this.bottomPaginatorRightArrow = new PageChangeButton(1, this.changeCurrentLootPageCheck.bind(this), this.changeCurrentLootPage.bind(this))
			.setWidth("18%")
			.setChildOf(this.bottomPaginator)
		this.bottomPaginatorRightArrow.keyboardText.setText("→")
		this.bottomPaginatorRightArrow.controllerText.setText(getQuickTimeString([direction_right]))

		this.tween = new Tween(this, Easing.Exponential)
		this.animYOffset = Surface.Screen.height
		this.confirmAction = null
		this.lastFocus = null
		this.currentContext = null
		this.dpsRanking = null
		this.ready = false
		this.closeImmediately = false
		this.currentPage = 0
		this.currentSection = 0
		
		return this
	}

	changeSectionCheck(increment)
	{
		let nextSection = this.currentSection + increment
		return nextSection >= 0 && nextSection < 3
	}

	changeSection(increment)
	{
		if (this.changeSectionCheck(increment))
		{
			this.currentSection += increment
			this.currentPage = 0
			switch(this.currentSection)
			{
				case 0:
					this.bottomPaginator.hide()
					this.currentWeapons.show()
					this.currentLoot.hide()
					this.currentAugments.hide()
					this.refreshWeapons()
					this.sectionTitleText.setText(localize("current_weapons"))
					break
				
				case 1:
					this.bottomPaginator.show()
					this.currentWeapons.hide()
					this.currentLoot.show()
					this.currentAugments.hide()
					this.changeCurrentLootPage(0)
					this.sectionTitleText.setText(localize("current_loot"))
					if (this.currentContext)
					{
						this.currentContext.focusEnd()
						this.currentContext = null
					}
					break
				
				default:
					this.bottomPaginator.hide()
					this.currentWeapons.hide()
					this.currentLoot.hide()
					this.currentAugments.show()
					this.refreshCurrentAugments()
					this.sectionTitleText.setText(localize("current_augments"))
					if (this.currentContext)
						{
							this.currentContext.focusEnd()
							this.currentContext = null
						}
					break
			}
			this.sectionSelectLeft.refresh()
			this.sectionSelectRight.refresh()
			this.sectionCounter.refresh(this.currentSection, 3)
		}
	}

	changeCurrentLootPageCheck(increment)
	{
		let nextPage = this.currentPage + increment
		let maxLoot = Object.keys(serializedLoot).length || 1
		return nextPage >= 0 && nextPage < Math.ceil(maxLoot / 4)
	}

	changeCurrentLootPage(increment)
	{
		if (this.changeCurrentLootPageCheck(increment))
		{
			// Get loot data.
			let allLoot = LootItems()
			let lootKeys = Object.keys(serializedLoot)

			// Update paginator.
			this.currentPage += increment
			this.bottomPaginatorLeftArrow.refresh()
			this.bottomPaginatorRightArrow.refresh()
			this.bottomPaginatorText.setText(`${localize("page")} ${this.currentPage + 1} / ${Math.max(Math.ceil(lootKeys.length / 4), 1)}`)
			
			// Populate loot options.
			this.lootOptions.forEach((v, i) => {
				let startingLootIndex = this.currentPage * 4
				let thisIndex = startingLootIndex + i
				if (thisIndex < lootKeys.length)
				{
					v.setUpgrade(allLoot.find(loot => loot.name == lootKeys[thisIndex]))
					if (serializedLoot[lootKeys[thisIndex]] > 1)
					{
						v.itemCount.show()
						v.itemCountValue.setText(`x${serializedLoot[lootKeys[thisIndex]]}`)
					}
					else v.itemCount.hide()
				}
				else v.hide()
			}) 
		}
	}

	refreshCurrentAugments()
	{
		let allAugments = augmentsList()
		let currentAugments = []
		Object.keys(activeAugments).forEach(aug => {
			for (let i = 0; i < activeAugments[aug]; i++)
				currentAugments.push(aug)
		})
		this.augmentOptions.forEach((v, i) => {
			if (i < currentAugments.length)
			{
				v.show()
				v.setAugment(allAugments.find(aug => aug.name == currentAugments[i]))
			}
			else v.hide()
		})
	}

	keyboardArrows(key)
	{
		if (!this.hidden && !this.animating)
		{
			switch (key)
			{
				case Key.Down:
					if (this.currentSection == 0)
						this.currentContext.selectBottom()
					break
				
				case Key.Up:
					if (this.currentSection == 0)
						this.currentContext.selectTop()
					break
				
				case Key.Left:
					switch(this.currentSection)
					{
						case 0: this.modifiersPaginator.changeVariable(-1); break
						case 1: this.changeCurrentLootPage(-1); break
					}
					break
				
				case Key.Right:
					switch(this.currentSection)
					{
						case 0: this.modifiersPaginator.changeVariable(1); break
						case 1: this.changeCurrentLootPage(1); break
					}
					break
				
				case Key.W:
					this.changeSection(1)
					break
				
				case Key.Q:
					this.changeSection(-1)
					break
			}
		}
	}

	refreshWeapons()
	{
		// Get DPS Ranks.
		this.dpsRanking = getSortedDpsRanking()

		// Populate rows.
		this.dpsRankingEntries.forEach((v, i) => {
			if (this.dpsRanking.length > i)
			{
				v.show()
				v.weaponName.setText(this.dpsRanking[i][0])
				v.weaponDPS.setText(this.dpsRanking[i][1].toFixed(1) + " DPS")

				// Controller navigation.
				v.setBottomNext(i < this.dpsRanking.length - 1 ? this.dpsRankingEntries[i + 1] : null)
			}

			// Hide rows that aren't used.
			else v.hide()
		})

		// Start context on first row.
		this.setContext(0, true)
		this.currentContext.takeFocus()
		this.refreshInstructions()
	}

	// Do controller specfic adjustments.
	refreshInstructions()
	{
		if (usingController)
		{
			// this.dpsRankingEntries[0].takeFocus()
			this.instructionsGroup.hide()
			this.returnF1.hide()
			this.returnSlash.hide()
			this.returnEscape.hide()
			this.returnController.show()
		}
		else
		{
			this.instructionsGroup.show()
			this.returnF1.show()
			this.returnSlash.show()
			this.returnEscape.show()
			this.returnController.hide()
		}
	}

	// Set context of details panel.
	setContext(index, skipAudioHook = false)
	{
		// Play audio.
		if (!skipAudioHook) audioHandler.playAudioHookUI("weapon_details_change_weapon")

		// Deal with ranking display.
		let oldContext = this.currentContext
		this.currentContext = this.dpsRankingEntries[index]
		if (!usingController && !keyboardArrows)
		{
			this.dpsRankingEntries[index].focusEnd()
			if (oldContext) oldContext.focusEnd()
		}

		// Update weapon card.
		let weapon = [...allWeapons, currentTurret].find(weap => weap.constructor.getName() == this.dpsRanking[index][0])
		let weaponData = weapon instanceof Turret ?
			{
				icon: currentTurret.constructor.getIcon(),
				name: currentTurret.constructor.getName(),
				desc: currentTurret.constructor.getDesc()
			} :
			WeaponsList().find(weapon => weapon.name == this.dpsRanking[index][0])
		weaponData.tags = [weapon.primaryDamageTag, ...weapon.constructor.nonDamageTags()]
		this.weaponCard.setUpgrade(weaponData, true)
		if (!weapon.isWeapon)
			this.weaponCard.evolutionProgress.hide()
		else
		{
			this.weaponCard.evolutionProgress.show()
			this.weaponCard.evolutionProgress.setEvolution(weapon)
		}

		// Update modifiers.
		this.modifiersText = new ModifiersText(this)
		for (const mod of modifiers.modifierTypes)
		{
			if (mod == "damage")
			{
				let discretePercMods = modifiers.getPercDiscreteModifiers(weapon, mod)
				for (const dmgType of modifiers.damageTypes)
					if (weapon.dmg.mod[dmgType] > 0)
					{
						let modifiedStat = weapon.dmg.mod[dmgType]
						this.modifiersText.addLine(`${localize(dmgType + "Damage_text")}:  ${modifiedStat.toFixed(1)} ${localize("damage")}\n`)
						this.printModifierList(Object.entries(modifiers.getAbsDiscreteModifiers(weapon, dmgType)), true)
						this.printModifierList(Object.entries(discretePercMods[dmgType] || {}))
						if ("augment_blitzkrieg" in activeAugments && weapon.constructor.nonDamageTags().includes("tag_drone"))
							this.printModifierList(Object.entries(modifiers.getPercDiscreteModifiers(weapon, "speed")))
						if ("augment_sniper" in activeAugments && weapon.constructor.nonDamageTags().includes("tag_remote"))
							this.printModifierList(Object.entries(modifiers.getPercDiscreteModifiers(weapon, "range")))
						this.modifiersText.addLine("\n")
					}
			}
			else if (weapon.mod[mod] != 0)
			{
				let stat = weapon.mod[mod]
				let statDisplay
				switch(mod)
				{	
					case "rateOfFire":
						if (weapon.constructor.name == "Barrage")
							statDisplay = `${((1 / (weapon.calcBaseRateOfFire() * stat)) / 60).toFixed(1)} ${localize("secs_per_reload")}`
						else
							statDisplay = `${stat.toFixed()} ${localize("hits_per_minute")}`
						break
					
					case "range":
						if (weapon.constructor.name == "Oscillator")
							statDisplay = (stat * 100).toFixed(1) + " " + localize("degrees_spread")
						else
							statDisplay = (stat / 10).toFixed(1) + "m"
						break
					
					case "duration":
						statDisplay = (stat / 60).toFixed(1) + " " + localize("seconds")
						break
					
					case "speed":
						if (weapon.constructor.name == "Oscillator" || weapon.constructor.name == "Sentry")
							statDisplay = (stat / Math.PI * 10800).toFixed(1) + " °/s"
						else
							statDisplay = (stat / 10 * 60).toFixed(1) + " m/s"
						break
					
					case "critChance":
					case "critMult":
						statDisplay = (stat * 100).toFixed(1) + "%"
						break
					
					case "statusChance":
					case "kineticStatusChance":
					case "heatStatusChance":
					case "coldStatusChance":
					case "electricStatusChance":
					case "chemicalStatusChance":
						if (stat != 0)
							statDisplay = (stat * 100).toFixed(1) + "%"
						break
					
					case "farDamage":
					case "nearDamage":
					case "experience":
					case "lootChance":
					case "healthChance":
					case "coinChance":
					case "doubleDamageChance":
					case "freezeChance":
						if (stat != 0)
							statDisplay = (stat > 0 ? "+" : "") + (stat * 100).toFixed(1) + "%"
						break
				}
				if (statDisplay)
				{
					this.modifiersText.addLine(localize(mod + "_text") + ":  " + statDisplay + "\n")
					if (modifiers.getPercModifier(weapon, mod) != 0)
						this.printModifierList(Object.entries(modifiers.getPercDiscreteModifiers(weapon, mod)))
					this.modifiersText.addLine("\n")
				}
			}
		}
		this.currentPage = 0
		this.updatePage()
	}

	updatePage()
	{
		this.modifiersBody.setText(this.modifiersText[this.currentPage])
		this.modifiersPaginator.refresh()
	}

	printModifierList(discreteModifiers, abs = false)
	{
		discreteModifiers.forEach(entry => {
			let key = entry[0]
			let value = entry[1] * (abs ? 1 : 100)
			if (value != 0)
				this.modifiersText.addLine("    " + localize(key) + ":  " + (value > 0 ? "+" : "") + String(Math.round(value)) + (abs ? "" : "%") + "\n")
		})
	}

	startIntro()
	{
		if ((!ui.summaryScreen.hidden || !ui.pauseMenu.hidden) && currentFocus)
		{
			this.lastFocus = currentFocus
			currentFocus.focusEnd()
		}
		this.currentSection = 0
		this.changeSection(0)
		this.setAnimating(true)
		control.suspend(true)
		audioHandler.playAudioHookUI("weapon_details_intro")
		this.tween.easeOut({animYOffset: 0}, 40)
			.then(() => {
				this.setAnimating(false)
				control.suspend(false)
		})
		this.show()
	}

	startExtro()
	{
		this.dpsRankingEntries.forEach(dps => dps.unselect())
		this.setAnimating(true)
		control.suspend(true)
		audioHandler.playAudioHookUI("weapon_details_extro")
		this.tween.easeOut({animYOffset: Surface.Screen.height}, 40)
			.then(() => {
				this.setAnimating(false)
				control.suspend(false)
				this.hide()
				if (usingController || keyboardArrows)
				{
					if (this.lastFocus)
					{
						this.lastFocus.takeFocus()
						this.lastFocus = null
					}
					else
					{
						if (!ui.summaryScreen.hidden)
							ui.summaryScreen.panel.button.takeFocus()
						else if (!ui.pauseMenu.hidden)
							ui.pauseMenu.panel.pauseMenuButtons[0].takeFocus()
					}
				}
			})
	}
}

class ModifiersText extends Array
{
	constructor(parent)
	{
		super()
		this.currentIndex = 0
		this.parent = parent
		this.height = 0
	}

	addLine(line)
	{
		this[this.currentIndex] ? this[this.currentIndex] : this.push("")
		if (this.height + regularFontUI().height > this.parent.modifiersBody.getComputedHeight())
		{
			this.currentIndex++
			this.push("")
			this.height = 0
		}
		this[this.currentIndex] += line
		this.height += regularFontUI().height
	}
}

class WeaponCard extends UpgradeOption
{
	constructor()
	{
		super()
			.setWidth("40%")
		this.evolutionProgress.setPosition(Yoga.EDGE_BOTTOM, "7%")
		this.bottomGroup.hide()
		this.bottomBar.hide()
		this.subTitleGroup.hide()
		if (usingController)
		{
			this.triggerDesc.hide()
			this.triggerValue.hide()
			this.triggerDescQuicktime.show()
			this.triggerValueQuicktime.show()
		}
		else
		{
			this.triggerDescQuicktime.hide()
			this.triggerValueQuicktime.hide()
			this.triggerDesc.show()
			this.triggerValue.show()			
		}
	}
}

export class InstructionsArrow extends Node
{
	constructor(text)
	{
		super()
			.setWidth(typingFont.widthOf(text) + scalePix(30))
			.setHeight(scalePix(40))
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setMargin(Yoga.EDGE_RIGHT, scalePix(5))
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		this.instructionsArrowText = new Text()
			.setFont(typingFont)
			.setColor(paleYellow)
			.setTextAlign(textAlign.center)
			.setHeight(typingFont.height)
			.setWidth(typingFont.widthOf(text))
			.setText(text)
			.setChildOf(this)
	}
}

class DPSRow extends Button
{
	constructor(parent, index)
	{
		super()
			.setWidth("100%")
			.setHeight(scalePix(60))
			.setRenderMode(renderMode.colorRounded)
			.setPadding(Yoga.EDGE_HORIZONTAL, scalePix(10))
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(5))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)

		this.weaponName = new Text()
			.setWidth("60%")
			.setFont(regularFontUI())
			.setColor(darkGray)
			.setText("Weapon Name")
			.setChildOf(this)
		
		this.weaponDPS = new Text()
			.setWidth("40%")
			.setFont(regularFontUI())
			.setColor(darkGray)
			.setText("33.3 DPS")
			.setChildOf(this)
		
		this.parent = parent
		this.index = index
	}

	focusStart()
	{
		this.setTexture(secondColorDark)
		this.weaponName.setColor(paleYellow)
		this.weaponDPS.setColor(paleYellow)
		if (usingController)
			this.parent.setContext(this.index)
	}

	focusEnd()
	{
		if (!(usingController || keyboardArrows) && this.parent.currentContext == this)
		{
			this.weaponName.setColor(paleYellow)
			this.weaponDPS.setColor(paleYellow)
			this.setTexture(midGray)
		}
		else this.unselect()
	}

	unselect()
	{
		this.weaponName.setColor(darkGray)
		this.weaponDPS.setColor(darkGray)
		this.setTexture(null)
	}

	selectBottom()
	{
		if (this.bottomNext)
		{
			this.focusEnd()
			this.parent.setContext(this.parent.currentContext.index + 1)
			this.parent.currentContext.takeFocus()
		}
	}

	selectTop()
	{
		if (this.topNext)
		{
			this.focusEnd()
			this.parent.setContext(this.parent.currentContext.index - 1)
			this.parent.currentContext.takeFocus()
		}
	}

	pressShoulderButtonLeftStart() { this.parent.modifiersPaginator.changeVariable(-1) }
	pressShoulderButtonRightStart() { this.parent.modifiersPaginator.changeVariable(1) }
	pressMouseLeftStart() { this.activate() }
	activate()
	{
		this.parent.setContext(this.index)
	}
}

class Paginator extends OptionsToggle
{
	constructor()
	{
		super()
		this.name.hide()
		this.varCountBG.setTexture(null)
		this.varCountControllerLeft.setText(getQuickTimeString([direction_left]))
		this.varCountControllerRight.setText(getQuickTimeString([direction_right]))
		this.varCountKeyboardLeftText.setText("←")
		this.varCountKeyboardRightText.setText("→")
	}
	refresh()
	{
		if (ui.weaponDetail.modifiersText.length <= 1)
			this.hide()
		else
		{
			this.show()
			this.varCount.setText(`${localize("page")} ${ui.weaponDetail.currentPage + 1} / ${ui.weaponDetail.modifiersText.length}`)
			if (usingController || keyboardArrows)
			{
				this.varCountIconsLeftGroup.show()
				this.varCountIconsRightGroup.show()
				if (usingController)
				{
					this.varCountControllerLeft.show()
					this.varCountControllerRight.show()
					this.varCountKeyboardLeft.hide()
					this.varCountKeyboardRight.hide()
					this.varCountMouseLeft.hide()
					this.varCountMouseRight.hide()
				}
				else
				{
					this.varCountKeyboardLeft.show()
					this.varCountKeyboardRight.show()
					this.varCountControllerLeft.hide()
					this.varCountControllerRight.hide()
					this.varCountMouseLeft.hide()
					this.varCountMouseRight.hide()
				}
			}
			else
			{
				this.varCountIconsLeftGroup.hide()
				this.varCountIconsRightGroup.hide()
				this.varCountMouseLeft.setActive(!this.isFirstPage())
				this.varCountMouseRight.setActive(!this.isLastPage())
				this.varCountMouseLeft.show()
				this.varCountMouseRight.show()
			}
		}
	}

	isFirstPage() { return ui.weaponDetail.currentPage <= 0 }
	isLastPage() { return ui.weaponDetail.currentPage >= ui.weaponDetail.modifiersText.length - 1 }

	changeVariable(increment)
	{
		if ((increment > 0 && !this.isLastPage()) || (increment < 0 && !this.isFirstPage()))
		{
			ui.weaponDetail.currentPage += increment
			ui.weaponDetail.updatePage()
		}
	}
}