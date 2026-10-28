import { Random, Easing, from, Matter } from 'sphere-runtime'
import { Entity } from '../core/entityFactory.js'
import { FastTween } from '../core/fastTween.js'

export class Poet extends Entity
{
	static getName() { return localize("boss_poet") }
	static getDesc() { return localize("boss_poet_desc") }
	static getBGM() { return bgm.getMusicInSet("boss_poet") }
	
	constructor()
	{
		super()
		this.typeable = /[abcdefghijklmnopqrstuvwxyzßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿāăąćĉċčďđēĕėęěĝğġģĥħĩīĭįıĳĵķĸĺļľŀłńņňŋōŏőœŕŗřśŝşšţťŧũūŭůűųŵŷźżžſ]+/g
		this.extract = ""
		this.eastAsianWordPos = []
		this.wordDrawingOffset = 0
		this.currentFrame = "6"
		this.doubleWordCountdown = 600
		this.bossTargetPositionY = poetTypingBoxPositionY - poetTypingBoxFont.height / 2 - interfaceIconsLarge.height * .9
		this.tween = new FastTween(Easing.Linear)
	}

	reset()
	{
		// Set boss to self.
		boss = this

		// Reset paragraph variables.
		this.currentWordIndex = 0
		this.currentWordTyped = ""
		this.charactersTyped = ""
		this.quicktimeMarker = 0
		this.percentageComplete = 0
		this.partialCharacterOffset = 0
		this.acceptInput = false

		// Reset display variables.
		this.leftHandSide = ""
		this.rightHandSide = ""

		// Pick random paragraph.
		this.paragraph = Random.sample(paragraphs [
			currentGameLanguage in paragraphs &&
			paragraphs[currentGameLanguage].length > 0 ?
				currentGameLanguage :
				"english"
		])

		// If language is romanized, grab both versions.
		this.originalLanguage = null
		if (isLatinized)
		{
			this.originalLanguage = this.paragraph[1].split(" ")
			this.paragraph = this.paragraph[0]
		}

		// Break up paragraph into sentences if Simplified Chinese.
		if (currentGameLanguage == "schinese")
		{
			this.variants = this.paragraph[0].split(" ").map(py => py + " ")
			this.paragraph = this.paragraph[1]
		}

		// Break paragraph up into words.
		this.paragraph = this.paragraph.split(" ").map((word, index, paragraph) => {
			if (!spacesAndPunctuation) word = word.toLowerCase()
			return word + (index < paragraph.length - 1 ? " " : "")
		})

		// Generate default word variants.
		new Promise(async complete => {
			switch(currentGameLanguage)
			{
				// Special asynchronous generation for Japanese because it can take a long time.
				case "japanese":
					let count = 0
					this.variants = await Promise.all(
						this.paragraph.map(async word => {
							await Sphere.sleep(Math.floor(++count / 8))
							return await generateRomajiVariantsAsync(word)
						})
					)
					complete()
					break
				
				// Simplified Chinese requires some post variant generation treatment.
				case "schinese":
					this.variants = this.variants.map(py => {
						let alphabetsOnly = py.replace(/[^a-z]+/g, "")
						let variants = [{
							word: py,
							increments: [alphabetsOnly.length].concat(py.length > alphabetsOnly.length ? Array(py.length - alphabetsOnly.length).fill(1) : [])
						}]

						// Allow all "v"s to be typed with "u".
						while (variants[variants.length - 1].word.includes("v"))
						{
							let current = variants[variants.length - 1]
							variants.push({ word: current.word.replace("v", "u"), increments: current.increments})
						}
						
						// Allow "u"s in certain combinations to be typed with "v".
						["ju", "qu", "xu", "yu"].forEach(exception => {
							while (variants[variants.length - 1].word.includes(exception))
							{
								let current = variants[variants.length - 1]
								variants.push({ word: current.word.replace(exception, exception.replace("u", "v")), increments: current.increments })
							}
						})
						return variants
					})
					complete()
					break
				
				// Default for most languages, resolves instantly.
				default:
					this.variants = this.paragraph.map(word => generateVariants(word))
					complete()
			}
		}).then(() => {

			// Set first word.
			this.currentWordUntyped = this.variants[0][0].word
			this.acceptInput = true

			// Generate quicktime version from approximate length of keyboard version.
			let charactersTotal = this.variants.reduce((t, c) => t += c[0].word.length, 0)
			let paragraphQuicktimeLength = Math.floor(charactersTotal / 2)
			this.paragraphQuicktime = [...Array(paragraphQuicktimeLength)].map(() => {
				return genQuicktimeChar(buttonWeightGame)
			})

			// Update visuals.
			this.updateDisplay()
		})

		// Setup intro animation.
		this.introDone = false
		this.bossPositionY = 0
		this.bossAlpha = 0
	}

