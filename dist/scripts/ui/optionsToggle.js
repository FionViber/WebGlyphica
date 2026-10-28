import { Node, Yoga, Text } from 'sphere-runtime'
import { Button } from '../core/button.js'

export class OptionsToggle extends Button
{
	constructor(navigationMenu = null)
	{
		super()
			.setRenderMode(renderMode.color)
			.setTexture(null)
			.setWidth("100%")
			.setHeight(scalePix(70))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)

		this.canVariableDecrease = true
		this.canVariableIncrease = true
		this.ignoreMouse = true
		if (navigationMenu) this.setLeftNext(navigationMenu.main_menu_buttons[2])
		
		this.name = new Text()
			.setFont(regularFontUI())
			.setTextAlign(textAlign.center)
			.setText("name")
			.setWidth("40%")
			.setColor(midGray)
			.setMargin(Yoga.EDGE_RIGHT, 20)
			.setChildOf(this)

		this.varCountMouseLeft = new varChangeButton(this, -1)
			.setChildOf(this)
		
		this.varCountIconsLeftGroup = new Node()
			.setWidth("10%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this)
		
		this.varCountControllerLeft = new Text()
			.setFont(quicktimeFont)
			.setColor(midGray)
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setText(getQuickTimeString([shoulder_trigger_left]))
			.setChildOf(this.varCountIconsLeftGroup)

		this.varCountKeyboardLeft = new Node()
			.setWidth("100%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.varCountIconsLeftGroup)

		this.varCountKeyboardLeftBG = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setWidth(typingFontSmall.height + 30)
			.setHeight(typingFontSmall.height + 10)
			.setTexture(midGray)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this.varCountKeyboardLeft)

		this.varCountKeyboardLeftText = new Text()
			.setColor(paleYellow)
			.setWidth("100%")
			.setHeight(typingFontSmall.height)
			.setFont(typingFontSmall)
			.setTextAlign(textAlign.center)
			.setText("A")
			.setChildOf(this.varCountKeyboardLeftBG)
		
		this.varCountBG = new Node()
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(.2))
			.setWidth("38%")
			.setHeight(scalePix(40))
			.setMargin(Yoga.EDGE_HORIZONTAL, "1%")
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
		
		this.varCountIconsRightGroup = new Node()
			.setWidth("10%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this)

		this.varCountKeyboardRight = new Node()
			.setWidth("100%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.varCountIconsRightGroup)

		this.varCountKeyboardRightBG = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setWidth(typingFontSmall.height + scalePix(30))
			.setHeight(typingFontSmall.height + scalePix(10))
			.setTexture(midGray)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this.varCountKeyboardRight)

		this.varCountKeyboardRightText = new Text()
			.setColor(paleYellow)
			.setWidth("100%")
			.setHeight(typingFontSmall.height)
			.setFont(typingFontSmall)
			.setTextAlign(textAlign.center)
			.setText("S")
			.setChildOf(this.varCountKeyboardRightBG)

		this.varCountControllerRight = new Text()
			.setFont(quicktimeFont)
			.setColor(midGray)
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setText(getQuickTimeString([shoulder_trigger_right]))
			.setChildOf(this.varCountIconsRightGroup)
		
		this.varCountMouseRight = new varChangeButton(this, 1)
			.setChildOf(this)
	}

	pressShoulderTriggerLeftStart() { this.changeVariable(-1) }
	pressShoulderTriggerRightStart() { this.changeVariable(1) }
	pressShoulderButtonLeftStart() { ui.main_menu.options.categoryChange(-1) }
	pressShoulderButtonRightStart() { ui.main_menu.options.categoryChange(1) }
	changeVariable(increment) {}
	refresh()
	{
		if (usingController || keyboardArrows)
		{
			this.varCountControllerLeft.hide()
			this.varCountControllerRight.hide()
			this.varCountKeyboardLeft.hide()
			this.varCountKeyboardRight.hide()
			this.varCountIconsLeftGroup.show()
			this.varCountIconsRightGroup.show()
			if (usingController)
			{
				this.varCountControllerLeft.setText(getQuickTimeString([shoulder_trigger_left]))
				this.varCountControllerRight.setText(getQuickTimeString([shoulder_trigger_right]))
			}
			this.varCountMouseLeft.hide()
			this.varCountMouseRight.hide()
			this[currentFocus == this ? "focusStart" : "focusEnd"]()
		}
		else
		{
			this.varCountIconsLeftGroup.hide()
			this.varCountIconsRightGroup.hide()
			this.varCountMouseLeft.setActive(this.canVariableDecrease)
			this.varCountMouseRight.setActive(this.canVariableIncrease)
			this.varCountMouseLeft.show()
			this.varCountMouseRight.show()
		}
	}
	focusStart()
	{
		if (usingController || keyboardArrows)
		{
			audioHandler.playAudioHookUI("main_menu_options_controller_hover")
			this.setTexture(midGray.fadeTo(.1))
			if (usingController)
			{
				this.varCountControllerLeft.show()
				this.varCountControllerRight.show()
				this.varCountControllerLeft.setColor(this.canVariableDecrease ? midGray : midGray.fadeTo(.3))
				this.varCountControllerRight.setColor(this.canVariableIncrease ? midGray : midGray.fadeTo(.3))
			}
			else if (keyboardArrows)
			{
				this.varCountKeyboardLeft.show()
				this.varCountKeyboardRight.show()
				this.varCountKeyboardLeftBG.setTexture(this.canVariableDecrease ? midGray : midGray.fadeTo(.3))
				this.varCountKeyboardRightBG.setTexture(this.canVariableIncrease ? midGray : midGray.fadeTo(.3))
			}
		}
	}
	focusEnd()
	{
		if (usingController || keyboardArrows)
		{
			this.setTexture(null)
			this.varCountControllerLeft.hide()
			this.varCountControllerRight.hide()
			this.varCountKeyboardLeft.hide()
			this.varCountKeyboardRight.hide()
		}
	}
	update()
	{
		let directionalNav = usingController || keyboardArrows
		if ((!directionalNav && this.varCountMouseLeft.hidden) || (directionalNav && this.varCountIconsLeftGroup.hidden))
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

class varChangeButton extends Button
{
	constructor(parent, increment)
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
			.setFont(typingFontLarge)
			.setWidth("100%")
			.setText(increment > 0 ? "▶" : "◀")
			.setTextAlign(textAlign.center)
			.setChildOf(this)

		this.increment = increment
		this.active = true
		this.parent = parent
		return this
	}

	setActive(active)
	{
		this.active = active
		this.setTexture(active ? midGray : midGray.fadeTo(.3))
	}

	focusStart()
	{
		if (this.active && !inConfirmPopUp)
			this.setTexture(darkGray)
	}

	focusEnd()
	{
		if (this.active)
			this.setTexture(midGray)
	}

	pressMouseLeftStart()
	{
		if (this.active && !inConfirmPopUp)
			this.parent.changeVariable(this.increment)
	}
}