import { Random } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { Entity } from '../core/entityFactory.js'
import { Weapon } from './weapon.js'
import { Pickup } from '../pickups/pickup.js'
import { Explosion } from '../effects/explosion.js'
import { Smoke } from '../effects/smoke.js'
import { getRandomPickupSpawnPos } from '../pickups/pickupController.js'

export class Meteor extends Weapon
{
	static getIcon() { return "" }
	static getName() { return localize("weapon_meteor_title") }
	static getDesc() { return localize("weapon_meteor_desc")}
	static damageTags() { return ["tag_explosive"] }
	static nonDamageTags() { return ["tag_remote"] }

	constructor()
	{
		super()

		// Base stats.
		this.dmg.base.explosive = 80
		this.base.range = 300
		this.base.rateOfFire = 360
		this.base.duration = 240
		this.base.critChance = 0.01
		this.base.critMult = 2
		this.refreshModifiers()

		this.pickupSpawnRate = 180
		this.pickups = []
		this.cooldown = this.pickupSpawnRate
		this.cooldownPaused = false
		this.surveillance = 1
		this.relentlessMarker = null

		// Start task.
		this.start()
	}

	onTrialStart() { if (!this.relentlessMarker) this.setSpawnTimer() }
	setSpawnTimer()
	{
		this.cooldownPaused = false
		this.cooldown = this.pickupSpawnRate
	}

	on_update()
	{
		if (!isPaused() && !this.cooldownPaused && this.relentlessMarker == null)
		{
			if (this.cooldown <= 0)
			{
				if (spawner.running) this.spawnMeteor()
				this.cooldownPaused = true
			}
			else
				this.cooldown--
		}
	}

	onWordComplete(_word, _quicktime, target)
	{
		if (this.relentlessMarker != null && target.getType() == type.enemy)
			this.relentlessMarker.targetPosition = Vector.clone(target.getPosition())
	}

	spawnMeteor()
	{
		for (let i = 0; i < this.surveillance; i++)
		{
			let spawnPos = getRandomPickupSpawnPos()
			this.pickups.push(factory.spawn(MeteorPickup, spawnPos.x, spawnPos.y, this))
		}
		audioHandler.playAudioHook("meteor_pickup_spawn")
	}

	getEvolution()
	{
		return [
			{
				name: "evo_meteor_surveillance",
				desc: localize("evo_meteor_surveillance_desc"),
				icon: "",
				weight: 10,
				requirementsMet: (
					this.surveillance == 1 &&
					this.relentlessMarker == null
				),
				reference: this,
				effect: function(meteor)
				{
					meteor.surveillance = 2
				}
			},
			{
				name: "evo_meteor_surveillance_2",
				desc: localize("evo_meteor_surveillance_2_desc"),
				icon: "",
				weight: 10,
				requirementsMet: this.surveillance == 2,
				reference: this,
				effect: function(meteor)
				{
					meteor.surveillance = 3
				}
			},
			{
				name: "evo_meteor_iceRain",
				desc: localize("evo_meteor_iceRain_desc", "-65", "+25", "5%"),
				icon: "",
				weight: 10,
				requirementsMet: modifiers.getModifierCount(this, "evo_meteor_iceRain") == 0,
				reference: this,
				effect: function(meteor)
				{
					modifiers.addAbsModifier(meteor, "evo_meteor_iceRain", { cold: 25, explosive: -65 })
					modifiers.addPercModifier(meteor, "evo_meteor_iceRain", { coldStatusChance: .02 })
					meteor.refreshModifiers()
				}
			},
			{
				name: "evo_meteor_iceRain_2",
				desc: localize("evo_meteor_iceRain_2_desc", "+20", "+5%"),
				icon: "",
				weight: 10,
				requirementsMet: (
					modifiers.getModifierCount(this, "evo_meteor_iceRain") > 0 &&
					modifiers.getModifierCount(this, "evo_meteor_iceRain_2") == 0
				),
				reference: this,
				effect: function(meteor)
				{
					modifiers.addAbsModifier(meteor, "evo_meteor_iceRain_2", { cold: 20 })
					modifiers.addPercModifier(meteor, "evo_meteor_iceRain_2", { coldStatusChance: .05 })
				}
			},
			{
				name: "evo_meteor_relentless",
				desc: localize("evo_meteor_relentless_desc", "-50%", "-50%"),
				icon: "",
				weight: 10,
				requirementsMet: (
					this.relentlessMarker == null &&
					this.surveillance == 1
				),
				reference: this,
				effect: function(meteor)
				{
					// Clear current meteor pickups (if any)
					meteor.pickups.forEach(pickup => pickup.stop())
					meteor.pickups = []

					// Spawn relentless meteor.
					let spawnPos = {
						x: Random.discrete(activeBounds.min.x, activeBounds.max.x),
						y: Random.discrete(activeBounds.min.y, activeBounds.max.y)
					}
					meteor.relentlessMarker = factory.spawn(MeteorTarget, meteor, spawnPos)

					// Add required stats and modifiers.
					meteor.base.speed = 1
					modifiers.addPercModifier(meteor, "evo_meteor_relentless", { range: -.5, rateOfFire: -.5 })
					meteor.refreshModifiers()
				}
			},
			{
				name: "evo_meteor_relentless_2",
				desc: localize("evo_meteor_relentless_2_desc", "+50%", "+10%"),
				icon: "",
				weight: 10,
				requirementsMet: (
					this.relentlessMarker != null &&
					modifiers.getModifierCount(this, "evo_meteor_relentless_2") == 0
				),
				reference: this,
				effect: function(meteor)
				{
					modifiers.addPercModifier(meteor, "evo_meteor_relentless_2", { speed: .5, critChance: .1 })
					meteor.refreshModifiers()
				}
			}
		]
	}