	inputChar(char)
	{
		if (!this.acceptInput) return true

		// If controller.
		if (usingController)
		{
			// If match next character in sequence.
			if (char == this.paragraphQuicktime[this.quicktimeMarker])
			{
				// Play boss typing sound.
				audioHandler.playAudioHookUI("boss_type")

				// Increment quicktime marker.
				this.quicktimeMarker++

				// Update keyboard version.
				this.incrementToPercentage(this.quicktimeMarker / this.paragraphQuicktime.length)

				// Update visuals.
				this.updateDisplay()

				// Report no mistype.
				return false
			}
		}

		// Else, if keyboard.
		{
			// If coming over from controller and current character is untypable.
			if (!spacesAndPunctuation &&
				this.currentWordUntyped &&
				!control.isValidCharacter(this.currentWordUntyped[0]))
			{
				this.progress()
				this.updateDisplay()
			}

			// Generate variants for current word.
			let currentWordVariants = this.variants[this.currentWordIndex]

			// Find matches for new character.
			let match = countMatchAllVariants(currentWordVariants, this.currentWordTyped + char)
			if (match.matchActual > this.currentWordTyped.length)
			{
				// Play boss typing sound.
				audioHandler.playAudioHookUI("boss_type")

				// If match found, append character to matched characters.
				this.currentWordTyped += char
				this.currentWordUntyped = match.word.slice(this.currentWordTyped.length)
				this.progress()

				// Update controller version
				if (this.paragraph)
					this.quicktimeMarker = Math.floor(this.getPercentageComplete() * this.paragraphQuicktime.length)

				// Calculate partial character offset for Korean and Simplified Chinese.
				if (isEastAsianPrimaryDisplay && this.currentWordTyped.length > 0)
				{
					let currentChar = Math.floor(match.match)
					let matchedCharWidth = titleEastAsian.widthOf(this.paragraph[this.currentWordIndex].substring(0, currentChar))
					let partialMatchedCharWidth
					if (currentGameLanguage == "koreana")
						partialMatchedCharWidth = titleEastAsian.widthOf(this.paragraph[this.currentWordIndex][currentChar]) * (match.match % 1)
					else
					{
						if (matchedCharWidth > 0)
							partialMatchedCharWidth = 0
						else
						{
							let onlyChineseCharacters = Array.from(this.paragraph[this.currentWordIndex])
								.filter(char => !(char == " " || char in chinesePunctuation))
								.join("")
							let widthOfOnlyChineseCharacters = titleEastAsian.widthOf(onlyChineseCharacters)
							partialMatchedCharWidth =
								widthOfOnlyChineseCharacters / 2
								- typingFontSmall.widthOf(match.word.replace(/[^a-z]+/g, "")) / 2
								+ typingFontSmall.widthOf(this.currentWordTyped)
						}
					}
					this.partialCharacterOffset = matchedCharWidth + partialMatchedCharWidth
				}

				// Update visuals.
				this.updateDisplay()

				// Report no mistype.
				return false
			}
		}

		// Else, report mistype.
		return true
	}

