import { Random, Matter } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { Enemy } from './enemy.js'
import { calcRandomInboundsDistance } from './enemyMovement.js'
import { Scalers } from '../data/difficultyScalers.js'
import { Impact } from '../effects/impact.js'

export class Shooter extends Enemy
{
	static getName() { return localize("enemy_shooter_title") }
	static getDesc() { return localize("enemy_shooter_desc") }
	static isSpecial() { return true }

	constructor()
	{
		// Superclass constructor.
		super(scalePix(15))

		this.isInBounds = false

		// Define consts.
		this.experience = 20
		this.isSpecial = true
		this.damage = 25
		this.projSpawnDistance = 60
		this.wordOffset = scalePix(50)
		this.projectile = ShooterCube
	}

	reset(threat)
	{
		// Call superclass reset.
		super.reset(threat)

		// Reset vars.
		this.speed = scalePix(Random.uniform(1.5, 0.5))
		this.setHealth(300)
		this.isInBounds = false

		// First destination.
		let direction = Vector.normalise(Vector.sub(this.body.position, screenCenter))
		this.destination = calcRandomInboundsDistance(direction, scalePix(500), scalePix(750))
		this.velocity = Vector.mult(direction, -1 * this.speed)

		// Set rotation
		this.rotation = Math.atan2(direction.y, direction.x) / Math.PI * 180

		// Cooldown
		this.cooldown = 600
		this.currentCooldown = Random.discrete(50, 150) * Scalers.shooterInitialCooldown

		// If coming from above
		const aboveAngle = global.horizontalAngleToCorner - 2
		if ( (-180 + aboveAngle) < this.rotation && this.rotation < -aboveAngle)
		{
			let twoSeconds = 120
			let comingFromTopDelay = twoSeconds * Math.sin(-this.rotation * Math.PI / 180)
			this.currentCooldown += comingFromTopDelay
		}
	}

	update()
	{
		// Check if on screen.
		this.isInBounds = Matter.Bounds.overlaps(this.body.bounds, screenBounds)

		// Movement.
		if (!isEqual(this.body.position, this.destination))
		{
			let speed = this.speed * (this.isSlowed() ? .5 : 1)
			if (distanceBetween(this.body.position, this.destination) > speed)
			{
				let velocity = Vector.mult(this.velocity, this.isSlowed() ? .5 : 1)
				Matter.Body.setPosition(this.body, Vector.add(this.body.position, velocity))
			}
			else
				Matter.Body.setPosition(this.body, this.destination)
		}

		else
		{
			// Shooting.
			if (this.currentCooldown <= 0)
			{
				let vectorTowardsCenter = Vector.sub(screenCenter, this.body.position)
				factory.spawn (
					this.projectile,
					Vector.add (
						Vector.mult (
							vectorTowardsCenter,
							scalePix(this.projSpawnDistance) / Vector.magnitude(vectorTowardsCenter)
						),
						this.body.position
					),
					this
				)
				this.currentCooldown = this.cooldown
			}
			else
				this.currentCooldown -= 1
		}
	}

	on_render()
	{
		if (this.isInBounds)
		{
			if (this.active)
			{
				// Update transform.
				shooterModel.transform.identity()
				shooterModel.transform.rotate(this.rotation)
				shooterModel.transform.translate(this.body.position.x, this.body.position.y)
				shooterModel.draw(Surface.Screen)
			}
			this.renderWordAndHealth()
		}
	}
}

export class Shooter2 extends Shooter
{
	constructor()
	{
		super()
		this.projectile = ShooterCube2
		this.projSpawnDistance = 70
	}

	reset()
	{
		super.reset()
		this.setHealth(600)
	}

	on_render()
	{
		super.on_render()
		if (this.active)
		{
			shooterArmorModel.transform.identity()
			shooterArmorModel.transform.translate(scalePix(-18), 0)
			shooterArmorModel.transform.rotate(this.rotation)
			shooterArmorModel.transform.translate(this.body.position.x, this.body.position.y)
			shooterArmorModel.draw(Surface.Screen)
		}
	}
}

export class Shooter3 extends Shooter
{
	constructor()
	{
		super()
		this.projectile = ShooterCube3
		this.projSpawnDistance = 80
	}

	reset()
	{
		super.reset()
		this.setHealth(1200)
	}

	on_render()
	{
		super.on_render()
		if (this.active)
		{
			shooterArmorModel.transform.identity()
			shooterArmorModel.transform.translate(scalePix(-18), 0)
			shooterArmorModel.transform.rotate(this.rotation)
			shooterArmorModel.transform.translate(this.body.position.x, this.body.position.y)
			shooterArmorModel.draw(Surface.Screen)

			shooterArmorModel.transform.identity()
			shooterArmorModel.transform.translate(scalePix(-30), 0)
			shooterArmorModel.transform.rotate(this.rotation)
			shooterArmorModel.transform.translate(this.body.position.x, this.body.position.y)
			shooterArmorModel.draw(Surface.Screen)
		}
	}
}

export class ShooterCube extends Enemy
{
	constructor(size = 15)
	{
		super(scalePix(size))
		this.damage = 40
		this.wordOffset = scalePix(40)
		this.canSpawnPowerups = false

		// Charging particles.
		this.particles = []
		for (let i = 0; i < 10; i++)
			this.particles.push({
				active: false,
				pos: {x: 0, y: 0},
				opacity: 0,
				tween: new FastTween()
			})
	}

	reset(pos, parent)
	{
		this.cyphered = false
		this.refreshWord()
		this.active = true
		this.threat = 0
		this.overlapOpacity = 1
		this.rotation = 0
		Matter.Body.setPosition(this.body, pos)
		this.setHealth(200)
		this.parent = parent
		this.direction = Vector.normalise(Vector.sub(screenCenter, this.body.position))
		this.velocity = Vector.mult(this.direction, scalePix(.5))
		this.currentCharge = 420
		this.spawnParticles()
	}

