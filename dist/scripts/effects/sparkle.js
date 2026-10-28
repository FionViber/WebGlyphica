import { Random, Easing } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { Entity } from '../core/entityFactory.js'

export class Sparkle extends Entity
{
	constructor()
	{
		super()
		this.sineTween = new FastTween()
		this.linearTween = new FastTween(Easing.Linear)
		this.position = Vector.create(0, 0)
		this.moveTween = new FastTween()
	}

	reset(x, y)
	{
		// Setup vars.
		this.position.x = x
		this.position.y = y
		this.rotation = Random.uniform(180, 180)
		this.currentScale = 0.1
		this.maxScale = Random.uniform(5, 2)
		this.on_update()

		// Setup tweens.
		let endPt = Vector.add(this.position, Vector.create(0, scalePix(Random.uniform(-100, 30))))
		this.moveTween.easeOut([this.position.x, this.position.y], [endPt.x, endPt.y], (t) => { this.position.x = t[0]; this.position.y = t[1] }, 30)
		this.sineTween.easeOut([this.currentScale], [this.maxScale], (t)=>{this.currentScale = t[0]}, 5)
			.then(() => {
				this.linearTween.easeOut([this.currentScale], [0.1], (t) => this.currentScale = t[0], 25)
					.then(() => {
						this.suspend()
					})
			})
	}

	on_update()
	{
		this.rotation += 1
	}

	on_render()
	{
		sparkleModel.transform.identity()
		sparkleModel.transform.scale(this.currentScale, this.currentScale)
		sparkleModel.transform.rotate(this.rotation)
		sparkleModel.transform.translate(this.position.x, this.position.y)
		sparkleModel.draw(Surface.Screen)
	}
}