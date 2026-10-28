import '../libs/papaparse.js'
import { Document } from '../libs/nodom.js'
import * as imml from '../libs/imml.js'
import { Console } from 'sphere-runtime'
import { GiveWeapon, GiveAllWeapons, WeaponsList } from '../data/weaponsList.js'
import { generateSaveId } from './loader.js'
import { Loot } from '../pickups/loot.js'
import { Turrets } from '../data/turrets.js'
import { Scalers } from '../data/difficultyScalers.js'
import { DoubleDamagePickup } from '../pickups/doubleDamage.js'
import { FreezePickup } from '../pickups/freeze.js'
import { Shield } from '../pickups/shield.js'
import { Coins } from '../pickups/coins.js'
import { LootItems } from '../data/lootItems.js'
import { augmentsList, augmentCategories } from '../data/augmentsList.js'
import { profile } from './profile.js'

let cheatObject = {
	// Give weapon.
	'weapon': function (weaponName) {
		if (GiveWeapon(weaponName))
			console.log(`Successfully added "${weaponName}" to current weapons.`)
		else
			console.log(`Unrecognized weapon name "${weaponName}".`)
	},

	'doubleDamage': function () {
		console.log("Activating Double Damage.")
		let loot = factory.spawn(DoubleDamagePickup, 0, 0)
		loot.activate()
	},

	'freeze': function() {
		console.log("Activating Freeze")
		let loot = factory.spawn(FreezePickup, 0, 0)
		loot.activate()
	},

	'health': function(amt) {
		console.log(`Setting health to: ${amt}`)
		if (amt < currentTurret.currentHealth)
			currentTurret.getHit(currentTurret.currentHealth - amt)
		else
			currentTurret.addHealth(amt - currentTurret.currentHealth)
	},

	'shield': function() {
		console.log("Adding Shield")
		let loot = factory.spawn(Shield, 0, 0)
		loot.activate()
	},

	'reroll': function(amt) {
		console.log(`Adding ${amt} re-rolls.`)
		reroll += amt
		if (ui.buttonHints.ready && !ui.buttonHints.animating)
			ui.buttonHints.refreshReRoll()
	},

	'item': function(itemName) {
		let item = LootItems().find(loot => loot.name == itemName)
		if (item)
		{
			serializedLoot[itemName] = serializedLoot[itemName] || 0
			serializedLoot[itemName]++
			item.action()
			console.log(`Item "${localize(itemName)}" added.`)
		}
		else console.log(`ERROR: Item "${localize(itemName)}" does not exist!`)
	},

	'clearAchievements': function() {
		[
			'endless_20',
			'endless_30',
			'repeater_500',
			'spectre_500',
			'hunter_500',
			'minefield_500',
			'sentry_500',
			'chopper_500',
			'oscillator_500',
			'blade_500',
			'tesla_500',
			'meteor_500',
			'perfect_500',
			'perfect_1000'
		].forEach(ach => ISteamUserStats.ClearAchievement(ach))
		console.log(`Clearing all Steam Achievements... ${ISteamUserStats.StoreStats() ? 'success!' : 'failed!'}`)
	},

	'resetAugments': function() {
		console.log("Resetting augments.")
		save.augments = {}
	},

	'omen': function(level) {
		console.log(`Setting omen level to ${level}.`)
		omenLevel = level
	},

	'allweapons': function () {
		GiveAllWeapons()
	},

	// Level up.
	'levelUp': function () {
		addExperience(expToNextLevel - currentExperience)
	},

	// Evolve weapon.
	'evolve': function (weaponName) {
		let weap = [...allWeapons, currentTurret].find(w => w.constructor.name == weaponName)
		if (weap)
		{
			console.log(weaponName + " evolved.")
			weap.currentEvolution = weap.maxEvolution - 1
			weap.registerKill()
		}
		else console.log("Cannot find " + weaponName + " in current weapons.")
	},

	// Immortality.
	'immortal': function () {
		console.log("God-mode " + (immortal ? "off" : "on") + ".")
		immortal = !immortal
	},

	// Get Loot.
	'loot': function (amt = 0) {
		if (amt <= 0)
		{
			console.log("Dropping loot.")
			factory.spawn(Loot, 0, 0).activate()
		}
		else
		{
			console.log(`Generating ${amt} loot.`)
			let currentAutoLoot = autoLoot
			autoLoot = true
			for (let i = 0; i < amt; i++)
				factory.spawn(Loot, 0, 0).activate()
			autoLoot = currentAutoLoot
		}
	},

	// Die.
	'die': function () {
		console.log("Self-destruct activated.")
		endGame()
	},

	// Give money.
	'coins': function (amt) {
		if (!amt)
		{
			let coinPickup = factory.spawn(Coins, 0, 0)
			amt = coinPickup.addCoins
			coinPickup.expire(true)
		}
		console.log(`Printing ${amt} § in cash.`)
		save.coins += amt
		save.coinsTotal += amt
	},

	// Fast Forward time.
	'time': function (min) {
		let frames = min * 3600
		console.log("Fast forwarding time to frame: " + String(frames))
		timeElapsed = min * 60000
	},

	// Pause
	'pause': function () {
		console.log(pauseState ? "Game resumed." : "Game paused.")
		if (isPaused())
			unpause("console")
		else
			pause("console")
	},

	// Autotype
	'autoType': function (wpm) {
		console.log("WPM Simulator activating at " + wpm + " wpm.")
		wpmSimulator = wpm
	},

	// Fast forward to level
	'level': function (level) {
		console.log("Fast forwarding to level " + level)
		if (level <= currentLevel) return
		do {
			currentLevel++
			expToNextLevel += 60
			let upgrade = getUpgrades()[0]
			if (upgrade.reference)
			{
				upgrade.effect(upgrade.reference)
				upgrade.reference.refreshModifiers()
				ui.hud.bottom.addUpgrade(upgrade.reference)
				serializedUpgrades.push([upgrade.reference.constructor.name, "upgrade", upgrade.name])
			}
			else
			{
				upgrade.effect()
				serializedUpgrades.push([upgrade.class])
			}
		} while (currentLevel < level)
		[...allWeapons, currentTurret].forEach(v => v.refreshModifiers())
	},

	// Set auto-level to true.
	'autoLevel': function () {
		console.log("Autolevel " + (autoLevel ? "deactivated" : "activated"))
		autoLevel = !autoLevel
	},

	// Set auto-loot to true.
	'autoLoot': function () {
		console.log("Autoloot " + (autoLoot ? "deactivated" : "activated"))
		autoLoot = !autoLoot
	},

	// Trigger boss immediately.
	'boss': function() {
		console.log("Triggering boss now.")
		timeElapsed = missionCountdown * 17
	},

	'completeTrial': function() {
		console.log("Forcing trial completion.")
		if (boss)
			switch (boss.constructor.name)
			{
				case "Poet": boss.paragraphComplete(); break
				case "Cypher": boss.destroy(); break
			}
		else missionComplete()
	},

	'resolution': async function(height) {
		let width = height / 9 * 16
		Sphere.setResolution(width, height)
		setScreenScale()
		await loadFonts()
		calculateScreenDimensions()
		ui.refreshUI()
		console.log(`Setting resolution to ${width} x ${height}`)
	},

	'deleteSave': function() {
		const removeSave = async (saveId) => {
			let fileExists = await File.exists(saveId);
			if (fileExists) {
			{
				await File.remove(saveId);
			}
			} else {
				console.log(`Save file ${saveId} not found.`);
			}
			return fileExists;
		}

		(async () => {
			const fileRemoved = await removeSave(generateSaveId());
			return fileRemoved
		})().then((restart) => {
			if (restart) {
				console.log("Success! Restarting Game...");
				Sphere.restart();
			}
		})
	},

	'sr': function() {
		if (ui.steamRequests.isHidden())
		{
			ui.steamRequests.show()
		}
		else
		{
			ui.steamRequests.hide()
		}
	}
}

