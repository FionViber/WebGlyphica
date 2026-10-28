import { Matter, Random } from 'sphere-runtime'
import { Enemy } from './enemy.js'
import { Impact } from '../effects/impact.js'

export class Drone extends Enemy
{
	static getName() { return localize("enemy_drone_title") }
	static getDesc() { return localize("enemy_drone_desc") }

	constructor(size = 7)
	{
		// Superclass constructor.
		super(scalePix(size))

		// Define consts.
		this.experience = 10
		this.damage = 40
		this.baseHealth = 80
		this.baseShield = 0
	}

	reset(threat)
	{
		// Call superclass reset.
		super.reset(threat)

		// Set speed.
		let isFastEnemy = (omenLevel == omen.relaxed) ? false : Random.chance(.1)
		this.speed = isFastEnemy ?
			Random.uniform(1, 0.25) :
			Random.uniform(0.65, 0.25)

		// Set health & shield.
		let endGameBoost = (spawner.currentFrame > 36000 ? .000004 * (spawner.currentFrame - 36000) : 0)
		let isLargeEnemy = (omenLevel == omen.typist) ? false : Random.chance(.04 + endGameBoost)
		this.largeEnemy = isLargeEnemy ? 2 : 1
		this.setHealth(this.baseHealth * (isLargeEnemy ? 3 : 1))
		this.setShield(this.baseShield * (isLargeEnemy ? 3 : 1))

		// Calculate movement and speed.
		this.direction = Vector.normalise(Vector.sub(screenCenter, this.body.position))
		this.velocity = Vector.mult(this.direction, scalePix(this.speed))
	}

	update()
	{
		// Calculate shield.
		this.calculateShield()

		// Move drone.
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

	on_render()
	{
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds))
		{
			if (this.active)
				PrimNative.drawFilledCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(6) * this.largeEnemy, secondColor)
			this.renderWordAndHealth()
		}
	}
}

export class Drone2 extends Drone
{
	constructor()
	{
		super(12)
		this.experience = 15
		this.damage = 60
		this.baseHealth = 200
	}

	on_render()
	{
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds))
		{
			if (this.active)
			{
				PrimNative.drawFilledCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(6) * this.largeEnemy, secondColor)
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(11) * this.largeEnemy, scalePix(2) * this.largeEnemy, secondColor)
			}
			this.renderWordAndHealth()
		}
	}
}

export class Drone3 extends Drone
{
	constructor()
	{
		super(17)
		this.experience = 20
		this.damage = 90
		this.baseHealth = 500
	}

	on_render()
	{
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds))
		{
			if (this.active)
			{
				PrimNative.drawFilledCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(6) * this.largeEnemy, secondColor)
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(11) * this.largeEnemy, scalePix(2) * this.largeEnemy, secondColor)
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(16) * this.largeEnemy, scalePix(2) * this.largeEnemy, secondColor)
			}
			this.renderWordAndHealth()
		}
	}
}

export class Drone4 extends Drone
{
	constructor()
	{
		super(17)
		this.experience = 20
		this.damage = 120
		this.baseHealth = 1000
	}

	on_render()
	{
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds))
		{
			if (this.active)
			{
				PrimNative.drawFilledCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(6) * this.largeEnemy, secondColor)
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(14) * this.largeEnemy, scalePix(6) * this.largeEnemy, secondColor)
			}
			this.renderWordAndHealth()
		}
	}
}

export class Drone5 extends Drone
{
	constructor()
	{
		super(17)
		this.experience = 20
		this.damage = 150
		this.baseHealth = 1600
	}

	on_render()
	{
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds))
		{
			if (this.active)
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(10) * this.largeEnemy, scalePix(14) * this.largeEnemy, secondColor)
			this.renderWordAndHealth()
		}
	}
}

export class Drone6 extends Drone
{
	constructor(radius = 18)
	{
		super(radius)
		this.experience = 20
		this.damage = 180
		this.baseHealth = 2600
		this.rotation = 0
	}

	update()
	{
		this.rotation += 1
		super.update()
	}

	on_render()
	{
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds))
		{
			if (this.active)
			{
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(15) * this.largeEnemy, scalePix(6) * this.largeEnemy, secondColor)
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(7) * this.largeEnemy, scalePix(6) * this.largeEnemy, secondColor)
				droneDottedCircleModel.transform.identity()
				droneDottedCircleModel.transform.scale(scalePix(10), scalePix(10))
				droneDottedCircleModel.transform.rotate(this.rotation)
				droneDottedCircleModel.transform.translate(this.body.position.x, this.body.position.y)
				droneDottedCircleModel.draw(Surface.Screen)
			}
			this.renderWordAndHealth()
		}
	}
}

