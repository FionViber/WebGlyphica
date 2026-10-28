import { Matter, Random, Easing } from 'sphere-runtime'
import { Enemy } from './enemy.js'
import { Impact } from '../effects/impact.js'
import { FastTween } from '../core/fastTween.js'

export class Splitter extends Enemy
{
	static getName() { return localize("enemy_splitter_title") }
	static getDesc() { return localize("enemy_splitter_desc") }
	static isSpecial() { return true }

	constructor()
	{
		super()
		this.isSpecial = true
		this.numShards = 4
		this.apex = {x: scalePix(15), y: 0}
		this.shard = SplitterShard
	}

	reset(threat)
	{
		super.reset(threat)
		this.position = this.getRandomSpawnLocation()
		this.rotation = 0
		this.setHealth(0)

		// Add Splitter to splitters collection.
		splitters.push(this)

		// Calculate movement and speed.
		this.speed = Random.uniform(0.65, 0.25)
		this.direction = Vector.normalise(Vector.sub(screenCenter, this.position))
		this.velocity = Vector.mult(this.direction, scalePix(this.speed))

		// Spawn shards.
		for (let i = 0; i < this.numShards; i++)
		{
			let rotation = i * Math.PI * 2 / this.numShards
			this.children.push(factory.spawn(
				this.shard,
				Vector.add(this.position, Vector.rotate(this.apex, rotation)),
				rotation,
				this
			))
		}
	}

	// Remove Splitter from splitters collection.
	cease(clearWord = true)
	{
		splitters[splitters.indexOf(this)] = splitters[splitters.length - 1]
		splitters.pop()
		super.cease(clearWord)
	}

	removeShard(shard)
	{
		if (this.children.includes(shard))
			this.children.splice(this.children.indexOf(shard), 1)
		if (this.children.length == 0)
			this.destroy()
	}

	update()
	{
		// Rotate.
		this.rotation += .02

		// Move
		let anyShardWithBlight = this.children.some(child => child.statusEffects.some(se => se[0] == "chemicalStatus"))
		let velocity = Vector.mult(this.velocity, anyShardWithBlight ? .5 : 1)
		this.position = Vector.add(this.position, velocity)

		// Update children.
		this.children.forEach((child, i) => {
			let rotation = i * Math.PI * 2 / this.numShards + this.rotation
			let newPosition = Vector.add(this.position, Vector.rotate(this.apex, rotation))
			Matter.Body.setPosition(child.body, newPosition)
			child.rotation = rotation / Math.PI * 180
		})
	}

	on_render()
	{
		this.renderWordAndHealth()

		// Render health of children.
		if (this.children.some(child => child.currentHealth < child.health))
		{
			let radius = Vector.magnitude(this.apex) * 2
			let healthBarWidth = Math.max(radius * .66, scalePix(20))
			this.children.forEach((child, i) => drawProgress(
				this.position.x,
				this.position.y + Vector.magnitude(this.apex) + this.healthbarOffset + i * scalePix(5),
				healthBarWidth,
				scalePix(3),
				child.currentHealth / child.health
			))
		}
	}
}

export class Splitter2 extends Splitter
{
	constructor()
	{
		super()
		this.numShards = 5
		this.apex = {x: scalePix(15), y: 0}
		this.shard = SplitterShard2
	}
}

export class Splitter3 extends Splitter
{
	constructor()
	{
		super()
		this.numShards = 6
		this.apex = {x: scalePix(15), y: 0}
		this.shard = SplitterShard3
	}
}

class SplitterShard extends Enemy
{
	constructor(size = 10)
	{
		super(scalePix(size))
		this.model = splitterShardShape1
		this.baseHealth = 350
		this.damage = 40
		this.tween = new FastTween()
	}

	reset(position, rotation, parent)
	{
		super.reset(0, false)
		this.setHealth(this.baseHealth)
		this.released = false
		this.rotation = rotation
		this.parent = parent
		Matter.Body.setPosition(this.body, position)
	}

	release()
	{
		this.parent = null
		this.rotation = this.rotation % 360
		let destination = Vector.add(
			Vector.rotate(
				{ x: scalePix(Random.uniform(100, 20)), y: 0 },
				this.rotation / 180 * Math.PI
			),
			this.body.position
		)
		let vectorTowardsCenter = Vector.sub(screenCenter, destination)
		let targetRotation = Math.atan2(vectorTowardsCenter.y, vectorTowardsCenter.x) / Math.PI * 180
		targetRotation = this.rotation + diff(this.rotation, targetRotation)
		this.tween.easeOut(
			[this.body.position.x, this.body.position.y, this.rotation],
			[destination.x, destination.y, targetRotation],
			async t => {
				while (isPaused()) await Sphere.sleep(1)
				Matter.Body.setPosition(this.body, {x: t[0], y: t[1]})
				this.rotation = t[2]
			},
			30
		).then(() => {
			if (this.active && !this.parent)
			{
				this.refreshWord()
				this.released = true
				this.direction = Vector.normalise(Vector.sub(screenCenter, this.body.position))
				this.velocity = Vector.mult(this.direction, scalePix(Random.uniform(0.65, 0.25)))
			}
		})
	}

	update()
	{
		// Move
		if (this.released)
		{
			let velocity = Vector.mult(this.velocity, this.statusEffects.some(se => se[0] == "chemicalStatus") ? .5 : 1)
			let newPosition = Vector.add(this.body.position, velocity)
			Matter.Body.setPosition(this.body, newPosition)
		}

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
		this.model.transform.identity()
		this.model.transform.rotate(this.rotation)
		this.model.transform.translate(this.body.position.x, this.body.position.y)
		this.model.draw(Surface.Screen)

		if (this.released)
			this.renderWordAndHealth()
	}

	destroyedByPlayer(weapon, isCrit)
	{
		if (this.parent)
		{
			this.parent.removeShard(this)
			this.parent.children.forEach(child => child.release())
			this.parent.children = []
			this.parent.destroy()
			this.parent = null
		}
		super.destroyedByPlayer(weapon, isCrit)
	}

	destroy()
	{
		if (this.parent)
		{
			this.parent.removeShard(this)
			this.parent = null
		}
		super.destroy()
	}
}

class SplitterShard2 extends SplitterShard
{
	constructor()
	{
		super(15)
		this.model = splitterShardShape2
		this.baseHealth = 500
	}
}

class SplitterShard3 extends SplitterShard
{
	constructor()
	{
		super(15)
		this.model = splitterShardShape3
		this.baseHealth = 650
	}
}