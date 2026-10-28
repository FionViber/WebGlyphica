import { Node, Yoga, Text } from 'sphere-runtime'
import { Button } from '../core/button.js'

export class OptionsLanguage extends Button
{
	constructor(gameOrUI, navigationMenu = null)
	{
		super()
			.setRenderMode(renderMode.color)
			.setTexture(null)
			.setWidth("100%")
			.setHeight(scalePix(70))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)

		this.ignoreMouse = true
		this.gameOrUI = gameOrUI
		if (navigationMenu) this.setLeftNext(navigationMenu.main_menu_buttons[2])
		
		this.name = new Text()
			.setFont(regularFontUI())
			.setTextAlign(textAlign.center)
			.setText("name")
			.setWidth("40%")
			.setColor(midGray)
			.setMargin(Yoga.EDGE_RIGHT, 20)
			.setChildOf(this)
		
		this.spacer = new Node()
			.setWidth("10%")
			.setChildOf(this)
		
		this.varCountBG = new Node()
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(.2))
			.setWidth("38%")
			.setHeight(scalePix(40))
			.setMargin(Yoga.EDGE_LEFT, "1%")
			.setMargin(Yoga.EDGE_RIGHT, "1%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this)

		this.varCount = new Text()
			.setColor(midGray)
			.setFont(regularFontUI())
			.setWidth("100%")
			.setHeight(regularFontUI().height)
			.setText("Page 1 / 3")
			.setTextAlign(textAlign.center)
			.setChildOf(this.varCountBG)
		
		this.varCountIconsEditGroup = new Node()
			.setWidth("10%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this)

		this.varCountKeyboardEdit = new Node()
			.setWidth("100%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.varCountIconsEditGroup)

		this.varCountKeyboardEditBG = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setWidth(typingFontSmall.height + scalePix(30))
			.setHeight(typingFontSmall.height + scalePix(10))
			.setTexture(midGray)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this.varCountKeyboardEdit)

		this.varCountKeyboardEditText = new Text()
			.setColor(paleYellow)
			.setWidth("100%")
			.setHeight(interfaceIconsSmall.height)
			.setFont(interfaceIconsSmall)
			.setTextAlign(textAlign.center)
			.setText("@")
			.setChildOf(this.varCountKeyboardEditBG)

		this.varCountControllerEdit = new Text()
			.setFont(quicktimeFont)
			.setColor(midGray)
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setText(getQuickTimeString([button_bottom]))
			.setChildOf(this.varCountIconsEditGroup)
		
		this.varCountMouseEdit = new varEditButton(this)
			.setChildOf(this)
	}

	pressShoulderButtonLeftStart() { ui.main_menu.options.categoryChange(-1) }
	pressShoulderButtonRightStart() { ui.main_menu.options.categoryChange(1) }
	pressButtonBottomStart()
	{
		ui.languageSelect.lastFocus = this
		this.focusEnd()
		ui.languageSelect.startIntro(this.gameOrUI, this)
	}

	refresh()
	{
		if (usingController || keyboardArrows)
		{
			this.varCountControllerEdit.hide()
			this.varCountKeyboardEdit.hide()
			this.varCountIconsEditGroup.show()
			if (usingController)
				this.varCountControllerEdit.setText(getQuickTimeString([button_bottom]))
			this.varCountMouseEdit.hide()
			this.spacer.setWidth("10%")
			this[currentFocus == this ? "focusStart" : "focusEnd"]()
		}
		else
		{
			this.varCountIconsEditGroup.hide()
			this.spacer.setWidth("7%")
			this.varCountMouseEdit.show()
		}
	}
	focusStart()
	{
		if (usingController || keyboardArrows)
		{
			audioHandler.playAudioHookUI("main_menu_options_controller_hover")
			this.setTexture(midGray.fadeTo(.1))
			if (usingController)
				this.varCountControllerEdit.show()
			else if (keyboardArrows)
				this.varCountKeyboardEdit.show()
		}
	}
	focusEnd()
	{
		if (usingController || keyboardArrows)
		{
			this.setTexture(null)
			this.varCountControllerEdit.hide()
			this.varCountKeyboardEdit.hide()
		}
	}
	update()
	{
		let directionalNav = usingController || keyboardArrows
		if ((!directionalNav && this.varCountMouseEdit.hidden) || (directionalNav && this.varCountIconsEditGroup.hidden))
			this.refresh()
	}
	async refreshUIAndSkipToCurrentOption()
	{
		// Keep track of current navigation variables.
		let currentKeyboardArrows = keyboardArrows
		let currentUsingController = usingController
		let lastOptionsCategory = ui.main_menu.options.currentCategory

		// Suspend controls.
		control.suspend(true)

		// Clear focus.
		this.focus = false
		currentFocus = null

		// Refresh UI and fast-forward to current options category.
		await ui.refreshUI(lastOptionsCategory)

		// Reset controller/keyboard arrow status.
		keyboardArrows = currentKeyboardArrows
		usingController = currentUsingController
		if (usingController || keyboardArrows)
			ui.main_menu.options.categories[lastOptionsCategory].options.find(opt => opt.constructor.name == this.constructor.name).takeFocus()

		// Resume controls.
		control.suspend(false)
	}
}

class varEditButton extends Button
{
	constructor(parent)
	{
		super()
			.setRenderMode(renderMode.colorRounded)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setTexture(midGray)
			.setWidth("7%")
			.setHeight(scalePix(40))
		
		this.nextPageButtonText = new Text()
			.setColor(paleYellow)
			.setFont(interfaceIcons)
			.setWidth("100%")
			.setText("?")
			.setTextAlign(textAlign.center)
			.setChildOf(this)

		this.parent = parent
		return this
	}

	focusStart()
	{
		if (!inConfirmPopUp)
			this.setTexture(darkGray)
	}

	focusEnd()
	{
		this.setTexture(midGray)
	}

	pressMouseLeftStart()
	{
		if (!inConfirmPopUp)
		{
			ui.languageSelect.lastFocus = this
			this.focusEnd()
			ui.languageSelect.startIntro(this.parent.gameOrUI, this.parent)
		}
	}
}