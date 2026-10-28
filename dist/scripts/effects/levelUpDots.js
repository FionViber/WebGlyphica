import { Random } from 'sphere-runtime'
import { Entity } from '../core/entityFactory.js'
import { FastTween } from '../core/fastTween.js'
import { Fireworks } from './fireworks.js'
import { Impact } from './impact.js'

export class LevelUpDots extends Entity
{
	constructor()
	{
		super()
		this.count = 20
		this.trailLength = 3
		this.distanceTween = new FastTween()
		this.endPromise
	}

	reset(position)
	{
		let maxDistance = Vector.magnitude(Vector.sub({x: Surface.Screen.width, y: Surface.Screen.height}, position))
		this.position = position
		this.distance = this.lastDistance = maxDistance
		audioHandler.playAudioHookUI("level_up")
		this.endPromise = this.distanceTween.easeIn([maxDistance], [0], (t) => {
			this.lastDistance = this.distance
			this.distance = t[0]
		}, 40).then(() => {
			for (let i = 0; i < 15; i++)
				factory.spawn(Fireworks, position.x, position.y, null, scalePix(Random.uniform(20, 5)))
			factory.spawn(Impact, position.x, position.y, midGray, scalePix(40))
			this.suspend()
		})
	}

	on_render()
	{
		let increment = (this.lastDistance - this.distance) / 3
		for (let k = 0; k < this.trailLength; k++)
		{
			let point = {x: this.distance + (increment * k), y: 0}
			let color = midGray.fadeTo(1 - (k * .3))
			for (let i = 0; i < Math.PI * 2; i += (Math.PI * 2) / this.count)
			{
				let subPoint = Vector.add(Vector.rotate(point, i), this.position)
				PrimNative.drawFilledCircle(Surface.Screen, subPoint.x, subPoint.y, scalePix(5), color)
			}
		}
	}
}