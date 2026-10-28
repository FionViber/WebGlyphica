import { Entity } from '../core/entityFactory.js'
import { Random } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'

export class Sparks extends Entity
{
	constructor() {
		super()
		this.position = Vector.create(0, 0)
		this.lastPosition
		this.lastLastPosition
		this.tween = new FastTween()
	}

	reset(x, y, angle = null, speed = null)
	{
		// Save variables.
		this.lastPosition = this.lastLastPosition = this.position = {x: x, y: y}

		// Randomize movement.
		this.direction = angle ? angle : Random.uniform(Math.PI, Math.PI)
		speed = speed ? speed : scalePix(Random.uniform(7, 4))
		this.velocity = Vector.mult(Vector.create(Math.cos(this.direction), Math.sin(this.direction)), speed)

		// Setup tween.
		this.tween.easeIn([this.velocity.x, this.velocity.y], [0, 0], (t) => {this.velocity.x = t[0]; this.velocity.y = t[1]}, 15)
			.then(() => this.suspend())

		// Start task.
		this.resume()
	}

	on_update()
	{
		this.lastLastPosition = this.lastPosition
		this.lastPosition = this.position
		this.position = Vector.add(this.position, this.velocity)
	}

	on_render()
	{
		PrimNative.drawLine(Surface.Screen, this.position.x, this.position.y, this.lastLastPosition.x, this.lastLastPosition.y, scalePix(3), midGray)
	}
}