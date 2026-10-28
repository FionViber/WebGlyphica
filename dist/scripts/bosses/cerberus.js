import { Random, Matter } from 'sphere-runtime'
import { Entity } from "../core/entityFactory.js";
import { Enemy } from "../enemies/enemy.js";
import { ShooterCube } from '../enemies/shooter.js';
import { FastTween } from '../core/fastTween.js';
import { Armor } from '../enemies/armor.js';

export class Cerberus extends Entity
{
	static getName() { return localize("boss_cerberus") }
	static getDesc() { return localize("boss_cerberus_desc") }
	static getBGM() { return bgm.fadeTo(bgm.getMusicInSet("boss_cerberus")) }

	constructor()
	{
		super()
		this.speed = scalePix(4)
		this.radius = scalePix(120)
		this.rotationSpeed = .005
	}

	reset()
	{
		// Setup variables.
		super.reset()
		this.velocity = Vector.create(0, 0)
		this.position = Vector.create(Random.sample([0, Surface.Screen.width], Random.uniform(screenCenter.y, Surface.Screen.height / 2)))
		this.rotation = Random.uniform(Math.PI, Math.PI)

		// Set this to current boss.
		boss = this

		// Create center armor triangle.
		this.centerArmor = factory.spawn(CerberusCenter, this)
		
		// Create Cerberus Heads.
		this.children = []
		for (let i = 0; i < 3; i++)
			this.children.push(factory.spawn(CerberusHead, this, 300 + i * 300))

		// Set initial position.
		this.targetPosition = Vector.add(screenCenter, Vector.mult(Vector.normalise(Vector.sub(this.position, screenCenter)), scalePix(Random.discrete(500, 600))))
	}

	// Change position.
	changePosition()
	{
		if (this.targetPosition != null) return
		let dist = scalePix(Random.discrete(400, 600))
		let angle = -Math.PI / 4 + Random.uniform(Math.PI / 4, Math.PI / 4)
		this.targetPosition = Vector.rotate(Vector.create(dist, 0), angle)
		if (Math.sign(this.targetPosition.x) == Math.sign(this.position.x - screenCenter.x))
			this.targetPosition.x *= -1
		this.targetPosition = Vector.add(screenCenter, this.targetPosition)
	}

	getPosition()
	{
		return this.position
	}

	headDestroyed(head)
	{
		let myIndex = this.children.findIndex(child => child == head)
		this.children[myIndex] = null
		if (this.children.every(child => child == null))
		{
			this.centerArmor.stop()
			bgm.resume()
			if (!("defeatedCerberus" in save)) save["defeatedCerberus"] = true
			missionComplete()
			this.suspend()
		}
		else this.changePosition()
	}

	on_update()
	{
		if (isPaused() || powerup_freeze) return

		// Rotation.
		this.rotation += this.rotationSpeed

		// Movement.
		this.velocity.x = 0
		this.velocity.y = 0
		if (this.targetPosition != null)
		{
			if (distanceBetween(this.position, this.targetPosition) <= this.speed)
			{
				this.position = this.targetPosition
				this.targetPosition = null
			}
			else
			{
				let direction = Vector.normalise(Vector.sub(this.targetPosition, this.position))
				this.velocity = Vector.mult(direction, this.speed)
				this.position = Vector.add(this.position, this.velocity)
			}
		}

		// Update CerberusHeads positions.
		this.children.forEach((cerberusHead, index) => {

			// Ignore if CerberusHead already destroyed.
			if (!cerberusHead) return

			// Else, set position.
			Matter.Body.setPosition (
				cerberusHead.body,
				Vector.add (
					this.position,
					Vector.rotate (
						{ x: this.radius, y: 0 },
						this.rotation + Math.PI * .67 * index
					)
				)
			)
		})
	}

	on_render()
	{
		// Draw center armor.
		cerberusInnerTriangle.transform.identity()
		cerberusInnerTriangle.transform.scale(this.radius, this.radius)
		cerberusInnerTriangle.transform.rotate(this.rotation / Math.PI * 180)
		cerberusInnerTriangle.transform.translate(this.position.x, this.position.y)
		cerberusInnerTriangle.draw(Surface.Screen)

		// Draw triangle for each head.
		this.children.forEach((child, index) => {
			if (child != null)
			{
				cerberusOuterTriangle.transform.identity()
				cerberusOuterTriangle.transform.scale(this.radius, this.radius)
				cerberusOuterTriangle.transform.rotate(this.rotation / Math.PI * 180 + index * 120)
				cerberusOuterTriangle.transform.translate(this.position.x, this.position.y)
				cerberusOuterTriangle.draw(Surface.Screen)
			}
		})
	}
}

