import { Random, Matter } from 'sphere-runtime'
import { Weapon, FriendlyTurret } from './weapon.js'
import { DrawLightning } from '../effects/drawLightning.js'
import { GiveWeapon } from '../data/weaponsList.js'

export class Tesla extends Weapon
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("weapon_tesla_title") }
	static getDesc() { return localize("weapon_tesla_desc") }
	static damageTags() { return ["tag_electric"] }
	static nonDamageTags() { return ["tag_turret", "tag_damageOverTime"] }

	constructor()
	{
		super()
		this.extraLetters = 0

		// Declare consts.
		this.base.range = 300
		this.dmg.base.electric = 12
		this.base.duration = 600
		this.base.rateOfFire = 120
		this.base.critChance = .01
		this.base.critMult = 2.5
		this.refreshModifiers()

		this.glyphMatches = [shoulder_button_left, shoulder_button_right]
		this.wordMatches = getTriggerLetters('Tesla')
		this.restrictedArea = false
	}

	onWordComplete(word, quicktime, target)
	{
		if (usingController)
		{
			if (this.glyphMatches.some(v => quicktime[0] == v))
				factory.spawn(TeslaMine, this, target.getPosition().x, target.getPosition().y)
		}
		else 
		{
			if (this.wordMatches.some(v => word[0] == v))
				factory.spawn(TeslaMine, this, target.getPosition().x, target.getPosition().y)
		}
	}

	getEvolution()
	{
		return [
			{
				name: this.wordMatches.length > 4 ? "evo_tesla_abundantCoils_2" : "evo_tesla_abundantCoils",
				desc: localize("evo_tesla_abundantCoils_desc"),
				descBlock: true,
				triggerDesc: localize("starts_with_character"),
				triggerDescQuicktime: localize("starts_with_glyphs"),
				triggerValue: super.getNextExtraLetter(),
				triggerValueQuicktime: super.getNextExtraButton(),
				icon: "",
				weight: 10,
				requirementsMet: possibleExtraLetters.length > extraLetters.length,
				reference: this,
				effect: function(tesla)
				{
					let extraLetter = possibleExtraLetters.find(letter => !extraLetters.includes(letter))
					let extraButton = possibleExtraButtons.find(button => !extraButtons.includes(button))
					tesla.extraLetters += 1
					extraLetters.push(extraLetter)
					extraButtons.push(extraButton)
					tesla.wordMatches = [...tesla.wordMatches, ...extraLetter]
					tesla.glyphMatches.push(extraButton)
				}
			},
			{
				name: "evo_tesla_electricalBurn",
				desc: localize("evo_tesla_electricalBurn_desc", "+4", "3%"),
				icon: "",
				weight: 10,
				requirementsMet: modifiers.getModifierCount(this, "evo_tesla_electricalBurn") == 0,
				reference: this,
				effect: function(tesla)
				{
					modifiers.addAbsModifier(tesla, "evo_tesla_electricalBurn", { heat: 4 })
					tesla.refreshModifiers()
				}
			},
			{
				name: "evo_tesla_electricalBurn_2",
				desc: localize("evo_tesla_electricalBurn_2_desc", "+8", "-4"),
				icon: "",
				weight: 10,
				requirementsMet: (
					modifiers.getModifierCount(this, "evo_tesla_electricalBurn") > 0 &&
					modifiers.getModifierCount(this, "evo_tesla_electricalBurn_2") == 0
				),
				reference: this,
				effect: function(tesla)
				{
					modifiers.addAbsModifier(tesla, "evo_tesla_electricalBurn_2", { heat: 8, electric: -4 })
					tesla.refreshModifiers()
				}
			},
			{
				name: "evo_tesla_restrictedArea",
				desc: localize("evo_tesla_restrictedArea_desc", "20%"),
				icon: "",
				weight: 10,
				requirementsMet: !this.restrictedArea,
				reference: this,
				effect: function(tesla)
				{
					tesla.restrictedArea = true
				}
			},
			{
				name: "evo_tesla_restrictedArea_2",
				desc: localize("evo_tesla_restrictedArea_2_desc", "5", "30%"),
				icon: "",
				weight: 10,
				requirementsMet: (
					this.restrictedArea && (
						!getExistingWeapon("Static") ||
						modifiers.getModifierCount(getExistingWeapon("Static"), "evo_tesla_restrictedArea_2") == 0
					)
				),
				reference: this,
				effect: function(_)
				{
					let staticWeapon = getExistingWeapon("Static") || GiveWeapon("Static")
					modifiers.addAbsModifier(staticWeapon, "evo_tesla_restrictedArea_2", { electric: 5 })
					modifiers.addPercModifier(staticWeapon, "evo_tesla_restrictedArea_2", { range: .3 })
					staticWeapon.refreshModifiers()
				}
			}
		]
	}

	getUpgrades()
	{
		return [
			...super.getEvolutionUpgrades(),
			{
				name: "tesla_upgrade_duration_common",
				desc: localize("tesla_upgrade_duration_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_tesla_title",
				weight: 60,
				group: "tesla_duration",
				requirementsMet: true,
				reference: this,
				effect: function(tesla)
				{
					modifiers.addPercModifier(tesla, "tesla_upgrade_duration_common", {duration: .1})
				}
			},
			{
				name: "tesla_upgrade_duration_uncommon",
				desc: localize("tesla_upgrade_duration_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_tesla_title",
				weight: 20,
				group: "tesla_duration",
				requirementsMet: true,
				reference: this,
				effect: function(tesla)
				{
					modifiers.addPercModifier(tesla, "tesla_upgrade_duration_uncommon", {duration: .2})
				}
			},
			{
				name: "tesla_upgrade_duration_rare",
				desc: localize("tesla_upgrade_duration_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_tesla_title",
				weight: 7,
				group: "tesla_duration",
				requirementsMet: true,
				reference: this,
				effect: function(tesla)
				{
					modifiers.addPercModifier(tesla, "tesla_upgrade_duration_rare", {duration: .3})
				}
			},
			{
				name: "tesla_upgrade_damage_common",
				desc: localize("tesla_upgrade_damage_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_tesla_title",
				weight: 60,
				group: "tesla_damage",
				requirementsMet: true,
				reference: this,
				effect: function(tesla)
				{
					modifiers.addPercModifier(tesla, "tesla_upgrade_damage_common", {damage: .1})
				}
			},
			{
				name: "tesla_upgrade_damage_uncommon",
				desc: localize("tesla_upgrade_damage_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_tesla_title",
				weight: 20,
				group: "tesla_damage",
				requirementsMet: true,
				reference: this,
				effect: function(tesla)
				{
					modifiers.addPercModifier(tesla, "tesla_upgrade_damage_uncommon", {damage: .2})
				}
			},
			{
				name: "tesla_upgrade_damage_rare",
				desc: localize("tesla_upgrade_damage_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_tesla_title",
				weight: 7,
				group: "tesla_damage",
				requirementsMet: true,
				reference: this,
				effect: function(tesla)
				{
					modifiers.addPercModifier(tesla, "tesla_upgrade_damage_rare", {damage: .3})
				}
			},
			{
				name: "tesla_upgrade_range_common",
				desc: localize("tesla_upgrade_range_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_tesla_title",
				weight: 60,
				group: "tesla_range",
				requirementsMet: this.mod.range < this.base.range * 2,
				reference: this,
				effect: function(tesla)
				{
					modifiers.addPercModifier(tesla, "tesla_upgrade_range_common", {range: .1})
				}
			},
			{
				name: "tesla_upgrade_range_uncommon",
				desc: localize("tesla_upgrade_range_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_tesla_title",
				weight: 20,
				group: "tesla_range",
				requirementsMet: this.mod.range < this.base.range * 2,
				reference: this,
				effect: function(tesla)
				{
					modifiers.addPercModifier(tesla, "tesla_upgrade_range_uncommon", {range: .2})
				}
			},
			{
				name: "tesla_upgrade_range_rare",
				desc: localize("tesla_upgrade_range_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_tesla_title",
				weight: 7,
				group: "tesla_range",
				requirementsMet: this.mod.range < this.base.range * 2,
				reference: this,
				effect: function(tesla)
				{
					modifiers.addPercModifier(tesla, "tesla_upgrade_range_rare", {range: .3})
				}
			},
			{
				name: "tesla_upgrade_static_common",
				desc: localize("tesla_upgrade_static_desc", "1%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_tesla_title",
				weight: 60,
				group: "tesla_static",
				requirementsMet: true,
				reference: this,
				effect: function(tesla)
				{
					modifiers.addPercModifier(tesla, "tesla_upgrade_static_common", {electricStatusChance: .01})
				}
			},
			{
				name: "tesla_upgrade_static_uncommon",
				desc: localize("tesla_upgrade_static_desc", "3%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_tesla_title",
				weight: 20,
				group: "tesla_static",
				requirementsMet: true,
				reference: this,
				effect: function(tesla)
				{
					modifiers.addPercModifier(tesla, "tesla_upgrade_static_uncommon", {electricStatusChance: .03})
				}
			},
			{
				name: "tesla_upgrade_static_rare",
				desc: localize("tesla_upgrade_static_desc", "5%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_tesla_title",
				weight: 7,
				group: "tesla_static",
				requirementsMet: true,
				reference: this,
				effect: function(tesla)
				{
					modifiers.addPercModifier(tesla, "tesla_upgrade_static_rare", {electricStatusChance: .05})
				}
			}
		]
	}
}

class TeslaMine extends FriendlyTurret
{
	constructor()
	{
		super()
		this.progressOffset = 30
	}

	reset(parent, x, y)
	{
		// Reset vars.
		super.reset(x, y, parent)
		this.rotation = Random.uniform(Math.PI, Math.PI)
		this.cooldown = 0
		this.currentDuration = 0
		this.electricAudioLoop = null
		this.lightingPos = []
		audioHandler.playAudioHook("tesla_spawn")
	}

	audioStart()
	{
		if (this.electricAudioLoop == null)
		{
			audioHandler.playAudioHook("tesla_electric_start", getPanFromX(this.position.x))
			this.electricAudioLoop = audioHandler.playAudioHook("tesla_electric_loop", getPanFromX(this.position.x), true)
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

	update()
	{
		if (!isPaused())
		{
			// Update rotation.
			this.rotation += 0.02

			// Update duration.
			if (++this.currentDuration > this.parent.mod.duration)
				this.suspend()
			
			// Damage enemies in range.
			if (++this.cooldown >= 3600 / this.parent.mod.rateOfFire)
				this.cooldown = 0
			
			// Find all enemies in range.
			this.lightingPos = []
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
						this.lightingPos.push([this.position, pointHitOnShield])
						if (this.cooldown == 0)
							armor.getHit(this.parent.dmg.mod.all, this.parent, pointHitOnShield)
					}

					// Else, deal damage.
					else
					{
						if (this.cooldown == 0)
						{
							let damage = Random.uniform(this.parent.dmg.mod.all, 1)
							if (this.parent.restrictedArea) enemy.addStatusEffect("restrictedArea")
							let result = enemy.getHit(damage, this.parent, null)
							this.parent.recordDamage(result.damage)
						}
						this.lightingPos.push([this.position, enemy.getPosition()])
					}
				}
			})
		}
	}

	on_renderStart()
	{
		// Draw lightning bolts.
		this.lightingPos.forEach(pair => DrawLightning(pair[0], pair[1]))
	}

	on_render()
	{
		// Audio.
		if (this.lightingPos.length > 0) this.audioStart()
			else this.audioStop()

		// Draw shape.
		let pts = [Vector.rotate(Vector.create(scalePix(-13), 0), this.rotation)]
		pts.push(Vector.rotate(pts[0], Math.PI * 2 / 3))
		pts.push(Vector.rotate(pts[1], Math.PI * 2 / 3))
		for (let i = 0; i < pts.length; i++)
			pts[i] = Vector.add(pts[i], this.position)
		PrimNative.drawTriangle(Surface.Screen, pts[0].x, pts[0].y, pts[1].x, pts[1].y, pts[2].x, pts[2].y, scalePix(3), midGray)

		// Draw range.
		PrimNative.drawCircle(Surface.Screen, this.position.x, this.position.y, scalePix(this.parent.mod.range), scalePix(2), midGray.fadeTo(0.3))
	}
}