import { Task, Matter, Random } from 'sphere-runtime'
import { Powerup } from './powerup.js'
import { Closer } from '../data/lootItems.js'
import { Damage } from '../effects/damage.js'
import { WordComplete } from '../effects/wordComplete.js'
import { Gambler } from '../data/augmentsList.js'
import { Debris } from '../effects/debris.js'
import { Observer } from '../data/augmentsList.js'

(function() {
	
	// Action names enum.
	global.direction_up = 0
	global.direction_down = 1
	global.direction_left = 2
	global.direction_right = 3
	global.button_top = 4
	global.button_bottom = 5
	global.button_left = 6
	global.button_right = 7
	global.stick_down_left = 8
	global.stick_down_right = 9
	global.shoulder_button_left = 10
	global.shoulder_button_right = 11
	global.shoulder_trigger_left = 12
	global.shoulder_trigger_right = 13

	// Action names string names.
	global.actionNames = [
		"direction_up",
		"direction_down",
		"direction_left",
		"direction_right",
		"button_top",
		"button_bottom",
		"button_left",
		"button_right",
		"stick_down_left",
		"stick_down_right",
		"shoulder_button_left",
		"shoulder_button_right",
		"shoulder_trigger_left",
		"shoulder_trigger_right",
	]

	// Xbox directional analog and d-pad mapping.
	global.xBoxDirectionalMapping = [
		[0, -.9, 11, direction_left],
		[0, .9, 10, direction_right],
		[1, -.9, 13, direction_up],
		[1, .9, 12, direction_down]
	]

	// Xbox buttons local index mapping.
	global.xBoxLocalMapping = [
		[7, stick_down_left],
		[6, stick_down_right],
		[3, button_top],
		[2, button_left],
		[0, button_bottom],
		[1, button_right],
		[5, shoulder_button_left],
		[4, shoulder_button_right]
	]

	// Xbox triggers local index mapping.
	global.xBoxLocalMappingTriggers = [
		[4, shoulder_trigger_left],
		[5, shoulder_trigger_right]
	]
})()

// Control class to parse all input.
export class Control extends Task
{
	constructor()
	{
		super()
		this.suspendInput = false
		this.arrowKeys = [Key.Left, Key.Right, Key.Up, Key.Down, Key.Enter, Key.Q, Key.W]
		this.printableChar = 'abcdefghijklmnopqrstuvwxyzßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿāăąćĉċčďđēĕėęěĝğġģĥħĩīĭįıĳĵķĸĺļľŀłńņňŋōŏőœŕŗřśŝşšţťŧũūŭůűųŵŷźżžſ'

		// Perfect Input.
		this.noMistypes = 0
		this.noMistypesTarget = 17

		// Observer augment.
		this.observerFrameStamp = 0
		
		// Blitz.
		this.blitzTime = 2000
		this.blitzTimeKeeper = Array(2)

		// Setup some private vars.
		this.currentController = null	// For SteamInput.
		this.currentButton = null
		this.anyButtonPressed = true
		this.lastButton = null
		this.lastMouseX = null
		this.lastMouseY = null

		// Autotyping bot vars.
		this.simulateTypeString = ""
		this.naturalTypingDelay = false

		// Setup some globals.
		global.Keylog = "**********"
		global.Joylog = Array(6).fill(null)

		// If using Steam.
		if (steamEnabled)
		{
			// Init Steam Input API.
			ISteamInput.Init(true)

			// Grab handles for future use. Handles are steam handles (64 bit in as string)
			this.inGameControls = "1"
			this.menuControls = "2"
			this.inGameActions = {}
			actionNames.forEach((action, i) => this.inGameActions[action] = (i + 1).toString())
		}

		// Start and take focus.
		this.start()
		this.takeFocus()
	}

	canLevelUp()
	{
		return ui.upgradeScreen.hidden
			&& ui.lootScreen.hidden
			&& ui.evolutionComplete.hidden
	}

	gameRunning()
	{
		return ui.pauseMenu.hidden
			&& ui.weaponDetail.hidden
			&& ui.summaryScreen.hidden
			&& ui.announcerNode.hidden
	}

	isValidCharacter(char)
	{
		return (
			this.printableChar.includes(char) ||
			(currentGameLanguage == "koreana" && ["Q", "W", "E", "R", "T", "P", "O"].includes(char)) ||
			(currentGameLanguage == "japanese" && char == "-")
		)
	}

	convertToValidCharacter(char)
	{
		// Special language-specific cases.
		if (
			(currentGameLanguage == "koreana" && ["Q", "W", "E", "R", "T", "P", "O"].includes(char)) ||
			(currentGameLanguage == "japanese" && char == "-")
		)
			return char
		
		// Else, convert to lowercase and check.
		let lowerCaseChar = char.toLowerCase()
		return this.printableChar.includes(lowerCaseChar) ? lowerCaseChar : ""
	}
	