class CerberusHead extends Enemy
{
	constructor()
	{
		// Superclass constructor.
		super(scalePix(15))

		// Define consts.
		this.experience = 0
		this.alwaysShowHealth = true
		this.projSpawnDistance = scalePix(60)
		this.maxCooldown = 900

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

	reset(parent, cooldown)
	{
		super.reset()
		this.parent = parent
		this.setHealth(Math.max(5000, Math.ceil((totalDamage * 70000) / timeElapsed)))
		this.threshold = this.health / 4
		this.currentThreshold = 4
		this.currentCharge = 0
		this.currentCooldown = cooldown

		this.projHealth = this.health / 25
		this.projRotation = 0

		this.rotateTowardsScreenCenter()
	}

	update()
	{
		// Cooldown.
		if (this.currentCooldown > 0 && --this.currentCooldown <= 0)
		{
			this.currentCooldown = this.maxCooldown
			this.currentCharge = 420
			this.spawnParticles()
		}

		// Update charge if shooting.
		if (this.currentCharge > 0)
		{
			this.projRotation += 2
			if (this.parent.targetPosition == null && --this.currentCharge <= 0)
				factory.spawn (
					ProjCerberusHead,
					Vector.add (
						this.body.position,
						Vector.rotate({ x: this.projSpawnDistance, y: 0 }, this.rotation + Math.PI)
					),
					this.projRotation,
					this.projHealth
				)
		}

		// Trigger change position if health threshold breached.
		if (Math.ceil(this.currentHealth / this.threshold) < this.currentThreshold)
		{
			this.currentThreshold--
			this.parent.changePosition()
		}

		// Adjust rotation.
		this.rotateTowardsScreenCenter()
	}

	rotateTowardsScreenCenter()
	{
		let direction = Vector.normalise(Vector.sub(this.body.position, screenCenter))
		this.rotation = Math.atan2(direction.y, direction.x)
	}

	destroy()
	{
		super.destroy()
		this.parent.headDestroyed(this)
	}

	on_render()
	{
		if (this.active)
		{
			// Draw CerberusHead.
			shooterModel.transform.identity()
			shooterModel.transform.rotate(this.rotation / Math.PI * 180)
			shooterModel.transform.translate(this.body.position.x, this.body.position.y)
			shooterModel.draw(Surface.Screen)

			// Draw charging animation (if any)
			if (this.currentCharge > 0)
			{
				// Charging position.
				let projSpawnPos = Vector.add (
					this.body.position,
					Vector.rotate({ x: this.projSpawnDistance, y: 0 }, this.rotation + Math.PI)
				)

				// Charging cube outline.
				cerberusProjOutlineModel.transform.identity()
				cerberusProjOutlineModel.transform.scale(scalePix(25), scalePix(25))
				cerberusProjOutlineModel.transform.rotate(this.projRotation)
				cerberusProjOutlineModel.transform.translate(projSpawnPos.x, projSpawnPos.y)
				cerberusProjOutlineModel.draw(Surface.Screen)

				// Charging particles.
				this.particles.forEach(part => {
					if (part.active)
					{
						let pos = Vector.add(part.pos, projSpawnPos)
						PrimNative.drawFilledCircle (
							Surface.Screen,
							pos.x,
							pos.y,
							scalePix(3),
							darkGray.fadeTo(part.opacity)
						)
					}
				})
			}
		}
		this.renderWordAndHealth(false, 2)
	}

	spawnParticles()
	{
		let particle = this.particles.find(part => !part.active)
		if (particle)
		{
			particle.active = true
			particle.pos = Vector.rotate({x: scalePix(Random.discrete(50, 70)), y: 0}, Random.uniform(0, Math.PI))
			particle.opacity = 0
			particle.tween.easeIn([particle.pos.x, particle.pos.y, 0], [0, 0, 1], t => {
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
}

class ProjCerberusHead extends ShooterCube
{
	constructor()
	{
		super(0)
		this.damage = 80
		let pts = []
		for (let i = 0; i < 3; i++)
			pts.push(Vector.rotate({ x: 25, y: 0 }, i * Math.PI * .67))
		this.body = polyCollider(pts, { category: hostile })
	}

	reset(pos, rotation, health)
	{
		super.reset(pos, null)
		this.currentCharge = 1
		this.rotation = rotation
		this.setHealth(health)
	}

	on_render()
	{
		cerberusProjModel.transform.identity()
		cerberusProjModel.transform.scale(scalePix(25), scalePix(25))
		cerberusProjModel.transform.rotate(this.rotation)
		cerberusProjModel.transform.translate(this.body.position.x, this.body.position.y)
		cerberusProjModel.draw(Surface.Screen)

		this.renderWordAndHealth()
	}
}

class CerberusCenter extends Armor
{
	reset(parent)
	{
		let apex = { x: parent.radius / 2, y: 0 }
		let pts = []
		for (let i = 0; i < 3; i++)
			pts.push(Vector.rotate(apex, i * Math.PI * .67))
		this.body = polyCollider(pts, { category: hostile })
		Matter.Body.setAngle(this.body, parent.rotation + Math.PI * .33)
		Matter.Body.setPosition(this.body, parent.position)
		super.reset(parent)
	}

	on_update()
	{
		if (isPaused()) return
		Matter.Body.setAngle(this.body, this.parent.rotation + Math.PI * .33)
		Matter.Body.setPosition(this.body, this.parent.position)
	}
}