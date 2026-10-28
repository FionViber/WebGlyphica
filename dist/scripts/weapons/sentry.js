import { Random, Matter } from 'sphere-runtime'
import { Impact } from '../effects/impact.js'
import { Weapon, FriendlyTurret } from './weapon.js'
import { Sparks } from '../effects/sparks.js'
import { Entity } from '../core/entityFactory.js'
import { Powerup } from '../core/powerup.js'
import { Damage } from '../effects/damage.js'

export class Sentry extends Weapon
{
	static getIcon() { return "" }
	static getName() { return localize("weapon_sentry_title") }
	static getDesc() { return localize("weapon_sentry_desc") }
	static damageTags() { return ["tag_heat"] }
	static nonDamageTags() { return ["tag_turret"] }

	constructor()
	{
		super()

		// Set parameters.
		this.base.speed = 0.1
		this.dmg.base.heat = 30
		this.base.rateOfFire = 86
		this.base.range = 400
		this.base.critChance = 0.01
		this.base.critMult = 2
		this.refreshModifiers()

		// Declare variables.
		this.sentries = []
		this.emergencyProtocolLevel = 0
		this.isEmergencyProtocol = false

		// Start.
		this.addTurret()
		this.start()
	}

	on_update()
	{
		if (!isPaused())
		{
			// Get nearest n enemies, where n is equal to number of sentries.
			let range = scalePix(this.mod.range) * (this.isEmergencyProtocol ? 1.5 : 1)
			let nearestEnemies = hostilesArray
				.filter(v => v.getType() == type.enemy && distanceBetween(screenCenter, v.getPosition()) < range)
				.sort((a, b) => distanceBetween(screenCenter, a.getPosition()) > distanceBetween(screenCenter, b.getPosition()) ? 1 : -1)
			
			// Update all sentries.
			this.sentries.forEach((v, i) => {
				let target = nearestEnemies[i]
				v.target = target ? target : Random.sample(nearestEnemies)
			})
		}
	}

	on_render()
	{	
		// Draw range.
		let range = scalePix(this.mod.range) * (this.isEmergencyProtocol ? 1.5 : 1)
		PrimNative.drawCircle(Surface.Screen, screenCenter.x, screenCenter.y, range, 2, midGray.fadeTo(0.3))
	}

	addTurret()
	{
		audioHandler.playAudioHook("sentry_spawn")
		this.sentries.push(factory.spawn(SentryTurret, this))
		this.sentries.forEach((v, i) => {
			v.restAngle = Math.PI * 2 / this.sentries.length * i
		})
	}

	onShieldDestroyed()
	{
		if (this.emergencyProtocolLevel > 0)
		{
			factory.spawn(Damage, screenCenter.x, screenCenter.y, localize("powerup_emergency_protocol"), false, true, true)
			let existingEmergencyProtocol = powerups.find((powerup) => powerup.constructor.name == "EmergencyProtocol")
			if (existingEmergencyProtocol)
				existingEmergencyProtocol.node.currentProgress = existingEmergencyProtocol.node.maxProgress
			else
				factory.spawn(EmergencyProtocol, this.mod.duration, this)
		}
	}

	getEvolution()
	{
		return [
			{
				name: this.sentries.length == 2 ? "evo_sentry_defenseGrid_2" : "evo_sentry_defenseGrid",
				desc: localize("evo_sentry_defenseGrid_desc"),
				icon: "",
				weight: 10,
				requirementsMet: this.sentries.length < 3,
				reference: this,
				effect: function(sentry)
				{
					sentry.addTurret()
				}
			},
			{
				name: "evo_sentry_solidCore",
				desc: localize("evo_sentry_solidCore_desc", "+10", "3%"),
				icon: "",
				weight: 10,
				requirementsMet: modifiers.getModifierCount(this, "evo_sentry_solidCore") == 0,
				reference: this,
				effect: function(sentry)
				{
					modifiers.addAbsModifier(sentry, "evo_sentry_solidCore", { kinetic: 10 })
					sentry.refreshModifiers()
				}
			},
			{
				name: "evo_sentry_solidCore_2",
				desc: localize("evo_sentry_solidCore_2_desc", "+20", "-10"),
				icon: "",
				weight: 10,
				requirementsMet: (
					modifiers.getModifierCount(this, "evo_sentry_solidCore") > 0 &&
					modifiers.getModifierCount(this, "evo_sentry_solidCore_2") == 0
				),
				reference: this,
				effect: function(sentry)
				{
					modifiers.addAbsModifier(sentry, "evo_sentry_solidCore_2", { kinetic: 20, heat: -10 })
					sentry.refreshModifiers()
				}
			},
			{
				name: "evo_sentry_emergencyProtocol",
				desc: localize("evo_sentry_emergencyProtocol_desc", "10", "+50%", "+100%"),
				icon: "",
				weight: 10,
				requirementsMet: this.emergencyProtocolLevel == 0,
				reference: this,
				effect: function(sentry)
				{
					sentry.emergencyProtocolLevel = 1
					sentry.base.duration = 600
					sentry.refreshModifiers()
				}
			},
			{
				name: "evo_sentry_emergencyProtocol_2",
				desc: localize("evo_sentry_emergencyProtocol_2_desc", "+50%", "+50%"),
				icon: "",
				weight: 10,
				requirementsMet: this.emergencyProtocolLevel == 1,
				reference: this,
				effect: function(sentry)
				{
					sentry.emergencyProtocolLevel = 2
				}
			}
		]
	}

