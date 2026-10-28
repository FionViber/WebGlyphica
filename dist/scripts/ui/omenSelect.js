import { Node, Text, Yoga, Tween, Easing } from 'sphere-runtime'
import { Button } from '../core/button.js'
import { AugmentSelectPanel, ActiveAugments } from './omenSelectAugments.js'
import { PageChangeButton } from './pageChangeButton.js'
import { PageCounter } from './pageCounter.js'

export class OmenSelect extends Node
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

		this.tween = new Tween(this, Easing.Linear)
		this.confirmAction = null
		this.lastFocus = null
		this.opacity = 0
		
		this.panel = new OmenSelectPanel(this)
			.setChildOf(this)
		
		this.augmentSelectPanel = new AugmentSelectPanel(this)
			.setChildOf(this)
			.hide()
		
		return this
	}

	startIntro()
	{
		inConfirmPopUp = true
		ui.disableAllTurretButtons()
		ui.disableAllMainMenuButtons()
		audioHandler.playAudioHookUI("main_menu_omen_select_intro")
		this.setAnimating(true)
		control.suspend(true)
		this.panel.animYOffset = this.getComputedHeight() - this.panel.getComputedTop()
		this.show()

		let promise = Promise.all([
			this.tween.easeIn({opacity: 1}, 40),
			new Promise(resolve => {
				Sphere.sleep(20).then(() => {
					this.panel.startIntro()
						.then(() => resolve())
				})
			})
		])

		promise.then(() => {
			this.setAnimating(false)
			control.suspend(false)
		})

		return promise
	}

	startExtro(returnToMainMenu = true)
	{
		this.setAnimating(true)
		control.suspend(true)
		audioHandler.playAudioHookUI("main_menu_omen_select_extro")
		return Promise.all([
			this.panel.startExtro(),
			new Promise(resolve => {
				Sphere.sleep(10).then(() => {
					this.tween.easeIn({opacity: 0}, 40)
						.then(() => {
							this.setAnimating(false)
							control.suspend(false)
							inConfirmPopUp = false
							if (usingController || keyboardArrows)
							{
								currentFocus.focusEnd()
								if (returnToMainMenu)
								{
									if (this.lastFocus) this.lastFocus.takeFocus()
									else ui.main_menu.left.main_menu_buttons[0].takeFocus()
								} 
								this.lastFocus = null
							}
							ui.disableAllTurretButtons(false)
							ui.disableAllMainMenuButtons(false)
							this.hide()
							resolve()
						})
				})
			})
		])
	}

	setTurret(turret, missionMode)
	{
		this.panel.setTurret(turret, missionMode)
	}

	update()
	{
		if (this.animating)
			this.setTexture(bgColor.fadeTo(this.opacity))
	}
}

