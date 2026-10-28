import { Node, Yoga, Text, Easing, Tween } from 'sphere-runtime'
import { Button } from '../core/button.js'
import { saveGame } from '../core/loader.js'
import { findLeaderboard, uploadLeaderboardScore } from '../core/leaderboard.js'

export class SummaryScreen extends Node
{
	constructor()
	{
		super()
			.setRenderMode(renderMode.color)
			.setTexture(bgColor.fadeTo(0))
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setHeight("100%")
		
		this.panel = new SummaryScreenPanel()
			.setChildOf(this)

		this.tween = new Tween(this, Easing.Linear)
		this.opacity = 0

		return this
	}

	startIntro()
	{
		this.setAnimating(true)
		this.tween.easeIn({opacity: 1}, 40)
			.then(() => this.setAnimating(false))
		this.panel.animYOffset = this.getComputedHeight() - this.panel.getComputedTop()
		Sphere.sleep(20).then(() => this.panel.startIntro())
		this.show()
	}

	startExtro(nextTrial = false)
	{
		this.setAnimating(true)
		currentFocus = null
		this.panel.startExtro()
		Sphere.sleep(10).then(() => {
			ui.setHUDState("none")
			this.tween.easeIn({opacity: 0}, 40)
				.then(() => {
					this.setAnimating(false)
					this.hide()
					currentScreen = menu
					inUpgradeMenu = false
					bgm.setPlaylist("menu")
					unpause("endgame")
					nextTrial ? nextMissionStart() : returnToMainMenu()
				})
		})
	}

	keyboardEnter()
	{
		if (!this.hidden && !this.animating && ui.weaponDetail.hidden)
		{
			keyboardArrows = true
			if (!currentFocus)
				this.panel.button.takeFocus()
			else
				currentFocus.activate()
		}
	}

	keyboardArrows(key)
	{
		if (!this.hidden && !this.animating && ui.weaponDetail.hidden)
		{
			keyboardArrows = true
			if (!currentFocus)
				this.panel.button.takeFocus()
			else
				switch(key)
				{
					case Key.Left: currentFocus.selectLeft(); break
					case Key.Right: currentFocus.selectRight(); break
				}
		}
	}

	update()
	{
		if (this.animating)
			this.setTexture(bgColor.fadeTo(this.opacity))
	}
}

class SummaryScreenPanel extends Node
{
	constructor()
	{
		super()
			.setRenderMode(renderMode.color)
			.setTexture(paleYellow)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("40%")
			.setHeight("65%")
		
		this.icon = new Text()
			.setFont(interfaceIconsLarge)
			.setText('"')
			.setColor(midGray)
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(20))
			.setChildOf(this)
		
		this.survived = new Text()
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setFont(regularFontUI())
			.setText(localize("survived_text"))
			.setColor(midGray)
			.setChildOf(this)
		
