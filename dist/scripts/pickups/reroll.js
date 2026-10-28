import { Pickup } from './pickup.js'
import { Impact } from '../effects/impact.js'
import { Conviction } from '../data/augmentsList.js'

export class RerollPickup extends Pickup
{
	constructor()
	{
		super()
		this.duration = 420
		this.timer = 600
		this.iconYOffset = pickupIcons.heightOf("8") / 2
		this.iconXOffset = pickupIcons.widthOf("8") / 2
	}

	on_activate()
	{
		// Jester Loot Item.
		if ("item_jester" in serializedLoot)
			allWeapons.find(weap => weap.constructor.name == "Jester").activate()

		// Effects.
		audioHandler.playAudioHook("pickup_reroll")
		factory.spawn(Impact, this.position.x, this.position.y)
		this.showEffect(localize("powerup_reroll", "+1"), false)

		// Increment re-roll.
		incrementReroll()
		
		// Remove pickup.
		this.stop()
	}

	on_render()
	{
		pickupIcons.drawText(
			Surface.Screen,
			this.position.x - this.iconXOffset,
			this.position.y - this.iconYOffset,
			"8",
			midGray
		)
		this.renderWordAndProgress()
	}
}

export const incrementReroll = function()
{
	if (reroll < maxReroll)
	{
		// Increment reroll
		reroll++

		// Check for Conviction.
		if (
			reroll == maxReroll
			&& "augment_conviction" in activeAugments
			&& !powerups.some(powerup => powerup.constructor.name == "Conviction")
		)
			factory.spawn(Conviction, Infinity)
	}
}