export class Drone7 extends Drone6
{
	constructor()
	{
		super(19)
		this.experience = 20
		this.damage = 210
		this.baseHealth = 4000
	}

	on_render()
	{
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds))
		{
			if (this.active)
			{
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(19) * this.largeEnemy, scalePix(2) * this.largeEnemy, secondColor)
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(14) * this.largeEnemy, scalePix(4) * this.largeEnemy, secondColor)
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(7) * this.largeEnemy, scalePix(6) * this.largeEnemy, secondColor)
				droneDottedCircleModel.transform.identity()
				droneDottedCircleModel.transform.scale(scalePix(10), scalePix(10))
				droneDottedCircleModel.transform.rotate(this.rotation)
				droneDottedCircleModel.transform.translate(this.body.position.x, this.body.position.y)
				droneDottedCircleModel.draw(Surface.Screen)
			}
			this.renderWordAndHealth()
		}
	}
}

export class ShieldDrone extends Drone
{
	static getName() { return localize("enemy_shieldDrone_title") }
	static getDesc() { return localize("enemy_shieldDrone_desc") }

	constructor(size = 10)
	{
		super(size)
		this.experience = 12
		this.damage = 50
		this.baseHealth = 100
		this.baseShield = 200
		this.rotation = 0
	}

	update()
	{
		super.update()
		this.rotation++
	}

	on_render()
	{
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds))
		{
			if (this.active)
			{
				shieldDroneModel.transform.identity()
				shieldDroneModel.transform.scale(scalePix(1) * this.largeEnemy, scalePix(1) * this.largeEnemy)
				shieldDroneModel.transform.rotate(this.rotation)
				shieldDroneModel.transform.translate(this.body.position.x, this.body.position.y)
				shieldDroneModel.draw(Surface.Screen)
			}
			this.renderWordAndHealth()
		}
	}
}

export class ShieldDrone2 extends ShieldDrone
{
	constructor()
	{
		super(15)
		this.experience = 15
		this.baseHealth = 200
		this.damage = 100
		this.baseShield = 400
	}

	on_render()
	{
		super.on_render()
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds))
		{
			if (this.active)
			{
				shieldDroneLayer1.transform.identity()
				shieldDroneLayer1.transform.scale(scalePix(15) * this.largeEnemy, scalePix(15) * this.largeEnemy)
				shieldDroneLayer1.transform.rotate(this.rotation)
				shieldDroneLayer1.transform.translate(this.body.position.x, this.body.position.y)
				shieldDroneLayer1.draw(Surface.Screen)
			}
		}
	}
}

export class ShieldDrone3 extends ShieldDrone
{
	constructor()
	{
		super(20)
		this.experience = 20
		this.baseHealth = 400
		this.damage = 150
		this.baseShield = 800
	}

	on_render()
	{
		super.on_render()
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds))
		{
			if (this.active)
			{
				shieldDroneLayer1.transform.identity()
				shieldDroneLayer1.transform.scale(scalePix(15) * this.largeEnemy, scalePix(15) * this.largeEnemy)
				shieldDroneLayer1.transform.rotate(this.rotation)
				shieldDroneLayer1.transform.translate(this.body.position.x, this.body.position.y)
				shieldDroneLayer1.draw(Surface.Screen)

				shieldDroneLayer2.transform.identity()
				shieldDroneLayer2.transform.scale(scalePix(20) * this.largeEnemy, scalePix(20) * this.largeEnemy)
				shieldDroneLayer2.transform.rotate(this.rotation)
				shieldDroneLayer2.transform.translate(this.body.position.x, this.body.position.y)
				shieldDroneLayer2.draw(Surface.Screen)
			}
		}
	}
}

export class ShieldDrone4 extends ShieldDrone
{
	constructor()
	{
		super(20)
		this.experience = 20
		this.baseHealth = 800
		this.damage = 200
		this.baseShield = 1600
	}

	on_render()
	{
		super.on_render()
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds))
		{
			if (this.active)
			{
				shieldDroneLayer1plus2.transform.identity()
				shieldDroneLayer1plus2.transform.scale(scalePix(17) * this.largeEnemy, scalePix(17) * this.largeEnemy)
				shieldDroneLayer1plus2.transform.rotate(this.rotation)
				shieldDroneLayer1plus2.transform.translate(this.body.position.x, this.body.position.y)
				shieldDroneLayer1plus2.draw(Surface.Screen)
			}
		}
	}
}

