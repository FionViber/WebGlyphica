import { Random, Matter } from 'sphere-runtime'
import { calcRandomInboundsDistance } from './enemyMovement.js'
import { Enemy } from './enemy.js'
import { SwarmerChild } from './swarmerChild.js'

export class Swarmer extends Enemy
{
	static getName() { return localize("enemy_swarmer_title") }
	static getDesc() { return localize("enemy_swarmer_desc") }
	static isElite() { return true }

	constructor()
	{
		super(scalePix(22))

		this.isInBounds = false

		// Define consts.
		this.isElite = true
		this.experience = 40
		this.wordOffset = scalePix(50)
	}

	reset(threat)
	{
		// Call superclass reset.
		super.reset(threat)

		// Reset vars.
		this.speed = scalePix(Random.uniform(0.8, 0.3))
		this.setHealth(2000)
		this.isInBounds = false

		// First destination.
		let direction = Vector.normalise(Vector.sub(this.body.position, screenCenter))
		this.destination = calcRandomInboundsDistance(direction, scalePix(500), scalePix(750))
		this.velocity = Vector.mult(direction, -1 * this.speed)
		this.atDestination = false

		// Cooldown.
		this.cooldown = 400
		this.currentCooldown = Random.discrete(50, 100)

		// Spawn children.
		for (let i = 0; i < 10; i++)
			this.children.push (
				factory.spawn (
					SwarmerChild,
					Random.uniform(this.body.position.x, scalePix(5)),
					Random.uniform(this.body.position.y, scalePix(5)),
					this
				)
			)
	}

	update()
	{
		// Movement.
		if (!this.atDestination)
		{
			if (distanceBetween(this.body.position, this.destination) > this.speed)
				Matter.Body.setPosition(this.body, Vector.add(this.body.position, this.velocity))
			else
			{
				this.atDestination = true
				Matter.Body.setPosition(this.body, this.destination)
			}
		}

		// Check if on-screen.
		this.isInBounds = Matter.Bounds.overlaps(this.body.bounds, screenBounds)

		// Shooting.
		if (this.currentCooldown <= 0)
		{
			let jar = [...this.children]
			for (let i = 0; i < Random.discrete(2, 3); i++)
			{
				let chosen = Random.sample(jar)
				chosen.spawnActive()
				jar = jar.filter(v => v != chosen)
			}
			this.currentCooldown = this.cooldown
		}
		else if (this.atDestination)
		{
			this.currentCooldown -= 1
		}
	}

	on_render()
	{
		if (this.isInBounds)
		{
			if (this.active)
			{
				swarmerModel.transform.identity()
				swarmerModel.transform.translate(this.body.position.x, this.body.position.y)
				swarmerModel.draw(Surface.Screen)
			}
			this.renderWordAndHealth()
		}
	}
}