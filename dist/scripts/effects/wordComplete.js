import { Easing } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'
import { Entity } from '../core/entityFactory.js'

export class WordComplete extends Entity
{
	constructor()
	{
		super()
		this.tween = new FastTween(Easing.Quadratic)
		this.transform = new Transform()
	}

	reset(word, font, color, target, staticPos = null)
	{
		// If no position data is supplied, abort.
		if (!(target && target.getPosition()) && !staticPos)
		{
			this.suspend()
			return
		}

		// Save attributes.
		this.word = word
		this.font = font
		this.color = color
		this.target = target
		this.staticPos = staticPos

		// Reset vars.
		this.wordHeight = font.height
		this.scale = 1.0
		this.alpha = 1.0
		this.position = this.target ? this.target.getPosition() : this.staticPos
		this.offset = 0

		// Cache oft-used vars.
		this.heightOffset = wordCompleteSurface.height / 2 - this.wordHeight / 2
		this.widthOffset = wordCompleteSurface.width / 2 - this.font.widthOf(this.word) / 2

		// Start tween.
		this.tween.easeIn([this.alpha, this.scale, this.offset], [0, 5, 12], (t) => { this.alpha = t[0]; this.scale = t[1]; this.offset = t[2] }, 20)
			.then(() => this.suspend())

		// Start task.
		this.on_update()
	}

	on_update()
	{
		// Update transform.
		this.transform.identity()
		this.transform.scale(this.scale, this.scale)
		this.position = this.target ? this.target.getPosition() : this.staticPos
		this.transform.translate(
			this.position.x,
			this.position.y - (this.target ? this.target.wordOffset : 0) - this.wordHeight / 2 - this.offset
		)
	}

	on_render()
	{
		wordCompleteSurface.clear()
		this.font.drawText(
			wordCompleteSurface,
			this.widthOffset,
			this.heightOffset,
			this.word,
			this.color.fadeTo(this.alpha)
		)
		wordCompleteShape.draw(Surface.Screen, this.transform)
	}
}