	getPercentageComplete()
	{
		// If paragraph is complete...
		if (!this.paragraph) return 1

		// Else...
		let currentTotalCharacters = this.charactersTyped.length
			+ this.currentWordTyped.length
			+ this.currentWordUntyped.length
			+ this.variants
				.slice(this.currentWordIndex + 1)
				.reduce((t, c) => t += c[0].word.length, 0)
		return (this.charactersTyped.length + this.currentWordTyped.length) / currentTotalCharacters
	}

	incrementToPercentage(percentage)
	{
		if (this.getPercentageComplete() < percentage)
		{
			// Move forward one character.
			this.currentWordTyped += this.currentWordUntyped[0]
			this.currentWordUntyped = this.currentWordUntyped.slice(1)

			// Check if word complete.
			if (this.currentWordUntyped.length == 0)
				if (this.moveToNextWordAndCheckDone())
					return

			// Continue.
			this.incrementToPercentage(percentage)
		}
	}

	moveToNextWordAndCheckDone()
	{
		// Clean up and move to next word.
		this.currentWordIndex++
		this.charactersTyped += this.currentWordTyped
		this.currentWordTyped = ""
		this.partialCharacterOffset = 0

		// Check if paragraph complete.
		if (this.currentWordIndex >= this.paragraph.length)
		{
			this.paragraphComplete()
			return true
		}

		// If not, continue.
		this.currentWordUntyped = this.variants[this.currentWordIndex][0].word
		return false
	}

	progress()
	{
		// If Spaces and Punctuation turned off, skip untypable characters.
		let skipForward = function(parent) {
			parent.currentWordTyped += parent.currentWordUntyped[0]
			parent.currentWordUntyped = parent.currentWordUntyped.slice(1)
		}
		if (!spacesAndPunctuation)
			while (this.currentWordUntyped.length > 0 && !control.isValidCharacter(this.currentWordUntyped[0]))
				skipForward(this)
		else if (currentGameLanguage == "schinese")
			while (this.currentWordUntyped.length > 0 && this.currentWordUntyped[0] == " ")
				skipForward(this)
		
		// If word is complete, clean up and move to next word.
		if (this.currentWordUntyped.length == 0)
			if (!this.moveToNextWordAndCheckDone())
				this.progress()
	}

