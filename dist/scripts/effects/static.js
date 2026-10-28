import { Easing } from 'sphere-runtime'
import { Entity } from '../core/entityFactory.js'
import { FastTween } from '../core/fastTween.js'
import { DrawLightning } from './drawLightning.js'

export class StaticEffect extends Entity
{
	constructor()
	{
		super()
		this.effectAngle = Math.PI / 4
		this.tween = new FastTween(Easing.Linear)
	}

	reset(parent, size)
	{
		this.radiusVector = {x: size * 2, y: 0}
		this.pt1 = 0
		this.pt2 = 0
		this.parent = parent
		this.terminate = false
		this.startEffect()
		this.resume()
	}

	startEffect()
	{
		this.tween.easeIn([0], [Math.PI], (t) => {
			if (this.parent && this.parent.running)
			{
				this.pt1 = Vector.add(Vector.rotate(this.radiusVector, this.effectAngle + t[0]), this.parent.getPosition())
				this.pt2 = Vector.add(Vector.rotate(this.radiusVector, this.effectAngle - t[0]), this.parent.getPosition())
			}
		}, 40)
			.then(() => {
				if (!this.terminate && this.parent && this.parent.running)
					this.startEffect()
				else
				{
					this.parent = null
					this.suspend()
				}
			})
	}

	on_renderStart()
	{
		if (this.parent && this.parent.running && this.pt1 && this.pt2)
			DrawLightning(this.pt1, this.pt2)
	}
}