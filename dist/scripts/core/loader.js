import { mangleData, demangle } from './storage.js'

// Load all.
export function LoadAll()
{
	return Promise.all([
		loadSprites(),
		loadSounds(),
		loadMusic(),
		loadLocalizations(),
		loadAudioHooks(),
		loadBGMSets(),
		loadGame()
	]).then(result => {
		return result;
	})
}

// Load sprites.
async function loadSprites()
{
	let spritesFolder = await DirectoryStream.fromURL('@/sprites/')
	while (true)
	{
		let file = spritesFolder.next()
		if (file.done) break
		if (file.value.extension == ".png")
		{
			let texture = await Texture.fromFile(file.value.fullPath)
			sprites[file.value.fileName.split(".")[0]] = texture
		}
	}
}

// Load sounds.
const supportedFormats = [".wav", ".flac", ".ogg", ".opus", ".it", ".mod", ".s3m", ".xm", ".voc", ".mp3"]
async function loadSounds()
{
	let soundsFolder = await DirectoryStream.fromURL('@/sounds/')
	const files = []
	while (true)
	{
		let file = soundsFolder.next()
		if (file.done) break
		if (supportedFormats.includes(file.value.extension)) files.push(file.value)
	}
	await loadInBatches(files, 12, async file => {
		let sample = await Sample.fromFile(file.fullPath)
		audioHandler.sounds[file.fileName.split(".")[0]] = sample
	})
}

// Load music.
async function loadMusic()
{
	let musicFolder = await DirectoryStream.fromURL('@/music/')
	const files = []
	while (true)
	{
		let file = musicFolder.next()
		if (file.done) break
		if (supportedFormats.includes(file.value.extension)) files.push(file.value)
	}
	await loadInBatches(files, 6, async file => {
		let audio = await Sound.fromFile(file.fullPath)
		audioHandler.music[file.fileName.split(".")[0]] = audio
	})
}

async function loadInBatches(files, batchSize, load)
{
	for (let i = 0; i < files.length; i += batchSize)
		await Promise.all(files.slice(i, i + batchSize).map(load))
}

// Load hooks.
async function loadAudioHooks()
{
	if (await File.exists("@/scripts/data/audioHooks.jsonc"))
	{
		let file = await File.load("@/scripts/data/audioHooks.jsonc")
		global.audioHandler.audioHooks = JSON.parse(stripComments(file))
	}
}

// Load BGM Sets.
async function loadBGMSets()
{
	global.BGMSets = {"menu": {}, "game": {}}
	if (await File.exists("@/scripts/data/bgmSets.jsonc"))
	{
		let file = await File.load("@/scripts/data/bgmSets.jsonc")
		let data = JSON.parse(stripComments(file))
		for (let key in data)
			if ("category" in data[key])
				switch(data[key].category)
				{
					case "menu": BGMSets.menu[key] = data[key]; break
					case "game": BGMSets.game[key] = data[key]; break
					default: console.log(`Unrecognized category "${data[key].category}" for "${key}" in BGMSets.`); break
				}
	}
}

// Load localization from each file in directory.
async function loadLocalizationFiles(directory)
{
	let locFolder = await DirectoryStream.fromURL(directory)
	while(true)
	{
		let file = locFolder.next()
		if (file.done) break
		if ([".jsonc", ".wordlist", ".triggers", ".paragraphs"].includes(file.value.extension))
		{
			let contents = await File.load(file.value.fullPath)
			let locType
			switch(file.value.extension)
			{
				case '.jsonc': 		locType = localization; 	break
				case '.wordlist': 	locType = wordlists; 		break
				case '.triggers':	locType = triggerLetters; 	break
				case '.paragraphs':	locType = paragraphs;		break
			}
			Object.assign(locType, JSON.parse(stripComments(contents)))
		}
	}
}

// Load translations.
async function loadLocalizations()
{
	global.localization = {}
	global.wordlists = {}
	global.triggerLetters = {}
	global.paragraphs = {}

	// Load localization.
	let defaultLocPath = '@/localization'
	await loadLocalizationFiles(defaultLocPath)

	// Load user localization if desktop.
	if (!isOozaru)
	{
		let userLocPath = '~/localization/'
		if (!FS.directoryExists(userLocPath))
		{
			try { FS.createDirectory(userLocPath) }
			catch { console.log("Failed to create user localization directory.") }
		}
		await loadLocalizationFiles(userLocPath)
	}
}

// Load game.
const key = global.demo ? "961" : "186"	// Obviously unsecure, more of a deterrance.
async function loadGame()
{
	// Create default save.
	let fullScreen = (steamEnabled && ISteamUtils.IsSteamRunningOnSteamDeck()) || isSmallScreen() ? true : false
	global.save = {
		coins: 100000,
		coinsTotal: 0,
		difficultyUnlocked: 1,
		fullScreen: fullScreen,
		resolution: isOozaru ?
			{ width: 1920, height: 1080 }
			: detectOptimalResolution(fullScreen),
		augments: {},
		turrets: {
			Repeater: {
				trialsRecord: { trial: 0, omen: 0 },
				endlessRecord: { score: 0, omen: 0 }
			}
		},
		gameStates: {}
	}
	if (isOozaru) {
		global.save.webResolutionVersion = 1
		global.save.webStartingCoinsVersion = 1
	}

	// Check for old save
	const fileExists = await loadSaveFromFile(generateSaveId())
	if (fileExists) return

	// Just use default
	await applySaveSettings(save.fullScreen, save.resolution)
}