	updateDisplay()
	{
		// If paragraph is null, skip update.
		if (!this.paragraph) return

		// Get Poet font.
		let font = this.getPoetFont()

		// Special version for Korean.
		if (isEastAsianPrimaryDisplay)
		{
			this.leftHandSide = ""
			for (let i = this.currentWordIndex; i >= 0 && font.widthOf(this.leftHandSide) <= poetTypingBoxWidth / 2; i--)
				this.leftHandSide = this.paragraph.slice(i, this.currentWordIndex).join("")

			this.rightHandSide = this.paragraph[this.currentWordIndex]
			let currentWordLength = font.widthOf(this.rightHandSide)
			for (let i = this.currentWordIndex + 1; i < this.paragraph.length && font.widthOf(this.rightHandSide) - currentWordLength <= poetTypingBoxWidth / 2; i++)
				this.rightHandSide += this.paragraph[i]
		}

		// All other languages.
		else
		{
			// Left hand side.
			this.leftHandSide = this.currentWordTyped
			for (let i = this.charactersTyped.length - 1; i >= 0 && font.widthOf(this.leftHandSide) < poetTypingBoxWidth / 2; i--)
				this.leftHandSide = this.charactersTyped.slice(i) + this.currentWordTyped

			// Right hand side.
			this.rightHandSide = this.currentWordUntyped
			for (let i = this.currentWordIndex + 1; font.widthOf(this.rightHandSide) < poetTypingBoxWidth / 2 && i < this.paragraph.length; i++)
				this.rightHandSide += this.variants[i][0].word
		}

		// Left hand side controller quicktime sequence.
		this.leftHandSideQuicktime = ""
		for (let i = this.quicktimeMarker - 1; i >= 0 && quicktimeFontLarge.widthOf(this.leftHandSideQuicktime) < poetTypingBoxWidth / 2; i--)
			this.leftHandSideQuicktime = getQuickTimeString([this.paragraphQuicktime[i]]) + this.leftHandSideQuicktime

		// Right hand side controller quicktime sequence.
		this.rightHandSideQuicktime = ""
		for (let i = this.quicktimeMarker; i < this.paragraphQuicktime.length && quicktimeFontLarge.widthOf(this.rightHandSideQuicktime) < poetTypingBoxWidth / 2; i++)
			this.rightHandSideQuicktime += getQuickTimeString([this.paragraphQuicktime[i]])

		// Calculate percentage complete.
		this.percentageComplete = `${Math.floor(this.getPercentageComplete() * 100)}%`

		// If romanized, prepare original language strings.
		if (isLatinized)
		{
			this.originalLanguageStrings = []
			let allWords = (this.leftHandSide + this.rightHandSide).trim().split(" ")
			let lhsWordCount = (this.leftHandSide + this.currentWordUntyped).trim().split(" ").length - 1
			let lhsOffset = poetTypingBoxWidth / 2 - font.widthOf(this.leftHandSide)
			allWords.forEach((v, i) => {
				let originalLanguageString = this.originalLanguage[this.currentWordIndex - lhsWordCount + i]
				this.originalLanguageStrings.push([
					lhsOffset + font.widthOf(v) / 2 - regularEastAsianMedium.widthOf(originalLanguageString) / 2,
					originalLanguageString
				])
				lhsOffset += font.widthOf(v + " ")
			})
		}

		// If Simplified Chinese, prepare pinyin strings.
		if (currentGameLanguage == "schinese")
		{
			// Get all relevant pinyin.
			let lhsWordCount = this.leftHandSide.length > 0 ? this.leftHandSide.trim().split(" ").length : 0
			let rhsWordCount = this.rightHandSide.length > 0 ? this.rightHandSide.trim().split(" ").length : 0
			this.pinyinStrings = this.charactersTyped.trim().split(" ").slice(this.currentWordIndex - lhsWordCount, this.currentWordIndex)
			this.pinyinStrings.push(this.currentWordTyped + this.currentWordUntyped)
			for (let i = this.currentWordIndex + 1; i < this.currentWordIndex + rhsWordCount; i++)
				this.pinyinStrings.push(this.variants[i][0].word)

			// Iterate pinyin strings and get x-position.
			let allWords = (this.leftHandSide + this.rightHandSide).trim().split(" ")
			let lhsOffset = poetTypingBoxWidth / 2 - font.widthOf(this.leftHandSide) - this.partialCharacterOffset
			this.pinyinStrings = this.pinyinStrings.map((v, i) => {
				let eastAsianCharactersOnly = allWords[i].length > 1 ? allWords[i].charAt(0) : allWords[i]
				let pinyinOnly = v.replace(/[^a-z]+/g, "")
				let result = [lhsOffset + font.widthOf(eastAsianCharactersOnly) / 2 - typingFontSmall.widthOf(pinyinOnly) / 2, pinyinOnly]
				lhsOffset += font.widthOf(allWords[i] + " ")
				return result
			})
		}
	}

	paragraphComplete()
	{
		// Remove boss reference.
		boss = null

		// Free all the memory.
		this.paragraph
			= this.originalLanguage
			= this.variants
			= this.paragraphQuicktime
			= null

		// Shut down.
		this.suspend()
		bgm.resume()
		if (!("defeatedPoet" in save)) save["defeatedPoet"] = true
		missionComplete()
	}

