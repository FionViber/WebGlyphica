import { Pickup } from "./pickup.js"
import { Impact } from "../effects/impact.js"
import { Sparkle } from "../effects/sparkle.js"

export class Health extends Pickup
{
	constructor()
	{
		// Superclass constructor.
		super()

		// Declare consts.
		this.addHealth = 100
		this.iconYOffset = pickupIcons.heightOf("0") / 2
		this.iconXOffset = pickupIcons.widthOf("0") / 2
		this.timer = 600
	}

	on_activate()
	{
		audioHandler.playAudioHook("pickup_health")
		factory.spawn(Impact, this.position.x, this.position.y)
		this.showEffect(`${this.addHealth} ${localize("health")}`, false)
		for (let i = 0; i < 10; i++)
			factory.spawn(Sparkle, this.position.x, this.position.y, false)
		currentTurret.addHealth(this.addHealth)
		this.stop()
	}

	on_render()
	{
		pickupIcons.drawText(
			Surface.Screen,
			this.position.x - this.iconXOffset,
			this.position.y - this.iconYOffset,
			"0",
			midGray
		)
		this.renderWordAndProgress()
	}
}