cheatObject.lu = cheatObject.levelUp
cheatObject.fullauto = function (wpm) {
	cheatObject.autoLevel()
	cheatObject.autoLoot()
	cheatObject.autoType(wpm)
}

cheatObject.chaos = function() {
	cheatObject.fullauto(1000)
	cheatObject.immortal()
	cheatObject.time(30)
	cheatObject.level(50)
	cheatObject.allweapons()
}

let infoObject = {

	// Generate wiki html.
	'wiki': async function()
	{
		// Return if not in-game.
		if (!spawner.running)
		{
			console.log("Please run this function when an active game is running.")
			return
		}

		// Grab css.
		let cssPath = '@/scripts/data/wikiStylesheet.css'
		let exists = await File.exists(cssPath)
		let styleSheet = exists ? await File.load(cssPath) : ""

		// Generate Source.
		let source = ""
		for (const lang of Object.keys(localization))
		{
			changeUILanguage(lang)
			let indent = 0
			let addLine = function(text) { source += "	".repeat(indent) + text + "\n" }

			addLine(`$title: ${localize("wiki_title")}`)
			addLine(`$description: ${localize("wiki_subtitle")}`)
			addLine(`[home(${localize("wiki_home_title")})]`)
			indent = 1
			addLine(`# ${localize("wiki_title")}`)
			addLine(localize(`## ${localize("wiki_landingPage_title")}`))
			addLine(localize("wiki_landingPage_intro") + "\n")
			addLine(localize("wiki_landingPage_intro2"))
			addLine(localize(`## ${localize("wiki_tableOfContents_title")}`))

			// Main Weapons
			addLine(`[main_weapons(${localize("wiki_mainWeapons_title")})]`)
			indent = 2
			addLine(`# ${localize("wiki_mainWeapons_title")}`)
			addLine(localize("wiki_mainWeapons_intro") + "\n")
			addLine(localize("wiki_mainWeapons_intro2"))
			addLine(`## ${localize("wiki_mainWeapons_list_title")}`)
			Turrets().forEach(turret => {
				if (!turret.weapon) return
				indent = 2
				let weapon = new turret.weapon
				addLine(`[${weapon.constructor.name.toLowerCase()}(${turret.name})]`)
				indent = 3
				addLine(`# ${turret.name}`)
				addLine(`${localize("wiki_tag_label")}: ${turret.tags.map(tag => localize(tag)).join(", ")}`)
				addLine(turret.desc + "\n")
				addLine(`## ${localize("wiki_weapon_evolution_title")}`)
				addLine(`|<div style="width:160px">${localize('wiki_name_label')}</div>|${localize('wiki_description_label')}`)
				addLine("|---|---")
				weapon.getEvolution().forEach(evo => {
					addLine(`|${localize(evo.name)}|${evo.desc.replaceAll("\n", "<br>")}`)
				})
				addLine(`## ${localize("wiki_weapon_upgrade_title")}`)
				addLine(`|<div style="width:160px">${localize('wiki_name_label')}</div>|${localize('wiki_description_label')}`)
				addLine("|---|---")
				weapon.getUpgrades().forEach(upgrade => {
					addLine(`|${localize(upgrade.name)}|${upgrade.desc.replaceAll("\n", "<br>")}`)
				})
			})

			// Level-Up Weapons
			indent = 1
			addLine(`[weapons(${localize("wiki_weapons_title")})]`)
			indent = 2
			addLine(`# ${localize("wiki_weapons_title")}`)
			addLine(localize("wiki_weapons_intro") + "\n")
			addLine(localize("wiki_weapons_intro2"))
			addLine(`## ${localize("wiki_weapons_list_title")}`)
			GiveAllWeapons()
			WeaponsList().forEach(weaponData => {
				let weapon = getExistingWeapon(weaponData.class)
				if (!weapon || !weapon.isWeapon) return

				indent = 2
				addLine(`[${weaponData.class.toLowerCase()}(${weaponData.name})]`)
				indent = 3
				addLine(`# ${weaponData.name}`)
				addLine(`${localize("wiki_tag_label")}: ${weaponData.tags.map(tag => localize(tag)).join(", ")}`)
				addLine((weaponData.triggerValue ? `${weaponData.triggerDesc} ${weaponData.triggerValue} ` : ``) + weaponData.desc + "\n")
				addLine(`## ${localize("wiki_weapon_evolution_title")}`)
				addLine(`|<div style="width:160px">${localize('wiki_name_label')}</div>|${localize('wiki_description_label')}`)
				addLine("|---|---")
				weapon.getEvolution().forEach(evo => {
					addLine(`|${localize(evo.name)}|${evo.desc.replaceAll("\n", "<br>")}`)
				})
				addLine(`## ${localize("wiki_weapon_upgrade_title")}`)
				addLine(`|<div style="width:160px">${localize('wiki_name_label')}</div>|${localize('wiki_description_label')}`)
				addLine("|---|---")
				weapon.getUpgrades().forEach(upgrade => {
					addLine(`|${localize(upgrade.name)}|${upgrade.desc.replaceAll("\n", "<br>")}`)
				})
			})

			// Enemies
			indent = 1
			addLine(`[enemies(${localize("wiki_enemies_title")})]`)
			indent = 2
			addLine(`# ${localize("wiki_enemies_title")}`)
			addLine(localize("wiki_enemies_intro") + "\n")
			addLine(localize("wiki_enemies_intro2"))
			addLine(`## ${localize("wiki_enemies_list_title")}`)
			spawner.classHierachy.forEach(enemyClass => {
				let enemy = enemyClass[0]
				indent = 2
				addLine(`[${enemy.name.toLowerCase()}(${enemy.getName()})]`)
				indent = 3
				addLine(`# ${enemy.getName()}`)
				addLine(enemy.getDesc())
				addLine(`## ${localize("wiki_enemy_variants_title")}`)
				addLine(`|${localize("wiki_image_label")}|${localize('wiki_description_label')}`)
				addLine("|---|---")
				enemyClass.forEach(variant => {
					let instance = factory.spawn(variant)
					let stats = ""
					if (instance.health) stats += `${localize("health")}: ${instance.health}<br>`
					if (instance.shield) stats += `${localize("item_shield")}: ${instance.shield}<br>`
					if (instance.damage) stats += `${localize("damage")}: ${instance.damage}<br>`
					if (variant.name.includes("Splitter"))
					{
						stats += `${localize("wiki_splitter_shard_count")}: ${instance.numShards}<br>`
						stats += `${localize("wiki_splitter_shard_health")}: ${instance.children[0].health}<br>`
						stats += `${localize("wiki_splitter_shard_damage")}: ${instance.children[0].damage}<br>`
					}
					addLine(`|<img src="img/${variant.name}.png">|${stats}`)
					instance.stop()
				})
			})

			// Items
			indent = 1
			addLine(`[loot(${localize("wiki_lootItems_title")})]`)
			indent = 2
			addLine(`# ${localize("wiki_lootItems_title")}`)
			addLine(localize("wiki_lootItems_intro") + "\n")
			addLine(localize("wiki_lootItems_intro2"))
			let loot = LootItems()
			addLine(`## ${localize("wiki_lootItems_rare_title")}`)
			addLine(`|<div style="width:160px">${localize('wiki_name_label')}</div>|${localize('wiki_description_label')}`)
			addLine("|---|---")
			loot.filter(l => l.rarity == rarity.rare).forEach(loot => {
				addLine(`|${localize(loot.name)}|${loot.desc.replaceAll("\n", "<br>")}`)
			})
			addLine(`## ${localize("wiki_lootItems_uncommon_title")}`)
			addLine(`|<div style="width:160px">${localize('wiki_name_label')}</div>|${localize('wiki_description_label')}`)
			addLine("|---|---")
			loot.filter(l => l.rarity == rarity.uncommon).forEach(loot => {
				addLine(`|${localize(loot.name)}|${loot.desc.replaceAll("\n", "<br>")}`)
			})
			addLine(`## ${localize("wiki_lootItems_common_title")}`)
			addLine(`|<div style="width:160px">${localize('wiki_name_label')}</div>|${localize('wiki_description_label')}`)
			addLine("|---|---")
			loot.filter(l => l.rarity == rarity.common).forEach(loot => {
				addLine(`|${localize(loot.name)}|${loot.desc.replaceAll("\n", "<br>")}`)
			})

			// Augments
			indent = 1
			addLine(`[loot(${localize("wiki_augments_title")})]`)
			indent = 2
			addLine(`# ${localize("wiki_augments_title")}`)
			addLine(localize("wiki_augments_intro") + "\n")
			addLine(localize("wiki_augments_intro2"))
			let augments = augmentsList()
			for (let i = 0; i * 6 < augments.length; i++)
			{
				addLine(`## ${localize(augmentCategories[i])}`)
				addLine(`|<div style="width:120px">${localize('wiki_name_label')}</div>|<div style="width:50px">${localize("wiki_cost_label")}</div>|${localize('wiki_description_label')}`)
				addLine("|---|---|---")
				for (let k = 0; k < 6; k++)
				{
					let augment = augments[i * 6 + k]
					let costs = augment.cost.reduce((t, c) => { t.push(`${c} §`); return t }, []).join(",<br>")
					addLine(`|${localize(augment.name)}|${costs}|${localize(augment.desc).replaceAll("\n", "<br>")}`)
				}
			}

			// Generate HTML from Source.
			source = imml.parse(source)
			let document = new Document()
			imml.render(source, document)
			File.save(
				`~/wiki_${currentUILanguage}.html`,
				[
					`<!doctype html>`,
					`<html>`,
					`<head>`,
					`<meta charset="UTF-8">`,
					`<meta http-equiv="X-UA-Compatible" content="IE=edge">`,
					`<meta name="viewport" content="width=device-width, initial-scale=1.0">`,
					`<link rel="preconnect" href="https://fonts.googleapis.com">`,
					`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
					`<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">`,
					`<script>`,
					`	(function(d) {`,
					`	  var config = {`,
					`		kitId: 'zmu1nqc',`,
					`		scriptTimeout: 3000,`,
					`		async: true`,
					`	  },`,
					`	h=d.documentElement,t=setTimeout(function(){h.className=h.className.replace(/\bwf-loading\b/g,"")+" wf-inactive";},config.scriptTimeout),tk=d.createElement("script"),f=false,s=d.getElementsByTagName("script")[0],a;h.className+=" wf-loading";tk.src='https://use.typekit.net/'+config.kitId+'.js';tk.async=true;tk.onload=tk.onreadystatechange=function(){a=this.readyState;if(f||a&&a!="complete"&&a!="loaded")return;f=true;clearTimeout(t);try{Typekit.load(config)}catch(e){}};s.parentNode.insertBefore(tk,s)`,
					`	})(document);`,
					`</script>`,
					`<style>`,
					styleSheet,
					`</style>`,
					`</head>`,
					`<body>`,
					document.body.innerHTML,
					`</body>`,
					`</html>`
				].join("\n")
			)
		}
	},

	// Print debug info.
	'print': function(contentType)
	{
		switch (contentType)
		{
			case 'tags':
				let result = {}
				WeaponsList().concat(Turrets()).forEach((weapon) => {
					weapon.tags.forEach((tag) => {
						result[tag] = result[tag] || 0
						result[tag]++
					})
				})
				console.log(JSON.stringify(result, null, '\t'))
				break
			
			case 'threat':
				console.log("Current Threat: " + Math.floor(spawner.startingThreat + spawner.increment * spawner.currentFrame) * Scalers.threatBudget)
				break
			
			case 'elite':
				console.log(
					"Current Elite Budget: " +
					hostilesArray.reduce((total, current) => total += current.getType() == type.enemy ? current.constructor.isElite() : 0, 0) +
					" / " +
					Math.floor(spawner.startingElite + spawner.eliteIncrement * spawner.currentFrame) * Scalers.eliteBudget)
				break

			case 'save':
				console.log(JSON.stringify(save, null, 4))
				break
			
			case 'loot':
				console.log(JSON.stringify(serializedLoot, null, 4))
				break

			case 'modifiers':
				console.log(JSON.stringify(modifiers.allModifiers, null, 4))
				break
			
			default:
				console.log(`ERROR: Unknown content type ${contentType}.`)
				break
		}
	},

	// Localization commands.
	'csv': function(lang)
	{
		if (lang == "all")
			Object.keys(localization).forEach(key => generateCsv(key))
		else generateCsv(lang)
	},

	'json': async function(lang)
	{
		if (lang == "all")
		{
			let availableCSVs = []
			let locFolder = await DirectoryStream.fromURL('~/localization/')
			while(true)
			{
				let file = locFolder.next()
				if (file.done)
					break
				if (file.value.fileName.includes("_main.csv"))
					availableCSVs.push(file.value.fileName.replace("_main.csv", ""))
			}
			availableCSVs.forEach(key => generateJson(key))
		}
		else generateJson(lang)
	},

	// Spawner debug.
	'spawner': function()
	{
		spawnerDebug = true
	}
}

