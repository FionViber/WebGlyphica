import { Prim, Matter, from, Task, Random } from 'sphere-runtime'
import { ray, vec2 } from '../libs/raycast.js'
import { Audio } from './audio.js'
import { saveGame } from './loader.js'
import { GiveWeapon, WeaponsList, RepeatingUpgrades, lootAndAugments } from '../data/weaponsList.js'
import { augmentsList, Conviction, Deliverance, Haze } from '../data/augmentsList.js'
import { Impact } from '../effects/impact.js'
import { Debris } from '../effects/debris.js'
import { Announcer } from '../effects/announcer.js'
import { LevelUpDots } from '../effects/levelUpDots.js'
import { LootItems } from '../data/lootItems.js'
import { EffectsSurface } from '../effects/effectsSurface.js'

(function() {	

	// Settings
	global.isOozaru = Sphere.Engine.split(" ")[0] == "neoSphere" ? false : true
	global.steamEnabled = !isOozaru
	global.wpmSimulator = 0
	global.missionMode = true
	global.darkMode = false
	global.spacesAndPunctuation = false
	global.levelUpKey = "__"
	global.monochromeMode = false
	global.muteTypingSounds = false
	global.contrast = 0
	global.demo = false
	global.enemyWordRegen = true
	global.immortal = false
	global.autoLevel = false
	global.autoLoot = false
	global.spawnerDebug = false
	global.possibleExtraButtons = [12, 13]
	global.maxMissionTier = 3
	global.missionCountdown = 14400 // In frames.
	global.outOfLoot = false

	// Enums.
	
		// Screens.
		global.menu = 0
		global.game = 1

		// Entity types.
		global.type = {
			enemy: 0,
			armor: 1,
			pickup: 2
		}

		// Rarity.
		global.rarity = {
			common: 0,
			uncommon: 1,
			rare: 2
		}

		// Special omen modes.
		global.omen = {
			relaxed: -1,
			typist: -2
		}

	// Loot rarity weights.
	global.lootWeight = [
		{ rarity: rarity.common, weight: 75 },
		{ rarity: rarity.uncommon, weight: 20 },
		{ rarity: rarity.rare, weight: 5 }
	]

	// Collections.
	global.friendlies = {}
	global.hostiles = new Map()
	global.hostilesArray = []
	global.splitters = []
	global.friendlyBodies = []
	global.hostileBodies = []
	global.allWeapons = []
	global.named = {}
	global.sprites = {}

	// Announcement counter.
	global.latestAnnouncement = 2
	global.latestAnnouncementLink = "https://store.steampowered.com/news/app/2400160/view/4547038620970842351"

	// Global variables
	global.lightningRenderer = null
	global.currentUILanguage = "english"
	global.currentGameLanguage = "english"
	global.currentDifficulty = 1
	global.isUIEastAsian = false
	global.isGameEastAsian = false
	global.isLatinized = false
	global.isEastAsianPrimaryDisplay = false
	global.longRange = 480
	global.pauseState = 0 // Paused if > 0, n indicates num pause requests
	global.missionTier = 1
	global.omenLevel = 0
	global.maxOmenLevel = 6
	global.timeElapsed = 0
	global.timeLastFrame = 0
	global.expectedFrameTime = 1000 / Sphere.frameRate
	global.selectedTurret = null
	global.currentTurret = null
	global.currentExperience = 0
	global.expToNextLevel = 5
	global.currentLevel = 5
	global.currentScreen = 0
	global.usingController = false
	global.keyboardArrows = false
	global.currentFocus = null
	global.inUpgradeMenu = false
	global.inConfirmPopUp = false
	global.pickupCount = 0
	global.levelUpCount = 0
	global.currentPickups = []
	global.pendingEvolution = []
	global.armoredEnemies = [
		"Warder",
		"CerberusHead"
	]
	
	// Boss variables.
	global.boss = null

	// Statistics.
	global.totalTypingTime = 0
	global.charactersCompleted = 0
	global.totalMistypes = 0
	global.perfectInputRecord = 0
	global.totalDamage = 0
	global.coinsEarned = 0

	// Global upgrades.
	global.serializedLoot = {}
	global.serializedUpgrades = []
	global.powerups = []
	global.extraLetters = []
	global.extraButtons = []
	global.shields = 0
	global.maxShields = 3
	global.reroll = 0
	global.maxReroll = 5
	global.freezeDurationBonus = 0
	global.doubleDamageDurationBonus = 0
	global.powerup_freeze = false
	global.activeAugments = {}

	// Collision filter constants.
	global.friendly = 0x0002
	global.hostile = 0x0004

	// Scaling.
	global.screenScale = 1
	global.scalePix = function(pix) { return pix * screenScale }
	global.setScreenScale = function() { screenScale = Surface.Screen.height / 1080 }

	// UI Font auto-picking functions.
	global.regularFontUI = function() { return isUIEastAsian ? regularEastAsian : typingFont }
	global.titleFontUI = function() { return isUIEastAsian ? titleEastAsian : grandRegular }
	global.smallFont = function() { return isUIEastAsian ? regularEastAsianSmall : typingFontSmall }
	global.titleFontSmall = function() { return isUIEastAsian ? titleEastAsianSmall : grandRegularSmall }
	global.pickTitleFont = function(text, targetWidth)
	{
		if (
			(isUIEastAsian && eastAsianWordWrap(titleFontUI(), text, targetWidth).length > 1) ||
			(!isUIEastAsian && titleFontUI().wordWrap(text, targetWidth).length > 1)
		)
			return titleFontSmall()
		return titleFontUI()
	}

	// Game font auto-picking functions.
	global.regularFontGame = function() { return isGameEastAsian ? regularEastAsian : typingFont }
	global.titleFontGame = function() { return isGameEastAsian ? titleEastAsian : grandRegular }

	global.audioHandler = new Audio()

	global.difficultyUnlocked = function(difficulty)
	{
		return difficulty > 1 ? false : true
	}

	global.getExistingWeapon = function(name)
	{
		return [...allWeapons, currentTurret].find(weap => weap && weap.constructor.name == name)
	}

	global.startGame = function(omen = 0, saveState = null)
	{
		resetPause()
		Keyboard.Default.clearQueue()
		currentScreen = game
		timeElapsed = 0
		outOfLoot = false
		control.blitzTimeKeeper.fill(Date.now())
		pickupController.start()
		ui.hud.bottom.clearWeapons()
		extraLetters = []
		extraButtons = []
		lightningRenderer = factory.spawn(EffectsSurface)

		// Reset modifiers.
		modifiers.resetModifiers()

		// Spawn Main Weapon.
		omenLevel = saveState ? saveState.omenLevel : omen
		new selectedTurret()
		ui.hud.bottom.addWeapon(currentTurret)

		// Augment init function.
		let initAllAugments = function()
		{
			let currentAugments = Object.keys(activeAugments)
			if (currentAugments.length > 0)
				augmentsList().forEach((augment) => {
					if (currentAugments.includes(augment.name) && augment.start_action)
						augment.start_action(activeAugments[augment.name])
				})
			lootAndAugments()
		}

		// Load game if any.
		if (saveState)
		{
			// Load all augments
			activeAugments = saveState.activeAugments || {}
			initAllAugments()

			// Load all upgrades and evolutions.
			serializedUpgrades = saveState.serializedUpgrades
			serializedUpgrades.forEach(entry => {
				let weap = getExistingWeapon(entry[0]) || GiveWeapon(entry[0])
				if (entry.length == 1) return

				// If evolution.
				if (entry[1] == "evolution")
				{
					let list = weap.getEvolution()
					let upgrade = list.find(item => item.name == entry[2])
					upgrade.effect(upgrade.reference)
					if ("augment_fortress" in activeAugments &&
						upgrade.reference.constructor.nonDamageTags().includes("tag_turret"))
					{
						currentTurret.currentHealth += activeAugments["augment_fortress"] * 50
						currentTurret.health += activeAugments["augment_fortress"] * 50
					}
					weap.evolutionLevel++
					ui.hud.bottom.addEvolution(weap)
				}

				// If upgrade.
				else
				{
					let list = weap.getUpgrades()
					let upgrade = list.find(item => item.name == entry[2])
					upgrade.effect(upgrade.reference)
					ui.hud.bottom.addUpgrade(weap)
				}
			})

			// Load evolution progess for each weapon.
			saveState.evolutionLevels.forEach(entry => {
				let weap = getExistingWeapon(entry[0]) || GiveWeapon(entry[0])
				weap.currentEvolution = entry[1]
				weap.maxEvolution = entry[2]
			})

			// Load all loot.
			serializedLoot = saveState.serializedLoot
			let allLoot = LootItems()
			for (const loot in serializedLoot)
			{
				let item = allLoot.find(entry => entry.name == loot)
				for (let i = 0; i < serializedLoot[loot]; i++)
					item.action(true)
			}

			// Load other saved variables.
			missionTier = saveState.trialLevel
			currentLevel = saveState.currentLevel
			currentExperience = saveState.currentExperience
			expToNextLevel = saveState.expToNextLevel
			shields = saveState.shields
			maxShields = saveState.maxShields
			reroll = saveState.reroll
			maxReroll = saveState.maxReroll
			levelUpCount = saveState.levelUpCount
			pendingEvolution = saveState.pendingEvolution
			pendingEvolution.forEach(evo => getExistingWeapon(evo).evolutionLevel++)
			freezeDurationBonus = saveState.freezeDurationBonus
			doubleDamageDurationBonus = saveState.doubleDamageDurationBonus
			currentTurret.currentHealth = saveState.currentHealth
		}
		else
		{
			serializedLoot = {}
			serializedUpgrades = []
			missionTier = 1
			currentLevel = 1
			currentExperience = 0
			expToNextLevel = 50
			shields = 0
			maxShields = 3
			reroll = 3
			maxReroll = 5
			levelUpCount = 0
			pendingEvolution = []
			freezeDurationBonus = 0
			doubleDamageDurationBonus = 0
			initAllAugments()
			currentTurret.refreshModifiers()
		}
		
		// Reset all temporary variables.
		spawner.start()
		pickupCount = 0
		currentPickups = []
		powerup_freeze = false
		totalDamage = 0
		coinsEarned = 0

		// Reset all statistics.
		totalTypingTime = 0
		charactersCompleted = 0
		totalMistypes = 0
		perfectInputRecord = 0

		// Show Rich Presence Steam Friends.
		if (steamEnabled)
		{
			ISteamFriends.SetRichPresence("CurrentLevel", currentLevel.toString())
			if (missionMode) ISteamFriends.SetRichPresence("TrialNumber", String(missionTier))
			if (omenLevel > 0)
			{
				ISteamFriends.SetRichPresence("OmenLevel", romanize(omenLevel))
				ISteamFriends.SetRichPresence("steam_display", missionMode ? "#Mode_Trials_Omen" : "#Mode_Endless_Omen")
			}
			else ISteamFriends.SetRichPresence("steam_display", missionMode ? "#Mode_Trials" : "#Mode_Endless")
		}

		// Change UI.
		ui.hud.show()
		ui.hud.top.hud_boss_subtitle[missionMode ? "show" : "hide"]()
		Sphere.sleep(80).then(() => ui.setHUDState("game"))

		// Show get ready announcement.
		pause("gameStartAnnounce")
		factory.spawn(Announcer, localize("get_ready"), missionMode ? localize("trial_text", convertIfChinese(missionTier)) : localize("endless_mode"))
			.endPromise.then(() => {

				// Start game.
				unpause("gameStartAnnounce")
				control.suspend(false)

				// If "Eager" in Augments, add pending level up.
				if ("augment_eager" in activeAugments)
					levelUpCount++

				// If Haze Augment.
				if ("augment_haze" in activeAugments &&
					currentTurret.currentHealth < currentTurret.health * .5 &&
					!powerups.some(powerup => powerup.constructor.name == "Haze")
				)
					factory.spawn(Haze, Infinity)

				// Prompt pending evolutions.
				if (pendingEvolution.length > 0)
					getExistingWeapon(pendingEvolution[pendingEvolution.length - 1]).showEvolutionPrompt(true)

				// Prompt pending levelUps.
				if (levelUpCount > 0)
				{
					ui.levelUpPrompt.updateLevelUpCount()
					factory.spawn(LevelUpDots, {x: screenCenter.x, y: Surface.Screen.height * .3})
						.endPromise.then(() => ui.levelUpPrompt.init())
				}
			})

		// Change playlist.
		bgm.setPlaylist("game")
	}

	global.missionComplete = function()
	{
		// Hide level up, if any.
		if (!ui.levelUpPrompt.hidden)
			ui.levelUpPrompt.hide()
		if (!ui.hud.bottom.evolutionPopUp.hidden)
			ui.hud.bottom.evolutionPopUp.hide()
		
		// Clear keylogs and temp powerups.
		for (let i = powerups.length - 1; i >= 0; i--)
			powerups[i].expire(true)
		Keylog = "**********"
		Joylog.fill(null)
		wordsInUse.forEach(v => v[2].updateWordDisplay(2))
		pickupController.stop()
		spawner.stop();

		// Trigger mission complete event for all weapons.
		[...allWeapons, currentTurret].forEach(weap => weap.onTrialComplete())

		// Destroy all enemies in reverse order to avoid issues with object removals.
		for (let i = hostilesArray.length - 1; i >= 0; i--)
		{
			if (hostilesArray[i] && hostilesArray[i].getType() == type.enemy)
				hostilesArray[i].destroy()
		}

		// Clear all pickups.
		for (let i = currentPickups.length - 1; i >= 0; i--)
			currentPickups[i].stop()

		// Show mission complete.
		control.noMistypes = 0
		control.suspend(true)
		audioHandler.playAudioHook('trial_success')
		ui.setHUDState("none")
		bgm.fadeTo(bgm.getMusicInSet("summaryScreen"))
		factory.spawn(Announcer, localize("mission_complete"))
		Sphere.sleep(180).then(() => {
			if (missionTier >= maxMissionTier || omenLevel < -1)
			{
				pause("endgame")
				ui.summaryScreen.panel.refresh(false)
				ui.summaryScreen.startIntro()
			}
			else ui.showLootUI(true)
		})
	}

	global.nextMissionStart = function()
	{
		resetPause()
		Keyboard.Default.clearQueue()
		currentScreen = game
		timeElapsed = 0
		control.blitzTimeKeeper.fill(Date.now())
		pickupController.start()
		spawner.start();

		// Reset all current weapons dps calculation.
		[...allWeapons, currentTurret].forEach(weap => {
			weap.totalDamage = 0
			weap.timeSpawned = 0
			weap.onTrialStart()
		})

		// Reset all statistics.
		totalTypingTime = 0
		charactersCompleted = 0
		totalMistypes = 0
		perfectInputRecord = 0
		totalDamage = 0
		coinsEarned = 0

		// Change UI.
		ui.hud.show()
		ui.hud.top.hud_boss_subtitle.show()
		Sphere.sleep(80).then(() => ui.setHUDState("game"))

		// Show get ready announcement.
		pause("gameStartAnnounce")
		factory.spawn(Announcer, localize("get_ready"), missionMode ? localize("trial_text", convertIfChinese(missionTier)) : "")
			.endPromise.then(() => {

				// Start game.
				unpause("gameStartAnnounce")
				control.suspend(false)

				// If "Eager" in Augments, add pending level up.
				if ("augment_eager" in activeAugments)
					levelUpCount++

				// If Haze Augment.
				if ("augment_haze" in activeAugments &&
					currentTurret.currentHealth < currentTurret.health * .5 &&
					!powerups.some(powerup => powerup.constructor.name == "Haze")
				)
					factory.spawn(Haze, Infinity)

				// If Conviction Augment.
				if ("augment_conviction" in activeAugments
					&& reroll == maxReroll
					&& !powerups.some(powerup => powerup.constructor.name == "Conviction")
				)
					factory.spawn(Conviction, Infinity)
				
				// If Deliverance Augment.
				if ("augment_deliverance" in activeAugments
					&& shields == maxShields
					&& !powerups.some(powerup => powerup.constructor.name == "Deliverance")
				)
					factory.spawn(Deliverance, Infinity)

				// Prompt both pending evolutions and levelUps.
				if (pendingEvolution.length > 0)
					getExistingWeapon(pendingEvolution[pendingEvolution.length - 1]).showEvolutionPrompt(true)
				if (levelUpCount > 0)
					factory.spawn(LevelUpDots, {x: screenCenter.x, y: Surface.Screen.height * .3})
						.endPromise.then(() => ui.levelUpPrompt.init())
			})

		// Change playlist.
		bgm.setPlaylist("game")
	}

	global.endGame = function()
	{
		// Hide level up, if any.
		if (!ui.levelUpPrompt.hidden)
			ui.levelUpPrompt.hide()
		if (!ui.hud.bottom.evolutionPopUp.hidden)
			ui.hud.bottom.evolutionPopUp.hide()

		// Clear all pickups.
		for (let i = currentPickups.length - 1; i >= 0; i--)
			currentPickups[i].stop()

		// Clear all powerups.
		for (let i = powerups.length - 1; i >= 0; i--)
			powerups[i].expire(true)

		// Shutdown boss, if any.
		if (boss)
		{
			boss.suspend()
			boss = null
		}

		// Destroy turret visually.
		currentTurret.suspend()
		audioHandler.playAudioHookUI("main_turret_destroyed")
		factory.spawn(Impact, screenCenter.x, screenCenter.y)
		for (let i = 0; i < 10; i++)
			factory.spawn(Debris, screenCenter.x, screenCenter.y)

		// Log time and DPS.
		console.log("Death occured at " + timeToString(timeElapsed))
		logDpsRanking()
		
		// Stop game.
		pickupController.stop()
		spawner.stop()
		pause("endgame")

		// Show summary screen.
		inUpgradeMenu = true
		levelUpCount = 0
		pendingEvolution = []
		control.noMistypes = 0
		control.suspend(true)
		bgm.fadeTo(bgm.getMusicInSet("summaryScreen"))
		factory.spawn(Announcer, localize("you_are_destroyed"))
		Sphere.sleep(70).then(() => {
			ui.summaryScreen.panel.refresh()
			ui.summaryScreen.startIntro()
		})
	}

	global.returnToMainMenu = function()
	{
		// Clear all weapons.
		if (currentTurret)
		{
			currentTurret.stop()
			currentTurret = null
		}
		factory.stopAll()
		for (const weapon of allWeapons)
			if (weapon instanceof Task)
				weapon.stop()
		allWeapons = []
		powerups = []
		Keylog = "**********"
		Joylog.fill(null)

		// Hide Rich Presence Steam Friends.
		if (steamEnabled)
			ISteamFriends.SetRichPresence("steam_display", "")

		// Save game.
		saveGame()

		// Change UI.
		ui.setHUDState("none")
			.then(() => {
				ui.hud.hide()
				ui.main_menu.turrets.refresh()
				ui.showMainMenu()
			})
	}

	global.isPaused = function()
	{
		return global.pauseState > 0
	}

	global.resetPause = function()
	{
		global.pauseState = 0
		audioHandler.setInGameVolume(1)
	}

	global.pause = function(pauseSource)
	{
		console.log("Paused by: " + pauseSource)
		if (global.pauseState == 0)
		{
			audioHandler.fadeInGameVolume(0)
			ui.inGameWordOpacityTween.easeIn({inGameWordOpacity: 0}, 10)
		}
		global.pauseState += 1
	}

	global.unpause = function(pauseSource)
	{
		console.log("Unpaused by: " + pauseSource)
		if (global.pauseState > 0)
			global.pauseState -= 1
		if (global.pauseState == 0)
		{
			audioHandler.fadeInGameVolume(1)
			ui.inGameWordOpacityTween.easeIn({inGameWordOpacity: 1}, 10)
		}
	}

	global.weightedRandom = function(list, samplesOut)
	{
		let totalWeight = 0
		let result = []
		let excludedGroups = []
		for (let i = 0; i < samplesOut; i++)
		{
			// Calculate total weight.
			totalWeight = 0
			list = list.filter(item => "group" in item ? !excludedGroups.includes(item.group) : true)
			list.forEach(obj => totalWeight += Math.max(obj.weight, 1))
			
			// Randomly pick one from list, adjusted by weight.
			if (list.length <= 0) break
			let random = Random.discrete(0, totalWeight)
			let randomPick = list.find((obj) => {
				random -= Math.max(obj.weight, 1)
				return random <= 0
			})

			// Process result.
			if ("group" in randomPick) excludedGroups.push(randomPick.group)
			result.push(randomPick)
			list[list.indexOf(randomPick)] = list[list.length - 1]
			list.pop()
		}
		return result
	}

	global.getUpgrades = function()
	{
		// Grab all available upgrades.
		let upgrades = []
			.concat(WeaponsList())
			.concat(currentTurret.getUpgrades())
		for (const weapon of allWeapons)
			if (weapon.isWeapon)
				upgrades = upgrades.concat(weapon.getUpgrades())
		upgrades = upgrades.filter(upgrade => upgrade.requirementsMet)

		// Get 3 eligible upgrades using weighted random.
		let availableUpgrades = weightedRandom(upgrades, 3)

		if (availableUpgrades.length > 0)
			return availableUpgrades
		else
			return from(RepeatingUpgrades())
				.sample(3)
				.toArray()
	}

	// Change language.
	global.eastAsianRange = new RegExp("[\u3131-\uD79D\u4E00-\u9FFFぁ-んァ-ン]")
	global.changeLanguage = function(lang)
	{
		changeUILanguage(lang)
		changeGameLanguage(lang)
	}

	global.changeUILanguage = function(lang)
	{
		if (!(lang in localization)) lang = "english"
		currentUILanguage = lang
		isUIEastAsian = eastAsianRange.test(localize('language_name')[0])
	}

	global.changeGameLanguage = function(lang)
	{
		if (!(lang in wordlists)) lang = "english"
		currentGameLanguage = lang
		isLatinized = Array.isArray(wordlists[lang]["4"][0])
		isGameEastAsian = eastAsianRange.test(isLatinized ? wordlists[lang]["4"][0][1] : wordlists[lang]["4"][0])
		isEastAsianPrimaryDisplay = isGameEastAsian && !isLatinized
		global.possibleExtraLetters = [getTriggerLetters('Extra_1'), getTriggerLetters('Extra_2')]
	}

	// Word wrap for east asian languages.
	global.eastAsianWordWrap = function(font, text, width)
	{
		let result = []
		let currentLength = 0
		let currentString = ""
		for (const char of text)
		{
			let charWidth = font.widthOf(char)
			if (currentLength + charWidth > width)
			{
				result.push(currentString)
				currentString = char
				currentLength = charWidth
			}
			else
			{
				currentString += char
				currentLength += charWidth
			}
		}
		if (currentString != "")
			result.push(currentString)
		return result
	}

	// Helper function to get the sprite for the current theme.
	global.getSprite = function(spriteName)
	{
		if (spriteName in sprites)
			return sprites[spriteName]
	}

	// Increase experience.
	global.addExperience = function(exp)
	{
		 // No leveling up in typing mode.
		if (omenLevel < -1) return

		if (currentExperience + exp < expToNextLevel)
			currentExperience += exp
		else
		{
			currentExperience = exp - (expToNextLevel - currentExperience)
			expToNextLevel += 60
			factory.spawn(LevelUpDots, {x: screenCenter.x, y: Surface.Screen.height * .3}).endPromise
				.then(() => {

					// Increase pending level up.
					levelUpCount++

					// If game is still running, show the level up prompt.
					if (spawner.running)
					{
						ui.levelUpPrompt.updateLevelUpCount()
						if (levelUpCount == 1) ui.levelUpPrompt.init()
					}
				})
		}
	}

	global.levelUp = function(chainLevel = false)
	{
		// Hide level up prompt.
		if (!ui.levelUpPrompt.hidden) ui.levelUpPrompt.hide()
		levelUpCount--

		// Clear keylog.
		Keylog = "**********"
		Joylog.fill(null)
		wordsInUse.forEach(v => v[2].updateWordDisplay(2, true))

		// Display current level.
		currentLevel++
		ui.upgradeScreen.lhs.level.setText(localize("level", levelNumberText()))
		if ("firstLevelUpDone" in save)
			ui.upgradeScreen.lhs.typeHint.hide()
		else
		{
			save.firstLevelUpDone = true
			Sphere.sleep(40).then(() => {
				ui.upgradeScreen.lhs.typeHint.show()
				ui.upgradeScreen.lhs.typeHint.blink()
			})
		}

		// Get dps rankings.
		let dpsRanking = getSortedDpsRanking()

		// Update HUD Level.
		let lvlText = ui.hud.top.hud_level
		lvlText.setText(localize("level", levelNumberText()) + " " + dpsRanking[0][0])

		// Update steam rich presence (if on Steam)
		if (steamEnabled)
		{
			ISteamFriends.SetRichPresence("CurrentLevel", currentLevel.toString())
			ISteamFriends.SetRichPresence("ClassName", dpsRanking[0][0])
		}

		// Auto-level.
		if (!isOozaru && autoLevel)
		{
			let upgrade = getUpgrades()[0]
			if (upgrade.reference)
			{
				upgrade.effect(upgrade.reference)
				ui.hud.bottom.addUpgrade(upgrade.reference)
			}
			else upgrade.effect()
			return
		}

		// Update top weapon.
		ui.upgradeScreen.lhs.topWeapon.setText(dpsRanking[0][0])

		// Populate weapon rankings.
		let rankingText = dpsRankingToText(dpsRanking)
		ui.upgradeScreen.lhs.weaponRanking.setText(rankingText)

		// Populate upgrade menu.
		ui.upgradeScreen.upgradeOptions.forEach(u => u.hide())
		getUpgrades().forEach((v, i) => {
			ui.upgradeScreen.upgradeOptions[i].setUpgrade(v)
		})

		// Show Upgrade UI.
		ui.upgradeScreen.startIntro(chainLevel)
	}
	
	// Add/remove hostile/friendly bodies.
	global.addFriendly = function(object)
	{
		friendlies[object.body.id] = object
		friendlyBodies.push(object.body)
	}
	global.removeFriendly = function(object)
	{
		delete friendlies[object.body.id]
		const index = friendlyBodies.indexOf(object.body)
		if (index >= 0)
		{
			friendlyBodies.splice(index, 1)
		}
	}
	global.addHostile = function(object)
	{
		hostiles.set(object.body.id, object)
		hostilesArray.push(object)
		hostileBodies.push(object.body)
	}
	global.removeHostile = function(object)
	{
		hostiles.delete(object.body.id)
		const index = hostileBodies.indexOf(object.body);
		if (index >= 0) {
			hostileBodies[index] = hostileBodies[hostileBodies.length - 1];
			hostileBodies.pop();

			hostilesArray[index] = hostilesArray[hostilesArray.length - 1];
			hostilesArray.pop();
		}
	}

	global.timeToString = function(time)
	{
		if (!time) return "00:00:00"
		let min = Math.floor(time / 60000).toString().padStart(2, '0')
		let sec = Math.floor(time % 60000 / 1000).toString().padStart(2, '0')
		let ms = Math.floor(time % 1000 / 10).toString().padStart(2, '0')
		return (min + ":" + sec + ":" + ms)
	}

	global.getSortedDpsRanking = function()
	{
		let dpsRanking = []
		for (const weapon of [...allWeapons, currentTurret])
			dpsRanking.push([weapon.constructor.getName(), weapon.getDPS(), weapon])
		dpsRanking.sort((a, b) => b[1] - a[1])
		return dpsRanking
	}

	global.dpsRankingToText = function( dpsRanking )
	{
		let rankingText = ""
		for (let i = 0; i < dpsRanking.length; i++)
			rankingText += (i > 0 ? "\n" : "") + (i + 1) + ". " + dpsRanking[i][0] + " - " + dpsRanking[i][1].toFixed(1) + " dps"
		return rankingText
	}

	global.logDpsRanking = function()
	{
		let dpsRanking = getSortedDpsRanking()
		console.log("DPS ranking:")
		console.log(dpsRankingToText(dpsRanking))
	}

	// Polygon collider shape.
	global.polyCollider = function(vertices, filter = null)
	{
		let options = {
			position: Vector.create(0, 0),
			isSensor: true,
			isStatic: true
		}
		if (filter != null)
		{
			options["collisionFilter"] = {}
			if (filter.category != null)
				options["collisionFilter"]["category"] = filter.category
			if (filter.mask != null)
				options["collisionFilter"]["mask"] = filter.mask
		}
		return Matter.Bodies.fromVertices(0, 0, vertices, options)
	}

	// Rectangular collision shape.
	global.rectCollider = function(width, height, filter = null) {
		let left = -width/2
		let right = width/2
		let bottom = -height/2
		let top = height/2
		let vertices = [
			{'x': left, 'y': top},
			{'x': right, 'y': top},
			{'x': right, 'y': bottom},
			{'x': left, 'y': bottom}
		]
		return polyCollider(vertices, filter)
	}

	// Circular collision shape.
	global.circleCollider = function(radius, filter = null)
	{
		let options = {
			position: Vector.create(0, 0),
			isSensor: true,
			isStatic: true
		}
		if (filter != null)
		{
			options["collisionFilter"] = {}
			if (filter.category != null)
				options["collisionFilter"]["category"] = filter.category
			if (filter.mask != null)
				options["collisionFilter"]["mask"] = filter.mask
		}
		return Matter.Bodies.circle(0, 0, radius, options)
	}

	// Detect all collisions with body.
	global.detectCollisions = function(body, bodies)
	{
		let collisions = []
		for (const other of bodies)
		{
			if (other != body && Matter.Detector.canCollide(other.collisionFilter, body.collisionFilter))
			{
				let collision = Matter.Collision.collides(body, other)
				if (collision != null)
					collisions.push(collision)
			}
		}
		return collisions
	}

	// Draw progress bar.
	global.drawProgress = function(x, y, width, height, percent, centerOrigin = true)
	{
		let left = centerOrigin ? x - width / 2 : x
		let top = centerOrigin ? y - height / 2 : y
		PrimNative.drawFilledRectangle(
			Surface.Screen,
			left,
			top,
			left + width,
			top + height,
			midGray.fadeTo(0.3)
		)
		PrimNative.drawFilledRectangle(
			Surface.Screen,
			left,
			top,
			left + width * percent,
			top + height,
			midGray
		)
	}

	global.isInActiveBounds = function(pos)
	{
		return Matter.Bounds.contains(global.activeBounds, pos)
	}

	global.shiftIntoActiveBounds = function(pos)
	{
		if (pos.x < global.activeBounds.min.x)
		{
			pos.x = global.activeBounds.min.x
		}
		else if (pos.x > global.activeBounds.max.x)
		{
			pos.x = global.activeBounds.max.x
		}

		if (pos.y < global.activeBounds.min.y)
		{
			pos.y = global.activeBounds.min.y
		}
		else if (pos.y > global.activeBounds.max.y)
		{
			pos.y = global.activeBounds.max.y
		}
		return pos
	}

	// Look for nearest hostile for friendly drones.
	global.droneFindNearestEnemy = function(position)
	{
		return hostilesArray
			.reduce((nearest, enemy) => {
				return (enemy.getType() == type.enemy &&
					Matter.Bounds.overlaps(enemy.body.bounds, screenBounds) &&
					(
						nearest == null ||
						distanceBetween(position, enemy.getPosition())
							< distanceBetween(position, nearest.getPosition())
					)
				) ? enemy : nearest
			}, null)
	}

	// Return shape with image as texture.
	global.textureShape = function(texture, originAtCenter = true, sx = 0, sy = 0, sw = 0, sh = 0)
	{
		let tex = texture
		if (sw > 0 && sh > 0)
		{
			tex = new Surface(sw, sh)
			Prim.blitSection(tex, 0, 0, texture, sx, sy, sw, sh)
		}

		let left = originAtCenter ? -tex.width / 2 : 0
		let right = originAtCenter ? tex.width / 2  : tex.width
		let top = originAtCenter ? -tex.height / 2 : 0
		let bottom = originAtCenter ? tex.height / 2 : tex.height

		return new Shape(ShapeType.Fan, tex, new VertexList(
			[
				{x: left, y: top, u: 0, v: 1},
				{x: right, y: top, u: 1, v: 1},
				{x: right, y: bottom, u: 1, v: 0},
				{x: left, y: bottom, u: 0, v: 0}
			]
		))
	}

	// Distance between two vectors.
	global.distanceBetween = function(v1, v2)
	{
		return Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2))
	}

	// Are 2 Vectors equal?s
	global.isEqual = function(v1, v2)
	{
		return (v1.x == v2.x && v1.y == v2.y)
	}

	// Get smallest angle difference.
	global.diff = function(from, to)
	{
		let result = to - from
		if (result > Math.PI)
			result -= Math.PI * 2
		else if (result < -Math.PI)
			result += Math.PI * 2
		return result
	}

	global.romanize = function(number)
	{
		let result = convertIfChinese(number)
		if (!Number.isInteger(result)) return result
		
		switch(number)
		{
			case 1: return 'I'
			case 2: return 'II'
			case 3: return 'III'
			case 4: return 'IV'
			case 5: return 'V'
			case 6: return 'VI'
			case 7: return 'VII'
			case 8: return 'VIII'
			case 9: return 'IX'
			case 10: return 'X'
		}
	}

	global.calculateScreenDimensions = function()
	{
		// Position middle of screen.
		global.screenCenter = {
			x: Surface.Screen.width / 2,
			y: Surface.Screen.height / 2
		}
		// Position middle of screen.
		global.screenCenter = {
			x: Surface.Screen.width / 2,
			y: Surface.Screen.height / 2
		}
		// Screen bounds.
		global.screenBounds = Matter.Bounds.create([
			{'x': 0, 'y': 0},
			{'x': Surface.Screen.width, 'y': 0},
			{'x': Surface.Screen.width, 'y': Surface.Screen.height},
			{'x': 0, 'y': Surface.Screen.height}
		])
		let activeOffset = scalePix(49)
		let activeOffsetTop = scalePix(80)
		global.activeBounds = Matter.Bounds.create([
			{'x': activeOffset, 'y': activeOffsetTop},
			{'x': Surface.Screen.width - activeOffset, 'y': activeOffsetTop},
			{'x': Surface.Screen.width - activeOffset, 'y': Surface.Screen.height - activeOffset},
			{'x': activeOffset, 'y': Surface.Screen.height - activeOffset}
		])
	}
	calculateScreenDimensions()

	// Get collision point between line and body.
	global.startVec = new vec2(0, 0)
	global.endVec = new vec2(0, 0)
	global.collisionPoint = function(start, end, body)
	{
		startVec.x = start.x
		startVec.y = start.y
		endVec.x = end.x
		endVec.y = end.y
		let rayCol = ray.bodyCollisions(new ray(startVec, endVec), body)[0]
		return rayCol != null ? rayCol.point : body.position
	}

	// Get relative vertices from absolute ones.
	global.getRelativeVertices = function(x, y, vertices) {
		let result = []
		vertices.forEach(vertex => {
			result.push({'x': vertex.x - x, 'y': vertex.y - y})
		})
		return result
	}

	// Get current enemy count.
	global.enemyCount = function()
	{
		return hostilesArray.reduce((total, current) => total += current.getType() == type.enemy && isInActiveBounds(current.getPosition()), 0)
	}

	// Wrapper for Matter.js Vector class.
	global.Vector = Matter.Vector

	// Translation function.
	global.localize = function(string, ...replaceStrings){
		let keyInLoc = currentUILanguage in localization &&
			string in localization[currentUILanguage] &&
			localization[currentUILanguage][string] != ""
		let loc = localization[keyInLoc ? currentUILanguage : "english"]
		if (keyInLoc || string in loc)
		{
			let localizedString = loc[string]
			let replacements = localizedString.match(/{[0-9]*?}/g)
			if (replacements)
				for (const str of replacements)
				{
					let index = parseInt(str.substring(1, str.length - 1))
					if (index && index > 0 && index <= replaceStrings.length)
						localizedString = localizedString.replace(str, replaceStrings[index - 1])
				}
			return localizedString
		}
		return string
	}

	// Get localized trigger letters.
	global.getTriggerLetters = function(key)
	{
		return currentGameLanguage in triggerLetters &&
			key in triggerLetters[currentGameLanguage] &&
			triggerLetters[currentGameLanguage][key].length > 0 
			?
				triggerLetters[currentGameLanguage][key] :
				triggerLetters.english[key]
	}

	// Array comparison.
	// Warn if overriding existing method
	if(Array.prototype.equals)
		console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.")

	// attach the .equals method to Array's prototype to call it on any array
	Array.prototype.equals = function (array) {

		// if the other array is a falsy value, return
		if (!array)
			return false

		// if the argument is the same array, we can be sure the contents are same as well
		if(array === this)
			return true

		// compare lengths - can save a lot of time
		if (this.length != array.length)
			return false

		for (var i = 0, l = this.length; i < l; i++) {

			// Check if we have nested arrays
			if (this[i] instanceof Array && array[i] instanceof Array) {

				// recurse into the nested arrays
				if (!this[i].equals(array[i]))
					return false
			}

			else if (this[i] != array[i]) {
				return false
			}
		}
		return true
	}

	// Strip comments from JSON.
	global.stripComments = function(data)
	{
		return data.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m)
	}

	// Get panning float.
	global.getPanFromX = function(xPos)
	{
		return (xPos - screenCenter.x) / screenCenter.x
	}

	// If desktop resolution is less than 1080p, return true
	global.isSmallScreen = function() {
		let resolution = Sphere.desktopResolution
		return resolution.width <= 1280 || resolution.height <= 720
	}

	// Resolution presets for windowed mode.
	global.presetResolutions = [
		{width: 1024, height: 576},
		{width: 1152, height: 648},
		{width: 1280, height: 720},
		{width: 1366, height: 768},
		{width: 1600, height: 900},
		{width: 1920, height: 1080},
		{width: 2560, height: 1440},
		{width: 3200, height: 1800},
		{width: 3840, height: 2160},
		{width: 5120, height: 2880},
		{width: 7680, height: 4320}
	]

	global.findNextSmallerRes = function(width = null, height = null)
	{
		// Check if possible to go smaller.
		if ((width && width <= 1024) || (height && height <= 576)) return null

		// Find current closest preset resolution.
		let index = presetResolutions.findIndex(res => (!width) ? res.height >= height : res.width >= width)

		// If current resolution is bigger than even our largest preset, return largest preset.
		if (index < 0) return presetResolutions[presetResolutions.length - 1]

		// Else, return next smallest preset.
		return presetResolutions[index - 1]
	}

	global.findNextLargerRes = function(width = null, height = null)
	{
		// Check if possible to go larger.
		let largestPossible = detectOptimalResolution(false)
		if ((width && width >= largestPossible.width) || (height && height >= largestPossible.height)) return null

		// Find preset resolution that is an exact match for current res.
		let index = presetResolutions.findIndex(res => (!width) ? res.height == height : res.width == width)

		// If non-preset resolution, return next largest.
		if (index < 0) return presetResolutions.find(res => (!width) ? res.height > height : res.width > width)

		// Else, return next larger preset.
		return presetResolutions[index + 1]
	}

	global.detectOptimalResolution = function(fullscreen = true)
	{
		let resolution = Sphere.desktopResolution

		// Perfect 16 : 9
		if ((resolution.width / resolution.height).toFixed(2) == "1.78")
			return fullscreen ? resolution : findNextSmallerRes(resolution.width, null)

		// Ultra-Widescreen
		else if (resolution.width / resolution.height > 1.78)
			return fullscreen ? { width: resolution.height / 9 * 16, height: resolution.height } : findNextSmallerRes(null, resolution.height)

		// Vertical monitors
		else
			return fullscreen ? { width: resolution.width, height: resolution.width / 16 * 9 } : findNextSmallerRes(resolution.width, null)
	}

	global.isResolutionSuitableForScreen = function(res, isFullScreen)
	{
		if (isOozaru)
			return res && res.width >= 1024 && res.width <= 7680 && res.height >= 576 && res.height <= 4320 && Math.abs(res.width / res.height - 16 / 9) < 0.01

		let resolution = Sphere.desktopResolution

		if (isFullScreen && (res.width != resolution.width || res.height != resolution.height))
			return false
		else if (!isFullScreen && (res.width >= resolution.width || res.height >= resolution.height))
			return false
		return true
	}

	// Hide method from for-in loops
	Object.defineProperty(Array.prototype, "equals", {enumerable: false})
	String.prototype.replaceAll = function(oldString, newString)
	{
		let result = this
		let done = false
		do {
			let before = result
			result = result.replace(oldString, newString)
			done = result === before
		}
		while ( !done )
		return result
	}
})()
