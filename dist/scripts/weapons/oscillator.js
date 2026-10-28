import { Matter, Random } from 'sphere-runtime'
import { Weapon } from './weapon.js'
import { Impact } from '../effects/impact.js'
import { Sparks } from '../effects/sparks.js'
import { Entity } from '../core/entityFactory.js'
import { Ignite } from './ignite.js'

export class Oscillator extends Weapon
{
	static getIcon() { return "" }
	static getName() { return localize("weapon_oscillator_title") }
	static getDesc() { return localize("weapon_oscillator_desc")}
	static damageTags() { return ["tag_heat"] }
	static nonDamageTags() { return ["tag_remote"] }

	constructor()
	{
		// Superclass constructor.
		super()

		// Declare vars.
		this.currentDirection = Vector.create(-1, 0)
		this.desiredDirection = this.currentDirection
		this.dmg.base.heat = 10
		this.base.range = 0.2
		this.base.speed = Math.PI / 60
		this.base.critChance = 0.005
		this.base.critMult = 2
		this.refreshModifiers()

		// Spread calculation.
		this.offset = 0
		this.offsetTimeline = 0
		this.twinHeaded = false
		this.stabilizedPlasma = false

		// Play spawn audio.
		audioHandler.playAudioHook("oscillator_spawn")

		// Start task.
		this.start()
	}

	onMainTurretFire(target)
	{
		if (target.getType() == type.enemy)
			this.desiredDirection = Vector.sub(target.getPosition(), screenCenter)
	}

	on_update()
	{
		if (!isPaused())
		{
			// Rotate Oscillator.
			if (this.currentDirection != this.desiredDirection)
			{
				let currentAngle = Math.atan2(this.currentDirection.y, this.currentDirection.x)
				let desiredAngle = Math.atan2(this.desiredDirection.y, this.desiredDirection.x)
				let angleDifference = diff(currentAngle, desiredAngle)
				if (Math.abs(angleDifference) > scalePix(this.mod.speed) / 2)
					this.currentDirection = Vector.rotate(this.currentDirection, Math.sign(angleDifference) * scalePix(this.mod.speed))
				else
					this.currentDirection = this.desiredDirection
			}

			// Determine current offset.
			this.offsetTimeline += 0.1
			this.offset = Math.sin(this.offsetTimeline) * this.mod.range

			// Release projectiles.
			let currentDirection = Vector.rotate(this.currentDirection, this.offset)
			factory.spawn(ProjOscillator, screenCenter, Vector.add(screenCenter, currentDirection), this)
			if (this.twinHeaded)
				factory.spawn(ProjOscillator, screenCenter, Vector.add(screenCenter, Vector.mult(currentDirection, -1)), this)
		}
	}

	getEvolution()
	{
		return [
			{
				name: "evo_oscillator_twinHeaded",
				desc: localize("evo_oscillator_twinHeaded_desc"),
				icon: "",
				weight: 10,
				requirementsMet: !this.twinHeaded,
				reference: this,
				effect: function(oscillator)
				{
					oscillator.twinHeaded = true
				}
			},
			{
				name: "evo_oscillator_ballLightning",
				desc: localize("evo_oscillator_ballLightning_desc", "+3", "3%"),
				icon: "",
				weight: 10,
				requirementsMet: modifiers.getModifierCount(this, "evo_oscillator_ballLightning") == 0,
				reference: this,
				effect: function(oscillator)
				{
					modifiers.addAbsModifier(oscillator, "evo_oscillator_ballLightning", { electric: 3 })
					oscillator.refreshModifiers()
				}
			},
			{
				name: "evo_oscillator_ballLightning_2",
				desc: localize("evo_oscillator_ballLightning_2_desc", "+6", "-3"),
				icon: "",
				weight: 10,
				requirementsMet: (
					modifiers.getModifierCount(this, "evo_oscillator_ballLightning") > 0 &&
					modifiers.getModifierCount(this, "evo_oscillator_ballLightning_2") == 0
				),
				reference: this,
				effect: function(oscillator)
				{
					modifiers.addAbsModifier(oscillator, "evo_oscillator_ballLightning_2", { electric: 6, heat: -3 })
					oscillator.refreshModifiers()
				}
			},
			{
				name: "evo_oscillator_stabilizedPlasma",
				desc: localize("evo_oscillator_stabilizedPlasma_desc", "50%"),
				icon: "",
				weight: 10,
				requirementsMet: !this.stabilizedPlasma,
				reference: this,
				effect: function(oscillator)
				{
					oscillator.stabilizedPlasma = true
				}
			},
			{
				name: "evo_oscillator_stabilizedPlasma_2",
				desc: localize("evo_oscillator_stabilizedPlasma_2_desc", "5"),
				icon: "",
				weight: 10,
				requirementsMet: (
					this.stabilizedPlasma && (
						!getExistingWeapon("Ignite") ||
						modifiers.getModifierCount(getExistingWeapon("Ignite"), "evo_oscillator_stabilizedPlasma_2") == 0
					)
				),
				reference: this,
				effect: function(_)
				{
					let igniteWeapon = getExistingWeapon("Ignite")
					if (!igniteWeapon)
					{
						igniteWeapon = new Ignite()
						allWeapons.push(igniteWeapon)
					}
					modifiers.addAbsModifier(igniteWeapon, "evo_oscillator_stabilizedPlasma_2", { heat: 5 })
					igniteWeapon.refreshModifiers()
				}
			}
		]
	}

