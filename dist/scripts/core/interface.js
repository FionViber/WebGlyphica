import { Task, Yoga, Tween, Easing } from 'sphere-runtime'
import { LootItems } from '../data/lootItems.js'
import { saveGame } from './loader.js'
import { DefineShapes } from './shapes.js'
import { EffectsSurface } from '../effects/effectsSurface.js'

// Import UI definitions.
import { UIDef } from '../ui/uiDefinitions.js'

(function()
{
	// Define font loading function.
	global.loadFonts = async function()
	{
		// Check if on Steam Deck.
		let steamDeck = steamEnabled && ISteamUtils.IsSteamRunningOnSteamDeck()

		// Load icon fonts.
		global.pickupIcons = await Font.fromFile('@/fonts/Pickup-Icons-Glyphica.ttf', scalePix(30), {antialias: true})
		global.pickupIconsLarge = await Font.fromFile('@/fonts/Pickup-Icons-Glyphica.ttf', scalePix(50), {antialias: true})
		global.interfaceIconsSmall = await Font.fromFile('@/fonts/Interface-Icons.ttf', scalePix(15), {antialias: true})
		global.interfaceIcons = await Font.fromFile('@/fonts/Interface-Icons.ttf', scalePix(30), {antialias: true})
		global.interfaceIconsMedium = await Font.fromFile('@/fonts/Interface-Icons.ttf', scalePix(70), {antialias: true})
		global.interfaceIconsLarge = await Font.fromFile('@/fonts/Interface-Icons.ttf', scalePix(120), {antialias: true})
		global.interfaceIconsLarger = await Font.fromFile('@/fonts/Interface-Icons.ttf', scalePix(200), {antialias: true})
		global.interfaceIconsExtraLarge = await Font.fromFile('@/fonts/Interface-Icons.ttf', scalePix(500), {antialias: true})
		global.quicktimeFontSmall = await Font.fromFile('@/fonts/SourceCodeProGlyphica.ttf', scalePix(35), {antialias: true})
		global.quicktimeFont = await Font.fromFile('@/fonts/SourceCodeProGlyphica.ttf', scalePix(55), {antialias: true})
		global.quicktimeFontLarge = await Font.fromFile('@/fonts/SourceCodeProGlyphica.ttf', scalePix(65), {antialias: true})
		global.titleIcons = await Font.fromFile('@/fonts/Title-Icons-Glyphica.ttf', scalePix(55), {antialias: true})
		global.titleIconsLarge = await Font.fromFile('@/fonts/Title-Icons-Glyphica.ttf', scalePix(65), {antialias: true})
		global.titleIconsExtraLarge = await Font.fromFile('@/fonts/Title-Icons-Glyphica.ttf', scalePix(250), {antialias: true})
		global.lootIcons = await Font.fromFile('@/fonts/Loot-Icons-Glyphica.ttf', scalePix(100), {antialias: true})
		global.evolutionIcons = await Font.fromFile('@/fonts/Evolution-Icons-Glyphica.ttf', scalePix(200), {antialias: true})

		// Non-localized fonts.
		global.timerFont = await Font.fromFile('@/fonts/Monospaced-Numbers.ttf', scalePix(65), {antialias: true, kerning: false})
		global.critFont = await Font.fromFile('@/fonts/Montserrat-SemiBold.ttf', scalePix(50), {antialias: true})
		global.typingFontLarge = await Font.fromFile('@/fonts/Montserrat-Regular.ttf', scalePix(35), {antialias: true})
		global.regularEastAsianLarge = await Font.fromFile('@/fonts/SourceHanSansSC-Normal.ttf', scalePix(40), {antialias: true})

		// Localized fonts.
		// English
		global.typingFont = await Font.fromFile('@/fonts/Montserrat-Regular.ttf', scalePix(30), {antialias: true})
		global.typingFontMedium = await Font.fromFile('@/fonts/Montserrat-Regular.ttf', scalePix(27), {antialias: true})
		global.typingFontSmall = await Font.fromFile('@/fonts/Montserrat-SemiBold.ttf', scalePix(steamDeck ? 27 : 20), {antialias: true})
		global.grandRegular = await Font.fromFile('@/fonts/NTF-Grand-Regular.ttf', scalePix(65), {antialias: true, kerning: false})
		global.grandRegularSmall = await Font.fromFile('@/fonts/NTF-Grand-Regular.ttf', scalePix(45), {antialias: true, kerning: false})

		// East Asian
		global.regularEastAsian = await Font.fromFile('@/fonts/SourceHanSansSC-Normal.ttf', scalePix(35), {antialias: true})
		global.regularEastAsianMedium = await Font.fromFile('@/fonts/SourceHanSansSC-Normal.ttf', scalePix(30), {antialias: true})
		global.regularEastAsianSmall = await Font.fromFile('@/fonts/SourceHanSansSC-Bold.ttf', scalePix(25), {antialias: true})
		global.titleEastAsian = await Font.fromFile('@/fonts/SourceHanSansSC-Bold.ttf', scalePix(60), {antialias: true})
		global.titleEastAsianSmall = await Font.fromFile('@/fonts/SourceHanSansSC-Bold.ttf', scalePix(40), {antialias: true})
	}
})()

