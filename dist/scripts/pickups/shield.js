import { Pickup } from "./pickup.js"
import { Impact } from "../effects/impact.js"
import { Resilience } from "../data/lootItems.js"
import { Deliverance } from '../data/augmentsList.js'

export class Shield extends Pickup
{
	constructor()
	{
		// Superclass constructor.
		super()

		// Declare consts.
		this.iconYOffset = pickupIcons.heightOf("7") / 2
		this.iconXOffset = pickupIcons.widthOf("7") / 2
		this.timer = 600
	}

	on_activate()
	{
		// Effects.
		audioHandler.playAudioHook("pickup_shield")
		factory.spawn(Impact, this.position.x, this.position.y)
		this.showEffect("powerup_shield", true)

		// Wisdom loot item.
		if ("item_wisdom" in serializedLoot)
			[...allWeapons, currentTurret]
				.filter(weap => weap.isWeapon)
				.forEach(weap => weap.evolutionAdd(10))
			
		// Resilience loot item.
		if ("item_resilience" in serializedLoot)
		{
			let existingResilience = powerups.find(powerup => powerup.constructor.name == "Resilience")
			if (existingResilience)
			{
				existingResilience.node.currentProgress = existingResilience.node.maxProgress
				existingResilience.trigger()
			}
			else factory.spawn(Resilience, 600)
		}
		
		// Add shields and destroy pickup.
		incrementShield()
		this.stop()
	}

	on_render()
	{
		pickupIcons.drawText(
			Surface.Screen,
			this.position.x - this.iconXOffset,
			this.position.y - this.iconYOffset,
			"7",
			midGray
		)
		this.renderWordAndProgress()
	}
}

export const incrementShield = function()
{
	if (shields < maxShields)
	{
		// Increment Shields.
		shields++

		// Check for Deliverance.
		if (
			shields == maxShields
			&& "augment_deliverance" in activeAugments
			&& !powerups.some(powerup => powerup.constructor.name == "Deliverance")
		)
			factory.spawn(Deliverance, Infinity)
	}
}