	getUpgrades()
	{
		return [
			...super.getEvolutionUpgrades(),
			{
				name: "oscillator_upgrade_damage_common",
				desc: localize("oscillator_upgrade_damage_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_oscillator_title",
				weight: 60,
				group: "oscillator_damage",
				requirementsMet: true,
				reference: this,
				effect: function(oscillator)
				{
					modifiers.addPercModifier(oscillator, "oscillator_upgrade_damage_common", {damage: .1})
				}
			},
			{
				name: "oscillator_upgrade_damage_uncommon",
				desc: localize("oscillator_upgrade_damage_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_oscillator_title",
				weight: 20,
				group: "oscillator_damage",
				requirementsMet: true,
				reference: this,
				effect: function(oscillator)
				{
					modifiers.addPercModifier(oscillator, "oscillator_upgrade_damage_uncommon", {damage: .2})
				}
			},
			{
				name: "oscillator_upgrade_damage_rare",
				desc: localize("oscillator_upgrade_damage_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_oscillator_title",
				weight: 7,
				group: "oscillator_damage",
				requirementsMet: true,
				reference: this,
				effect: function(oscillator)
				{
					modifiers.addPercModifier(oscillator, "oscillator_upgrade_damage_rare", {damage: .3})
				}
			},
			{
				name: "oscillator_upgrade_range_common",
				desc: localize("oscillator_upgrade_range_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_oscillator_title",
				weight: 60,
				group: "oscillator_range",
				requirementsMet: true,
				reference: this,
				effect: function(oscillator)
				{
					modifiers.addPercModifier(oscillator, "oscillator_upgrade_range_common", {range: .1})
				}
			},
			{
				name: "oscillator_upgrade_range_uncommon",
				desc: localize("oscillator_upgrade_range_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_oscillator_title",
				weight: 20,
				group: "oscillator_range",
				requirementsMet: true,
				reference: this,
				effect: function(oscillator)
				{
					modifiers.addPercModifier(oscillator, "oscillator_upgrade_range_uncommon", {range: .2})
				}
			},
			{
				name: "oscillator_upgrade_range_rare",
				desc: localize("oscillator_upgrade_range_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_oscillator_title",
				weight: 7,
				group: "oscillator_range",
				requirementsMet: true,
				reference: this,
				effect: function(oscillator)
				{
					modifiers.addPercModifier(oscillator, "oscillator_upgrade_range_rare", {range: .3})
				}
			},
			{
				name: "oscillator_upgrade_crit_common",
				desc: localize("oscillator_upgrade_crit_desc", "1%", "50%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_oscillator_title",
				weight: 60,
				group: "oscillator_crit",
				requirementsMet: true,
				reference: this,
				effect: function(oscillator)
				{
					modifiers.addPercModifier(oscillator, "oscillator_upgrade_crit_common", {critChance: 0.01, critMult: .5})
				}
			},
			{
				name: "oscillator_upgrade_crit_uncommon",
				desc: localize("oscillator_upgrade_crit_desc", "2%", "100%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_oscillator_title",
				weight: 20,
				group: "oscillator_crit",
				requirementsMet: true,
				reference: this,
				effect: function(oscillator)
				{
					modifiers.addPercModifier(oscillator, "oscillator_upgrade_crit_uncommon", {critChance: 0.02, critMult: 1})
				}
			},
			{
				name: "oscillator_upgrade_crit_rare",
				desc: localize("oscillator_upgrade_crit_desc", "3%", "200%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_oscillator_title",
				weight: 7,
				group: "oscillator_crit",
				requirementsMet: true,
				reference: this,
				effect: function(oscillator)
				{
					modifiers.addPercModifier(oscillator, "oscillator_upgrade_crit_rare", {critChance: 0.03, critMult: 2})
				}
			}
		]
	}
}

class ProjOscillator extends Entity
{
	constructor()
	{
		// Superclass constructor.
		super()

		// Define consts.
		this.speed = scalePix(30)
	}

	reset(position, target, parent)
	{
		// Reset vars.
		this.position = position
		this.parent = parent
		this.firstTarget = true

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
					let damage = Random.uniform(this.parent.dmg.mod.all * (this.firstTarget ? 1 : .5), 1)
					let result = other.getHit(damage, this.parent, colPt)
					this.parent.recordDamage(result.damage)

					// Hit effect.
					let randomPositionX = Random.uniform(colPt.x, 3)
					let randomPositionY = Random.uniform(colPt.y, 3)
					let angle = Math.atan2(this.velocity.y, this.velocity.x)
					factory.spawn(Impact, randomPositionX, randomPositionY)
					audioHandler.playAudioHook(result.isCrit ? "oscillator_hit_crit" : "oscillator_hit_normal", getPanFromX(colPt.x))
					for (let i = 0; i < 4; i++)
						factory.spawn(Sparks, randomPositionX, randomPositionY, Random.normal(angle, Math.PI / 6))
					
					// Remove first target tag.
					if (this.firstTarget) this.firstTarget = false

					// Destroy projectile.
					if (!this.parent.stabilizedPlasma) this.suspend()
				}
			}

			// Move.
			this.position = nextPosition
		}
	}

	on_render()
	{
		PrimNative.drawFilledCircle(Surface.Screen, this.position.x, this.position.y, scalePix(3), midGray.fadeTo(0.7))
	}
}