/*
 *  Glyphica
 *  (c) 2023 AliasBLACK Pte. Ltd.
 */

// Import libraries.
import './global.js'
import '../data/versionString.js'
import './words.js'

// Import other script files.
import { Task, Matter } from 'sphere-runtime'
import { Control } from './control.js'
import { Interface } from './interface.js'
import { Spawner } from './spawner.js'
import { Factory } from './factory.js'
import { LoadAll } from './loader.js'
import { BGM } from './bgm.js'
import { Modifiers } from './modifiers.js'
import { GlyphicaConsole } from './console.js'
import { platform_overrides } from './platform_overrides.js'
import { Callback } from './callback.js'

export default class MyGame extends Task
{	
	constructor()
	{
		super()
		Sphere.fullScreen

		platform_overrides()

		// Init Steam API.
		if (steamEnabled)
		{
			SteamAPI.Init()
			ISteamUserStats.RequestCurrentStats()
		}
		
		// Physics engine and delta calculation.
		global.physics = Matter.Engine.create()
		global.timeLastFrame = Date.now()

		// Start console (if desktop version)
		global.console = isOozaru ? { log: function() {} } : new GlyphicaConsole()

		if (!Sphere.audioEnabled())
		{
			console.log("Failed to initialize audio system")
		}

		// Load all external assets.
		LoadAll().then(() => {
			// Set language.
			if ("UILanguage" in save || "gameLanguage" in save)
			{
				changeUILanguage("UILanguage" in save ? save.UILanguage : "english")
				changeGameLanguage("gameLanguage" in save ? save.gameLanguage : "english")
			}
			else changeLanguage(steamEnabled ? ISteamApps.GetCurrentGameLanguage() : "english")

			// Init core systems.
			global.callback = new Callback()
			global.bgm = new BGM()
			global.control = new Control()
			global.factory = new Factory()
			global.spawner = new Spawner()
			global.ui = new Interface()
			global.modifiers = new Modifiers()
			globalThis.dispatchEvent(new CustomEvent('glyphica-game-ready'))
		}).catch(error => {
			globalThis.dispatchEvent(new CustomEvent('glyphica-game-error', {
				detail: { message: error?.message || String(error) },
			}))
		})
	}
	
	on_update()
	{
		// Delta
		let dateNow = Date.now()
		let delta = dateNow - global.timeLastFrame
		global.timeLastFrame = dateNow

		// Update global timer.
		if (currentScreen == game && !isPaused())
			timeElapsed += delta

		// Run Steam callbacks.
		if (steamEnabled && global.callback)
			SteamAPI.RunCallbacks()
				.forEach(cb => {
					if ("callID" in cb)
						callback.triggerSteamAPICallback(cb.callID, cb)
					else
						callback.triggerCallback(cb.name, cb)
				})
		
		// Update physics engine.
		Matter.Engine.update(physics, delta)
	}

	on_shutDown()
	{
		// Shutdown Steam API.
		if (steamEnabled)
			SteamAPI.Shutdown()

		// Profile factory.
		console.log("Task factory")
		for (const pair of Object.entries(factory.archives))
			console.log(pair[0] + ": " + pair[1].length)

		console.log("Entity factory")
		for ( const pair of Object.entries(factory.entityFactory.inactiveEntities))
			console.log(`${pair[0]}: ${pair[1].length + factory.entityFactory.runningEntities[pair[0]].length}`)
	}
}
