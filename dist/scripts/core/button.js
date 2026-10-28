import { Node, Matter } from 'sphere-runtime'

export class Button extends Node
{
	constructor()
	{
		super()
		this.focus = false
		this.pressed = false
		this.press = false
		this.xOffset = 0
		this.yOffset = 0
		this.defaultFocus = false
		this.topNext = null
		this.disabled = false
		this.bottomNext = null
		this.rightNext = null
		this.leftNext = null
		this.ignoreMouse = false
		return this
	}

	update()
	{
		if (!this.isHidden() && !this.animating && !this.disabled)
		{
			// If using controller.
			if (usingController || keyboardArrows)
			{
				// Take initial focus if default focus.
				if (currentFocus == null
					&& this.defaultFocus
					&& !this.focus
				)
					this.takeFocus()
				
				if (currentFocus != this && this.focus)
				{
					this.focus = false
					this.focusEnd()
				}
			}

			// Else if keyboard/mouse.
			else if (!this.ignoreMouse)
			{
				// If just coming over from controller, turn off focus if not mouseover'ed.
				if (currentFocus == this && !this.focus)
				{
					currentFocus = null
					this.focusEnd()
				}

				// Check hovering status.
				let mouseOver = (
					Mouse.Default.x > this.xOffset + this.getComputedLeft() &&
					Mouse.Default.x < this.xOffset + this.getComputedLeft() + this.getComputedWidth() &&
					Mouse.Default.y > this.yOffset + this.getComputedTop() &&
					Mouse.Default.y < this.yOffset + this.getComputedTop() + this.getComputedHeight()
				)
				if (!this.focus && mouseOver)
				{
					this.focus = true
					this.focusStart()
				}
				else if (this.focus && !mouseOver)
				{
					if (this.pressed)
					{
						this.pressed = false
						this.pressMouseLeftEnd()
					}
					this.focus = false
					this.focusEnd()
				}

				// If hovering, check pressed status.
				if (this.focus)
				{
					if (!this.pressed && Mouse.Default.getEvent().key == MouseKey.Left)
					{
						this.pressed = true
						this.pressMouseLeftStart()
					}
					else if (this.pressed && !Mouse.Default.isPressed(MouseKey.Left))
					{
						this.pressed = false
						this.pressMouseLeftEnd()
					}
				}
			}
		}
	}

	takeFocus()
	{
		currentFocus = this
		this.focusStart()
	}

	// Setters controller focus changes.
	setDefault() { this.defaultFocus = true; return this }
	setTopNext(next) { this.topNext = next; return this }
	setBottomNext(next) { this.bottomNext = next; return this }
	setLeftNext(next) { this.leftNext = next; return this }
	setRightNext(next) { this.rightNext = next; return this }

	// Callback event focus change is triggered.
	selectTop() { if (this.topNext && !this.topNext.hidden) { this.topNext.takeFocus(); this.focusEnd() } }
	selectBottom() { if (this.bottomNext && !this.bottomNext.hidden) { this.bottomNext.takeFocus(); this.focusEnd() } }
	selectLeft() { if (this.leftNext && !this.leftNext.hidden) { this.leftNext.takeFocus(); this.focusEnd() } }
	selectRight() { if (this.rightNext && !this.rightNext.hidden) { this.rightNext.takeFocus(); this.focusEnd() } }

	render(surface, xOffset = 0, yOffset = 0)
	{
		super.render(surface, xOffset, yOffset)
		this.xOffset = xOffset
		this.yOffset = yOffset
	}

	// Focus events.
	focusStart() {}
	focusEnd() {}

	// Mouse Button Events.
	pressMouseLeftStart() {}
	pressMouseLeftEnd() {}

	// TODO: Right mouse button events. Not required for Glyphica.
	// pressMouseRightStart() {}
	// pressMouseRightEnd() {}

	// Controller events.
	pressButtonTopStart() {}
	pressButtonBottomStart() {}
	pressButtonLeftStart() {}
	pressButtonRightStart() {}
	pressStickDownLeftStart() {}
	pressStickDownRightStart() {}
	pressShoulderButtonLeftStart() {}
	pressShoulderButtonRightStart() {}
	pressShoulderTriggerLeftStart() {}
	pressShoulderTriggerRightStart() {}

	// TODO: Button press end events. Not required for Glyphica.
	// pressButtonTopEnd() {}
	// pressButtonBottomEnd() {}
	// pressButtonLeftEnd() {}
	// pressButtonRightEnd() {}
	// pressStickDownLeftEnd() {}
	// pressStickDownRightEnd() {}
	// pressShoulderButtonLeftEnd() {}
	// pressShoulderButtonRightEnd() {}
	// pressShoulderTriggerLeftEnd() {}
	// pressShoulderTriggerRightEnd() {}
}