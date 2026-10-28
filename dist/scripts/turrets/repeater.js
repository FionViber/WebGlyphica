import { Prim, Matter, Random } from 'sphere-runtime'
import { Entity } from '../core/entityFactory.js'
import { Impact } from '../effects/impact.js'
import { Sparks } from '../effects/sparks.js'
import { Turret } from './turret.js'
import { Explosion } from '../effects/explosion.js'

export class Repeater extends Turret
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("weapon_repeater_title") }
	static getDesc() { return localize("weapon_repeater_desc") }
	static damageTags() { return ["tag_kinetic"] }
	static nonDamageTags() { return ["tag_main"] }
	
	constructor()
	{
		super({radius: scalePix(20)})

		// Variables for firing.
		this.cooldown = 5
		this.spread = 0.0005
		this.shotgun = false
		this.explodingBullets = false
		this.shotgunAudioPlayed = false
		this.currentCooldown = 0
		this.outstandingProjectiles = 0
		this.currentTarget = null
		this.baseProjectileCount = 3
		this.upgrade_projectileCount = 0
		this.upgrade_projectileChain = 0

		// Base stats.
		this.dmg.base.kinetic = 35
		this.base.critChance = .05
		this.base.critMult = 1.5
		this.base.range = 0
		this.refreshModifiers()
		
		// Start this task.
		this.start()
	}

	on_update()
	{
		if (!isPaused())
		{
			// Calculate shield.
			this.calcShield()

			// Fire outstanding projectiles if no cooldown.
			if (this.outstandingProjectiles > 0)
			{
				if (--this.currentCooldown <= 0)
				{
					if (this.currentTarget != null)
					{
						// Audio hooks
						if (this.shotgun && !this.shotgunAudioPlayed)
						{
							this.shotgunAudioPlayed = true
							audioHandler.playAudioHook("repeater_shotgun")
						}
						else if (!this.shotgun)
							audioHandler.playAudioHook("repeater_shot")
						
						// Spawn bullet.
						factory.spawn(
							ProjRepeater,
							this.body.position,
							this.currentTarget,
							this
						)
						this.currentCooldown = this.cooldown
						this.outstandingProjectiles -= 1
					}
					else this.outstandingProjectiles = 0
				}
			}
			else if (this.currentTarget != null)
				this.currentTarget = null
		}
	}

	on_render()
	{
		PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(20), scalePix(5), midGray)
		PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(12), scalePix(2), midGray.fadeTo(0.2))
		let endAngle = Math.PI * 2 * currentExperience / expToNextLevel
		PrimNative.drawArc(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(12), 0, endAngle, 2, midGray)
		super.on_render()
	}

	fire(target)
	{
		super.fire(target)
		this.currentTarget = target.getPosition()
		this.outstandingProjectiles = this.baseProjectileCount
			+ this.upgrade_projectileCount
		if (this.shotgun)
			this.shotgunAudioPlayed = false
	}

	getEvolution()
	{
		return [
			{
				name: "evo_repeater_frostFang",
				desc: localize("evo_repeater_frostFang_desc", "+10", "3%"),
				icon: "",
				weight: 10,
				requirementsMet: modifiers.getModifierCount(this, "evo_repeater_frostFang") == 0,
				reference: this,
				effect: function(repeater)
				{
					modifiers.addAbsModifier(repeater, "evo_repeater_frostFang", {cold: 10})
					repeater.refreshModifiers()
				}
			},
			{
				name: "evo_repeater_frostFang_2",
				desc: localize("evo_repeater_frostFang_2_desc", "+20", "-10"),
				icon: "",
				weight: 20,
				requirementsMet: (
					modifiers.getModifierCount(this, "evo_repeater_frostFang") > 0 &&
					modifiers.getModifierCount(this, "evo_repeater_frostFang_2") == 0
				),
				reference: this,
				effect: function(repeater)
				{
					modifiers.addAbsModifier(repeater, "evo_repeater_frostFang_2", {cold: 20, kinetic: -10})
					repeater.refreshModifiers()
				}
			},
			{
				name: "evo_repeater_ricochet",
				desc: localize("evo_repeater_ricochet_desc", "3", "50%"),
				icon: "",
				weight: 10,
				requirementsMet: this.upgrade_projectileChain == 0,
				reference: this,
				effect: function(repeater)
				{
					repeater.upgrade_projectileChain = 3
				}
			},
			{
				name: "evo_repeater_ricochet_2",
				desc: localize("evo_repeater_ricochet_2_desc", "+2"),
				icon: "",
				weight: 20,
				requirementsMet: this.upgrade_projectileChain == 3,
				reference: this,
				effect: function(repeater)
				{
					repeater.upgrade_projectileChain = 5
				}
			},
			{
				name: "evo_repeater_shotgun",
				desc: localize("evo_repeater_shotgun_desc", "+5", "+400%", "-10"),
				icon: "",
				weight: 10,
				requirementsMet: !this.shotgun,
				reference: this,
				effect: function(repeater)
				{
					repeater.shotgun = true
					repeater.cooldown = 0
					repeater.spread = .02
					repeater.upgrade_projectileCount = 5
					modifiers.addAbsModifier(repeater, "evo_repeater_shotgun", {kinetic: -10})
				}	
			},
			{
				name: "evo_repeater_shotgun_2",
				desc: localize("evo_repeater_shotgun_2_desc", "+5", "+100%"),
				icon: "",
				weight: 20,
				requirementsMet: (
					this.shotgun &&
					modifiers.getModifierCount(this, "evo_repeater_shotgun") > 0 &&
					modifiers.getModifierCount(this, "evo_repeater_shotgun") == 0
				),
				reference: this,
				effect: function(repeater)
				{
					repeater.upgrade_projectileCount += 5
					repeater.spread = .04
				}	
			},
			{
				name: "evo_repeater_explodingBullets",
				desc: localize("evo_repeater_explodingBullets_desc", "+5", "-10"),
				icon: "",
				weight: 10,
				requirementsMet: modifiers.getModifierCount(this, "evo_repeater_explodingBullets") == 0,
				reference: this,
				effect: function(repeater)
				{
					repeater.explodingBullets = true
					repeater.base.range = 75
					modifiers.addAbsModifier(repeater, "evo_repeater_explodingBullets", {explosive: 7.5, kinetic: -10})
					repeater.refreshModifiers()
				}	
			},
			{
				name: "evo_repeater_explodingBullets_2",
				desc: localize("evo_repeater_explodingBullets_2_desc", "+10", "-10"),
				icon: "",
				weight: 20,
				requirementsMet: (
					modifiers.getModifierCount(this, "evo_repeater_explodingBullets") > 0 &&
					modifiers.getModifierCount(this, "evo_repeater_explodingBullets_2") == 0
				),
				reference: this,
				effect: function(repeater)
				{
					repeater.base.range = 100
					modifiers.addAbsModifier(repeater, "evo_repeater_explodingBullets_2", {explosive: 15, kinetic: -10})
					repeater.refreshModifiers()
				}	
			}
		]
	}

	getUpgrades()
	{
		return [
			...super.getEvolutionUpgrades(),
			{
				name: "repeater_upgrade_damage_common",
				desc: localize("repeater_upgrade_damage_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_repeater_title",
				weight: 60,
				requirementsMet: true,
				reference: this,
				effect: function(repeater)
				{
					modifiers.addPercModifier(repeater, "repeater_upgrade_damage_common", {damage: .1})
				}
			},
			{
				name: "repeater_upgrade_damage_uncommon",
				desc: localize("repeater_upgrade_damage_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_repeater_title",
				weight: 20,
				requirementsMet: true,
				reference: this,
				effect: function(repeater)
				{
					modifiers.addPercModifier(repeater, "repeater_upgrade_damage_uncommon", {damage: .2})
				}
			},
			{
				name: "repeater_upgrade_damage_rare",
				desc: localize("repeater_upgrade_damage_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_repeater_title",
				weight: 7,
				requirementsMet: true,
				reference: this,
				effect: function(repeater)
				{
					modifiers.addPercModifier(repeater, "repeater_upgrade_damage_rare", {damage: .3})
				}
			},
			{
				name: "repeater_upgrade_crit_common",
				desc: localize("repeater_upgrade_crit_desc", "1%", "50%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_repeater_title",
				weight: 60,
				requirementsMet: true,
				reference: this,
				effect: function(repeater)
				{
					modifiers.addPercModifier(repeater, "repeater_upgrade_crit_common", {critChance: 0.01, critMult: .5})
				}
			},
			{
				name: "repeater_upgrade_crit_uncommon",
				desc: localize("repeater_upgrade_crit_desc", "2%", "100%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_repeater_title",
				weight: 20,
				requirementsMet: true,
				reference: this,
				effect: function(repeater)
				{
					modifiers.addPercModifier(repeater, "repeater_upgrade_crit_uncommon", {critChance: 0.02, critMult: 1})
				}
			},
			{
				name: "repeater_upgrade_crit_rare",
				desc: localize("repeater_upgrade_crit_desc", "3%", "200%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_repeater_title",
				weight: 7,
				requirementsMet: true,
				reference: this,
				effect: function(repeater)
				{
					modifiers.addPercModifier(repeater, "repeater_upgrade_crit_rare", {critChance: 0.03, critMult: 2})
				}
			}
		]
	}
}

class ProjRepeater extends Entity
{
	constructor()
	{
		super()
		this.speed = scalePix(25)
	}

	reset(position, target, parent, homing = false, numchain = 0)
	{
		// Reset vars.
		this.lastCoords = Array(3).fill(position)
		this.position = position
		this.parent = parent
		this.homingTarget = homing ? target : null
		this.numchain = numchain

		// Calculate velocity.
		let direction = Vector.normalise(Vector.sub(target, position))
		direction = Vector.rotate(direction, Random.normal(0, this.parent.spread))	// Bullet spread.
		this.velocity = Vector.mult(direction, this.speed)
	}

	on_update()
	{
		if (!isPaused())
		{
			// If out of screen, destroy.
			if (!Matter.Bounds.contains(screenBounds, this.position))
				this.suspend()

			// Detect collisions.
			if (this.homingTarget && this.homingTarget.active) 
				this.velocity = Vector.mult(Vector.normalise(Vector.sub(this.homingTarget.getPosition(), this.position)), this.speed)
			let nextPosition = Vector.add(this.position, this.velocity)
			let collisions = Matter.Query.ray(hostileBodies, this.position, nextPosition)
			if (collisions.length > 0)
			{
				let collision = collisions[0]
				let other = hostiles.get(collision.bodyA.id)
				let colPt = collisionPoint(this.position, nextPosition, collision.bodyA)

				// Make sure enemy is still valid.
				if (other)
				{
					// Handle damage.
					let damage = Random.uniform(this.parent.dmg.mod.all, 5) * (this.homingTarget ? .5 : 1)
					let result = other.getHit(damage, this.parent, colPt)
					this.parent.recordDamage(result.damage)

					// VFX.
					let randomPositionX = Random.uniform(colPt.x, scalePix(5))
					let randomPositionY = Random.uniform(colPt.y, scalePix(5))
					let angle = Math.atan2(this.velocity.y, this.velocity.x)
					factory.spawn(Impact, randomPositionX, randomPositionY)
					for (let i = 0; i < 5; i++)
						factory.spawn(Sparks, randomPositionX, randomPositionY, Random.normal(angle, Math.PI / 6))

					// Make explosion if Exploding Bullets are active
					if (this.parent.explodingBullets)
						factory.spawn(Explosion, colPt.x, colPt.y, this.parent, this.parent.mod.range, false, { type: 'explosive', damage: Random.uniform(this.parent.dmg.mod.explosive, 3) })
					
					// Spawn chained projectiles (if any)
					if (!this.homingTarget && this.parent.upgrade_projectileChain > 0)
						this.numchain = this.parent.upgrade_projectileChain
					if (this.numchain > 0)
					{
						let randomEnemyInRange = Random.sample(hostilesArray.filter(enemy => {
							return enemy != this.homingTarget &&
								enemy.getType() == type.enemy &&
								Matter.Bounds.overlaps(enemy.body.bounds, screenBounds) &&
								distanceBetween(this.position, enemy.getPosition()) < scalePix(400)
						}))
						if (randomEnemyInRange)
							factory.spawn(ProjRepeater, this.position, randomEnemyInRange, this.parent, true, this.numchain - 1)
					}

					// SFX.
					let ricoOrHit = this.numchain > 0 ? "ricochet" : "hit"
					audioHandler.playAudioHook(result.isCrit ? `repeater_${ricoOrHit}_crit` : `repeater_${ricoOrHit}_normal`, getPanFromX(colPt.x))

					// Destroy projectile.
					this.suspend()
				}
			}

			// Update last coords.
			this.lastCoords.push(this.position)
			this.lastCoords.shift()

			// Move.
			this.position = nextPosition
		}
	}

	on_render()
	{
		let trailEndCoord = this.lastCoords[this.parent.shotgun ? 1 : 0]
		Prim.drawLine(Surface.Screen, this.position.x, this.position.y, trailEndCoord.x, trailEndCoord.y, 2, midGray, midGray.fadeTo(0))
		if (!this.parent.shotgun) PrimNative.drawFilledCircle(Surface.Screen, this.position.x, this.position.y, 2, darkGray)
	}
}