class OmenSelectPanel extends Node
{
	constructor(parent)
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setWidth("100%")
			.setHeight("100%")
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)

		this.omenSelectBG = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(paleYellow)
            .setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
            .setAlignItems(Yoga.ALIGN_CENTER)
            .setPadding(Yoga.EDGE_ALL, "3%")
			.setWidth("50%")
			.setHeight("73%")
			.setChildOf(this)
        
        this.omenSelectTitle = new Text()
            .setWidth("100%")
            .setHeight(titleFontUI().height)
            .setFont(titleFontUI())
            .setTextAlign(textAlign.center)
            .setColor(midGray)
            .setMargin(Yoga.EDGE_BOTTOM, "5%")
            .setChildOf(this.omenSelectBG)
        
        this.omenSelect = new Node()
            .setWidth("100%")
            .setHeight("10%")
            .setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
            .setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
            .setAlignItems(Yoga.ALIGN_CENTER)
            .setChildOf(this.omenSelectBG)
		
		this.omenSelectLeft = new PageChangeButton(-1, this.validityCheck.bind(this), this.changeOmen.bind(this))
			.setWidth("10%")
			.setHeight("100%")
			.setChildOf(this.omenSelect)
        
        this.omenTitleBG = new Node()
            .setWidth("78%")
            .setHeight("100%")
            .setRenderMode(renderMode.colorRounded)
            .setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
            .setJustifyContent(Yoga.JUSTIFY_CENTER)
            .setTexture(midGray.fadeTo(.2))
            .setChildOf(this.omenSelect)
        
        this.omenTitleText = new Text()
            .setWidth("100%")
            .setHeight(regularFontUI().height)
            .setFont(regularFontUI())
            .setColor(darkGray)
            .setTextAlign(textAlign.center)
            .setChildOf(this.omenTitleBG)

		this.omenSelectRight = new PageChangeButton(1, this.validityCheck.bind(this), this.changeOmen.bind(this))
			.setWidth("10%")
			.setHeight("100%")
			.setChildOf(this.omenSelect)
		
		this.omenCounter = new PageCounter(true)
			.setWidth("100%")
			.setChildOf(this.omenSelectBG)
        
        this.omenSelectDesc = new Text()
            .setWidth("100%")
            .setMargin(Yoga.EDGE_TOP, "3%")
            .setMargin(Yoga.EDGE_BOTTOM, ".5%")
            .setFont(regularFontUI())
            .setColor(midGray)
            .setTextAlign(textAlign.center)
            .setText("-1 Weapon Slot")
            .setChildOf(this.omenSelectBG)
        
        this.omenSelectDesc2 = new Text()
            .setWidth("100%")
            .setHeight(smallFont().height)
            .setMargin(Yoga.EDGE_BOTTOM, "5%")
            .setFont(smallFont())
            .setColor(midGray.fadeTo(.5))
            .setTextAlign(textAlign.center)
            .setChildOf(this.omenSelectBG)
        
        this.augmentGroup = new Node()
            .setWidth("95%")
            .setRenderMode(renderMode.colorRounded)
			.setAlignItems(Yoga.ALIGN_CENTER)
            .setTexture(midGray.fadeTo(.2))
			.setPadding(Yoga.EDGE_TOP, "4%")
			.setPadding(Yoga.EDGE_BOTTOM, "6%")
            .setChildOf(this.omenSelectBG)

		this.activeAugmentsLabel = new Text()
			.setWidth("100%")
			.setFont(regularFontUI())
			.setColor(midGray)
			.setTextAlign(textAlign.center)
			.setText(localize("current_augments"))
			.setChildOf(this.augmentGroup)
		
		this.activeAugmentsGroup = new Node()
			.setWidth("90%")
			.setHeight(titleIconsLarge.height + scalePix(5))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setMargin(Yoga.EDGE_TOP, scalePix(15))
			.setChildOf(this.augmentGroup)

		this.activeAugmentsBG = new Node()
			.setWidth("60%")
			.setHeight("100%")
			.setRenderMode(renderMode.colorRounded)
			.setTexture(paleYellow)
			.setChildOf(this.activeAugmentsGroup)

		this.activeAugments = new ActiveAugments()
			.setWidth("100%")
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this.activeAugmentsBG)
		
		this.selectAugmentButton = new SelectAugmentButton(parent)
			.setChildOf(this.activeAugmentsGroup)
		
		this.confirmationContainer = new Node()
			.setWidth("100%")
			.setMargin(Yoga.EDGE_TOP, "8%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
            .setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.omenSelectBG)

		this.confirmButton = new ConfirmButton(parent)
			.setChildOf(this.confirmationContainer)
		
		this.cancelButton = new CancelButton(parent)
			.setChildOf(this.confirmationContainer)
		
		this.omenDescLocStrings = [
			null,
			"omen_level_1_desc",
			"omen_level_2_desc",
			"omen_level_3_desc",
			"omen_level_4_desc",
			"omen_level_5_desc",
			"omen_level_6_desc",
		]
		
		this.confirmButton.setRightNext(this.cancelButton)
		this.selectAugmentButton.setBottomNext(this.cancelButton)
		this.currentOmen = 0
		this.isMissionMode = true
        this.tween = new Tween(this, Easing.Exponential)
		return this
	}

	validityCheck(increment)
	{
		let nextOmen = this.currentOmen + increment
		return nextOmen >= -2 && nextOmen <= maxOmenLevel
	}

	changeOmen(increment)
	{
		if (this.validityCheck(increment)) this.currentOmen += increment
		this.refresh()
	}

	setTurret(turret, isMissionMode)
	{
		this.turret = turret
		this.isMissionMode = isMissionMode
		this.omenSelectTitle.setText(localize(isMissionMode ? "omen_select_title" : "omen_select_title_endless", turret.name))
		this.currentOmen = this.getHighestUnlockedOmen()
		this.refresh()
	}

	isOmenUnlocked()
	{
		return this.currentOmen <= this.getHighestUnlockedOmen()
	}

	getHighestUnlockedOmen()
	{
		let result = 0
		if (
			this.turret.weapon.name in save.turrets &&
			save.turrets[this.turret.weapon.name].trialsRecord != null &&
			save.turrets[this.turret.weapon.name].trialsRecord.omen
		)
			result = save.turrets[this.turret.weapon.name].trialsRecord.omen
		result = result > 6 ? 6 : result
		return result
	}

	getMaxActiveAugments()
	{
		return this.currentOmen < 0 ? 0 : 2 + Math.ceil(this.currentOmen / 2)
	}

	refresh()
	{
		// Omen title and desc.
		switch (this.currentOmen)
		{
			case -1:
				this.omenTitleText.setText(localize("relaxed_mode"))
				this.omenSelectDesc.setText(localize("relaxed_mode_desc"))
				this.omenSelectDesc2.setText(localize("no_achievements"))
				break
				
			case -2:
				this.omenTitleText.setText(localize("typist_mode"))
				this.omenSelectDesc.setText(localize("typist_mode_desc"))
				this.omenSelectDesc2.setText(localize("no_achievements"))
				break

			case 0:
				this.omenTitleText.setText(localize("no_omen_text"))
				this.omenSelectDesc.setText(localize("omen_level_0_desc"))
				this.omenSelectDesc2.setText("")
				break
			
			default:
				let isOmenUnlocked = this.isOmenUnlocked()
				this.omenTitleText.setText(localize("omen_text", romanize(this.currentOmen) + (isOmenUnlocked ? "" : localize("omen_locked_text"))))
				this.omenSelectDesc.setText(localize(this.omenDescLocStrings[this.currentOmen]))
				this.omenSelectDesc2.setText(
					isOmenUnlocked ? 
						(this.currentOmen > 0 ? `+${this.currentOmen * 30}% ${localize("coins_txt")}` : "") + (this.currentOmen > 1 ? ` · ${localize("all_previous_omens_apply")}` : "") :
						localize("omen_locked_desc")
				)
				break
		}

		// Refresh Omen Counter.
		this.omenCounter.refresh(this.currentOmen + 2, this.getHighestUnlockedOmen() + 3, maxOmenLevel + 3)

		// Refresh buttons.
		this.omenSelectLeft.refresh()
		this.omenSelectRight.refresh()
		this.confirmButton.refresh()

		// Refresh active augments.
		this.activeAugments.refresh(this.getMaxActiveAugments())
		this.selectAugmentButton.refresh()
	}

	startIntro()
	{
		this.setAnimating(true)
		return new Promise(resolve => {
			this.tween.easeOut({animYOffset: 0}, 20)
				.then(() => {
					this.setAnimating(false)
					resolve()
				})
		})
	}

	startExtro()
	{
		this.setAnimating(true)
		return new Promise(resolve => {
			this.tween.easeIn({animYOffset: -(this.getComputedTop() + this.getComputedHeight())}, 20)
				.then(() => {
					this.setAnimating(false)
					resolve()
				})
		})
	}
}

