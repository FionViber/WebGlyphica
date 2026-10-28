import { Matter, Random, Easing, Prim } from 'sphere-runtime'
import { Entity } from '../core/entityFactory.js'
import { Debris } from '../effects/debris.js'
import { Damage } from '../effects/damage.js'
import { WarderProtection } from './warderProtection.js'
import { Scalers } from '../data/difficultyScalers.js'
import { FastTween } from '../core/fastTween.js'

// Status Effects
import { Bleeding } from '../weapons/bleeding.js'
import { Blight } from '../weapons/blight.js'
import { Static } from '../weapons/static.js'
import { Ignite } from '../weapons/ignite.js'
import { BleedEffect } from '../effects/bleed.js'
import { StaticEffect } from '../effects/static.js'
import { Snowflakes } from '../effects/snowflakes.js'
import { IgniteEffect } from '../effects/ignite.js'
import { BlightEffect } from '../effects/blight.js'

// Spawn variables.
let spawnAngles = []
let spawnAnglesWarder = []
let spawnLocations = []
let spawnLocationsWarder = []

export class Enemy extends Entity
{
	static isElite() { return false }
	static isSpecial() { return false }
	
	getType() { return type.enemy }
	constructor(radius = 0)
	{
		// Superclass constructor.
		super()

		// Declare vars.
		this.cyphered = false
		this.alwaysShowHealth = false
		this.wpmTimeStart = 0
		this.radius = radius
		this.gracePeriod = false
		this.health = 200
		this.currentHealth = 100
		this.shield = 0
		this.currentShield = 0
		this.shieldDelay = 30
		this.currentShieldDelay = 0
		this.shieldRegen = 2
		this.wordOffset = scalePix(30)
		this.healthbarOffset = scalePix(20)
		this.experience = 0
		this.coins = 0
		this.protection = null
		this.children = []
		this.isElite = false
		this.isSpecial = false
		this.canSpawnPowerups = true
		this.wordRegenPercentage = 0
		this.wordBounds = Matter.Bounds.create(Array(4).fill().map(u => ({ x: 0, y: 0 })))
		this.regeneratingWord = false
		this.statusEffects = []
		this.heatRayCooldown = 0
		this.heatRayStacks = 0

		// Cypher vars.
		this.cypherGlitchEffectCountdown = 0

		// Display vars for words.
		this.numMatchingLetters = 0
		this.numMatchingQuicktimeSymbols = 0

		// Physics body.
		this.body = radius > 0 ? circleCollider(radius, {category: hostile}) : null

		// Regenerate word delay.
		this.tween = new FastTween(this, Easing.Linear)

		// Overlapping words fading.
		this.overlapMinOpacity = .4
		this.overlapTweenDirection = 0
		this.overlapOpacityTween = new FastTween(Easing.Linear)
	}

	reset(threat = 0, genWord = true)
	{
		this.cyphered = false
		this.weakened = false
		if (genWord) this.refreshWord()
		this.active = true
		this.threat = threat
		this.doubleWord = false
		this.overlapOpacity = 1
		
		if (this.body)
		{
			Matter.World.add(physics.world, this.body)
			Matter.Body.setPosition(this.body, this.getRandomSpawnLocation())
			addHostile(this)
		}
	}

