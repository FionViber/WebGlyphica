import { Yoga, Node, Text, Tween } from 'sphere-runtime'
import { TwoToneText } from './twoToneText.js'

export class LootOption extends Node
{
	constructor()
	{
		// Superclass contructor.
		super()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(paleYellow)
			.setWidth("21%")
			.setHeight("93%")
			.setPadding(Yoga.EDGE_BOTTOM, scalePix(5))
			.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(5))
			.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
		
		// Darkened bar at bottom.
		this.bottomBar = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_BOTTOM, scalePix(10))
			.setPosition(Yoga.EDGE_LEFT, "2.5%")
			.setRenderMode(renderMode.colorRounded)
			.setWidth("95%")
			.setHeight("12%")
			.setTexture(absoluteMidGray)
			.setChildOf(this)

		// ===========
		// TOP PORTION
		// ===========

		this.itemCount = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setWidth("25%")
			.setHeight(typingFont.height + scalePix(14))
			.setPosition(Yoga.EDGE_TOP, -scalePix(14))
			.setPosition(Yoga.EDGE_LEFT, "35%")
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this)
		
		this.itemCountValue = new Text()
			.setFont(typingFont)
			.setColor(paleYellow)
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setText("x3")
			.setChildOf(this.itemCount)

		this.topGroup = new Node()
			.setWidth("100%")
			.setHeight("86.5%")
			.setPadding(Yoga.EDGE_HORIZONTAL, scalePix(40))
			.setPadding(Yoga.EDGE_TOP, scalePix(30))
			.setChildOf(this)
		
		this.itemIcon = new Text()
			.setFont(lootIcons)
			.setText("")
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(-10))
			.setColor(secondColorDark)
			.setChildOf(this.topGroup)

		this.itemName = new Text()
			.setText("BULLET STORM")
			.setFont(titleFontUI())
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setColor(darkGray)
			.setChildOf(this.topGroup)
		
		this.itemRarity = new Text()
			.setText("Common")
			.setFont(smallFont())
			.setWidth("100%")
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(40))
			.setTextAlign(textAlign.center)
			.setColor(midGray)
			.setChildOf(this.topGroup)
		
		this.itemDesc = new Text()
			.setEastAsian(isUIEastAsian)
			.setWidth("100%")
			.setText("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris libero tellus, pellentesque a sapien eget, luctus viverra lacus.")
			.setFont(regularFontUI())
			.setColor(midGray)
			.setChildOf(this.topGroup)

		this.tagGroup = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setWidth("100%")
			.setPadding(Yoga.EDGE_HORIZONTAL, scalePix(40))
			.setPosition(Yoga.EDGE_BOTTOM, "0%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE)
			.setChildOf(this.topGroup)
			
		this.tagInfo = new Text()
			.setEastAsian(isUIEastAsian)
			.setText("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris libero tellus, pellentesque a sapien eget, luctus viverra lacus.")
			.setFont(smallFont())
			.setColor(midGray.fadeTo(0.5))
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(20))
			.setChildOf(this.tagGroup)
		
		this.tagDivider = new Node()
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(.5))
			.setWidth("100%")
			.setHeight(scalePix(1))
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(10))
			.setChildOf(this.tagGroup)

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
		this.name = null
		this.cost = 0
		this.tween = new Tween(this)

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
			this.quicktimeDisplay.show()
		}
		else
		{
			this.quicktimeDisplay.hide()
			this.wordDisplay.show()
			this.secondaryWordDisplay[this.nonLatinGlyphs || currentGameLanguage == "schinese" ? "show" : "hide"]()
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
		// Save item.
		serializedLoot[this.name] = serializedLoot[this.name] || 0
		serializedLoot[this.name]++

		// Execute upgrade action.
		this.action()

		// Hide loot UI.
		ui.lootScreen.startExtro()
	}

	setUpgrade(upgrade)
	{
		this.show()
		this.name = upgrade.name
		let localizedName = localize(upgrade.name)
		this.itemIcon.setText(upgrade.icon)
		this.itemName.setText(localizedName.toUpperCase())
		this.itemName.setFont(pickTitleFont(localizedName, this.getComputedWidth()))
		this.itemDesc.setText(upgrade.desc)
		
		let rarityIndex = upgrade.rarity ? upgrade.rarity : rarity.common
		this.itemRarity.setColor([midGray.fadeTo(.5), darkGray, secondColor][rarityIndex])
		this.itemRarity.setText(localize(["rarity_common", "rarity_uncommon", "rarity_rare"][rarityIndex]))

		this.action = upgrade.action
		if (upgrade.tagInfo && upgrade.tagInfo[0])
		{
			let tagInfoText = localize("tag_info_header") + "\n"
			let tagInfos = []

			// Aggregate tag info definitions.
			if (upgrade.tagInfo) tagInfos.push(upgrade.tagInfo)
			if (upgrade.tagInfo2 && (upgrade.tagInfo2[0] != upgrade.tagInfo[0])) tagInfos.push(upgrade.tagInfo2)

			// Process all defined tag infos.
			tagInfos.forEach((pair, i) => {
				let tag = pair[0]
				let stat = pair[1] ? pair[1] : null
				if (i > 0) tagInfoText += "\n"
				tagInfoText += "   " + (tag ? localize("tag_info", localize(tag)) : localize("all_weapons_text"))

				// Grab all weapons with tag and stat.
				let affected = [...allWeapons, currentTurret]
					.reduce((total, current) => {
						if (
							(tag ? [...current.constructor.nonDamageTags(), ...current.allDamageTags].includes(tag) : true) &&
							(stat ? stat == "damage" || current.mod[stat] != 0 : true)
						)
							total.push("- " + current.constructor.getName())
						return total
					}, [])

				// Print weapon names.
				tagInfoText += "\n      " + (affected.length > 0 ? affected.join("\n      ") : localize("none_text"))
			})
			this.tagInfo.setText(tagInfoText)
			this.tagInfo.show()
			this.tagDivider.show()
		}
		else
		{
			this.tagInfo.hide()
			this.tagDivider.hide()
		}

		// Get new word.
		this.refreshWord()
	}

	startIntro(delay)
	{
		this.setAnimating(true)
		audioHandler.playAudioHookUI("loot_option_intro")
		return new Promise((resolve) => {
			Sphere.sleep(delay)
			.then(() => this.tween.easeIn({animXOffset: 0}, 20)
				.then(() => {
					resolve()
					this.setAnimating(false)
				})
			)
		})
	}

	startExtro(offset, delay)
	{
		this.setAnimating(true)
		return new Promise(resolve => {
			Sphere.sleep(delay)
				.then(() => {
					this.tween.easeIn({animXOffset: offset}, 20)
						.then(() => {
							this.setAnimating(false)
							resolve()
						})
					})
			})
	}
}