import { Node, Yoga, Text, Easing } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { TwoToneText } from './twoToneText.js'

export class EvolutionComplete extends Node
{
	constructor()
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setWidth("100%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)

		this.middle = new Node()
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(0))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW_REVERSE)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setHeight("75%")
			.setChildOf(this)

		this.leftBar = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_LEFT, "10%")
			.setWidth("20%")
			.setHeight("100%")
			.setRenderMode(renderMode.color)
			.setTexture(midGray)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this)
		
		this.leftBarIconBackground = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(paleYellow)
			.setWidth("80%")
			.setHeight(titleIconsExtraLarge.height + titleFontUI().height + scalePix(30))
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.leftBar)
		
		this.leftBarIcon = new Text()
			.setFont(titleIconsExtraLarge)
			.setText("")
			.setWidth("100%")
			.setColor(secondColor)
			.setTextAlign(textAlign.center)
			.setChildOf(this.leftBarIconBackground)
		
		this.leftBarWeaponName = new Text()
			.setFont(titleFontUI())
			.setColor(darkGray)
			.setWidth("100%")
			.setText("TESLA MINES")
			.setTextAlign(textAlign.center)
			.setChildOf(this.leftBarIconBackground)

		this.leftBarTitle = new Text()
			.setFont(titleFontUI())
			.setColor(paleYellow)
			.setWidth("100%")
			.setText(localize("evolution_complete"))
			.setMargin(Yoga.EDGE_TOP, scalePix(40))
			.setTextAlign(textAlign.center)
			.setChildOf(this.leftBar)
		
		this.leftBarSubtitle = new Text()
			.setFont(regularFontUI())
			.setColor(paleYellow)
			.setWidth("100%")
			.setText(localize("select_outcome"))
			.setTextAlign(textAlign.center)
			.setChildOf(this.leftBar)
		
		this.evolutionOptionGroup = new Node()
			.setMargin(Yoga.EDGE_RIGHT, "10%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("55%")
			.setHeight("95%")
			.setChildOf(this.middle)

		this.evolutionOptions = []
		for (let i = 0; i < 2; i++)
			this.evolutionOptions.push(new EvolutionOption()
				.setChildOf(this.evolutionOptionGroup))
		
		this.opacity = 0
		this.weapon = null
		this.expTween = new FastTween(Easing.Exponential)
		this.linTween = new FastTween(Easing.Linear)
	}

	startIntro(weapon)
	{
		this.show()
		this.weapon = weapon
		bgm.fadeTo(bgm.getMusicInSet("evolutionScreen"))
		audioHandler.playAudioHookUI("evolution_complete_intro")
		pause("evolutionComplete")
		inUpgradeMenu = true
		control.suspend(true)
		this.setAnimating(true)

		// Seer.
		if ("item_seer" in serializedLoot && reroll == 0) reroll++

		// Populate evolution options.
		let opts = weightedRandom(weapon.getEvolution().filter(evo => evo.requirementsMet), 2)
		this.evolutionOptions.forEach((v, i) => v.setUpgrade(opts[i]))

		// Update UI info.
		this.leftBarIcon.setText(weapon.constructor.getIcon())
		let localizedName = weapon.constructor.getName().toUpperCase()
		this.leftBarWeaponName.setText(localizedName)
		this.leftBarWeaponName.setFont(pickTitleFont(localizedName, this.leftBarWeaponName.getComputedWidth()))

		// Animate
		this.leftBar.animYOffset = -Surface.Screen.height * 1.2
		let promises = []
		this.evolutionOptions.forEach((v, i) => {
			v.animXOffset = this.getComputedWidth() - v.getComputedLeft()
			promises.push(v.startIntro(25 + i * 10))
		})
		Promise.all([
			...promises,
			this.expTween.easeIn([-Surface.Screen.height * 1.2], [0], t => this.leftBar.animYOffset = t[0], 35),
			this.linTween.easeIn([0], [.4], t => this.middle.setTexture(midGray.fadeTo(t[0])), 50),
			new Promise(resolve => Sphere.sleep(10).then(() => ui.setHUDState("menu").then(() => resolve())))
		]).then(() => {
			control.suspend(false)
			this.setAnimating(false)
		})
	}

	startExtro(forceClose = false)
	{
		this.weapon = null
		control.suspend(true)
		audioHandler.playAudioHookUI("evolution_complete_extro")
		this.setAnimating(true)

		let promises = []
		for (let i = 0; i < this.evolutionOptions.length; i++)
			promises.push(this.evolutionOptions[this.evolutionOptions.length - 1 - i].startExtro(i * 20))
		promises.push(new Promise(resolve => {
			Sphere.sleep(10).then(() => {
				this.expTween.easeIn([0], [-Surface.Screen.height * 1.2], t => this.leftBar.animYOffset = t[0], 35)
					.then(() => resolve())
			})
		}))
		Promise.all([
			...promises,
			this.linTween.easeIn([.4], [0], t => this.middle.setTexture(midGray.fadeTo(t[0])), 40),
			new Promise(resolve => Sphere.sleep(10).then(() => ui.setHUDState("game").then(() => resolve())))
		]).then(() => {
			control.suspend(false)
			clearMenuWords()
			this.setAnimating(false)
			this.hide()
			bgm.resume()
			unpause("evolutionComplete")
			inUpgradeMenu = false
			if (!forceClose)
			{
				if (pendingEvolution.length > 0)
					getExistingWeapon(pendingEvolution.pop()).triggerEvolution()
				else if (levelUpCount > 0)
					levelUp()
			}
		})
	}

	render(surface, xOffset = 0, yOffset = 0)
	{
		super.render(surface, xOffset, yOffset)
		if (this.animating)
		{
			let pt1 = {x: this.leftBar.getComputedLeft(), y: this.leftBar.animYOffset + Surface.Screen.height}
			let pt2 = Vector.add(pt1, {x: this.leftBar.getComputedWidth(), y: 0})
			let pt3 = Vector.add(pt2, {x: 0, y: .2 * Surface.Screen.height})
			PrimNative.drawFilledTriangle(surface, pt1.x, pt1.y, pt2.x, pt2.y, pt3.x, pt3.y, midGray)
		}
	}

	reroll()
	{
		control.suspend(true)

		// Animate out the options.
		let animPromises = []
		for (let i = 0; i < this.evolutionOptions.length; i++)
			animPromises.push(this.evolutionOptions[this.evolutionOptions.length - 1 - i].startExtro(i * 10))
		Promise.all(animPromises).then(() => {

			// Populate evolution options.
			clearMenuWords()
			let opts = weightedRandom(this.weapon.getEvolution().filter(evo => evo.requirementsMet), 2)
			this.evolutionOptions.forEach((v, i) => v.setUpgrade(opts[i]))

			// Animate in the options.
			animPromises = []
			this.evolutionOptions.forEach((v, i) => {
				animPromises.push(v.startIntro(i * 10))
			})
			Promise.all(animPromises).then(() => control.suspend(false))
		})
	}
}

