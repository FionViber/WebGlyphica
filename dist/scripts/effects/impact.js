import { Easing } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { Entity } from '../core/entityFactory.js'

export class Impact extends Entity
{
	constructor()
	{
		super()
		this.tween = new FastTween(Easing.Linear)
	}

	reset(x, y, color = midGray, expansion = scalePix(1))
	{
		this.radius = scalePix(1)
		this.thickness = scalePix(1)
		this.x = x
		this.y = y
		this.color = color
		this.expansion = expansion

		// Setup the tween.
		this.tween.easeIn([this.thickness], [scalePix(10)], (t) => this.thickness = t[0], 10)
			.then(() => {
				this.tween.easeOut([this.thickness], [1], (t) => this.thickness = t[0], 10)
				.then(() => {
					this.suspend()
				})
			})
	}

	on_update()
	{
		this.radius += this.expansion
	}

	on_render()
	{
		PrimNative.drawCircle(Surface.Screen, this.x, this.y, this.radius, this.thickness, this.color)
	}
}