	addStatusEffect(status)
	{
		let existingStatus = this.statusEffects.find(se => se[0] == status)
		switch(status)
		{
			case "explosiveStatus":
				break

			case "heatStatus":
				if (existingStatus)
					existingStatus[1] = getExistingWeapon("Ignite").mod.duration
				else
				{
					if (!getExistingWeapon("Ignite"))
						allWeapons.push(new Ignite())
					this.statusEffects.push([
						status,
						getExistingWeapon("Ignite").mod.duration,
						factory.spawn(IgniteEffect, this, this.radius * (this.largeEnemy ? this.largeEnemy : 1))
					])
				}
				break
			
			case "coldStatus":
				let coldModifier = modifiers.allModifiers.global.perc.totalModifier.duration
					+ "cold" in modifiers.allModifiers ? modifiers.allModifiers.cold.perc.totalModifier.duration : 0
				if (existingStatus)
					existingStatus[1] = 300 * (1 + coldModifier)
				else
				{
					this.statusEffects.push([
						status,
						300 * (1 + coldModifier),
						factory.spawn(Snowflakes, this, false)
					])
				}
				break

			case "chemicalStatus":
				if (existingStatus)
					existingStatus[1] = getExistingWeapon("Blight").mod.duration
				else
				{
					if (!getExistingWeapon("Blight"))
						allWeapons.push(new Blight())
					this.statusEffects.push([
						status,
						getExistingWeapon("Blight").mod.duration,
						factory.spawn(BlightEffect, this, this.radius * (this.largeEnemy ? this.largeEnemy : 1))
					])
				}
				break

			case "kineticStatus":
				if (existingStatus)
					existingStatus[1] = getExistingWeapon("Bleeding").mod.duration
				else
				{
					if (!getExistingWeapon("Bleeding"))
						allWeapons.push(new Bleeding())
					this.statusEffects.push([
						status,
						getExistingWeapon("Bleeding").mod.duration,
						factory.spawn(BleedEffect, this, this.radius * (this.largeEnemy ? this.largeEnemy : 1))
					])
				}
				break

			case "electricStatus": 
				if (existingStatus)
					existingStatus[1] = getExistingWeapon("Static").mod.duration
				else
				{
					if (!getExistingWeapon("Static"))
						allWeapons.push(new Static())
					this.statusEffects.push([
						status,
						getExistingWeapon("Static").mod.duration,
						factory.spawn(StaticEffect, this, this.radius * (this.largeEnemy ? this.largeEnemy : 1))
					])
				}
				break
			
			case "restrictedArea":
				if (existingStatus)
					existingStatus[1] = (3600 / getExistingWeapon("Tesla").mod.rateOfFire) + 1
				else
				{
					this.statusEffects.push([
						status,
						(3600 / getExistingWeapon("Tesla").mod.rateOfFire) + 1,
						null
					])
				}
		}
	}

	on_update()
	{
		if (this.active && !isPaused()) 
		{
			// Fire update function.
			if (!powerup_freeze && !this.statusEffects.some(status => status[0] == "coldStatus"))
				this.update()

			// Heat Ray Cooldown.
			if (this.heatRayCooldown > 0) this.heatRayCooldown--
			else if (this.heatRayStacks > 0) this.heatRayStacks = 0

			// Progress status effects.
			for (let i = 0; i < this.statusEffects.length; i++)
				if (--this.statusEffects[i][1] <= 0)
				{
					if (this.statusEffects[i][2]) this.statusEffects[i][2].terminate = true
					this.statusEffects[i] = this.statusEffects[this.statusEffects.length - 1]
					this.statusEffects.pop()
					i--
				}

			// Check current enemies for word overlap.
			let pos = this.getPosition()
			let bounds = {
				min: Vector.add(pos, this.wordBounds.min),
				max: Vector.add(pos, this.wordBounds.max)
			}
			let overlappingEnemy = hostilesArray.find((enemy) => {
				if (enemy.getType() == type.enemy && enemy.word)
				{
					let enemyPos = enemy.getPosition()
					let enemyBounds = {
						min: Vector.add(enemyPos, enemy.wordBounds.min),
						max: Vector.add(enemyPos, enemy.wordBounds.max)
					}
					return (
						Matter.Bounds.overlaps(bounds, enemyBounds)
						&& distanceBetween(this.getPosition(), screenCenter) > distanceBetween(enemy.getPosition(), screenCenter)
					)
				}
				else return false
			})
			if (overlappingEnemy && this.overlapOpacity > this.overlapMinOpacity && !(this.overlapTweenDirection < 0))
			{
				this.overlapTweenDirection = -1
				this.overlapOpacityTween.easeIn([this.overlapOpacity], [this.overlapMinOpacity], t => this.overlapOpacity = t[0], 10)
					.then(() => this.overlapTweenDirection = 0)
			}
			else if (!overlappingEnemy && this.overlapOpacity < 1 && !(this.overlapTweenDirection > 0))
			{
				this.overlapTweenDirection = 1
				this.overlapOpacityTween.easeIn([this.overlapOpacity], [1], t => this.overlapOpacity = t[0], 10)
					.then(() => this.overlapTweenDirection = 0)
			}

			// Check if within boss cypher range.
			if (this.cyphered)
			{
				if (--this.cypherGlitchEffectCountdown < -5)
					this.cypherGlitchEffectCountdown = Random.discrete(50, 90)

				if (!(boss && boss.constructor.name == "Cypher") || distanceBetween(this.getPosition(), boss.getPosition()) > boss.range)
				{
					this.cyphered = false
					if (this.word)
						this.updateWordDisplay(2)
				}
			}

			if (this.weakened)
			{
				let turretsInRange = [...allWeapons, currentTurret].filter(weap => {
					return weap.constructor.nonDamageTags().includes("tag_turret") &&
						weap.children.some(child => distanceBetween(child.position, this.getPosition()) <= weap.mod.range)
				})
				if (turretsInRange.length <= 0)
					this.weakened = false
			}
		}
	}
	update() {} 

