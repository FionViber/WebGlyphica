import { Yoga, Node, Text } from 'sphere-runtime'
import { Button } from '../core/button.js'
import { saveGame } from '../core/loader.js'
import { augmentsList, augmentCategories } from '../data/augmentsList.js'
import { PageChangeButton } from './pageChangeButton.js'
import { PageCounter } from './pageCounter.js'

export class MainMenuAugments extends Node
{
	constructor(navigationMenu)
	{
		super()
			.setWidth("100%")
			.setHeight("100%")
			.setPadding(Yoga.EDGE_LEFT, scalePix(80))
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		this.augmentsTopGroup = new Node()
			.setWidth("100%")
			.setHeight("9%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
			.setChildOf(this)

		this.augmentCategoryGroup = new Node()
			.setHeight("100%")
			.setWidth("65%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.augmentsTopGroup)
		
		this.augmentSelectorGroup = new Node()
			.setHeight("60%")
			.setWidth("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.augmentCategoryGroup)
		
		this.augmentCategoryLeft = new PageChangeButton(-1, this.testValidity.bind(this), this.categoryChange.bind(this))
			.setWidth("10%")
			.setHeight("100%")
			.setChildOf(this.augmentSelectorGroup)

		this.augmentCategoryBG = new Node()
			.setWidth("70%")
			.setHeight("100%")
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(.2))
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(10))
			.setChildOf(this.augmentSelectorGroup)
		
		this.augmentCategoryText = new Text()
			.setWidth("100%")
			.setFont(regularFontUI())
			.setTextAlign(textAlign.center)
			.setColor(midGray)
			.setChildOf(this.augmentCategoryBG)
		
		this.augmentCategoryRight = new PageChangeButton(1, this.testValidity.bind(this), this.categoryChange.bind(this))
			.setWidth("10%")
			.setHeight("100%")
			.setChildOf(this.augmentSelectorGroup)
		
		this.augmentCategoryCounter = new PageCounter()
			.setWidth("100%")
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(20))
			.setChildOf(this.augmentCategoryGroup)
		
		this.coinCounter = new Node()
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(.2))
			.setMargin(Yoga.EDGE_RIGHT, scalePix(20))
			.setWidth("20%")
			.setHeight("80%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.augmentsTopGroup)
		
		this.coinCounterText = new Text()
			.setWidth("100%")
			.setHeight(typingFont.height)
			.setFont(typingFont)
			.setTextAlign(textAlign.center)
			.setColor(midGray)
			.setChildOf(this.coinCounter)

		this.augmentsContainer = new Node()
			.setWidth("100%")
			.setHeight("78%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setFlexWrap(Yoga.FLEX_FLEX)
			.setChildOf(this)

		// Pagination booleans.
		this.page = 0
		this.augmentsLength = 0

		this.augmentOptions = []
		for (let i = 0; i < 6; i++)
			this.augmentOptions.push (
				new MainMenuAugment(this)
					.setChildOf(this.augmentsContainer)
			)
		
		// Setup navigation.
		for (let i = 0; i < this.augmentOptions.length; i++)
		{
			if (i == 0 || i == 2 || i == 4)
			{
				this.augmentOptions[i].button.rightNext = this.augmentOptions[i + 1].button
				this.augmentOptions[i].button.leftNext = navigationMenu.main_menu_buttons[1]
				this.augmentOptions[i + 1].button.leftNext = this.augmentOptions[i].button
			}
			if (i > 1)
			{
				this.augmentOptions[i].button.topNext = this.augmentOptions[i - 2].button
				this.augmentOptions[i - 2].button.bottomNext = this.augmentOptions[i].button
			}
		}

		// Setup navigation to this submenu
		navigationMenu.main_menu_buttons[1].rightNext = this.augmentOptions[0].button

		return this
	}

	refresh()
	{
		let augments = augmentsList()
		this.augmentsLength = augments.length
		if (this.augmentsLength / 6 > this.page)
		{
			// Update augments.
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

		// Update Coins.
		this.coinCounterText.setText(`${save.coins} §`)
	}

	testValidity(increment)
	{
		let nextPage = this.page + increment
		return nextPage >= 0 && this.augmentsLength / 6 > nextPage
	}

	categoryChange(increment = 0)
	{
		if (increment != 0 && this.testValidity(increment))
		{
			this.page += increment
			this.refresh()
		}
	}
}

export class MainMenuAugment extends Node
{
	constructor(parent)
	{
		super()
			.setWidth("48%")
			.setHeight("32%")
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(.3))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(10))
			.setMargin(Yoga.EDGE_VERTICAL, scalePix(4))
		
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
		
		this.costContainer = new Node()
			.setWidth("200%")
			.setHeight("50%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.leftSide)
		
		this.cost = new Text()
			.setWidth("100%")
			.setHeight(regularFontUI().heightOf("0"))
			.setTextAlign(textAlign.center)
			.setFont(isUIEastAsian ? regularEastAsian : typingFontMedium)
			.setText("20 §")
			.setColor(darkGray)
			.setChildOf(this.costContainer)
		
		this.button = new MainMenuAugmentButton(this)
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
			.setWidth("16%")
			.setColor(secondColorDark)
			.setChildOf(this.titleGroup)

		this.name = new Text()
			.setWidth("84%")
			.setFont(titleFontUI())
			.setText("AUGMENT")
			.setColor(darkGray)
			.setChildOf(this.titleGroup)
		
		this.level = new Text()
			.setWidth("100%")
			.setFont(smallFont())
			.setText("Level 0 / 3")
			.setColor(midGray.fadeTo(.55))
			.setChildOf(this.nameAndLevel)
		
		this.desc = new Text()
			.setEastAsian(isUIEastAsian)
			.setWidth("100%")
			.setFont(isUIEastAsian ? regularEastAsian : typingFontMedium)
			.setText("Lorem ipsum dolor sit amet.")
			.setColor(midGray)
			.setChildOf(this.rightSide)
		
		this.parent = parent
		this.augmentName
		this.augmentCost
		this.augmentCurrentLevel
		this.augmentMaxLevel
		this.augmentOverrideAction
		return this
	}

	setAugment(augment)
	{
		// Setup strings.
		this.augmentName = augment.name
		this.augmentCurrentLevel = augment.name in save.augments ? save.augments[augment.name] : 0
		this.augmentCost = augment.cost[this.augmentCurrentLevel]
		this.augmentMaxLevel = augment.cost.length
		this.augmentOverrideAction = augment.override_action ? augment.override_action : null

		let maxed = this.augmentMaxLevel > 0 && this.augmentCurrentLevel >= this.augmentMaxLevel

		this.icon.setText(augment.icon)
		this.icon.setColor(secondColorDark)
		let localizedName = localize(augment.name).toUpperCase()
		this.name.setText(localizedName)
		this.name.setFont(pickTitleFont(localizedName, this.name.getComputedWidth()))
		this.level.setText(localize("collected", this.augmentCurrentLevel) + " / " + this.augmentMaxLevel)
		this.desc.setText(localize(augment.desc, augment.descVars ? augment.descVars[this.augmentCurrentLevel] : ""))
		this.cost.setText(maxed ? localize("max") : this.augmentCost + " §")
		this.button.refresh()

		this.show()
	}

	canAugment()
	{
		return this.augmentCost <= save.coins &&
			(this.augmentMaxLevel == 0 || this.augmentCurrentLevel < this.augmentMaxLevel)
	}
}

class MainMenuAugmentButton extends Button
{
	constructor(parent)
	{
		super()
			.setWidth("100%")
			.setHeight("50%")
			.setRenderMode(renderMode.colorRounded)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setTexture(paleYellow)

		this.parent = parent
		this.buttonText = new Text()
			.setFont(pickupIconsLarge)
			.setText("/")
			.setWidth("100%")
			.setColor(midGray)
			.setHeight(pickupIconsLarge.heightOf("/"))
			.setTextAlign(textAlign.center)
			.setChildOf(this)
		
		return this
	}

