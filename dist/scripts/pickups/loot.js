import { Random } from 'sphere-runtime'
import { Pickup } from './pickup.js'
import { Damage } from '../effects/damage.js'
import { LootItems } from '../data/lootItems.js'

export class Loot extends Pickup
{
	constructor()
	{
		// Superclass constructor.
		super()

		// Declare consts.
		this.iconYOffset = pickupIcons.heightOf("3") / 2
		this.iconXOffset = pickupIcons.widthOf("3") / 2
		this.timer = 600
	}

	reset(x, y)
	{
		super.reset(x, y)
		this.spawnSparkle()
	}

	on_activate()
	{
		// Print effect.
		factory.spawn(Damage, this.position.x, this.position.y, localize("loot_pickup"), false, true, true)
		
		// Auto-select loot if autoLoot.
		if (!isOozaru && autoLoot)
		{
			let loot = Random.sample(ui.generateLoot(false))
			serializedLoot[loot.name] = serializedLoot[loot.name] || 0
			serializedLoot[loot.name]++
			console.log("Claim loot " + loot.name)
			loot.action()
		}
		else ui.showLootUI()

		this.stop()
	}

	on_render()
	{
		pickupIcons.drawText(
			Surface.Screen,
			this.position.x - this.iconXOffset,
			this.position.y - this.iconYOffset,
			"3",
			midGray
		)
		this.renderWordAndProgress()
	}
}