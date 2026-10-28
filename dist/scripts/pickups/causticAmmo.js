import { Powerup } from '../core/powerup.js'
import { Pickup } from './pickup.js'
import { Impact } from '../effects/impact.js'

export class CausticAmmoPickup extends Pickup
{
	constructor()
	{
		super()
		this.timer = 600
		this.iconYOffset = pickupIcons.heightOf("5") / 2
		this.iconXOffset = pickupIcons.widthOf("5") / 2
	}

	on_activate()
	{
		// Effect.
		factory.spawn(Impact, this.position.x, this.position.y)
		this.showEffect("augment_causticAmmo", true)

		// Trigger caustic ammo and destroy self.
		this.triggerCausticAmmo()
		this.stop()
	}

	triggerCausticAmmo()
	{
		let existingCausticAmmo = powerups.find((powerup) => powerup.constructor.name == "CausticAmmo")
		if (existingCausticAmmo)
			existingCausticAmmo.node.currentProgress = existingCausticAmmo.node.maxProgress
		else
			factory.spawn(CausticAmmo, 420)
	}

	on_render()
	{
		pickupIcons.drawText(
			Surface.Screen,
			this.position.x - this.iconXOffset,
			this.position.y - this.iconYOffset,
			"<",
			midGray
		)
		this.renderWordAndProgress()
	}
}

class CausticAmmo extends Powerup
{
	constructor() { super("augment_causticAmmo") }
	on_init()
	{
		modifiers.editAbsModifier("tag_remote", "augment_causticAmmo", { chemical: 10 })
		Sphere.sleep(1).then(() => [...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers()))
	}
	on_expire(forced)
	{
		modifiers.editAbsModifier("tag_remote", "augment_causticAmmo", { chemical: 0 });
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
}