async function loadSaveFromFile(saveGamePath)
{
	let fileExists = false
	try {
		fileExists = await File.exists(saveGamePath)
		if (fileExists) {
			let file = await File.load(saveGamePath, DataType.Bytes)
			save = demangle(file, key) || save
			darkMode = "darkMode" in save ? save.darkMode : false
			monochromeMode = "monochromeMode" in save ? save.monochromeMode : false
			muteTypingSounds = "muteTypingSounds" in save ? save.muteTypingSounds : false
			contrast = "contrast" in save ? save.contrast : 0
			audioHandler.setBgmVolume( "bgmVolume" in save ? save.bgmVolume : 1 )
			audioHandler.setSfxVolume( "sfxVolume" in save ? save.sfxVolume : 1 )
			spacesAndPunctuation = "spacesAndPunctuation" in save ? save.spacesAndPunctuation : false
			levelUpKey = spacesAndPunctuation ? "Enter" : "__"

			// Update old saves.
			// -----------------

			// New turret savestate.
			save.gameStates = save.gameStates || {}
			if (Array.isArray(save.turrets))
				save.turrets = {
					Repeater: {
						trialsRecord: { trial: 0, omen: 0 },
						endlessRecord: { score: 0, omen: 0 }
					}
				}
			
			// Split up old single save language into UI and typing languages.
			if ("language" in save)
			{
				save.UILanguage = save.language
				save.gameLanguage = save.language
				delete save.language
			}

			// Award main weapon unlocks to players who unlocked main weapon via requirements.
			if (!("Dec2024MainWeaponUpdate" in save))
			{
				save.mainWeaponsUnlocked = save.mainWeaponsUnlocked || {}

				// Award Heat Ray unlock.
				if (save.turrets.Repeater &&
					save.turrets.Repeater.trialsRecord &&
					save.turrets.Repeater.trialsRecord.omen > 0
				)
					save.mainWeaponsUnlocked.HeatRay = true

				// Award Barrage unlock.
				if (Object.values(save.turrets).some(turret => turret.trialsRecord && turret.trialsRecord.omen >= 3))
					save.mainWeaponsUnlocked.Barrage = true

				// Mark as updated.
				save.Dec2024MainWeaponUpdate = true
			}

			// Update old endless mode records.
			for (const weapon of Object.values(save.turrets))
				if (weapon.endlessRecord == null || typeof weapon.endlessRecord == "number")
					weapon.endlessRecord = {
						score: weapon.endlessRecord,
						omen: 0
					}

			// Fullscreen
			let isFullScreen = false
			if ("fullScreen" in save)
				isFullScreen = save.fullScreen
			if ((steamEnabled && ISteamUtils.IsSteamRunningOnSteamDeck()) || isSmallScreen())
				isFullScreen = true

			// Resolution
			let res = "resolution" in save ? save.resolution : detectOptimalResolution(isFullScreen)
			let upgradeBrowserSave = false
			if (isOozaru && save.webResolutionVersion !== 1)
			{
				if (!res || res.width < 1920 || res.height < 1080)
				{
					res = { width: 1920, height: 1080 }
					save.resolution = res
					isFullScreen = false
					save.fullScreen = false
				}
				save.webResolutionVersion = 1
				upgradeBrowserSave = true
			}
			if (isOozaru && save.webStartingCoinsVersion !== 1)
			{
				if ((save.coins ?? 0) === 0 && (save.coinsTotal ?? 0) === 0)
					save.coins = 100000
				save.webStartingCoinsVersion = 1
				upgradeBrowserSave = true
			}
			if (!isResolutionSuitableForScreen(res, isFullScreen))
				res = detectOptimalResolution(isFullScreen)

			await applySaveSettings(isFullScreen, res)
			if (upgradeBrowserSave)
				saveGame()
		}
	} catch (e) {
		return false;
	}
	return fileExists
}

async function applySaveSettings(isFullScreen, res)
{
	Sphere.fullScreen = isFullScreen
	Sphere.setResolution(res.width, res.height)
	setScreenScale()
	await loadFonts()
	calculateScreenDimensions()
}

// Save game.
export function saveGame()
{
	let data = mangleData(save, key)
	File.save(generateSaveId(), data).catch((e) => {
		console.log(`Failed to save: ${e}`)
	})
}

export function generateSaveId()
{
	// Parse the steam id down to a number to avoid breaking old saves
	let savePrefix = demo ? '~/demo_save_' : '~/save_'
	return (steamEnabled ? `${savePrefix}${parseInt(ISteamUser.GetSteamID())}` : `${savePrefix}default`) + ".sav"
}
