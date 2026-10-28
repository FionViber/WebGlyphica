import { Powerup } from "../core/powerup.js"
import { Retribution } from "../weapons/retribution.js"
import { DarkRelay } from "../weapons/darkRelay.js"
import { Caltrops } from "../weapons/caltrops.js"

export const augmentCategories = [
	"augment_category_mainWeapon",
	"augment_category_drones",
	"augment_category_turret",
	"augment_category_dot",
	"augment_category_remote"
]
export const augmentsList = function()
{
	return [

		// Codex: Main Weapon.
		{
			name: "augment_armored",
			icon: "",
			cost: [50, 200],
			desc: "augment_armored_desc",
			start_action: function(amt)
			{
				currentTurret.health = Math.round(currentTurret.health * (1 + .5 * amt))
				currentTurret.currentHealth = currentTurret.health
			}
		},
		{
			name: "augment_eager",
			icon: "",
			cost: [50],
			desc: "augment_eager_desc",
			start_action: function(amt)
			{}
		},
		{
			name: "augment_gambler",
			icon: "",
			cost: [50],
			desc: "augment_gambler_desc",
			start_action: function(amt)
			{
				modifiers.addPercModifier("tag_main", "augment_gambler", { damage: 0 })
			}
		},
		{
			name: "augment_immaculate",
			icon: "",
			cost: [100],
			desc: "augment_immaculate_desc",
			start_action: function(amt) {}
		},
		{
			name: "augment_haze",
			icon: "",
			cost: [200, 500],
			desc: "augment_haze_desc",
			start_action: function(amt)
			{
				modifiers.addPercModifier("global", "augment_haze", { rateOfFire: 0 })
			}
		},
		{
			name: "augment_devotion",
			icon: "",
			cost: [200],
			desc: "augment_devotion_desc",
			start_action: function(amt)
			{
				modifiers.addPercModifier("tag_main", "augment_devotion", { damage: 1 })
			}
		},

		// Codex: Turret.
		{
			name: "augment_armada",
			icon: "",
			cost: [200],
			desc: "augment_armada_desc",
			start_action: function(amt) {}
		},
		{
			name: "augment_diversity",
			icon: "",
			cost: [50],
			desc: "augment_diversity_desc",
			start_action: function(amt)
			{
				modifiers.addPercModifier(
					"tag_drone",
					"augment_diversity",
					{
						duration: currentTurret.constructor.name == "Overmind" ? .8 : 1
					}
				)
			}
		},
		{
			name: "augment_blitzkrieg",
			icon: "",
			cost: [50],
			desc: "augment_blitzkrieg_desc",
			start_action: function(amt) {}
		},
		{
			name: "augment_retribution",
			icon: "",
			cost: [300],
			desc: "augment_retribution_desc",
			start_action: function(amt)
			{
				allWeapons.push(new Retribution())
			}
		},
		{
			name: "augment_scapegoat",
			icon: "",
			cost: [100],
			desc: "augment_scapegoat_desc",
			start_action: function(amt) {}
		},
		{
			name: "augment_spoils",
			icon: "",
			cost: [200],
			desc: "augment_spoils_desc",
			start_action: function(amt) {}
		},

		// Codex: Drones.
		{
			name: "augment_fortress",
			icon: "",
			cost: [100, 400],
			desc: "augment_fortress_desc",
			start_action: function(amt) {}
		},
		{
			name: "augment_networked",
			icon: "",
			cost: [50],
			desc: "augment_networked_desc",
			start_action: function(amt)
			{
				modifiers.addPercModifier("tag_turret", "augment_networked", { rateOfFire: 0 })
			}
		},
		{
			name: "augment_fieldIntel",
			icon: "",
			cost: [50],
			desc: "augment_fieldIntel_desc",
			start_action: function(amt)
			{
				modifiers.addPercModifier("tag_turret", "augment_fieldIntel", { range: 0 })
			}
		},
		{
			name: "augment_darkRelay",
			icon: "",
			cost: [500],
			desc: "augment_darkRelay_desc",
			start_action: function(amt)
			{
				allWeapons.push(new DarkRelay())
			}
		},
		{
			name: "augment_observer",
			icon: "",
			cost: [100],
			desc: "augment_observer_desc",
			start_action: function(amt)
			{
				modifiers.addPercModifier("tag_turret", "augment_observer", { damage: 0 })
			}
		},
		{
			name: "augment_weakness",
			icon: "",
			cost: [200],
			desc: "augment_weakness_desc",
			start_action: function(amt) {}
		},
		
		// Codex: D.O.T.
		{
			name: "augment_corrosion",
			icon: "",
			cost: [500],
			desc: "augment_corrosion_desc",
			start_action: function(amt) {}
		},
		{
			name: "augment_lamprey",
			icon: "",
			cost: [200],
			desc: "augment_lamprey_desc",
			start_action: function(amt) {}
		},
		{
			name: "augment_tenacity",
			icon: "",
			cost: [100, 300],
			desc: "augment_tenacity_desc",
			start_action: function(amt)
			{
				modifiers.addPercModifier("tag_damageOverTime", "augment_tenacity", { duration: amt * .35 })
			}
		},
		{
			name: "augment_afflictors",
			icon: "",
			cost: [50],
			desc: "augment_afflictors_desc",
			start_action: function(amt) {}
		},
		{
			name: "augment_conviction",
			icon: "",
			cost: [100],
			desc: "augment_conviction_desc",
			start_action: function(amt)
			{
				modifiers.addPercModifier("tag_damageOverTime", "augment_conviction", { rateOfFire: 0 })
			}
		},
		{
			name: "augment_infector",
			icon: "",
			cost: [300, 500],
			desc: "augment_infector_desc",
			start_action: function(amt)
			{
				modifiers.addPercModifier("tag_damageOverTime", "augment_infector", {
					kineticStatusChance: amt * .03,
					heatStatusChance: amt * .03,
					coldStatusChance: amt * .03,
					electricStatusChance: amt * .03,
					chemicalStatusChance: amt * .03
				})
			}
		},

		// Codex: Remote.
		{
			name: "augment_closeCombat",
			icon: "",
			cost: [100],
			desc: "augment_closeCombat_desc",
			start_action: function(amt) {}
		},
		{
			name: "augment_caltrops",
			icon: "",
			cost: [200],
			desc: "augment_caltrops_desc",
			start_action: function(amt) 
			{
				allWeapons.push(new Caltrops())
			}
		},
		{
			name: "augment_causticAmmo",
			icon: "",
			cost: [500],
			desc: "augment_causticAmmo_desc",
			start_action: function(amt)
			{
				modifiers.addAbsModifier("tag_remote", "augment_causticAmmo", { chemical: 0 })
			}
		},
		{
			name: "augment_piracy",
			icon: "",
			cost: [50],
			desc: "augment_piracy_desc",
			start_action: function(amt)
			{
				modifiers.addPercModifier("tag_remote", "augment_piracy", { damage: 0 })
			}
		},
		{
			name: "augment_deliverance",
			icon: "",
			cost: [100],
			desc: "augment_deliverance_desc",
			start_action: function(amt)
			{
				modifiers.addPercModifier("tag_remote", "augment_deliverance", { range: 0 })
			}
		},
		{
			name: "augment_sniper",
			icon: "",
			cost: [200],
			desc: "augment_sniper_desc",
			start_action: function(amt) {}
		}
	]
}

