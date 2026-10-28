import { Easing } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { Entity } from '../core/entityFactory.js'

export class Announcer extends Entity
{
	constructor()
	{
		super()
		this.tween = new FastTween(Easing.Linear)
		this.bgTween = new FastTween(Easing.Linear)
		this.endPromise
	}

	reset(text, subtitle = "", instructions = "", boss = false)
	{
		// Set Text.
		ui.announcerNode.title.setText("")
		ui.announcerNode.title.setWidth(titleFontUI().widthOf(text))
		ui.announcerNode.subtitle.setText(subtitle)
		ui.announcerNode.instructions.setText(instructions)

		// Set colors.
		let textColor
		ui.announcerNode.setTexture(bgColor.fadeTo(0))
		if (boss)
		{
			textColor = paleYellow
			ui.announcerNode.subtitle.setColor(textColor.fadeTo(0))
			ui.announcerNode.title.setColor(textColor)
			ui.announcerNode.infoIcon.setColor(textColor.fadeTo(0))
			ui.announcerNode.instructionsBox.setTexture(bgColor.fadeTo(0))
			ui.announcerNode.instructions.setColor(textColor.fadeTo(0))
			ui.announcerNode.pressAnyButtonToContinue.setColor(textColor.fadeTo(0))
			this.bgTween.easeIn([0], [1], t => ui.announcerNode.setTexture(bgColor.fadeTo(t[0])), 40)
			ui.announcerNode.instructionsBox.show()
		}
		else
		{
			textColor = midGray
			ui.announcerNode.subtitle.setColor(midGray.fadeTo(0))
			ui.announcerNode.title.setColor(midGray)
			ui.announcerNode.instructionsBox.hide()
		}

		// Show node.
		ui.announcerNode.show()
		
		// Handle UI animations.
		this.endPromise = new Promise(resolve => {
			this.tween.easeIn([0, 0], [text.length, 1], t => {
				ui.announcerNode.title.setText(text.slice(0, Math.round(t[0])))
				ui.announcerNode.subtitle.setColor(textColor.fadeTo(t[1]))
			}, 60)
				.then(() => {
					if (boss)
					{
						this.tween.easeIn([0], [1], t => {
							ui.announcerNode.infoIcon.setColor(textColor.fadeTo(t[0] * .3))
							ui.announcerNode.instructionsBox.setTexture(bgColorOpaque.fadeTo(t[0]))
							ui.announcerNode.instructions.setColor(textColor.fadeTo(t[0]))
							ui.announcerNode.pressAnyButtonToContinue.setColor(textColor.fadeTo(t[0] * .3))
						}, 30)
							.then(() => {
								control.anyButtonPressed = false
								let listenForInput = function(announcer)
								{
									if (control.anyButtonPressed)
										announcer.startExtro(true)
											.then(() => resolve())

									else Sphere.sleep(1)
										.then(() => listenForInput(announcer))
								}
								listenForInput(this)
							})
					}
					else Sphere.sleep(60)
						.then(() => this.startExtro()
							.then(() => resolve()))
				})
		})
	}

	startExtro(boss = false)
	{
		let textColor = ui.announcerNode.title.color
		let promise = this.tween.easeIn([1], [0], t => {
			ui.announcerNode.subtitle.setColor(textColor.fadeTo(t[0]))
			ui.announcerNode.title.setColor(textColor.fadeTo(t[0]))
			if (boss)
			{
				ui.announcerNode.setTexture(bgColor.fadeTo(t[0]))
				ui.announcerNode.infoIcon.setColor(textColor.fadeTo(t[0] * .3))
				ui.announcerNode.instructionsBox.setTexture(bgColorOpaque.fadeTo(t[0]))
				ui.announcerNode.instructions.setColor(textColor.fadeTo(t[0]))
				ui.announcerNode.pressAnyButtonToContinue.setColor(textColor.fadeTo(t[0] * .3))
			}
		}, 30)
		promise.then(() => {
			this.listenForInput = null
			ui.announcerNode.hide()
			this.suspend()
		})
		return promise
	}
}