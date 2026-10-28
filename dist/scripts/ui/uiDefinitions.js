import { Yoga, Text } from 'sphere-runtime'
import { TitleScreen } from './titleScreen.js'
import { OmenSelect } from './omenSelect.js'
import { UpgradeScreen } from './upgradeScreen.js'
import { LootScreen } from './lootScreen.js'
import { SummaryScreen } from './summaryScreen.js'
import { PauseMenu } from './pauseMenu.js'
import { ConfirmPopUp } from './confirmPopup.js'
import { WeaponDetail } from './weaponDetails.js'
import { LevelUpPrompt } from './levelUpPrompt.js'
import { EvolutionComplete } from './evolutionComplete.js'
import { ButtonHints } from './buttonHints.js'
import { SteamRequests } from './steamRequests.js'
import { AnnouncerNode } from './announcerNode.js'
import { StatsScreen } from './statsScreen.js'
import { MainMenu } from './mainMenu.js'
import { Hud } from './hud.js'
import { LanguageSelect } from './languageSelect.js'

export const UIDef = {

	initAll: function(base)
	{
		// DEMO DISCLAIMER
		let disclaimer = localize("demo_disclaimer")
		base.demo_disclaimer = new Text()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setFont(regularFontUI())
			.setWidth(regularFontUI().widthOf(disclaimer))
			.setColor(midGray.fadeTo(.7))
			.setPosition(Yoga.EDGE_LEFT, Surface.Screen.width - regularFontUI().widthOf(disclaimer) - 10)
			.setPosition(Yoga.EDGE_TOP, Surface.Screen.height - regularFontUI().height - 10)
			.setText(disclaimer)
			.setChildOf(base.mainMenuNode)

		// =========
		// MAIN MENU
		// =========

		base.title_screen = new TitleScreen()
			.setChildOf(base.mainMenuNode)

		base.main_menu = new MainMenu()
			.setChildOf(base.mainMenuNode)
			.hide()

		base.confirmPopUp = new ConfirmPopUp()
			.setChildOf(base.mainMenuNode)
			.hide()

		base.languageSelect = new LanguageSelect()
			.setChildOf(base.mainMenuNode)
			.hide()

		base.omenSelect = new OmenSelect()
			.setChildOf(base.mainMenuNode)
			.hide()

		// ===========
		// IN-GAME HUD
		// ===========
		
		base.hud = new Hud()
			.setChildOf(base.hudNode)
			.hide()

		// ===========
		// LEADERBOARD
		// ===========

		base.leaderBoard = new StatsScreen()
			.setChildOf(base.node)
			.hide()

		// ===============
		// LEVEL UP PROMPT
		// ===============

		base.levelUpPrompt = new LevelUpPrompt()
			.setChildOf(base.node)
			.hide()

		// ==============
		// UGPRADE SCREEN
		// ==============

		base.upgradeScreen = new UpgradeScreen()
			.setChildOf(base.node)
			.hide()
		
		// =======
		// LOOT UI
		// =======

		base.lootScreen = new LootScreen()
			.setChildOf(base.node)
			.hide()
		
		// =================
		// RESEARCH COMPLETE
		// =================

		base.evolutionComplete = new EvolutionComplete()
			.setChildOf(base.node)
			.hide()

		// =========
		// ANNOUNCER
		// =========

		base.announcerNode = new AnnouncerNode()
			.setChildOf(base.node)
			.hide()
		
		// ==============
		// SUMMARY SCREEN
		// ==============

		base.summaryScreen = new SummaryScreen()
			.setChildOf(base.node)
			.hide()

		// ==========
		// PAUSE MENU
		// ==========

		base.pauseMenu = new PauseMenu()
			.setChildOf(base.node)
			.hide()

		// ============
		// BUTTON HINTS
		// ============

		base.buttonHints = new ButtonHints()
			.setChildOf(base.node)
		
		// =============
		// WEAPON DETAIL
		// =============

		base.weaponDetail = new WeaponDetail()
			.setChildOf(base.node)
			.hide()

		// =============
		// STEAM REQUESTS
		// =============

		base.steamRequests = new SteamRequests()
			.setChildOf(base.mainMenuNode)
			.hide()
	}
}