		this.time = new Text()
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setFont(timerFont)
			.setText("00:00:00")
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(8))
			.setColor(darkGray)
			.setChildOf(this)

		this.class = new Text()
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setFont(regularFontUI())
			.setText("Level 15 Repeater")
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(40))
			.setColor(midGray)
			.setChildOf(this)
		
		this.dataGroups = new Node()
			.setWidth("100%")
			.setHeight("25%")
			.setChildOf(this)
		
		this.wpm = new DataGroup()
			.setName("Words Per Minute:")
			.setChildOf(this.dataGroups)

		this.accuracy = new DataGroup()
			.setName(`${localize("accuracy_text")}:`)
			.setValue("99.9% (1 Mistake)")
			.setChildOf(this.dataGroups)

		this.bestWeapon = new DataGroup()
			.setName(`${localize("best_weapon_text")}:`)
			.setValue("Repeater (52.2 dps)")
			.setChildOf(this.dataGroups)
		
		this.coinsEarned = new DataGroup()
			.setName(`${localize("coins_earned_text")}:`)
			.setValue("123 §")
			.setChildOf(this.dataGroups)

		this.rankingPoints = new DataGroup()
			.setName(`${localize("ranking_points_text")}:`)
			.setValue("123456")
			.setChildOf(this.dataGroups)
		
		this.buttonGroup = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setMargin(Yoga.EDGE_TOP, scalePix(70))
			.setWidth("100%")
			.setChildOf(this)

		this.nextLevelButton = new NextLevelButton()
			.setChildOf(this.buttonGroup)

		this.button = new ContinueButton()
			.setChildOf(this.buttonGroup)
		
		// Show feedback button if demo.
		if (demo)
		{
			this.feedbackButton = new FeedbackButton()
				.setChildOf(this.buttonGroup)
			this.button.setRightNext(this.feedbackButton)
			this.feedbackButton.setLeftNext(this.button)
		}
		
		this.tween = new Tween(this, Easing.Exponential)
		return this
	}

	startIntro()
	{
		ui.setHUDState("end")
		this.setAnimating(true)
		audioHandler.playAudioHookUI("summary_screen_intro")
		this.tween.easeOut({animYOffset: 0}, 20)
			.then(() => {
				this.setAnimating(false)
				control.suspend(false)
				this.button.takeFocus()
			})
		this.checkAchievements()
	}

	startExtro()
	{
		this.setAnimating(true)
		audioHandler.playAudioHookUI("summary_screen_extro")
		this.tween.easeIn({animYOffset: -(this.getComputedTop() + this.getComputedHeight())}, 20)
			.then(() => this.setAnimating(false))
	}

	checkAchievements()
	{
		// Achievements.
		if (steamEnabled && parseInt(ISteamUtils.GetAppID()) == 2400160 && omenLevel >= 0)
		{
			let hasAchievement = false

			// Endless Mode Achievements.
			if (!missionMode)
			{
				let timeInMinutes = timeElapsed / 60000
				if (timeInMinutes > 20)
				{
					hasAchievement = true
					ISteamUserStats.SetAchievement("endless_20")
					if (timeInMinutes > 30)
						ISteamUserStats.SetAchievement("endless_30")
				}
			}

			// DPS Achievements.
			let dpsRankings = getSortedDpsRanking().filter(dps => dps[1] >= 500 && dps[2].isWeapon)
			if (dpsRankings.length > 0)
			{
				hasAchievement = true
				dpsRankings.forEach(dps => ISteamUserStats.SetAchievement(dps[2].constructor.name.toLowerCase() + "_500"))
			}

			// Perfect Input Achievements.
			let existingPerfectInput = powerups.find((powerup) => powerup.constructor.name == "NoMistypes")
			if ((existingPerfectInput && existingPerfectInput.chars >= 500) || perfectInputRecord >= 500)
			{
				hasAchievement = true
				ISteamUserStats.SetAchievement("perfect_500")
				if (perfectInputRecord >= 1000)
					ISteamUserStats.SetAchievement("perfect_1000")
			}

			// Record achievements on Steam servers (if any)
			if (hasAchievement)
				ISteamUserStats.StoreStats()
		}
	}

	refresh(death = true)
	{
		let totalTimeInMinutes = totalTypingTime / 60000
		let wordsTyped = charactersCompleted / (usingController ? 3 : 5)
		let weaponRanking = getSortedDpsRanking()
		let omenScoreMult = function(score) { return (score * (1 + omenLevel * .2)) }

		let wpm = totalTimeInMinutes == 0 ? 0 : Math.round(wordsTyped / totalTimeInMinutes)
		let accuracy = charactersCompleted == 0 ? 1 : Math.max((1 - totalMistypes / charactersCompleted), 0)

		// Set title.
		if (death)
		{
			this.icon.setText('"')
			this.survived.setText(localize("survived_text"))
			this.time.setFont(timerFont)
			this.time.setText(timeToString(timeElapsed))
			this.nextLevelButton.hide()
			this.button.setLeftNext(null)
			
			const scoreNumber = omenScoreMult(timeElapsed)
			const score = scoreNumber.toFixed(0)
			this.rankingPoints.show()
			this.rankingPoints.setValue(score)

			// Remove gameState save if trials game.
			const turretName = currentTurret.constructor.name

			if (missionMode && turretName in save.gameStates)
				delete save.gameStates[turretName]

			// Create save for turret if it doesn't already exist.
			if (!(turretName in save.turrets))
			{
				save.turrets[turretName] = {
					trialsRecord: { trial: 0, omen: 0 },
					endlessRecord: { score: 0, omen: 0 }
				}
			}

			// Save record.
			let rec = save.turrets[turretName]
			if (missionMode)
			{
				if ((rec.trialsRecord && (omenLevel * 10 + missionTier > rec.trialsRecord.omen * 10 + rec.trialsRecord.trial)) || !rec.trialsRecord)
					save.turrets[turretName].trialsRecord = {
						omen: omenLevel,
						trial: missionTier
					}
			}
			else if (score > rec.endlessRecord.score)
				save.turrets[turretName].endlessRecord = {
					score: score,
					omen: omenLevel
				}

			if (!missionMode)
			{
				updateLeaderboard(turretName, scoreNumber, timeElapsed, omenLevel, weaponRanking[0][2].constructor.name, (uploadResult) => {
					const newRankText = uploadResult.m_bScoreChanged ? " NEW" : ""
					const highest = uploadResult.m_bScoreChanged ? `${uploadResult.m_nGlobalRankNew}` : `${uploadResult.m_nGlobalRankPrevious}`
					// TODO: Add real text for leaderboard rank.
					this.rankingPoints.setValue(`${score} (${highest}${newRankText})`)
				})

				// Add to WPM history.
				rec.history = rec.history || []
				rec.history.push({
					date: Date.now(),
					wpm: wpm,
					acc: accuracy
				})
				while (rec.history.length > WPMHistoryCount)
					rec.history.shift()
			}

			saveGame()
		}
		else
		{
			this.rankingPoints.hide()
			this.icon.setText(",")
			this.survived.setText(
				localize(
					"mission_complete_desc",
					currentTurret.constructor.getName() + (
						omenLevel > 0 ?
							" (" + localize(
								"omen_text",
								romanize(omenLevel)
							) + ") " :
							""
					),
					convertIfChinese(missionTier),
					convertIfChinese(maxMissionTier)
				)
			)
			this.time.setFont(titleFontUI())
			this.time.setText(localize("mission_complete"))

			// Completed all trials. Proceed to next Omen level.
			if (missionTier >= maxMissionTier)
			{
				this.nextLevelButton.hide()
				this.button.setLeftNext(null)

				// Delete game state.
				let turretName = currentTurret.constructor.name
				if (turretName in save.gameStates)
					delete save.gameStates[turretName]

				// Create save for turret if it doesn't already exist.
				if (!(turretName in save.turrets))
				{
					save.turrets[turretName] = {
						trialsRecord: { trial: 0, omen: 0 },
						endlessRecord: { score: 0, omen: 0 }
					}
				}

				// Save record.
				let rec = save.turrets[turretName]
				if ((rec.trialsRecord && (++omenLevel * 10 > rec.trialsRecord.omen * 10 + rec.trialsRecord.trial)) || !rec.trialsRecord)
					save.turrets[turretName].trialsRecord = {
						omen: omenLevel,
						trial: 1
					}
			}
			else
			{
				this.nextLevelButton.show()
				this.nextLevelButton.setRightNext(this.button)
				this.button.setLeftNext(this.nextLevelButton)

				// Save game.
				let saveState = {
					currentHealth: currentTurret.currentHealth,
					omenLevel: omenLevel,
					trialLevel: ++missionTier,
					serializedLoot: JSON.parse(JSON.stringify(serializedLoot)),
					serializedUpgrades: JSON.parse(JSON.stringify(serializedUpgrades)),
					evolutionLevels: [...allWeapons, currentTurret]
						.filter(weap => weap.isWeapon)
						.map(weap => [weap.constructor.name, weap.currentEvolution, weap.maxEvolution]),
					currentLevel: currentLevel,
					currentExperience: currentExperience,
					expToNextLevel: expToNextLevel,
					shields: shields,
					maxShields: maxShields,
					reroll: reroll,
					maxReroll: maxReroll,
					levelUpCount: levelUpCount,
					pendingEvolution: pendingEvolution,
					freezeDurationBonus: freezeDurationBonus,
					doubleDamageDurationBonus: doubleDamageDurationBonus,
					activeAugments: activeAugments
				}
				save.gameStates[currentTurret.constructor.name] = saveState
			}

			// Save game on disk.
			saveGame()
		}

		this.class.setText(`${localize("level", levelNumberText())} ${weaponRanking[0][0]}`)
		this.wpm.setName(`${localize(usingController ? "combinations_per_minute_text" : "words_per_minute_text")}:`)
		this.wpm.setValue(`${wpm}`)
		this.accuracy.setValue(`${Math.round(accuracy * 100)}% (${totalMistypes} ${localize("mistakes_text")})`)
		this.bestWeapon.setValue(`${weaponRanking[0][0]} (${weaponRanking[0][1].toFixed(1)} dps)`)
		this.coinsEarned.setValue(`${coinsEarned} §`)
	}
}

