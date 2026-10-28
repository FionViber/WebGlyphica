import { Random } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { Entity } from '../core/entityFactory.js'

export class ChargeUpLines extends Entity
{
	constructor()
	{
		super()
		this.tween = new FastTween()
	}

	reset(position)
	{
		this.points = []
		for (let i = 0; i < 10; i++)
			Random.chance(.5) ?
				this.points.push({
					x: Random.chance(.5) ?
						Random.discrete(scalePix(-1000), 0) :
						Random.discrete(Surface.Screen.width, Surface.Screen.width + scalePix(500)),
					y: Random.discrete(0, Surface.Screen.height)
				}) :
				this.points.push({
					x: Random.discrete(0, Surface.Screen.width),
					y: Random.chance(.5) ?
						Random.discrete(scalePix(-1000), 0) :
						Random.discrete(Surface.Screen.height, Surface.Screen.height + scalePix(500))
				})
		this.position = position
		this.lerp = 1
		this.tween.easeIn([this.lerp], [0], (t) => this.lerp = t[0], 40)
			.then(() => this.suspend())
	}

	on_render()
	{
		this.points.forEach((pt) => {
			let vector = Vector.sub(pt, this.position)
			let direction = Vector.normalise(vector)
			let magnitiude = Vector.magnitude(vector)
			let startPt = Vector.add(Vector.mult(direction, this.lerp * magnitiude), this.position)
			chargeUpLinesShape.draw(
				Surface.Screen,
				Transform
					.rotate(Math.atan2(vector.y, vector.x) / Math.PI * 180)
					.scale(this.lerp * 5000, this.lerp * 5000)
					.translate(startPt.x, startPt.y)
			)
		})
	}
}