	on_inputCheck()
	{
		if (!this.suspendInput)
		{
			switch (currentScreen)
			{
				// In-game controls.
				case game:

					// If Steam build, use Steam Input.
					if (steamEnabled)
					{
						ISteamInput.RunFrame(true)
						let r = ISteamInput.GetConnectedControllers()
						if (r.result > 0)
						{
							this.currentController = r.handlesOut[0]
							ISteamInput.ActivateActionSet(this.currentController, this.inGameControls)
							for (const [actionName, handle] of Object.entries(this.inGameActions))
							{
								let actionData = ISteamInput.GetDigitalActionData(this.currentController, handle)
								let action = actionNames.indexOf(actionName)
								if (this.currentButton == action)
								{
									if (!actionData.bState)
										this.currentButton = null
								}
								else
								{
									if (actionData.bState)
									{
										if (inUpgradeMenu && action == button_top)
											this.triggerWeaponDetailTab()

										if (action == stick_down_right)
											this.levelUpButtonPressed()

										else if (this.gameRunning())
											this.addCharacter(action)

										else this.navigateWeaponDetailTab(action)

										this.currentButton = action
										break
									}
								}
							}
						}

						// Pause game if controller disconnected. 
						else if (usingController)
						{
							usingController = false
							if (ui.pauseMenu.hidden) ui.pauseMenu.startIntro()
						}
					}

					// Else, use Allegro joystick.
					else
					{
						let joystick = Joystick.getDevices()[0]
						if (joystick)
						{
							// Check triggers.
							for (const pair of xBoxLocalMappingTriggers)
							{
								let physicalButton = pair[0]
								let virtualButton = pair[1]
								if (this.currentButton == virtualButton)
								{
									if (joystick.getPosition(physicalButton) < 1)
										this.currentButton = null
								}
								else
								{
									if (joystick.getPosition(physicalButton) == 1)
									{
										if (this.gameRunning())
											this.addCharacter(virtualButton)

										this.currentButton = virtualButton
										break
									}
								}
							}

							// Check analog stick and d-pad buttons.
							for (const set of xBoxDirectionalMapping)
							{
								// Analog stick check.
								let axis = set[0]
								let threshold = set[1]
								let hasCrossedAnalogThreshold = threshold < 0 ?
									joystick.getPosition(axis) < threshold :
									joystick.getPosition(axis) > threshold
								
								// D-pad check.
								let physicalButton = set[2]
								let isPhysicalButtonPressed = joystick.isPressed(physicalButton)

								// Determine virtual button states.
								let virtualButton = set[3]
								if (this.currentButton == virtualButton)
								{
									if (!hasCrossedAnalogThreshold && !isPhysicalButtonPressed)
									{
										this.currentButton = null
										this.lastButton = null
									}
								}
								else
								{
									if (hasCrossedAnalogThreshold || isPhysicalButtonPressed)
									{
										if (this.gameRunning())
											this.addCharacter(virtualButton)

										else this.navigateWeaponDetailTab(virtualButton)

										this.currentButton = virtualButton
										break
									}
								}
							}

							// If not check other buttons.
							for (const pair of xBoxLocalMapping)
							{
								let physicalButton = pair[0]
								let virtualButton = pair[1]
								if (this.currentButton == virtualButton)
								{
									if (!joystick.isPressed(physicalButton))
									{
										this.currentButton = null
										this.lastButton = null
									}
								}
								else
								{
									if (joystick.isPressed(physicalButton))
									{
										if (inUpgradeMenu && virtualButton == button_top)
											this.triggerWeaponDetailTab()

										if (virtualButton == stick_down_right)
											this.levelUpButtonPressed()

										else if (this.gameRunning())
											this.addCharacter(virtualButton)

										else this.navigateWeaponDetailTab(virtualButton)

										this.currentButton = virtualButton
										break
									}
								}
							}

							// If menu button pressed.
							if (joystick.isPressed(9))
							{
								if (!ui.weaponDetail.hidden)
									ui.weaponDetail.startExtro()
								else if (ui.summaryScreen.hidden)
									ui.pauseMenu.hidden ? ui.pauseMenu.startIntro() : ui.pauseMenu.startExtro()
								break
							}
						}
					}

					// If no gamepad input, fallback to keyboard.
					if (this.currentButton) this.anyButtonPressed = true
					else
					{
						let kb = Keyboard.Default

						// Key presses.
						let lastKey = null
						do {
							lastKey = kb.getKey()
							if (lastKey) this.anyButtonPressed = true
							switch(lastKey)
							{
								case null:
									break

								case Key.Down:
								case Key.Up:
								case Key.Left:
								case Key.Right:
								case Key.Q:
								case Key.W:
									if (!keyboardArrows)
									{
										usingController = false
										keyboardArrows = true
										ui.updateButtonLabels()
									}
									ui.weaponDetail.keyboardArrows(lastKey)
									ui.pauseMenu.keyboardArrows(lastKey)
									ui.summaryScreen.keyboardArrows(lastKey)
									break

								case Key.Tab:
									this.triggerWeaponDetailTab()
									break
								
								case Key.Space:
									if (!spacesAndPunctuation)
										this.levelUpButtonPressed()
									break
								
								case Key.Enter:
									if (spacesAndPunctuation)
										this.levelUpButtonPressed()
									ui.summaryScreen.keyboardEnter()
									ui.pauseMenu.keyboardEnter()
									break
								
								case Key.Escape:
									if (!ui.weaponDetail.hidden)
										ui.weaponDetail.startExtro()
									else if (ui.summaryScreen.hidden)
										ui.pauseMenu.hidden ? ui.pauseMenu.startIntro() : ui.pauseMenu.startExtro()
									break
							}
						} while (lastKey != null)
						
						// Text Input.
						let lastChar = null
						do {
							lastChar = kb.getChar()
							if (lastChar && this.gameRunning())
								this.addCharacter(spacesAndPunctuation ? lastChar : this.convertToValidCharacter(lastChar))
						} while(lastChar != null)
					}

					// Next frame.
					break
				
				// Menu controls.
				case menu:

					// If Steam build, use Steam Input.
					if (steamEnabled)
					{
						ISteamInput.RunFrame(true)
						let r = ISteamInput.GetConnectedControllers()
						if (r.result > 0)
						{
							this.currentController = r.handlesOut[0]
							ISteamInput.ActivateActionSet(this.currentController, this.inGameControls)
							for (const [actionName, handle] of Object.entries(this.inGameActions))
							{
								let actionData = ISteamInput.GetDigitalActionData(this.currentController, handle)
								if (actionData.bState)
								{
									this.currentButton = actionName
									usingController = true
									break
								}
							}
						}
					}

					// Else, use Allegro joystick.
					else
					{
						let joystick = Joystick.getDevices()[0]
						if (joystick)
						{
							// Check triggers.
							for (const pair of xBoxLocalMappingTriggers)
							{
								let physicalButton = pair[0]
								let virtualButton = pair[1]
								if (this.currentButton == virtualButton)
								{
									if (joystick.getPosition(physicalButton) < 1)
										this.currentButton = null
								}
								else
								{
									if (joystick.getPosition(physicalButton) == 1 && ui.weaponDetail.hidden)
									{
										this.currentButton = actionNames[virtualButton]
										usingController = true
										break
									}
								}
							}

							// Check analog stick and d-pad buttons.
							for (const set of xBoxDirectionalMapping)
							{
								// Analog stick check.
								let axis = set[0]
								let threshold = set[1]
								let hasCrossedAnalogThreshold = threshold < 0 ?
									joystick.getPosition(axis) < threshold :
									joystick.getPosition(axis) > threshold
								
								// D-pad check.
								let physicalButton = set[2]
								let isPhysicalButtonPressed = joystick.isPressed(physicalButton)

								// Determine virtual button states.
								let virtualButton = set[3]
								if (this.currentButton == virtualButton)
								{
									if (!hasCrossedAnalogThreshold && !isPhysicalButtonPressed)
									{
										this.currentButton = null
										this.lastButton = null
									}
								}
								else
								{
									if (hasCrossedAnalogThreshold || isPhysicalButtonPressed)
									{
										this.currentButton = actionNames[virtualButton]
										usingController = true
										break
									}
								}
							}

							// If not check buttons.
							for (const pair of xBoxLocalMapping)
							{
								let physicalButton = pair[0]
								let virtualButton = pair[1]
								if (this.currentButton == virtualButton)
								{
									if (!joystick.isPressed(physicalButton))
									{
										this.currentButton = null
										this.lastButton = null
									}
								}
								else
								{
									if (joystick.isPressed(physicalButton))
									{
										this.currentButton = actionNames[virtualButton]
										usingController = true
										break
									}
								}
							}
						}
					}

					// If no gamepad input, fallback to keyboard.
					if (!this.currentButton)
					{
						let key = Keyboard.Default.getKey()
						if (key)
						{
							usingController = false
							this.currentButton = Key.Enter
							let parseArrows = function(key)
							{
								if (currentFocus)
									switch(key)
									{
										case Key.Left: currentFocus.selectLeft(); break
										case Key.Right: currentFocus.selectRight(); break
										case Key.Up: currentFocus.selectTop(); break
										case Key.Down: currentFocus.selectBottom(); break
										case Key.Enter: currentFocus.pressButtonBottomStart(); break
										case Key.Q: currentFocus.pressShoulderButtonLeftStart(); break
										case Key.W: currentFocus.pressShoulderButtonRightStart(); break
										case Key.A: currentFocus.pressShoulderTriggerLeftStart(); break
										case Key.S: currentFocus.pressShoulderTriggerRightStart(); break
									}
							}
							if (!keyboardArrows && this.arrowKeys.includes(key))
							{
								keyboardArrows = true
								ui.updateButtonLabels()
								Sphere.sleep(1).then(() => parseArrows(key))
							}
							else parseArrows(key)
						}
					}

					// Process menu controller input.
					if (this.currentButton && !this.currentButton.animating)
					{
						if (this.currentButton != this.lastButton)
						{
							this.lastButton = this.currentButton
							if (currentFocus)
							{
								// Fire button press events.
								switch (this.currentButton)
								{
									case "direction_up": currentFocus.selectTop(); break
									case "direction_down": currentFocus.selectBottom(); break
									case "direction_left": currentFocus.selectLeft(); break
									case "direction_right": currentFocus.selectRight(); break
									case "button_top": currentFocus.pressButtonTopStart(); break
									case "button_bottom": currentFocus.pressButtonBottomStart(); break
									case "button_left": currentFocus.pressButtonLeftStart(); break
									case "button_right": currentFocus.pressButtonRightStart(); break
									case "stick_down_left": currentFocus.pressStickDownLeftStart(); break
									case "stick_down_right": currentFocus.pressStickDownRightStart(); break
									case "shoulder_button_left": currentFocus.pressShoulderButtonLeftStart(); break
									case "shoulder_button_right": currentFocus.pressShoulderButtonRightStart(); break
									case "shoulder_trigger_left": currentFocus.pressShoulderTriggerLeftStart(); break
									case "shoulder_trigger_right": currentFocus.pressShoulderTriggerRightStart(); break
								}
							}						
						}
					}
					else
					{
						if (this.lastButton)
							this.lastButton = null
					}

					// Clear current button and exit.
					this.currentButton = null
					break
			}
		}
	}