class DataGroup extends Node
{
	constructor()
	{
		super()
			.setWidth("100%")
			.setHeight(regularFontUI().height)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
		
		this.dataName = new Text()
			.setFont(regularFontUI())
			.setText("Name:")
			.setColor(midGray)
			.setWidth("50%")
			.setTextAlign(textAlign.right)
			.setPadding(Yoga.EDGE_RIGHT, scalePix(20))
			.setChildOf(this)

		this.dataValue = new Text()
			.setFont(regularFontUI())
			.setText("99")
			.setColor(midGray)
			.setWidth("50%")
			.setPadding(Yoga.EDGE_LEFT, scalePix(20))
			.setChildOf(this)
		
		return this
	}

	setName(name)
	{
		this.dataName.setText(name)
		return this
	}

	setValue(value)
	{
		this.dataValue.setText(value)
		return this
	}
}

class SummaryScreenButton extends Button
{
	constructor()
	{
		super()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW_REVERSE)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setMargin(Yoga.EDGE_RIGHT, scalePix(10))
			.setHeight(regularFontUI().height + scalePix(25))
		
		this.text = new Text()
			.setColor(paleYellow)
			.setFont(regularFontUI())
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setChildOf(this)
		
		return this
	}

	focusStart()
	{
		if (ui.weaponDetail.hidden)
		{
			audioHandler.playAudioHookUI("summary_screen_button_hover")
			this.setTexture(secondColorDark)
		}
	}

	focusEnd()
	{
		this.setTexture(midGray)
	}

	pressMouseLeftStart() { if (ui.weaponDetail.hidden) this.activate() }
	pressButtonBottomStart() { if (ui.weaponDetail.hidden) this.activate() }
	activate()
	{
		audioHandler.playAudioHookUI("summary_screen_button_click")
		currentFocus = null
		this.focusEnd()
	}
}

