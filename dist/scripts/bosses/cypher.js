import { Random, Matter } from 'sphere-runtime'
import { Enemy } from '../enemies/enemy.js'

export class Cypher extends Enemy
{
	static getName() { return localize("boss_cypher") }
	static getDesc() { return localize("boss_cypher_desc") }
	static getBGM() { return bgm.fadeTo(bgm.getMusicInSet("boss_cipher")) }

	constructor(size = 25)
	{
		// Superclass constructor.
		super(scalePix(size))

		// Define consts.
		this.experience = 0
		this.alwaysShowHealth = true
		this.speed = scalePix(5)
	}

	reset()
	{
		// Superclass reset.
		super.reset()
		
		// Set boss to self.
		boss = this
		this.setHealth(Math.max(5000, Math.ceil((totalDamage * 150000) / timeElapsed)))
		this.threshold = this.health / 6
		this.currentThreshold = 6
		this.range = scalePix(370)
		this.targetPosition = Vector.add(screenCenter, Vector.mult(Vector.normalise(Vector.sub(this.body.position, screenCenter)), scalePix(Random.discrete(500, 600))))
	}

	update()
	{
		if (!isPaused())
		{
			if (Math.ceil(this.currentHealth / this.threshold) < this.currentThreshold)
			{
				this.currentThreshold--
				let dist = scalePix(Random.discrete(400, 600))
				let angle = -Math.PI / 4 + Random.uniform(Math.PI / 4, Math.PI / 4)
				this.targetPosition = Vector.rotate(Vector.create(dist, 0), angle)
				if (Math.sign(this.targetPosition.x) == Math.sign(this.body.position.x - screenCenter.x))
					this.targetPosition.x *= -1
				this.targetPosition = Vector.add(screenCenter, this.targetPosition)
			}

			this.velocity = {x: 0, y: 0}
			if (this.targetPosition != null)
			{
				if (distanceBetween(this.body.position, this.targetPosition) <= this.speed)
				{
					Matter.Body.setPosition(this.body, this.targetPosition)
					this.targetPosition = null
				}
				else
				{
					let direction = Vector.normalise(Vector.sub(this.targetPosition, this.body.position))
					this.velocity = Vector.mult(direction, this.speed)
					Matter.Body.setPosition(this.body, Vector.add(this.body.position, this.velocity))
				}
			}

			hostilesArray.forEach(hostile => {
				if (
					hostile.getType() == type.enemy &&
					Matter.Bounds.overlaps(hostile.body.bounds, screenBounds) &&
					distanceBetween(hostile.getPosition(), this.body.position) < this.range &&
					!hostile.cyphered
				)
				{
					hostile.cyphered = true
					if (hostile.word)
						hostile.updateWordDisplay(2)
				}
			})

			splitters.forEach(splitter => {
				if (
					distanceBetween(splitter.getPosition(), this.body.position) < this.range &&
					!splitter.cyphered
				)
				{
					splitter.cyphered = true
					splitter.updateWordDisplay(2)
				}
			})

			currentPickups.forEach(pickup => {
				if (
					distanceBetween(pickup.position, this.body.position) < this.range &&
					!pickup.cyphered
				)
					pickup.cyphered = true
					pickup.updateWordDisplay(2)
			})
		}
	}

	on_render()
	{
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds)) {
			if (this.active)
			{
				for (let i = 0; i < 10; i++)
				{
					let randomChar = Random.sample("abcdefghijklmnopqrstuvwxyz")
					let randomDistance = Random.normal(0, scalePix(15))
					let randomPos = Vector.add(this.body.position, Vector.rotate({x: randomDistance, y: 0}, Random.uniform(Math.PI, Math.PI)))
					typingFontLarge.drawText (
						Surface.Screen,
						randomPos.x - typingFontLarge.widthOf(randomChar) / 2,
						randomPos.y - typingFontLarge.height / 2,
						randomChar,
						secondColor
					)
				}
			}
			this.renderWordAndHealth(false, 3)
		}
		PrimNative.drawCircle(Surface.Screen, this.body.position.x, this.body.position.y, this.range, scalePix(1), midGray.fadeTo(.5))
	}

	destroy()
	{
		super.destroy()
		bgm.resume()
		if (!("defeatedCypher" in save)) save["defeatedCypher"] = true
		missionComplete()
	}

	cease(clearWord = true)
	{
		super.cease(clearWord)
		boss = null
	}
}