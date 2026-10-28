import { Powerup } from '../core/powerup.js'
import { Pickup } from './pickup.js'
import { Impact } from '../effects/impact.js'

export function triggerDoubleDamage()
{
	let existingDoubleDamage = powerups.find((powerup) => powerup.constructor.name == "DoubleDamage")
	if (existingDoubleDamage)
		existingDoubleDamage.node.currentProgress = existingDoubleDamage.node.maxProgress
	else
		factory.spawn(DoubleDamage, 420 * (1 + doubleDamageDurationBonus))
}

export class DoubleDamagePickup extends Pickup
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
		// Make a record that player has used 2x damage before.
		if (!("hasUsed2xDamage" in save))
			save.hasUsed2xDamage = true

		// Effect.
		factory.spawn(Impact, this.position.x, this.position.y)
		this.showEffect("item_tripleDamage" in serializedLoot ? "item_tripleDamage" : "powerup_double_damage", true)

		// Trigger double damage and destroy self.
		triggerDoubleDamage()
		this.stop()
	}

	on_render()
	{
		pickupIcons.drawText(
			Surface.Screen,
			this.position.x - this.iconXOffset,
			this.position.y - this.iconYOffset,
			"item_tripleDamage" in serializedLoot ? "9" : "5",
			midGray
		)
		this.renderWordAndProgress()
	}
}

class DoubleDamage extends Powerup
{
	constructor() { super("powerup_double_damage") }
	on_init()
	{
		audioHandler.playAudioHookBGM("double_damage_start")
		this.node.setText(localize("item_tripleDamage" in serializedLoot ? "item_tripleDamage" : "powerup_double_damage"))
		bgm.fadeTo(bgm.getMusicInSet("doubleDamage"))
		Sphere.sleep(1).then(() => [...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers()))
	}

	transformToTripleDamage()
	{
		this.node.setText(localize("item_tripleDamage"))
	}

	on_expire(forced)
	{
		if (!forced)
		{
			audioHandler.playAudioHookBGM("double_damage_stop")
			bgm.resume()
		}
		[...allWeapons, currentTurret].forEach((weap) => weap.refreshModifiers())
	}
}