class ContinueButton extends SummaryScreenButton
{
	constructor()
	{
		super().setWidth(regularFontUI().widthOf(localize("return_to_main_menu_text")) + scalePix(60))
		this.text.setText(localize("return_to_main_menu_text"))
	}
	activate()
	{
		super.activate()
		ui.summaryScreen.startExtro()
	}
}

class NextLevelButton extends SummaryScreenButton
{
	constructor()
	{
		super().setWidth(regularFontUI().widthOf(localize("next_level_text")) + scalePix(60))
		this.text.setText(localize("next_level_text"))
	}

	activate()
	{
		super.activate()
		ui.summaryScreen.startExtro(true)
	}
}

class FeedbackButton extends SummaryScreenButton
{
	constructor()
	{
		super().setWidth(interfaceIcons.widthOf("%") + scalePix(10) + regularFontUI().widthOf(localize("feedback_question")) + scalePix(60))
		this.text
			.setText(localize("feedback_question"))
			.setWidth(regularFontUI().widthOf(localize("feedback_question")))
		this.icon = new Text()
			.setFont(interfaceIcons)
			.setText("%")
			.setColor(paleYellow)
			.setMargin(Yoga.EDGE_RIGHT, scalePix(10))
			.setWidth(interfaceIcons.widthOf("%"))
			.setChildOf(this)
	}
	activate()
	{
		audioHandler.playAudioHookUI("summary_screen_button_click")
		Sphere.openURL("https://docs.google.com/forms/d/e/1FAIpQLSfeCh23g5LbJPTFtLqHsCV2mCzMSSJiW-hW4h9Qcd45KKMZ_A/viewform?usp=sharing")
	}
}

async function updateLeaderboard(turretName, score, time, difficulty, favoriteWeapon, useResultFunction)
{
	if (global.steamEnabled)
	{
		const leaderboard = await findLeaderboard(turretName)
		const uploadResult = await uploadLeaderboardScore(leaderboard, score, time, difficulty, favoriteWeapon)
		if (useResultFunction)
			useResultFunction(uploadResult)
	}
}