export class Gambler extends Powerup
{
	constructor() { super("augment_gambler") }
	on_init()
	{
		this.stacks = 0
	}
	increment()
	{
		this.stacks++
		this.node.currentProgress = this.node.maxProgress
		modifiers.editPercModifier("tag_main", "augment_gambler", { damage: this.stacks * .2 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
		this.node.setText(localize("augment_gambler"), `+${this.stacks * 20}% ${localize("damage")}`)
	}
	on_expire()
	{
		modifiers.editPercModifier("tag_main", "augment_gambler", { damage: 0 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
}

export class Haze extends Powerup
{
	constructor() { super("augment_gambler") }
	on_init()
	{
		modifiers.editPercModifier("global", "augment_haze", { rateOfFire: activeAugments["augment_haze"] * .5 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
		this.node.setText(localize("augment_haze"), `+${activeAugments["augment_haze"] * 50}% ${localize("rateOfFire_text")}`)
	}
	on_expire()
	{
		modifiers.editPercModifier("global", "augment_haze", { rateOfFire: 0 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
}

export class FieldIntel extends Powerup
{
	constructor()
	{
		super("augment_fieldIntel")
		this.node.setText(localize("augment_fieldIntel"), `+30% ${localize("tag_turret")} ${localize("range_text")}`)
	}
	on_init()
	{
		modifiers.editPercModifier("tag_turret", "augment_fieldIntel", { range: .3 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
	refresh()
	{
		this.node.currentProgress = this.node.maxProgress
	}
	on_expire()
	{
		modifiers.editPercModifier("tag_turret", "augment_fieldIntel", { range: 0 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
}

export class Observer extends Powerup
{
	constructor()
	{
		super("augment_observer")
		this.node.setText(localize("augment_observer"), localize("augment_observer_powerup", "+30%"))
	}
	on_init()
	{
		modifiers.editPercModifier("tag_turret", "augment_observer", { damage: .3 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
	on_expire()
	{
		modifiers.editPercModifier("tag_turret", "augment_observer", { damage: 0 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
}

export class Deliverance extends Powerup
{
	constructor()
	{
		super("augment_deliverance")
		this.node.setText(localize("augment_deliverance"), localize("augment_deliverance_powerup", "+40%"))
	}
	on_init()
	{
		modifiers.editPercModifier("tag_remote", "augment_deliverance", { range: .4 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
	on_expire()
	{
		modifiers.editPercModifier("tag_remote", "augment_deliverance", { range: 0 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
}

export class Conviction extends Powerup
{
	constructor()
	{
		super("augment_conviction")
		this.node.setText(localize("augment_conviction"), localize("augment_conviction_powerup", "+40%"))
	}
	on_init()
	{
		modifiers.editPercModifier("tag_damageOverTime", "augment_conviction", { rateOfFire: .4 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
	on_expire()
	{
		modifiers.editPercModifier("tag_damageOverTime", "augment_conviction", { rateOfFire: 0 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
}