	levelUpButtonPressed()
	{
		if (this.gameRunning())
		{
			if (this.canLevelUp())
			{
				if (pendingEvolution.length > 0)
					getExistingWeapon(pendingEvolution.pop()).triggerEvolution()
				else if (levelUpCount > 0 && !ui.levelUpPrompt.hidden)
					levelUp()
			}
			else if (reroll > 0)
			{
				reroll--
				Keylog = "**********"
				Joylog.fill(null)
				ui.buttonHints.refreshReRoll()
				audioHandler.playAudioHookUI("reroll")

				// Gambler augment.
				if ("augment_gambler" in activeAugments)
				{
					let existingGambler = powerups.find(powerup => powerup.constructor.name == "Gambler") || factory.spawn(Gambler, 1200)
					existingGambler.increment()
				}

				// Conviction augment.
				if ("augment_conviction" in activeAugments && reroll < maxReroll)
				{
					let conviction = powerups.find(powerup => powerup.constructor.name == "Conviction")
					if (conviction) conviction.expire()
				}

				if (!ui.upgradeScreen.hidden) ui.upgradeScreen.reroll()
				else if (!ui.lootScreen.hidden) ui.lootScreen.reroll(ui.lootScreen.bossLoot)
				else if (!ui.evolutionComplete.hidden) ui.evolutionComplete.reroll()
			}
		}
	}

