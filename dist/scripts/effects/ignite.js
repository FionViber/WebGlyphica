import { Easing, Random } from 'sphere-runtime'
import { Entity } from '../core/entityFactory.js'
import { FastTween } from '../core/fastTween.js'

export class IgniteEffect extends Entity
{
	constructor()
	{
		super()

		// Create fire.
		this.fire = []
		for (let i = 0; i < 4; i++)
		{
			this.fire.push({
				active: false,
				position: {x: 0, y: 0},
				size: 1,
				tween: new FastTween(Easing.Linear)
			})
		}

		// Create smoke clouds.
		this.smokeClouds = []
		for (let i = 0; i < 5; i++)
		{
			this.smokeClouds.push({
				active: false,
				position: {x: 0, y: 0},
				opacity: 1,
				size: 1,
				tween: new FastTween(Easing.Linear)
			})
		}
	}

	reset(parent, size)
	{
		this.terminate = false
		this.parent = parent
		this.maxSize = size
		this.spawnSmoke()
		this.spawnFire()
		this.resume()
	}

	spawnSmoke()
	{
		let smoke = this.smokeClouds.find(smoke => !smoke.active)
		if (smoke)
		{
			let parentPos = this.parent.getPosition()
			smoke.position.x = parentPos.x
			smoke.position.y = parentPos.y
			smoke.size = 1
			smoke.opacity = .5
			let maxSize = Random.uniform(this.maxSize * 3, this.maxSize * .5)
			smoke.tween.easeIn(
				[parentPos.x, parentPos.y, 1, .5],
				[parentPos.x + Random.uniform(0, maxSize / 2), parentPos.y - maxSize * .66, maxSize, 0],
				t => {
					smoke.position.x = t[0]
					smoke.position.y = t[1]
					smoke.size = t[2]
					smoke.opacity = t[3]
				}, 60)
					.then(() => {
						smoke.active = false
						this.checkIfCanSuspend()
					})
			smoke.active = true
		}
		if (this.conditionsMet())
			Sphere.sleep(10).then(() => this.spawnSmoke())
	}

	spawnFire()
	{
		let flame = this.fire.find(flame => !flame.active)
		if (flame)
		{
			let parentPos = this.parent.getPosition()
			flame.position.x = Random.uniform(parentPos.x, Math.ceil(this.maxSize / 2))
			flame.position.y = parentPos.y
			flame.size = 1
			let maxSize = this.maxSize / 2
			flame.tween.easeIn(
				[parentPos.y, 1],
				[parentPos.y - maxSize, maxSize],
				t => {
					flame.position.y = t[0]
					flame.size = t[1]
				},
				5).then(() => {
					flame.tween.easeOut(
						[parentPos.y - maxSize, maxSize],
						[parentPos.y - maxSize * 2, 1],
						t => {
							flame.position.y = t[0],
							flame.size = t[1]
						},
						15).then(() => {
							flame.active = false
							this.checkIfCanSuspend()
						})
				})
			flame.active = true
		}
		if (this.conditionsMet())
			Sphere.sleep(10).then(() => this.spawnFire())
	}

	conditionsMet()
	{
		return !this.terminate && this.parent && this.parent.running
	}

	checkIfCanSuspend()
	{
		if (!this.conditionsMet() && !this.fireActive && this.smokeClouds.reduce((total, current) => total + current.active, 0) == 0)
			this.suspend()
	}

	on_renderStart()
	{
		for (const smoke of this.smokeClouds)
			if (smoke.active)
				PrimNative.drawFilledCircle(Surface.Screen, smoke.position.x, smoke.position.y, smoke.size, midGray.fadeTo(smoke.opacity))
	}

	on_renderEnd()
	{
		for (const flame of this.fire)
			if (flame.active)
				PrimNative.drawFilledCircle(Surface.Screen, flame.position.x, flame.position.y, flame.size, paleYellow)
	}
}