	spawnParticles()
	{
		let particle = this.particles.find(part => !part.active)
		if (particle)
		{
			particle.active = true
			particle.pos = Vector.add(Vector.rotate({x: scalePix(Random.discrete(50, 70)), y: 0}, Random.uniform(0, Math.PI)), this.body.position)
			particle.opacity = 0
			particle.tween.easeIn([particle.pos.x, particle.pos.y, 0], [this.body.position.x, this.body.position.y, 1], t => {
				particle.pos.x = t[0]
				particle.pos.y = t[1]
				particle.opacity = t[2]
			}, 30)
				.then(() => particle.active = false)
		}
		Sphere.sleep(4).then(() => {
			if (this.currentCharge > 0)
				this.spawnParticles()
		})
	}

	update()
	{
		this.rotation += 2
		if (--this.currentCharge < 0)
		{
			// Move
			let velocity = Vector.mult(this.velocity, this.isSlowed() ? .5 : 1)
			let newPosition = Vector.add(this.body.position, velocity)
			Matter.Body.setPosition(this.body, newPosition)

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
		}
		else if (this.currentCharge == 0)
		{
			Matter.World.add(physics.world, this.body)
			addHostile(this)
			this.currentCharge--
		}
		// TODO [emil]: Timing issue hiding here if parent entity is reused before this is evaluated
		else if (this.parent && !this.parent.running) this.destroy()
	}

	on_render()
	{
		shooterCubeLayer1.transform.identity()
		shooterCubeLayer1.transform.scale(scalePix(15), scalePix(15))
		shooterCubeLayer1.transform.rotate(this.rotation)
		shooterCubeLayer1.transform.translate(this.body.position.x, this.body.position.y)
		shooterCubeLayer1.draw(Surface.Screen)
		if (this.currentCharge <= 0)
		{
			shooterCubeModel.transform.identity()
			shooterCubeModel.transform.scale(scalePix(10), scalePix(10))
			shooterCubeModel.transform.rotate(this.rotation)
			shooterCubeModel.transform.translate(this.body.position.x, this.body.position.y)
			shooterCubeModel.draw(Surface.Screen)

			this.renderWordAndHealth()
		}
		this.particles.forEach(part => {
			if (part.active)
				PrimNative.drawFilledCircle(Surface.Screen, part.pos.x, part.pos.y, scalePix(3), darkGray.fadeTo(part.opacity))
		})
	}
}

class ShooterCube2 extends ShooterCube
{
	constructor()
	{
		super(20)
		this.damage = 80
	}
	reset(pos, parent)
	{
		super.reset(pos, parent)
		this.setHealth(500)
	}
	on_render()
	{
		shooterCubeLayer2.transform.identity()
		shooterCubeLayer2.transform.scale(scalePix(20), scalePix(20))
		shooterCubeLayer2.transform.rotate(this.rotation)
		shooterCubeLayer2.transform.translate(this.body.position.x, this.body.position.y)
		shooterCubeLayer2.draw(Surface.Screen)
		if (this.currentCharge <= 0)
		{
			shooterCubeLayer1.transform.identity()
			shooterCubeLayer1.transform.scale(scalePix(15), scalePix(15))
			shooterCubeLayer1.transform.rotate(this.rotation)
			shooterCubeLayer1.transform.translate(this.body.position.x, this.body.position.y)
			shooterCubeLayer1.draw(Surface.Screen)

			shooterCubeModel.transform.identity()
			shooterCubeModel.transform.scale(scalePix(10), scalePix(10))
			shooterCubeModel.transform.rotate(this.rotation)
			shooterCubeModel.transform.translate(this.body.position.x, this.body.position.y)
			shooterCubeModel.draw(Surface.Screen)

			this.renderWordAndHealth()
		}
		this.particles.forEach(part => {
			if (part.active)
				PrimNative.drawFilledCircle(Surface.Screen, part.pos.x, part.pos.y, scalePix(3), darkGray.fadeTo(part.opacity))
		})
	}
}

class ShooterCube3 extends ShooterCube
{
	constructor()
	{
		super(20)
		this.damage = 160
	}
	reset(pos, parent)
	{
		super.reset(pos, parent)
		this.setHealth(1000)
	}
	on_render()
	{
		shooterCubeLayer2.transform.identity()
		shooterCubeLayer2.transform.scale(scalePix(20), scalePix(20))
		shooterCubeLayer2.transform.rotate(this.rotation)
		shooterCubeLayer2.transform.translate(this.body.position.x, this.body.position.y)
		shooterCubeLayer2.draw(Surface.Screen)
		if (this.currentCharge <= 0)
		{
			shooterCubeLayer1.transform.identity()
			shooterCubeLayer1.transform.scale(scalePix(15), scalePix(15))
			shooterCubeLayer1.transform.rotate(this.rotation)
			shooterCubeLayer1.transform.translate(this.body.position.x, this.body.position.y)
			shooterCubeLayer1.draw(Surface.Screen)

			shooterCubeModel2.transform.identity()
			shooterCubeModel2.transform.scale(scalePix(10), scalePix(10))
			shooterCubeModel2.transform.rotate(this.rotation)
			shooterCubeModel2.transform.translate(this.body.position.x, this.body.position.y)
			shooterCubeModel2.draw(Surface.Screen)

			this.renderWordAndHealth()
		}
		this.particles.forEach(part => {
			if (part.active)
				PrimNative.drawFilledCircle(Surface.Screen, part.pos.x, part.pos.y, scalePix(3), darkGray.fadeTo(part.opacity))
		})
	}
}