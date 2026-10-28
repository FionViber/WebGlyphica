import { Matter, Random, Easing } from 'sphere-runtime'
import { Turret } from "./turret.js"
import { Impact } from "../effects/impact.js"
import { Entity } from "../core/entityFactory.js"
import { PausableTween } from '../core/fastTween.js'
import { Pickup } from '../pickups/pickup.js'
import { Explosion } from '../effects/explosion.js'

export class SplatterShot extends Turret
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("weapon_splattershot_title") }
	static getDesc() { return localize("weapon_splattershot_desc") }
	static damageTags() { return ["tag_chemical"] }
	static nonDamageTags() { return ["tag_main", "tag_damageOverTime"] }

	constructor()
	{
		super({radius: scalePix(20)})
		this.zoneColorMask = new Color(0, 0, 0, .8)
		
		// Base stats.
		this.dmg.base.chemical = 40
		this.base.critChance = .05
		this.base.critMult = 1.5
		this.base.range = 150
		this.base.duration = 420
		this.base.rateOfFire = 120
		this.refreshModifiers()

		// Main Weapon Visual Rotation
		this.rotation = 0

		// Evolutions.
		this.bubble = null
		this.bubbleCountdown = 0
		this.infestation = null
		this.lava = null
		this.virulence = false

		// Splatter Zones.
		this.splatterZoneCooldown = 0
		this.splatterParticles = []
		this.splatterZones = []
		this.layer1 = new Surface(Surface.Screen.width, Surface.Screen.height)
		this.layer1Shape = textureShape(this.layer1, false)
		this.splatterZoneRenderer = factory.spawn(SplatterZoneRenderer, this)

		// Impact splatter (temp effect splatters that do nothing)
		this.tempSplatters = []
		
		// Start this task.
		this.start()
	}

	on_shutDown()
	{
		this.splatterZoneRenderer.suspend()
		super.on_shutDown()
	}

	spawnBubble()
	{
		// If there are active Splatter Zones.
		if (this.splatterZones.length > 0)
		{
			// Find a good spawn position.
			let spawnPosition = null
			let attempts = 0
			while ((!spawnPosition || !Matter.Bounds.contains(global.activeBounds, spawnPosition)) && attempts < 1000)
			{
				let randomSplatterZone = Random.sample(this.splatterZones)
				spawnPosition = Vector.add(
					Vector.mult(
						Vector.rotate({ x: 1, y: 0 }, Random.uniform(Math.PI, Math.PI)),
						Random.discrete(0, randomSplatterZone.currentSize)),
					randomSplatterZone.position)
				attempts++
			}
			
			// Spawn Bubble.
			factory.spawn(SplatterBubble, spawnPosition.x, spawnPosition.y, this)
		}
	}

	onTrialComplete()
	{
		// Clear all splatters.
		this.splatterZones.forEach(zone => zone.despawn())
	}

	on_update()
	{
		// Skip if paused.
		if (isPaused()) return

		// Visual rotation of main turret at screen center.
		this.rotation += .02

		// Damage over time for Splatter Zones.
		if (++this.splatterZoneCooldown >= 3600 / this.mod.rateOfFire)
		{
			this.splatterZoneCooldown = 0
			hostilesArray.forEach(enemy => {
				if (
					enemy.getType() == type.enemy
					&& Matter.Bounds.overlaps(enemy.body.bounds, screenBounds)
					&& this.isPositionInSplatterZone(enemy.getPosition())
				)
				{
					let damage = Random.uniform(Math.round(this.dmg.mod.all / 5), 1)
					let enemyHealth = enemy.currentHealth
					let result = enemy.getHit(enemy.protection ? 0 : damage, this, null)
					if (enemyHealth - result.damage <= 0)
						audioHandler.playAudioHook("splattershot_zone_kill", getPanFromX(enemy.getPosition().x))
					this.recordDamage(result.damage)
				}
			})
		}

		// Slime Bubble countdown.
		if (this.bubble && --this.bubbleCountdown <= 0)
		{
			this.bubbleCountdown = this.bubble == 2 ? Random.discrete(180, 360) : Random.discrete(225, 450)
			this.spawnBubble()
		}
	}

	fire(target)
	{
		// Spawn bullet.
		super.fire(target)
		factory.spawn(
			ProjSplatterShot,
			screenCenter,
			target.getPosition(),
			this
		)

		// Audio hooks
		audioHandler.playAudioHook("splattershot_fire")
	}

	isPositionInSplatterZone(position)
	{
		return this.splatterZones.some(zone => distanceBetween(position, zone.position) < zone.currentSize)
	}

	spawnSplatterParticle(position, explode = false)
	{
		// Determine parameters.
		let angle = Random.uniform(Math.PI, Math.PI)
		let direction = Vector.create(Math.cos(angle), Math.sin(angle))
		let distance = scalePix(Random.discrete(this.mod.range * .3, this.mod.range))
		let target = Vector.add(Vector.mult(direction, distance), position)
		let factor = distance / scalePix(this.mod.range)
		let time = factor * 25

		// Create particle.
		let particle = {
			position: position,
			size: 1
		}
		this.splatterParticles.push(particle)

		// Create tween.
		new PausableTween()
			.easeOut(
				[position.x, position.y, 1],
				[target.x, target.y, .2],
				t => {
					particle.position.x = t[0]
					particle.position.y = t[1]
					particle.size = t[2]
				},
				time)
			.then(() => {
				this.splatterParticles.splice(this.splatterParticles.indexOf(particle), 1)
				if (!spawner.running) return
				factory.spawn(SplatterZone, particle.position, 1 - factor, this)
				if (explode)
				{
					audioHandler.playAudioHook("splattershot_bubble_splatter", getPanFromX(particle.position.x))
					factory.spawn (
						Explosion,
						particle.position.x,
						particle.position.y,
						this,
						scalePix(Random.discrete(this.mod.range * .5, this.mod.range)) / 2
					)
				}
				else audioHandler.playAudioHook("splattershot_splatter", getPanFromX(particle.position.x))
			})
	}

	spawnTempImpactSplatters(position)
	{
		// Create temp impact splatter.
		let maxDistance = 70
		let unscaledDistance = Math.min(Math.abs(Random.normal(0, maxDistance / 2)), maxDistance)
		let distance = scalePix(unscaledDistance)
		let tempSplatter = {
			position: Vector.add(position, Vector.rotate({x: distance, y: 0}, Random.uniform(Math.PI, Math.PI))),
			currentSize: 0,
			maxSize: scalePix((1 - unscaledDistance / maxDistance) * 10 + Random.discrete(2, 4)),
			opacity: 1
		}
		this.tempSplatters.push(tempSplatter)

		// Create tween.
		let tween = new PausableTween()
		Sphere.sleep(unscaledDistance / 10)
			.then(() => tween.easeOut([0], [tempSplatter.maxSize], t => tempSplatter.currentSize = t[0], 10)
				.then(() => tween.easeIn([1], [0], t => tempSplatter.opacity = t[0], 10)
					.then(() => this.tempSplatters.splice(this.tempSplatters.indexOf(tempSplatter), 1))))
	}

	on_render()
	{
		// Draw main weapon.
		PrimNative.drawFilledCircle(Surface.Screen, screenCenter.x, screenCenter.y, scalePix(13), midGray)
		PrimNative.drawFilledCircle(Surface.Screen, screenCenter.x, screenCenter.y, scalePix(5), paleYellow)
		for (let i = 0; i <= Math.PI * 2; i += Math.PI * .3335)
		{
			let position = Vector.add(Vector.rotate({ x: scalePix(20), y: 0 }, this.rotation + i), screenCenter)
			PrimNative.drawFilledCircle(Surface.Screen, position.x, position.y, scalePix(7), midGray)
		}
		super.on_render()

		// Draw splatter particles.
		this.splatterParticles.forEach(particle => PrimNative.drawFilledCircle(Surface.Screen, particle.position.x, particle.position.y, scalePix(12) * particle.size, midGray))
	}

	getEvolution()
	{	
		return [
			{
				name: "evo_splattershot_bubble",
				desc: localize("evo_splattershot_bubble_desc"),
				descBlock: true,
				icon: "",
				weight: 10,
				requirementsMet: !this.bubble,
				reference: this,
				effect: function(splattershot)
				{
					splattershot.bubble = 1
				}
			},
			{
				name: "evo_splattershot_bubble_2",
				desc: localize("evo_splattershot_bubble_2_desc"),
				descBlock: true,
				icon: "",
				weight: 10,
				requirementsMet: this.bubble == 1,
				reference: this,
				effect: function(splattershot)
				{
					splattershot.bubble = 2
				}
			},
			{
				name: "evo_splattershot_infestation",
				desc: localize("evo_splattershot_infestation_desc", "+5%", "+30%"),
				descBlock: true,
				icon: "",
				weight: 10,
				requirementsMet: !this.infestation,
				reference: this,
				effect: function(splattershot)
				{
					splattershot.infestation = 1
					modifiers.addPercModifier(splattershot, "evo_splattershot_infestation", { statusChance: .05 })
					modifiers.addPercModifier("tag_status", "evo_splattershot_infestation", { damage: .3 })
				}
			},
			{
				name: "evo_splattershot_infestation_2",
				desc: localize("evo_splattershot_infestation_2_desc"),
				descBlock: true,
				icon: "",
				weight: 10,
				requirementsMet: this.infestation == 1,
				reference: this,
				effect: function(splattershot)
				{
					splattershot.infestation = 2
				}
			},
			{
				name: "evo_splattershot_lava",
				desc: localize("evo_splattershot_lava_desc", "-100%", "+40"),
				descBlock: true,
				icon: "",
				weight: 10,
				requirementsMet: !this.lava,
				reference: this,
				effect: function(splattershot)
				{
					splattershot.lava = 1
					modifiers.addAbsModifier(splattershot, "evo_splattershot_lava", { chemical: -40, heat: 40 })
				}
			},
			{
				name: "evo_splattershot_lava_2",
				desc: localize("evo_splattershot_lava_2_desc", "+20"),
				descBlock: true,
				icon: "",
				weight: 10,
				requirementsMet: this.lava == 1,
				reference: this,
				effect: function(splattershot)
				{
					splattershot.lava = 2
					modifiers.addAbsModifier(splattershot, "evo_splattershot_lava_2", { heat: 20 })
				}
			},
			{
				name: "evo_splattershot_virulence",
				desc: localize("evo_splattershot_virulence_desc", "-50%"),
				descBlock: true,
				icon: "",
				weight: 10,
				requirementsMet: !this.virulence,
				reference: this,
				effect: function(splattershot)
				{
					splattershot.virulence = true
					modifiers.addPercModifier(splattershot, "evo_splattershot_virulence", { duration: -.5 })
				}
			}
		]
	}

	getUpgrades()
	{
		return [
			...super.getEvolutionUpgrades(),
			{
				name: "splattershot_upgrade_damage_common",
				desc: localize("splattershot_upgrade_damage_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_splattershot_title",
				weight: 60,
				requirementsMet: true,
				reference: this,
				effect: function(splattershot)
				{
					modifiers.addPercModifier(splattershot, "splattershot_upgrade_damage_common", {damage: .1})
				}
			},
			{
				name: "splattershot_upgrade_damage_uncommon",
				desc: localize("splattershot_upgrade_damage_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_splattershot_title",
				weight: 20,
				requirementsMet: true,
				reference: this,
				effect: function(splattershot)
				{
					modifiers.addPercModifier(splattershot, "splattershot_upgrade_damage_uncommon", {damage: .2})
				}
			},
			{
				name: "splattershot_upgrade_damage_rare",
				desc: localize("splattershot_upgrade_damage_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_splattershot_title",
				weight: 7,
				requirementsMet: true,
				reference: this,
				effect: function(splattershot)
				{
					modifiers.addPercModifier(splattershot, "splattershot_upgrade_damage_rare", {damage: .3})
				}
			},
			{
				name: "splattershot_upgrade_range_common",
				desc: localize("splattershot_upgrade_range_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_splattershot_title",
				weight: 60,
				group: "splattershot_range",
				requirementsMet: true,
				reference: this,
				effect: function(splattershot)
				{
					modifiers.addPercModifier(splattershot, "splattershot_upgrade_range_common", {range: .1})
				}
			},
			{
				name: "splattershot_upgrade_range_uncommon",
				desc: localize("splattershot_upgrade_range_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_splattershot_title",
				weight: 20,
				group: "splattershot_range",
				requirementsMet: true,
				reference: this,
				effect: function(splattershot)
				{
					modifiers.addPercModifier(splattershot, "splattershot_upgrade_range_uncommon", {range: .2})
				}
			},
			{
				name: "splattershot_upgrade_range_rare",
				desc: localize("splattershot_upgrade_range_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_splattershot_title",
				weight: 7,
				group: "splattershot_range",
				requirementsMet: true,
				reference: this,
				effect: function(splattershot)
				{
					modifiers.addPercModifier(splattershot, "splattershot_upgrade_range_rare", {range: .3})
				}
			},
			{
				name: "splattershot_upgrade_duration_common",
				desc: localize("splattershot_upgrade_duration_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_splattershot_title",
				weight: 60,
				group: "splattershot_duration",
				requirementsMet: true,
				reference: this,
				effect: function(splattershot)
				{
					modifiers.addPercModifier(splattershot, "splattershot_upgrade_duration_common", {duration: .1})
				}
			},
			{
				name: "splattershot_upgrade_duration_uncommon",
				desc: localize("splattershot_upgrade_duration_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_splattershot_title",
				weight: 20,
				group: "splattershot_duration",
				requirementsMet: true,
				reference: this,
				effect: function(splattershot)
				{
					modifiers.addPercModifier(splattershot, "splattershot_upgrade_duration_uncommon", {duration: .2})
				}
			},
			{
				name: "splattershot_upgrade_duration_rare",
				desc: localize("splattershot_upgrade_duration_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_splattershot_title",
				weight: 7,
				group: "splattershot_duration",
				requirementsMet: true,
				reference: this,
				effect: function(splattershot)
				{
					modifiers.addPercModifier(splattershot, "splattershot_upgrade_duration_rare", {duration: .3})
				}
			}
		]
	}
}

class SplatterZoneRenderer extends Entity
{
	reset(parent)
	{
		this.parent = parent
	}

	on_renderStart()
	{
		// Draw splatter zones layer 1.
		this.parent.splatterZones.forEach(zone => PrimNative.drawFilledCircle(this.parent.layer1, zone.position.x, zone.position.y, zone.currentSize, midGray))
		this.parent.layer1.blendOp = BlendOp.Subtract
		PrimNative.drawFilledRectangle(this.parent.layer1, 0, 0, Surface.Screen.width, Surface.Screen.height, this.parent.zoneColorMask)
		this.parent.layer1.blendOp = BlendOp.Default
		this.parent.layer1Shape.draw(Surface.Screen, Transform.Identity)

		// Draw temp splatters.
		this.parent.tempSplatters.forEach(temp => PrimNative.drawFilledCircle(Surface.Screen, temp.position.x, temp.position.y, temp.currentSize, midGray.fadeTo(temp.opacity)))
	}
}

class ProjSplatterShot extends Entity
{
	constructor()
	{
		super()
		this.speed = scalePix(12)
		this.trailParticleMaxSize = scalePix(3)
	}

	reset(position, target, parent)
	{
		// Reset vars.
		this.position = position
		this.parent = parent
		this.trailCooldown = 5

		// Particles.
		this.particles = []

		// Calculate velocity.
		let direction = Vector.normalise(Vector.sub(target, position))
		this.velocity = Vector.mult(direction, this.speed)
	}

	on_update()
	{
		// Skip update if paused.
		if (isPaused()) return
		
		// If out of screen, destroy.
		if (!Matter.Bounds.contains(screenBounds, this.position))
			this.suspend()

		// Detect collisions.
		let nextPosition = Vector.add(this.position, this.velocity)
		let collisions = Matter.Query.ray(hostileBodies, this.position, nextPosition)
		if (collisions.length > 0)
		{
			let collision = collisions[0]
			let other = hostiles.get(collision.bodyA.id)
			let colPt = collisionPoint(this.position, nextPosition, collision.bodyA)

			// Make sure enemy is still valid.
			if (other)
			{
				// Handle damage.
				let damage = Random.uniform(this.parent.dmg.mod.all, 5)
				let result = other.getHit(damage, this.parent, colPt)
				this.parent.recordDamage(result.damage)

				// VFX.
				let randomPositionX = Random.uniform(colPt.x, scalePix(5))
				let randomPositionY = Random.uniform(colPt.y, scalePix(5))
				factory.spawn(Impact, randomPositionX, randomPositionY)
				for (let i = 0; i < 10; i++)
				{
					this.parent.spawnTempImpactSplatters({ x: this.position.x, y: this.position.y })
					this.parent.spawnSplatterParticle({ x: this.position.x, y: this.position.y })
				}

				// SFX.
				audioHandler.playAudioHook(result.isCrit ? `splattershot_hit_crit` : `splattershot_hit_normal`, getPanFromX(colPt.x))

				// Destroy projectile.
				this.suspend()
			}
		}

		// Spawn trail.
		this.particles.push({
			position: {
				x: Random.uniform(this.position.x, scalePix(5)),
				y: Random.uniform(this.position.y, scalePix(5))
			},
			size: scalePix(Random.uniform(3, 3)),
			opacity: .3
		})

		// Update trail particles.
		for (let i = 0; i < this.particles.length; i++)
		{
			let particle = this.particles[i]
			if (particle.opacity > 0)
				particle.opacity -= .01
			else
			{
				this.particles.splice(i, 1)
				i--
			}
		}

		// Move.
		this.position = nextPosition
	}

	on_render()
	{
		PrimNative.drawFilledCircle(Surface.Screen, this.position.x, this.position.y, 6, darkGray)
		this.particles.forEach(particle => {
			PrimNative.drawFilledCircle(
				Surface.Screen,
				particle.position.x,
				particle.position.y,
				particle.size,
				midGray.fadeTo(particle.opacity)
			)
		})
	}
}

class SplatterZone extends Entity
{
	constructor()
	{
		super()
		this.tween = new PausableTween(Easing.Linear)
	}

	reset(position, scale, parent)
	{
		this.position = position
		this.progress = 0
		this.despawned = false
		this.currentSize = 0
		this.parent = parent
		this.splatterZoneLoop = null
		this.maxSize = scalePix(parent.mod.range * .6 * scale + parent.mod.range * .15)

		// Add Splatter Zone to collection.
		parent.splatterZones.push(this)

		// Start spawn tween.
		this.tween.easeOut([0], [this.maxSize], t => this.currentSize = t[0], 20)
	}

	on_update()
	{
		if (isPaused()) return

		// Increase zone size if Virulence evolution.
		if (this.parent.virulence)
			this.currentSize += scalePix(.2)

		// Progress duration.
		if (!this.despawned
			&& this.currentSize >= this.maxSize
			&& ++this.progress >= this.parent.mod.duration
		)
			this.despawn()
		
		// Play/stop audio loop.
		if (hostilesArray.some(enemy =>
			enemy.getType() == type.enemy &&
			distanceBetween(enemy.getPosition(), this.position) < this.currentSize
		))
			this.audioStart()
		else
			this.audioStop()
	}

	audioStart()
	{
		if (this.splatterZoneLoop) return
		audioHandler.playAudioHook("splattershot_zone_start", getPanFromX(this.position.x))
		this.splatterZoneLoop = audioHandler.playAudioHook("splattershot_zone_loop", getPanFromX(this.position.x), true)
		
	}

	audioStop()
	{
		if (!this.splatterZoneLoop) return
		this.splatterZoneLoop.stop()
		this.splatterZoneLoop = null
	}

	despawn()
	{
		this.despawned = true
		this.tween.easeIn([this.currentSize], [0], t => this.currentSize = t[0], 20)
			.then(() => {
				this.parent.splatterZones.splice(this.parent.splatterZones.indexOf(this), 1)
				this.audioStop()
				this.suspend()
			})
	}

	on_shutDown()
	{
		this.audioStop()
	}
}

class SplatterBubble extends Pickup
{
	constructor()
	{
		super()
		this.progressOffset = 30
		this.wordOffset = scalePix(40)
		this.iconYOffset = pickupIcons.heightOf("4") / 2
		this.iconXOffset = pickupIcons.widthOf("4") / 2
	}

	reset(x, y, parent)
	{
		super.reset(x, y, false)
		this.parent = parent
		this.setTimer(Infinity)
		audioHandler.playAudioHook("splattershot_bubble_spawn", getPanFromX(this.position.x))
	}

	activate()
	{
		audioHandler.playAudioHook("splattershot_bubble_burst", getPanFromX(this.position.x))
		for (let i = 0; i < 10; i++)
		{
			this.parent.spawnTempImpactSplatters({ x: this.position.x, y: this.position.y })
			this.parent.spawnSplatterParticle({ x: this.position.x, y: this.position.y }, true)
		}
		this.stop()
	}

	on_update()
	{
		super.on_update()
		if (!this.parent.splatterZones.some(zone => distanceBetween(zone.position, this.position) <= zone.currentSize))
		{
			if (this.parent.bubble == 2 && Random.chance(.5)) this.activate()
			else this.stop()
		}
	}

	on_render()
	{
		pickupIcons.drawText(
			Surface.Screen,
			this.position.x - this.iconXOffset,
			this.position.y - this.iconYOffset,
			"4",
			midGray
		)
		this.renderWordAndProgress(true)
	}
}