	// Blinking animation.
	openEyes(duration = 10) { return this.tween.easeIn([0], [2], t => this.currentFrame = "674"[Math.floor(t)], duration) }
	closeEyes(duration = 10) { return this.tween.easeIn([0], [2], t => this.currentFrame = "456"[Math.floor(t)], duration) }
	blink()
	{
		Sphere.sleep(Random.uniform(240, 60))
			.then(() => {
				if (this.running)
					this.closeEyes().then(() => this.openEyes().then(() => this.blink()))
			})
	}

	on_update()
	{
		if (isPaused()) return

		if (this.introDone == false)
		{
			if (this.bossTargetPositionY - this.bossPositionY > 0)
			{
				this.bossPositionY += 1
				this.bossAlpha = this.bossPositionY / this.bossTargetPositionY
			}
			else
			{
				this.introDone = true
				this.openEyes(30)
					.then(() => this.blink())
			}
		}

		if (missionTier > 1 && --this.doubleWordCountdown <= 0)
		{
			this.doubleWordCountdown = Random.discrete(600, 1200)
			let targets = hostilesArray
				.filter(hostile => {
					return hostile.getType() == type.enemy &&
						hostile.word &&
						Matter.Bounds.overlaps(hostile.body.bounds, screenBounds) &&
						distanceBetween(hostile.getPosition(), screenCenter) > 350
				})
				.concat (
					splitters.filter(splitter => {
						return Matter.Bounds.contains(screenBounds, splitter.getPosition()) &&
							distanceBetween(splitter.getPosition(), screenCenter) > 350
					})
				)
			targets = from(targets).sample(Math.min(targets.length, Random.discrete(3, 4)))
			for (const target of targets)
				factory.spawn(DoubleWordEffect, target)
		}
	}

	getPoetFont()
	{
		return isEastAsianPrimaryDisplay ? titleEastAsian : grandRegular
	}

	on_render()
	{
		// Draw boss image.
		interfaceIconsLarge.drawText(
			Surface.Screen,
			screenCenter.x - interfaceIconsLarge.widthOf(this.currentFrame) / 2,
			this.bossPositionY,
			this.currentFrame,
			midGray.fadeTo(this.bossAlpha)
		)

		// Draw paragraph.
		if (!this.introDone) return
		
		// Reset typing box surface.
		poetTypingBoxSurface.clear()
		poetTypingBoxSurface.blendOp = BlendOp.Default
		poetTypingBoxBG.draw(Surface.Screen, poetTransformBG)

		// Print Words/Quicktime.
		if (this.acceptInput)
		{
			if (usingController)
			{
				quicktimeFontLarge.drawText(
					poetTypingBoxSurface,
					poetTypingBoxWidth / 2 - quicktimeFontLarge.widthOf(this.leftHandSideQuicktime),
					(poetTypingBoxSurface.height - quicktimeFontLarge.height) / 2,
					this.leftHandSideQuicktime + this.rightHandSideQuicktime,
					darkGray
				)
			}
			
			// Print text.
			else
			{
				let font = this.getPoetFont()
				font.drawText(
					poetTypingBoxSurface,
					poetTypingBoxWidth / 2 - font.widthOf(this.leftHandSide) - this.partialCharacterOffset,
					(poetTypingBoxSurface.height - font.height + (isLatinized ? regularEastAsianMedium.height / 2 : 0)) / 2,
					this.leftHandSide + this.rightHandSide,
					darkGray
				)

				if (isLatinized || currentGameLanguage == "schinese")
				{
					let secondaryFont, secondaryString, pinyinOffset
					if (isLatinized)
					{
						secondaryString = this.originalLanguageStrings
						secondaryFont = regularEastAsianMedium
						pinyinOffset = 0
					}
					else
					{
						secondaryString = this.pinyinStrings
						secondaryFont = typingFontSmall
						pinyinOffset = scalePix(5)
					}
					secondaryString.forEach(string => {
						secondaryFont.drawText(
							poetTypingBoxSurface,
							string[0],
							(poetTypingBoxSurface.height - font.height - secondaryFont.height / 2) / 2 - pinyinOffset,
							string[1],
							midGray
						)
					})
				}
			}
		}

		// Print typing box to screen.
		poetTypingBoxSurface.blendOp = BlendOp.Subtract
		poetBlendOpShape.draw(poetTypingBoxSurface)
		poetTypingBoxShape.draw(Surface.Screen, poetTransform)

		// Print typing cursor.
		PrimNative.drawLine(
			Surface.Screen,
			screenCenter.x,
			poetTypingBoxPositionY - poetTypingBoxFont.height / 2 + 2,
			screenCenter.x,
			poetTypingBoxPositionY + poetTypingBoxFont.height / 2 - 2,
			2,
			secondColor
		)

		// Print progress percentage.
		typingFontSmall.drawText(
			Surface.Screen,
			screenCenter.x - typingFontSmall.widthOf(this.percentageComplete) / 2,
			poetTypingBoxPositionY + poetTypingBoxFont.height / 2 + scalePix(5),
			this.percentageComplete,
			midGray
		)
	}
}

