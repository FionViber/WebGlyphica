import { Random } from 'sphere-runtime'
import { Pickup } from "./pickup.js"
import { Impact } from "../effects/impact.js"
import { Sparkle } from "../effects/sparkle.js"

export class Coins extends Pickup
{
	constructor()
	{
		// Superclass constructor.
		super()

		// Declare consts.
		this.iconYOffset = pickupIcons.heightOf("0") / 2
		this.iconXOffset = pickupIcons.widthOf("0") / 2
		this.timer = 600
	}

	reset(x, y)
	{
		super.reset(x, y)
		let timeFactor = spawner.getTimeFactor(spawner.currentFrame)
		this.addCoins = Math.round (
			.11 * Math.pow(timeFactor + 5000, .4)
			* missionTier 
			* (1 + Math.max(omenLevel, 0) * .3)
		) + Random.discrete(1, 5)
		this.spawnSparkle()
	}

	on_expire(forced)
	{
		if (!forced)
			pickupController.coinCooldown = 600
	}

	on_activate()
	{
		audioHandler.playAudioHook("pickup_coins")
		factory.spawn(Impact, this.position.x, this.position.y)
		this.showEffect(`${this.addCoins} §`, false)
		
		for (let i = 0; i < 5; i++)
			factory.spawn(Sparkle, Random.uniform(this.position.x, 10), Random.uniform(this.position.y, 10), false)

		save.coins += this.addCoins
		save.coinsTotal += this.addCoins
		coinsEarned += this.addCoins

		pickupController.coinCooldown = 3600

		this.stop()
	}

	on_render()
	{
		pickupIcons.drawText(
			Surface.Screen,
			this.position.x - this.iconXOffset,
			this.position.y - this.iconYOffset,
			"2",
			midGray
		)
		this.renderWordAndProgress()
	}
}