import { Repeater } from "../turrets/repeater.js"
import { HeatRay } from "../turrets/heatray.js"
import { Barrage } from "../turrets/barrage.js"
import { SplatterShot } from "../turrets/splattershot.js"

export const Turrets = function()
{
	return [
		{
			icon: Repeater.getIcon(),
			name: Repeater.getName(),
			desc: Repeater.getDesc(),
			tags: Repeater.getTags(),
			requirementsMet: true,
			weapon: Repeater,
			demo: true
		},
		{
			icon: HeatRay.getIcon(),
			name: HeatRay.getName(),
			desc: HeatRay.getDesc(),
			tags: HeatRay.getTags(),
			requirementsMet: "mainWeaponsUnlocked" in save && "HeatRay" in save.mainWeaponsUnlocked,
			cost: 1000,
			weapon: HeatRay,
			demo: false
		},
		{
			icon: Barrage.getIcon(),
			name: Barrage.getName(),
			desc: Barrage.getDesc(),
			tags: Barrage.getTags(),
			requirementsMet: "mainWeaponsUnlocked" in save && "Barrage" in save.mainWeaponsUnlocked,
			cost: 3000,
			weapon: Barrage,
			demo: false
		},
		{
			icon: SplatterShot.getIcon(),
			name: SplatterShot.getName(),
			desc: SplatterShot.getDesc(),
			tags: SplatterShot.getTags(),
			requirementsMet: "mainWeaponsUnlocked" in save && "SplatterShot" in save.mainWeaponsUnlocked,
			cost: 5000,
			weapon: SplatterShot,
			demo: false
		},
		{
			icon: "",
			name: localize("weapon_overmind_title"),
			desc: localize("weapon_overmind_desc"),
			comingSoon: true,
			tags: [
				"tag_electric",
				"tag_drone",
				"tag_main"
			],
			weapon: null,
			demo: false
		},
		{
			icon: "",
			name: localize("weapon_wildcard_title"),
			desc: localize("weapon_wildcard_desc"),
			comingSoon: true,
			tags: [
				"tag_kinetic",
				"tag_heat",
				"tag_cold",
				"tag_electric",
				"tag_main"
			],
			weapon: null,
			demo: false
		}
	]
}