export class Interface extends Task {
	constructor()
	{
		// Superclass constructor.
		super({priority: 100})

		// Create base Yoga-layout instance.
		this.node = null
		this.hudNode = null
		this.nodeActive = null
		this.hudNodeActive = null
		this.inGameWordOpacity = 1

		// Refresh sprites based on current theme.
		this.refreshUI()

		this.inGameWordOpacityTween = new Tween(this, Easing.Linear)

		// Backdrop renderer.
		this.backdropRenderer = new (class extends Task {
			constructor(parent) { super(); this.parent = parent }
			on_render() { this.parent.bgSprite.draw(Surface.Screen) }
		}) (this)
		this.backdropRenderer.start()

		// HUD state tracking.
		this.queuedHudAnims = []
		this.hudState = 0
		this.hudTopVisible = false
		this.hudBottomVisible = false
		this.hintsVisible = false

		// Steam specific stuff.
		if (steamEnabled)
		{
			// Register listener for Steam Overlay.
			callback.addListener("GameOverlayActivated", this.steamOverlay)

			// Show announcement on Steam Community if it's newer than last announcement read.
			if (!("firstLevelUpDone" in save))
			{
				// Skip announcement on first run cause bad UX.
				save.lastAnnouncementRead = latestAnnouncement
				saveGame()
			}
			else if (!("lastAnnouncementRead" in save) || save.lastAnnouncementRead < latestAnnouncement)
			{
				save.lastAnnouncementRead = latestAnnouncement
				ISteamFriends.ActivateGameOverlayToWebPage(
					latestAnnouncementLink,
					EActivateGameOverlayToWebPageMode.k_EActivateGameOverlayToWebPageMode_Modal
				)
				saveGame()
			}
		}

		// Start event loop.
		this.start()
	}

	updateNode(node) {
		for (let i = 0; i < node.getChildCount(); i++) {
			let child = node.getChild(i)
			if (!child.hidden)
			{
				child.update()
				child.updateChildren()
				// If any nodes are dirtied, re-calculate layout.
				if (child.checkIfDirtied())
				{
					this.calculateLayout(node)
					break
				}
			}
		}
	}

	on_update() {
		if (this.hudNodeActive)
			this.updateNode(this.hudNodeActive)
		if (this.mainMenuNodeActive)
			this.updateNode(this.mainMenuNodeActive)
		if (this.nodeActive)
			this.updateNode(this.nodeActive)

		Mouse.Default.clearQueue()
	}