class ConfirmButton extends Button
{
	constructor(parent)
	{
		super()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setWidth("30%")
			.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(5))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setDefault()
			.setHeight(regularFontUI().height + scalePix(25))
		
		this.text = new Text()
			.setColor(paleYellow)
			.setFont(regularFontUI())
			.setText(localize("begin_text"))
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setChildOf(this)

		this.parent = parent
		return this
	}

	focusStart()
	{
		if(this.parent.panel.isOmenUnlocked())
		{
			audioHandler.playAudioHookUI("main_menu_confirmation_hover")
			this.setTexture(secondColorDark)
		}
	}

	focusEnd()
	{
		this.setTexture(this.parent.panel.isOmenUnlocked() ? midGray : midGray.fadeTo(.5))
	}

	refresh()
	{
		if (this.parent.panel.isOmenUnlocked())
		{
			this.setTexture(this.focus || currentFocus == this ? secondColorDark : midGray)
			this.parent.panel.cancelButton.setLeftNext(this)
		}
		else
		{
			this.parent.panel.cancelButton.setLeftNext(null)
			if (currentFocus == this)
				this.parent.panel.cancelButton.takeFocus()
			this.setTexture(midGray.fadeTo(.5))
		}
	}

	pressShoulderButtonLeftStart() { this.parent.panel.changeOmen(-1) }
	pressShoulderButtonRightStart() { this.parent.panel.changeOmen(1) }

	pressMouseLeftStart() { this.activate() }
	pressButtonBottomStart() { this.activate() }
	activate()
	{
		if(this.parent.panel.isOmenUnlocked())
		{
			audioHandler.playAudioHookUI("main_menu_confirmation_click")
			this.parent.startExtro(false)
				.then(() => {
					ui.main_menu.turrets.startExtro()
					ui.main_menu.left.startExtro()
						.then(() => {
							ui.main_menu.hide()
							missionMode = this.parent.panel.isMissionMode
							selectedTurret = this.parent.panel.turret.weapon
							if (steamEnabled)
								ISteamFriends.SetRichPresence("ClassName", this.parent.panel.turret.weapon.name)
							startGame(this.parent.panel.currentOmen)
						})
				})
		}
	}
}