	suspend(isSuspend)
	{
		if (!isSuspend) Keyboard.Default.clearQueue()
		this.suspendInput = isSuspend
	}

	triggerWeaponDetailTab()
	{
		if (ui.buttonHints.ready && !ui.buttonHints.animating)
		{
			if (ui.weaponDetail.hidden)
				ui.weaponDetail.startIntro()
			else
				ui.weaponDetail.startExtro()
		}
	}

	navigateWeaponDetailTab(action)
	{
		if (action != this.currentButton)
		{
			if (!usingController)
			{
				usingController = true
				keyboardArrows = false
				if (!ui.weaponDetail.hidden)
				{
					ui.weaponDetail.refreshInstructions()
					ui.weaponDetail.updatePage()
				}
			}
			if (currentFocus)
			{
				switch (action)
				{
					case direction_up: currentFocus.selectTop(); break
					case direction_down: currentFocus.selectBottom(); break
					case direction_left: currentFocus.selectLeft(); break
					case direction_right: currentFocus.selectRight(); break
					case button_bottom: currentFocus.pressButtonBottomStart(); break
					case shoulder_button_left: currentFocus.pressShoulderButtonLeftStart(); break
					case shoulder_button_right: currentFocus.pressShoulderButtonRightStart(); break
				}
			}
			else
			{
				if (!ui.weaponDetail.hidden)
				{
					ui.weaponDetail.currentContext.takeFocus()
					this.navigateWeaponDetailTab(action)
				}
				else if (!ui.summaryScreen.hidden)
					ui.summaryScreen.panel.button.takeFocus()
				else if (!ui.pauseMenu.hidden)
					ui.pauseMenu.panel.pauseMenuButtons[0].takeFocus()
			}
		}
	}

