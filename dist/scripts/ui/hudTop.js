import { Node, Yoga, Text } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'

export class HUDTop extends Node
{
	constructor()
	{
		super()
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
		
		// Boss countdown subtitle.
		this.hud_boss_subtitle = new Node()
			.setRenderMode(renderMode.color)
			.setTexture(midGray)
			.setWidth(smallFont().widthOf(localize("boss_incoming_in")) + scalePix(30))
			.setHeight(smallFont().height)
			.setChildOf(this)
		
		this.hud_boss_subtitle_text = new Text()
			.setFont(smallFont())
			.setColor(paleYellow)
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setText(localize("boss_incoming_in"))
			.setChildOf(this.hud_boss_subtitle)
		
		// Time.
		this.hud_time = new Text()
			.setFont(timerFont)
			.setColor(midGray)
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setText("00:00:00")
			.setChildOf(this)
		
		// Destroy the boss.
		this.hud_destroyTheBoss = new Node()
			.setWidth("100%")
			.setHeight(timerFont.height + smallFont().height)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this)
			.hide()

		this.hud_destroyTheBoss_text = new Text()
			.setFont(titleFontUI())
			.setColor(midGray)
			.setWidth("100%")
			.setTextAlign(textAlign.center)
			.setText(localize("destroy_the_boss"))
			.setChildOf(this.hud_destroyTheBoss)
		
		// Level.
		this.hud_level = new Text()
			.setFont(regularFontUI())
			.setWidth("100%")
			.setHeight(regularFontUI().height)
			.setColor(midGray)
			.setTextAlign(textAlign.center)
			.setChildOf(this)
		
		Sphere.sleep(0).then(() => {
			this.hidingPosition = -this.getComputedHeight() - scalePix(20)
			this.animYOffset = this.hidingPosition
		})
		this.countdownMax = missionCountdown / 3600 * 60000
		this.tween = new FastTween()
		this.active = false
	}

	startIntro()
	{
		this.active = true
		this.countDownPlayed = 10
		return this.tween.easeOut([this.animYOffset], [0], t => this.animYOffset = t[0], 30)
	}

	startExtro()
	{
		let promise = this.tween.easeOut([this.animYOffset], [this.hidingPosition], t => this.animYOffset = t[0], 30)
		promise.then(() => {
				this.active = false
				this.hud_destroyTheBoss.hide()
				this.hud_time.show()
			})
		return promise
	}

	update()
	{
		if (this.active && !isPaused())
		{
			if (missionMode)
			{
				if (this.countdownMax - timeElapsed > 0)
				{
					let secondsLeft = Math.floor((this.countdownMax - timeElapsed) / 1000)
					if (secondsLeft <= this.countDownPlayed)
					{
						audioHandler.playAudioHookUI("boss_countdown_" + this.countDownPlayed)
						this.countDownPlayed--
					}
					this.hud_time.setText(timeToString(this.countdownMax - timeElapsed))
				}
				else if (this.hud_destroyTheBoss.hidden)
				{
					audioHandler.playAudioHookUI("boss_appear")
					this.hud_destroyTheBoss.show()
					this.hud_boss_subtitle.hide()
					this.hud_time.hide()
				}
			}
			else this.hud_time.setText(timeToString(timeElapsed))
		}
	}

	render(surface, xOffset = 0, yOffset = 0)
	{
		super.render(surface, xOffset, yOffset)
		if (omenLevel > -2)
			drawProgress (
				screenCenter.x - scalePix(84),
				this.getComputedHeight() + scalePix(10) + this.animYOffset,
				scalePix(168),
				scalePix(10),
				currentExperience / expToNextLevel,
				false
			)
	}
}