let generateCsv = function(lang) {

	// Translation file.
	let data = [["KEY", "ENGLISH", "TRANSLATION"]]
	let eng = localization["english"]
	let current = localization[lang] || null
	for (let key in eng)
		data.push([key, eng[key].replace(/\n/g, '\\n'), current && key in current ? current[key].replace(/\n/g, '\\n') : ""])
	File.save(`~/localization/${lang}_main.csv`, Papa.unparse(data)).catch((e) => {
		console.log(`Failed to save: ${e}`)
	})
	console.log(`Translation file saved at "Documents/Sphere Saves/aliasblack.glyphica/localization/${lang}_main.csv".`)

	// Wordlist.
	data = [["4-LETTER WORDS", "5-LETTER WORDS", "6-LETTER WORDS", "7-LETTER WORDS", "8-LETTER WORDS"]]
	if (lang in wordlists)
	{
		current = wordlists[lang]
		for (let i = 0; i < Object.keys(current).reduce((l, c) => current[c].length > l ? current[c].length : l, 0); i++)
			data.push(Array(5).fill("").map((v, k) => {
				let list = Object.values(current)[k]
				if (list.length > i) return Array.isArray(list[i]) ? `${list[i][0]} ${list[i][1]}` : list[i]
			}))
	}
	File.save(`~/localization/${lang}_wordlist.csv`, Papa.unparse(data)).catch((e) => {
		console.log(`Failed to save: ${e}`)
	})
	console.log(`Wordlist file saved at "Documents/Sphere Saves/aliasblack.glyphica/localization/${lang}_wordlist.csv".`)

	// Poet Boss Paragraphs.
	data = [["ROMANIZATION", "ORIGINAL"]]
	if (lang in paragraphs)
	{
		current = paragraphs[lang]
		for (let para of current)
			data.push(Array.isArray(para) ? para : [para])
	}
	File.save(`~/localization/${lang}_paragraphs.csv`, Papa.unparse(data)).catch((e) => {
		console.log(`Failed to save: ${e}`)
	})
	console.log(`Paragraphs file saved at "Documents/Sphere Saves/aliasblack.glyphica/localization/${lang}_paragraphs.csv".`)

	// Trigger letters.
	data = [["KEY", "ENGLISH", "TRANSLATION"]]
	eng = triggerLetters["english"]
	current = triggerLetters[lang] || null
	for (let key in eng)
		data.push([
			key,
			eng[key].reduce((conc, curr) => conc += conc == "" ? curr : " " + curr, ""),
			current && current[key] ? current[key].reduce((conc, curr) => conc += conc == "" ? curr : " " + curr, "") : ""
		])
	File.save(`~/localization/${lang}_triggers.csv`, Papa.unparse(data)).catch(e => {
		console.log(`Failed to save: ${e}`)
	})
	console.log(`Triggers file saved at "Documents/Sphere Saves/aliasblack.glyphica/localization/${lang}_triggers.csv".`)
}

