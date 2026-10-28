import { Matter, Random } from 'sphere-runtime'
import { Enemy } from './enemy.js'
import { calcRandomInboundsDistance } from './enemyMovement.js'
import { Armor } from './armor.js'

// NOTE: Warder should have tank armor
export class Warder extends Enemy
{
	static getName() { return localize("enemy_warder_title") }
	static getDesc() { return localize("enemy_warder_desc") }
	static isElite() { return true }

	constructor()
	{
		// Superclass constructor.
		super(scalePix(10))

		// Define consts.
		this.isElite = true
		this.armorRadius = scalePix(25)
		this.experience = 30
		this.healthbarOffset = scalePix(40)
		this.wordOffset = scalePix(50)
		this.speed = scalePix(1)
		this.range = scalePix(300)
		this.protected = []
	}

	reset(threat)
	{
		// Call superclass reset.
		super.reset(threat)

		// Reset vars.
		this.setHealth(300)
		this.cooldown = Random.discrete(250, 450)
		this.currentCooldown = Random.discrete(300, 540)

		// First destination.
		let direction = Vector.normalise(Vector.sub(this.body.position, screenCenter))
		this.destination = calcRandomInboundsDistance(direction, 500, 750)
		this.velocity = Vector.mult(direction, -1 * this.speed)

		// Set rotation
		this.rotation = Math.atan2(direction.y, direction.x) / Math.PI * 180

		// Spawn armor.
		this.children.push(factory.spawn(WarderRotatingShield, this))
	}

	update()
	{
		// Movement.
		if (!isEqual(this.body.position, this.destination))
		{
			if (distanceBetween(this.body.position, this.destination) > this.speed)
				Matter.Body.setPosition(this.body, Vector.add(this.body.position, this.velocity))
			else
				Matter.Body.setPosition(this.body, this.destination)
		}

		// Update rotation.
		this.rotation += 1

		// If on screen.
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds))
		{
			// Check which enemies are in range for protection.
			let enemiesInRange = hostilesArray
				.filter(v => v.getType() == type.enemy)
				.filter(v => !(v instanceof Warder))
				.filter(v => Matter.Bounds.overlaps(v.body.bounds, screenBounds))
				.filter(v => distanceBetween(v.getPosition(), this.body.position) < this.range)
			for (const enemy of enemiesInRange)
			{
				if (enemy.protection == null)
					enemy.setProtected(true)
			}

			// If any enemies left the protection.
			let unprotected = this.protected.filter(x => !enemiesInRange.includes(x))
			if (unprotected.length > 0)
				this.unprotect(unprotected)
			this.protected = enemiesInRange
		}
	}

	cease(clearWord = true)
	{
		this.unprotect(this.protected)
		this.protected = []
		super.cease(clearWord)
	}

	unprotect(array)
	{
		// Get list of all warders.
		let allProtected = []
		let allWarders = hostilesArray
			.filter(v => v instanceof Warder)
			.filter(v => v != this)
		
		// If there's more than one warder.
		if (allWarders.length > 0)
		{
			// Get a list of all protected.
			for (const warder of allWarders)
				allProtected = allProtected.concat(warder.protected)
			
			// Remove duplicates.
			allProtected = [...new Set(allProtected)]

			// Filter.
			array = array.filter(v => !allProtected.includes(v))
		}

		// Unprotect.
		for (const enemy of array)
			enemy.setProtected(false)
	}

	on_render()
	{
		if (Matter.Bounds.overlaps(this.body.bounds, screenBounds)) {
			this.renderWordAndHealth()
			if (this.active)
			{
				// Draw model.
				warderModel.transform.identity()
				warderModel.transform.rotate(this.rotation)
				warderModel.transform.translate(this.body.position.x, this.body.position.y)
				warderModel.draw(Surface.Screen)

				// Draw protection.
				for (const protectee of this.protected)
				{
					let normalizedDirectionToWarder = Vector.normalise(Vector.sub(this.body.position, protectee.getPosition()))
					let endPointForLine = Vector.add(Vector.mult(normalizedDirectionToWarder, scalePix(40)), protectee.getPosition())
					PrimNative.drawLine(
						Surface.Screen,
						this.body.position.x,
						this.body.position.y,
						endPointForLine.x,
						endPointForLine.y,
						scalePix(2),
						midGray.fadeTo(0.3)
					)
				}
			}
		}
	}
}

class WarderRotatingShield extends Armor
{
	constructor()
	{
		super()
		this.rotation = 0
		this.armorArcAngle = currentDifficulty < 2 ? Math.PI * .65 : Math.PI / 2

		// Create shape for collider.
		let segments = 6
		let segmentAngle = this.armorArcAngle / segments
		let vector = Vector.rotate(Vector.create(scalePix(40), 0), -segmentAngle * segments / 2)
		let pts = [Vector.mult(vector, .8)]
		for (let i = 0; i <= segments; i++)
		{
			pts.push(vector)
			if (i < segments)
				vector = Vector.rotate(vector, segmentAngle)
		}
		pts.push(Vector.mult(vector, .8))

		// Create collider.
		this.body = polyCollider(pts, {category: hostile})
		let offset = Matter.Vector.sub(this.body.bounds.min, Matter.Bounds.create(pts).min)
		Matter.Body.setCentre(this.body, offset, true)
	}

	on_update()
	{
		if (!isPaused() && !powerup_freeze)
		{
			this.rotation += 0.01
			Matter.Body.setAngle(this.body, this.rotation)
			Matter.Body.setPosition(this.body, this.parent.body.position)
		}
	}

	on_render()
	{
		let pos = this.parent.body.position
		let arcStart = this.rotation - this.armorArcAngle / 2
		let arcSize = this.armorArcAngle
		PrimNative.drawArc(Surface.Screen, pos.x, pos.y, scalePix(39), arcStart, arcSize, scalePix(5), midGray)
	}
}