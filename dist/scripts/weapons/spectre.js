import { Matter, Random } from 'sphere-runtime'
import { Impact } from '../effects/impact.js'
import { Weapon, FriendlyDrone } from './weapon.js'
import { Sparks } from '../effects/sparks.js'
import { ChargeUpLines } from '../effects/chargeUpLines.js'
import { Explosion } from '../effects/explosion.js'

export class Spectre extends Weapon
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("weapon_spectre_title") }
	static getDesc() { return localize("weapon_spectre_desc") }
	static damageTags() { return ["tag_kinetic"] }
	static nonDamageTags() { return ["tag_drone"] }

	constructor()
	{
		super()
		this.selfDestruct = false
		this.spawnOnLongWord = false
		this.allDamageTypesExceptExplosive = modifiers.damageTypes.filter(type => type != 'explosive')
		this.spectresProduced = null	// Track spectres produced for Super Spectres.

		// Base stats.
		this.base.duration = 300
		this.dmg.base.kinetic = 5
		this.base.speed = 6
		this.base.critChance = 0.01
		this.base.critMult = 2
		this.refreshModifiers()

		this.upgrade_count = 0
		let triggerString = "["
		getTriggerLetters('Spectre').forEach(v => triggerString += v)
		this.letters = new RegExp(triggerString + "]", "g")
		this.buttons = [direction_up, direction_down, direction_left, direction_right]
	}

	onWordComplete(word, quicktime, target)
	{
		let count = usingController ?
			quicktime.reduce((total, current) => total += this.buttons.includes(current), 0) :
			(word.match(this.letters) || []).length
		
		// If any matches.
		if (count > 0)
		{
			// Spawn on long word upgrade.
			if (this.spawnOnLongWord && (usingController ? quicktime.length >= 4 : word.length >= 8))
				count++

			// Add drone count upgrades.
			count += this.upgrade_count

			// If Armada augment.
			if ("augment_armada" in activeAugments)
			{
				let armada = 0
				for (let i = 0; i < count; i++)
					armada += Random.chance(.2)
				count += armada
			}
	
			// If Juryrigged loot.
			if ("item_bonus_drones" in serializedLoot)
			{
				let bonus_drones = 0
				for (let i = 0; i < count; i++)
					bonus_drones += Random.chance(.35)
				count += bonus_drones
			}

			// Spawn Spectres.
			for (let i = 0; i < count; i++)
				this.spawnSpectre(target.getPosition())
		}
	}

	spawnSpectre(position)
	{
		factory.spawn(
			SpectreDrone,
			position.x,
			position.y,
			this,
			this.spectresProduced >= 19 ? true : false
		)
		if (this.spectresProduced >= 19) factory.spawn(ChargeUpLines, position)
		if (this.spectresProduced != null)
			this.spectresProduced = this.spectresProduced >= 19 ? 0 : this.spectresProduced + 1
	}

	refreshModifiers()
	{
		super.refreshModifiers()
		this.allDamageExceptExplosive = Object.entries(this.dmg.mod)
			.filter(pair => pair[0] != 'all' && pair[0] != 'explosive')
			.reduce((total, current) => total += current[1], 0)
	}

	getEvolution()
	{
		return [
			{
				name: "evo_spectre_supercharged",
				desc: localize("evo_spectre_supercharged_desc"),
				descBlock: true,
				icon: "",
				weight: 10,
				requirementsMet: this.spectresProduced == null,
				reference: this,
				effect: function(spectre)
				{
					spectre.spectresProduced = 0
				}
			},
			{
				name: "evo_spectre_selfDestruct",
				desc: localize("evo_spectre_selfDestruct_desc", "+50"),
				icon: "",
				weight: 10,
				requirementsMet: !this.selfDestruct,
				reference: this,
				effect: function(spectre)
				{
					modifiers.addAbsModifier(spectre, "evo_spectre_selfDestruct", { explosive: 50 })
					spectre.selfDestruct = true
					spectre.base.range = 100
					spectre.refreshModifiers()
				}
			},
			{
				name: "evo_spectre_selfDestruct_2",
				desc: localize("evo_spectre_selfDestruct_2_desc", "+50", "+30%"),
				icon: "",
				weight: 10,
				requirementsMet: (
					this.selfDestruct &&
					modifiers.getModifierCount(this, "evo_spectre_selfDestruct_2") == 0
				),
				reference: this,
				effect: function(spectre)
				{
					modifiers.addAbsModifier(spectre, "evo_spectre_selfDestruct_2", { explosive: 50 })
					modifiers.addPercModifier(spectre, "evo_spectre_selfDestruct_2", { range: .3 })
					spectre.refreshModifiers()
				}
			},
			{
				name: "evo_spectre_volatileFuel",
				desc: localize("evo_spectre_volatileFuel_desc", "+50%"),
				icon: "",
				weight: 10,
				requirementsMet: modifiers.getModifierCount(this, "evo_spectre_volatileFuel") == 0,
				reference: this,
				effect: function(spectre)
				{
					modifiers.addPercModifier(spectre, "evo_spectre_volatileFuel", { speed: .5 })
					spectre.refreshModifiers()
				}
			},
			{
				name: "evo_spectre_volatileFuel_2",
				desc: localize("evo_spectre_volatileFuel_2_desc", "50%", "-25%"),
				icon: "",
				weight: 10,
				requirementsMet: (
					modifiers.getModifierCount(this, "evo_spectre_volatileFuel") > 0 &&
					modifiers.getModifierCount(this, "evo_spectre_volatileFuel_2") == 0
				),
				reference: this,
				effect: function(spectre)
				{
					modifiers.addPercModifier(spectre, "evo_spectre_volatileFuel_2", { speed: .5, duration: -.25 })
					spectre.refreshModifiers()
				}
			}
		]
	}

	getUpgrades()
	{
		return [
			...super.getEvolutionUpgrades(),
			{
				name: "spectre_upgrade_damage_common",
				desc: localize("spectre_upgrade_damage_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_spectre_title",
				weight: 60,
				group: "spectre_damage",
				requirementsMet: true,
				reference: this,
				effect: function(spectre)
				{
					modifiers.addPercModifier(spectre, "spectre_upgrade_damage_common", {damage: .15})
				}
			},
			{
				name: "spectre_upgrade_damage_uncommon",
				desc: localize("spectre_upgrade_damage_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_spectre_title",
				weight: 20,
				group: "spectre_damage",
				requirementsMet: true,
				reference: this,
				effect: function(spectre)
				{
					modifiers.addPercModifier(spectre, "spectre_upgrade_damage_uncommon", {damage: .25})
				}
			},
			{
				name: "spectre_upgrade_damage_rare",
				desc: localize("spectre_upgrade_damage_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_spectre_title",
				weight: 7,
				group: "spectre_damage",
				requirementsMet: true,
				reference: this,
				effect: function(spectre)
				{
					modifiers.addPercModifier(spectre, "spectre_upgrade_damage_rare", {damage: .35})
				}
			},
			{
				name: "spectre_upgrade_duration_common",
				desc: localize("spectre_upgrade_duration_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_spectre_title",
				weight: 60,
				group: "spectre_duration",
				requirementsMet: true,
				reference: this,
				effect: function(spectre)
				{
					modifiers.addPercModifier(spectre, "spectre_upgrade_duration_common", {duration: .1})
				}
			},
			{
				name: "spectre_upgrade_duration_uncommon",
				desc: localize("spectre_upgrade_duration_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_spectre_title",
				weight: 20,
				group: "spectre_duration",
				requirementsMet: true,
				reference: this,
				effect: function(spectre)
				{
					modifiers.addPercModifier(spectre, "spectre_upgrade_duration_uncommon", {duration: .2})
				}
			},
			{
				name: "spectre_upgrade_duration_rare",
				desc: localize("spectre_upgrade_duration_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_spectre_title",
				weight: 7,
				group: "spectre_duration",
				requirementsMet: true,
				reference: this,
				effect: function(spectre)
				{
					modifiers.addPercModifier(spectre, "spectre_upgrade_duration_rare", {duration: .3})
				}
			},
			{
				name: "spectre_upgrade_count",
				desc: localize("spectre_upgrade_count_desc", usingController ? "3" : "7"),
				descBlock: true,
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_spectre_title",
				weight: 10,
				requirementsMet: this.spawnOnLongWord == false,
				reference: this,
				effect: function(spectre)
				{
					spectre.spawnOnLongWord = true
				}
			}
		]
	}
}

class SpectreDrone extends FriendlyDrone
{
	constructor()
	{
		// Superclass constructor.
		super()

		// Define consts.
		this.position = Vector.create(0, 0)
		this.rotationSpeed = 0.2
		this.cooldown = 5
		this.lastCoords = Array(10)
		this.superSpectre = false
	}

	reset(x, y, parent, superSpectre = false)
	{
		// Reset variables.
		super.reset(parent)
		this.superSpectre = superSpectre
		this.position.x = x
		this.position.y = y
		this.rotation = Random.uniform(Math.PI, Math.PI)
		this.velocity = 0
		this.target = null
		this.lastCoords.fill(this.position)
		this.skipOneFrame = true
		this.currentCooldown = this.cooldown
		this.currentExpiry = 0
		this.renderSpectre = false
		Sphere.sleep(superSpectre ? 40 : 0)
			.then(() => this.renderSpectre = true)

		// Play audio.
		audioHandler.playAudioHook("spectre_spawn")
	}

	on_update()
	{
		if (!isPaused() && this.renderSpectre)
		{
			// Check if expired.
			if (this.currentExpiry >= this.parent.mod.duration * (this.superSpectre ? 1.5 : 1))
			{
				if (this.parent.selfDestruct)
					factory.spawn(
						Explosion,
						this.position.x,
						this.position.y,
						this.parent,
						null,
						true,
						{
							damage: this.parent.dmg.mod.explosive,
							type: 'explosive'
						}
					)
				this.suspend()
			}
			else
				this.currentExpiry++

			// Get nearest enemy.
			this.target = droneFindNearestEnemy(this.position)

			let validTarget = (this.target && this.target.running)
			if (validTarget)
			{
				// Get angle to nearest enemy.
				let direction = Vector.sub(this.target.body.position, this.position)
				let angle = Math.atan2(direction.y, direction.x)

				// Rotate (pick whatever direction is closer).
				let difference = diff(this.rotation, angle)
				if (Math.abs(difference) > this.rotationSpeed)
					this.rotation += Math.sign(difference) * this.rotationSpeed * (this.superSpectre ? 1.5 : 1)
				else
					this.rotation = angle
			}

			// Determine velocity.
			this.velocity = Vector.mult(
				Vector.create(
					Math.cos(this.rotation),
					Math.sin(this.rotation)
				),
				scalePix(this.parent.mod.speed) * (validTarget ? 1 : 0.1) * (this.superSpectre ? 1.5 : 1)
			)

			// Detect collisions.
			if (this.currentCooldown == 0)
			{
				let nextPosition = Vector.add(this.position, this.velocity)
				let collisions = Matter.Query.ray(hostileBodies, this.position, nextPosition)
				if (collisions.length > 0)
				{
					let collision = collisions[0]
					let other = hostiles.get(collision.bodyA.id)
					if (other)
					{
						if (other.getType() == type.armor)
						{
							this.currentCooldown = 60
							let colPt = collisionPoint(this.position, nextPosition, collision.bodyA)
							other.getHit(this.parent.dmg.mod.all, this.parent, colPt)
						}
						else if (other.getType() == type.enemy && other.protection == null)
						{
							this.currentCooldown = this.cooldown
							let colPt = collisionPoint(this.position, nextPosition, collision.bodyA)

							// Handle damage.
							let damage = Random.uniform(this.parent.allDamageExceptExplosive, 1) * (this.superSpectre ? 2 : 1)
							let result = other.getHit(damage, this.parent, colPt, this.parent.allDamageTypesExceptExplosive)
							this.parent.recordDamage(result.damage)

							// Play hit effect.
							let randomPositionX = Random.uniform(colPt.x, 3)
							let randomPositionY = Random.uniform(colPt.y, 3)
							factory.spawn(Impact, randomPositionX, randomPositionY)
							audioHandler.playAudioHook(result.isCrit ? "spectre_hit_crit" : "spectre_hit_normal", getPanFromX(colPt.x))
							for (let i = 0; i < 7; i++)
								factory.spawn(Sparks, randomPositionX, randomPositionY, Random.normal(this.rotation, Math.PI / 6))
						}
					}
				}
			}
			else
				this.currentCooldown -= 1
				
			// Record previous position to draw trail.
			if (this.skipOneFrame)
				this.skipOneFrame = false
			else
			{
				this.skipOneFrame = true
				this.lastCoords.push(this.position)
				this.lastCoords.shift()
			}

			// Move.
			this.position = Vector.add(this.position, this.velocity)
		}
	}

	on_render()
	{
		if (this.renderSpectre)
		{
			let increments = 1.0 / this.lastCoords.length
			for (let i = 0; i < this.lastCoords.length; i++)
			{
				let thisCoord = this.lastCoords[i]
				let nextCoord = i == this.lastCoords.length - 1 ? this.position : this.lastCoords[i + 1]
				PrimNative.drawLine(
					Surface.Screen,
					thisCoord.x,
					thisCoord.y,
					nextCoord.x,
					nextCoord.y,
					scalePix(this.superSpectre ? 8 : 4),
					midGray.fadeTo(increments * i)
				)
			}
			if (this.superSpectre)
			{
				PrimNative.drawFilledCircle(Surface.Screen, this.position.x, this.position.y, scalePix(4), midGray)
				PrimNative.drawCircle(Surface.Screen, this.position.x, this.position.y, scalePix(20), scalePix(2), midGray.fadeTo(.5))
			}
		}
	}
}