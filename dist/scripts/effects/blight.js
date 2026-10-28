import { Random } from 'sphere-runtime'
import { Entity } from '../core/entityFactory.js'
import { FastTween } from '../core/fastTween.js'

export class BlightEffect extends Entity
{
	constructor()
	{
		super()
		this.bubbles = []
		for (let i = 0; i < 4; i++)
		{
			this.bubbles.push({
				active: false,
				position: {x: 0, y: 0},
				opacity: 1,
				size: scalePix(1),
				opacityTween: new FastTween(),
				moveTween: new FastTween()
			})
		}
	}

	reset(parent, width)
	{
		this.terminate = false
		this.parent = parent
		this.width = width
		this.spawnBubbles()
		this.resume()
	}

	spawnBubbles()
	{
		let bubble = this.bubbles.find(bubble => !bubble.active)
		if (bubble)
		{
			bubble.position.x = Random.uniform(this.parent.getPosition().x, this.width * 1.5)
			bubble.position.y = this.parent.getPosition().y
			bubble.size = Random.discrete(1, this.width * 2/3)
			let endPt = Vector.add(bubble.position, Vector.create(0, -this.width * 5))
			bubble.moveTween.easeIn([bubble.position.x, bubble.position.y], [endPt.x, endPt.y], (t) => { bubble.position.x = t[0]; bubble.position.y = t[1] }, 30)
			bubble.opacityTween.easeIn([1], [0], (t) => {bubble.opacity = t[0]}, 30)
				.then(() => {
					bubble.active = false
					this.checkIfCanSuspend()
				})
			bubble.active = true
		}
		if (this.conditionsMet())
			Sphere.sleep(5).then(() => this.spawnBubbles())
	}

	conditionsMet()
	{
		return !this.terminate && this.parent && this.parent.running
	}

	checkIfCanSuspend()
	{
		if (!this.conditionsMet() && this.bubbles.reduce((total, current) => total + current.active, 0) == 0)
			this.suspend()
	}

	on_render()
	{
		this.bubbles.forEach((bubble, i) => {
			if (bubble.active)
				PrimNative.drawCircle(Surface.Screen, bubble.position.x, bubble.position.y, bubble.size, 2, midGray.fadeTo(bubble.opacity))
		})
	}
}