import { Random } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { Entity } from '../core/entityFactory.js'

export class Debris extends Entity
{
	constructor() {
		super()
		this.position = Vector.create(0, 0)
		this.tween = new FastTween()
	}

	reset(x, y, angle = null, speed = null)
	{
		// Save variables.
		this.position.x = x
		this.position.y = y

		// Randomize movement.
		let direction = angle ? angle : Random.uniform(Math.PI, Math.PI)
		this.velocity = Vector.mult(Vector.create(Math.cos(direction), Math.sin(direction)), speed ? speed : scalePix(Random.uniform(2, 1.75)))
		this.rotation = Random.uniform(180, 180)

		// Randomize inital scale.
		this.scale = scalePix(Random.uniform(3, 1))
		this.on_update()

		// Setup tween.
		this.tween.easeIn([this.scale], [this.scale * 2], (t) => this.scale = t[0], 10)
			.then(() => {
				this.tween.easeOut([this.scale], [0], (t) => this.scale = t[0], 30)
					.then(() => this.suspend())
			})
	}

	on_update()
	{
		// Update movement.
		this.position = Vector.add(this.position, this.velocity)
		this.rotation += 5
	}

	on_render()
	{
		// Update transform.
		debrisModel.transform.identity()
		debrisModel.transform.scale(this.scale, this.scale)
		debrisModel.transform.rotate(this.rotation)
		debrisModel.transform.translate(this.position.x, this.position.y)
		debrisModel.draw(Surface.Screen)
	}
}