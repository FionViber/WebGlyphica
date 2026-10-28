import { Random } from 'sphere-runtime'
import { Weapon } from './weapon.js'
import { Pickup } from '../pickups/pickup.js'
import { Explosion } from '../effects/explosion.js'
import { Debris } from '../effects/debris.js'
import { Entity } from '../core/entityFactory.js'

export class Firestorm extends Weapon
{
	static getIcon() { return "" }
	static getName() { return localize("weapon_firestorm_title") }
	static getDesc() { return localize("weapon_firestorm_desc") }
	static damageTags() { return ["tag_explosive"] }
	static nonDamageTags() { return ["tag_remote"] }

	constructor()
	{
		// Superclass constructor.
		super()

		// Base stats.
		this.dmg.base.explosive = 60
		this.base.speed = Math.PI / 180
		this.base.rateOfFire = 12
		this.base.range = 450
		this.base.critChance = .01
		this.base.critMult = 2
		this.refreshModifiers()

		// Play spawn audio.
		audioHandler.playAudioHook("firestorm_spawn")

		// Some variables.
		this.cooldown = 0
		this.freezeRotation = false
		this.explosions = []

		// Cannon internal class.
		this.cannonClass = class extends Entity
		{
			constructor(parent)
			{
				super()
				this.parent
				this.rotation = Random.uniform(Math.PI, Math.PI)
			}

			reset(parent)
			{
				this.parent = parent
				this.explosions = []
			}

			on_update()
			{
				if (!isPaused())
				{
					if (!this.freezeRotation)
						this.rotation += this.parent.mod.speed

					for (let i = 0; i < this.explosions.length; i++) {
						let explosion = this.explosions[i]
						explosion.delay -= 1
						if (explosion.delay <= 0) {
							explosion.payload()
							this.explosions[i] = this.explosions[this.explosions.length - 1]
							this.explosions.pop()
						}
					}

					if (this.explosions.length == 0)
						this.freezeRotation = false
				}
			}

			fire()
			{
				audioHandler.playAudioHook("firestorm_fire")
				let rotationVector = {x: Math.cos(this.rotation), y: Math.sin(this.rotation)}
				let origin = Vector.add(screenCenter, Vector.mult(rotationVector, 100))
				this.explosions = []
				for (let i = 0; i < 20; i ++)
				{
					let randomAngle = Random.normal(this.rotation, Math.PI / 10)
					let explosionDistance = Random.discrete(0, this.parent.mod.range)
					let explosionPosition = Vector.add(Vector.rotate({x: explosionDistance, y: 0}, randomAngle), origin)
					let explosionSize = Math.max(Random.uniform(this.parent.mod.range / 2 * explosionDistance / this.parent.mod.range, this.parent.mod.range / 10), this.parent.mod.range / 5)
					let delay = explosionDistance / 30
					this.explosions.push({
						delay,
						payload: () => {
							audioHandler.playAudioHook("firestorm_explode")
							factory.spawn(Explosion, explosionPosition.x, explosionPosition.y, this.parent, explosionSize, false)
						}
					})
				}
				for (let i = 0; i < 10; i++)
					factory.spawn(Debris, origin.x, origin.y, Random.uniform(this.rotation, Math.PI / 4), Random.uniform(5, 1.5))
				this.freezeRotation = true
			}

			on_render()
			{
				firestormCannonModel.transform.identity()
				firestormCannonModel.transform.translate(100, 0)
				firestormCannonModel.transform.rotate(this.rotation / Math.PI * 180)
				firestormCannonModel.transform.translate(screenCenter.x, screenCenter.y)	
				firestormCannonModel.draw(Surface.Screen)
			}
		}

		// Pickup when cannon is ready.
		this.cannonPickup = class extends Pickup
		{
			constructor()
			{
				super()
				this.wordOffset = scalePix(130)
			}

			reset(parent)
			{
				this.parent = parent
				super.reset(screenCenter.x, screenCenter.y, false)
			}

			activate()
			{
				// Fire the cannon.
				this.parent.cannon.fire()
				this.parent.cooldown = 3600 / this.parent.mod.rateOfFire
				this.suspend()
			}
			
			on_update() { /* Do Nothing */ }
			on_render() { this.renderWordAndProgress(/*skipProgress = */true) }
		}

		// Start.
		this.cannon = factory.spawn(this.cannonClass, this)
		this.cannonPickup = factory.spawn(this.cannonPickup, this)
		this.start()
	}