	refreshUI(fastForwardToOptionsCategory = null)
	{
		// Refresh theme.
		this.refreshTheme()

		const createBaseNode = function()
		{
			let node = Yoga.Node.create()
			node.setWidth("100%")
			node.setHeight("100%")
			return node
		}
		// Init all UI definitions.
		this.node = createBaseNode()
		this.hudNode = createBaseNode()
		this.mainMenuNode = createBaseNode()
		UIDef.initAll(this)

		// If fast forward to options category requested.
		if (fastForwardToOptionsCategory != null)
		{
			this.title_screen.hide()
			this.showMainMenu(true)
			this.main_menu.left.changeContext(this.main_menu.left.main_menu_buttons[0])
			this.main_menu.left.changeContext(this.main_menu.left.main_menu_buttons[2])
			this.main_menu.options.currentCategory = fastForwardToOptionsCategory
			this.main_menu.options.refresh()
			this.main_menu.left.main_menu_buttons[2].focusEnd()
		}

		// If not demo, hide demo disclaimer.
		if (!demo) this.demo_disclaimer.hide()

		// Calculate new layout.
		let calcLayout = function(node)
		{
			return new Promise(resolve => {
				node.calculateLayout(Surface.Screen.width, Surface.Screen.height, Yoga.DIRECTION_LTR)
				Sphere.sleep(1).then(() => {
					let dirtied = false
					for (let i = 0; i < node.getChildCount(); i++)
					{
						let child = node.getChild(i)
						child.update()
						child.render(Surface.Screen)
						child.updateChildren()
						if (child.checkIfDirtied())
							dirtied = true
					}
					if (dirtied)
						calcLayout(node).then(() => resolve())
					else resolve()
				})
			})
		}

		// Once layout is finalized, swap active layout for new one.
		return Promise.all([
			calcLayout(this.node).then(() => {
				this.nodeActive = this.node
			}),
			calcLayout(this.hudNode).then(() => {
				this.hudNodeActive = this.hudNode
			}),
			calcLayout(this.mainMenuNode).then(() => {
				this.mainMenuNodeActive = this.mainMenuNode
			})
		])
	}

	refreshTheme()
	{
		this.lightBG = new Shape(ShapeType.Fan, getSprite('bg_01'), new VertexList(
			[
				{x: 0, y: 0, u: 1, v: 1},
				{x: Surface.Screen.width, y: 0, u: 0, v: 1},
				{x: Surface.Screen.width, y: Surface.Screen.height, u: 0, v: 0},
				{x: 0, y: Surface.Screen.height, u: 1, v: 0}
			]
		))
		this.darkBG = new Shape(ShapeType.Fan, getSprite('bg_02'), new VertexList(
			[
				{x: 0, y: 0, u: 1, v: 1},
				{x: Surface.Screen.width, y: 0, u: 0, v: 1},
				{x: Surface.Screen.width, y: Surface.Screen.height, u: 0, v: 0},
				{x: 0, y: Surface.Screen.height, u: 1, v: 0}
			]
		))
		let midGrayValue = darkMode ? .55 + (contrast * .3) : .45 - (contrast * .3)
		let darkGrayValue = darkMode ? .7 + (contrast * .3) : .3 - (contrast * .3)
		let darkestGrayValue = darkMode ? .8 + (contrast * .2) : .25 - (contrast * .25)
		global.paleYellow = darkMode ? new Color(.15, .15, .15) : new Color(.94, .94, 0.9)
		global.midGray = new Color(midGrayValue, midGrayValue, midGrayValue)
		global.darkGray = new Color(darkGrayValue, darkGrayValue, darkGrayValue)
		global.darkestGray = new Color(darkestGrayValue, darkestGrayValue, darkestGrayValue)
		global.bgColor = darkMode ? new Color(.94, .94, .9).fadeTo(.3) : Color.Black.fadeTo(.7)
		global.bgColorOpaque = darkMode ? new Color(.94, .94, .9) : Color.Black
		global.absoluteMidGray = darkMode ? new Color(.55, .55, .55) : new Color(.45, .45, .45)
		this.bgSprite = darkMode ? this.darkBG : this.lightBG
		this.refreshSecondColors()
		DefineShapes()
	}

