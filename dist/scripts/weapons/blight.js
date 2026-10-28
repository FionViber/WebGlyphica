import { Random, Matter } from 'sphere-runtime'
import { Weapon } from './weapon.js'

export class Blight extends Weapon
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("weapon_blight_title") }
	static getDesc() { return localize("weapon_blight_desc") }
	static damageTags() { return ["tag_chemical"] }
	static nonDamageTags() { return ["tag_damageOverTime", "tag_status"] }

	constructor()
	{
		super()
		this.isWeapon = false

		this.dmg.base.chemical = 10
		this.base.rateOfFire = 120
		this.base.critChance = .01
		this.base.critMult = 2.5
		this.base.duration = 300
		this.refreshModifiers()

		this.currentCooldown = 0
		this.start()
	}

	on_update()
	{
		if (!isPaused() && ++this.currentCooldown >= 3600 / this.mod.rateOfFire)
		{
			this.currentCooldown = 0
			hostilesArray.forEach((enemy) => {
				if (
					enemy.getType() == type.enemy
					&& Matter.Bounds.overlaps(enemy.body.bounds, screenBounds)
					&& enemy.statusEffects.some(status => status[0] == "chemicalStatus")
				)
				{
					let damage = Random.uniform(this.dmg.mod.all, 1)
					let result = enemy.getHit(damage, this, null)
					this.recordDamage(result.damage)
				}
			})
		}
	}
}