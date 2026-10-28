import { Random } from 'sphere-runtime'
import { Entity } from '../core/entityFactory.js'
import { FastTween } from '../core/fastTween.js'

export class BleedEffect extends Entity
{
	constructor()
	{
		super()
		this.droplets = []
		for (let i = 0; i < 4; i++)
		{
			this.droplets.push({
				active: false,
				position: {x: 0, y: 0},
				opacity: 1,
				size: scalePix(1),
				opacityTween: new FastTween(),
				moveTween: new FastTween()
			})
		}
	}

	reset(parent, width)
	{
		this.terminate = false
		this.parent = parent
		this.width = width
		this.spawnDroplet()
		this.resume()
	}

	spawnDroplet()
	{
		let drop = this.droplets.find(drop => !drop.active)
		if (drop)
		{
			drop.position.x = Random.uniform(this.parent.getPosition().x, this.width)
			drop.position.y = this.parent.getPosition().y
			drop.size = Random.discrete(1, this.width * 2/3)
			let endPt = Vector.add(drop.position, Vector.create(0, this.width * 5))
			drop.moveTween.easeIn([drop.position.x, drop.position.y], [endPt.x, endPt.y], (t) => { drop.position.x = t[0]; drop.position.y = t[1] }, 30)
			drop.opacityTween.easeIn([1], [0], (t) => {drop.opacity = t[0]}, 30)
				.then(() => {
					drop.active = false
					this.checkIfCanSuspend()
				})
			drop.active = true
		}
		if (this.conditionsMet())
			Sphere.sleep(5).then(() => this.spawnDroplet())
	}

	conditionsMet()
	{
		return !this.terminate && this.parent && this.parent.running
	}

	checkIfCanSuspend()
	{
		if (!this.conditionsMet() && this.droplets.reduce((total, current) => total + current.active, 0) == 0)
			this.suspend()
	}

	on_render()
	{
		this.droplets.forEach((drop, i) => {
			if (drop.active)
				PrimNative.drawFilledCircle(Surface.Screen, drop.position.x, drop.position.y, drop.size, midGray.fadeTo(drop.opacity))
		})
	}
}