export class ShieldDrone5 extends ShieldDrone
{
	constructor()
	{
		super(25)
		this.experience = 20
		this.baseHealth = 1600
		this.damage = 250
		this.baseShield = 3200
	}

	on_render()
	{
		super.on_render()
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds))
		{
			if (this.active)
			{
				shieldDroneLayer1plus2.transform.identity()
				shieldDroneLayer1plus2.transform.scale(scalePix(17) * this.largeEnemy, scalePix(17) * this.largeEnemy)
				shieldDroneLayer1plus2.transform.rotate(this.rotation)
				shieldDroneLayer1plus2.transform.translate(this.body.position.x, this.body.position.y)
				shieldDroneLayer1plus2.draw(Surface.Screen)

				shieldDroneLayer3.transform.identity()
				shieldDroneLayer3.transform.scale(scalePix(25) * this.largeEnemy, scalePix(25) * this.largeEnemy)
				shieldDroneLayer3.transform.rotate(this.rotation)
				shieldDroneLayer3.transform.translate(this.body.position.x, this.body.position.y)
				shieldDroneLayer3.draw(Surface.Screen)
			}
		}
	}
}

export class Stalker extends Drone
{
	static getName() { return localize("enemy_stalker_title") }
	static getDesc() { return localize("enemy_stalker_desc") }
	static isSpecial() { return true }

	constructor()
	{
		super(15)
		this.isSpecial = true
		this.experience = 20
		this.damage = 80
		this.wordOffset = scalePix(50)
		this.baseHealth = 400
	}

	reset(threat)
	{
		super.reset(threat)
		this.rotation = 0
	}

	update()
	{
		super.update()
		this.rotation += .02
	}

	on_render()
	{
		if (this.active)
		{
			PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(15), scalePix(3), secondColor)
			let apex = {x: scalePix(15), y: 0}
			for (let i = 0; i < 3; i++)
			{
				let pos = Vector.add(Vector.rotate(apex, (i * .667 * Math.PI) + this.rotation), this.body.position)
				PrimNative.drawFilledCircle(Surface.Screen, pos.x, pos.y, scalePix(8), secondColor)
			}
		}
		this.renderWordAndHealth(true)
	}
}

export class Stalker2 extends Stalker
{
	constructor()
	{
		super(20)
		this.experience = 25
		this.damage = 120
		this.wordOffset = scalePix(55)
		this.baseHealth = 800
	}

	on_render()
	{
		if (this.active)
			{
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(15), scalePix(3), secondColor)
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(20), scalePix(3), secondColor)
				let apex = {x: scalePix(17.5), y: 0}
				for (let i = 0; i < 3; i++)
				{
					let pos = Vector.add(Vector.rotate(apex, (i * .667 * Math.PI) + this.rotation), this.body.position)
					PrimNative.drawFilledCircle(Surface.Screen, pos.x, pos.y, scalePix(10), secondColor)
				}
			}
			this.renderWordAndHealth(true)
	}
}

export class Stalker3 extends Stalker
{
	constructor()
	{
		super(20)
		this.experience = 25
		this.damage = 160
		this.wordOffset = scalePix(60)
		this.baseHealth = 1600
	}

	on_render()
	{
		if (this.active)
			{
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(12), scalePix(2), secondColor)
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(16), scalePix(2), secondColor)
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(20), scalePix(2), secondColor)
				let apex = {x: scalePix(16), y: 0}
				for (let i = 0; i < 3; i++)
				{
					let pos = Vector.add(Vector.rotate(apex, (i * .667 * Math.PI) + this.rotation), this.body.position)
					PrimNative.drawFilledCircle(Surface.Screen, pos.x, pos.y, scalePix(10), secondColor)
				}
			}
			this.renderWordAndHealth(true)
	}
}

export class Stalker4 extends Stalker
{
	constructor()
	{
		super(20)
		this.experience = 25
		this.damage = 200
		this.wordOffset = scalePix(60)
		this.baseHealth = 3200
	}

	on_render()
	{
		if (this.active)
			{
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(12), scalePix(2), secondColor)
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(16), scalePix(2), secondColor)
				PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(20), scalePix(2), secondColor)
				let apex = {x: scalePix(16), y: 0}
				for (let i = 0; i < 4; i++)
				{
					let pos = Vector.add(Vector.rotate(apex, (i * .5 * Math.PI) + this.rotation), this.body.position)
					PrimNative.drawFilledCircle(Surface.Screen, pos.x, pos.y, scalePix(10), secondColor)
				}
			}
			this.renderWordAndHealth(true)
	}
}