class DoubleWordEffect extends Entity
{
	constructor()
	{
		super()
		this.speed = 7
		this.smokeDelay = 3
		this.rotationSpeed = 0.2
		this.bossPosition = {
			x: screenCenter.x,
			y: poetTypingBoxPositionY - poetTypingBoxFont.height / 2 - interfaceIconsLarge.height * .9
		}
	}

	reset(target)
	{
		this.target = target
		let leftOrRight = target.getPosition().x < screenCenter.x ? -1 : 1
		this.position = Vector.add (
			Vector.mult (
				Vector.rotate ({ x: leftOrRight, y: 0 }, Random.uniform(0, Math.PI / 4)),
				interfaceIconsLarge.widthOf("6") + 5
			),
			this.bossPosition
		)
		let direction = Vector.sub(this.position, this.bossPosition)
		this.angle = Math.atan2(direction.y, direction.x)
		this.smokeDelayCurrent = 0
	}

	on_update()
	{
		if (!isPaused())
		{
			if (--this.smokeDelayCurrent <= 0)
			{
				factory.spawn(WordTrail, this.position.x, this.position.y)
				this.smokeDelayCurrent = this.smokeDelay
			}

			if (!this.target || !this.target.active)
				this.suspend()

			else if (distanceBetween(this.position, this.target.getPosition()) < 5)
			{
				audioHandler.playAudioHook("poet_lock", getPanFromX(this.position.x))
				this.target.doubleWord = true
				this.suspend()
			}

			else
			{
				// Get angle to target.
				let direction = Vector.sub(this.target.getPosition(), this.position)
				let angleToTarget = Math.atan2(direction.y, direction.x)

				// Rotate (pick whatever direction is closer).
				let difference = diff(this.angle, angleToTarget)
				if (Math.abs(difference) > this.rotationSpeed)
					this.angle += Math.sign(difference) * this.rotationSpeed
				else
					this.angle = angleToTarget

				// Move.
				let velocity = Vector.mult(
					Vector.create(
						Math.cos(this.angle),
						Math.sin(this.angle)
					),
					this.speed
				)
				this.position = Vector.add(this.position, velocity)
			}
		}
	}

	on_render()
	{
		typingFont.drawText(Surface.Screen, this.position.x, this.position.y , 'abcdefghijklmnopqrstuvwxyz'.charAt(Random.discrete(0, 26)), midGray)
	}
}

class WordTrail extends Entity
{
	reset(x, y)
	{
		this.x = x
		this.y = y
		this.opacity = 1
		this.character = 'abcdefghijklmnopqrstuvwxyz'.charAt(Random.discrete(0, 26))
	}

	on_update()
	{
		if (!isPaused())
		{
			this.opacity -= .05
			if (this.opacity <= 0)
				this.suspend()
		}
	}

	on_render()
	{
		typingFont.drawText(Surface.Screen, this.x, this.y, this.character, midGray.fadeTo(this.opacity))
	}
}