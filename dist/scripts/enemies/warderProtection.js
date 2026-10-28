import { Matter } from 'sphere-runtime'
import { Armor } from './armor.js'

export class WarderProtection extends Armor
{
	constructor()
	{
		super()
		this.body = circleCollider(scalePix(40), {category: hostile})
	}

	on_update()
	{
		Matter.Body.setPosition(this.body, this.parent.getPosition())
	}

	on_render()
	{
		PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, scalePix(40), scalePix(2), midGray.fadeTo(0.3))
	}
}