	updateButtonLabels()
	{
		if (!ui.weaponDetail.hidden)
		{
			ui.weaponDetail.refreshInstructions()
			ui.weaponDetail.modifiersPaginator.refresh()
			ui.weaponDetail.sectionSelectLeft.refresh()
			ui.weaponDetail.sectionSelectRight.refresh()
			ui.weaponDetail.bottomPaginatorLeftArrow.refresh()
			ui.weaponDetail.bottomPaginatorRightArrow.refresh()
		}
		if (!ui.omenSelect.hidden)
		{
			ui.omenSelect.panel.refresh()
			ui.omenSelect.augmentSelectPanel.refresh()
		}
		if (!ui.main_menu.augments.hidden)
			ui.main_menu.augments.refresh()
	}

	steamOverlay(data)
	{
		if (data.m_bActive > 0
			&& currentScreen == game
			&& !isPaused()
		)
			ui.pauseMenu.startIntro()
	}

	refreshSecondColors()
	{
		global.secondColor = monochromeMode ? midGray : darkMode ? new Color(0.60, 0.48, 0.13) : new Color(0.62, 0.36, 0.38)
		global.secondColorDark = monochromeMode ? darkGray : darkMode ? new Color(0.75, 0.60, 0.23) : new Color(0.53, 0.27, 0.27)
	}

	disableAllTurretButtons(disable = true)
	{
		for (const button of this.main_menu.turrets.turrets)
			button.disabled = disable
	}

	disableAllMainMenuButtons(disable = true)
	{
		for (const button of this.main_menu.left.main_menu_buttons)
			button.disabled = disable
	}

	renderNode(node)
	{
		for (let i = 0; i < node.getChildCount(); i++)
			node.getChild(i).render(Surface.Screen)
	}

	on_render()
	{
		// Draw yoga-layout nodes.
		if (this.hudNodeActive)
			this.renderNode(this.hudNodeActive)
		if (this.mainMenuNodeActive)
			this.renderNode(this.mainMenuNodeActive)
		if (this.nodeActive)
			this.renderNode(this.nodeActive)
	}

	calculateNodeLayout(node)
	{
		node.calculateLayout(Surface.Screen.width, Surface.Screen.height, Yoga.DIRECTION_LTR)
	}

	calculateLayout()
	{
		this.calculateNodeLayout(this.hudNode)
		this.calculateNodeLayout(this.mainMenuNode)
		this.calculateNodeLayout(this.node)
	}

	getUIDefinitions()
	{
		return UIDef
	}

	showMainMenu(skipIntro = false)
	{
		this.main_menu.show()
		if (skipIntro)
		{
			this.main_menu.left.skipIntro()
			this.main_menu.logo.skipIntro()
		}
		else
		{
			currentFocus = null
			this.main_menu.left.startIntro()
			this.main_menu.logo.startIntro()
		}
	}

	generateLoot(bossLoot)
	{
		let allLoot = LootItems().filter(loot => loot.requirementsMet)
		let inventory = []
		for (let i = 0; i < 3 + ("item_plunder" in serializedLoot); i++)
		{
			// If no more loot left, stop generating.
			if (allLoot.length <= 0) break

			// If less than 3 valid loot available, trigger low-loot mode.
			if (allLoot.length <= 3)
			{
				console.log("Low on loot, enabling low-loot mode.")
				outOfLoot = true
			}

			// Get all loot of a rarity.
			let attempts = 0
			let lootOfRarity
			do {
				let lootRarity = bossLoot ? rarity.rare : weightedRandom(lootWeight, 1)[0].rarity
				lootOfRarity = allLoot.filter(loot => {
					return loot.rarity == lootRarity
						&& !(loot.group && inventory.some(item => item.group && item.group == loot.group))
				})
				attempts++
			}
			while (lootOfRarity.length == 0 && attempts < 1000)

			if (lootOfRarity.length > 0)
			{
				// Get random loot of rarity.
				let randomLoot = weightedRandom(lootOfRarity, 1)[0]
				inventory.push(randomLoot)

				// Remove loot from allLoot.
				allLoot[allLoot.indexOf(randomLoot)] = allLoot[allLoot.length - 1]
				allLoot.pop()
			}
			else break
		}
		return inventory
	}

