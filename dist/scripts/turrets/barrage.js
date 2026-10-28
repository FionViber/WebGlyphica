import { Random } from 'sphere-runtime'
import { Turret } from './turret.js'
import { Entity } from '../core/entityFactory.js'
import { Explosion } from '../effects/explosion.js'
import { Smoke } from '../effects/smoke.js'
import { Pickup } from '../pickups/pickup.js'
import { Damage } from '../effects/damage.js'
import { getRandomPickupSpawnPos } from '../pickups/pickupController.js'

export class Barrage extends Turret
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("weapon_barrage_title") }
	static getDesc() { return localize("weapon_barrage_desc") }
	static damageTags() { return ["tag_explosive"] }
	static nonDamageTags() { return ["tag_main"] }
	
	constructor()
	{
		super({radius: scalePix(20)})
		this.rotation = 0

		// Evolutions.
		this.seismicMunition = false
		this.seismicMunitionRangeMult = 1
		this.resupply = false
		this.resupplyPickupCooldown = 0
		this.resupplyBoostActive = false
		this.resupplyDamageBoost = 1
		this.resupplyRangeBoost = 1

		// Barrage size.
		this.barrageAmount = 2

		// Ammo
		this.currentAmmo = this.maxAmmo = 6
		this.ammoCounterWidth = scalePix(50)
		this.ammoCounterStart = {
			x: screenCenter.x - this.ammoCounterWidth / 2,
			y: screenCenter.y + scalePix(30)
		}

		// Base stats.
		this.dmg.base.explosive = 50
		this.base.rateOfFire = 1
		this.base.range = 100
		this.base.critChance = .03
		this.base.critMult = 1.5
		this.base.speed = 10
		this.refreshModifiers()

		this.start()
	}

	calcBaseRateOfFire()
	{
		return (this.maxAmmo - 1) / 360
	} 

	fire(target)
	{
		super.fire(target)

		// Play audio.
		audioHandler.playAudioHook("barrage_fire")

		// Get angle to target.
		let targetPos = target.getPosition()
		let direction = Vector.normalise(Vector.sub(targetPos, screenCenter))
		let angle = Math.atan2(direction.y, direction.x)

		// Spawn missiles.
		for (let i = 0; i < Math.floor(this.currentAmmo); i++)
			for (let k = 0; k < this.barrageAmount + Math.ceil(i * .5); k++)
			{
				let distance = distanceBetween(targetPos, screenCenter)
				let explosionPos = Vector.add(
					Vector.mult(
						Vector.rotate(direction, Random.normal(0, Math.PI / (90 - 50 * i / (this.maxAmmo - 1)))),
						Random.discrete(distance - scalePix(250), distance + scalePix(50))
					),
					screenCenter
				)
				factory.spawn(
					ProjBarrage,
					explosionPos,
					{ x: screenCenter.x, y: screenCenter.y },
					Random.normal(angle + Math.PI, Math.PI / 20),
					i * 2,
					this,
					this.resupplyBoostActive
				)
			}
		this.resupplyBoostActive = false
		this.currentAmmo = 1
		audioHandler.playAudioHook("barrage_reload_empty")
	}

	on_update()
	{
		if (isPaused()) return
		this.rotation += 2
		if (this.currentAmmo < this.maxAmmo)
		{
			this.currentAmmo += this.calcBaseRateOfFire() * this.mod.rateOfFire
			if (this.currentAmmo >= this.maxAmmo) audioHandler.playAudioHook("barrage_reload")
		}
		if (++this.resupplyPickupCooldown > this.resupplyPickupMaxCooldown)
		{
			this.resupplyPickupCooldown = 0
			let spawnPos = getRandomPickupSpawnPos()
			factory.spawn(Resupply, spawnPos.x, spawnPos.y, this)
		}
	}

	on_render()
	{
		super.on_render()
		barrageShape.transform.identity()
		barrageShape.transform.rotate(this.rotation)
		barrageShape.transform.translate(screenCenter.x, screenCenter.y)
		barrageShape.draw(Surface.Screen)

		// Draw loading bar.
		for (let i = 0; i < this.maxAmmo; i++)
		{
			let segmentStart = this.ammoCounterStart.x + i * this.ammoCounterWidth / this.maxAmmo + scalePix(1)
			let segmentEnd = segmentStart + this.ammoCounterWidth / this.maxAmmo - scalePix(1)
			PrimNative.drawLine (
				Surface.Screen,
				segmentStart,
				this.ammoCounterStart.y,
				segmentEnd,
				this.ammoCounterStart.y,
				5,
				Math.floor(this.currentAmmo) > i ? midGray : midGray.fadeTo(.3)
			)
		}
	}

	getEvolution()
	{
		return [
			{
				name: "evo_barrage_rocketArray",
				desc: localize("evo_barrage_rocketArray_desc", "3 - 6", "2 - 5"),
				icon: "",
				weight: 10,
				requirementsMet: this.barrageAmount == 2,
				reference: this,
				effect: function(barrage)
				{
					barrage.barrageAmount++
				}
			},
			{
				name: "evo_barrage_rocketArray_2",
				desc: localize("evo_barrage_rocketArray_desc", "4 - 7", "3 - 6"),
				icon: "",
				weight: 10,
				requirementsMet: this.barrageAmount == 3,
				reference: this,
				effect: function(barrage)
				{
					barrage.barrageAmount++
				}
			},
			{
				name: "evo_barrage_seismicMunition",
				desc: localize("evo_barrage_seismicMunition_desc"),
				icon: "",
				weight: 10,
				requirementsMet: !this.seismicMunition,
				reference: this,
				effect: function(barrage)
				{
					barrage.seismicMunition = true
					barrage.base.duration = 360
					barrage.refreshModifiers()
				}
			},
			{
				name: "evo_barrage_seismicMunition_2",
				desc: localize("evo_barrage_seismicMunition_2_desc", "25%", "25%"),
				icon: "",
				weight: 10,
				requirementsMet: (
					this.seismicMunition &&
					this.seismicMunitionRangeMult == 1
				),
				reference: this,
				effect: function(barrage)
				{
					barrage.seismicMunitionRangeMult += .25
					modifiers.addPercModifier(barrage, "evo_barrage_seismicMunition_2", {duration: .25})
					barrage.refreshModifiers()
				}
			},
			{
				name: "evo_barrage_resupply",
				desc: localize("evo_barrage_resupply_desc", "30%"),
				icon: "",
				weight: 10,
				requirementsMet: !this.resupply,
				reference: this,
				effect: function(barrage)
				{
					barrage.resupply = true
					barrage.resupplyDamageBoost += .3
					barrage.resupplyPickupMaxCooldown = Random.uniform(600, 120)
				}
			},
			{
				name: "evo_barrage_resupply_2",
				desc: localize("evo_barrage_resupply_2_desc", "30%"),
				icon: "",
				weight: 10,
				requirementsMet: (
					this.resupply &&
					this.resupplyRangeBoost == 1
				),
				reference: this,
				effect: function(barrage)
				{
					barrage.resupplyRangeBoost += .3
				}
			}
		]
	}

	getUpgrades()
	{
		return [
			...super.getEvolutionUpgrades(),
			{
				name: "barrage_upgrade_damage_common",
				desc: localize("barrage_upgrade_damage_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_barrage_title",
				weight: 60,
				group: "barrage_damage",
				requirementsMet: true,
				reference: this,
				effect: function(barrage)
				{
					modifiers.addPercModifier(barrage, "barrage_upgrade_damage_common", {damage: .1})
				}
			},
			{
				name: "barrage_upgrade_damage_uncommon",
				desc: localize("barrage_upgrade_damage_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_barrage_title",
				weight: 20,
				group: "barrage_damage",
				requirementsMet: true,
				reference: this,
				effect: function(barrage)
				{
					modifiers.addPercModifier(barrage, "barrage_upgrade_damage_uncommon", {damage: .2})
				}
			},
			{
				name: "barrage_upgrade_damage_rare",
				desc: localize("barrage_upgrade_damage_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_barrage_title",
				weight: 7,
				group: "barrage_damage",
				requirementsMet: true,
				reference: this,
				effect: function(barrage)
				{
					modifiers.addPercModifier(barrage, "barrage_upgrade_damage_rare", {damage: .3})
				}
			},
			{
				name: "barrage_upgrade_range_common",
				desc: localize("barrage_upgrade_range_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_barrage_title",
				weight: 60,
				group: "barrage_range",
				requirementsMet: true,
				reference: this,
				effect: function(barrage)
				{
					modifiers.addPercModifier(barrage, "barrage_upgrade_range_common", {range: .1})
				}
			},
			{
				name: "barrage_upgrade_range_uncommon",
				desc: localize("barrage_upgrade_range_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_barrage_title",
				weight: 20,
				group: "barrage_range",
				requirementsMet: true,
				reference: this,
				effect: function(barrage)
				{
					modifiers.addPercModifier(barrage, "barrage_upgrade_range_uncommon", {range: .2})
				}
			},
			{
				name: "barrage_upgrade_range_rare",
				desc: localize("barrage_upgrade_range_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_barrage_title",
				weight: 7,
				group: "barrage_range",
				requirementsMet: true,
				reference: this,
				effect: function(barrage)
				{
					modifiers.addPercModifier(barrage, "barrage_upgrade_range_rare", {range: .3})
				}
			},
			{
				name: "barrage_upgrade_rateOfFire_common",
				desc: localize("barrage_upgrade_rateOfFire_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_barrage_title",
				weight: 60,
				group: "barrage_rateOfFire",
				requirementsMet: true,
				reference: this,
				effect: function(barrage)
				{
					modifiers.addPercModifier(barrage, "barrage_upgrade_rateOfFire_common", {rateOfFire: .1})
				}
			},
			{
				name: "barrage_upgrade_rateOfFire_uncommon",
				desc: localize("barrage_upgrade_rateOfFire_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_barrage_title",
				weight: 20,
				group: "barrage_rateOfFire",
				requirementsMet: true,
				reference: this,
				effect: function(barrage)
				{
					modifiers.addPercModifier(barrage, "barrage_upgrade_rateOfFire_uncommon", {rateOfFire: .2})
				}
			},
			{
				name: "barrage_upgrade_rateOfFire_rare",
				desc: localize("barrage_upgrade_rateOfFire_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_barrage_title",
				weight: 7,
				group: "barrage_rateOfFire",
				requirementsMet: true,
				reference: this,
				effect: function(barrage)
				{
					modifiers.addPercModifier(barrage, "barrage_upgrade_rateOfFire_rare", {rateOfFire: .3})
				}
			}
		]
	}
}

class ProjBarrage extends Entity
{
	constructor()
	{
		super()
		this.rotationSpeed = Random.uniform(.2, .1)
		this.lastCoords = Array(5)
	}

	reset(target, position, rotation, delay, parent, boosted)
	{
		// Target marker vars.
		this.targetMarkerRotation = Random.uniform(Math.PI, Math.PI)
		this.targetMarkerIntro = 0

		// Projectile vars.
		this.boosted = boosted
		this.target = target
		this.speed = scalePix(Random.uniform(parent.mod.speed, 2))
		this.position = position
		this.rotation = rotation
		this.delay = delay
		this.parent = parent
		this.skipOneFrame = false
		this.lastCoords.fill(this.position)
	}

	on_update()
	{
		if (isPaused()) return

		// Update target marker rotation.
		this.targetMarkerRotation += .05
		if (this.targetMarkerIntro < 1) this.targetMarkerIntro += .1

		// Process missile launch delay.
		if (this.delay > 0) { --this.delay; return }

		// If within range of target, explode.
		if (distanceBetween(this.target, this.position) <= this.speed)
		{
			// Play SFX.
			audioHandler.playAudioHook("barrage_explode", getPanFromX(this.target.x))

			// Create explosion
			factory.spawn(Smoke, this.target, .005 * this.parent.mod.range)
			factory.spawn(
				Explosion,
				this.target.x,
				this.target.y,
				this.parent,
				scalePix(this.parent.mod.range * (this.boosted ? this.parent.resupplyRangeBoost : 1)),
				false,
				{
					damage: this.parent.dmg.mod.all * (this.boosted ? this.parent.resupplyDamageBoost : 1),
					type: 'explosive'
				}
			)

			// Seismic Munition, if any.
			if (this.parent.seismicMunition)
				factory.spawn(SeismicMunition, this.target.x, this.target.y, this.parent)

			// Destroy.
			this.suspend()
			return
		}

		// Get angle to target.
		let direction = Vector.sub(this.target, this.position)
		let angle = Math.atan2(direction.y, direction.x)

		// Rotate (pick whatever direction is closer).
		let difference = diff(this.rotation, angle)
		if (Math.abs(difference) > this.rotationSpeed)
			this.rotation += Math.sign(difference) * this.rotationSpeed
		else
			this.rotation = angle

		// Determine velocity.
		this.velocity = Vector.mult(
			Vector.create(
				Math.cos(this.rotation),
				Math.sin(this.rotation)
			),
			this.speed
		)

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

	on_renderStart()
	{
		if (this.delay > 0) return

		// Draw trail.
		let increments = .33 / this.lastCoords.length
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
				scalePix(this.boosted ? 4 : 2),
				midGray.fadeTo(increments * i)
			)
		}
	}

	on_render()
	{
		// Draw target marker.
		for (let i = 0; i < 3; i++)
			PrimNative.drawArc (
				Surface.Screen,
				this.target.x,
				this.target.y,
				scalePix(15 + (1 - this.targetMarkerIntro) * 50),
				this.targetMarkerRotation + (Math.PI * .66 * i),
				Math.PI * .5,
				scalePix(2),
				midGray.fadeTo(.2 * this.targetMarkerIntro)
			)

		if (this.delay > 0) return		

		// Draw missile.
		let scale = this.boosted ? 10 : 5
		barrageProjectileShape.transform.identity()
		barrageProjectileShape.transform.rotate(this.rotation / Math.PI * 180)
		barrageProjectileShape.transform.scale(scale, scale)
		barrageProjectileShape.transform.translate(this.position.x, this.position.y)
		barrageProjectileShape.draw(Surface.Screen)
	}
}

class SeismicMunition extends Entity
{
	reset(posX, posY, parent)
	{
		this.pos = {x: posX, y: posY}
		this.parent = parent
		this.currentCooldown = 0
		this.currentDuration = 0

		// Play SFX.
		audioHandler.playAudioHook("barrage_burrow", getPanFromX(posX))

		// Drawing vars.
		let radius = scalePix(5)
		this.topLeft = {
			x: this.pos.x - radius,
			y: this.pos.y - radius
		}
		this.topRight = {
			x: this.pos.x + radius,
			y: this.pos.y - radius
		}
		this.bottomLeft = {
			x: this.pos.x - radius,
			y: this.pos.y + radius
		}
		this.bottomRight = {
			x: this.pos.x + radius,
			y: this.pos.y + radius
		}
	}

	on_update()
	{
		if (isPaused()) return

		this.currentCooldown += .008 * this.parent.mod.rateOfFire
		if (this.currentCooldown > 1)
		{
			this.currentCooldown = 0
			audioHandler.playAudioHook("barrage_explode", getPanFromX(this.pos.x))
			factory.spawn(
				Explosion,
				this.pos.x,
				this.pos.y,
				this.parent,
				this.parent.mod.range * this.parent.seismicMunitionRangeMult,
				false,
				{
					damage: Random.uniform(Math.floor(this.parent.dmg.mod.all * .5), 5),
					type: 'explosive'
				}
			)
		}

		if (this.currentDuration++ > this.parent.mod.duration)
			this.suspend()
	}

	on_render()
	{
		PrimNative.drawLine(Surface.Screen, this.topLeft.x, this.topLeft.y, this.bottomRight.x, this.bottomRight.y, scalePix(2), midGray.fadeTo(.3))
		PrimNative.drawLine(Surface.Screen, this.bottomLeft.x, this.bottomLeft.y, this.topRight.x, this.topRight.y, scalePix(2), midGray.fadeTo(.3))
	}
}

class Resupply extends Pickup
{
	constructor()
	{
		super()
		this.progressOffset = 30
		this.wordOffset = scalePix(40)
		this.iconYOffset = pickupIcons.heightOf(";") / 2
		this.iconXOffset = pickupIcons.widthOf(";") / 2
	}

	reset(x, y, parent)
	{
		super.reset(x, y, false)
		this.parent = parent
		this.setTimer(600)
	}

	on_activate()
	{
		this.parent.currentAmmo = this.parent.maxAmmo
		this.parent.resupplyBoostActive = true
		audioHandler.playAudioHook("barrage_reload_ammobox", getPanFromX(this.position.x))
		factory.spawn(Damage, this.position.x, this.position.y, localize("evo_barrage_resupply_pickup"), false, true, true)
		this.stop()
	}

	on_render()
	{
		pickupIcons.drawText(
			Surface.Screen,
			this.position.x - this.iconXOffset,
			this.position.y - this.iconYOffset,
			";",
			midGray
		)
		this.renderWordAndProgress()
	}
}