	updateWordBounds()
	{
		let font = usingController ?
			quicktimeFont :
			isEastAsianPrimaryDisplay ? regularEastAsianLarge : typingFontLarge
		let word = usingController ?
			getQuickTimeString(this.cyphered ? this.cypherQuicktimeString : this.quicktime) :
			this.variantString
		this.wordBounds.min.x = -font.widthOf(word) * .4
		this.wordBounds.min.y = -this.wordOffset - font.height * .7
		this.wordBounds.max.x = font.widthOf(word) * .4
		this.wordBounds.max.y = -this.wordOffset - font.height * .3
	}

	setHealth(health)
	{
		const scaledHealth = health * Scalers.enemyHealth * (omenLevel >= 4 ? 2 : omenLevel >= 1 ? 1.5 : 1)
		this.currentHealth = scaledHealth
		this.health = scaledHealth
	}

	setShield(shield)
	{
		this.currentShield = shield
		this.shield = shield
	}

	setProtected(status)
	{
		if (status)
		{
			if (this.protection == null)
				this.protection = factory.spawn(WarderProtection, this)
		}
		else
		{
			if (this.protection != null)
			{
				this.protection.stop()
				this.protection = null
			}
		}
	}

	doubleWordComplete()
	{
		this.doubleWord = false
		audioHandler.playAudioHook("double_word_complete")
		// TODO: Trigger some anims.
	}

	refreshWord(regenerateWordDelay = false)
	{
		// Get new word + quicktime sequence.
		addWord(this)

		// If East Asian primary display & Stalker, make sure it's not a one character word.
		if (isEastAsianPrimaryDisplay && this.constructor.name.includes("Stalker"))
			while (this.word.length <= 1)
				addWord(this)

		// If this is not the word enemy spawned with, do regeneration animation.
		if (regenerateWordDelay)
		{
			this.regeneratingWord = true
			this.wordRegenPercentage = 0

			if (enemyWordRegen)
				Sphere.sleep(10)
					.then(() => {
						
						// Play special audio if Cypher regenerating.
						if (this.constructor.name == "Cypher")
							audioHandler.playAudioHook("cipher_shuffle", getPanFromX(this.body.position.x))

						// Regenerate word.
						this.tween.easeIn([0], [1], t => { if (this.regeneratingWord) { this.wordRegenPercentage = t[0] } }, 10)
							.then(() => this.regeneratingWord = false)
					})
		}
		else this.wordRegenPercentage = 1

		// Update display.
		this.updateWordDisplay(2)
	}

	calculateShield()
	{
		if (--this.currentShieldDelay <= 0)
			if (this.currentShield < this.shield)
				this.currentShield += this.shieldRegen
	}

	spawnDebris()
	{
		let position = this.getPosition()
		for (let i = 0; i < 10; i++)
			factory.spawn(Debris, position.x, position.y)
	}

	destroy()
	{
		spawner.removeThreat(this)
		this.spawnDebris()
		this.statusEffects.forEach(status => status[2] ? status[2].terminate = true : null)
		this.statusEffects = []
		this.active = false
		this.cease(false)
		
		// Give a grace period of .2 seconds after an enemy dies before disabling word.
		this.gracePeriod = true
		Sphere.sleep(15).then(() => {
			if (this.gracePeriod && this.numMatchingLetters == 0 && this.numMatchingQuicktimeSymbols == 0)
				this.stop()
		})
	}

	on_shutDown()
	{
		this.gracePeriod = false
		this.cease()
	}
	
	cease(clearWord = true)
	{
		this.children.forEach((child) => { child.stop() })
		this.children = []
		this.doubleWord = false
		if (clearWord)
			removeWord(this)
		if (this.protection != null)
		{
			this.protection.stop()
			this.protection = null
		}
		if (this.body && hostiles.has(this.body.id))
		{
			Matter.World.remove(physics.world, this.body)
			removeHostile(this)
		}
	}

