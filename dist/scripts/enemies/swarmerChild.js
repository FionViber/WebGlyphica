import { Random } from 'sphere-runtime'
import { Entity } from '../core/entityFactory.js'
import { SwarmerChildActive } from './swarmerChildActive.js'

export class SwarmerChild extends Entity
{
	constructor()
	{
		super()
		this.rotationSpeed = 0.13
		this.canSpawnPowerups = false
	}

	reset(x, y, parent)
	{
		this.orbitSpeed = scalePix(Random.uniform(5.3, 0.7))
		this.parent = parent
		this.orbitOffset = Vector.create(scalePix(Random.uniform(0, 20)), scalePix(Random.uniform(0, 20)))
		this.position = Vector.create(x, y)
		this.rotation = Random.uniform(Math.PI, Math.PI)
		this.velocity = 0
	}

	on_update()
	{
		if (!isPaused() && !powerup_freeze)
		{
			// Get angle to destination.
			let direction = Vector.sub(Vector.add(this.parent.body.position, this.orbitOffset), this.position)
			let angle = Math.atan2(direction.y, direction.x)

			// Rotate (pick whatever direction is closer).
			let difference = diff(this.rotation, angle)
			if (Math.abs(difference) > this.rotationSpeed)
				this.rotation += Math.sign(difference) * this.rotationSpeed
			else
				this.rotation = angle

			// Determine velocity.
			this.velocity = Vector.mult(
				Vector.create(
					Math.cos(this.rotation),
					Math.sin(this.rotation)
				),
				this.orbitSpeed
			)

			// Move.
			this.position = Vector.add(this.position, this.velocity)
		}
	}

	spawnActive()
	{
		factory.spawn(SwarmerChildActive, this.position.x, this.position.y, this.velocity, this.rotation)
	}

	on_render()
	{
		swarmerChildModel.transform.identity()
		swarmerChildModel.transform.translate(this.position.x, this.position.y)
		swarmerChildModel.draw(Surface.Screen)
	}
}