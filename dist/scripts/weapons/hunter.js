import { Matter, Random, Tween } from 'sphere-runtime'
import { Weapon, FriendlyDrone } from './weapon.js'
import { Impact } from '../effects/impact.js'
import { Sparks } from '../effects/sparks.js'
import { DrawLightning } from '../effects/drawLightning.js'
import { ChargeUpLines } from '../effects/chargeUpLines.js'
import { Entity } from '../core/entityFactory.js'

export class Hunter extends Weapon
{
	static getIcon() { return "" }
	static getName() { return localize("weapon_hunter_title") }
	static getDesc() { return localize("weapon_hunter_desc") }
	static damageTags() { return ["tag_electric"] }
	static nonDamageTags() { return ["tag_drone", "tag_damageOverTime"] }

	constructor()
	{
		super()
		this.huntersProduced = null		// Track hunters produced for Super Hunters.
		this.electrifiedBolts = false
		this.numchain = 0

		this.dmg.base.electric = 10
		this.base.speed = 1
		this.base.range = 250
		this.base.duration = 350
		this.base.rateOfFire = 120
		this.base.critChance = .01
		this.base.critMult = 2.5
		this.refreshModifiers()

		this.front, this.front2

		let triggerString = "["
		getTriggerLetters('Hunter').forEach(v => triggerString += v)
		this.letters = new RegExp(triggerString + "]", "g")
		this.buttons = [button_top, button_bottom, button_left, button_right]
	}

	onWordComplete(word, quicktime, target)
	{
		let count = usingController ?
			quicktime.reduce((total, current) => total += this.buttons.includes(current), 0) :
			(word.match(this.letters) || []).length
		
		// If any matches.
		if (count > 0)
		{
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

			// Spawn hunters.
			for (let i = 0; i < count; i++)
				this.spawnHunter(target.getPosition())
		}
	}

	spawnHunter(targetPos)
	{
		let spawnPos = Vector.add (
			Vector.rotate (
				Vector.create(scalePix(Random.uniform(this.superHunter ? 200 : 100, 10)), 0),
				Random.uniform(0, Math.PI)
			),
			targetPos
		)
		factory.spawn(
			HunterDrone,
			spawnPos.x,
			spawnPos.y,
			targetPos.x,
			targetPos.y,
			this,
			this.huntersProduced >= 11 ? true : false
		)
		if (this.huntersProduced >= 11) factory.spawn(ChargeUpLines, targetPos)
		if (this.huntersProduced != null)
			this.huntersProduced = this.huntersProduced >= 11 ? 0 : this.huntersProduced + 1
	}

	getEvolution()
	{
		return [
			{
				name: "evo_hunter_hunterElite",
				desc: localize("evo_hunter_hunterElite_desc"),
				descBlock: true,
				icon: "",
				weight: 10,
				requirementsMet: this.huntersProduced == null,
				reference: this,
				effect: function(hunter)
				{
					hunter.huntersProduced = 0
				}
			},
			{
				name: "evo_hunter_electrifiedBolts",
				desc: localize("evo_hunter_electrifiedBolts_desc", "+5", "3%"),
				icon: "",
				weight: 10,
				requirementsMet: modifiers.getModifierCount(this, "evo_hunter_electrifiedBolts") == 0,
				reference: this,
				effect: function(hunter)
				{
					modifiers.addAbsModifier(hunter, "evo_hunter_electrifiedBolts", { kinetic: 5 })
					hunter.electrifiedBolts = true
					hunter.refreshModifiers()
				}
			},
			{
				name: "evo_hunter_electrifiedBolts_2",
				desc: localize("evo_hunter_electrifiedBolts_2_desc", "+10", "-5"),
				icon: "",
				weight: 10,
				requirementsMet: (
					modifiers.getModifierCount(this, "evo_hunter_electrifiedBolts") > 0 &&
					modifiers.getModifierCount(this, "evo_hunter_electrifiedBolts_2") == 0
				),
				reference: this,
				effect: function(hunter)
				{
					modifiers.addAbsModifier(hunter, "evo_hunter_electrifiedBolts_2", { kinetic: 10, electric: -5 })
					hunter.refreshModifiers()
				}
			},
			{
				name: "evo_hunter_chainLightning",
				desc: localize("evo_hunter_chainLightning_desc"),
				icon: "",
				weight: 10,
				requirementsMet: this.numchain == 0,
				reference: this,
				effect: function(hunter)
				{
					hunter.numchain = 1
				}
			},
			{
				name: "evo_hunter_chainLightning_2",
				desc: localize("evo_hunter_chainLightning_2_desc"),
				icon: "",
				weight: 10,
				requirementsMet: this.numchain == 1,
				reference: this,
				effect: function(hunter)
				{
					hunter.numchain = 2
				}
			}
		]
	}