	simulateType(wpm)
	{
		if (this.simulateTypeString.length > 0)
		{
			this.addCharacter(this.simulateTypeString.charAt(0))
			this.simulateTypeString = this.simulateTypeString.substring(1)
			if (this.simulateTypeString.length > 0)
				Sphere.sleep(720 / wpm)		// Convert to frames between characters.
					.then(() => this.simulateType(wpm))
			else
			{
				this.naturalTypingDelay = true
				Sphere.sleep(65).then(() => this.naturalTypingDelay = false)
			}
		}
	}

	on_update()
	{
		// Check if player has moved the mouse while in controller mode.
		// If yes, change back to kb + m.
		if (usingController || keyboardArrows)
		{
			if (this.lastMouseX == null)
			{
				this.lastMouseX = Mouse.Default.x
				this.lastMouseY = Mouse.Default.y
			}
			else
			{
				if (Mouse.Default.x != this.lastMouseX || Mouse.Default.y != this.lastMouseY)
				{
					usingController = false
					keyboardArrows = false
					this.lastMouseX = null
					this.lastMouseY = null
					ui.updateButtonLabels()
				}
			}
		}

		// If in-game and not paused.
		if (currentScreen != game || isPaused()) return

		// If Observer augment.
		if ("augment_observer" in activeAugments && !powerups.some(powerup => powerup.constructor.name == "Observer"))
		{
			if (spawner.currentFrame - this.observerFrameStamp > 180)
				factory.spawn(Observer, Infinity)
		}

		// Auto key in name of nearest enemy if wpm simulator is on.
		if (wpmSimulator > 0 && this.simulateTypeString.length == 0 && !isPaused() && !this.naturalTypingDelay)
		{
			// If evolution pending, pick evolution.
			if (pendingEvolution.length > 0 && ui.evolutionComplete.hidden)
				getExistingWeapon(pendingEvolution.pop()).triggerEvolution()

			// If level up, level up.
			if (levelUpCount > 0 && ui.upgradeScreen.hidden)
				levelUp()

			// Helper function to find first word variant.
			let getFirstWordVariant = function(obj)
			{
				if (obj.cyphered && obj.cypherStringVariants && obj.cypherStringVariants.length > 0)
					return obj.cypherStringVariants[0].word
				else if (!obj.cyphered && obj.wordVariants && obj.wordVariants.length > 0)
					return obj.wordVariants[0].word
				else
				{
					print(`Can't find word variant for ${obj.word} on ${obj.constructor.name}.`)
					return ""
				}
			}

			// If warder, shoot warder.
			let warder = hostilesArray.find((enemy) => enemy.constructor.name == "Warder")
			if (warder)
			{
				this.simulateTypeString = getFirstWordVariant(warder)
				this.simulateType(wpmSimulator)
				return
			}

			// Take note if there are Swarmers or Pickups.
			let swarmer = hostilesArray.find((enemy) => enemy.constructor.name == "Swarmer")
			let pickup = currentPickups.length > 0 ? currentPickups[0] : null

			// Else, shoot nearest enemy.
			let nearestEnemy = hostilesArray.reduce((nearest, enemy) => {
				if (enemy.getType() == type.enemy &&
					enemy.word &&
					Matter.Bounds.overlaps(enemy.body.bounds, screenBounds) &&
					(nearest == null || distanceBetween(enemy.getPosition(), screenCenter) < distanceBetween(nearest.getPosition(), screenCenter))
				)
					return enemy
				else return nearest
			}, null)
			if (nearestEnemy)
			{
				if (pickup && distanceBetween(nearestEnemy.getPosition(), screenCenter) > 300)
					this.simulateTypeString = getFirstWordVariant(pickup)
				else if (swarmer && distanceBetween(nearestEnemy.getPosition(), screenCenter) > 300)
					this.simulateTypeString = getFirstWordVariant(swarmer)
				else
					this.simulateTypeString = getFirstWordVariant(nearestEnemy)
				this.simulateType(wpmSimulator)
			}
			else if (pickup)
			{
				this.simulateTypeString = getFirstWordVariant(pickup)
				this.simulateType(wpmSimulator)
			}
		}
	}

