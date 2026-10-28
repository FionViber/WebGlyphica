import { Node, Text, Yoga } from 'sphere-runtime'
import { Button } from '../core/button.js'

export class PageChangeButton extends Node
{
    constructor(direction, validityCheck, action)
    {
		// Base class.
        super()
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		// Variables.
		this.direction = direction
		this.action = action
		this.validityCheck = validityCheck

		// Keyboard.
		this.keyboard = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setWidth(typingFont.height + 30)
			.setHeight(typingFont.height + 10)
			.setTexture(midGray)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this)

		this.keyboardText = new Text()
			.setColor(paleYellow)
			.setWidth("100%")
			.setHeight(typingFont.height)
			.setFont(typingFont)
			.setTextAlign(textAlign.center)
			.setText(direction < 0 ? "Q" : "W")
			.setChildOf(this.keyboard)
        
		// Mouse.
        this.mouse = new MouseButton(this, direction)
            .setChildOf(this)
		
		// Controller.
		this.controller = new Node()
			.setWidth("100%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
            .setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this)

		this.controllerText = new Text()
			.setFont(quicktimeFont)
			.setColor(midGray)
			.setHeight(quicktimeFont.height)
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setText(getQuickTimeString([direction < 0 ? shoulder_button_left : shoulder_button_right]))
			.setChildOf(this.controller)
    }

	isValid()
	{
		return this.validityCheck(this.direction)
	}

	refresh()
	{
		// Enable/Disable button based on validity check.
		this.mouse.refresh()
		this.keyboard.setTexture(this.isValid() ? midGray : midGray.fadeTo(.5))
		this.controllerText.setColor(this.isValid ? midGray : midGray.fadeTo(.5))

		// Hide/show parts depending on control scheme.
		if (usingController)
		{
			this.mouse.hide()
			this.keyboard.hide()
			this.controllerText.setText(getQuickTimeString([this.direction < 0 ? shoulder_button_left : shoulder_button_right]))
			this.controller.show()
		}
		else if (keyboardArrows)
		{
			this.mouse.hide()
			this.keyboard.show()
			this.controller.hide()
		}
		else // Mouse
		{
			this.mouse.show()
			this.keyboard.hide()
			this.controller.hide()
		}
	}

	update()
	{
		if (
			!this.hidden &&
			(
				(!(usingController || keyboardArrows) && this.mouse.hidden) ||
				(usingController && this.controller.hidden) ||
				(keyboardArrows && this.keyboard.hidden)
			)
		)
			this.refresh()
	}
}

class MouseButton extends Button
{
    constructor(parent)
    {
        super()
            .setWidth("100%")
            .setHeight("100%")
            .setRenderMode(renderMode.colorRounded)
            .setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
            .setJustifyContent(Yoga.JUSTIFY_CENTER)
            .setTexture(midGray)
        
        this.text = new Text()
            .setWidth("100%")
            .setHeight(typingFontLarge.height)
            .setFont(typingFontLarge)
            .setText(parent.direction > 0 ? "▶" : "◀")
            .setColor(paleYellow)
            .setTextAlign(textAlign.center)
            .setChildOf(this)
		
		this.parent = parent
    }

	focusStart() { if (this.parent.isValid()) this.setTexture(secondColor) }
	focusEnd() { this.setTexture(this.parent.isValid() ? midGray : midGray.fadeTo(.5)) }
	refresh() { this.setTexture(this.parent.isValid() ? this.focus ? secondColor : midGray : midGray.fadeTo(.5)) }
	pressMouseLeftStart() { if (this.parent.isValid()) this.parent.action(this.parent.direction) }
	pressButtonBottomStart() { if (this.parent.isValid()) this.parent.action(this.parent.direction) }
}