import { Random, Matter } from 'sphere-runtime'
import { Weapon } from './weapon.js'
import { DrawLightning } from '../effects/drawLightning.js'
import { Entity } from '../core/entityFactory.js'

export class Static extends Weapon
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("weapon_static_title") }
	static getDesc() { return localize("weapon_static_desc") }
	static damageTags() { return ["tag_electric"] }
	static nonDamageTags() { return ["tag_damageOverTime", "tag_status"] }

	constructor()
	{
		super()
		this.isWeapon = false

		this.dmg.base.electric = 3
		this.base.rateOfFire = 120
		this.base.critChance = .01
		this.base.critMult = 2.5
		this.base.range = 150
		this.base.duration = 300
		this.refreshModifiers()
		this.staticRenderer = factory.spawn(StaticRenderer, this)

		this.lightingPos = []
		this.currentCooldown = 0
		this.start()
	}

	on_shutDown()
	{
		this.staticRenderer.suspend()
		super.on_shutDown()
	}

	on_update()
	{
		if (!isPaused())
		{
			if (++this.currentCooldown >= 3600 / this.mod.rateOfFire)
				this.currentCooldown = 0
			
			this.lightingPos = []
			hostilesArray.forEach((enemy) => {
				if (
					enemy.getType() == type.enemy
					&& Matter.Bounds.overlaps(enemy.body.bounds, screenBounds)
					&& enemy.statusEffects.some(status => status[0] == "electricStatus")
				)
				{
					hostilesArray.forEach((enemyNearby) => {
						if (enemyNearby.getType() == type.enemy
							&& enemyNearby != enemy
							&& Matter.Bounds.overlaps(enemyNearby.body.bounds, screenBounds)
							&& distanceBetween(enemyNearby.getPosition(), enemy.getPosition()) < this.mod.range)
						{
							let armor = armoredEnemies.includes(enemyNearby.constructor.name) ?
								Matter.Query.ray(hostileBodies, enemy.getPosition(), enemyNearby.getPosition())
									.find(col => {
										let hostile = hostiles.get(col.bodyA.id)
										return (
											hostile &&
											hostile.getType() == type.armor &&
											!(
												enemy.protection &&
												enemy.protection.body.id == hostile.body.id
											)
										)
									})
								: enemyNearby.protection
							if (armor)
							{
								if ("bodyA" in armor) armor = hostiles.get(armor.bodyA.id)
								let pointHitOnShield = collisionPoint(enemy.getPosition(), enemyNearby.getPosition(), armor.body)
								this.lightingPos.push([enemy.getPosition(), pointHitOnShield])
								if (this.currentCooldown == 0)
									armor.getHit(this.dmg.mod.all, this.parent, pointHitOnShield)
							}
							else 
							{
								if (this.currentCooldown == 0)
								{
									let damage = Random.uniform(this.dmg.mod.all, 1)
									let result = enemyNearby.getHit(damage, this, null)
									this.recordDamage(result.damage)
								}
								this.lightingPos.push([enemy.getPosition(), enemyNearby.getPosition()])
							}
						}
					})
				}
			})
		}
	}
}

class StaticRenderer extends Entity
{
	reset(parent)
	{
		super.reset()
		this.parent = parent
	}
	on_renderStart()
	{
		this.parent.lightingPos.forEach(pair => DrawLightning(pair[0], pair[1]))
	}
}