	addCharacter(char)
	{
		// If character is empty, return.
		if (char === "") return

		// Use the right collection.
		let currentWords = inUpgradeMenu ? wordsInUseMenu : wordsInUse

		// If input is from keyboard.
		let isMisType
		if (typeof char === 'string' || char instanceof String)
		{
			// If previously using controller, switch.
			if (usingController)
			{
				usingController = false
				Joylog.fill(null)
			}

			// Append character to keylogger.
			Keylog = Keylog.slice(-9) + char

			// Check for mistype and matching characters for each word.
			isMisType = true;
			for (let i = 0; i < currentWords.length; i++) {
				const currentWordObj = currentWords[i]
				let currentMistype = currentWordObj[2].updateWordDisplay(0)
				isMisType = isMisType ? currentMistype : isMisType

				// currentWordObj can be removed using unordered remove in updateWordDisplay, update i.
				if (currentWordObj != currentWords[i]) {
					--i
				}
			}
		}

		// Else, if input from joystick.
		else
		{
			// If previously using keyboard, switch.
			if (!usingController)
			{
				usingController = true
				Keylog = "**********"
			}

			// Append joystick button to logger.
			Joylog.shift()
			Joylog.push(char)
			
			// Refresh display of all words.
			isMisType = true;
			for (let i = 0; i < currentWords.length; i++) {
				const currentWordObj = currentWords[i]
				let currentMistype = currentWordObj[2].updateWordDisplay(1)
				isMisType = isMisType ? currentMistype : isMisType

				// currentWordObj can be removed using unordered remove in updateWordDisplay, update i.
				if (currentWordObj != currentWords[i]) {
					--i
				}
			}
		}

		// Progress boss paragraph (if any)
		if (boss && boss.constructor.name == "Poet" && !inUpgradeMenu)
			isMisType = boss.inputChar(char) && isMisType

		// Process mistypes.
		if (isMisType)
		{
			// Increment total mistypes.
			totalMistypes++

			// If Scapegoat augment.
			if ("augment_scapegoat" in activeAugments)
			{
				let scapegoats = []
				allWeapons.forEach(weap => {
					if (weap.constructor.nonDamageTags().includes("tag_drone"))
						scapegoats = scapegoats.concat(weap.children)
				})
				if (scapegoats.length > 0)
				{
					audioHandler.playAudioHookUI("typing_scapegoat")
					let scapegoat = Random.sample(scapegoats)
					for (let i = 0; i < 10; i++)
						factory.spawn(Debris, scapegoat.position.x, scapegoat.position.y)
					scapegoat.suspend()
					return
				}
			}

			// Else process mistype normally.
			audioHandler.playAudioHookUI("typing_error")
			if (!inUpgradeMenu)
			{
				// If Release loot item.
				if ("item_release" in serializedLoot)
					getExistingWeapon("Release").activate()

				// Cancel Perfect Input.
				this.cancelNoMistypes()

				// Take damage if Omen V.
				if (omenLevel >= 5)
				{
					currentTurret.getHit(3, true)
					factory.spawn(Damage, screenCenter.x, screenCenter.y, "-3")
				}
			}
		}
		else if (!muteTypingSounds) audioHandler.playAudioHookUI("typing_ok")
	}

	countNoMistypes(word)
	{
		this.noMistypes += word.length
		let existingNoMistypes = powerups.find((powerup) => powerup.constructor.name == "NoMistypes")
		if (this.noMistypes > this.noMistypesTarget)
		{
			this.noMistypes -= this.noMistypesTarget
			if (existingNoMistypes)
				existingNoMistypes.increment(1, word.length)
			else
			{
				let noMistypes = factory.spawn(NoMistypes, 1200)
				noMistypes.increment(1, this.noMistypesTarget + this.noMistypes)
			}
		}
		else if (existingNoMistypes)
			existingNoMistypes.increment(0, word.length)
	}

	cancelNoMistypes()
	{
		this.noMistypes = 0
		let existingNoMistypes = powerups.find((powerup) => powerup.constructor.name == "NoMistypes")
		if (existingNoMistypes)
		{
			if(existingNoMistypes.chars > perfectInputRecord)
				perfectInputRecord = existingNoMistypes.chars
			existingNoMistypes.expire()
		}
	}

