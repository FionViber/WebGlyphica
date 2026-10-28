import { Matter } from 'sphere-runtime'
import { Weapon } from './weapon.js'

export class Release extends Weapon
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("item_release") }
	static getDesc() { return localize("item_release_desc_v2", "20", control.noMistypesTarget) }
	static damageTags() { return ["tag_explosive"] }
	static nonDamageTags() { return ["tag_remote", "tag_loot"] }

	constructor()
	{
		super()
        this.isWeapon = false
        this.dmg.base.explosive = 20
        this.base.critChance = .01
		this.base.critMult = 2
        this.refreshModifiers()
		this.start()
	}
	activate()
	{
        let totalDamage = 0
        let existingNoMistypes = powerups.find((powerup) => powerup.constructor.name == "NoMistypes")
        let damage = existingNoMistypes ? existingNoMistypes.level * this.dmg.mod.all : 0
        if (damage > 0)
        {
            hostilesArray.forEach(enemy => {
                if (
                    enemy.getType() == type.enemy &&
                    Matter.Bounds.overlaps(enemy.body.bounds, screenBounds)
                )
                {
                    enemy.getHit(damage, this)
                    totalDamage += damage
                }
            })
            this.recordDamage(totalDamage)
        }
	}
}