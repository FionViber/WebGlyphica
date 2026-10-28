import { Easing } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { Entity } from '../core/entityFactory.js'

export class Damage extends Entity
{
	constructor()
	{
		super()
		this.tweenSine = new FastTween()
		this.tweenLinear = new FastTween(Easing.Linear)
	}

	reset(x, y, damage, isCrit = false, localizeFont = false, maxOpacity = false)
	{
		// Set vars.
		this.font = localizeFont ? regularFontUI() : isCrit ? critFont : typingFont
		this.damage = isNaN(damage) ? damage : Math.round(damage).toString()
		this.xOffset = this.font.widthOf(this.damage) / 2
		this.x = x
		this.y = y
		this.alpha = isCrit || maxOpacity ? 1 : .5
		this.on_update();

		this.tweenSine.easeOut([this.y], [this.y - scalePix(100)], (t) => this.y = t[0], 5)
			.then(() => {
				this.tweenLinear.easeOut([this.y, this.alpha], [this.y - 60, 0], (t) => { this.y = t[0]; this.alpha = t[1] }, 30)
					.then(() => this.suspend())
			})
	}

	on_render()
	{
		this.font
			.drawText (
				Surface.Screen,
				this.x - this.xOffset,
				this.y,
				this.damage,
				midGray.fadeTo(this.alpha)
			)
	}
}