	// Count how many characters match in both word and quicktime sequence.
	updateWordDisplay(obj, which, clearInactive) // which: 0 = word; 1 = quicktime; 2 = all
	{
		// Numbers of letters matched (to check mistype).
		let numMatched = 0

		// Word.
		if (which == 0 || which == 2)
		{
			// Check number of letters matched.
			let word = obj.cyphered ? obj.cypherString : obj.word
			let variants = obj.cyphered ? obj.cypherStringVariants : obj.wordVariants
			let matchedVariant = countMatchAllVariants(variants, Keylog)
			numMatched = matchedVariant.match
			if (obj.numMatchingLetters == 0 && numMatched > 0) obj.wpmTimeStart = Date.now()
			obj.numMatchingLetters = numMatched
			obj.variantMatches = matchedVariant.matchActual
			obj.variantString = matchedVariant.word || variants[0].word

			// If current game language is Simplified Chinese, also generate displayed pinyin.
			if (currentGameLanguage == "schinese" && !obj.cyphered)
			{
				obj.displayedPinyin = obj.variantString
				let variantObj = obj.wordVariants.find(variant => variant.word == obj.variantString)
				let characterCount = 0
				for (let i = 0; i < variantObj.increments.length - 1; i++)
				{
					let v = variantObj.increments[i]
					characterCount += v
					obj.displayedPinyin = obj.displayedPinyin.slice(0, characterCount + i) + " " + obj.displayedPinyin.slice(characterCount + i)
				}
			}

			// If complete match.
			if (obj.numMatchingLetters == word.length)
			{
				let shownWord, font
				if (isEastAsianPrimaryDisplay)
				{
					shownWord = obj.cyphered ? 
						currentGameLanguage == "koreana" ?
							Array.from(obj.variantString).map(char => qwertyToKorean[char]).join("") :
							obj.variantString :
						obj.word
					font = regularEastAsianLarge
				}
				else
				{
					shownWord = obj.variantString
					font = typingFontLarge
				}
				factory.spawn(WordComplete, shownWord, font, darkGray, obj)
				this.wordInput(word, Date.now() - obj.wpmTimeStart, true, obj.cyphered, matchedVariant.word)
			}
		}

		// Quicktime sequence.
		if (which == 1 || which == 2)
		{
			// Check number of letters matched.
			let quicktime = obj.cyphered ? obj.cypherQuicktimeString : obj.quicktime
			numMatched = countMatch(quicktime, Joylog)
			if (obj.numMatchingQuicktimeSymbols == 0 && numMatched > 0) obj.wpmTimeStart = Date.now()
			obj.numMatchingQuicktimeSymbols = numMatched

			// If complete match.
			if (obj.numMatchingQuicktimeSymbols == quicktime.length)
			{
				factory.spawn(WordComplete, getQuickTimeString(quicktime), quicktimeFont, darkGray, obj)
				this.wordInput(
					obj.cyphered ? obj.cypherString : obj.word,
					Date.now() - obj.wpmTimeStart,
					false,
					obj.cyphered
				)
			}
		}

		// If no matches and already destroyed, remove.
		if ("active" in obj)
			if ((which < 2 || clearInactive) && !numMatched && !obj.active)
				obj.stop()

		// If no letters matched, return true.
		return (which < 2) ? !numMatched : null
	}

	wordInput(word, timeTaken = 0, isWord = false, cyphered = false, actualWord = word)
	{
		// Use the right collection.
		let currentWords = cyphered ? cyphersInUse : inUpgradeMenu ? wordsInUseMenu : wordsInUse

		Keylog = "**********"
		Joylog.fill(null)
		currentWords.forEach(v => v[2].updateWordDisplay(2))

		let match = currentWords.find(v => v[0] == word)
		if (match)
		{
			// Play word complete sound.
			audioHandler.playAudioHookUI("word_complete")

			// If in-game, keep time records for wpm calculation.
			if (!inUpgradeMenu)
			{
				totalTypingTime += timeTaken
				charactersCompleted += isWord ? word.length : match[1].length
			}

			// Calculate blitz bonus.
			let time = Date.now()
			if (time - this.blitzTimeKeeper[0] < this.blitzTime)
				this.incrementBlitz()
			this.blitzTimeKeeper.shift()
			this.blitzTimeKeeper.push(time)

			let target = match[2]
			switch (target.getType())
			{
				case type.enemy:

					// Increment no-mistype count.
					this.countNoMistypes(word)

					// If Observer augment.
					if ("augment_observer" in activeAugments)
					{
						// If current active Observer powerup, destroy it.
						let observer = powerups.find(powerup => powerup.constructor.name == "Observer")
						if (observer) observer.expire()
						
						// Record time of last shot fired.
						this.observerFrameStamp = spawner.currentFrame
					}

					// If not a double word.
					if (!target.doubleWord)
					{
						// Trigger word complete event in weapons.
						for (const weapon of allWeapons)
							weapon.onWordComplete(this.normalize(actualWord), target.quicktime, target)

						// Fire at enemy.
						if (target.active)
						{
							currentTurret.fire(target)
							target.refreshWord(true)
						}
						else // If target already destroyed.
						{
							if ("item_closer" in serializedLoot)
							{
								let existingCloser = powerups.find(powerup => powerup.constructor.name == "Closer")
								if (existingCloser)
								{
									existingCloser.node.currentProgress = existingCloser.node.maxProgress
									existingCloser.trigger()
								}
								else factory.spawn(Closer, 600)
							}
							target.stop()
						}
					}
					else
					{
						target.doubleWordComplete()
						for (const weapon of allWeapons)
							weapon.onDoubleWordComplete(this.normalize(actualWord), target.quicktime, target)
					}
					break
				
				case "Upgrade":
					target.triggerUpgrade()
					this.refreshAllModifiers()
					break
				
				case type.pickup:
					this.countNoMistypes(word)
					target.activate()
					this.refreshAllModifiers()
					break
			}
		}
	}

