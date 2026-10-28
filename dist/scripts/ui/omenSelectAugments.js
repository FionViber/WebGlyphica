import { Node, Text, Yoga, Tween, Easing } from 'sphere-runtime'
import { Button } from '../core/button.js'
import { augmentsList, augmentCategories } from '../data/augmentsList.js'
import { PageChangeButton } from './pageChangeButton.js'
import { PageCounter } from './pageCounter.js'

export class AugmentSelectPanel extends Node
{
	constructor(parent)
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setWidth("100%")
			.setHeight("100%")
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		this.augmentSelectBG = new Node()
			.setWidth("75%")
			.setHeight("93%")
			.setRenderMode(renderMode.color)
			.setTexture(paleYellow)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
            .setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
            .setChildOf(this)

		// =======================
		// Augment Category Select
		// =======================

		this.augmentCategoryGroup = new Node()
			.setWidth("100%")
			.setHeight("6%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.augmentSelectBG)
		
		this.augmentCategoryLeft = new PageChangeButton(-1, this.validityCheck.bind(this), this.categoryChange.bind(this))
			.setWidth("6%")
			.setHeight("100%")
			.setChildOf(this.augmentCategoryGroup)

		this.augmentCategoryBG = new Node()
			.setWidth("50%")
			.setHeight("100%")
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(.2))
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(10))
			.setChildOf(this.augmentCategoryGroup)
		
		this.augmentCategoryText = new Text()
			.setWidth("100%")
			.setFont(regularFontUI())
			.setTextAlign(textAlign.center)
			.setColor(midGray)
			.setChildOf(this.augmentCategoryBG)
		
		this.augmentCategoryRight = new PageChangeButton(1, this.validityCheck.bind(this), this.categoryChange.bind(this))
			.setWidth("6%")
			.setHeight("100%")
			.setChildOf(this.augmentCategoryGroup)
		
		this.augmentCategoryCounter = new PageCounter()
			.setWidth("100%")
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(20))
			.setChildOf(this.augmentSelectBG)

		// =================
		// Augment Selection
		// =================

		this.augmentSelectList = new Node()
			.setWidth("99%")
            .setHeight("73%")
            .setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
            .setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setFlexWrap(Yoga.FLEX_FLEX)
			.setChildOf(this.augmentSelectBG)
		
		this.augmentOptions = []
		for (let i = 0; i < 6; i++)
			this.augmentOptions.push (
				new AugmentSelect()
					.setChildOf(this.augmentSelectList)
			)
		this.augmentOptions[0].button.setDefault()

		// ============
		// Bottom Group
		// ============
		
		this.augmentSelectBottomGroup = new Node()
			.setWidth("80%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
            .setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.augmentSelectBG)

		this.activeAugmentsGroup = new Node()
			.setWidth("40%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_FLEX_START)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.augmentSelectBottomGroup)
		
		this.activeAugmentsLabel = new Text()
			.setFont(regularFontUI())
			.setText(localize("current_augments"))
			.setWidth(regularFontUI().widthOf(localize("current_augments")))
			.setMargin(Yoga.EDGE_RIGHT, scalePix(10))
			.setColor(midGray)
			.setChildOf(this.activeAugmentsGroup)
		
		this.activeAugments = new ActiveAugments()
			.setChildOf(this.activeAugmentsGroup)

		this.buttonsGroup = new Node()
			.setWidth("35%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.augmentSelectBottomGroup)
		
		this.clearButton = new ClearButton(this)
			.setChildOf(this.buttonsGroup)
	
		this.backButton = new BackButton(this)
			.setChildOf(this.buttonsGroup)

		// Setup controller navigation.
		for (let i = 0; i < this.augmentOptions.length; i++)
		{
			if (i == 0 || i == 2 || i == 4)
			{
				this.augmentOptions[i].rightNext = this.augmentOptions[i + 1]
				this.augmentOptions[i + 1].leftNext = this.augmentOptions[i]
			}
			if (i > 1)
			{
				this.augmentOptions[i].topNext = this.augmentOptions[i - 2]
				this.augmentOptions[i - 2].bottomNext = this.augmentOptions[i]
				if (i > 3)
					this.augmentOptions[i].bottomNext = this.clearButton
			}
		}

		// Clear and back button controller navigation.
		this.clearButton.setRightNext(this.backButton)
		this.backButton.setLeftNext(this.clearButton)
		
		this.parent = parent
        this.page = 0
		this.augmentsLength = 0
		this.maxActiveAugments = 0
		this.tween = new Tween(this, Easing.Exponential)
	}

	validityCheck(increment)
	{
		let nextPage = this.page + increment
		return nextPage >= 0 && this.augmentsLength / 6 > nextPage
	}

	categoryChange(increment = 0)
	{
		if (this.validityCheck(increment))
		{
			if (increment != 0) this.page += increment
			this.refresh()
		}
	}

    refresh(maxActiveAugments = null)
	{
		let augments = augmentsList()
		this.augmentsLength = augments.length

		// Set max active augment (if any)
		if (maxActiveAugments != null)
			this.maxActiveAugments = maxActiveAugments

		// Populate Augments.
		if (this.augmentsLength / 6 > this.page)
		{
			let startingIndex = 6 * this.page
			for (let i = 0; i < 6; i++)
			{
				let currentIndex = startingIndex + i
				if (this.augmentsLength > currentIndex)
					this.augmentOptions[i].setAugment(augments[currentIndex])
				else
					this.augmentOptions[i].hide()
			}
		}

		// Update Augment category.
		this.augmentCategoryText.setText(localize(augmentCategories[this.page]))
		this.augmentCategoryCounter.refresh(this.page, Math.ceil(this.augmentsLength / 6))
		this.augmentCategoryLeft.refresh()
		this.augmentCategoryRight.refresh()
		
		// Update active Augments widget.
		this.activeAugments.refresh(maxActiveAugments, augments)

		// Update clear button controller navigation.
		this.clearButton.setTopNext(this.augmentOptions[5].augmentMaxLevel > 1 ?
			this.augmentOptions[5].button2 :
			this.augmentOptions[5].button)

		// Update back button controller navigation.
		this.backButton.setTopNext(this.augmentOptions[5].augmentMaxLevel > 1 ?
			this.augmentOptions[5].button2 :
			this.augmentOptions[5].button)
	}

	startIntro(maxActiveAugments)
	{
		this.setAnimating(true)
		control.suspend(true)
		this.animYOffset = this.getComputedHeight()
		this.refresh(maxActiveAugments)
		this.show()
		this.parent.panel.startExtro()
			.then(() => {
				this.parent.panel.hide()
				this.tween.easeOut({animYOffset: 0}, 20)
				.then(() => {
					control.suspend(false)
					this.setAnimating(false)
					if (usingController || keyboardArrows)
						this.augmentOptions[0].button.takeFocus()
				})
			})
	}

	startExtro()
	{
		this.setAnimating(true)
		control.suspend(true)
		this.tween.easeIn({animYOffset: this.getComputedHeight()}, 20)
			.then(() => {
				this.hide()
				this.parent.panel.refresh()
				this.parent.panel.show()
				this.parent.panel.startIntro()
					.then(() => {
						this.parent.panel.selectAugmentButton.takeFocus()
						control.suspend(false)
						this.setAnimating(false)
					})
			})
	}
}

