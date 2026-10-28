import { Random } from 'sphere-runtime'
import { Weapon } from './weapon.js'
import { Explosion } from '../effects/explosion.js'
import { WordComplete } from '../effects/wordComplete.js'

export class Necrobomb extends Weapon
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("item_necrobomb") }
	static getDesc() { return localize("item_necrobomb_desc_v2") }
	static damageTags() { return ["tag_explosive"] }
	static nonDamageTags() { return ["tag_loot"] }

	constructor()
	{
		super()
		this.isWeapon = false

		this.dmg.base.explosive = 70
		this.base.range = 350
		this.base.critChance = 0
		this.base.critMult = 1
		this.refreshModifiers()

		this.pendingExplosions = []
		this.cooldown = 0
		this.start()
	}

	onEnemyDestroyed(target, weapon, isCrit)
	{
		if (isCrit && weapon.allDamageTags.includes("tag_explosive"))
		{
			let explosions = []
			let targetPos = target.getPosition()
			for (let i = 0; i < 7; i++)
			{
				let randomPosition = Vector.add(targetPos, Vector.rotate({x: Random.discrete(0, scalePix(this.mod.range) * .6), y: 0}, Random.uniform(0, Math.PI)))
				explosions.push(randomPosition)
			}
			explosions.sort((a, b) => distanceBetween(targetPos, a) < distanceBetween(targetPos, b) ? 1 : -1)
			this.pendingExplosions.push(explosions)
			factory.spawn(WordComplete, "/", interfaceIconsLarge, darkGray, null, targetPos)
		}
	}

	on_update()
	{
		if (!isPaused() && ++this.cooldown >= 2)
		{
			this.cooldown = 0
			for (let i = 0; i < this.pendingExplosions.length; i++)
			{
				let explosion = this.pendingExplosions[i]
				let pos = explosion.pop()
				factory.spawn(Explosion, pos.x, pos.y, this, Random.uniform(scalePix(this.mod.range) * .3, scalePix(this.mod.range) * .1))
	
				// Remove explosion when empty.
				if (explosion.length == 0)
				{
					this.pendingExplosions[i] = this.pendingExplosions[this.pendingExplosions.length - 1]
					this.pendingExplosions.pop()
				}
			}
		}
	}
}