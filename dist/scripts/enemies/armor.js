import { Matter, Random } from 'sphere-runtime'
import { Entity } from '../core/entityFactory.js'
import { Damage } from '../effects/damage.js'

export class Armor extends Entity
{
	reset(parent)
	{
		this.parent = parent
		if (this.body)
		{
			Matter.World.add(physics.world, this.body)
			addHostile(this)
		}
	}

	on_shutDown()
	{
		this.parent = null
		if (this.body)
		{
			Matter.World.remove(physics.world, this.body)
			removeHostile(this)
		}
	}

	getHit(damage, weapon = null, col = null)
	{
		// Invulnerable.
		if (col) factory.spawn(Damage, Random.uniform(col.x, scalePix(20)), Random.uniform(col.y, scalePix(20)), 0)
		return { damage: 0, isCrit: false }
	}

	getPosition() { return this.parent.getPosition() }
	getType() { return type.armor }
}