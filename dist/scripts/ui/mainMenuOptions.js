import { Node, Yoga, Text } from 'sphere-runtime'
import { OptionsDarkMode } from './optionsDarkMode.js'
import { OptionsResolution } from './optionsResolution.js'
import { OptionsLanguageUI } from './optionsLanguageUI.js'
import { OptionsLanguageGame } from './optionsLanguageGame.js'
import { OptionsBGMVolume } from './optionsBGMVolume.js'
import { OptionsContrast } from './optionsContrast.js'
import { OptionsSFXVolume } from './optionsSFXVolume.js'
import { OptionsMuteTypingSounds } from './optionsMuteTypingSounds.js'
import { OptionsFullscreen } from './optionsFullscreen.js'
import { OptionsSpacesAndPunctuation } from './optionsSpacesAndPunctuations.js'
import { OptionsFeedbackButton } from './optionsFeedbackButton.js'
import { PageChangeButton } from './pageChangeButton.js'
import { PageCounter } from './pageCounter.js'
import { OptionsToggle } from './optionsToggle.js'

export class MainMenuOptions extends Node
{
    constructor(navBar)
    {
        super()
			.setHeight("100%")
			.setWidth("100%")
            .setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
            .setJustifyContent(Yoga.JUSTIFY_CENTER)
            .setAlignItems(Yoga.ALIGN_CENTER)
            .setPadding(Yoga.EDGE_LEFT, scalePix(80))

		// Save reference to navbar.
		this.navbar = navBar

		// Category browser.
		this.categoryGroup = new Node()
			.setWidth("65%")
			.setHeight("5%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
            .setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this)
		
		this.categoryLeft = new PageChangeButton(-1, this.testValidity.bind(this), this.categoryChange.bind(this))
			.setWidth("10%")
			.setHeight("100%")
			.setChildOf(this.categoryGroup)

		this.categoryBG = new Node()
			.setWidth("70%")
			.setHeight("100%")
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(.2))
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(10))
			.setChildOf(this.categoryGroup)
		
		this.categoryText = new Text()
			.setWidth("100%")
			.setFont(regularFontUI())
			.setTextAlign(textAlign.center)
			.setColor(midGray)
			.setChildOf(this.categoryBG)
		
		this.categoryRight = new PageChangeButton(1, this.testValidity.bind(this), this.categoryChange.bind(this))
			.setWidth("10%")
			.setHeight("100%")
			.setChildOf(this.categoryGroup)
		
		this.categoryCounter = new PageCounter()
			.setWidth("100%")
			.setMargin(Yoga.EDGE_BOTTOM, "5%")
			.setChildOf(this)
        
        // Item containers.
		this.currentCategory = 0
        this.categories = []
		this.optionsContainer = new Node()
			.setWidth("100%")
			.setHeight("50%")
			.setChildOf(this)
		this.categories = [

			// Visuals category.
			new OptionCategory([
				new OptionsDarkMode(navBar),
				new OptionsFullscreen(navBar),
				new OptionsResolution(navBar),
				new OptionsContrast(navBar)
			]).setChildOf(this.optionsContainer),
			
			// Audio category.
			new OptionCategory([
				new OptionsBGMVolume(navBar),
				new OptionsSFXVolume(navBar),
				new OptionsMuteTypingSounds(navBar)
			]).setChildOf(this.optionsContainer),

			// Language category.
			new OptionCategory([
				new OptionsLanguageUI(navBar),
				new OptionsLanguageGame(navBar),
				new OptionsSpacesAndPunctuation(navBar)
			]).setChildOf(this.optionsContainer)
		]
		
		// Demo feedback button.
		if (demo)
			this.items.push(new OptionsFeedbackButton(navBar)
				.setChildOf(this))

        // Version number.
		this.version_number = new Text()
			.setHeight(typingFont.height)
			.setWidth(typingFont.widthOf("Version: " + versionString))
			.setTextAlign(textAlign.center)
			.setFont(typingFont)
			.setColor(midGray.fadeTo(.5))
			.setMargin(Yoga.EDGE_TOP, scalePix(20))
			.setText("Version: " + versionString)
			.setChildOf(this)
    }

	testValidity(increment)
	{
		let nextCategory = this.currentCategory + increment
		return nextCategory >= 0 && nextCategory < 3
	}

	categoryChange(increment = 0)
	{
		if (increment != 0 && this.testValidity(increment))
		{
			// Play audio.
			audioHandler.playAudioHookUI("main_menu_options_change_value")

			// Keep a record of currently selected option's index.
			let currentOptionIndex = null
			if ((keyboardArrows || usingController) && currentFocus instanceof OptionsToggle)
				currentOptionIndex = this.categories[this.currentCategory].options.findIndex(opt => opt == currentFocus)

			// Change category.
			this.currentCategory += increment
			this.refresh()

			// Move cursor to option on same index if possible.
			if (currentOptionIndex != null)
			{
				let currentOptions = this.categories[this.currentCategory].options
				if (currentOptions.length > currentOptionIndex)
					currentOptions[currentOptionIndex].takeFocus()
				else currentOptions[currentOptions.length - 1].takeFocus()
			}
		}
	}

	refresh(resetCategory = false)
	{
		if (resetCategory) this.currentCategory = 0
		this.categoryLeft.refresh()
		this.categoryRight.refresh()
		this.categoryText.setText(localize("option_category_" + this.currentCategory))
		this.categoryCounter.refresh(this.currentCategory, 3)
		this.categories.forEach(cat => cat.hide())
		this.categories[this.currentCategory].show()
		this.categories[this.currentCategory].refresh()
		this.navbar.main_menu_buttons[2].rightNext = this.categories[this.currentCategory].options[0]
	}
}

class OptionCategory extends Node
{
	constructor(optionItems)
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_LEFT, 0)
			.setWidth("100%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
            .setJustifyContent(Yoga.JUSTIFY_FLEX_START)
            .setAlignItems(Yoga.ALIGN_CENTER)
		
		this.options = []
		optionItems.forEach(option => {
			option.setChildOf(this)
			this.options.push(option)
		})
		this.options.forEach((option, i) => {
			option
				.setBottomNext(i < this.options.length - 1 ? this.options[i + 1] : null)
				.setTopNext(i > 0 ? this.options[i - 1] : null)
		})
	}

	refresh()
	{
		this.options.forEach(option => option.refresh())
	}
}