	focusStart()
	{
		if (!inConfirmPopUp)
		{
			audioHandler.playAudioHookUI("main_menu_augment_hover")
			this.refresh()
		}
	}

	focusEnd()
	{
		this.refresh()
	}

	refresh()
	{
		let focus = this.focus || currentFocus == this
		let enabled = this.parent.canAugment()
		this.buttonText.setText(enabled ? "/" : ".")

		if (focus)
		{
			this.setTexture(enabled ? secondColorDark : darkGray)
			this.buttonText.setColor(paleYellow)
		}
		else
		{
			this.setTexture(paleYellow)
			this.buttonText.setColor(enabled ? secondColor : midGray)
		}
	}

	// Activation
	pressMouseLeftStart() { this.activate() }
	pressButtonBottomStart() { this.activate() }
	activate()
	{
		if (!inConfirmPopUp)
		{
			if (this.parent.canAugment())
			{
				audioHandler.playAudioHookUI(this.parent.augmentName == "augment_reset" ? "main_menu_augment_click_reset" : "main_menu_augment_click_ok")
				if (this.parent.augmentOverrideAction)
					this.parent.augmentOverrideAction()
				else
				{
					save.coins -= this.parent.augmentCost
					save.augments[this.parent.augmentName] = save.augments[this.parent.augmentName] || 0
					save.augments[this.parent.augmentName] += 1
				}
				saveGame()
				this.parent.parent.refresh()
				this.focusStart()
			}
			else audioHandler.playAudioHookUI("main_menu_augment_click_error")
		}
	}

	pressShoulderButtonLeftStart() { this.parent.parent.categoryChange(-1) }
	pressShoulderButtonRightStart() { this.parent.parent.categoryChange(1) }
}