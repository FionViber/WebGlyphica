import { Powerup } from '../core/powerup.js'
import { incrementShield } from '../pickups/shield.js'
import { incrementReroll } from '../pickups/reroll.js'
import { GiveWeapon } from './weaponsList.js'
import { Frostbite } from "../weapons/frostbite.js"
import { Necrobomb } from "../weapons/necrobomb.js"
import { Jester } from "../weapons/jester.js"
import { Release } from '../weapons/release.js'

export const LootItems = function()
{
	let icons = {
		item_explosive_range: "",
		item_explosive_damage: "",
		item_explosive_critMult: "",
		item_explosive_doubleDamage: "",
		item_kinetic_damage: "",
		item_kinetic_rateOfFire: "",
		item_kinetic_critChance: "",
		item_kinetic_bleedChance: "",
		item_heat_damage: "",
		item_heat_range: "",
		item_heat_rerollChance: "",
		item_heat_igniteChance: "",
		item_cold_damage: "",
		item_cold_freezeChance: "",
		item_cold_duration: "",
		item_cold_shieldChance: "",
		item_electric_damage: "",
		item_electric_rateOfFire: "",
		item_electric_staticChance: "",
		item_electric_duration: "",
		item_damageOverTime_range: "",
		item_damageOverTime_duration: "",
		item_drone_duration: "",
		item_drone_speed: "",
		item_drone_lootChance: "",
		item_drone_freezeChance: "",
		item_rapidFire_range: "",
		item_rapidFire_damage: "",
		item_rapidFire_nearDamage: "",
		item_remote_range: "",
		item_remote_speed: "",
		item_turret_duration: "",
		item_turret_rateOfFire: "",
		item_turret_damage: "",
		item_status_damage: "",
		item_status_duration: "",
		item_automata: "",
		item_controls: "",
		item_loot_critChance: "",
		item_global_damage: "",
		item_global_duration: "",
		item_global_range: "",
		item_tsunami: "",
		item_shockwave: "",
		item_annihilation: "",
		item_descent: "",
		item_shattershot: "",
		item_eruption: "",
		item_piercer: "",
		item_harbinger: "",
		item_inferno: "",
		item_plasmator: "",
		item_phoenix: "",
		item_pyroclysm: "",
		item_cryostasis: "",
		item_glacier: "",
		item_repulsor: "",
		item_cryogen: "",
		item_overload: "",
		item_megastorm: "",
		item_amplifier: "",
		item_singularity: "",
		item_infinity: "",
		item_hyperjets: "",
		item_overmind: "",
		item_frostbane: "",
		item_omniboost: "",
		item_instalink: "",
		item_command: "",
		item_energizer: "",
		item_hellstorm: "",
		item_exactitude: "",
		item_onslaught: "",
		item_torment: "",
		item_mystery: "",
		item_arsenal: "",
		item_lifesaver: "",
		item_starview: "",
		item_ool_explosive_range: "",
		item_ool_explosive_damage: "",
		item_ool_kinetic_damage: "",
		item_ool_kinetic_rateOfFire: "",
		item_ool_heat_damage: "",
		item_ool_heat_range: "",
		item_ool_cold_damage: "",
		item_ool_cold_duration: "",
		item_ool_electric_damage: "",
		item_ool_electric_rateOfFire: "",
		item_ool_drone_duration: "",
		item_ool_drone_damage: "",
		item_ool_remote_range: "",
		item_ool_remote_damage: "",
		item_ool_turret_duration: "",
		item_ool_turret_damage: "",
		item_ool_status_damage: "",
		item_ool_status_duration: "",
		item_global_ool_damage: "",
		item_global_ool_duration: "",
		item_global_ool_range: "",
	}
	let weapons = allWeapons.concat([currentTurret])
	let meetsRequirements = function(tag, stat)
	{
		if (tag == "global")
			return weapons.some(weap => weap.mod[stat] != 0)
		else
			return weapons.some(weap => {
				let tags = stat == "damage" ?
					[...weap.constructor.nonDamageTags(), ...weap.allDamageTags] :
					[...weap.constructor.nonDamageTags(), weap.primaryDamageTag]
				return tags.includes(tag) && weap.mod[stat] != 0
			})
	}
	let generate_item = function(tag, name, stat, amt, rarity, group, weight = null)
	{
		let amtStr = (amt > 0 ? "+" : "") + (amt * 100) + "%"
		return {
			name: name,
			icon: icons[name],
			desc: localize(name + "_desc", amtStr),
			weight: weight || 100 - modifiers.getModifierCount(tag, name) * 40,
			tagInfo: [tag == "global" ? null : tag, stat],
			rarity: rarity,
			group: group,
			requirementsMet: (modifiers.getModifierCount(tag, name) < 3 && meetsRequirements(tag, stat)),
			action: function()
			{
				modifiers.addPercModifier(tag, name, {[stat]: amt})
			}
		}
	}
	let generate_item_outofloot = function(tag, name, stat, amt, group, weight = null)
	{
		let amtStr = (amt > 0 ? "+" : "") + (amt * 100) + "%"
		return {
			name: name,
			icon: icons[name],
			desc: localize(name + "_desc", amtStr),
			weight: weight || 100,
			tagInfo: [tag == "global" ? null : tag, stat],
			rarity: rarity.common,
			group: group,
			requirementsMet: outOfLoot && meetsRequirements(tag, stat),
			action: function()
			{
				modifiers.addPercModifier(tag, name, {[stat]: amt})
			}
		}
	}

	return [
		generate_item_outofloot("tag_explosive", "item_ool_explosive_range", "range", .02, "explosive_range_group"),
		generate_item_outofloot("tag_explosive", "item_ool_explosive_damage", "damage", .02, "explosive_damage_group"),
		generate_item_outofloot("tag_kinetic", "item_ool_kinetic_damage", "damage", .02, "kinetic_damage_group"),
		generate_item_outofloot("tag_kinetic", "item_ool_kinetic_rateOfFire", "rateOfFire", .02, "kinetic_rof_group"),
		generate_item_outofloot("tag_heat", "item_ool_heat_damage", "damage", .02, "heat_damage_group"),
		generate_item_outofloot("tag_heat", "item_ool_heat_range", "range", .02, "heat_range_group"),
		generate_item_outofloot("tag_cold", "item_ool_cold_damage", "damage", .02, "cold_damage_group"),
		generate_item_outofloot("tag_cold", "item_ool_cold_duration", "duration", .02, "cold_duration_group"),
		generate_item_outofloot("tag_electric", "item_ool_electric_damage", "damage", .02, "electric_damage_group"),
		generate_item_outofloot("tag_electric", "item_ool_electric_rateOfFire", "rateOfFire", .02, "electric_rof_group"),
		generate_item_outofloot("tag_drone", "item_ool_drone_duration", "duration", .02, "drone_duration_group"),
		generate_item_outofloot("tag_drone", "item_ool_drone_damage", "damage", .02, "drone_damage_group"),
		generate_item_outofloot("tag_remote", "item_ool_remote_range", "range", .02, "remote_range_group"),
		generate_item_outofloot("tag_remote", "item_ool_remote_damage", "damage", .02, "remote_damage_group"),
		generate_item_outofloot("tag_turret", "item_ool_turret_duration", "duration", .02, "turret_duration_group"),
		generate_item_outofloot("tag_turret", "item_ool_turret_damage", "damage", .02, "turret_damage_group"),
		generate_item_outofloot("tag_status", "item_ool_status_damage", "damage", .02, "status_damage_group"),
		generate_item_outofloot("tag_status", "item_ool_status_duration", "duration", .02, "status_duration_group"),
		generate_item_outofloot("global", "item_global_ool_damage", "damage", .01, "global_damage_group"),
		generate_item_outofloot("global", "item_global_ool_duration", "duration", .01, "global_duration_group"),
		generate_item_outofloot("global", "item_global_ool_range", "range", .01, "global_range_group"),

		// Common.
		generate_item("tag_explosive", "item_explosive_range", "range", .15, rarity.common, "explosive_range_group"),
		generate_item("tag_explosive", "item_explosive_damage", "damage", .15, rarity.common, "explosive_damage_group"),
		generate_item("tag_explosive", "item_explosive_critMult", "critMult", 0.75, rarity.common, "explosive_crit_group"),
		generate_item("tag_explosive", "item_explosive_doubleDamage", "doubleDamageChance", .01, rarity.common, "explosive_double_group"),
		generate_item("tag_kinetic", "item_kinetic_damage", "damage", .15, rarity.common, "kinetic_damage_group"),
		generate_item("tag_kinetic", "item_kinetic_rateOfFire", "rateOfFire", .15, rarity.common, "kinetic_rof_group"),
		generate_item("tag_kinetic", "item_kinetic_critChance", "critChance", .01, rarity.common, "kinetic_crit_group"),
		generate_item("tag_kinetic", "item_kinetic_bleedChance", "kineticStatusChance", .02, rarity.common, "kinetic_status_group"),
		generate_item("tag_heat", "item_heat_damage", "damage", .15, rarity.common, "heat_damage_group"),
		generate_item("tag_heat", "item_heat_range", "range", .15, rarity.common, "heat_range_group"),
		generate_item("tag_heat", "item_heat_rerollChance", "rerollChance", .02, rarity.common, "heat_roll_group"),
		generate_item("tag_heat", "item_heat_igniteChance", "heatStatusChance", .02, rarity.common, "heat_status_group"),
		generate_item("tag_cold", "item_cold_damage", "damage", .15, rarity.common, "cold_damage_group"),
		generate_item("tag_cold", "item_cold_freezeChance", "coldStatusChance", .02, rarity.common, "cold_freeze_group"),
		generate_item("tag_cold", "item_cold_shieldChance", "shieldChance", .02, rarity.common, "cold_shield_group"),
		generate_item("tag_cold", "item_cold_duration", "duration", .15, rarity.common, "cold_duration_group"),
		generate_item("tag_electric", "item_electric_staticChance", "electricStatusChance", .02, rarity.common, "electric_status_group"),
		generate_item("tag_electric", "item_electric_damage", "damage", .15, rarity.common, "electric_damage_group"),
		generate_item("tag_electric", "item_electric_rateOfFire", "rateOfFire", .15, rarity.common, "electric_rof_group"),
		generate_item("tag_electric", "item_electric_duration", "duration", .15, rarity.common, "electric_duration_group"),
		generate_item("tag_drone", "item_drone_duration", "duration", .15, rarity.common, "drone_duration_group"),
		generate_item("tag_drone", "item_drone_speed", "speed", .15, rarity.common, "drone_speed_group"),
		generate_item("tag_drone", "item_automata", "damage", .15, rarity.common, "drone_damage_group"),
		generate_item("tag_drone", "item_drone_freezeChance", "freezeChance", .01, rarity.common, "drone_freeze_group"),
		generate_item("tag_remote", "item_remote_range", "range", .15, rarity.common, "remote_range_group"),
		generate_item("tag_remote", "item_remote_speed", "speed", .15, rarity.common, "remote_speed_group"),
		generate_item("tag_remote", "item_controls", "damage", .15, rarity.common, "remote_damage_group"),
		generate_item("tag_turret", "item_turret_duration", "duration", .15, rarity.common, "turret_duration_group"),
		generate_item("tag_turret", "item_turret_rateOfFire", "rateOfFire", .15, rarity.common, "turret_rof_group"),
		generate_item("tag_turret", "item_turret_damage", "damage", .15, rarity.common, "turret_damage_group"),
		generate_item("tag_status", "item_status_damage", "damage", .15, rarity.common, "status_damage_group"),
		generate_item("tag_status", "item_status_duration", "duration", .15, rarity.common, "status_duration_group"),
		generate_item("tag_loot", "item_loot_critChance", "critChance", .01, rarity.common, "loot_crit_group"),
		generate_item("global", "item_global_damage", "damage", .05, rarity.common, "global_damage_group"),
		generate_item("global", "item_global_duration", "duration", .05, rarity.common, "global_duration_group"),
		generate_item("global", "item_global_range", "range", .05, rarity.common, "global_range_group"),

		// Uncommon.
		generate_item("tag_explosive", "item_tsunami", "range", .25, rarity.uncommon, "explosive_range_group"),
		generate_item("tag_explosive", "item_shockwave", "damage", .25, rarity.uncommon, "explosive_damage_group"),
		generate_item("tag_explosive", "item_annihilation", "critMult", 1, rarity.uncommon, "explosive_crit_group"),
		generate_item("tag_explosive", "item_descent", "doubleDamageChance", .02, rarity.uncommon, "explosive_double_group"),
		generate_item("tag_kinetic", "item_shattershot", "damage", .25, rarity.uncommon, "kinetic_damage_group"),
		generate_item("tag_kinetic", "item_eruption", "rateOfFire", .25, rarity.uncommon, "kinetic_rof_group"),
		generate_item("tag_kinetic", "item_piercer", "critChance", .02, rarity.uncommon, "kinetic_crit_group"),
		generate_item("tag_kinetic", "item_harbinger", "kineticStatusChance", .04, rarity.uncommon, "kinetic_status_group"),
		generate_item("tag_heat", "item_inferno", "damage", .25, rarity.uncommon, "heat_damage_group"),
		generate_item("tag_heat", "item_plasmator", "range", .25, rarity.uncommon, "heat_range_group"),
		generate_item("tag_heat", "item_phoenix", "rerollChance", .05, rarity.uncommon, "heat_roll_group"),
		generate_item("tag_heat", "item_pyroclysm", "heatStatusChance", .04, rarity.uncommon, "heat_status_group"),
		generate_item("tag_cold", "item_cryostasis", "damage", .25, rarity.uncommon, "cold_damage_group"),
		generate_item("tag_cold", "item_glacier", "coldStatusChance", .04, rarity.uncommon, "cold_freeze_group"),
		generate_item("tag_cold", "item_repulsor", "shieldChance", .05, rarity.uncommon, "cold_shield_group"),
		generate_item("tag_cold", "item_cryogen", "duration", .25, rarity.uncommon, "cold_duration_group"),
		generate_item("tag_electric", "item_overload", "electricStatusChance", .04, rarity.uncommon, "electric_status_group"),
		generate_item("tag_electric", "item_megastorm", "damage", .25, rarity.uncommon, "electric_damage_group"),
		generate_item("tag_electric", "item_amplifier", "rateOfFire", .25, rarity.uncommon, "electric_rof_group"),
		generate_item("tag_electric", "item_singularity", "duration", .25, rarity.uncommon, "electric_duration_group"),
		generate_item("tag_drone", "item_infinity", "duration", .25, rarity.uncommon, "drone_duration_group"),
		generate_item("tag_drone", "item_hyperjets", "speed", .25, rarity.uncommon, "drone_speed_group"),
		generate_item("tag_drone", "item_overmind", "damage", .25, rarity.uncommon, "drone_damage_group"),
		generate_item("tag_drone", "item_frostbane", "freezeChance", .02, rarity.uncommon, "drone_freeze_group"),
		generate_item("tag_remote", "item_omniboost", "range", .25, rarity.uncommon, "remote_range_group"),
		generate_item("tag_remote", "item_instalink", "speed", .25, rarity.uncommon, "remote_speed_group"),
		generate_item("tag_remote", "item_command", "damage", .25, rarity.uncommon, "remote_damage_group"),
		generate_item("tag_turret", "item_energizer", "duration", .25, rarity.uncommon, "turret_duration_group"),
		generate_item("tag_turret", "item_hellstorm", "rateOfFire", .25, rarity.uncommon, "turret_rof_group"),
		generate_item("tag_turret", "item_exactitude", "damage", .25, rarity.uncommon, "turret_damage_group"),
		generate_item("tag_status", "item_onslaught", "damage", .25, rarity.uncommon, "status_damage_group"),
		generate_item("tag_status", "item_torment", "duration", .25, rarity.uncommon, "status_duration_group"),
		generate_item("tag_loot", "item_mystery", "critChance", .02, rarity.uncommon, "loot_crit_group"),
		generate_item("global", "item_arsenal", "damage", .125, rarity.uncommon, "global_damage_group"),
		generate_item("global", "item_lifesaver", "duration", .125, rarity.uncommon, "global_duration_group"),
		generate_item("global", "item_starview", "range", .125, rarity.uncommon, "global_range_group"),

		// Standard loot
		{
			name: "item_heat_nearDamage",
			icon: "",
			desc: localize("item_heat_nearDamage_desc_v2", "+20%"),
			weight: 100 - modifiers.getModifierCount("tag_heat", "item_heat_nearDamage") * 33,
			rarity: rarity.common,
			requirementsMet: (
				modifiers.getModifierCount("tag_heat", "item_heat_nearDamage") < 3 &&
				weapons.some(weap => weap.allDamageTags.includes("tag_heat"))
			),
			action: function()
			{
				modifiers.addPercModifier("tag_heat", "item_heat_nearDamage", {nearDamage: .3})
			}
		},
		{
			name: "item_refrigerant",
			icon: "",
			desc: localize("item_refrigerant_desc", "+20%", "+1%"),
			weight: 100 - modifiers.getModifierCount("global", "item_refrigerant") * 33,
			rarity: rarity.common,
			requirementsMet: (
				modifiers.getModifierCount("global", "item_refrigerant") < 3 &&
				"hasUsedFreeze" in save
			),
			action: function()
			{
				freezeDurationBonus += .3
				modifiers.addPercModifier("global", "item_refrigerant", {freezeChance: 0.01})
			}
		},
		{
			name: "item_vulnerability",
			icon: "",
			desc: localize("item_vulnerability_desc", "+20%", "+1%"),
			weight: 100 - modifiers.getModifierCount("global", "item_vulnerability") * 33,
			rarity: rarity.common,
			requirementsMet: (
				modifiers.getModifierCount("global", "item_vulnerability") < 3 &&
				"hasUsed2xDamage" in save
			),
			action: function()
			{
				doubleDamageDurationBonus += .3
				modifiers.addPercModifier("global", "item_vulnerability", {doubleDamageChance: 0.01})
			}
		},
		{
			name: "item_precision",
			icon: "",
			desc: localize("item_precision_desc", "+10%", "+1%", "+50%"),
			weight: 100 - modifiers.getModifierCount("global", "item_precision") * 50,
			rarity: rarity.common,
			tagInfo: [null, "critChance"],
			requirementsMet: (
				modifiers.getModifierCount("global", "item_precision") < 2 &&
				weapons.some(weapon => weapon.mod.critChance != 0)
			),
			action: function()
			{
				modifiers.addPercModifier("global", "item_precision", {critChance: .01, critMult: .5})
			}
		},
		{
			name: "item_health",
			icon: "",
			desc: localize("item_health_desc", currentTurret.currentHealth, currentTurret.health),
			weight: 100,
			rarity: rarity.common,
			requirementsMet: currentTurret.currentHealth < currentTurret.health,
			action: function()
			{
				currentTurret.addHealth(200)
			}
		},
		{
			name: "item_shield",
			icon: "",
			desc: localize("item_shield_desc", shields, maxShields),
			weight: 100,
			rarity: rarity.common,
			group: "shield_item_group",
			requirementsMet: (
				shields < maxShields &&
				!currentPickups.find(pickup => pickup.constructor.name == "Shield")
			),
			action: function()
			{
				incrementShield()
				audioHandler.playAudioHook("pickup_shield")
			}
		},
		{
			name: "item_reroll",
			icon: "",
			desc: localize("item_reroll_desc", reroll, maxReroll),
			weight: 100,
			rarity: rarity.common,
			group: "reroll_item_group",
			requirementsMet: (
				reroll < maxReroll &&
				!currentPickups.find(pickup => pickup.constructor.name == "RerollPickup")
			),
			action: function()
			{
				incrementReroll()
				audioHandler.playAudioHook("pickup_reroll")
			}
		},
		{
			name: "item_afflictor",
			icon: "",
			desc: localize("item_afflictor_desc", "+4%"),
			weight: 400,
			rarity: rarity.common,
			requirementsMet: (
				("augment_afflictors" in activeAugments)
			),
			action: function()
			{
				modifiers.addPercModifier("tag_damageOverTime", "item_afflictor", {
					damage: .04,
					nearDamage: .04
				})
			}
		},

		// =============
		// UNCOMMON LOOT
		// =============

		{
			name: "item_point_blank",
			icon: "",
			desc: localize("item_point_blank_desc_v2", "+20%", "+5%"),
			weight: 100 - modifiers.getModifierCount("global", "item_point_blank") * 50,
			rarity: rarity.uncommon,
			requirementsMet: modifiers.getModifierCount("global", "item_point_blank") < 2,
			action: function()
			{
				modifiers.addPercModifier("global", "item_point_blank", {nearDamage: .2})
			}
		},
		{
			name: "item_aggravation",
			icon: "",
			desc: localize("item_aggravation_desc", "+2%"),
			weight: 100 - modifiers.getModifierCount("global", "item_aggravation") * 30,
			rarity: rarity.uncommon,
			requirementsMet: (
				weapons.some(weapon => weapon.constructor.nonDamageTags().includes("tag_status")) &&
				modifiers.getModifierCount("global", "item_aggravation") < 3
			),
			action: function()
			{
				modifiers.addPercModifier("global", "item_aggravation", {
					kineticStatusChance: .02,
					heatStatusChance: .02,
					coldStatusChance: .02,
					electricStatusChance: .02,
					chemicalStatusChance: .02
				})
			}
		},
		{
			name: "item_cryotechnics",
			icon: "",
			desc: localize("item_cryotechnics_desc", "+2%"),
			weight: 100 - modifiers.getModifierCount("global", "item_cryotechnics") * 30,
			rarity: rarity.uncommon,
			requirementsMet: (
				"hasUsedFreeze" in save &&
				modifiers.getModifierCount("global", "item_cryotechnics") < 3
			),
			action: function()
			{
				modifiers.addPercModifier("global", "item_cryotechnics", {freezeChance: 0.02})
			}
		},
		{
			name: "item_warlike",
			icon: "",
			desc: localize("item_warlike_desc", "+4%"),
			weight: 100  - modifiers.getModifierCount("global", "item_warlike") * 30,
			rarity: rarity.uncommon,
			requirementsMet: (
				"hasUsed2xDamage" in save &&
				modifiers.getModifierCount("global", "item_warlike") < 3
			),
			action: function()
			{
				modifiers.addPercModifier("global", "item_warlike", {doubleDamageChance: 0.04})
			}
		},
		{
			name: "item_pinata",
			icon: "",
			desc: localize("item_pinata_desc", "+20%", "+2%"),
			weight: 100,
			rarity: rarity.uncommon,
			requirementsMet: modifiers.getModifierCount("global", "item_pinata") == 0,
			action: function()
			{
				modifiers.addPercModifier("global", "item_pinata", {lootChance: 0.02})
			}
		},
		{
			name: "item_glassCannon",
			icon: "",
			desc: localize("item_glassCannon_desc_v2", "-50%", "+30%"),
			weight: 100,
			rarity: rarity.uncommon,
			requirementsMet: modifiers.getModifierCount("global", "item_glassCannon") == 0,
			action: function()
			{
				currentTurret.health = Math.round(currentTurret.health / 2)
				currentTurret.currentHealth = Math.min(currentTurret.health, currentTurret.currentHealth)
				currentTurret.addHealth(0)
				modifiers.addPercModifier("global", "item_glassCannon", {damage: 0.4})
			}
		},
		{
			name: "item_regeneration",
			icon: "",
			desc: localize("item_regeneration_desc", "5%"),
			weight: 100,
			rarity: rarity.uncommon,
			requirementsMet: !("item_regeneration" in serializedLoot),
			action: function() {}
		},
		{
			name: "item_DOTCanCrit",
			icon: "",
			desc: localize("item_DOTCanCrit_desc"),
			weight: 100,
			rarity: rarity.uncommon,
			tagInfo: ["tag_damageOverTime", null],
			requirementsMet: (
				!("item_DOTCanCrit" in serializedLoot) &&
				!("augment_corrosion" in activeAugments) &&
				weapons.some(weap => weap.constructor.nonDamageTags().includes("tag_damageOverTime"))
			),
			action: function() {}
		},
		{
			name: "item_shatter",
			icon: "",
			desc: localize("item_shatter_desc_v2", "+5%"),
			weight: 100,
			rarity: rarity.uncommon,
			tagInfo: ["tag_kinetic", "critChance"],
			requirementsMet: (
				!("item_shatter" in serializedLoot) &&
				weapons.some(weapon => weapon.allDamageTags.includes("tag_kinetic") && weapon.mod.critChance != 0) &&
				"hasUsedFreeze" in save
			),
			action: function() {}
		},
		{
			name: "item_seer",
			icon: "",
			desc: localize("item_seer_desc_2"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_seer" in serializedLoot),
			action: function() {}
		},
		{
			name: "item_resilience",
			icon: "",
			desc: localize("item_resilience_desc"),
			weight: 100,
			rarity: rarity.uncommon,
			requirementsMet: !("item_resilience" in serializedLoot),
			action: function()
			{
				modifiers.addPercModifier("global", "item_resilience", { duration: 0 })
			}
		},
		{
			name: "item_gambler",
			icon: "",
			desc: localize("item_gambler_desc"),
			weight: 100,
			rarity: rarity.uncommon,
			group: "reroll_item_group",
			requirementsMet: maxReroll < 6,
			action: function()
			{
				maxReroll++
				incrementReroll()
				audioHandler.playAudioHook("pickup_reroll")
			}
		},
		{
			name: "item_protector",
			icon: "",
			desc: localize("item_protector_desc"),
			weight: 100,
			rarity: rarity.uncommon,
			group: "shield_item_group",
			requirementsMet: maxShields < 4,
			action: function()
			{
				maxShields++
				incrementShield()
				audioHandler.playAudioHook("pickup_shield")
			}
		},
		{
			name: "item_flawless",
			icon: "",
			desc: localize("item_flawless_desc_v2", control.noMistypesTarget, "5%"),
			weight: 100,
			rarity: rarity.uncommon,
			requirementsMet: !("item_flawless" in serializedLoot),
			action: function()
			{
				let existingNoMistypes = powerups.find((powerup) => powerup.constructor.name == "NoMistypes")
				if (existingNoMistypes)
					existingNoMistypes.refresh()
			}
		},
		{
			name: "item_release",
			icon: "",
			desc: Release.getDesc(),
			weight: 100,
			rarity: rarity.uncommon,
			requirementsMet: !("item_release" in serializedLoot),
			action: function()
			{
				GiveWeapon("Release")
			}
		},
		{
			name: "item_wasting",
			icon: "",
			desc: localize("item_wasting_desc"),
			weight: 100,
			rarity: rarity.uncommon,
			requirementsMet: (
				!("item_wasting" in serializedLoot)
				&& weapons.some(weap => weap.constructor.nonDamageTags().includes("tag_damageOverTime"))
			),
			tagInfo: ["tag_damageOverTime", "rateOfFire"],
			action: function()
			{
				modifiers.addPercModifier("tag_damageOverTime", "item_wasting", { rateOfFire: .35 })
			}
		},
		{
			name: "item_wither",
			icon: "",
			desc: localize("item_wither_desc"),
			weight: 100,
			rarity: rarity.uncommon,
			requirementsMet: (
				!("item_wither" in serializedLoot)
				&& weapons.some(weap => weap.constructor.nonDamageTags().includes("tag_status"))
			),
			tagInfo: ["tag_status", "rateOfFire"],
			action: function()
			{
				modifiers.addPercModifier("tag_status", "item_wither", { rateOfFire: .35 })
			}
		},

		// =========
		// RARE LOOT
		// =========

		{
			name: "item_bonus_drones",
			icon: "",
			desc: localize("item_bonus_drones_desc", "35%"),
			weight: 100,
			rarity: rarity.rare,
			tagInfo: ["tag_drone", null],
			requirementsMet: (
				!("item_bonus_drones" in serializedLoot) &&
				weapons.some(weapon => weapon.constructor.getTags().includes("tag_drone"))
			),
			action: function() {}
		},
		{
			name: "item_plunder",
			icon: "",
			desc: localize("item_plunder_desc"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_plunder" in serializedLoot),
			action: function() {}
		},
		{
			name: "item_multitargeting",
			icon: "",
			desc: localize("item_multitargeting_desc"),
			weight: 100,
			tagInfo: ["tag_remote", "critChance"],
			rarity: rarity.rare,
			requirementsMet: (
				modifiers.getModifierCount("tag_remote", "item_multitargeting") == 0 &&
				weapons.some(weapon => weapon.constructor.getTags().includes("tag_remote"))
			),
			action: function()
			{
				modifiers.addPercModifier("tag_remote", "item_multitargeting", {critChance: (1 + allWeapons.reduce((count, v) => count + v.isWeapon, 0)) * .01})
			}
		},
		{
			name: "item_pickupMagnet",
			icon: "",
			desc: localize("item_pickupMagnet_desc", "50%"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_pickupMagnet" in serializedLoot),
			action: function() {}
		},
		{
			name: "item_frostbite",
			icon: "",
			desc: Frostbite.getDesc(),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !getExistingWeapon("Frostbite"),
			action: function()
			{
				GiveWeapon("Frostbite")
			}
		},
		{
			name: "item_necrobomb",
			icon: "",
			desc: Necrobomb.getDesc(),
			weight: 100,
			rarity: rarity.rare,
			tagInfo: ["tag_explosive", "critChance"],
			requirementsMet: (
				!("item_necrobomb" in serializedLoot)
				&& weapons.some(weapon => weapon.allDamageTags.includes("tag_explosive") && weapon.mod.critChance != 0)
			),
			action: function()
			{
				GiveWeapon("Necrobomb")
			}
		},
		{
			name: "item_prize",
			icon: "",
			desc: localize("item_prize_desc_v2", "30%"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_prize" in serializedLoot),
			action: function() {}
		},
		{
			name: "item_aftershock",
			icon: "",
			desc: localize("item_aftershock_desc"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_aftershock" in serializedLoot),
			action: function() {}
		},
		{
			name: "item_vampirism",
			icon: "",
			desc: localize("item_vampirism_desc_v2", "5%"),
			weight: 100,
			rarity: rarity.rare,
			tagInfo: ["tag_kinetic", null],
			requirementsMet: (
				!("item_vampirism" in serializedLoot)
				&& weapons.some(weap => weap.allDamageTags.includes("tag_kinetic"))
			),
			action: function() {}
		},
		{
			name: "item_wisdom",
			icon: "",
			desc: localize("item_wisdom_desc"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_wisdom" in serializedLoot),
			action: function() {}
		},
		{
			name: "item_jester",
			icon: "",
			desc: Jester.getDesc(),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_jester" in serializedLoot),
			action: function()
			{
				GiveWeapon("Jester")
			}
		},
		{
			name: "item_lastStand",
			icon: "",
			desc: localize("item_lastStand_desc"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_lastStand" in serializedLoot),
			action: function() {}
		},
		{
			name: "item_tripleDamage",
			icon: "",
			desc: localize("item_tripleDamage_desc"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_tripleDamage" in serializedLoot),
			action: function()
			{
				// Change existing double damage to display triple damage.
				let existingDoubleDamage = powerups.find(powerup => powerup.constructor.name == "DoubleDamage")
				if (existingDoubleDamage)
					existingDoubleDamage.transformToTripleDamage()
			}
		},
		{
			name: "item_fracture",
			icon: "",
			desc: localize("item_fracture_desc_2", "50%"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_fracture" in serializedLoot),
			action: function() {}
		},
		{
			name: "item_ascetic",
			icon: "",
			desc: localize("item_ascetic_desc"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_ascetic" in serializedLoot),
			action: function()
			{
				modifiers.addPercModifier("global", "item_ascetic", { damage: 0 })
			}
		},
		{
			name: "item_harmonizer",
			icon: "",
			desc: localize("item_harmonizer_desc"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_harmonizer" in serializedLoot),
			action: function(onLoad)
			{
				if (!onLoad)
					weapons.forEach(weap => {
						if (weap.isWeapon)
							weap.increaseEvolutionLevel(1)
					})
			}
		},
		{
			name: "item_immortality",
			icon: "",
			desc: localize("item_immortality_desc_v2"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_immortality" in serializedLoot),
			action: function() {}
		},
		{
			name: "item_enlightenment",
			icon: "",
			desc: localize("item_enlightenment_desc"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_enlightenment" in serializedLoot),
			action: function() {}
		},
		{
			name: "item_closer",
			icon: "",
			desc: localize("item_closer_desc"),
			weight: 100,
			rarity: rarity.rare,
			requirementsMet: !("item_closer" in serializedLoot),
			action: function()
			{
				modifiers.addPercModifier("global", "item_closer", { damage: 0 })
			}
		},
		{
			name: "item_murderous",
			icon: "",
			desc: localize("item_murderous_desc"),
			weight: 100,
			rarity: rarity.rare,
			tagInfo: ["tag_drone", null],
			requirementsMet: (
				!("item_murderous" in serializedLoot) &&
				weapons.some(weapon => weapon.constructor.nonDamageTags().includes("tag_drone"))
			),
			action: function()
			{
				modifiers.addPercModifier("tag_drone", "item_murderous", { damage: .5 })
			}
		},
		{
			name: "item_executioner",
			icon: "",
			desc: localize("item_executioner_desc"),
			weight: 100,
			rarity: rarity.rare,
			tagInfo: ["tag_turret", null],
			requirementsMet: (
				!("item_executioner" in serializedLoot) &&
				weapons.some(weapon => weapon.constructor.nonDamageTags().includes("tag_turret"))
			),
			action: function()
			{
				modifiers.addPercModifier("tag_turret", "item_executioner", { damage: .5 })
			}
		},
		{
			name: "item_degeneration",
			icon: "",
			desc: localize("item_degeneration_desc"),
			weight: 100,
			rarity: rarity.rare,
			tagInfo: ["tag_remote", null],
			requirementsMet: (
				!("item_degeneration" in serializedLoot) &&
				weapons.some(weapon => weapon.constructor.nonDamageTags().includes("tag_remote"))
			),
			action: function()
			{
				modifiers.addPercModifier("tag_remote", "item_degeneration", { damage: .5 })
			}
		}
	]
}

export class Ascetic extends Powerup
{
	constructor() { super("item_ascetic") }
	trigger(stacks)
	{
		this.node.setText(localize("item_ascetic"), `+${stacks * 10}% ${localize("damage")}`)
		modifiers.editPercModifier("global", "item_ascetic", { damage: stacks * .1 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
	on_expire()
	{
		modifiers.editPercModifier("global", "item_ascetic", { damage: 0 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
}

export class ImmortalityCooldown extends Powerup
{
	constructor() { super("powerup_immortalityCooldown") }
}

export class Closer extends Powerup
{
	constructor() { super("item_closer") }
	on_init()
	{
		this.stacks = 0
		this.trigger()
	}
	trigger()
	{
		if (this.stacks < 3)
		{
			this.stacks++
			this.node.setText(
				`${localize("item_closer")} x${this.stacks}`,
				`+${this.stacks * 10}% ${localize("damage")}`)
			modifiers.editPercModifier("global", "item_closer", { damage: this.stacks * .1 });
			[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
		}
	}
	on_expire()
	{
		modifiers.editPercModifier("global", "item_closer", { damage: 0 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
}

export class Resilience extends Powerup
{
	constructor() { super("item_resilience") }
	on_init()
	{
		this.stacks = 0
		this.trigger()
	}
	trigger()
	{
		if (this.stacks < 3)
		{
			this.stacks++
			this.node.setText(
				`${localize("item_resilience")} x${this.stacks}`,
				`+${this.stacks * 10}% ${localize("range_text")}`)
			modifiers.editPercModifier("global", "item_resilience", { duration: this.stacks * .1 });
			[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
		}
	}
	on_expire()
	{
		modifiers.editPercModifier("global", "item_resilience", { duration: 0 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
}