	incrementBlitz()
	{
		let existingBlitz = powerups.find((powerup) => powerup.constructor.name == "Blitz") || factory.spawn(Blitz, 600)
		existingBlitz.increment()
	}

	refreshAllModifiers()
	{
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}

	getSteamButtonOrigin(glyph)
	{
		if (steamEnabled && this.currentController)
			return ISteamInput.GetDigitalActionOrigins(
				this.currentController,
				this.inGameControls,
				this.inGameActions[actionNames[glyph]]
			).originsOut[0]
		else return ""
	}

	normalize(str)
	{
		return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
	}
}

class NoMistypes extends Powerup
{
	constructor()
	{
		super("powerup_noMistypes")
		this.maxLevel = 5
	}
	on_init()
	{
		this.level = 0
		this.chars = 0
		this.displayChars = 0
	}
	increment(increaseLevel, increaseChars)
	{
		if (increaseLevel > 0)
		{
			this.node.currentProgress = this.node.maxProgress
			audioHandler.playAudioHook("no_mistypes_increment")
			if (this.level < this.maxLevel)
			{
				this.level += increaseLevel
				this.updateModifier()
			}
		}
		this.chars += increaseChars
	}
	updateModifier()
	{
		modifiers.editPercModifier("global", "no_mistypes", {
			critChance: this.level * ("augment_immaculate" in activeAugments ? .015 : .01),
			...("item_flawless" in serializedLoot ? { rateOfFire: this.level * .05 } : {})
		});
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
	updateSubtitle()
	{
		this.node.setText(
			localize("powerup_noMistypes", Math.floor(this.displayChars)),
			localize(
				"powerup_noMistype_subText",
				this.level * ("augment_immaculate" in activeAugments ? 1.5 : 1),
				"item_flawless" in serializedLoot ? `, +${this.level * 5}% ${localize("rateOfFire_text")}` : "",
				this.level < this.maxLevel ? "" : ` (${localize("max")})`)
		)
	}
	refresh()
	{
		this.updateModifier()
		this.updateSubtitle()
	}
	on_update()
	{
		super.on_update()
		if (this.displayChars < this.chars)
		{
			this.displayChars += .5
			this.updateSubtitle()
		}
	}
	on_expire(forced)
	{
		if (this.chars > perfectInputRecord)
			perfectInputRecord = this.chars
		if (!forced) audioHandler.playAudioHook("no_mistypes_stop")
		modifiers.editPercModifier("global", "no_mistypes", {
			critChance: 0,
			...("item_flawless" in serializedLoot ? { rateOfFire: 0 } : {})
		});
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
}

class Blitz extends Powerup
{
	constructor()
	{
		super("powerup_blitz")
		this.maxLevel = 5
	}
	on_init()
	{
		this.level = 0
	}
	increment()
	{
		this.node.currentProgress = this.node.maxProgress
		audioHandler.playAudioHook("blitz_increment")
		if (this.level < this.maxLevel)
		{
			this.level++
			this.updateModifier()
			this.updateSubtitle()
		}
	}
	updateModifier()
	{
		modifiers.editPercModifier("global", "blitz", { rateOfFire: this.level * .1 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
	updateSubtitle()
	{
		this.node.setText(
			localize("powerup_blitz", this.level),
			localize(
				"powerup_blitz_subText",
				this.level * 10,
				this.level < this.maxLevel ? "" : ` (${localize("max")})`)
		)
	}
	on_expire(forced)
	{
		if (!forced) audioHandler.playAudioHook("blitz_stop")
		modifiers.editPercModifier("global", "blitz", { rateOfFire: 0 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
}