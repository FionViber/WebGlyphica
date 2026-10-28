import { Task, Random, Prim } from 'sphere-runtime'
import { Sparkle } from "../effects/sparkle.js"
import { Damage } from '../effects/damage.js'
import { FieldIntel } from '../data/augmentsList.js'

export class Pickup extends Task
{
	getType() { return type.pickup }
	constructor()
	{
		// Superclass constructor.
		super()

		// Declare vars.
		this.cyphered = false
		this.numMatchingLetters = 0
		this.numMatchingQuicktimeSymbols = 0
		this.progressOffset = scalePix(30)
		this.progressWidth = scalePix(50)
		this.progressHeight = scalePix(3)
		this.timer = 100

		// Word stuff.
		this.wordOffset = scalePix(40)
		this.wordLength = 4
	}

	getPosition()
	{
		return this.position
	}

	reset(x, y, countAsPickup = true)
	{
		// Reset cyphered status.
		this.cyphered = false

		// Track current pickups on screen.
		this.countAsPickup = countAsPickup
		if (countAsPickup) pickupCount++
		currentPickups.push(this)

		this.refreshWord()
		this.position = Vector.create(x, y)
		this.setTimer(this.timer)
		this.start()
	}

	on_activate() {}
	activate()
	{
		// Regeneration loot.
		if ("item_regeneration" in serializedLoot && this.countAsPickup)
			currentTurret.addHealth(Math.round(currentTurret.health / 20))
	
		// If Field Intel augment.
		if ("augment_fieldIntel" in activeAugments)
			(powerups.find(powerup => powerup.constructor.name == "FieldIntel") || factory.spawn(FieldIntel, 600)).refresh()

		this.on_activate()
	}

	showEffect(string, localize)
	{
		string = localize ? global.localize(string) : string
		factory.spawn(Damage, this.position.x, this.position.y - scalePix(40), string, false, localize, true)
	}

	setTimer(time)
	{
		this.currentProgress = time
		this.timer = time
	}

	on_update()
	{
		if (!isPaused())
			if (--this.currentProgress <= 0)
				this.expire()

		if (this.cyphered)
			if (!(boss && boss.constructor.name == "Cypher") || distanceBetween(this.getPosition(), boss.getPosition()) > boss.range)
				{
					this.cyphered = false
					this.updateWordDisplay(2)
				}
	}

	expire()
	{
		"item_pickupMagnet" in serializedLoot && Random.chance(.5) ? this.activate() : this.on_expire()
		this.stop()
	}
	on_expire() {}	// Designed to be overwritten by subclasses.

	suspend()
	{
		if (this.running)
			this.stop()
	}

	on_shutDown()
	{
		if (this.countAsPickup) pickupCount--
		currentPickups.splice(currentPickups.indexOf(this), 1)
		removeWord(this)
	}

	refreshWord()
	{
		if (this.hasOwnProperty('word'))
			removeWord(this)
		addWord(this, false, this.wordLength)
		this.updateWordDisplay(2)
	}

	// Make it sparkle!
	spawnSparkle()
	{
		factory.spawn(Sparkle, Random.uniform(this.position.x, scalePix(25)), this.position.y)
		if (this.running)
			Sphere.sleep(5).then(() => {
				this.spawnSparkle()
			})
	}

	updateWordDisplay(which, clearInactive = false) { return control.updateWordDisplay(this, which, clearInactive) }

