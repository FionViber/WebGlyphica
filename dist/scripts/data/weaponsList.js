import { Spectre } from '../weapons/spectre.js'
import { Sentry } from '../weapons/sentry.js'
import { Tesla } from '../weapons/tesla.js'
import { Oscillator } from '../weapons/oscillator.js'
import { Meteor } from '../weapons/meteor.js'
import { Hunter } from '../weapons/hunter.js'
import { Chopper } from '../weapons/chopper.js'
import { Minefield } from '../weapons/minefield.js'
import { Blade } from '../weapons/blade.js'
import { Firestorm } from '../weapons/firestorm.js'
import { Frostbite } from '../weapons/frostbite.js'
import { Bleeding } from '../weapons/bleeding.js'
import { Static } from '../weapons/static.js'
import { Ignite } from '../weapons/ignite.js'
import { Blight } from '../weapons/blight.js'
import { Necrobomb } from '../weapons/necrobomb.js'
import { Jester } from '../weapons/jester.js'
import { Release } from '../weapons/release.js'
import { Retribution } from '../weapons/retribution.js'
import { DarkRelay } from '../weapons/darkRelay.js'
import { Caltrops } from '../weapons/caltrops.js'

// Main Weapons.
import { Turret } from '../turrets/turret.js'
import { Repeater } from '../turrets/repeater.js'
import { HeatRay } from '../turrets/heatray.js'
import { Barrage } from '../turrets/barrage.js'
import { SplatterShot } from '../turrets/splattershot.js'

export const StaticWeaponList = {
	"Repeater": Repeater,
	"HeatRay": HeatRay,
	"Barrage": Barrage,
	"SplatterShot": SplatterShot,
	"Spectre": Spectre,
	"Sentry": Sentry,
	"Tesla": Tesla,
	"Oscillator": Oscillator,
	"Meteor": Meteor,
	"Hunter": Hunter,
	"Chopper": Chopper,
	"Minefield": Minefield,
	"Blade": Blade,
	"Firestorm": Firestorm,
	"Frostbite": Frostbite,
	"Bleeding": Bleeding,
	"Static": Static,
	"Ignite": Ignite,
	"Blight": Blight,
	"Necrobomb": Necrobomb,
	"Jester": Jester,
	"Release": Release,
	"Retribution": Retribution,
	"DarkRelay": DarkRelay,
	"Caltrops": Caltrops
}

