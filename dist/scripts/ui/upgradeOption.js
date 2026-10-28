import { Yoga, Node, Text } from 'sphere-runtime'
import { TwoToneText } from './twoToneText.js'
import { WeaponTag } from './weaponTag.js'

export class UpgradeOption extends Node
{
	constructor()
	{
		// ==========
		// BACKGROUND
		// ==========

		super()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(paleYellow)
			.setWidth("29%")
			.setHeight("93%")
			.setPadding(Yoga.EDGE_BOTTOM, scalePix(5))
			.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(5))
			.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)

		// Darkened bar at bottom.
		this.bottomBar = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_BOTTOM, 10)
			.setPosition(Yoga.EDGE_LEFT, "2.5%")
			.setRenderMode(renderMode.colorRounded)
			.setWidth("95%")
			.setHeight("11.5%")
			.setTexture(absoluteMidGray)
			.setChildOf(this)
		
		// ===========
		// TOP PORTION
		// ===========

		this.topGroup = new Node()
			.setPadding(Yoga.EDGE_HORIZONTAL, scalePix(43))
			.setPadding(Yoga.EDGE_TOP, scalePix(50))
			.setChildOf(this)

		this.subTitleGroup = new Node()
			.setWidth("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.topGroup)
		
		this.subTitleIcon = new Text()
			.setFont(interfaceIcons)
			.setColor(midGray)
			.setWidth(interfaceIcons.widthOf("&"))
			.setMargin(Yoga.EDGE_RIGHT, scalePix(10))
			.setText("&")
			.setHeight(interfaceIcons.height)
			.setChildOf(this.subTitleGroup)

		this.subTitle = new Text()
			.setText("UpgradeType")
			.setFont(regularFontUI())
			.setColor(midGray)
			.setWidth("90%")
			.setHeight(regularFontUI().height)
			.setChildOf(this.subTitleGroup)

		this.titleGroup = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(5))
			.setChildOf(this.topGroup)
		
		this.icon = new Text()
			.setFont(titleIcons)
			.setText("")
			.setWidth("20%")
			.setColor(secondColorDark)
			.setMargin(Yoga.EDGE_TOP, "1.5%")
			.setChildOf(this.titleGroup)

		this.title = new Text()
			.setEastAsian(isUIEastAsian)
			.setText("UPGRADE")
			.setFont(titleFontUI())
			.setWidth("80%")
			.setColor(darkGray)
			.setChildOf(this.titleGroup)
		
		this.tags = new Node()
			.setWidth("100%")
			.setFlexWrap(Yoga.FLEX_FLEX)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setChildOf(this.topGroup)
		
		this.upgradeNameGroup = new Node()
			.setWidth("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setChildOf(this.topGroup)
		
		this.upgradeRarityGroup = new Node()
			.setWidth("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setMargin(Yoga.EDGE_TOP, scalePix(50))
			.setChildOf(this.upgradeNameGroup)

		this.upgradeRarityIcon = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setMargin(Yoga.EDGE_RIGHT, "3%")
			.setWidth("6%")
			.setChildOf(this.upgradeRarityGroup)
		
		this.upgradeRarityIconText = new Text()
			.setHeight(typingFontSmall.height)
			.setFont(typingFontSmall)
			.setColor(paleYellow)
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setChildOf(this.upgradeRarityIcon)
		
		this.upgradeRarityText = new Text()
			.setText("UpgradeRarity")
			.setFont(smallFont())
			.setWidth("94%")
			.setColor(secondColor)
			.setChildOf(this.upgradeRarityGroup)
		
		this.upgradeName = new Text()
			.setText("UpgradeName")
			.setFont(regularFontUI())
			.setColor(midGray)
			.setMargin(Yoga.EDGE_TOP, scalePix(5))
			.setChildOf(this.upgradeNameGroup)

		this.triggerValues = new Node()
			.setChildOf(this.topGroup)
		
		this.triggerDesc = new Text()
			.setEastAsian(isUIEastAsian)
			.setText("TriggerDesc")
			.setFont(regularFontUI())
			.setColor(midGray)
			.setMargin(Yoga.EDGE_TOP, scalePix(50))
			.setChildOf(this.triggerValues)
		
		this.triggerDescQuicktime = new Text()
			.setEastAsian(isUIEastAsian)
			.setText("TriggerDescQuicktime")
			.setFont(regularFontUI())
			.setColor(midGray)
			.setMargin(Yoga.EDGE_TOP, scalePix(50))
			.setChildOf(this.triggerValues)
		
		this.triggerValue = new Text()
			.setText("a, e, i, o, u")
			.setFont(currentGameLanguage == "koreana" ? regularEastAsianLarge : typingFontLarge)
			.setColor(midGray)
			.setMargin(Yoga.EDGE_TOP, scalePix(30))
			.setTextAlign(textAlign.center)
			.setChildOf(this.triggerValues)
		
		this.triggerValueQuicktime = new Text()
			.setFont(quicktimeFont)
			.setText("")
			.setColor(midGray)
			.setMargin(Yoga.EDGE_TOP, scalePix(30))
			.setTextAlign(textAlign.center)
			.setChildOf(this.triggerValues)
		
		this.desc = new Text()
			.setEastAsian(isUIEastAsian)
			.setText("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris libero tellus, pellentesque a sapien eget, luctus viverra lacus.")
			.setFont(regularFontUI())
			.setColor(midGray)
			.setMargin(Yoga.EDGE_TOP, scalePix(50))
			.setChildOf(this.topGroup)
		
		this.evolutionProgress = new EvolutionProgress()
			.setChildOf(this)
		
		// ==============
		// BOTTOM PORTION
		// ==============

		this.bottomGroup = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_BOTTOM, "2%")
			.setWidth("100%")
			.setHeight("11%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this)
		
		this.wordDisplay = new TwoToneText(this)
			.setWidth("100%")
			.setFont(isEastAsianPrimaryDisplay ? titleEastAsian : grandRegular)
			.setColor(paleYellow)
			.setColor2(darkestGray)
			.setTextAlign(textAlign.center)
			.setChildOf(this.bottomGroup)
		
		this.secondaryWordDisplay = new TwoToneText()
			.setWidth("100%")
			.setFont(currentGameLanguage == "schinese" ? typingFontSmall : regularEastAsianMedium)
			.setColor(paleYellow)
			.setColor2(darkestGray)
			.setTextAlign(textAlign.center)
			.setMargin(Yoga.EDGE_BOTTOM, currentGameLanguage == "schinese" ? "-3%" : "-4%")
			.setChildOf(this.bottomGroup)

		this.quicktimeDisplay = new TwoToneText(this)
			.setWidth("100%")
			.setFont(quicktimeFontLarge)
			.setColor(paleYellow)
			.setColor2(darkestGray)
			.setMargin(Yoga.EDGE_BOTTOM, "-3%")
			.setTextAlign(textAlign.center)
			.setChildOf(this.bottomGroup)

		// Declare vars.
		this.word = ""
		this.quicktime = []
		this.numMatchingLetters = 0
		this.numMatchingQuicktimeSymbols = 0
		this.action = null
		return this
	}

	refreshWord()
	{
		addWord(this, true, 5)
		if (this.nonLatinGlyphs)
		{
			this.secondaryWordDisplay.setText(this.nonLatinGlyphs)
			this.secondaryWordDisplay.setIndex(0)
		}
		else this.secondaryWordDisplay.setText("")
		this.quicktimeDisplay.setText(getQuickTimeString(this.quicktime))
		this.updateWordDisplay(2)
	}

	updateWordDisplay(which) // 0 = word; 1 = quicktime; 2 = all
	{
		// Show word or quicktime?
		if (usingController)
		{
			this.wordDisplay.hide()
			this.secondaryWordDisplay.hide()
			this.triggerDesc.hide()
			this.triggerValue.hide()
			this.quicktimeDisplay.show()
			this.triggerDescQuicktime.show()
			this.triggerValueQuicktime.show()
		}
		else
		{
			this.quicktimeDisplay.hide()
			this.triggerDescQuicktime.hide()
			this.triggerValueQuicktime.hide()
			this.wordDisplay.show()
			this.secondaryWordDisplay[this.nonLatinGlyphs || currentGameLanguage == "schinese" ? "show" : "hide"]()
			this.triggerDesc.show()
			this.triggerValue.show()			
		}

		// Numbers of letters matched (to check mistype).
		let numMatched = 0

		// Count how many characters match in both word and quicktime sequence.
		// Word.
		if (which == 0 || which == 2)
		{
			let matchedVariant = countMatchAllVariants(this.wordVariants, Keylog)
			let word, match
			if (isEastAsianPrimaryDisplay)
			{
				word = this.word
				match = matchedVariant.match
			}
			else
			{
				word = matchedVariant.word || this.wordVariants[0].word
				match = matchedVariant.matchActual
			}
			numMatched = matchedVariant.match
			this.wordDisplay.setText(word)
			this.wordDisplay.setIndex(match) 

			// Set Simplified Chinese secondary display.
			if (currentGameLanguage == "schinese")
			{
				let displayedPinyin = matchedVariant.word || this.wordVariants[0].word
				let variantObj = this.wordVariants.find(variant => variant.word == displayedPinyin)
				let characterCount = 0
				for (let i = 0; i < variantObj.increments.length - 1; i++)
				{
					let v = variantObj.increments[i]
					characterCount += v
					displayedPinyin = displayedPinyin.slice(0, characterCount + i) + " " + displayedPinyin.slice(characterCount + i)
				}
				this.secondaryWordDisplay.setText(displayedPinyin)
				this.secondaryWordDisplay.setIndex(matchedVariant.matchActual + Math.floor(matchedVariant.match))
			}
			
			if (numMatched == this.word.length)
				control.wordInput(this.word)
		}

		// Quicktime sequence.
		if (which == 1 || which == 2)
		{
			numMatched = countMatch(this.quicktime, Joylog)
			this.quicktimeDisplay.setIndex(numMatched)
			if (numMatched == this.quicktime.length)
				control.wordInput(this.word)
		}

		// Recalculate layout.
		ui.calculateLayout()

		// Return if mistype.
		return (which < 2) ? !numMatched : null
	}

	getType()
	{
		return "Upgrade"
	}

	triggerUpgrade()
	{
		// Upgrade
		if (this.reference)
		{
			this.action(this.reference)
			ui.hud.bottom.addUpgrade(this.reference)
		}
		else
			this.action()

		// Save in serialized upgrades.
		serializedUpgrades.push(JSON.parse(this.serializedUpgrade))

		// Hide UI
		ui.upgradeScreen.startExtro()
	}

	setUpgrade(upgrade, noWord = false)
	{
		// If upgrade to existing weapon.
		this.show()
		if ("base" in upgrade)
		{
			this.icon.setText(upgrade.icon)
			let localizedName = localize(upgrade.base).toUpperCase()
			this.title.setText(localizedName)
			this.title.setFont(pickTitleFont(localizedName, this.title.getComputedWidth()))
			this.subTitleIcon.setText("(")
			this.subTitle.setText(localize("upgrade_upgrade"))
			this.tags.removeAllChildren()
			if (upgrade.showEvolution)
			{
				this.evolutionProgress.show()
				this.evolutionProgress.setEvolution(upgrade.reference)
			}
			else this.evolutionProgress.hide()
			let weaponTags = [upgrade.reference.primaryDamageTag, ...upgrade.reference.constructor.nonDamageTags()]
			for (const tag of weaponTags)
			{
				let tagNode = new WeaponTag(tag)
				tagNode.setChildOf(this.tags)
			}
			this.upgradeNameGroup.show()
			this.upgradeName.setText(localize(upgrade.name))
			let rarityIndex = "rarity" in upgrade ? upgrade.rarity : rarity.common
			let rarity = ["rarity_common", "rarity_uncommon", "rarity_rare"][rarityIndex]
			this.upgradeRarityIconText.setText(["-", "=", "≡"][rarityIndex])
			this.upgradeRarityText.setColor([midGray.fadeTo(.5), darkGray, secondColor][rarityIndex])
			this.upgradeRarityText.setText(localize(rarity).toUpperCase())
			if (upgrade.descBlock)
				this.desc.setText(upgrade.desc)
			else
				this.desc.setText(localize("effects") + "\n" + upgrade.desc)
			this.action = upgrade.effect
			this.reference = upgrade.reference
			this.serializedUpgrade = JSON.stringify([upgrade.reference.constructor.name, "upgrade", upgrade.name])
		}

		// If new weapon.
		else
		{
			this.icon.setText(upgrade.icon)
			let localizedName = localize(upgrade.name).toUpperCase()
			this.title.setText(localizedName)
			this.title.setFont(pickTitleFont(localizedName, this.title.getComputedWidth()))
			this.subTitleIcon.setText("&")
			this.subTitle.setText(localize("upgrade_new"))
			this.tags.removeAllChildren()
			this.evolutionProgress.hide()
			for (const tag of upgrade.tags)
			{
				let tagNode = new WeaponTag(tag)
				tagNode.setChildOf(this.tags)
			}
			this.upgradeNameGroup.hide()
			this.desc.setText(upgrade.desc)
			this.action = upgrade.effect
			this.reference = null
			this.serializedUpgrade = JSON.stringify([upgrade.class])
		}

		// Show triggers if any.
		if ("triggerValue" in upgrade)
		{
			this.triggerValues.show()

			// Grab trigger letters.
			let triggerLetters = currentGameLanguage == "koreana" ? 
				upgrade.triggerValue
					.split(", ")
					.reduce((result, char) => { result.push(Object.keys(koreanToQwerty).find(key => koreanToQwerty[key] == char)); return result }, [])
					.join(", ") :
				upgrade.triggerValue
			this.triggerDesc.setText(upgrade.triggerDesc)
			this.triggerDescQuicktime.setText(upgrade.triggerDescQuicktime)
			this.triggerValue.setText(triggerLetters)
			this.triggerValueQuicktime.setText(upgrade.triggerValueQuicktime)
		}
		else
			this.triggerValues.hide()

		// Get new word.
		if (!noWord) this.refreshWord()
	}
}

