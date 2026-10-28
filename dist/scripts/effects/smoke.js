import { Random, Easing } from 'sphere-runtime'
import { Entity } from '../core/entityFactory.js'
import { FastTween } from '../core/fastTween.js'

export class Smoke extends Entity
{
	constructor()
	{
		super()
		this.smokeClouds = []
		this.flareTween = new FastTween(Easing.Linear)
		for (let i = 0; i < 5; i++)
			this.smokeClouds.push({
				startFading: false,
				position: null,
				velocity: null,
				size: scalePix(1),
				opacity: 0,
				tween: new FastTween,
			})
	}

	reset(position, scale = 1)
	{
		this.scale = scale
		this.flareSize = 0
		this.flarePosition = position
		this.flareTween.easeIn([0], [scalePix(10) * scale], t => this.flareSize = t[0], 15)
			.then(() => this.flareTween.easeOut([scalePix(10) * scale], [0], t => this.flareSize = t[0], 15))
		this.smokeClouds.forEach(cloud => {
			cloud.startFading = false
			cloud.position = position
			cloud.velocity = Vector.rotate({x: scalePix(Random.uniform(.4, .1)), y: 0}, Random.uniform(0, Math.PI))
			cloud.size = scalePix(Random.discrete(10, 20) * scale)
			cloud.opacity = 0
			cloud.tween.easeIn([0], [1], t => cloud.opacity = t[0], 15)
				.then(() => cloud.startFading = true)
		})
	}

	on_update()
	{
		if (this.smokeClouds.every(cloud => cloud.startFading && cloud.opacity <= 0))
			this.suspend()
		else
			this.smokeClouds.forEach(cloud => {
				if (cloud.startFading && cloud.opacity > 0)
				{
					cloud.position = Vector.add(cloud.position, cloud.velocity)
					cloud.opacity -= 0.02
					cloud.size += scalePix(1) * this.scale
				}
			})
	}

	on_render()
	{
		this.smokeClouds.forEach(cloud => {
			PrimNative.drawFilledCircle(Surface.Screen, cloud.position.x, cloud.position.y, cloud.size, midGray.fadeTo(.2 * cloud.opacity))
		})
		if (this.flareSize >= 0) PrimNative.drawFilledCircle(Surface.Screen, this.flarePosition.x, this.flarePosition.y, this.flareSize, paleYellow)
	}
}