export class ActiveAugments extends Node
{
	constructor()
	{
		super()
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
		
		this.unselectedAugments = new Text()
			.setFont(titleIconsLarge)
			.setHeight(titleIconsLarge.height)
			.setTextAlign(textAlign.right)
			.setColor(midGray.fadeTo(.3))
			.setChildOf(this)

		this.currentAugments = new Text()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setFont(titleIconsLarge)
			.setHeight(titleIconsLarge.height)
			.setColor(secondColor)
			.setChildOf(this.unselectedAugments)
		
		this.maxActiveAugments = 0
	}

	refresh(maxActiveAugments = null, augments = null)
	{
		augments = augments || augmentsList()
		this.changeMaxAugments(maxActiveAugments)
		this.currentAugments.setText(Object.keys(activeAugments).reduce((t, c) => {
			let count = activeAugments[c]
			let icon = augments.find(augment => augment.name == c).icon
			return t + icon.repeat(count)
		}, ""))
		this.fillUnselectedWithBlank()
	}

	changeMaxAugments(maxActiveAugments)
	{
		if (maxActiveAugments == null) return
		while (Object.values(activeAugments).reduce((t, c) => t + c, 0) > maxActiveAugments)
		{
			let latestAugment = Object.keys(activeAugments).pop()
			if (--activeAugments[latestAugment] <= 0)
				delete activeAugments[latestAugment]
		}
		this.maxActiveAugments = maxActiveAugments
	}

	addRemoveActiveAugment(augmentIcon, remove = false)
	{
		this.currentAugments.setText(remove ?
			this.currentAugments.text.replace(augmentIcon, "") :
			this.currentAugments.text + augmentIcon)
		this.currentAugments.setWidth(titleIconsLarge.widthOf(this.currentAugments.text))
		this.fillUnselectedWithBlank()
	}

	fillUnselectedWithBlank()
	{
		let emptySlotCount = Math.max(0, this.maxActiveAugments - this.currentAugments.text.length)
		this.unselectedAugments.setText("".repeat(emptySlotCount))
		this.unselectedAugments.setWidth(titleIconsLarge.widthOf("".repeat(this.maxActiveAugments)))
	}
}