// Loot and augments.
export const lootAndAugments = function()
{
	if (modifiers.getModifierCount("tag_remote", "item_multitargeting") > 0)
		modifiers.editPercModifier("tag_remote", "item_multitargeting", {critChance: (1 + allWeapons.reduce((count, v) => count + v.isWeapon, 0)) * .01})

	// If Devotion augment.
	if ("augment_devotion" in activeAugments)
	{
		modifiers.editPercModifier("tag_main", "augment_devotion", { damage: (4 - allWeapons.reduce((t, c) => t += c.isWeapon, 0)) * .25 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}

	// If Diversity augment.
	if ("augment_diversity" in activeAugments)
	{
		let isDrone = (weap) => weap.constructor.nonDamageTags().includes("tag_drone")
		let weapons = [...allWeapons, currentTurret]
		let nonDroneWeapons = weapons.filter(weap => weap.isWeapon).length - weapons.filter(weap => isDrone(weap)).length
		modifiers.editPercModifier("tag_drone", "augment_diversity", { duration: nonDroneWeapons * .2 })
		weapons.forEach((weap) => weap.refreshModifiers())
	}

	// If Research Teams augment.
	if ("augment_piracy" in activeAugments)
	{
		let isLootWeapon = (weap) => weap.constructor.nonDamageTags().includes("tag_loot")
		let weapons = [...allWeapons, currentTurret]
		let activeLootWeapons = weapons.reduce((t, c) => t + isLootWeapon(c), 0)
		modifiers.editPercModifier("tag_remote", "augment_piracy", { damage: activeLootWeapons * .15 })
		weapons.forEach((weap) => weap.refreshModifiers())
	}
}

// Cheat function to get weapon.
export const GiveWeapon = function(name)
{
	// Push instance of weapon.
	if (name in StaticWeaponList && !(StaticWeaponList[name].prototype instanceof Turret))
	{
		let weap = new StaticWeaponList[name]()
		allWeapons.push(weap)
		if (weap.isWeapon) ui.hud.bottom.addWeapon(weap)
		lootAndAugments()
		return weap
	}
	else return false
}

export const GiveAllWeapons = function()
{
	for (let key in StaticWeaponList)
	{
		if (StaticWeaponList[key].prototype instanceof Turret) continue

		// Skip Firestorm.
		if (key === "Firestorm") continue

		if (getExistingWeapon(key)) continue
		allWeapons.push(new StaticWeaponList[key]())
	}
}

// Global upgrades.
export const WeaponsList = function()
{
	let weaponCount = allWeapons.reduce((total, weap) => total += weap.isWeapon, 0)
	let newWeapWeight = Math.max(120 - weaponCount * 35, 0)
	let maxWeaponsReached = weaponCount >= 4
	let getLetters = function(name) {
		return getExistingWeapon(name) ?
			getExistingWeapon(name).wordMatches.join(", ") :
			getTriggerLetters(name).join(", ")
	}
	let getQuicktime = function(name, quicktime) {
		return getQuickTimeString(
			getExistingWeapon(name) ?
				getExistingWeapon(name).glyphMatches :
				quicktime
			)
	}
	let addWeapon = function(Weapon)
	{
		return () => {

			// Add weapon.
			let newWeapon = new Weapon()
			allWeapons.push(newWeapon)
			ui.hud.bottom.addWeapon(newWeapon)

			// Loot and Augment calculations.
			lootAndAugments()
		}
	}
	return [
		{
			icon: Spectre.getIcon(),
			name: Spectre.getName(),
			desc: Spectre.getDesc(),
			tags: Spectre.getTags(),
			class: Spectre.name,
			weight: newWeapWeight,
			requirementsMet: !maxWeaponsReached && !getExistingWeapon("Spectre"),
			triggerDesc: localize("contains_characters"),
			triggerDescQuicktime: localize("contains_glyphs"),
			triggerValue: getTriggerLetters("Spectre").join(", "),
			triggerValueQuicktime: "",
			effect: addWeapon(Spectre)
		},
		{
			icon: Sentry.getIcon(),
			name: Sentry.getName(),
			desc: Sentry.getDesc(),
			tags: Sentry.getTags(),
			class: Sentry.name,
			weight: newWeapWeight,
			requirementsMet: !maxWeaponsReached && !getExistingWeapon("Sentry"),
			effect: addWeapon(Sentry)
		},
		{
			icon: Tesla.getIcon(),
			name: Tesla.getName(),
			desc: Tesla.getDesc(),
			tags: Tesla.getTags(),
			class: Tesla.name,
			weight: newWeapWeight,
			requirementsMet: !maxWeaponsReached && !getExistingWeapon("Tesla"),
			triggerDesc: localize("starts_with_character"),
			triggerDescQuicktime: localize("starts_with_glyphs"),
			triggerValue: getLetters("Tesla"),
			triggerValueQuicktime: getQuicktime("Tesla", [shoulder_button_left, shoulder_button_right]),
			effect: addWeapon(Tesla)
		},
		{
			icon: Oscillator.getIcon(),
			name: Oscillator.getName(),
			desc: Oscillator.getDesc(),
			tags: Oscillator.getTags(),
			class: Oscillator.name,
			weight: newWeapWeight,
			requirementsMet: !maxWeaponsReached && !getExistingWeapon("Oscillator"),
			effect: addWeapon(Oscillator)
		},
		{
			icon: Meteor.getIcon(),
			name: Meteor.getName(),
			desc: Meteor.getDesc(),
			tags: Meteor.getTags(),
			class: Meteor.name,
			weight: newWeapWeight,
			requirementsMet: !maxWeaponsReached && !getExistingWeapon("Meteor"),
			effect: addWeapon(Meteor)
		},
		{
			icon: Hunter.getIcon(),
			name: Hunter.getName(),
			desc: Hunter.getDesc(),
			tags: Hunter.getTags(),
			class: Hunter.name,
			weight: newWeapWeight,
			requirementsMet: !maxWeaponsReached && !getExistingWeapon("Hunter"),
			triggerDesc: localize("contains_characters"),
			triggerDescQuicktime: localize("contains_glyphs"),
			triggerValue: getTriggerLetters("Hunter").join(", "),
			triggerValueQuicktime: getQuickTimeString([button_top, button_bottom, button_left, button_right]),
			effect: addWeapon(Hunter)
		},
		{
			icon: Chopper.getIcon(),
			name: Chopper.getName(),
			desc: Chopper.getDesc(),
			tags: Chopper.getTags(),
			class: Chopper.name,
			weight: newWeapWeight,
			requirementsMet: !maxWeaponsReached && !getExistingWeapon("Chopper"),
			effect: addWeapon(Chopper)
		},
		{
			icon: Minefield.getIcon(),
			name: Minefield.getName(),
			desc: Minefield.getDesc(),
			tags: Minefield.getTags(),
			class: Minefield.name,
			weight: newWeapWeight,
			requirementsMet: !maxWeaponsReached && !getExistingWeapon("Minefield"),
			triggerDesc: localize("starts_with_character"),
			triggerDescQuicktime: localize("starts_with_glyphs"),
			triggerValue: getLetters("Minefield"),
			triggerValueQuicktime: getQuicktime("Minefield", [button_top, button_bottom]),
			effect: addWeapon(Minefield)
		},
		{
			icon: Blade.getIcon(),
			name: Blade.getName(),
			desc: Blade.getDesc(),
			tags: Blade.getTags(),
			class: Blade.name,
			weight: newWeapWeight,
			requirementsMet: !maxWeaponsReached && !getExistingWeapon("Blade"),
			triggerDesc: localize("starts_with_character"),
			triggerDescQuicktime: localize("starts_with_glyphs"),
			triggerValue: getLetters("Blade"),
			triggerValueQuicktime: getQuicktime("Blade", [button_left, button_right]),
			effect: addWeapon(Blade)
		},
		{
			icon: Firestorm.getIcon(),
			name: Firestorm.getName(),
			desc: Firestorm.getDesc(),
			tags: Firestorm.getTags(),
			class: Firestorm.name,
			weight: newWeapWeight,
			requirementsMet: false, // !demo && !maxWeaponsReached && !getExistingWeapon("Firestorm"),
			effect: addWeapon(Firestorm)
		},

		// Non-weapon damage trackers.
		{
			icon: Frostbite.getIcon(),
			name: Frostbite.getName(),
			desc: Frostbite.getDesc(),
			tags: Frostbite.getTags(),
			requirementsMet: false
		},
		{
			icon: Bleeding.getIcon(),
			name: Bleeding.getName(),
			desc: Bleeding.getDesc(),
			tags: Bleeding.getTags(),
			requirementsMet: false
		},
		{
			icon: Static.getIcon(),
			name: Static.getName(),
			desc: Static.getDesc(),
			tags: Static.getTags(),
			requirementsMet: false
		},
		{
			icon: Ignite.getIcon(),
			name: Ignite.getName(),
			desc: Ignite.getDesc(),
			tags: Ignite.getTags(),
			requirementsMet: false
		},
		{
			icon: Blight.getIcon(),
			name: Blight.getName(),
			desc: Blight.getDesc(),
			tags: Blight.getTags(),
			requirementsMet: false
		},
		{
			icon: Necrobomb.getIcon(),
			name: Necrobomb.getName(),
			desc: Necrobomb.getDesc(),
			tags: Necrobomb.getTags(),
			requirementsMet: false
		},
		{
			icon: Jester.getIcon(),
			name: Jester.getName(),
			desc: Jester.getDesc(),
			tags: Jester.getTags(),
			requirementsMet: false
		},
		{
			icon: Release.getIcon(),
			name: Release.getName(),
			desc: Release.getDesc(),
			tags: Release.getTags(),
			requirementsMet: false
		},
		{
			icon: Retribution.getIcon(),
			name: Retribution.getName(),
			desc: Retribution.getDesc(),
			tags: Retribution.getTags(),
			requirementsMet: false
		},
		{
			icon: DarkRelay.getIcon(),
			name: DarkRelay.getName(),
			desc: DarkRelay.getDesc(),
			tags: DarkRelay.getTags(),
			requirementsMet: false
		},
		{
			icon: Caltrops.getIcon(),
			name: Caltrops.getName(),
			desc: Caltrops.getDesc(),
			tags: Caltrops.getTags(),
			requirementsMet: false
		}
	]
}

// Repeating upgrades when no more upgrades are left.
export const RepeatingUpgrades = function()
{
	return [
		{
			name: localize("level_up_heal"),
			name: localize("item_max_health"),
			desc: localize("item_max_health_desc"),
			tags: [],
			weight: 100,
			requirementsMet: true,
			effect: function()
			{
				currentTurret.addHealth(10)
			}
		}
	]
}