	// Upgrades.
	getUpgrades()
	{
		return [
			...super.getEvolutionUpgrades(),
			{
				name: "sentry_upgrade_rateOfFire_common",
				desc: localize("sentry_upgrade_rateOfFire_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_sentry_title",
				weight: 60,
				group: "sentry_rate",
				requirementsMet: true,
				reference: this,
				effect: function(sentry)
				{
					modifiers.addPercModifier(sentry, "sentry_upgrade_rateOfFire_common", {rateOfFire: .1})
				}
			},
			{
				name: "sentry_upgrade_rateOfFire_uncommon",
				desc: localize("sentry_upgrade_rateOfFire_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_sentry_title",
				weight: 20,
				group: "sentry_rate",
				requirementsMet: true,
				reference: this,
				effect: function(sentry)
				{
					modifiers.addPercModifier(sentry, "sentry_upgrade_rateOfFire_uncommon", {rateOfFire: .2})
				}
			},
			{
				name: "sentry_upgrade_rateOfFire_rare",
				desc: localize("sentry_upgrade_rateOfFire_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_sentry_title",
				weight: 7,
				group: "sentry_rate",
				requirementsMet: true,
				reference: this,
				effect: function(sentry)
				{
					modifiers.addPercModifier(sentry, "sentry_upgrade_rateOfFire_rare", {rateOfFire: .3})
				}
			},
			{
				name: "sentry_upgrade_damage_common",
				desc: localize("sentry_upgrade_damage_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_sentry_title",
				weight: 60,
				group: "sentry_damage",
				requirementsMet: true,
				reference: this,
				effect: function(sentry)
				{
					modifiers.addPercModifier(sentry, "sentry_upgrade_damage_common", {damage: .1})
				}
			},
			{
				name: "sentry_upgrade_damage_uncommon",
				desc: localize("sentry_upgrade_damage_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_sentry_title",
				weight: 20,
				group: "sentry_damage",
				requirementsMet: true,
				reference: this,
				effect: function(sentry)
				{
					modifiers.addPercModifier(sentry, "sentry_upgrade_damage_uncommon", {damage: .2})
				}
			},
			{
				name: "sentry_upgrade_damage_rare",
				desc: localize("sentry_upgrade_damage_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_sentry_title",
				weight: 7,
				group: "sentry_damage",
				requirementsMet: true,
				reference: this,
				effect: function(sentry)
				{
					modifiers.addPercModifier(sentry, "sentry_upgrade_damage_rare", {damage: .3})
				}
			},
			{
				name: "sentry_upgrade_range_common",
				desc: localize("sentry_upgrade_range_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_sentry_title",
				weight: 60,
				group: "sentry_range",
				requirementsMet: this.mod.range < this.base.range * 2,
				reference: this,
				effect: function(sentry)
				{
					modifiers.addPercModifier(sentry, "sentry_upgrade_range_common", {range: .1})
				}
			},
			{
				name: "sentry_upgrade_range_uncommon",
				desc: localize("sentry_upgrade_range_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_sentry_title",
				weight: 20,
				group: "sentry_range",
				requirementsMet: this.mod.range < this.base.range * 2,
				reference: this,
				effect: function(sentry)
				{
					modifiers.addPercModifier(sentry, "sentry_upgrade_range_uncommon", {range: .2})
				}
			},
			{
				name: "sentry_upgrade_range_rare",
				desc: localize("sentry_upgrade_range_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_sentry_title",
				weight: 7,
				group: "sentry_range",
				requirementsMet: this.mod.range < this.base.range * 2,
				reference: this,
				effect: function(sentry)
				{
					modifiers.addPercModifier(sentry, "sentry_upgrade_range_rare", {range: .3})
				}
			}
		]
	}
}

class EmergencyProtocol extends Powerup
{
	constructor() { super("powerup_emergency_protocol") }
	reset(duration, parent)
	{
		this.parent = parent
		super.reset(duration)
	}
	on_init()
	{
		this.parent.isEmergencyProtocol = true
		audioHandler.playAudioHookUI("sentry_emergencyProtocol_start")
		bgm.fadeTo(bgm.getMusicInSet("emergencyProtocol"))
	}
	on_expire(forced)
	{
		if (!forced)
		{
			audioHandler.playAudioHookUI("sentry_emergencyProtocol_stop")
			bgm.resume()
		}
		this.parent.isEmergencyProtocol = false
	}
}

class SentryTurret extends FriendlyTurret
{
	reset(parent)
	{
		// Declare vars.
		super.reset(screenCenter.x, screenCenter.y, parent)
		this.restAngle = 0
		this.angle = Random.uniform(Math.PI, Math.PI)
		this.currentCooldown = 0
		this.target = null
	}

	// Every frame.
	update()
	{
		if (isPaused()) return
		
		// Track target.
		if (this.target && this.target.running)
		{
			let direction = Vector.sub(this.target.body.position, screenCenter)
			let angle = Math.atan2(direction.y, direction.x)
			let difference = diff(this.angle, angle)

			// Rotate to target (whichever direction is closer).
			if (Math.abs(difference) > this.parent.mod.speed)
				this.angle += Math.sign(difference) * this.parent.mod.speed
					* (this.parent.isEmergencyProtocol && this.parent.emergencyProtocolLevel > 1 ? 1.5 : 1 )
			
			// Else fire.
			else
			{
				this.angle = angle
				let range = scalePix(this.parent.mod.range)
				if (++this.currentCooldown >= 3600 / (this.parent.mod.rateOfFire * (this.parent.isEmergencyProtocol ? 2 : 1))
					&& distanceBetween(screenCenter, this.target.body.position) < range)
				{
					let startPosition = Vector.add(Vector.mult(Vector.normalise(direction), 25), screenCenter)
					audioHandler.playAudioHook("sentry_shot")
					factory.spawn(ProjSentry, startPosition, this.target.body.position, this.parent)
					this.currentCooldown = 0
				}
			}
		}
		else
		{
			// If no target, move to rest angle.
			let difference = diff(this.angle, this.restAngle)

			// Rotate to target (whichever direction is closer).
			if (Math.abs(difference) > this.parent.mod.speed)
				this.angle += Math.sign(difference) * this.parent.mod.speed
			else
				this.angle = this.restAngle
		}
	}

	// Render
	on_render()
	{
		sentryModel.transform.identity()
		sentryModel.transform.translate(scalePix(25), 0)
		sentryModel.transform.rotate(this.angle / Math.PI * 180)
		sentryModel.transform.translate(screenCenter.x, screenCenter.y)
		sentryModel.draw(Surface.Screen)
	}
}

class ProjSentry extends Entity
{
	constructor()
	{
		// Superclass constructor.
		super()

		// Define consts.
		this.speed = scalePix(25)
	}

	reset(position, target, parent)
	{
		// Reset vars.
		this.position = position
		this.parent = parent

		// Calculate velocity.
		let direction = Vector.normalise(Vector.sub(target, position))
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
					let damage = Random.uniform(this.parent.dmg.mod.all, 5)
						* (this.parent.isEmergencyProtocol && this.parent.emergencyProtocolLevel > 1 ? 1.5 : 1)
					let result = other.getHit(damage, this.parent, colPt)
					this.parent.recordDamage(result.damage)

					// Hit effect.
					let randomPositionX = Random.uniform(colPt.x, 5)
					let randomPositionY = Random.uniform(colPt.y, 5)
					let angle = Math.atan2(this.velocity.y, this.velocity.x)
					factory.spawn(Impact, randomPositionX, randomPositionY)
					audioHandler.playAudioHook(result.isCrit ? "sentry_hit_crit" : "sentry_hit_normal", getPanFromX(colPt.x))
					for (let i = 0; i < 7; i++)
						factory.spawn(Sparks, randomPositionX, randomPositionY, Random.normal(angle, Math.PI / 6))

					// Destroy projectile.
					this.suspend()
				}
			}

			// Spawn trail.
			factory.spawn(ProjSentryTrail, this.position.x, this.position.y)

			// Move.
			this.position = nextPosition
		}
	}

	on_render()
	{
		PrimNative.drawFilledCircle(Surface.Screen, this.position.x, this.position.y, scalePix(10), midGray)
	}
}

class ProjSentryTrail extends Entity
{
	reset(x, y)
	{
		this.position = {x: x, y: y}
		this.thickness = scalePix(5)
	}

	on_update()
	{
		if (!isPaused())
		{
			this.thickness -= scalePix(1)
			if (this.thickness <= 0)
				this.suspend()
		}
	}

	on_render()
	{
		PrimNative.drawCircle(Surface.Screen, this.position.x, this.position.y, scalePix(10) - this.thickness / 2, this.thickness, midGray.fadeTo(.5))
	}
}