	suspend()
	{
		if (this.running)
			this.stop()
	}

	getPosition()
	{
		return this.body ? this.body.position : this.position
	}

	renderWordAndHealth(hideWord = false, splitHealth = 1)
	{
		let pos = this.getPosition()
		if (
			this.active &&
			(
				this.alwaysShowHealth ||
				this.currentShield < this.shield ||
				this.currentHealth < this.health

			)
		)
		{
			// Print Shield (if any)
			let shieldOffset = 0
			let healthBarWidth = scalePix(Math.max(this.radius * 2, 20))
			if (this.shield > 0)
			{
				shieldOffset += scalePix(5)
				drawProgress(
					pos.x,
					pos.y + this.radius + this.healthbarOffset * (this.largeEnemy ? this.largeEnemy : 1),
					healthBarWidth,
					scalePix(3),
					this.currentShield / this.shield
				)
			}

			// Print Health.
			if (this.health > 0)
			{
				let splitHealthOffset = 0
				let perBarMaxHealth = this.health / splitHealth
				for (let i = 0; i < splitHealth; i++)
				{
					let currentBar = Math.floor(this.currentHealth / perBarMaxHealth)
					if (i != currentBar)
						PrimNative.drawFilledRectangle (
							Surface.Screen,
							pos.x - healthBarWidth / 2,
							pos.y + splitHealthOffset + this.radius + (this.healthbarOffset * (this.largeEnemy ? this.largeEnemy : 1)) + shieldOffset - scalePix(1.5),
							pos.x + healthBarWidth / 2,
							pos.y + splitHealthOffset + this.radius + (this.healthbarOffset * (this.largeEnemy ? this.largeEnemy : 1)) + shieldOffset + scalePix(1.5),
							i < currentBar ? midGray : midGray.fadeTo(.3)
						)
					else
						drawProgress (
							pos.x,
							pos.y + splitHealthOffset + this.radius + (this.healthbarOffset * (this.largeEnemy ? this.largeEnemy : 1)) + shieldOffset,
							healthBarWidth,
							scalePix(3),
							(this.currentHealth % perBarMaxHealth) / perBarMaxHealth
						)
					splitHealthOffset += scalePix(5)
				}
			}
		}

		// If grace period after enemy dies & no character matches, don't print anything to screen.
		if (!this.active && this.numMatchingLetters == 0 && this.numMatchingQuicktimeSymbols == 0)
			return
		
		// Print quicktime sequence on screen.
		let word, font
		if (usingController)
		{
			let cypherQuicktimeString = this.cyphered && this.cypherGlitchEffectCountdown <= 0 ?
				getCypherQuicktime(this.cypherQuicktimeString.length, null, false) :
				this.cypherQuicktimeString
			word = getQuickTimeString(this.cyphered ? cypherQuicktimeString : this.quicktime)
			font = quicktimeFont
			this.printToScreen(
				word,
				this.numMatchingQuicktimeSymbols,
				font,
				pos.x - font.widthOf(word) / 2,
				pos.y - this.wordOffset - quicktimeFont.height,
				hideWord
			)
		}

		// Else, print word on screen.
		else
		{
			// Exception for Korean.
			let matchingLetters
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

			// Print actual CJK word in smaller font on top.
			if (this.nonLatinGlyphs && !hideWord && !this.cyphered)
				regularEastAsianMedium.drawText(
					Surface.Screen,
					pos.x - regularEastAsianMedium.widthOf(this.nonLatinGlyphs) / 2,
					pos.y - this.wordOffset - font.height - regularEastAsianMedium.height - (this.doubleWord ? scalePix(5) : 0),
					this.nonLatinGlyphs,
					midGray.fadeTo(this.omenOpacity() * .5 * ui.inGameWordOpacity * this.wordRegenPercentage * this.overlapOpacity)
				)
			
			// Print pinyin on top of words if Simplified Chinese.
			if (!this.cyphered && currentGameLanguage == "schinese" && this.displayedPinyin)
			{
				this.printToScreen(
					this.displayedPinyin,
					this.variantMatches + Math.floor(this.numMatchingLetters),
					typingFontMedium,
					pos.x - typingFontMedium.widthOf(this.displayedPinyin) / 2,
					pos.y - this.wordOffset - font.height - typingFontMedium.height,
					hideWord
				)
			}

			// Print to screen.
			this.printToScreen(
				word,
				matchingLetters,
				font,
				pos.x - font.widthOf(word) / 2,
				pos.y - this.wordOffset - font.height,
				hideWord
			)
		}
		
		// Draw box and power of 2 if double word.
		if (this.doubleWord)
		{
			PrimNative.drawRectangle(
				Surface.Screen,
				pos.x - font.widthOf(word) / 2 - scalePix(10),
				pos.y - this.wordOffset - font.height - scalePix(5),
				pos.x + font.widthOf(word) / 2 + scalePix(10),
				pos.y - this.wordOffset + scalePix(5),
				2,
				midGray.fadeTo(.5 * ui.inGameWordOpacity * this.overlapOpacity)
			)
			typingFontLarge.drawText(
				Surface.Screen,
				pos.x + font.widthOf(word) / 2 + scalePix(15),
				pos.y - this.wordOffset - font.height - scalePix(10),
				"²",
				midGray.fadeTo(.5 * ui.inGameWordOpacity * this.overlapOpacity)
			)
		}
	}

