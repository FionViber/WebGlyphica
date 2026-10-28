import { Matter, Random, Easing } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { Impact } from './impact.js'
import { Sparks } from './sparks.js'
import { Entity } from '../core/entityFactory.js'

export class Explosion extends Entity
{
	constructor()
	{
		super()
		this.duration = 20
		this.tween = new FastTween()
		this.linearTween = new FastTween(Easing.Linear)
	}

	reset(x, y, parent, radius = null, sparks = true, forceDamage = null)
	{
		// Set vars.
		radius = radius ? radius : scalePix(parent.mod.range)
		this.sparks = sparks
		this.parent = parent
		this.position = Vector.create(x, y)
		this.radius = 0
		this.thickness = scalePix(1)
		this.radiusPerFrame = radius / this.duration
		this.forceDamage = forceDamage
		this.collided = []

		// Setup Tweens.
		this.tween.easeOut([this.radius], [radius], (t) => this.radius = t[0], this.duration)
			.then(() => {
				this.suspend()
			})
		this.linearTween.easeIn([this.thickness], [radius / 10], (t) => this.thickness = t[0], this.duration / 2)
			.then(() => {
				this.linearTween.easeOut([this.thickness], [scalePix(1)], (t) => this.thickness = t[0], this.duration / 2)
			})
	}

	on_update()
	{
		if (!isPaused())
		{
			// Test for collisions.
			hostilesArray
				.forEach((v) => {
					if (
						v.getType() == type.enemy &&
						!this.collided.includes(v) &&
						distanceBetween(v.getPosition(), this.position) <= this.radius
					)
					{
						// Keep a record of enemy hit so we only hit them once.
						this.collided.push(v)

						// Check if armor in line of sight.
						let armor = armoredEnemies.includes(v.constructor.name) ?
							Matter.Query.ray(hostileBodies, this.position, v.getPosition())
								.find((col) => hostiles.get(col.bodyA.id) && hostiles.get(col.bodyA.id).getType() == type.armor)
							: v.protection
						if (armor)
						{
							if ("bodyA" in armor) armor = hostiles.get(armor.bodyA.id)
							let colPt = Vector.add(v.body.position, Vector.mult(Vector.normalise(Vector.sub(this.position, v.body.position)), 40))
							armor.getHit(this.parent.dmg.mod.all, this.parent, colPt)
							factory.spawn(Impact, colPt.x, colPt.y)
							return
						}

						// Handle damage.
						let damage = Random.uniform(this.forceDamage ? this.forceDamage.damage : this.parent.dmg.mod.all, 10)
						let result = v.getHit(damage, this.parent, null, this.forceDamage ? this.forceDamage.type : null)
						this.parent.recordDamage(result.damage)

						// Hit effect.
						factory.spawn(Impact, v.getPosition().x, v.getPosition().y)
						audioHandler.playAudioHook(result.isCrit ? "explosion_hit_crit" : "explosion_hit_normal", getPanFromX(v.getPosition().x))
						let direction = Vector.sub(v.getPosition(), this.position)
						let angle = Math.atan2(direction.y, direction.x)
						if (this.sparks)
							for (let i = 0; i < 7; i++)
								factory.spawn(Sparks, v.getPosition().x, v.getPosition().y, Random.normal(angle, Math.PI / 6))
					}
				})
		}
	}

	on_render()
	{
		PrimNative.drawCircle(
			Surface.Screen,
			this.position.x,
			this.position.y,
			this.radius,
			this.thickness,
			midGray.fadeTo(0.3)
		)
	}
}