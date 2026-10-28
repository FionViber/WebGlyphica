export class Modifiers
{
	constructor()
	{
		// Container for all modifiers in a run.
		this.allModifiers = {}
		
		// All percentage modifier types.
		this.modifierTypes = [
			"damage",
			"farDamage",
			"nearDamage",
			"rateOfFire",
			"range",
			"speed",
			"duration",
			"critChance",
			"critMult",
			"experience",
			"lootChance",
			"healthChance",
			"coinChance",
			"rerollChance",
			"shieldChance",
			"doubleDamageChance",
			"freezeChance",
			"statusChance",
			"kineticStatusChance",
			"heatStatusChance",
			"coldStatusChance",
			"electricStatusChance",
			"chemicalStatusChance",
		]

		// All absolute damage modifier types.
		this.damageTypes = [
			"kinetic",
			"heat",
			"cold",
			"electric",
			"chemical",
			"explosive"
		]

		// Base template.
		let modifierTemplate = {
			perc: {
				totalModifier: {},
				discreteModifiers: {},
				modifierCount: {}
			},
			abs: {
				totalModifier: {},
				discreteModifiers: {},
				modifierCount: {}
			}
		}

		// Percentage modifiers.
		this.modifierTypes.forEach(type => {
			modifierTemplate.perc.totalModifier[type] = 0
			modifierTemplate.perc.discreteModifiers[type] = {}
		})

		// Absolute damage modifiers.
		this.damageTypes.forEach(type => {
			modifierTemplate.abs.totalModifier[type] = 0
			modifierTemplate.abs.discreteModifiers[type] = {}
		})

		// Create template
		this.modifierTemplate = JSON.stringify(modifierTemplate)

		// List of modifiers that is auto-generated for every weapon.
		this.defaultModifiers = [
			"farDamage",
			"nearDamage",
			"experience",
			"coinChance",
			"rerollChance",
			"shieldChance",
			"doubleDamageChance",
			"freezeChance",
			"healthChance",
			"lootChance",
			"statusChance"
		]

		// List of modifiers that are additive instead of multiplicative on application.
		this.additiveModifiers = [
			"farDamage",
			"nearDamage",
			"critChance",
			"critMult",
			"coinChance",
			"rerollChance",
			"shieldChance",
			"doubleDamageChance",
			"freezeChance",
			"healthChance",
			"lootChance",
			"statusChance",
			"kineticStatusChance",
			"heatStatusChance",
			"coldStatusChance",
			"electricStatusChance",
			"chemicalStatusChance"
		]
	}

	getModifierCount(weaponOrTag, modifierName)
	{
		let entryName = typeof weaponOrTag == "string" ? weaponOrTag : weaponOrTag.constructor.name
		let result = 0
		if (entryName in this.allModifiers)
		{
			if (modifierName in this.allModifiers[entryName].perc.modifierCount)
				result += this.allModifiers[entryName].perc.modifierCount[modifierName]
			if (modifierName in this.allModifiers[entryName].abs.modifierCount)
				result += this.allModifiers[entryName].abs.modifierCount[modifierName]
		}
		return result
	}

	addAbsModifier(weaponOrTag, modifierName, statChanges) { this.addModifier(weaponOrTag, modifierName, statChanges, false) }
	addPercModifier(weaponOrTag, modifierName, statChanges) { this.addModifier(weaponOrTag, modifierName, statChanges, true) }
	addModifier(weaponOrTag, modifierName, statChanges, perc)
	{
		let entryName = typeof weaponOrTag == "string" ? weaponOrTag : weaponOrTag.constructor.name
		let type = perc ? "perc" : "abs"

		// Add to database if it doesn't already exist.
		if (!(entryName in this.allModifiers))
			this.addEntry(weaponOrTag)

		// Go through each stat that is modified.
		for (const stat in statChanges)
		{
			// Add to discrete modifiers.
			if (stat in this.allModifiers[entryName][type].discreteModifiers)
			{
				if (modifierName in this.allModifiers[entryName][type].discreteModifiers[stat])
					this.allModifiers[entryName][type].discreteModifiers[stat][modifierName] += statChanges[stat]
				else
					this.allModifiers[entryName][type].discreteModifiers[stat][modifierName] = statChanges[stat]
			}

			// Add to total modifiers.
			this.allModifiers[entryName][type].totalModifier[stat] += statChanges[stat]
		}

		// Append modifier count.
		if (modifierName in this.allModifiers[entryName][type].modifierCount)
			this.allModifiers[entryName][type].modifierCount[modifierName]++
		else
			this.allModifiers[entryName][type].modifierCount[modifierName] = 1
	}

	// Override values in an existing modifier.
	editAbsModifier(weaponOrTag, modifierName, statChanges) { this.editModifier(weaponOrTag, modifierName, statChanges, false) }
	editPercModifier(weaponOrTag, modifierName, statChanges) { this.editModifier(weaponOrTag, modifierName, statChanges, true) }
	editModifier(weaponOrTag, modifierName, statChanges, perc)
	{
		let entryName = typeof weaponOrTag == "string" ? weaponOrTag : weaponOrTag.constructor.name
		let type = perc ? "perc" : "abs"

		// If the weapon or tag doesn't exist, exit.
		if (!(entryName in this.allModifiers))
		{
			console.log("ERROR: Cannot find category " + entryName)
			return
		}

		// If no such modifier, exit.
		if (!(modifierName in this.allModifiers[entryName][type].modifierCount))
		{
			console.log("ERROR: Cannot find modifier with name " + modifierName)
			return
		}

		// Build a profile of current stat changes of the desired modifier.
		let oldModifierStatChanges = {}
		for (const stat in this.allModifiers[entryName][type].discreteModifiers)
			if (modifierName in this.allModifiers[entryName][type].discreteModifiers[stat])
				oldModifierStatChanges[stat] = this.allModifiers[entryName][type].discreteModifiers[stat][modifierName]
		
		// Reverse changes.
		this.allModifiers[entryName][type].modifierCount[modifierName]--
		for (const stat in oldModifierStatChanges)
		{
			this.allModifiers[entryName][type].totalModifier[stat] -= oldModifierStatChanges[stat]
			this.allModifiers[entryName][type].discreteModifiers[stat][modifierName] = 0
		}

		// Re-add modifier.
		this.addModifier(weaponOrTag, modifierName, statChanges, perc)
	}

	getAbsModifier(weapon, stat, min = -Infinity) { return this.getModifier(weapon, stat, min, false) }
	getPercModifier(weapon, stat, min = -.9) { return this.getModifier(weapon, stat, min, true) }
	getModifier(weapon, stat, min, perc)
	{
		let result
		let entryName = typeof weapon == "string" ? weapon : weapon.constructor.name
		let type = perc ? "perc" : "abs"

		// Get modifier from global modifiers.
		let totalModifier = this.allModifiers["global"][type].totalModifier[stat]

		// Get modifier from weapon upgrades.
		if (entryName in this.allModifiers)
			totalModifier += this.allModifiers[entryName][type].totalModifier[stat]

		// Get modifier from tags.
		if (perc && stat == "damage")
		{
			result = {}
			for (const dmgType of this.damageTypes)
				if (weapon.dmg.base[dmgType] + this.getAbsModifier(weapon, dmgType) > 0)
				{
					result[dmgType] = totalModifier
					let tags = [...weapon.constructor.nonDamageTags(), "tag_" + dmgType]
					tags.forEach(tag => {
						if (tag in this.allModifiers)
							result[dmgType] += this.allModifiers[tag].perc.totalModifier[stat]
					})
					result[dmgType] = Math.max(min, result[dmgType])
				}
		}
		else
		{
			result = totalModifier
			let tags = [...weapon.constructor.nonDamageTags(), perc ? weapon.primaryDamageTag : "tag_" + stat]
			tags.forEach(tag => {
				if (tag in this.allModifiers)
					result += this.allModifiers[tag][type].totalModifier[stat]
			})
			result = Math.max(min, result)
		}

		// Return result.
		return result
	}

	getAbsDiscreteModifiers(weapon, stat) { return this.getDiscreteModifiers(weapon, stat, false)}
	getPercDiscreteModifiers(weapon, stat) { return this.getDiscreteModifiers(weapon, stat, true)}
	getDiscreteModifiers(weapon, stat, perc)
	{
		let result
		let entryName = typeof weapon == "string" ? weapon : weapon.constructor.name
		let type = perc ? "perc" : "abs"

		// Get modifiers from global modifiers.
		let discreteModifiers = this.allModifiers["global"][type].discreteModifiers[stat]

		// Get modifiers from weapon upgrades.
		if (entryName in this.allModifiers)
			discreteModifiers = {...discreteModifiers, ...this.allModifiers[entryName][type].discreteModifiers[stat]}

		// Get modifiers from tags.
		if (perc && stat == "damage")
		{
			result = {}
			for (const dmgType of this.damageTypes)
				if (weapon.dmg.base[dmgType] + this.getAbsModifier(weapon, dmgType) > 0)
				{
					result[dmgType] = {...discreteModifiers}
					let tags = [...weapon.constructor.nonDamageTags(), "tag_" + dmgType]
					tags.forEach(tag => {
						if (tag in this.allModifiers)
							result[dmgType] = {...result[dmgType], ...this.allModifiers[tag].perc.discreteModifiers[stat]}
					})
				}
		}
		else
		{
			result = {...discreteModifiers}
			let tags = [...weapon.constructor.nonDamageTags(), perc ? weapon.primaryDamageTag : "tag_" + stat]
			tags.forEach(tag => {
				if (tag in this.allModifiers)
					result = {...result, ...this.allModifiers[tag][type].discreteModifiers[stat]}
			})
		}

		// Return result.
		return result
	}

	// Reset modifiers.
	resetModifiers()
	{
		// Clear everything in allModifiers.
		for (const key in this.allModifiers)
			delete this.allModifiers[key]

		// Add in default entries.
		this.addEntry("global")

		// Add persistent modifiers.
		this.addPercModifier("global", "no_mistypes", { critChance: 0 })
		this.addPercModifier("global", "blitz", { rateOfFire: 0 })
	}

	// Add a new entry to all modifiers.
	addEntry(weaponOrTag)
	{
		let name = typeof weaponOrTag == "string" ? weaponOrTag : weaponOrTag.constructor.name
		if (!(name in this.allModifiers))
			this.allModifiers[name] = JSON.parse(this.modifierTemplate)
	}
}