	omenOpacity()
	{
		let opacity = 1
		if (omenLevel >= 6)
		{
			let distance = distanceBetween(this.getPosition(), screenCenter)
			if (distance > scalePix(750))
				opacity = 0
			else if (distance > scalePix(650))
				opacity = 1 - ((distance - scalePix(650)) / scalePix(100))
		}
		return opacity
	}

	printToScreen(string, matching, font, posX, posY, hideWord = false)
	{
		// Calculate final opacity mult.
		let opacity = this.omenOpacity() * ui.inGameWordOpacity * this.overlapOpacity

		// Get temp vars.
		let renderedCount = Math.floor(string.length * this.wordRegenPercentage)
		let revealedLength = usingController || isEastAsianPrimaryDisplay ? 1 : 2

		// If matched text exists.
		if (matching > 0)
		{
			let partialMatch = matching % 1
			matching = partialMatch == 0 ? matching : Math.floor(matching)
			let matchedString = string.slice(0, Math.min(matching, renderedCount))
			let partialMatchedString = string.slice(matching, matching + (partialMatch > 0))
			let unmatchedString = string.slice(matching + (partialMatch > 0), renderedCount)

			// Draw matching text.
			font.drawText(Surface.Screen, posX, posY, matchedString, darkGray.fadeTo(opacity))

			// If Stalker.
			if (hideWord && renderedCount > matching + revealedLength)
			{
				// Draw partially matched text (if any)
				if (partialMatchedString.length > 0 && this.wordSurface)
					this.drawPartialMatch(posX, posY, matching, font, partialMatch, opacity)

				// Draw unmatched text.
				let koreanPartialUnderHalf = isEastAsianPrimaryDisplay && partialMatch && partialMatch < .5
				let visibleUnmatched = koreanPartialUnderHalf ? "" : unmatchedString.slice(0, revealedLength)
				font.drawText(
					Surface.Screen,
					posX + font.widthOf(matchedString + partialMatchedString),
					posY,
					visibleUnmatched,
					midGray.fadeTo(0.5 * opacity)
				)

				// Draw Stalker rectangle.
				PrimNative.drawFilledRectangle(
					Surface.Screen,
					posX + font.widthOf(matchedString + partialMatchedString + visibleUnmatched),
					posY,
					posX + font.widthOf(string.slice(0, renderedCount)),
					posY + font.height,
					midGray.fadeTo(0.5 * opacity)
				)
			}

			// If regular enemy.
			else
			{
				// Draw partially matched text (if any)
				if (partialMatchedString.length > 0 && this.wordSurface)
					this.drawPartialMatch(posX, posY, matching, font, partialMatch, opacity)

				// Draw unmatched text.
				font.drawText(
					Surface.Screen,
					posX + font.widthOf(matchedString + partialMatchedString),
					posY,
					unmatchedString,
					midGray.fadeTo(0.5 * opacity)
				)
			}
		}
		
		// If no matches.
		else
		{
			if (hideWord && renderedCount > revealedLength)
			{
				let visibleText = string.slice(0, revealedLength)
				font.drawText(Surface.Screen, posX, posY, visibleText, midGray.fadeTo(.5 * opacity))
				PrimNative.drawFilledRectangle(
					Surface.Screen,
					posX + font.widthOf(visibleText),
					posY,
					posX + font.widthOf(string.slice(0, renderedCount)),
					posY + font.height,
					midGray.fadeTo(.5 * opacity)
				)
			}
			else font.drawText(
				Surface.Screen,
				posX,
				posY,
				string.slice(0, renderedCount),
				midGray.fadeTo(0.5 * opacity)
			)
		}
	}

