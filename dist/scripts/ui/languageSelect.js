import { Node, Text, Yoga, Tween, Easing } from 'sphere-runtime'
import { Button } from '../core/button.js'

export class LanguageSelect extends Node
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
		
		this.panel = new ConfirmPanel(this)
			.setChildOf(this)
		
		return this
	}

	startIntro(gameOrUI, optionButton = null)
	{
		this.populate(gameOrUI)
		inConfirmPopUp = true
		this.optionButton = optionButton
		if (!ui.main_menu.turrets.hidden)
			ui.disableAllTurretButtons()
		audioHandler.playAudioHookUI("main_menu_confirmation_popup_intro")
		this.setAnimating(true)
		control.suspend(true)
		this.tween.easeIn({opacity: 1}, 40)
			.then(() => this.setAnimating(false))
		this.panel.animYOffset = this.getComputedHeight() - this.panel.getComputedTop()
		Sphere.sleep(20).then(() => {
			this.panel.startIntro()
				.then(() => control.suspend(false))
		})
		this.show()
	}

	startExtro(lang = null)
	{
		this.setAnimating(true)
		control.suspend(true)
		audioHandler.playAudioHookUI("main_menu_confirmation_popup_extro")
		this.panel.startExtro()
		Sphere.sleep(10).then(() => {
			this.tween.easeIn({opacity: 0}, 40)
				.then(() => {
					this.setAnimating(false)
					control.suspend(false)
					inConfirmPopUp = false
					if (usingController || keyboardArrows)
					{
						currentFocus.focusEnd()
						if (this.lastFocus)
						{
							this.lastFocus.takeFocus()
							this.lastFocus = null
						}
						else ui.main_menu.left.main_menu_buttons[4].takeFocus()
					}
					if (!ui.main_menu.turrets.hidden)
						ui.disableAllTurretButtons(false)
					if (lang && this.optionButton)
						this.optionButton.onPopupClose(lang)
					this.hide()
				})
		})
	}

	populate(gameOrUI)
	{
		this.panel.titleGroup.setText(localize(gameOrUI ? "options_game_language" : "options_UI_language"))
		let dict = gameOrUI ? wordlists : localization
		let languageInfo = Object.keys(dict).map(lang => {
			let languageName = dict[lang]['language_name']
			let isEastAsian = eastAsianRange.test(languageName)
			return {
				lang: lang,
				font: isEastAsian ? regularEastAsian : typingFont,
				text: languageName
			}
		})
		for (let i = 0; i < this.panel.languages.length; i++)
		{
			if (languageInfo.length > i)
			{
				let button = this.panel.languages[i]
				let current = gameOrUI ? currentGameLanguage : currentUILanguage
				button.show()
				button.lang = languageInfo[i].lang
				button.text.setFont(languageInfo[i].font)
				button.text.setText(languageInfo[i].text || languageInfo[i].lang)
				button.currentSelected = button.defaultFocus = languageInfo[i].lang == current
				if (button.currentSelected && (usingController || keyboardArrows))
					button.takeFocus()
				else button.focusEnd()
			}
			else this.panel.languages[i].hide()
		}
	}

	update()
	{
		if (this.animating)
			this.setTexture(bgColor.fadeTo(this.opacity))
	}
}

class ConfirmPanel extends Node
{
	constructor(parent)
	{
		super()
			.setRenderMode(renderMode.color)
			.setTexture(paleYellow)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("80%")
			.setHeight("80%")
		
		this.titleGroup = new Text()
			.setWidth("100%")
			.setHeight(titleFontUI().height)
			.setTextAlign(textAlign.center)
			.setFont(titleFontUI())
			.setColor(midGray)
			.setText("title")
			.setChildOf(this)
		
		this.languagesContainer = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("85%")
			.setHeight("63%")
			.setMargin(Yoga.EDGE_VERTICAL, "3%")
			.setChildOf(this)
		
		this.languagesGroup = new Node()
			.setWidth("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setFlexWrap(Yoga.FLEX_FLEX)
			.setChildOf(this.languagesContainer)
		
		this.buttonGroup = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setHeight("10%")
			.setChildOf(this)
		
		this.cancelButton = new CancelButton(parent)
			.setChildOf(this.buttonGroup)
		
		// Create language buttons.
		this.languages = []
		for (let i = 0; i < 24; i++)
		{
			let lang = new LanguageButton(parent, i)
				.setChildOf(this.languagesGroup)
			this.languages.push(lang)
		}

		// Setup controller navigation.
		for (let i = 0; i < this.languages.length; i += 3)
		{
			// Horizontal Navigation.
			this.languages[i].rightNext = this.languages[i + 1]
			this.languages[i + 1].leftNext = this.languages[i]
			this.languages[i + 1].rightNext = this.languages[i + 2]
			this.languages[i + 2].leftNext = this.languages[i + 1]

			// Vertical Navigation.
			for (let k = 0; k < 3; k++)
			{
				if (i < this.languages.length - 4)
					this.languages[i + k].bottomNext = this.languages[i + k + 3]
				if (i > 2)
					this.languages[i + k].topNext = this.languages[i + k - 3]
			}
		}
		this.tween = new Tween(this, Easing.Exponential)
		return this
	}

	startIntro()
	{
		this.cancelButton.topNext = this.languages.findLast(lang => !lang.hidden)
		this.setAnimating(true)
		return new Promise((resolve) => {
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
		this.tween.easeIn({animYOffset: -(this.getComputedTop() + this.getComputedHeight())}, 20)
			.then(() => this.setAnimating(false))
	}
}

class LanguageButton extends Button
{
	constructor(parent, index)
	{
		super()
			.setWidth("30%")
			.setHeight(scalePix(60))
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray.fadeTo(.3))
			.setMargin(Yoga.EDGE_BOTTOM, "1%")
			.setMargin(Yoga.EDGE_HORIZONTAL, "1%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		this.text = new Text()
			.setFont(typingFont)
			.setTextAlign(textAlign.center)
			.setColor(midGray)
			.setText("Test")
			.setWidth("100%")
			.setHeight(typingFont.height)
			.setChildOf(this)
		
		this.parent = parent
		this.currentSelected = false
		this.lang = ""
		this.index = index
	}

	selectBottom()
	{
		if (this.bottomNext && !this.bottomNext.hidden)
			this.bottomNext.takeFocus()
		else
			this.parent.panel.cancelButton.takeFocus()
		this.focusEnd()
	}

	selected()
	{
		this.setTexture(darkGray)
		this.text.setColor(paleYellow)
	}

	focusStart()
	{
		this.setTexture(secondColorDark)
		this.text.setColor(paleYellow)
	}

	focusEnd()
	{
		if (this.currentSelected)
			this.selected()
		else
		{
			this.setTexture(midGray.fadeTo(.3))
			this.text.setColor(midGray)
		}
	}

	pressMouseLeftStart() { this.activate() }
	pressButtonBottomStart() { this.activate() }
	activate()
	{
		this.parent.startExtro(this.lang)
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
			.setText(localize("cancel_text"))
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

	pressMouseLeftStart() { this.activate() }
	pressButtonBottomStart() { this.activate() }
	activate()
	{
		audioHandler.playAudioHookUI("main_menu_confirmation_click")
		this.parent.startExtro()
	}
}