class AugmentSelect extends Node
{
	constructor()
	{
		super()
			.setWidth("45%")
			.setHeight("31%")
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(.3))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setMargin(Yoga.EDGE_VERTICAL, ".3%")
			.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(15))
		
		this.leftSide = new Node()
			.setWidth("20%")
			.setHeight("100%")
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(0.4))
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setPadding(Yoga.EDGE_ALL, scalePix(20))
			.setChildOf(this)
		
		this.button = new AugmentSelectButton(this, 0)
			.setChildOf(this.leftSide)
		this.button2 = new AugmentSelectButton(this, 1)
			.setChildOf(this.leftSide)
		
		this.rightSide = new Node()
			.setWidth("80%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setPadding(Yoga.EDGE_HORIZONTAL, scalePix(30))
			.setPadding(Yoga.EDGE_TOP, scalePix(20))
			.setPadding(Yoga.EDGE_BOTTOM, scalePix(25))
			.setChildOf(this)
		
		this.nameAndLevel = new Node()
			.setWidth("100%")
			.setHeight("30%")
			.setChildOf(this.rightSide)
		
		this.titleGroup = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(5))
			.setChildOf(this.nameAndLevel)
		
		this.icon = new Text()
			.setFont(titleIcons)
			.setText("")
			.setWidth("14%")
			.setColor(secondColorDark)
			.setChildOf(this.titleGroup)

		this.name = new Text()
			.setWidth("86%")
			.setFont(titleFontUI())
			.setText("AUGMENT")
			.setColor(darkGray)
			.setChildOf(this.titleGroup)
		
		this.desc = new Text()
			.setEastAsian(isUIEastAsian)
			.setWidth("100%")
			.setFont(isUIEastAsian ? regularEastAsian : typingFontMedium)
			.setText("Lorem ipsum dolor sit amet.")
			.setColor(midGray)
			.setChildOf(this.rightSide)
		
		// Augment strings.
		this.augmentName
		this.augmentCost
		this.augmentCurrentLevel
		this.augmentMaxLevel
		this.augmentOverrideAction

		// Controller navigation vars.
		this.topNext
		this.bottomNext
		this.leftNext
		this.rightNext
	}

	setAugment(augment)
	{
		// Setup strings.
		this.augmentName = augment.name
		this.augmentCurrentLevel = augment.name in save.augments ? save.augments[augment.name] : 0
		this.augmentCost = augment.cost[this.augmentCurrentLevel]
		this.augmentMaxLevel = augment.cost.length
		this.augmentOverrideAction = augment.override_action ? augment.override_action : null

		this.icon.setText(augment.icon)
		this.icon.setColor(secondColorDark)
		let localizedName = localize(augment.name).toUpperCase()
		this.name.setText(localizedName)
		this.name.setFont(pickTitleFont(localizedName, this.name.getComputedWidth()))
		this.desc.setText(localize(augment.desc, augment.descVars ? augment.descVars[this.augmentCurrentLevel] : ""))

		this.button.refresh()
		this.button2.refresh()
	}

	canAugment()
	{
		return this.augmentName in save.augments ? save.augments[this.augmentName] : 0
	}
}

class AugmentSelectButton extends Button
{
	constructor(parent, augmentIndex)
	{
		super()
			.setWidth("80%")
			.setHeight("40%")
			.setRenderMode(renderMode.colorRounded)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setMargin(Yoga.EDGE_VERTICAL, "4%")
			.setTexture(paleYellow)

		this.parent = parent
		this.buttonText = new Text()
			.setFont(pickupIconsLarge)
			.setText("+")
			.setWidth("100%")
			.setColor(midGray)
			.setHeight(pickupIconsLarge.height * .75)
			.setTextAlign(textAlign.center)
			.setChildOf(this)
		
		this.augmentIndex = augmentIndex
		this.selected = false
	}

	focusStart()
	{
		audioHandler.playAudioHookUI("main_menu_augment_hover")
		this.refresh()
	}

	focusEnd()
	{
		this.refresh()
	}

	getAugmentButton(aug, index = 0)
	{
		if (!aug) return null
		if (!("button" in aug)) return aug
		return index > 0 && aug.augmentMaxLevel > 1 ? aug.button2 : aug.button
	}

	render(surface, xOffset = 0, yOffset = 0)
	{
		if (this.selected && !this.hidden)
			PrimNative.drawRoundedRectangle(
				Surface.Screen,
				this.getComputedLeft() + xOffset - scalePix(2),
				this.getComputedTop() + yOffset - scalePix(2),
				this.getComputedLeft() + xOffset + this.getComputedWidth() + scalePix(2),
				this.getComputedTop() + yOffset + this.getComputedHeight() + scalePix(2),
				.005 * Surface.Screen.height,
				.005 * Surface.Screen.height,
				scalePix(4),
				paleYellow
			)
		super.render(surface, xOffset, yOffset)
	}