	showLootUI(bossLoot = false)
	{
		// Pick eligible loot using weighted random.
		let inventory = this.generateLoot(bossLoot)
		if (inventory.length === 0)
			console.error("Warning: Trying to show empty loot")

		else
		{
			// Pause game and clear keylogs.
			pause("loot")
			inUpgradeMenu = true
			Keylog = "**********"
			Joylog.fill(null)
			wordsInUse.forEach(v => v[2].updateWordDisplay(2, true))

			// Populate loot options.
			this.lootScreen.lootOptions.forEach((v, i) => {
				if (inventory.length <= i)
					v.hide()
				else
					v.setUpgrade(inventory[i])
			})

			// Update Loot Title.
			this.lootScreen.title.setText(localize("loot_pickup"))

			// Show Loot UI.
			this.lootScreen.startIntro(inventory.length, bossLoot)
		}
	}

	setHUDState(state)
	{
		if (this.hudState != state)
		{
			let promises = []
			this.hudState = state
			switch(state)
			{
				// No HUD.
				case "none":
					if (this.hudTopVisible)
					{
						this.hudTopVisible = false
						promises.push(this.hud.top.startExtro())
					}
					if (this.hudBottomVisible)
					{
						this.hudBottomVisible = false
						promises.push(this.hud.bottom.startExtro())
					}
					if (this.hintsVisible)
					{
						this.hintsVisible = false
						promises.push(this.buttonHints.startExtro())
					}
					break

				// Normal in-game HUD.
				case "game":
					if (!this.hudTopVisible)
					{
						this.hudTopVisible = true
						promises.push(this.hud.top.startIntro())
					}
					if (!this.hudBottomVisible && this.hintsVisible)
					{
						this.hintsVisible = false
						promises.push(new Promise(resolve => {
							this.buttonHints.startExtro()
								.then(() => {
									this.hudBottomVisible = true
									this.hud.bottom.startIntro()
										.then(() => resolve())
								})
						}))
					}
					else if (!this.hudBottomVisible)
					{
						this.hudBottomVisible = true
						promises.push(this.hud.bottom.startIntro())
					}
					else if (this.hintsVisible)
					{
						this.hintsVisible = false
						promises.push(this.buttonHints.startExtro())
					}
					break
				
				// In-game menu HUD.
				case "menu":
				case "end":
					// Top.
					if (state == "menu" && !this.hudTopVisible)
					{
						this.hudTopVisible = true
						promises.push(this.hud.top.startIntro())
					}
					else if (state == "end" && this.hudTopVisible)
					{
						this.hudTopVisible = false
						promises.push(this.hud.top.startExtro())
					}

					// Bottom.
					if (this.hudBottomVisible && !this.hintsVisible)
					{
						this.hudBottomVisible = false
						promises.push(new Promise(resolve => {
							this.hud.bottom.startExtro()
								.then(() => {
									this.hintsVisible = true
									this.buttonHints.startIntro()
										.then(() => resolve())
								})
						}))
					}
					else if (!this.hintsVisible)
					{
						this.hintsVisible = true
						promises.push(this.buttonHints.startIntro())
					}
					else if (this.hudBottomVisible)
					{
						this.hudBottomVisible = false
						promises.push(this.hud.bottom.startExtro())
					}
					break
			}
			return Promise.all(promises)
		}
		else 
		{
			if (state == "menu" || state == "end")
				this.buttonHints.refresh()
			return Promise.resolve()
		}
	}
}