	getUpgrades()
	{
		return [
			...super.getEvolutionUpgrades(),
			{
				name: "meteor_upgrade_damage_common",
				desc: localize("meteor_upgrade_damage_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				group: "meteor_damage",
				base: "weapon_meteor_title",
				weight: 60,
				requirementsMet: true,
				reference: this,
				effect: function(meteor)
				{
					modifiers.addPercModifier(meteor, "meteor_upgrade_damage_common", {damage: .1})
				}
			},
			{
				name: "meteor_upgrade_damage_uncommon",
				desc: localize("meteor_upgrade_damage_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_meteor_title",
				weight: 20,
				group: "meteor_damage",
				requirementsMet: true,
				reference: this,
				effect: function(meteor)
				{
					modifiers.addPercModifier(meteor, "meteor_upgrade_damage_uncommon", {damage: .2})
				}
			},
			{
				name: "meteor_upgrade_damage_rare",
				desc: localize("meteor_upgrade_damage_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_meteor_title",
				weight: 7,
				group: "meteor_damage",
				requirementsMet: true,
				reference: this,
				effect: function(meteor)
				{
					modifiers.addPercModifier(meteor, "meteor_upgrade_damage_rare", {damage: .3})
				}
			},
			{
				name: "meteor_upgrade_rateOfFire_common",
				desc: localize("meteor_upgrade_rateOfFire_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_meteor_title",
				weight: 60,
				group: "meteor_rate",
				requirementsMet: true,
				reference: this,
				effect: function(meteor)
				{
					modifiers.addPercModifier(meteor, "meteor_upgrade_rateOfFire_common", {rateOfFire: .1})
				}
			},
			{
				name: "meteor_upgrade_rateOfFire_uncommon",
				desc: localize("meteor_upgrade_rateOfFire_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_meteor_title",
				weight: 20,
				group: "meteor_rate",
				requirementsMet: true,
				reference: this,
				effect: function(meteor)
				{
					modifiers.addPercModifier(meteor, "meteor_upgrade_rateOfFire_uncommon", {rateOfFire: .2})
				}
			},
			{
				name: "meteor_upgrade_rateOfFire_rare",
				desc: localize("meteor_upgrade_rateOfFire_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_meteor_title",
				weight: 7,
				group: "meteor_rate",
				requirementsMet: true,
				reference: this,
				effect: function(meteor)
				{
					modifiers.addPercModifier(meteor, "meteor_upgrade_rateOfFire_rare", {rateOfFire: .3})
				}
			},
			{
				name: "meteor_upgrade_range_common",
				desc: localize("meteor_upgrade_range_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_meteor_title",
				weight: 60,
				group: "meteor_range",
				requirementsMet: this.mod.range < this.base.range * 2,
				reference: this,
				effect: function(meteor)
				{
					modifiers.addPercModifier(meteor, "meteor_upgrade_range_common", {range: .1})
				}
			},
			{
				name: "meteor_upgrade_range_uncommon",
				desc: localize("meteor_upgrade_range_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_meteor_title",
				weight: 20,
				group: "meteor_range",
				requirementsMet: this.mod.range < this.base.range * 2,
				reference: this,
				effect: function(meteor)
				{
					modifiers.addPercModifier(meteor, "meteor_upgrade_range_uncommon", {range: .2})
				}
			},
			{
				name: "meteor_upgrade_range_rare",
				desc: localize("meteor_upgrade_range_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_meteor_title",
				weight: 7,
				group: "meteor_range",
				requirementsMet: this.mod.range < this.base.range * 2,
				reference: this,
				effect: function(meteor)
				{
					modifiers.addPercModifier(meteor, "meteor_upgrade_range_rare", {range: .3})
				}
			}
		]
	}
}

class MeteorLines extends Entity
{
	constructor()
	{
		super()
		this.tween = new FastTween()
		this.maxDist = Math.sqrt(Math.pow(Surface.Screen.width, 2) + Math.pow(Surface.Screen.height, 2))
		this.endPromise
	}

	reset(position)
	{
		if (position.y <= 0 || position.x >= Surface.Screen.width)
			this.suspend()
		else
		{
			audioHandler.playAudioHook("meteor_fall_start")
			this.point = {x: position.x + position.y, y: 0}
			this.position = position
			this.lerp = 1
			this.endPromise = this.tween.easeIn([this.lerp], [0], (t) => this.lerp = t[0], 40)
				.then(() => this.suspend())
		}
	}

	on_render()
	{
		let vector = Vector.sub(this.point, this.position)
		let direction = Vector.normalise(vector)
		let magnitiude = Vector.magnitude(vector)
		let startPt = Vector.add(Vector.mult(direction, this.lerp * magnitiude), this.position)
		chargeUpLinesShape.draw(
			Surface.Screen,
			Transform
				.rotate(Math.atan2(vector.y, vector.x) / Math.PI * 180)
				.scale(this.lerp * 5000, this.lerp * 5000)
				.translate(startPt.x, startPt.y)
		)
	}
}

class MeteorTarget extends Entity
{
	constructor()
	{
		super()
		this.targetPosition = null
		this.innerApex = {x: scalePix(10), y: 0}
		this.outerApex = {x: scalePix(20), y: 0}
	}

	reset(parent, position)
	{
		this.position = position
		this.parent = parent
		this.duration = 0
		this.cooldown = 0
		this.rotation = 0
	}

	on_update()
	{
		if (!isPaused())
		{
			this.rotation += .01
			if (!this.parent.relentlessMarker)
			{
				// If not relentless, check expiry.
				if (++this.duration >= this.parent.mod.duration * 1.5)
				{
					this.parent.setSpawnTimer()
					this.suspend()
					return
				}
			}
			else if (this.parent.relentlessMarker != this)
			{
				this.suspend()
				return
			}
			else
			{
				// If relentless, move towards target.
				if (this.targetPosition)
				{
					if (distanceBetween(this.position, this.targetPosition) > this.parent.mod.speed)
					{
						let velocity = Vector.mult(Vector.normalise(Vector.sub(this.targetPosition, this.position)), this.parent.mod.speed)
						this.position.x += velocity.x
						this.position.y += velocity.y
					}
					else
					{
						this.position = this.targetPosition
						this.targetPosition = null
					}
				}
			}

			if (++this.cooldown >= 3600 / this.parent.mod.rateOfFire)
			{
				this.cooldown = 0
				let randomPosition = Vector.add(this.position, Vector.rotate({x: Random.discrete(0, scalePix(this.parent.mod.range) / 2), y: 0}, Random.uniform(0, Math.PI)))
				let meteorPromise = factory.spawn(MeteorLines, randomPosition).endPromise
				if (meteorPromise)
					meteorPromise.then(() => {
						factory.spawn(Smoke, randomPosition)
						factory.spawn(Explosion, randomPosition.x, randomPosition.y, this.parent, scalePix(this.parent.mod.range) / 2)
						audioHandler.playAudioHook("meteor_explode")
					})
			}
		}
	}

	on_render()
	{
		for (let i = 0; i < 4; i++)
		{
			let innerApex = Vector.add(Vector.rotate(this.innerApex, this.rotation + (i * Math.PI / 2)), this.position)
			let outerApex = Vector.add(Vector.rotate(this.outerApex, this.rotation + (i * Math.PI / 2)), this.position)
			PrimNative.drawLine(Surface.Screen, innerApex.x, innerApex.y, outerApex.x, outerApex.y, scalePix(3), midGray.fadeTo(.5))
			PrimNative.drawArc(Surface.Screen, this.position.x, this.position.y, scalePix(15), this.rotation + (i * Math.PI / 2) - .5, 1, scalePix(3), midGray.fadeTo(.5))
		}
	}
}

class MeteorPickup extends Pickup
{
	constructor()
	{
		super()
		this.progressOffset = 30
		this.wordOffset = scalePix(40)
		this.iconYOffset = pickupIcons.heightOf("1") / 2
		this.iconXOffset = pickupIcons.widthOf("1") / 2
	}

	reset(x, y, parent)
	{
		super.reset(x, y, false)
		this.parent = parent
		this.setTimer(parent.mod.duration)
	}

	on_activate()
	{
		this.parent.pickups.forEach(pickup => pickup != this ? pickup.stop() : null)
		this.parent.pickups = []
		factory.spawn(MeteorTarget, this.parent, this.position)
		audioHandler.playAudioHook("meteor_target_spawn")
		this.stop()
	}

	on_expire()
	{
		this.parent.setSpawnTimer()
	}

	on_render()
	{
		pickupIcons.drawText(
			Surface.Screen,
			this.position.x - this.iconXOffset,
			this.position.y - this.iconYOffset,
			"1",
			midGray
		)
		for (let i = 0; i < 60; i++)
			PrimNative.drawArc(
				Surface.Screen,
				this.position.x,
				this.position.y,
				scalePix(this.parent.mod.range),
				i * (Math.PI / 30),
				Math.PI / 60,
				2,
					midGray.fadeTo(.3)
			)
		this.renderWordAndProgress()
	}
}