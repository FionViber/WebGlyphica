import { Matter } from 'sphere-runtime'
import { Enemy } from './enemy.js'
import { Impact } from '../effects/impact.js'

export class SwarmerChildActive extends Enemy
{
	constructor()
	{
		// Superclass constructor.
		super(scalePix(7))

		// Define constants.
		this.speed = scalePix(1)
		this.damage = 20
	}

	reset(x, y, velocity, rotation)
	{
		// Superclass reset.
		super.reset()

		// Set vars.
		Matter.Body.setPosition(this.body, {x: x, y: y})
		this.rotation = rotation
		this.velocity = velocity
		this.setHealth(150)

		// Determine direction towards player.
		let direction = Vector.sub(screenCenter, this.body.position)
		this.angle = Math.atan2(direction.y, direction.x)
	}

	update()
	{
		// Rotate (pick whatever direction is closer).
		let difference = diff(this.rotation, this.angle)
		if (Math.abs(difference) > this.rotationSpeed)
			this.rotation += Math.sign(difference) * this.rotationSpeed
		else
			this.rotation = this.angle

		// Determine velocity.
		let currentSpeed = Vector.magnitude(this.velocity)
		currentSpeed = currentSpeed - scalePix(0.1) > this.speed ? currentSpeed - scalePix(0.1) : this.speed
		this.velocity = Vector.mult(
			Vector.create(
				Math.cos(this.rotation),
				Math.sin(this.rotation)
			),
			currentSpeed * this.isSlowed() ? .5 : 1
		)

		// Detect collisions.
		let collisions = detectCollisions(this.body, friendlyBodies)
		if (collisions.length > 0)
		{
			// Grab the first and ignore the rest
			const collision = collisions[0]
			let otherId = String(collision.bodyA.id == this.body.id ? collision.bodyB.id : collision.bodyA.id)
			friendlies[otherId].getHit(this.damage)
			factory.spawn(Impact, this.body.position.x, this.body.position.y)
			this.destroy()
		}

		// Move.
		Matter.Body.setPosition(this.body, Vector.add(this.body.position, this.velocity))
	}

	on_render()
	{
		if (this.active)
		{
			swarmerChildActiveModel.transform.identity()
			swarmerChildActiveModel.transform.translate(this.body.position.x, this.body.position.y)
			swarmerChildActiveModel.draw(Surface.Screen)
		}
		this.renderWordAndHealth()
	}
}