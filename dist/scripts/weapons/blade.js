import { Random, Matter } from 'sphere-runtime'
import { Weapon, FriendlyTurret } from './weapon.js'
import { Impact } from '../effects/impact.js'
import { Sparks } from '../effects/sparks.js'
import { Bleeding } from './bleeding.js'
import { EffectsSurface } from '../effects/effectsSurface.js'

export class Blade extends Weapon
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("weapon_blade_title") }
	static getDesc() { return localize("weapon_blade_desc") }
	static damageTags() { return ["tag_kinetic"] }
	static nonDamageTags() { return ["tag_turret"] }

	constructor()
	{
		super()
		this.extraLetters = 0
		this.sawtooth = false

		// Base stats.
		this.dmg.base.kinetic = 30
		this.base.rateOfFire = 200
		this.base.range = 250
		this.base.duration = 600
		this.base.critChance = .01
		this.base.critMult = 2
		this.refreshModifiers()

		// Glyph matches.
		this.glyphMatches = [button_left, button_right]
		this.wordMatches = getTriggerLetters('Blade')

		// Blade renderer.
		this.bladeRenderer = factory.spawn(EffectsSurface)
	}

	on_shutDown()
	{
		this.bladeRenderer.suspend()
		super.on_shutDown()
	}

	onWordComplete(word, quicktime, target)
	{
		if (usingController ? 
			this.glyphMatches.some(v => quicktime[0] == v) :
			this.wordMatches.some(v => word[0] == v)
		)
		{
			let targetPosition = target.getPosition()
			factory.spawn(BladeTrap, {x: targetPosition.x, y: targetPosition.y}, this)
		}
	}

	refreshModifiers()
	{
		if (this.sawtooth)
			modifiers.editPercModifier(this, "evo_blade_sawtoothBlade", {kineticStatusChance: this.base.critChance + modifiers.getPercModifier(this, "critChance")})
		super.refreshModifiers()
	}

	getEvolution()
	{
		return [
			{
				name: this.wordMatches.length > 4 ? "evo_blade_bladeRepository_2" : "evo_blade_bladeRepository",
				desc: localize("evo_blade_bladeRepository_desc"),
				triggerDesc: localize("starts_with_character"),
				triggerDescQuicktime: localize("starts_with_glyphs"),
				triggerValue: super.getNextExtraLetter(),
				triggerValueQuicktime: super.getNextExtraButton(),
				icon: "",
				weight: 10,
				requirementsMet: possibleExtraLetters.length > extraLetters.length,
				reference: this,
				effect: function(blade)
				{
					let extraLetter = possibleExtraLetters.find(letter => !extraLetters.includes(letter))
					let extraButton = possibleExtraButtons.find(button => !extraButtons.includes(button))
					blade.extraLetters += 1
					extraLetters.push(extraLetter)
					extraButtons.push(extraButton)
					blade.wordMatches = [...blade.wordMatches, ...extraLetter]
					blade.glyphMatches.push(extraButton)
				}
			},
			{
				name: "evo_blade_poisonCoating",
				desc: localize("evo_blade_poisonCoating_desc", "+5", "10%"),
				icon: "",
				weight: 10,
				requirementsMet: modifiers.getModifierCount(this, "evo_blade_poisonCoating") == 0,
				reference: this,
				effect: function(blade)
				{
					modifiers.addAbsModifier(blade, "evo_blade_poisonCoating", {chemical: 5})
					blade.refreshModifiers()
				}
			},
			{
				name: "evo_blade_poisonCoating_2",
				desc: localize("evo_blade_poisonCoating_2_desc", "5+", "+5%"),
				icon: "",
				weight: 10,
				requirementsMet: (
					modifiers.getModifierCount(this, "evo_blade_poisonCoating") > 0 &&
					modifiers.getModifierCount(this, "evo_blade_poisonCoating_2") == 0
				),
				reference: this,
				effect: function(blade)
				{
					modifiers.addAbsModifier(blade, "evo_blade_poisonCoating_2", {chemical: 5})
					modifiers.addPercModifier(blade, "evo_blade_poisonCoating_2", {chemicalStatusChance: .05})
					blade.refreshModifiers()
				}
			},
			{
				name: "evo_blade_sawtoothBlade",
				desc: localize("evo_blade_sawtoothBlade_desc"),
				icon: "",
				weight: 10,
				requirementsMet: !this.sawtooth,
				reference: this,
				effect: function(blade)
				{
					blade.sawtooth = true
					modifiers.addPercModifier(blade, "evo_blade_sawtoothBlade", {kineticStatusChance: 0})
					blade.refreshModifiers()
				}
			},
			{
				name: "evo_blade_sawtoothBlade_2",
				desc: localize("evo_blade_sawtoothBlade_2_desc", "5"),
				icon: "",
				weight: 10,
				requirementsMet: (
					this.sawtooth && (
						!getExistingWeapon("Bleeding") ||
						modifiers.getModifierCount(getExistingWeapon("Bleeding"), "evo_blade_sawtoothBlade_2") == 0
					)
				),
				reference: this,
				effect: function(_)
				{
					let bleedWeapon = getExistingWeapon("Bleeding")
					if (!bleedWeapon)
					{
						bleedWeapon = new Bleeding()
						allWeapons.push(bleedWeapon)
					}
					modifiers.addAbsModifier(bleedWeapon, "evo_blade_sawtoothBlade_2", { kinetic: 5 })
					bleedWeapon.refreshModifiers()
				}
			}
		]
	}

	getUpgrades()
	{
		return [
			...super.getEvolutionUpgrades(),
			{
				name: "blade_upgrade_damage_common",
				desc: localize("blade_upgrade_damage_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_blade_title",
				weight: 60,
				group: "blade_damage",
				requirementsMet: true,
				reference: this,
				effect: function(blade)
				{
					modifiers.addPercModifier(blade, "blade_upgrade_damage_common", {damage: 0.1})
				}
			},
			{
				name: "blade_upgrade_damage_uncommon",
				desc: localize("blade_upgrade_damage_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_blade_title",
				weight: 20,
				group: "blade_damage",
				requirementsMet: true,
				reference: this,
				effect: function(blade)
				{
					modifiers.addPercModifier(blade, "blade_upgrade_damage_uncommon", {damage: 0.2})
				}
			},
			{
				name: "blade_upgrade_damage_rare",
				desc: localize("blade_upgrade_damage_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_blade_title",
				weight: 7,
				group: "blade_damage",
				requirementsMet: true,
				reference: this,
				effect: function(blade)
				{
					modifiers.addPercModifier(blade, "blade_upgrade_damage_rare", {damage: 0.3})
				}
			},
			{
				name: "blade_upgrade_rate_common",
				desc: localize("blade_upgrade_rate_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_blade_title",
				weight: 60,
				group: "blade_rate",
				requirementsMet: true,
				reference: this,
				effect: function(blade)
				{
					modifiers.addPercModifier(blade, "blade_upgrade_rate_common", {rateOfFire: 0.1})
				}
			},
			{
				name: "blade_upgrade_rate_uncommon",
				desc: localize("blade_upgrade_rate_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_blade_title",
				weight: 20,
				group: "blade_rate",
				requirementsMet: true,
				reference: this,
				effect: function(blade)
				{
					modifiers.addPercModifier(blade, "blade_upgrade_rate_uncommon", {rateOfFire: 0.2})
				}
			},
			{
				name: "blade_upgrade_rate_rare",
				desc: localize("blade_upgrade_rate_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_blade_title",
				weight: 7,
				group: "blade_rate",
				requirementsMet: true,
				reference: this,
				effect: function(blade)
				{
					modifiers.addPercModifier(blade, "blade_upgrade_rate_rare", {rateOfFire: 0.3})
				}
			},
			{
				name: "blade_upgrade_duration_common",
				desc: localize("blade_upgrade_duration_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_blade_title",
				weight: 60,
				group: "blade_duration",
				requirementsMet: true,
				reference: this,
				effect: function(blade)
				{
					modifiers.addPercModifier(blade, "blade_upgrade_duration_common", {duration: 0.1})
				}
			},
			{
				name: "blade_upgrade_duration_uncommon",
				desc: localize("blade_upgrade_duration_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_blade_title",
				weight: 20,
				group: "blade_duration",
				requirementsMet: true,
				reference: this,
				effect: function(blade)
				{
					modifiers.addPercModifier(blade, "blade_upgrade_duration_uncommon", {duration: 0.2})
				}
			},
			{
				name: "blade_upgrade_duration_rare",
				desc: localize("blade_upgrade_duration_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_blade_title",
				weight: 7,
				group: "blade_duration",
				requirementsMet: true,
				reference: this,
				effect: function(blade)
				{
					modifiers.addPercModifier(blade, "blade_upgrade_duration_rare", {duration: 0.3})
				}
			}
		]
	}
}

class BladeTrap extends FriendlyTurret
{
	constructor()
	{
		super()
		this.rotation = Array(2)
	}

	reset(position, parent)
	{
		super.reset(position.x, position.y, parent)
		this.rotation = Random.uniform(180, 180)
		this.duration = 0
		audioHandler.playAudioHook("blade_spawn")
	}

	update()
	{
		if (!isPaused())
		{
			// Check expiry.
			if (++this.duration > this.parent.mod.duration)
				this.suspend()

			// Update rotation.
			let rotationPerFrame = 360 * this.parent.mod.rateOfFire / 14400
			this.rotation += rotationPerFrame

			// Get enemies in range.
			let collisions = hostilesArray
				.filter((enemy) => enemy.getType() == type.enemy && distanceBetween(this.position, enemy.getPosition()) <= scalePix(this.parent.mod.range))
			if (collisions.length > 0)
			{
				// Get enemies hit by blades.
				let rotationInRadians = this.rotation / 180 * Math.PI
				let rotationVector = {x: Math.cos(rotationInRadians), y: Math.sin(rotationInRadians)}
				let angleRange = rotationPerFrame / 360 * Math.PI
				collisions = collisions.filter((enemy) => {
					let directionToEnemy = Vector.sub(enemy.getPosition(), this.position)
					if (Vector.magnitude(directionToEnemy) <= 0) directionToEnemy = {x: 1, y: 0}
					for (let i = 0; i < 4; i++)
					{
						let angle = Vector.rotate(rotationVector, i * Math.PI / 2)
						if (this.angleDifference(directionToEnemy, angle) <= angleRange)
							return true
					}
					return false
				})
				if (collisions.length > 0)
				{
					collisions.forEach((enemy) => {

						// Deal with armored enemies.
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
							let colPtShield = collisionPoint(this.position, enemy.getPosition(), armor.body)
							audioHandler.playAudioHook("blade_hit_normal", getPanFromX(colPtShield.x))
							armor.getHit(this.parent.dmg.mod.all, this.parent, colPtShield)
							factory.spawn(Impact, colPtShield.x, colPtShield.y)
							return
						}

						// Handle damage.
						let damage = Random.uniform(this.parent.dmg.mod.all, 5)
						let result = enemy.getHit(damage, this.parent, null)
						this.parent.recordDamage(result.damage)

						// Hit effects.
						let randomPositionX = Random.uniform(enemy.getPosition().x, scalePix(5))
						let randomPositionY = Random.uniform(enemy.getPosition().y, scalePix(5))
						let direction = Vector.sub({x: randomPositionX, y: randomPositionY}, this.position)
						let angle = Math.atan2(direction.y, direction.x)
						factory.spawn(Impact, randomPositionX, randomPositionY)
						audioHandler.playAudioHook(result.isCrit ? "blade_hit_crit" : "blade_hit_normal", getPanFromX(randomPositionX))
						for (let i = 0; i < 7; i++)
							factory.spawn(Sparks, randomPositionX, randomPositionY, Random.normal(angle, Math.PI / 6))
					})
				}
			}
		}
	}

	angleDifference(vecA, vecB)
	{
		return Math.abs(Math.acos(Vector.dot(vecA, vecB) / (Vector.magnitude(vecA) * Vector.magnitude(vecB))))
	}

	on_renderStart()
	{
		// Draw each blade.
		for (let i = 0; i < 4; i++)
		{
			// Blade.
			bladeRectModel.transform.identity()
			bladeRectModel.transform.scale(1, scalePix(this.parent.mod.range) - scalePix(70))
			bladeRectModel.transform.translate(0, scalePix(20))
			bladeRectModel.transform.rotate(i * 90 + this.rotation)
			bladeRectModel.transform.translate(this.position.x, this.position.y)
			bladeRectModel.draw(this.parent.bladeRenderer.surface)

			// Blade Tip.
			bladeTipModel.transform.identity()
			bladeTipModel.transform.translate(0, scalePix(this.parent.mod.range) - scalePix(50))
			bladeTipModel.transform.rotate(i * 90 + this.rotation)
			bladeTipModel.transform.translate(this.position.x, this.position.y)
			bladeTipModel.draw(this.parent.bladeRenderer.surface)
		}
		
		// Draw center spoke.
		PrimNative.drawCircle(
			this.parent.bladeRenderer.surface,
			this.position.x,
			this.position.y,
			scalePix(20),
			scalePix(10),
			midGray
		)
	}
}