	printToScreen(string, matching, font)
	{
		// Get matched and unmatched parts of the string.
		let partialMatch = matching % 1
		matching = partialMatch == 0 ? matching : Math.floor(matching)
		let matchedString = string.slice(0, matching)
		let partialMatchedString = partialMatch > 0 ? string.slice(matching, matching + 1) : ""
		let unmatchedString = string.slice(matching + (partialMatch > 0))

		// Get offsets.
		let xOffset = Math.round(font.widthOf(string) / 2)
		let yOffset = Math.round(font.height / 2)

		// Clear word surface.
		pickupWordSurface.clear()
		pickupWordSurface.blendOp = BlendOp.Default

		// Print rounded rect to surface
		let centerX = pickupWordSurface.width / 2
		let centerY = pickupWordSurface.height / 2
		PrimNative.drawFilledRoundedRectangle(
			pickupWordSurface,
			centerX - xOffset - scalePix(10),
			centerY - yOffset - scalePix(5),
			centerX + xOffset + scalePix(10),
			centerY + yOffset + scalePix(5),
			scalePix(5), scalePix(5),
			midGray.fadeTo(ui.inGameWordOpacity)
		)

		// Change BlendOp
		pickupWordSurface.blendOp = BlendOp.Subtract

		// Print unmatched text onto surface.
		font.drawText(
			pickupWordSurface,
			centerX - xOffset + font.widthOf(matchedString + partialMatchedString),
			centerY - yOffset,
			unmatchedString,
			Color.Black
		)

		// Print partial unmatched text onto surface.
		if (partialMatch > 0 && this.wordSurface)
		{
			let partialMatchedStringWidth = font.widthOf(partialMatchedString) * partialMatch
			Prim.blitSection(
				pickupWordSurface,
				centerX - xOffset + font.widthOf(matchedString) + partialMatchedStringWidth,
				centerY - yOffset,
				this.wordSurface,
				font.widthOf(matchedString) + partialMatchedStringWidth,
				0,
				font.widthOf(partialMatchedString) - partialMatchedStringWidth,
				font.height,
				Color.Black
			)
		}

		// Lower opacity of rounded rectangle by half.
		pickupWordMaskShape.draw(pickupWordSurface, Transform.Identity)

		// Print surface to screen.
		pickupWordShape.draw(
			Surface.Screen,
			Transform.translate(
				this.position.x,
				this.position.y - this.wordOffset - yOffset
			)
		)

		// Print matched text.
		font.drawText(
			Surface.Screen,
			this.position.x - xOffset,
			this.position.y - this.wordOffset - font.height,
			matchedString,
			darkGray.fadeTo(ui.inGameWordOpacity)
		)

		// Print partial matched text onto screen.
		if (partialMatch > 0 && this.wordSurface)
		{
			Prim.blitSection(
				Surface.Screen,
				this.position.x - xOffset + font.widthOf(matchedString),
				this.position.y - this.wordOffset - font.height,
				this.wordSurface,
				font.widthOf(matchedString),
				0,
				font.widthOf(partialMatchedString) * partialMatch,
				font.height,
				darkGray.fadeTo(ui.inGameWordOpacity)
			)
		}
	}

	renderWordAndProgress(skipProgress = false)
	{
		// Draw timer progress bar.
		if (!skipProgress)
			drawProgress(
				this.position.x,
				this.position.y + this.progressOffset,
				this.progressWidth,
				this.progressHeight,
				this.currentProgress / this.timer
			)
		
		// Print quicktime sequence on screen.
		if (usingController)
			this.printToScreen(
				getQuickTimeString(this.cyphered ? this.cypherQuicktimeString : this.quicktime),
				this.numMatchingQuicktimeSymbols,
				quicktimeFont
			)

		// Else, print word on screen.
		else
		{
			// Exception for Korean.
			let font, word, matchingLetters
			if (currentGameLanguage == "koreana")
			{
				font = regularEastAsianLarge
				if (this.cyphered)
				{
					word = this.cypherGlitchEffectCountdown <= 0 ?
						[...Array(this.variantString.length)].map(() => Random.sample(Object.keys(koreanToQwerty))).join("") :
						Array.from(this.variantString).map(char => qwertyToKorean[char]).join("")
					matchingLetters = this.variantMatches
				}
				else
				{
					word = this.word
					matchingLetters = this.numMatchingLetters
				}
			}

			// If East Asian primary display.
			else if (isEastAsianPrimaryDisplay && !this.cyphered)
			{
				font = regularEastAsianLarge
				word = this.word
				matchingLetters = this.numMatchingLetters
			}

			// All other languages.
			else
			{
				font = typingFontLarge
				word = this.cyphered && this.cypherGlitchEffectCountdown <= 0 ? 
					[...Array(this.variantString.length)].map(() => Random.sample(alphabets)).join("") :
					this.variantString
				matchingLetters = this.variantMatches
			}

			// Print east Asian glyphs above word, if any.
			if (this.nonLatinGlyphs && !this.cyphered)
				regularEastAsianMedium.drawText(
					Surface.Screen,
					this.position.x - regularEastAsianMedium.widthOf(this.nonLatinGlyphs) / 2,
					this.position.y - this.wordOffset - font.height - regularEastAsianMedium.height - scalePix(7),
					this.nonLatinGlyphs,
					midGray.fadeTo(.5 * ui.inGameWordOpacity)
				)
			
			// Print word.
			this.printToScreen(word, matchingLetters, font, font.widthOf(word) / 2, font.height / 2)

			// If current game language is Simplified Chinese, also print pinyin.
			if (!this.cyphered && currentGameLanguage == "schinese" && this.displayedPinyin)
			{
				let yPos = this.position.y - this.wordOffset - font.height - typingFontMedium.height - scalePix(5)
				let xPos = this.position.x - typingFontMedium.widthOf(this.displayedPinyin) / 2
				let matchCount = this.variantMatches + Math.floor(this.numMatchingLetters)
				let matchedPinyin = this.displayedPinyin.slice(0, matchCount)
				let unmatchedPinyin = this.displayedPinyin.slice(matchCount)
				typingFontMedium.drawText(Surface.Screen, xPos, yPos, matchedPinyin, darkGray)
				typingFontMedium.drawText(Surface.Screen, xPos + typingFontMedium.widthOf(matchedPinyin), yPos, unmatchedPinyin, midGray.fadeTo(.5))
			}
		}
	}
}