import { Explosion } from '../effects/explosion.js'
import { Weapon } from './weapon.js'

export class Retribution extends Weapon
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("augment_retribution") }
	static getDesc() { return localize("augment_retribution_desc") }
	static damageTags() { return ["tag_explosive"] }
	static nonDamageTags() { return [] }

	constructor()
	{
		super()
        this.isWeapon = false
        this.dmg.base.explosive = 50
        this.base.range = 200
        this.base.critChance = .01
		this.base.critMult = 2
        this.refreshModifiers()
		this.start()
	}
	activate()
	{
        let weapons = [...allWeapons, currentTurret]
        let droneWeapons = weapons.filter(weap => weap.constructor.nonDamageTags().includes("tag_drone"))
        droneWeapons.forEach(weap => {
            for (let i = weap.children.length - 1; i >= 0; i--)
            {
                let child = weap.children[i]
                factory.spawn(Explosion, child.position.x, child.position.y, this, scalePix(this.mod.range))
                child.suspend()
            }
        })
	}
}