	// Draw partially matched character.
	drawPartialMatch(x, y, charIndex, font, perc, opacity)
	{
		let startX = font.widthOf(this.word.slice(0, charIndex))
		let partialCharWidth = font.widthOf(this.word[charIndex])
		let partialMatchWidth = partialCharWidth * perc
		Prim.blitSection(Surface.Screen, x + startX, y, this.wordSurface, startX, 0, partialMatchWidth, font.height, darkGray.fadeTo(opacity))
		Prim.blitSection(Surface.Screen, x + startX + partialMatchWidth, y, this.wordSurface, startX + partialMatchWidth, 0, partialCharWidth - partialMatchWidth, font.height, midGray.fadeTo(.5 * opacity))
	}

	// Count how many characters match in both word and quicktime sequence.
	updateWordDisplay(which, clearInactive = false)
	{
		let result = control.updateWordDisplay(this, which, clearInactive)
		this.updateWordBounds()
		return result
	}

	isSlowed()
	{
		return (
			this.statusEffects.find(se => se[0] == "chemicalStatus") ||
			(
				currentTurret.constructor.name == "SplatterShot" &&
				currentTurret.isPositionInSplatterZone(this.getPosition()) > 0
			)
		)
	}

	getHit(damage, weapon = null, col = null, forceDamageType = null)
	{
		// Weapon specific procs.
		let isCrit = false
		if (weapon)
		{
			// Crit calculation.
			isCrit = weapon.isCrit(this)
			if (isCrit) damage *= weapon.mod.critMult

			// Weakened.
			if (this.weakened && weapon != this.weakened) damage *= 1.3
			
			// Double Damage.
			if (powerups.some(powerup => powerup.constructor.name == "DoubleDamage"))
				damage *= "item_tripleDamage" in serializedLoot ? 3 : 2
			
			// Fracture.
			if ("item_fracture" in serializedLoot && (powerup_freeze || this.statusEffects.some(status => status[0] == "coldStatus")))
				damage *= 1.5

			// Far/Near damage mod.
			if (weapon.mod.farDamage != 0 || weapon.mod.nearDamage != 0)
			{
				let range = distanceBetween(screenCenter, this.getPosition())
				let closeCombatAugment = "augment_closeCombat" in activeAugments && weapon.constructor.nonDamageTags().includes("tag_remote")
				if (range >= longRange && weapon.mod.farDamage != 0) damage *= (1 + weapon.mod.farDamage)
				else if ((range < longRange || closeCombatAugment) && weapon.mod.nearDamage != 0) damage *= (1 + weapon.mod.nearDamage)
			}

			// Damage-type Status effects.
			let damageTypes = forceDamageType == null ?
				modifiers.damageTypes :
				Array.isArray(forceDamageType) ?
					forceDamageType :
					[forceDamageType]
			for (const type of damageTypes)
			{
				let statusChance = weapon.mod[type + 'StatusChance']
				if (statusChance > 0)
				{
					statusChance += weapon.mod.statusChance
					if (type == 'electric' && this.statusEffects.some(s => s[0] == "restrictedArea"))
						statusChance += .2
					if ((isCrit && "item_aftershock" in serializedLoot) || Random.chance(statusChance))
						this.addStatusEffect(type + 'Status')
				}
			}
		}

		// Get hit audio.
		audioHandler.playAudioHook("enemy_hit_" + this.constructor.name.toLowerCase(), getPanFromX(this.getPosition().x))

		// Spawn damage number effect.
		let pos = col ? col : this.getPosition()
		factory.spawn(Damage, Random.uniform(pos.x, 30), Random.uniform(pos.y, 15), damage, isCrit)

		// Process damage (or shield depletion)
		allWeapons.forEach(weap => weap.onEnemyHit(this, weapon, isCrit))
		if (this.shield > 0)
			this.currentShieldDelay = this.shieldDelay
		if (damage < this.currentShield)
			this.currentShield -= damage
		else
		{
			let resultantDamage = damage - this.currentShield
			this.currentShield = 0
			if (resultantDamage < this.currentHealth)
				this.currentHealth -= resultantDamage
			else if (this.active)
				this.destroyedByPlayer(weapon, isCrit)
		}

		// Vampirism.
		if (isCrit && weapon.allDamageTags.includes("tag_kinetic") && "item_vampirism" in serializedLoot)
			currentTurret.addHealth(Math.ceil(.05 * damage))

		// Lamprey Augment.
		let range = distanceBetween(screenCenter, this.getPosition())
		if (range < longRange && weapon.constructor.nonDamageTags().includes("tag_damageOverTime") && "augment_lamprey" in activeAugments)
			currentTurret.addHealth(1)

		return { damage: damage, isCrit: isCrit }
	}

