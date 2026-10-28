import { Node, Yoga, Text } from 'sphere-runtime'
import { Button } from '../core/button.js'
import { WeaponTag } from './weaponTag.js'
import { saveGame } from '../core/loader.js'
import { Turrets } from '../data/turrets.js'
import { Damage } from '../effects/damage.js'

class TurretDetails extends Node
{
	constructor()
	{
		super()
			.setWidth("60%")
			.setHeight("70%")
			.setRenderMode(renderMode.colorRounded)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setAlignItems(Yoga.ALIGN_FLEX_START)
			.setPadding(Yoga.EDGE_ALL, "5%")
			.setTexture(midGray.fadeTo(.3))

		// *********
		// TOP GROUP
		// *********

		// Title
		// -----
		
		this.titleGroup = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_FLEX_START)
			.setWidth("80%")
			.setHeight(titleFontUI().height)
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(7))
			.setChildOf(this)
		
		this.icon = new Text()
			.setWidth("12%")
			.setFont(titleIcons)
			.setColor(secondColorDark)
			.setMargin(Yoga.EDGE_TOP, "1.5%")
			.setChildOf(this.titleGroup)

		this.title = new Text()
			.setEastAsian(isUIEastAsian)
			.setFont(titleFontUI())
			.setWidth("88%")
			.setColor(darkGray)
			.setChildOf(this.titleGroup)

		// Turret Tags
		// -----------
		
		this.turretTags = new Node()
			.setWidth("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(40))
			.setChildOf(this)
		
		// Turret Description
		// ------------------

		this.turretDescription = new Text()
			.setWidth("100%")
			.setEastAsian(isUIEastAsian)
			.setFont(regularFontUI())
			.setColor(midGray)
			.setText("desc")
			.setChildOf(this)
		
		// ************
		// BOTTOM GROUP
		// ************
		
		this.buttonGroup = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_ALL, 0)
			.setPadding(Yoga.EDGE_ALL, "10%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE)
			.setAlignItems(Yoga.ALIGN_FLEX_START)
			.setChildOf(this)

		// ================
		// BUY WEAPON GROUP
		// ================

		this.buyWeaponGroup = new Node()
			.setWidth("100%")
			.setChildOf(this.buttonGroup)
		
		// Buy Weapon Data
		// ---------------
		
		this.buyWeaponData = new Node()
			.setWidth("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_FLEX_END)
			.setChildOf(this.buyWeaponGroup)

		this.buyWeaponRecord = new Node()
			.setWidth("60%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setChildOf(this.buyWeaponData)

		this.buyWeaponCost = new Text()
			.setFont(titleFontUI())
			.setWidth("100%")
			.setColor(midGray)
			.setHeight(titleFontUI().height)
			.setChildOf(this.buyWeaponRecord)
		
		this.buyWeaponCurrentCoins = new Text()
			.setFont(regularFontUI())
			.setWidth("100%")
			.setColor(midGray)
			.setHeight(regularFontUI().height)
			.setChildOf(this.buyWeaponRecord)
		
		// Endless Mode Start Button
		// -------------------------
		
		this.buyWeaponButton = new BuyWeaponButton()
			.setChildOf(this.buyWeaponData)

		// ==================
		// ENDLESS MODE GROUP
		// ==================
		
		this.endlessModeGroup = new Node()
			.setWidth("100%")
			.setChildOf(this.buttonGroup)
		
		// Endless Mode Record
		// -------------------
		
		this.endlessModeData = new Node()
			.setWidth("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.endlessModeGroup)

		this.endlessModeRecord = new Node()
			.setHeight("100%")
			.setWidth("60%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE)
			.setJustifyContent(Yoga.FLEX_START)
			.setChildOf(this.endlessModeData)

		this.endlessModeRecordValue = new Text()
			.setFont(regularFontUI())
			.setText("00 : 00 : 00")
			.setWidth("100%")
			.setColor(midGray)
			.setHeight(regularFontUI().height)
			.setChildOf(this.endlessModeRecord)

		this.endlessModeRecordTitle = new Text()
			.setFont(titleFontUI())
			.setText(localize("endless_mode_record"))
			.setWidth("100%")
			.setColor(midGray)
			.setHeight(titleFontUI().height)
			.setChildOf(this.endlessModeRecord)
		
		// Endless Mode Buttons
		// --------------------
		
		this.endlessButtonGroup = new Node()
			.setWidth("40%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE)
			.setJustifyContent(Yoga.JUSTIFY_FLEX_START)
			.setChildOf(this.endlessModeData)

		this.endlessModeButton = new EndlessModeButton()
			.setChildOf(this.endlessButtonGroup)
		
		this.leaderBoardButton = new LeaderboardButton()
			.setBottomNext(this.endlessModeButton)
			.setChildOf(this.endlessButtonGroup)
		this.endlessModeButton.setTopNext(this.leaderBoardButton)
		
		// =======
		// DIVIDER
		// =======
		
		this.divider = new Node()
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(.2))
			.setWidth("100%")
			.setHeight(2)
			.setMargin(Yoga.EDGE_VERTICAL, scalePix(15))
			.setChildOf(this.buttonGroup)

		// ===========
		// TRIAL GROUP
		// ===========
		
		this.trialGroup = new Node()
			.setHeight("30%")
			.setWidth("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.buttonGroup)
		
		// Trial Group
		// -----------

		this.trialData = new Node()
			.setHeight("100%")
			.setWidth("60%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE)
			.setChildOf(this.trialGroup)

		this.trialValue = new Text()
			.setFont(regularFontUI())
			.setText("Omen II")
			.setWidth("100%")
			.setColor(midGray)
			.setHeight(regularFontUI().height)
			.setChildOf(this.trialData)
		
		this.trialTitle = new Text()
			.setFont(titleFontUI())
			.setText(localize("trial_mode_record"))
			.setWidth("100%")
			.setColor(midGray)
			.setHeight(titleFontUI().height)
			.setChildOf(this.trialData)
		
		// Trial Mode Buttons
		// ------------------
		
		this.trialButtonGroup = new Node()
			.setWidth("40%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE)
			.setJustifyContent(Yoga.JUSTIFY_FLEX_START)
			.setChildOf(this.trialGroup)

		this.trialStartResume = new StartResumeButton()
			.setBottomNext(this.leaderBoardButton)
			.setChildOf(this.trialButtonGroup)
		this.leaderBoardButton.setTopNext(this.trialStartResume)
		
		this.trialAbandon = new AbandonButton()
			.setBottomNext(this.trialStartResume)
			.setChildOf(this.trialButtonGroup)

		// Turret Locked Label
		// -------------------

		this.turretLockedLabel = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_HORIZONTAL, 0)
			.setPosition(Yoga.EDGE_BOTTOM, 0)
			.setPosition(Yoga.EDGE_TOP, "75%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this)
		
		this.turretLockedLabelIcon = new Text()
			.setWidth(interfaceIcons.widthOf("!"))
			.setHeight(interfaceIcons.height)
			.setText("!")
			.setFont(interfaceIcons)
			.setColor(midGray)
			.setMargin(Yoga.EDGE_RIGHT, scalePix(20))
			.setChildOf(this.turretLockedLabel)
		
		this.turretLockedLabelText = new Text()
			.setWidth("60%")
			.setEastAsian(isUIEastAsian)
			.setFont(regularFontUI())
			.setColor(midGray)
			.setText(localize("endless_locked_text"))
			.setChildOf(this.turretLockedLabel)
	}

	setTurret(turret)
	{
		// Turret information.
		this.icon.setText(turret.icon)
		this.title.setText(turret.name)
		this.turretDescription.setText(localize(turret.desc))
		this.turretTags.removeAllChildren()
		for (const tag of turret.tags)
			new WeaponTag(tag)
				.setChildOf(this.turretTags)
		
		// Check if turret is ready.
		if ("comingSoon" in turret)
		{
			// Hide all run info.
			this.buttonGroup.hide()
			this.turretLockedLabel.show()

			// Populate label with desc.
			this.turretLockedLabelText.setText (
				"comingSoon" in turret ?
					localize("coming_soon") :
					turret.requirementsDesc
			)
		}

		// If turret is locked.
		else if (!turret.requirementsMet)
		{
			// Show run info & hide locked label.
			this.buttonGroup.show()
			this.buyWeaponGroup.show()
			this.turretLockedLabel.hide()
			this.trialGroup.hide()
			this.divider.hide()
			this.endlessModeGroup.hide()

			// Populate costs
			this.buyWeaponCost.setText(`${turret.cost} §`)
			this.buyWeaponCurrentCoins.setText(`${localize("current_funds")} ${save.coins} §`)
			this.buyWeaponButton.setTurret(turret)
		}

		// If turret is unlocked.
		else
		{
			// Show run info & hide locked label.
			this.buttonGroup.show()
			this.trialGroup.show()
			this.divider.show()
			this.endlessModeGroup.show()
			this.buyWeaponGroup.hide()
			this.turretLockedLabel.hide()

			// Create save entry if it doesn't exist.
			let turretName = turret.weapon.name
			if (!(turretName in save.turrets))
			{
				save.turrets[turretName] = {
					trialsRecord: { trial: 0, omen: 0 },
					endlessRecord: { score: 0, omen: 0 }
				}
				saveGame()
			}

			// Populate endless info.
			let rec = save.turrets[turretName]
			let endless = rec.endlessRecord
			let omenString = endless.score > 0 ? `(${endless.omen > 0 ? localize("omen_text", endless.omen) : localize("no_omen_text")})` : ""
			this.endlessModeRecordValue.setText(`${timeToString(endless.score / (1 + endless.omen * .2))} ${omenString}`)
			this.endlessModeButton.setTurret(turret)
			this.leaderBoardButton.setTurret(turret)

			// If there's an on-going trial.
			this.trialStartResume.setTurret(turret)
			if (turretName in save.gameStates)
			{
				let state = save.gameStates[turretName]
				this.trialAbandon.show()
				this.trialAbandon.setTurret(turret)
				this.trialStartResume.text.setText(localize("resume_run"))
				this.trialStartResume.setTopNext(this.trialAbandon)
				this.trialTitle.setText(localize("trial_mode_current"))

				// Set current gamestate description.
				switch(state.omenLevel)
				{
					case -2: this.trialValue.setText(`${localize('typist_mode')}, ${localize('trial_text', convertIfChinese(state.trialLevel))}`); break
					case -1: this.trialValue.setText(`${localize('relaxed_mode')}, ${localize('trial_text', convertIfChinese(state.trialLevel))}`); break
					case 0: this.trialValue.setText(localize("trial_text", convertIfChinese(state.trialLevel))); break
					default: this.trialValue.setText(`${localize("omen_text", romanize(state.omenLevel))}, ${localize('trial_text', convertIfChinese(state.trialLevel))}`); break
				}
			}
			else
			{
				this.trialAbandon.hide()
				this.trialStartResume.text.setText(localize("start_trial"))
				this.trialStartResume.setTopNext(null)
				this.trialTitle.setText(localize("trial_mode_record"))
				this.trialValue.setText(rec.trialsRecord && rec.trialsRecord.trial > 0 ?
					rec.trialsRecord.omen > 6 ?
						localize("all_trials_complete") :
						(rec.trialsRecord.omen > 0 ? localize("omen_text", romanize(rec.trialsRecord.omen)) + ", " : "") + localize("trial_text", convertIfChinese(rec.trialsRecord.trial)) :
					localize("none_text")
				)
			}
		}
	}
}

class TurretScreenButton extends Button
{
	constructor()
	{
		super()
			.setWidth("40%")
			.setHeight(scalePix(75))
			.setRenderMode(renderMode.colorRounded)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setPadding(Yoga.EDGE_ALL, "3%")
			.setTexture(paleYellow)
		
		this.text = new Text()
			.setFont(regularFontUI())
			.setColor(midGray)
			.setTextAlign(textAlign.center)
			.setChildOf(this)

		this.turret = null
		return this
	}

	focusStart()
	{
		if (!inConfirmPopUp) 
		{
			this.setTexture(secondColorDark)
			this.text.setColor(paleYellow)
		}
	}

	focusEnd()
	{
		this.setTexture(paleYellow)
		this.text.setColor(midGray)
	}

	setTurret(turret)
	{
		this.turret = turret
	}

	pressMouseLeftStart() { if (!inConfirmPopUp) this.activate() }
	pressButtonBottomStart() { if (!inConfirmPopUp) this.activate() }
	activate() {}
}

class BuyWeaponButton extends TurretScreenButton
{
	constructor()
	{
		super()
			.text.setText(localize("buy_weapon"))
	}

	activate()
	{
		if (save.coins >= this.turret.cost)
		{
			audioHandler.playAudioHookUI("main_menu_turret_click_ok")
			save.coins -= this.turret.cost
			save.mainWeaponsUnlocked = save.mainWeaponsUnlocked || {}
			save.mainWeaponsUnlocked[this.turret.weapon.name] = true
			saveGame()

			// Refresh UI and switch focus to start trial button.
			let currentTurretSelection = ui.main_menu.turrets.turrets.find(turret => turret.currentSelectedWeapon)
			ui.main_menu.turrets.refresh()
			currentTurretSelection.setCurrentSelected(true)
			this.focusEnd()
			ui.main_menu.turrets.turretDetails.trialStartResume.takeFocus()
		}
		else 
		{
			audioHandler.playAudioHookUI("main_menu_turret_click_error")
			factory.spawn(
				Damage,
				this.xOffset + this.getComputedLeft() + this.getComputedWidth() / 2,
				this.yOffset + this.getComputedTop(),
				localize("insufficient_funds"),
				false, true, true
			)
		}
	}

	render(surface, xOffset = 0, yOffset = 0)
	{
		this.xOffset = xOffset
		this.yOffset = yOffset
		super.render(surface, xOffset, yOffset)
	}
}

class LeaderboardButton extends TurretScreenButton
{
	constructor()
	{
		super()
			.setWidth("100%")
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(5))

		this.text
			.setText(localize("stats_text"))
	}

	activate()
	{
		audioHandler.playAudioHookUI("main_menu_turret_click_ok")
		this.focusEnd()
		ui.leaderBoard.startIntro(this.turret)
	}
}

class EndlessModeButton extends TurretScreenButton
{
	constructor()
	{
		super()
			.setWidth("100%")
			.text.setText(localize("start_endless"))
	}

	activate()
	{
		audioHandler.playAudioHookUI("main_menu_turret_click_ok")
		ui.omenSelect.setTurret(this.turret, false)
		ui.omenSelect.lastFocus = this
		this.focusEnd()
		let animPromise = ui.omenSelect.startIntro()
		if (usingController || keyboardArrows)
			animPromise.then(() => ui.omenSelect.panel.confirmButton.takeFocus())
	}
}

class StartResumeButton extends TurretScreenButton
{
	constructor()
	{
		super()
			.setWidth("100%")
			.text.setText(localize("start_trial"))
	}

	activate()
	{
		audioHandler.playAudioHookUI("main_menu_turret_click_ok")
		
		// If resuming existing game
		if (this.turret.weapon.name in save.gameStates)
		{
			if (steamEnabled)
				ISteamFriends.SetRichPresence("ClassName", this.turret.weapon.name)
			this.focusEnd()
			ui.main_menu.turrets.startExtro()
			ui.main_menu.left.startExtro()
				.then(() => {
					ui.main_menu.hide()
					missionMode = true
					selectedTurret = this.turret.weapon
					startGame(0, save.gameStates[this.turret.weapon.name])
				})
		}

		// If starting new game.
		else
		{
			ui.omenSelect.setTurret(this.turret, true)
			ui.omenSelect.lastFocus = this
			this.focusEnd()
			let animPromise = ui.omenSelect.startIntro()
			if (usingController || keyboardArrows)
				animPromise.then(() => ui.omenSelect.panel.confirmButton.takeFocus())
		}
	}
}

class AbandonButton extends TurretScreenButton
{
	constructor()
	{
		super()
			.setWidth("100%")
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(5))
			.text.setText(localize("abandon_run"))
	}

	activate()
	{
		ui.confirmPopUp.lastFocus = this
		this.focusEnd()
		ui.confirmPopUp.trigger("abandon_run_confirm", () => {

			// Create save for turret if it doesn't already exist.
			let turretName = this.turret.weapon.name
			if (!(turretName in save.turrets))
			{
				save.turrets[turretName] = {
					trialsRecord: { trial: 0, omen: 0 },
					endlessRecord: { score: 0, omen: 0 }
				}
			}

			// Save record if it's better than current on file.
			let rec = save.turrets[turretName]
			let omenLevel = save.gameStates[turretName].omenLevel
			let missionTier = save.gameStates[turretName].trialLevel
			if ((rec.trialsRecord && (omenLevel * 10 + missionTier > rec.trialsRecord.omen * 10 + rec.trialsRecord.trial)) || !rec.trialsRecord)
				save.turrets[turretName].trialsRecord = {
					omen: omenLevel,
					trial: missionTier
				}

			// Delete current game state.
			delete save.gameStates[turretName]

			// Refresh main menu.
			ui.main_menu.turrets.turretDetails.setTurret(this.turret)

			// Save game.
			saveGame()
		})
	}

	focusStart()
	{
		if (this.hidden)
			ui.main_menu.turrets.turretDetails.trialStartResume.takeFocus()
		else super.focusStart()
	}
}

class TurretSelection extends Button
{
	constructor(turret, turretContext, navMenu)
	{
		super()
			.setWidth("100%")
			.setHeight("12%")
			.setRenderMode(renderMode.color)
			.setTexture(null)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		this.titleGroup = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(isUIEastAsian ? Yoga.ALIGN_CENTER : Yoga.ALIGN_FLEX_START)
			.setWidth("80%")
			.setHeight(titleFontUI().height)
			.setChildOf(this)
		
		this.icon = new Text()
			.setFont(titleIcons)
			.setText(turret.icon)
			.setWidth(titleIcons.widthOf(turret.icon) + scalePix(10))
			.setColor(secondColorDark)
			.setMargin(Yoga.EDGE_TOP, "1.5%")
			.setChildOf(this.titleGroup)

		this.title = new Text()
			.setEastAsian(isUIEastAsian)
			.setFont(isUIEastAsian ? titleEastAsianSmall : titleFontUI())
			.setText(turret.name)
			.setWidth("80%")
			.setColor(midGray)
			.setChildOf(this.titleGroup)
		
		this.turret = turret
		this.navMenu = navMenu
		this.turretContext = turretContext
		this.currentSelectedWeapon = false
	}

	focusStart()
	{
		this.focus = true
		if (!inConfirmPopUp)
		{
			audioHandler.playAudioHookUI("main_menu_navigation_hover")
			this.setTexture(secondColorDark)
			this.icon.setColor(paleYellow)
			this.title.setColor(paleYellow)
		}
	}

	focusEnd()
	{
		this.focus = false
		if (this.currentSelectedWeapon)
			this.setTexture(midGray)
		else
		{
			this.setTexture(null)
			this.icon.setColor(secondColorDark)
			this.title.setColor(midGray)
		}
	}

	setCurrentSelected(currentSelected = true)
	{
		if (currentSelected)
		{
			// Deselect last weapon (if any)
			let lastSelected = this.turretContext.turrets.find(turret => turret.currentSelectedWeapon)
			if (lastSelected) lastSelected.setCurrentSelected(false)

			// Select this weapon.
			this.currentSelectedWeapon = currentSelected

			// Set turret details context.
			this.turretContext.turretDetails.setTurret(this.turret)

			// Set navigation from main menu buttons.
			this.navMenu.main_menu_buttons[0].setRightNext(this)

			// Set navigation to first button in turret details.
			let rightNext = this.turretContext.turretDetails.buttonGroup.hidden ?
				null :
				!this.turretContext.turretDetails.buyWeaponGroup.hidden ?
					this.turretContext.turretDetails.buyWeaponButton :
					this.turretContext.turretDetails.trialAbandon.hidden ?
						this.turretContext.turretDetails.trialStartResume :
						this.turretContext.turretDetails.trialAbandon
			for (const button of this.turretContext.turrets)
				button.setRightNext(rightNext)

			// Set navigation back from turret details.
			this.turretContext.turretDetails.trialStartResume.setLeftNext(this)
			this.turretContext.turretDetails.trialAbandon.setLeftNext(this)
			this.turretContext.turretDetails.endlessModeButton.setLeftNext(this)
			this.turretContext.turretDetails.buyWeaponButton.setLeftNext(this)
			this.turretContext.turretDetails.leaderBoardButton.setLeftNext(this)

			// Set button visuals.
			if (!this.focus)
			{
				this.setTexture(midGray)
				this.icon.setColor(paleYellow)
				this.title.setColor(paleYellow)
			}
		}
		else if (!this.focus)
		{
			this.currentSelectedWeapon = currentSelected
			this.focusEnd()
		}
	}

	render(surface, xOffset = 0, yOffset = 0)
	{
		super.render(surface, xOffset, yOffset)
		if (this.currentSelectedWeapon)
		{
			let right = xOffset + this.getComputedLeft() + this.getComputedWidth()
			let top = yOffset + this.getComputedTop()
			PrimNative.drawFilledTriangle(Surface.Screen, right, top, right + 50, top + this.getComputedHeight() / 2, right, top + this.getComputedHeight(), this.focus ? secondColorDark : midGray)
		}
	}

	pressMouseLeftStart() { this.interact() }
	pressButtonBottomStart() { this.interact() }
	interact()
	{
		if (!inConfirmPopUp)
		{
			audioHandler.playAudioHookUI("main_menu_navigation_click")
			this.defaultFocus = true
			ui.main_menu.left.main_menu_buttons[0].defaultFocus = false
			this.setCurrentSelected()
		}
	}
}

export class MainMenuTurrets extends Node
{
	constructor(navigationMenu)
	{
		super()
			.setWidth("100%")
			.setHeight("100%")
			.setPadding(Yoga.EDGE_LEFT, scalePix(80))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW_REVERSE)
			.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
			.setAlignItems(Yoga.ALIGN_CENTER)

		this.turretDetails = new TurretDetails()
			.setChildOf(this)
		
		this.navBar = new Node()
			.setWidth("38%")
			.setHeight("70%")
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray.fadeTo(.3))
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this)
		
		this.navBarHeader = new Text()
			.setFont(regularFontUI())
			.setText(localize("select_main_weapon"))
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(20))
			.setColor(midGray)
			.setWidth("80%")
			.setChildOf(this.navBar)
		
		this.turrets = []
		Turrets().forEach((v, i) => {
			this.turrets.push(new TurretSelection(v, this, navigationMenu))
			this.turrets[i]
				.setTopNext(i > 0 ? this.turrets[i - 1].setBottomNext(this.turrets[i]) : null)
				.setLeftNext(navigationMenu.main_menu_buttons[0])
				.setChildOf(this.navBar)
		})
		this.turrets[0].setCurrentSelected()
	}

	refresh() {
		Turrets().forEach((v, i) => this.turrets[i].turret = v)
		this.turrets[0].setCurrentSelected()
	}

	startExtro()
	{
		ui.main_menu.left.currentContext = null
		this.hide()
	}
}