let generateJson = function(lang) {

	// Export translation file.
	let exportTranslation = function(lang)
	{
		let filePathRead = `~/localization/${lang}_main.csv`
		let filePathWrite = `~/localization/${lang}.jsonc`
		let loc = { [lang]: {} }
		return new Promise(resolve => {
			File.exists(filePathRead).then((result) => {
				if (result)
					File.load(filePathRead, DataType.Text).then(text => {
						let data = Papa.parse(text, {skipEmptyLines: true})
						if ("error" in data)
							console.log(`ERROR ${error.code}: ${error.type} at line ${error.line}\n${error.message}`)
						data = data.data.slice(1)
						for (const line of data)
							loc[lang][line[0]] = line[2].replace(/\\n/g, '\n')
						File.save(filePathWrite, JSON.stringify(loc, null, "\t")).catch((e) => {
							console.log(`Failed to save: ${e}`)
						})
						console.log(`Translation file saved at "Documents/Sphere Saves/aliasblack.glyphica${filePathWrite.slice(1)}"`)
						resolve()
					})
				else
				{
					console.log(`Error: Cannot find file "Documents/Sphere Saves/aliasblack.glyphica${filePathRead.slice(1)}".`)
					resolve()
				}
			})
		})
	}
	
	// Export wordlist.
	let exportWordlist = function(lang)
	{
		let filePathRead = `~/localization/${lang}_wordlist.csv`
		let filePathWrite = `~/localization/${lang}.wordlist`
		return new Promise(resolve => {
			File.exists(filePathRead).then((result) => {
				if (result)
					File.load(filePathRead, DataType.Text).then(text => {
						
						// Parse csv.
						let data = Papa.parse(text).data.slice(1)
						if (!data[0]) return

						// Read csv file.
						let output = { [lang]: { "4": [], "5": [], "6": [], "7": [], "8": [] } }
						let eastAsian = data[0][0].includes(" ")
						for (const line of data)
							for (let i = 0; i < line.length; i++)
							{
								let v = line[i]
								if (v != "")
								{
									if (eastAsian && !v.includes(" ")) { console.log(v + " is missing a space separator."); continue }
									let value = eastAsian ? v.split(" ") : v
									let length = i + 4
									output[lang][length.toString()].push(value)
								}
							}
						
						// Sort alphabetically.
						for (const length in output[lang])
							output[lang][length].sort((a, b) => {
								if (eastAsian)
									return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
								else
									return a < b ? -1 : a > b ? 1 : 0
							})

						// Save to json.
						File.save(filePathWrite, JSON.stringify(output, null, "\t")).catch((e) => {
							console.log(`Failed to save: ${e}`)
						})
						console.log(`Wordlist file saved at "Documents/Sphere Saves/aliasblack.glyphica${filePathWrite.slice(1)}"`)
						resolve()
					})
				else
				{
					console.log(`Error: Cannot find file "Documents/Sphere Saves/aliasblack.glyphica${filePathRead.slice(1)}".`)
					resolve()
				}
			})
		})
	}

	// Export Poet boss paragraphs.
	let exportParagraphs = function(lang)
	{
		let filePathRead = `~/localization/${lang}_paragraphs.csv`
		let filePathWrite = `~/localization/${lang}.paragraphs`
		let loc = { [lang]: [] }
		return new Promise(resolve => {
			File.exists(filePathRead).then((result) => {
				if (result)
					File.load(filePathRead, DataType.Text).then(text => {
						
						// Read csv.
						let data = Papa.parse(text).data.slice(1)
						if (data.length > 0)
						{
							let isEastAsian = (data[0].length > 1 && data[0][1] != "")
							for (const line of data)
							{
								if (line[0] == "") continue
								loc[lang].push(isEastAsian ? line : line[0])
							}
						}

						// Save to json.
						File.save(filePathWrite, JSON.stringify(loc, null, "\t")).catch((e) => {
							console.log(`Failed to save: ${e}`)
						})
						console.log(`Wordlist file saved at "Documents/Sphere Saves/aliasblack.glyphica${filePathWrite.slice(1)}"`)
						resolve()
					})
			})
		})
	}

	// Export triggers.
	let exportTriggers = function(lang)
	{
		let filePathRead = `~/localization/${lang}_triggers.csv`
		let filePathWrite = `~/localization/${lang}.triggers`
		let loc = { [lang]: {} }
		return new Promise(resolve => {
			File.exists(filePathRead).then((result) => {
				if (result)
					File.load(filePathRead, DataType.Text).then(text => {
						let data = Papa.parse(text, {skipEmptyLines: true})
						if ("error" in data)
							console.log(`ERROR ${error.code}: ${error.type} at line ${error.line}\n${error.message}`)
						data = data.data.slice(1)
						for (const line of data)
							loc[lang][line[0]] = line[2] == "" ? triggerLetters.english[line[0]] : line[2].trim().split(" ")
						File.save(filePathWrite, JSON.stringify(loc, null, "\t")).catch((e) => {
							console.log(`Failed to save: ${e}`)
						})
						console.log(`Trigger file saved at "Documents/Sphere Saves/aliasblack.glyphica${filePathWrite.slice(1)}"`)
						resolve()
					})
				else
				{
					console.log(`Error: Cannot find file "Documents/Sphere Saves/aliasblack.glyphica${filePathRead.slice(1)}".`)
					resolve()
				}
			})
		})
	}

	// Run the functions.
	exportTranslation(lang)
		.then(() => exportWordlist(lang)
			.then(() => exportParagraphs(lang)
				.then(() => exportTriggers(lang))))
}

export class GlyphicaConsole extends Console
{
	constructor()
	{
		// Superclass constructor.
		let options = { logFileName: "~/console.log", logFileOp: FileOp.Write, hotKey: Key.F9 }
		super(options)

		// Cheats.
		global.immortal = false
		global.autoLevel = false
		global.autoLoot = false
		global.spawnerDebug = false
		this.defineObject('cheat', null, cheatObject)
		this.defineObject('c', null, cheatObject)
		this.defineObject('profile', null, profile)
		this.defineObject('info', null, infoObject)

		this.defineObject('set', null, {
			'darkMode': function() {
				darkMode = !darkMode
				ui.refreshUI()
			},
			'disableWordRegen': function() {
				enemyWordRegen = false
			}
		})
	}

	on_update()
	{
		const hotKeyPressed = this.keyboard.isPressed(this.activationKey)
			|| this.mouse.isPressed(this.mouseKey)
		if (hotKeyPressed && !this.wasKeyDown)
			if (this.view.visible)
				Keyboard.Default.clearQueue()
		super.on_update()
	}

	// Route js console functions.
	error(msg, e) { this.log(msg + " " + e) }
	warn(msg) { this.log(msg) }
}