	refresh()
	{
		// Hide / show
		if (this.parent.augmentMaxLevel <= this.augmentIndex)
		{
			this.hide()
			if (currentFocus == this) this.parent.button.takeFocus()
			return
		}
		this.show()

		// Setup controller navigation.
		this.setTopNext(this.augmentIndex == 0 ?
			this.getAugmentButton(this.parent.topNext, 1) :
			this.parent.button)
		this.setBottomNext(this.augmentIndex == 0 && this.parent.augmentMaxLevel > 1 ?
			this.parent.button2 :
			this.getAugmentButton(this.parent.bottomNext))
		this.setLeftNext(this.getAugmentButton(this.parent.leftNext))
		this.setRightNext(this.getAugmentButton(this.parent.rightNext))

		// Setup button display.
		this.selected = this.focus || currentFocus == this
		if (this.parent.augmentName in activeAugments &&
			activeAugments[this.parent.augmentName] > this.augmentIndex)
		{
			this.setTexture(secondColorDark)
			this.buttonText.setText("+")
			this.buttonText.setColor(paleYellow)
		}
		else if (this.parent.canAugment() > this.augmentIndex)
		{
			this.setTexture(this.selected ? secondColorDark : paleYellow)
			this.buttonText.setText("+")
			this.buttonText.setColor(this.selected ? paleYellow : secondColor)
		}
		else
		{
			this.setTexture(this.selected ? darkGray : paleYellow)
			this.buttonText.setText("*")
			this.buttonText.setColor(this.selected ? paleYellow : midGray)
		}
	}

	// Activation
	pressMouseLeftStart() { this.activate() }
	pressButtonBottomStart() { this.activate() }
	activate()
	{
		let isActive = activeAugments[this.parent.augmentName] && activeAugments[this.parent.augmentName] > this.augmentIndex
		let maxActiveAugmentsReached = Object.values(activeAugments).reduce((t, c) => t + c, 0) >= ui.omenSelect.augmentSelectPanel.maxActiveAugments
		if (this.parent.canAugment() > this.augmentIndex)
		{
			if (!isActive)
			{
				if (!maxActiveAugmentsReached)
				{
					audioHandler.playAudioHookUI("main_menu_confirmation_click")
					activeAugments[this.parent.augmentName] = activeAugments[this.parent.augmentName] || 0
					activeAugments[this.parent.augmentName]++
					ui.omenSelect.augmentSelectPanel.activeAugments.addRemoveActiveAugment(this.parent.icon.text)
				}
			}
			else
			{
				audioHandler.playAudioHookUI("main_menu_confirmation_click")
				if (--activeAugments[this.parent.augmentName] <= 0)
					delete activeAugments[this.parent.augmentName]
				ui.omenSelect.augmentSelectPanel.activeAugments.addRemoveActiveAugment(this.parent.icon.text, true)
			}
		}
	}

	pressShoulderButtonLeftStart() { ui.omenSelect.augmentSelectPanel.categoryChange(-1) }
	pressShoulderButtonRightStart() { ui.omenSelect.augmentSelectPanel.categoryChange(1) }
}

class BackButton extends Button
{
	constructor(parent)
	{
		super()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setWidth("75%")
			.setHeight("80%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
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

	pressShoulderButtonLeftStart() { this.parent.categoryChange(-1) }
	pressShoulderButtonRightStart() { this.parent.categoryChange(1) }

	pressMouseLeftStart() { this.activate() }
	pressButtonBottomStart() { this.activate() }
	activate()
	{
		currentFocus = null
		this.focusEnd()
		audioHandler.playAudioHookUI("main_menu_confirmation_click")
		this.parent.startExtro()
	}
}

class ClearButton extends Button
{
	constructor(parent)
	{
		super()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setWidth("25%")
			.setHeight("80%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setMargin(Yoga.EDGE_RIGHT, scalePix(7))
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		this.text = new Text()
			.setColor(paleYellow)
			.setFont(interfaceIconsMedium)
			.setText("=")
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

	pressShoulderButtonLeftStart() { this.parent.categoryChange(-1) }
	pressShoulderButtonRightStart() { this.parent.categoryChange(1) }

	pressMouseLeftStart() { this.activate() }
	pressButtonBottomStart() { this.activate() }
	activate()
	{
		audioHandler.playAudioHookUI("main_menu_confirmation_click")
		activeAugments = {}
		this.parent.refresh()
	}
}