	destroyedByPlayer(weapon, isCrit)
	{
		// Add rewards.
		addExperience(this.experience * (1 + weapon.mod.experience))

		// SFX.
		if (weapon.constructor.name == "HeatRay")
			audioHandler.playAudioHook("heatray_destroy_enemy", getPanFromX(this.getPosition().x))

		// Register kill
		if (this.canSpawnPowerups && weapon.isWeapon)
		{
			weapon.registerKill()
			if (isCrit && "item_enlightenment" in serializedLoot)
				allWeapons.forEach(weap => weap.evolutionAdd(1))
		}

		// Trigger on kill effects.
		allWeapons.forEach(weap => weap.onEnemyDestroyed(this, weapon, isCrit))

		// Splattershot Infestation II Evolution.
		if (
			currentTurret.constructor.name == "SplatterShot" &&
			currentTurret.infestation == 2 &&
			weapon.constructor.nonDamageTags().includes("tag_status")
		)
		{
			let position = this.getPosition()
			for (let i = 0; i < 10; i++)
				currentTurret.spawnSplatterParticle({ x: position.x, y: position.y })
		}
		
		// Spawn pickups.
		pickupController.spawnRandomPickup(this, weapon, isCrit)
		
		// Destroy.
		this.destroy()
	}

	generateSpawnLocations(minAngle, maxAngle, deviation, numLanes)
	{
		if (spawnAngles.length == 0)
		{
			// generate a list of numLanes spawn locations between minAngle and maxAngle
			const step = (maxAngle - minAngle - (2 * deviation)) / (numLanes - 1)
			for (let i = 0; i < numLanes; i++)
			{
				const angle = (minAngle + deviation)  + i * step
				if ( i == Math.floor(numLanes / 2) )
				{
					spawnAnglesWarder.push(angle)
					spawnAnglesWarder.push(angle + Math.PI)
				}
				else
				{
					spawnAngles.push(angle)
					spawnAngles.push(angle + Math.PI)
				}
			}
		}

		let dist = Math.sqrt(Math.pow(Surface.Screen.width/2, 2) + Math.pow(Surface.Screen.height/2, 2))

		if (spawnLocations.length == 0)
		{
			for (let i = 0; i < spawnAngles.length; i++)
			{
				const randomDeviation = Math.random() * (deviation * 2) - deviation
				const posFromScreenCenter = Vector.rotate(Vector.create(dist, 0), spawnAngles[i] + randomDeviation)
				spawnLocations.push(Vector.add(posFromScreenCenter, screenCenter))
			}
			// Fisher-Yates shuffle
			for (let i = spawnLocations.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1))
				const temp = spawnLocations[i]
				spawnLocations[i] = spawnLocations[j]
				spawnLocations[j] = temp
			}
		}
	}

	// Get random spawn location just outside of screen.
	getRandomSpawnLocation()
	{
		if (spawnLocationsWarder.length == 0 || spawnLocations.length == 0)
		{
			let topAngle = boss && boss.constructor.name == "Poet" ? -Math.PI / 5 : -Math.PI / 4
			this.generateSpawnLocations(topAngle, Math.PI / 4, 0.05, 9)
		}

		if (this.constructor.name == "Warder")
		{
			const dist = Math.sqrt(Math.pow(Surface.Screen.width/2, 2) + Math.pow(Surface.Screen.height/2, 2))
			return Vector.add(screenCenter, Vector.rotate(Vector.create(dist, 0), Random.sample(spawnAnglesWarder)))
		}
		else
		{
			return spawnLocations.pop()
		}
	}
}