class EvolutionProgress extends Node
{
	constructor()
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_BOTTOM, "15%")
			.setPosition(Yoga.EDGE_LEFT, "15%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setWidth("70%")
			.setHeight("5%")
			.hide()
		
		this.evolutionHeader = new Text()
			.setWidth("100%")
			.setHeight(smallFont().height)
			.setFont(smallFont())
			.setText("Evolution: 37 / 50 Kills")
			.setColor(midGray.fadeTo(.75))
			.setChildOf(this)
		
		this.percent = .4
		return this
	}

	render(surface, xOffset = 0, yOffset = 0)
	{
		super.render(surface, xOffset, yOffset)
		if (!this.hidden)
			drawProgress(
				xOffset + this.getComputedLeft(),
				yOffset + this.getComputedTop() + this.getComputedHeight() * .8,
				this.getComputedWidth(),
				this.getComputedHeight() / 5,
				this.percent,
				false
			)
	}

	setEvolution(weapon)
	{
		if (weapon.evolutionLevel < 4)
		{
			let current = weapon.currentEvolution
			let max = weapon.maxEvolution
			this.evolutionHeader.setText(localize("evolution_counter", current, max))
			this.percent = current / max
		}
		else
		{
			this.evolutionHeader.setText(localize("evolution_counter_max"))
			this.percent = 1.0
		}
	}
}