	on_update()
	{
		if (!isPaused())
		{
			if (this.cooldown > 0)
				this.cooldown--
			else if (!this.cannonPickup.running)
			{
				audioHandler.playAudioHook("firestorm_ready")
				this.cannonPickup.reset(this)
			}
		}
	}

	on_render()
	{
		firestormCircleModel.draw(Surface.Screen)
		if (this.cooldown > 0)
			drawProgress(screenCenter.x, screenCenter.y - 140, 50, 3, this.cooldown / (3600 / this.mod.rateOfFire))
	}

	on_shutDown()
	{
		this.cannon.stop()
	}

	getEvolution()
	{
		return []
	}

	getUpgrades()
	{
		return [
			{
				name: localize("firestorm_upgrade_damage_common"),
				desc: localize("firestorm_upgrade_damage_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: localize("weapon_firestorm_title"),
				weight: 60,
				requirementsMet: true,
				reference: this,
				effect: function(firestorm)
				{
					modifiers.addPercModifier(firestorm, "firestorm_upgrade_damage_common", {damage: 0.1})
				}
			},
			{
				name: localize("firestorm_upgrade_damage_uncommon"),
				desc: localize("firestorm_upgrade_damage_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: localize("weapon_firestorm_title"),
				weight: 20,
				requirementsMet: true,
				reference: this,
				effect: function(firestorm)
				{
					modifiers.addPercModifier(firestorm, "firestorm_upgrade_damage_uncommon", {damage: 0.2})
				}
			},
			{
				name: localize("firestorm_upgrade_damage_rare"),
				desc: localize("firestorm_upgrade_damage_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: localize("weapon_firestorm_title"),
				weight: 7,
				requirementsMet: true,
				reference: this,
				effect: function(firestorm)
				{
					modifiers.addPercModifier(firestorm, "firestorm_upgrade_damage_rare", {damage: 0.3})
				}
			},
			{
				name: localize("firestorm_upgrade_rate_common"),
				desc: localize("firestorm_upgrade_rate_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: localize("weapon_firestorm_title"),
				weight: 60,
				requirementsMet: true,
				reference: this,
				effect: function(firestorm)
				{
					modifiers.addPercModifier(firestorm, "firestorm_upgrade_rate_common", {rateOfFire: 0.1})
				}
			},
			{
				name: localize("firestorm_upgrade_rate_uncommon"),
				desc: localize("firestorm_upgrade_rate_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: localize("weapon_firestorm_title"),
				weight: 20,
				requirementsMet: true,
				reference: this,
				effect: function(firestorm)
				{
					modifiers.addPercModifier(firestorm, "firestorm_upgrade_rate_uncommon", {rateOfFire: 0.2})
				}
			},
			{
				name: localize("firestorm_upgrade_rate_rare"),
				desc: localize("firestorm_upgrade_rate_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: localize("weapon_firestorm_title"),
				weight: 7,
				requirementsMet: true,
				reference: this,
				effect: function(firestorm)
				{
					modifiers.addPercModifier(firestorm, "firestorm_upgrade_rate_rare", {rateOfFire: 0.3})
				}
			},
			{
				name: localize("firestorm_upgrade_range_common"),
				desc: localize("firestorm_upgrade_range_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: localize("weapon_firestorm_title"),
				weight: 60,
				requirementsMet: true,
				reference: this,
				effect: function(firestorm)
				{
					modifiers.addPercModifier(firestorm, "firestorm_upgrade_range_common", {range: 0.1})
				}
			},
			{
				name: localize("firestorm_upgrade_range_uncommon"),
				desc: localize("firestorm_upgrade_range_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: localize("weapon_firestorm_title"),
				weight: 20,
				requirementsMet: true,
				reference: this,
				effect: function(firestorm)
				{
					modifiers.addPercModifier(firestorm, "firestorm_upgrade_range_uncommon", {range: 0.2})
				}
			},
			{
				name: localize("firestorm_upgrade_range_rare"),
				desc: localize("firestorm_upgrade_range_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: localize("weapon_firestorm_title"),
				weight: 7,
				requirementsMet: true,
				reference: this,
				effect: function(firestorm)
				{
					modifiers.addPercModifier(firestorm, "firestorm_upgrade_range_rare", {range: 0.3})
				}
			}
		]
	}
}