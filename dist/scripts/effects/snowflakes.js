import { Easing, Random } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { Entity } from '../core/entityFactory.js'

export class Snowflakes extends Entity
{
	constructor()
	{
		super()
		this.position = {x: 0, y: 0}
		this.flakes = []
		for (let i = 0; i < 5; i++)
		{
			let flake = {
				active: false,
				position: {x: 0, y: 0},
				rotation: 0,
				currentScale: 0,
				maxScale: 0
			}
			flake.sineTween = new FastTween()
			flake.linearTween = new FastTween(Easing.Linear)
			flake.moveTween = new FastTween()
			this.flakes.push(flake)
		}
	}

	reset(target, terminate = true)
	{
		this.terminate = terminate
		let targetPos = target.getPosition()
		this.position.x = targetPos.x
		this.position.y = targetPos.y
		this.target = target
		this.flakes.forEach(flake => flake.active = false)
		this.spawnSnowflake()
	}

	spawnSnowflake()
	{
		let flake = this.flakes.find(flake => !flake.active)
		if (flake)
		{
			flake.position.x = Random.uniform(this.position.x, scalePix(25))
			flake.position.y = this.position.y - scalePix(25)
			flake.rotation = Random.uniform(180, 180)
			flake.currentScale = .1
			flake.maxScale = Random.uniform(7, 5)
			let endPt = Vector.add(flake.position, Vector.create(0, scalePix(Random.uniform(50, 30))))
			flake.moveTween.easeOut([flake.position.x, flake.position.y], [endPt.x, endPt.y], (t) => { flake.position.x = t[0]; flake.position.y = t[1] }, 60)
			flake.sineTween.easeOut([flake.currentScale], [flake.maxScale], (t)=>{flake.currentScale = t[0]}, 5)
				.then(() => {
					Sphere.sleep(30)
						.then(() => {
							flake.linearTween.easeOut([flake.currentScale], [0.1], (t) => flake.currentScale = t[0], 25)
								.then(() => {
									flake.active = false
									this.checkIfCanSuspend()
								})
						})
				})
			flake.active = true
		}
		if (this.conditionsMet())
			Sphere.sleep(15).then(() => this.spawnSnowflake())
	}

	conditionsMet()
	{
		return this.target && this.target.running && (powerup_freeze || !this.terminate)
	}

	checkIfCanSuspend()
	{
		if (!this.conditionsMet() && this.flakes.reduce((total, current) => total + current.active, 0) == 0)
			this.suspend()
	}

	on_update()
	{
		this.flakes.forEach((flake) => {
			if (flake.active)
				flake.rotation++
		})
	}

	on_render()
	{
		this.flakes.forEach((flake) => {
			if (flake.active)
			{
				snowflakeModel.transform.identity()
				snowflakeModel.transform.scale(flake.currentScale, flake.currentScale)
				snowflakeModel.transform.rotate(flake.rotation)
				snowflakeModel.transform.translate(flake.position.x, flake.position.y)
				snowflakeModel.draw(Surface.Screen)
			}
		})
	}
}

export class SnowflakesLocal extends Snowflakes
{
	constructor() { super() }
	reset(target)
	{
		let pos = target.getPosition()
		super.reset(pos.x, pos.y, target)
		this.terminate = false
	}

	conditionsMet()
	{
		return !this.terminate && this.target && this.target.running
	}
}