	getUpgrades()
	{
		return [
			...super.getEvolutionUpgrades(),
			{
				name: "hunter_upgrade_damage_common",
				desc: localize("hunter_upgrade_damage_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_hunter_title",
				weight: 60,
				group: "hunter_damage",
				requirementsMet: true,
				reference: this,
				effect: function(hunter)
				{
					modifiers.addPercModifier(hunter, "hunter_upgrade_damage_common", {damage: .1})
				}
			},
			{
				name: "hunter_upgrade_damage_uncommon",
				desc: localize("hunter_upgrade_damage_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_hunter_title",
				weight: 20,
				group: "hunter_damage",
				requirementsMet: true,
				reference: this,
				effect: function(hunter)
				{
					modifiers.addPercModifier(hunter, "hunter_upgrade_damage_uncommon", {damage: .2})
				}
			},
			{
				name: "hunter_upgrade_damage_rare",
				desc: localize("hunter_upgrade_damage_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_hunter_title",
				weight: 7,
				group: "hunter_damage",
				requirementsMet: true,
				reference: this,
				effect: function(hunter)
				{
					modifiers.addPercModifier(hunter, "hunter_upgrade_damage_rare", {damage: .3})
				}
			},
			{
				name: "hunter_upgrade_range_common",
				desc: localize("hunter_upgrade_range_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_hunter_title",
				weight: 60,
				group: "hunter_range",
				requirementsMet: true,
				reference: this,
				effect: function(hunter)
				{
					modifiers.addPercModifier(hunter, "hunter_upgrade_range_common", {range: .1})
				}
			},
			{
				name: "hunter_upgrade_range_uncommon",
				desc: localize("hunter_upgrade_range_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_hunter_title",
				weight: 20,
				group: "hunter_range",
				requirementsMet: true,
				reference: this,
				effect: function(hunter)
				{
					modifiers.addPercModifier(hunter, "hunter_upgrade_range_uncommon", {range: .2})
				}
			},
			{
				name: "hunter_upgrade_range_rare",
				desc: localize("hunter_upgrade_range_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_hunter_title",
				weight: 7,
				group: "hunter_range",
				requirementsMet: true,
				reference: this,
				effect: function(hunter)
				{
					modifiers.addPercModifier(hunter, "hunter_upgrade_range_rare", {range: .3})
				}
			},
			{
				name: "hunter_upgrade_duration_common",
				desc: localize("hunter_upgrade_duration_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_hunter_title",
				weight: 60,
				group: "hunter_duration",
				requirementsMet: true,
				reference: this,
				effect: function(hunter)
				{
					modifiers.addPercModifier(hunter, "hunter_upgrade_duration_common", {duration: .1})
				}
			},
			{
				name: "hunter_upgrade_duration_uncommon",
				desc: localize("hunter_upgrade_duration_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_hunter_title",
				weight: 20,
				group: "hunter_duration",
				requirementsMet: true,
				reference: this,
				effect: function(hunter)
				{
					modifiers.addPercModifier(hunter, "hunter_upgrade_duration_uncommon", {duration: .2})
				}
			},
			{
				name: "hunter_upgrade_duration_rare",
				desc: localize("hunter_upgrade_duration_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_hunter_title",
				weight: 7,
				group: "hunter_duration",
				requirementsMet: true,
				reference: this,
				effect: function(hunter)
				{
					modifiers.addPercModifier(hunter, "hunter_upgrade_duration_rare", {duration: .3})
				}
			}
		]
	}
}

class ProjHunter extends Entity
{
	constructor()
	{
		super()
		this.speed = 25
	}

	reset(position, target, parent, numchain = 0)
	{
		// Reset vars.
		this.lastCoords = Array(3).fill(position)
		this.position = position
		this.parent = parent
		this.homingTarget = target
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
					let damage = Random.uniform(this.parent.dmg.mod.all, 5)
					let result = other.getHit(damage, this.parent, colPt)
					this.parent.recordDamage(result.damage)

					// VFX.
					let randomPositionX = Random.uniform(colPt.x, 5)
					let randomPositionY = Random.uniform(colPt.y, 5)
					let angle = Math.atan2(this.velocity.y, this.velocity.x)
					factory.spawn(Impact, randomPositionX, randomPositionY)
					for (let i = 0; i < 5; i++)
						factory.spawn(Sparks, randomPositionX, randomPositionY, Random.normal(angle, Math.PI / 6))

					// If chaining.
					if (this.numchain > 0)
					{
						let randomEnemyInRange = Random.sample(hostilesArray.filter(enemy => {
							return enemy != this.homingTarget &&
								enemy.getType() == type.enemy &&
								Matter.Bounds.overlaps(enemy.body.bounds, screenBounds) &&
								distanceBetween(this.position, enemy.getPosition()) < scalePix(this.parent.mod.range)
						}))
						if (randomEnemyInRange)
							factory.spawn(ProjHunter, this.position, randomEnemyInRange, this.parent, this.numchain - 1)
					}

					// SFX.
					let ricoOrHit = this.numchain > 0 ? "chain" : "hit"
					audioHandler.playAudioHook(result.isCrit ? `hunter_${ricoOrHit}_crit` : `hunter_${ricoOrHit}_normal`, getPanFromX(colPt.x))

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

	on_renderStart()
	{
		let trailEndCoord = this.lastCoords[0]
		DrawLightning(this.position, trailEndCoord)
		PrimNative.drawFilledCircle(Surface.Screen, this.position.x, this.position.y, 2, darkGray)
	}
}

class HunterDrone extends FriendlyDrone
{
	constructor()
	{
		// Superclass constructor.
		super()
		this.superHunter = false

		// Define consts.
		this.position = Vector.create(0, 0)
		this.rotationSpeed = 0.2

		// Spawn animation.
		this.spawnAnim = new Tween(this.position)
	}

	reset(x, y, spawnPosX, spawnPosY, parent, superHunter = false)
	{
		// Reset variables.
		super.reset(parent)
		this.superHunter = superHunter
		this.position.x = spawnPosX
		this.position.y = spawnPosY
		let direction = Vector.sub(Vector.create(x, y), Vector.create(spawnPosX, spawnPosY))
		this.rotation = Math.atan2(direction.y, direction.x)
		this.currentCooldown = 3600 / this.parent.mod.rateOfFire
		this.currentExpiry = 0
		this.launchComplete = false
		this.drawHunter = false
		this.lightningPos = []
		this.electricAudioLoop = null
		Sphere.sleep(superHunter ? 40 : 0)
			.then(() => {
				this.drawHunter = true
				this.spawnAnim.easeIn({x: x, y: y}, 20)
					.then(() => this.launchComplete = true)
			})

		// Play audio.
		audioHandler.playAudioHook("hunter_spawn")
	}

	audioStart()
	{
		if (this.electricAudioLoop == null)
		{
			audioHandler.playAudioHook("hunter_electric_start", getPanFromX(this.position.x))
			this.electricAudioLoop = audioHandler.playAudioHook("hunter_electric_loop", getPanFromX(this.position.x), true)
		}
	}

	audioStop()
	{
		if (this.electricAudioLoop != null)
		{
			this.electricAudioLoop.stop()
			this.electricAudioLoop = null
		}
	}

	on_shutDown()
	{
		this.audioStop()
	}

	on_update()
	{
		if (!isPaused())
		{
			if (this.launchComplete)
			{
				// Check if expired.
				if (++this.currentExpiry >= this.parent.mod.duration * (this.superHunter ? 1.5 : 1))
					this.suspend()

				// Process cooldown.
				if (++this.currentCooldown > 3600 / this.parent.mod.rateOfFire * (this.parent.electrifiedBolts ? 2 : 1))
					this.currentCooldown = 0

				// Find nearest target.
				this.target = droneFindNearestEnemy(this.position)

				// If valid target exists.
				this.lightningPos = []
				if (this.target && this.target.running)
				{
					// Move closer to target if necessary.
					let inRange = distanceBetween(this.position, this.target.getPosition()) <= scalePix(this.parent.mod.range) * (this.superHunter ? 1.5 : 1)
					if (!inRange)
						Object.assign(this.position, Vector.add (
							this.position,
							Vector.mult (
								Vector.normalise (
									Vector.sub (
										this.target.getPosition(),
										this.position
									)
								),
								scalePix(this.parent.mod.speed) * (this.superHunter ? 1.5 : 1)
							)
						))
					
					// Get angle to nearest enemy.
					let direction = Vector.sub(this.target.body.position, this.position)
					let angle = Math.atan2(direction.y, direction.x)

					// Rotate towards target or fire.
					let difference = diff(this.rotation, angle)
					if (Math.abs(difference) > this.rotationSpeed)
						this.rotation += Math.sign(difference) * this.rotationSpeed
					else
					{
						this.rotation = angle
						if (inRange)
						{
							// If using Electrified Bolts.
							if (this.parent.electrifiedBolts)
							{
								if (this.currentCooldown == 0)
								{
									factory.spawn(ProjHunter, this.position, this.target, this.parent, this.parent.numchain)
									audioHandler.playAudioHook("hunter_shot", getPanFromX(this.position.x))
								}
							}

							// Else, fire normal lightning.
							else
							{
								// Determine first target.
								let currentPosition = this.position
								let currentTarget = this.target

								// Loop for numchain amount of targets.
								for (let i = 0; i <= this.parent.numchain; i++)
								{
									// If armor in line of fire.
									let armor = armoredEnemies.includes(currentTarget.constructor.name) ?
										Matter.Query.ray(hostileBodies, currentPosition, currentTarget.getPosition())
											.find(col => hostiles.get(col.bodyA.id) && hostiles.get(col.bodyA.id).getType() == type.armor)
										: currentTarget.protection
									if (armor)
									{
										if ("bodyA" in armor) armor = hostiles.get(armor.bodyA.id)
										let pointHitOnShield = collisionPoint(currentPosition, currentTarget.getPosition(), armor.body)
										this.lightningPos.push(pointHitOnShield)
										if (this.currentCooldown == 0)
											for (let i = 0; i < (this.superHunter ? 2 : 1); i++)
												armor.getHit(this.parent.dmg.mod.all, this.parent, pointHitOnShield)
										break
									}

									// Else, deal damage.
									else
									{
										this.lightningPos.push(currentTarget.getPosition())
										if (this.currentCooldown == 0)
										{
											for (let i = 0; i < (this.superHunter ? 2 : 1); i++)
											{
												let damage = Random.uniform(this.parent.dmg.mod.all, 1)
												let col = this.superHunter ?
													{x: Random.uniform(currentTarget.getPosition().x, 10), y: Random.uniform(currentTarget.getPosition().y, 10)} :
													currentTarget.getPosition()
												let result = currentTarget.getHit(damage, this.parent, col)
												this.parent.recordDamage(result.damage)
											}
										}
									}

									// Next target.
									if (i + 1 <= this.parent.numchain)
									{
										currentPosition = currentTarget.getPosition()
										currentTarget = Random.sample(hostilesArray.filter(enemy => {
											return enemy != this.homingTarget &&
												enemy.getType() == type.enemy &&
												Matter.Bounds.overlaps(enemy.body.bounds, screenBounds) &&
												distanceBetween(currentPosition, enemy.getPosition()) < scalePix(this.parent.mod.range)
										}))
										if (!currentTarget) break
									}
								}
							}
						}
					}
				}
			}
		}
	}

	on_render()
	{
		// Draw hunter.
		if (this.drawHunter)
		{
			let left = Vector.add(Vector.rotate({x: 0, y: scalePix(this.superHunter ? -17 : -5)}, this.rotation), this.position)
			let right = Vector.add(Vector.rotate({x: 0, y: scalePix(this.superHunter ? 17 : 5)}, this.rotation), this.position)
			if (this.superHunter)
			{
				this.front = Vector.add(Vector.rotate({x: scalePix(45), y: scalePix(-2)}, this.rotation), this.position)
				this.front2 = Vector.add(Vector.rotate({x: scalePix(45), y: scalePix(2)}, this.rotation), this.position)
				let rearLeft = Vector.add(Vector.rotate({x: 0, y: scalePix(-2)}, this.rotation), this.position)
				let rearRight = Vector.add(Vector.rotate({x: 0, y: scalePix(2)}, this.rotation), this.position)
				PrimNative.drawTriangle(Surface.Screen, left.x, left.y, this.front.x, this.front.y, rearLeft.x, rearLeft.y, scalePix(2), midGray)
				PrimNative.drawTriangle(Surface.Screen, right.x, right.y, this.front2.x, this.front2.y, rearRight.x, rearRight.y, scalePix(2), midGray)
			}
			else
			{
				this.front = Vector.add(Vector.rotate({x: scalePix(15), y: 0}, this.rotation), this.position)
				PrimNative.drawTriangle(Surface.Screen, left.x, left.y, this.front.x, this.front.y, right.x, right.y, scalePix(2), midGray)
			}
		}
	}
	
	// Draw lightning.
	on_renderStart()
	{
		if (this.drawHunter)
		{
			if (this.lightningPos.length > 0)
			{
				this.audioStart()
				for (let i = 0; i < this.lightningPos.length; i++)
				{
					if (i == 0)
					{
						DrawLightning(this.front, this.lightningPos[i])
						if (this.superHunter) DrawLightning(this.front2, this.lightningPos[i])
					}
					else DrawLightning(this.lightningPos[i - 1], this.lightningPos[i])
				}
			}
			else this.audioStop()
		}
	}
}