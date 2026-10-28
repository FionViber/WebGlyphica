import { Random, Matter } from 'sphere-runtime'
import { Weapon, FriendlyTurret } from './weapon.js'
import { FastTween } from '../core/fastTween.js'

export class Caltrops extends Weapon
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("augment_caltrops") }
	static getDesc() { return localize("augment_caltrops_desc") }
	static damageTags() { return ["tag_kinetic"] }
	static nonDamageTags() { return ["tag_damageOverTime"] }

	constructor()
	{
		super()
		this.isWeapon = false

		this.base.range = 10
		this.dmg.base.kinetic = 12
		this.base.rateOfFire = 120
		this.base.critChance = .01
		this.base.critMult = 2.5
		this.base.duration = 600
		this.refreshModifiers()

		this.restrictedArea = false
	}

	onEnemyHit(target, weapon, isCrit)
	{
		if (isCrit && weapon.constructor.nonDamageTags().includes("tag_remote"))
		{
			for (let i = 0; i < 12; i++)
			{
				let originPosition = target.getPosition()
				let randomDistance = Random.discrete(0, scalePix(this.mod.range * 6))
				let randomAngle = Random.uniform(Math.PI, Math.PI)
				let randomPosition = Vector.add(originPosition, Vector.rotate({ x: randomDistance, y: 0 }, randomAngle))
				factory.spawn(CaltropsTurret, this, originPosition.x, originPosition.y, randomPosition.x, randomPosition.y)
			}
		}
	}
}

class CaltropsTurret extends FriendlyTurret
{
	constructor()
	{
		super()
		this.progressOffset = 30
		this.tween = new FastTween()
		this.animating = false
		this.transform = new Transform()
	}

	reset(parent, originX, originY, destX, destY)
	{
		// Reset vars.
		super.reset(originX, originY, parent)
		this.rotation = Random.uniform(180, 180)
		this.cooldown = 0
		this.currentDuration = 0

		// Spawn animation.
		this.animating = true
		this.tween.easeIn (
			[originX, originY],
			[destX, destY],
			async t => {
				while (isPaused()) await Sphere.sleep(1)
				this.position.x = t[0]
				this.position.y = t[1]
			},
			20
		).then(() => this.animating = false)
	}

	update()
	{
		if (isPaused()) return
		
		// Update duration.
		if (++this.currentDuration > this.parent.mod.duration)
			this.suspend()
		
		// Damage enemies in range.
		if (++this.cooldown >= 3600 / this.parent.mod.rateOfFire)
			this.cooldown = 0
		else
			return
		
		// Find all enemies in range.
		hostilesArray.forEach((enemy) => {
			if (enemy.getType() == type.enemy
				&& Matter.Bounds.overlaps(enemy.body.bounds, screenBounds)
				&& distanceBetween(enemy.getPosition(), this.position) < scalePix(this.parent.mod.range))
			{
				// If armor in line of fire.
				let armor = armoredEnemies.includes(enemy.constructor.name) ?
					Matter.Query.ray(hostileBodies, this.position, enemy.getPosition())
						.find(col => {
							let hostile = hostiles.get(col.bodyA.id)
							return hostile && hostile.getType() == type.armor
						})
					: enemy.protection
				if (armor)
				{
					if ("bodyA" in armor) armor = hostiles.get(armor.bodyA.id)
					let pointHitOnShield = collisionPoint(this.position, enemy.getPosition(), armor.body)
					if (this.cooldown == 0)
						armor.getHit(this.parent.dmg.mod.all, this.parent, pointHitOnShield)
				}

				// Else, deal damage.
				else
				{
					if (this.cooldown == 0)
					{
						let damage = Random.uniform(this.parent.dmg.mod.all, 1)
						let result = enemy.getHit(damage, this.parent, null)
						this.parent.recordDamage(result.damage)
					}
				}
			}
		})
	}

	on_render()
	{
		if (this.animating)
		{
			this.transform.identity()
			this.transform.scale(scalePix(this.parent.mod.range), scalePix(this.parent.mod.range))
			this.transform.rotate(this.rotation)
			this.transform.translate(this.position.x, this.position.y)
		}

		caltropsModel.transform = this.transform
		caltropsModel.draw(Surface.Screen)
	}
}