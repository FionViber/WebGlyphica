import { Random, Matter } from 'sphere-runtime'
import { Weapon } from './weapon.js'

export class Jester extends Weapon
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("item_jester") }
	static getDesc() { return localize("item_jester_desc") }
	static damageTags() { return ["tag_kinetic"] }
	static nonDamageTags() { return ["tag_remote", "tag_loot"] }

	constructor()
	{
		super()
        this.isWeapon = false
        this.dmg.base.kinetic = 50
        this.refreshModifiers()
		this.start()
	}
    isCrit(enemy) { return false }
	activate()
	{
        let totalDamage = 0
		hostilesArray.forEach(enemy => {
            if (
                enemy.getType() == type.enemy &&
                Matter.Bounds.overlaps(enemy.body.bounds, screenBounds)
            )
            {
                let damage = Random.discrete(0, 100)
                enemy.getHit(damage, this)
                totalDamage += damage
            }
        })
        this.recordDamage(totalDamage)
	}
}