class CancelButton extends Button
{
	constructor(parent)
	{
		super()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setWidth("30%")
			.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(5))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setDefault()
			.setHeight(regularFontUI().height + scalePix(25))
		
		this.text = new Text()
			.setColor(paleYellow)
			.setFont(regularFontUI())
			.setText(localize("back"))
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setChildOf(this)

		this.parent = parent
		return this
	}

	focusStart()
	{
		audioHandler.playAudioHookUI("main_menu_confirmation_hover")
		this.setTexture(secondColorDark)
	}

	focusEnd()
	{
		this.setTexture(midGray)
	}

	pressShoulderButtonLeftStart() { this.parent.panel.changeOmen(-1) }
	pressShoulderButtonRightStart() { this.parent.panel.changeOmen(1) }

	pressMouseLeftStart() { this.activate() }
	pressButtonBottomStart() { this.activate() }
	activate()
	{
		audioHandler.playAudioHookUI("main_menu_confirmation_click")
		this.parent.startExtro()
	}
}

class SelectAugmentButton extends Button
{
	constructor(parent)
	{
		super()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setWidth("39%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		this.text = new Text()
			.setColor(paleYellow)
			.setFont(regularFontUI())
			.setText(localize("select_augments"))
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setChildOf(this)

		this.parent = parent
		return this
	}

	focusStart()
	{
		if (this.isValid())
		{
			audioHandler.playAudioHookUI("main_menu_confirmation_hover")
			this.setTexture(secondColorDark)
		}
	}

	focusEnd()
	{
		this.setTexture(this.isValid() ? midGray : midGray.fadeTo(.5))
	}

	isValid()
	{
		return this.parent.panel.isOmenUnlocked() && this.parent.panel.getMaxActiveAugments() > 0
	}

	refresh()
	{
		if (this.isValid())
		{
			if (this.focus || currentFocus == this)
				this.setTexture(secondColorDark)
			else
				this.setTexture(midGray)
			this.parent.panel.cancelButton.setTopNext(this)
			this.parent.panel.confirmButton.setTopNext(this)
		}
		else
		{
			this.setTexture(midGray.fadeTo(.5))
			this.parent.panel.cancelButton.setTopNext(null)
			this.parent.panel.confirmButton.setTopNext(null)
			if (currentFocus == this)
				this.parent.panel.cancelButton.takeFocus()
		}
	}

	pressShoulderButtonLeftStart() { this.parent.panel.changeOmen(-1) }
	pressShoulderButtonRightStart() { this.parent.panel.changeOmen(1) }

	pressMouseLeftStart() { this.activate() }
	pressButtonBottomStart() { this.activate() }
	activate()
	{
		if (this.isValid())
		{
			currentFocus = null
			this.focusEnd()
			audioHandler.playAudioHookUI("main_menu_confirmation_click")
			this.parent.augmentSelectPanel.startIntro(this.parent.panel.getMaxActiveAugments())
		}
	}
}