class EvolutionOption extends Node
{
	constructor()
	{
		super()
			.setWidth("48%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		this.iconBackground = new IconBackgroundClass()
			.setChildOf(this)

		this.evolutionOptionDetails = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setRenderMode(renderMode.colorRounded)
			.setTexture(paleYellow)
			.setHeight("85%")
			.setWidth("100%")
			.setMargin(Yoga.EDGE_TOP, "23%")
			.setChildOf(this)
		
		this.evolutionOptionIcon = new Text()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_TOP, "1%")
			.setFont(evolutionIcons)
			.setColor(secondColor)
			.setText("")
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setChildOf(this)
		
		this.evolutionOptionName = new Text()
			.setWidth("100%")
			.setFont(titleFontUI())
			.setTextAlign(textAlign.center)
			.setColor(darkGray)
			.setText("RESEARCH NAME")
			.setMargin(Yoga.EDGE_TOP, "18%")
			.setMargin(Yoga.EDGE_BOTTOM, "5%")
			.setChildOf(this.evolutionOptionDetails)
		
		this.evolutionTriggerValues = new Node()
			.setWidth("80%")
			.setChildOf(this.evolutionOptionDetails)
		
		this.evolutionTriggerDesc = new Text()
			.setEastAsian(isUIEastAsian)
			.setWidth("100%")
			.setFont(regularFontUI())
			.setColor(midGray)
			.setText("Words starting with:")
			.setChildOf(this.evolutionTriggerValues)
		
		this.evolutionTriggerDescQuicktime = new Text()
			.setEastAsian(isUIEastAsian)
			.setWidth("100%")
			.setFont(regularFontUI())
			.setColor(midGray)
			.setText("Words starting with:")
			.setChildOf(this.evolutionTriggerValues)

		this.evolutionTriggerValue = new Text()
			.setText("a, e, i, o, u")
			.setFont(currentGameLanguage == "koreana" ? regularEastAsianLarge : typingFontLarge)
			.setWidth("100%")
			.setColor(midGray)
			.setMargin(Yoga.EDGE_VERTICAL, scalePix(30))
			.setTextAlign(textAlign.center)
			.setChildOf(this.evolutionTriggerValues)
		
		this.evolutionTriggerValueQuicktime = new Text()
			.setFont(quicktimeFont)
			.setWidth("100%")
			.setColor(midGray)
			.setMargin(Yoga.EDGE_VERTICAL, scalePix(30))
			.setTextAlign(textAlign.center)
			.setChildOf(this.evolutionTriggerValues)
		
		this.evolutionOptionDesc = new Text()
			.setEastAsian(isUIEastAsian)
			.setWidth("80%")
			.setFont(regularFontUI())
			.setColor(midGray)
			.setText("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi cursus neque augue, vitae viverra magna rhoncus sit amet.")
			.setChildOf(this.evolutionOptionDetails)
		
		this.bottomGroup = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_BOTTOM, "3%")
			.setRenderMode(renderMode.colorRounded)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE)
			.setTexture(absoluteMidGray)
			.setHeight("12%")
			.setWidth("80%")
			.setChildOf(this.evolutionOptionDetails)

		this.wordDisplay = new TwoToneText(this)
			.setFont(isEastAsianPrimaryDisplay ? titleEastAsian : grandRegular)
			.setColor(paleYellow)
			.setColor2(darkestGray)
			.setTextAlign(textAlign.center)
			.setWidth("100%")
			.setMargin(Yoga.EDGE_TOP, "-2%")
			.setChildOf(this.bottomGroup)

		this.secondaryWordDisplay = new TwoToneText()
			.setWidth("100%")
			.setFont(currentGameLanguage == "schinese" ? typingFontSmall : regularEastAsianMedium)
			.setColor(paleYellow)
			.setColor2(darkestGray)
			.setTextAlign(textAlign.center)
			.setMargin(Yoga.EDGE_BOTTOM, currentGameLanguage == "schinese" ? "-1%" : "-2%")
			.setChildOf(this.bottomGroup)

		this.quicktimeDisplay = new TwoToneText(this)
			.setWidth("100%")
			.setFont(quicktimeFontLarge)
			.setColor(paleYellow)
			.setColor2(darkestGray)
			.setTextAlign(textAlign.center)
			.setChildOf(this.bottomGroup)
		
		// Declare vars.
		this.word = ""
		this.quicktime = []
		this.numMatchingLetters = 0
		this.numMatchingQuicktimeSymbols = 0
		this.action = null
		this.reference = null
		this.tween = new FastTween()
	}

	setUpgrade(upgrade)
	{
		if (upgrade)
		{
			this.show()
			this.evolutionOptionName.setText(localize(upgrade.name))
			this.evolutionOptionDesc.setText(upgrade.desc)
			this.evolutionOptionIcon.setText(upgrade.icon)
			this.reference = upgrade.reference
			this.action = upgrade.effect
			this.serializedUpgrade = JSON.stringify([upgrade.reference.constructor.name, "evolution", upgrade.name])

			// Show triggers if any.
			if ("triggerValue" in upgrade)
			{
				let triggerLetters = currentGameLanguage == "koreana" ? 
					upgrade.triggerValue
						.split(", ")
						.reduce((result, char) => { result.push(Object.keys(koreanToQwerty).find(key => koreanToQwerty[key] == char)); return result }, [])
						.join(", ") :
					upgrade.triggerValue
				this.evolutionTriggerValues.show()
				this.evolutionTriggerDesc.setText(upgrade.triggerDesc)
				this.evolutionTriggerDescQuicktime.setText(upgrade.triggerDescQuicktime)
				this.evolutionTriggerValue.setText(triggerLetters)
				this.evolutionTriggerValueQuicktime.setText(upgrade.triggerValueQuicktime)
			}
			else
				this.evolutionTriggerValues.hide()

			// Refresh word/quicktime for selection.
			this.refreshWord()
		}
		else this.hide()
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

	getType()
	{
		return "Upgrade"
	}

	updateWordDisplay(which) // 0 = word; 1 = quicktime; 2 = all
	{
		// Show word or quicktime?
		if (usingController)
		{
			this.wordDisplay.hide()
			this.secondaryWordDisplay.hide()
			this.evolutionTriggerDesc.hide()
			this.evolutionTriggerValue.hide()
			this.quicktimeDisplay.show()
			this.evolutionTriggerDescQuicktime.show()
			this.evolutionTriggerValueQuicktime.show()
		}
		else
		{
			this.quicktimeDisplay.hide()
			this.evolutionTriggerDescQuicktime.hide()
			this.evolutionTriggerValueQuicktime.hide()
			this.wordDisplay.show()
			this.secondaryWordDisplay[this.nonLatinGlyphs || currentGameLanguage == "schinese" ? "show" : "hide"]()
			this.evolutionTriggerDesc.show()
			this.evolutionTriggerValue.show()			
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

	triggerUpgrade()
	{
		this.action(this.reference)
		if ("augment_fortress" in activeAugments &&
			this.reference.constructor.nonDamageTags().includes("tag_turret"))
		{
			currentTurret.currentHealth += activeAugments["augment_fortress"] * 50
			currentTurret.health += activeAugments["augment_fortress"] * 50
		}
		serializedUpgrades.push(JSON.parse(this.serializedUpgrade))
		ui.hud.bottom.addEvolution(this.reference)
		ui.evolutionComplete.startExtro()
	}

	startIntro(delay)
	{
		this.setAnimating(true)
		return new Promise((resolve) => {
			Sphere.sleep(delay).then(() => {
				this.tween.easeIn([this.animXOffset], [0], t => this.animXOffset = t[0], 20)
					.then(() => {
						this.setAnimating(false)
						resolve()
					})
			})
		})
	}

	startExtro(delay)
	{
		this.setAnimating(true)
		return new Promise(resolve => {
			Sphere.sleep(delay).then(() => {
				this.tween.easeIn([0], [Surface.Screen.width - this.getComputedLeft()], t => this.animXOffset = t[0], 20)
					.then(() => {
						this.setAnimating(false)
						resolve()
					})
			})
		})
	}
}

class IconBackgroundClass extends Node
{
	constructor()
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth(evolutionIcons.height + scalePix(20))
			.setHeight(evolutionIcons.height + scalePix(20))
	}

	render(surface, xOffset = 0, yOffset = 0)
	{
		PrimNative.drawFilledCircle (
			Surface.Screen,
			xOffset + this.getComputedLeft() + this.getComputedWidth() / 2,
			yOffset + this.getComputedTop() + this.getComputedHeight() / 2,
			this.getComputedWidth() / 2,
			paleYellow
		)
		super.render(surface, xOffset, yOffset)
	}
}