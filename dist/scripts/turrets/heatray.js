import { Easing, Matter, Random } from 'sphere-runtime'
import { Entity } from '../core/entityFactory.js'
import { Impact } from '../effects/impact.js'
import { Sparks } from '../effects/sparks.js'
import { FastTween } from '../core/fastTween.js'
import { Turret } from './turret.js'

export class HeatRay extends Turret
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("weapon_heatray_title") }
	static getDesc() { return localize("weapon_heatray_desc") }
	static damageTags() { return ["tag_heat"] }
	static nonDamageTags() { return ["tag_main", "tag_damageOverTime"] }
	
	constructor()
	{
		super({radius: scalePix(20)})

		// Visuals.
		this.rotation = 0
		this.pulseMult = .6
		this.pulseTween = new FastTween()
		this.pulse()

		// Targeting vars.
		this.target = {x: screenCenter.x, y: 0}
		this.newTarget = null

		// Enemy hit positions.
		this.allHitPos = []
		this.hitPositions1 = []
		this.hitPositions2 = []
		this.reflectPts1 = []
		this.reflectPts2 = []

		// Blaster Evolution hit positions.
		this.entitiesHitBlaster = []
		this.hitPositionsBlaster = []
		this.reflectPtsBlaster = []

		// Sparks.
		this.sparks = []
		this.sparkCountdown = 0
		for (let i = 0; i < 5; i++)
			this.sparks.push({
				active: false,
				position: null,
				velocity: null,
				size: 0,
				sizeTween: new FastTween(),
			})

		// Cooldowns.
		this.hitEffectCooldown = 0

		// Evolutions.
		this.doubleBladed = false
		this.penetrateTargets = false
		this.rayBounce = 0
		this.blaster = false
		this.blasterProjLength = 300

		// Beam renderer.
		this.beamRenderer = factory.spawn(BeamRenderer, this)
		this.beamHitLoop = null

		// Base stats.
		this.dmg.base.heat = 15
		this.base.rateOfFire = 120
		this.base.critChance = .05
		this.base.range = 6
		this.base.speed = Math.PI / 60
		this.base.critMult = 1.5
		this.refreshModifiers()

		this.start()
	}

	suspend()
	{
		this.beamRenderer.suspend()
		this.audioStop()
		super.suspend()
	}

	audioStart()
	{
		if (this.beamHitLoop == null)
			this.beamHitLoop = audioHandler.playAudioHook("heatray_damage", 0, true)
	}

	audioStop()
	{
		if (this.beamHitLoop != null)
		{
			this.beamHitLoop.stop()
			this.beamHitLoop = null
		}
	}

	pulse()
	{
		this.pulseTween.easeInOut([.6], [1], t => this.pulseMult = t[0], 30)
			.then(() => this.pulseTween.easeInOut([1], [.6], t => this.pulseMult = t[0], 30)
				.then(() => {
					if (this.running)
						this.pulse()
				})
			)
	}

	emitSpark()
	{
		let newSpark = this.sparks.find(spark => !spark.active)
		if (newSpark)
		{
			let targetDirection = Vector.sub(this.target, screenCenter)
			let angle = Math.atan2(targetDirection.y, targetDirection.x)
			let sparkAngle = Random.normal(angle, Math.PI / 6)
			newSpark.active = true
			newSpark.position = { x: screenCenter.x, y: screenCenter.y }
			newSpark.velocity = Vector.mult({ x: Math.cos(sparkAngle), y: Math.sin(sparkAngle) }, scalePix(Random.discrete(1, 2)))
			newSpark.size = 0
			newSpark.sizeTween.easeIn([0], [scalePix(Random.discrete(5, 10))], t => newSpark.size = t[0], 20)
				.then(() => {
					newSpark.sizeTween.easeIn([newSpark.size], [0], t => newSpark.size = t[0], 20)
						.then(() => newSpark.active = false)
				})
		}
	}

	on_update()
	{
		// Skip if paused.
		if (isPaused()) return

		// Rotate turret shapes.
		this.rotation += 2

		// Animate sparks.
		this.sparks.forEach(spark => {
			if (spark.active)
				spark.position = Vector.add(spark.position, spark.velocity)
		})
		if (--this.sparkCountdown <= 0)
		{
			this.sparkCountdown = Random.discrete(5, 10)
			this.emitSpark()
		}

		// If not in Blaster mode, calculate beams.
		let reflectPts, entitiesHit
		if (!this.blaster)
		{
			// Rotate Heat Ray.
			if (this.newTarget)
			{
				let currentDirection = Vector.sub(this.target, screenCenter)
				let desiredDirection = Vector.sub(this.newTarget, screenCenter)
				let currentAngle = Math.atan2(currentDirection.y, currentDirection.x)
				let desiredAngle = Math.atan2(desiredDirection.y, desiredDirection.x)
				let angleDifference = diff(currentAngle, desiredAngle)
				if (Math.abs(angleDifference) > this.mod.speed / 2)
				{
					let rotatedVector = Vector.add(Vector.rotate(currentDirection, Math.sign(angleDifference) * this.mod.speed), screenCenter)
					this.target = this.getScreenEdgeCoords(rotatedVector.x, rotatedVector.y)
				}
				else
				{
					this.target = this.getScreenEdgeCoords(this.newTarget.x, this.newTarget.y)
					this.newTarget = null
				}
			}

			// Detect collisions along beam path and reflections.
			let col = this.detectEnemiesHit(this.target)
			entitiesHit = col.hitEntities
			this.hitPositions1 = col.hitPositions
			this.reflectPts1 = col.bouncePositions

			// If doubleBladed, do it again.
			if (this.doubleBladed)
			{
				col = this.detectEnemiesHit(Vector.add(Vector.sub(screenCenter, this.target), screenCenter))
				entitiesHit = entitiesHit.concat(col.hitEntities)
				this.hitPositions2 = col.hitPositions
				this.reflectPts2 = col.bouncePositions
			}

			// Consolidate hit and reflect positions.
			this.allHitPos = [...this.hitPositions1, ...this.hitPositions2]
			reflectPts = [...this.reflectPts1, ...this.reflectPts2]
		}

		// Else, if Blaster mode.
		else
		{
			entitiesHit = this.entitiesHitBlaster
			reflectPts = this.reflectPtsBlaster
			this.allHitPos = this.hitPositionsBlaster
			this.entitiesHitBlaster = []
			this.reflectPtsBlaster = []
			this.hitPositionsBlaster = []
		}

		// Manage cooldowns.
		if (--this.hitEffectCooldown < 0) this.hitEffectCooldown = 3

		// Spawn Heat Ray Effect at each bounce pt.
		if (this.hitEffectCooldown == 0)
		{
			reflectPts.forEach(pt => {
				factory.spawn(
					HeatRayHitEffect,
					Random.uniform(scalePix(this.mod.range) * 1.5, 5),
					{x: Random.uniform(pt.x, scalePix(5)), y: Random.uniform(pt.y, scalePix(5))},
					{x: 0, y: 0}
				)
				let reverseDirection = Vector.sub(screenCenter, pt)
				let angle = Math.atan2(reverseDirection.y, reverseDirection.x)
				let sparkAngle = Random.normal(angle, Math.PI / 5)
				factory.spawn(
					HeatRayGlobEffect,
					scalePix(Random.uniform(4, 1)),
					{x: Random.uniform(pt.x, scalePix(5)), y: Random.uniform(pt.y, scalePix(5))},
					Vector.mult({ x: Math.cos(sparkAngle), y: Math.sin(sparkAngle) }, scalePix(Random.discrete(2, 4)))
				)
			})
		}

		// Deal with hit enemies.
		if (entitiesHit.length > 0)
		{
			entitiesHit.forEach((hitEntity, index) => {
				let hitPosition = this.allHitPos[index] || hitEntity.getPosition()

				// Deal damage.
				if ("heatRayCooldown" in hitEntity && hitEntity.heatRayCooldown <= 0)
				{
					let damage = Random.uniform(this.dmg.mod.all * (1 + .5 * hitEntity.heatRayStacks), 5)
					let result = hitEntity.getHit(damage, this, hitPosition)
					hitEntity.heatRayCooldown = 3600 / this.mod.rateOfFire
					hitEntity.heatRayStacks++
					this.recordDamage(result.damage)

					// SFX
					this.audioStart()

					// VFX
					let randomPositionX = Random.uniform(hitPosition.x, scalePix(5))
					let randomPositionY = Random.uniform(hitPosition.y, scalePix(5))
					let direction = Vector.sub(hitPosition, screenCenter)
					let angle = Math.atan2(direction.y, direction.x)
					factory.spawn(Impact, randomPositionX, randomPositionY)
					for (let i = 0; i < 5; i++)
						factory.spawn(Sparks, randomPositionX, randomPositionY, Random.normal(angle, Math.PI / 6))
				}

				// Hit effect.
				if (this.hitEffectCooldown == 0)
				{
					factory.spawn(
						HeatRayHitEffect,
						Random.uniform(scalePix(this.mod.range) * 1.5, scalePix(this.mod.range) / 2),
						{x: Random.uniform(hitPosition.x, scalePix(5)), y: Random.uniform(hitPosition.y, scalePix(5))},
						hitEntity.getType() == type.enemy ? hitEntity.velocity : {x: 0, y: 0}
					)
					let reverseDirection = Vector.sub(screenCenter, hitPosition)
					let angle = Math.atan2(reverseDirection.y, reverseDirection.x)
					let sparkAngle = Random.normal(angle, Math.PI / 5)
					factory.spawn(
						HeatRayGlobEffect,
						scalePix(Random.uniform(4, 1)),
						{x: Random.uniform(hitPosition.x, scalePix(5)), y: Random.uniform(hitPosition.y, scalePix(5))},
						Vector.mult({ x: Math.cos(sparkAngle), y: Math.sin(sparkAngle) }, scalePix(Random.discrete(2, 4)))
					)
				}
			})
		}
		else this.audioStop()
	}

	getScreenEdgeCoords(x, y, originX = screenCenter.x, originY = screenCenter.y)
	{
		let origin = {x: originX, y: originY}
		let directionToTarget = Vector.normalise(Vector.sub({x: x, y: y}, origin))
		
		// If target at (0, 0), impossible to get screen edge coords.
		if (Vector.magnitude(directionToTarget) == 0)
			return null

		// Check for straight lines to screen edge.
		let result = {x: 0, y: 0}
		if (directionToTarget.y == 0)
			result.x = directionToTarget.x > 0 ? Surface.Screen.width - originX : -originX
		else if (directionToTarget.x == 0)
			result.y = directionToTarget.y > 0 ? Surface.Screen.height - originY : -originY

		// Diagonals.
		else
		{
			let yVecAtEdge = directionToTarget.y > 0 ? Surface.Screen.height - originY : -originY
			let xVecAtEdge = (yVecAtEdge / directionToTarget.y) * directionToTarget.x
			let xPosAtEdge = originX + xVecAtEdge
			if (xPosAtEdge > 0 && xPosAtEdge < Surface.Screen.width)
			{
				result.x = xVecAtEdge
				result.y = yVecAtEdge
			}
			else
			{
				result.x = directionToTarget.x > 0 ? Surface.Screen.width - originX : -originX
				result.y = (result.x / directionToTarget.x) * directionToTarget.y
			}
		}
		return Vector.add(result, origin)
	}

	detectEnemiesHit(destination)
	{
		let enemiesHit = []
		let hitPositions = []
		let bouncePositions = []

		let origin = screenCenter
		for (let i = 0; i <= this.rayBounce; i++)
		{
			// Check for collisons along beam.
			let allCollisions = Matter.Query.ray(hostileBodies, origin, destination, scalePix(this.mod.range))
				.filter(col => {
					let ent = hostiles.get(col.bodyA.id)
					return ent && (ent.getType() == type.armor || ent.getType() == type.enemy)
				})
			
			// If there are collisions, record them.
			if (allCollisions.length > 0)
			{
				enemiesHit = enemiesHit.concat(allCollisions.map(col => hostiles.get(col.bodyA.id)))
				hitPositions = hitPositions.concat(allCollisions.map(col => collisionPoint(origin, destination, col.bodyA)))

				// If no evolution to penerate targets, end function early.
				if (!this.penetrateTargets)
				{
					let indexNearestOrigin = enemiesHit.reduce((nearest, current) => {
						if (nearest == null) return enemiesHit.indexOf(current)
						let currentIndex = enemiesHit.indexOf(current)
						let n = hitPositions[nearest]
						let c = hitPositions[currentIndex]
						return (distanceBetween(origin, c) < distanceBetween(origin, n)) ? currentIndex : nearest
					}, null)
					return {
						hitEntities: [enemiesHit[indexNearestOrigin]],
						hitPositions: [hitPositions[indexNearestOrigin]],
						bouncePositions: bouncePositions
					}
				}
			}

			// Record where the ray hits the screen edge.
			bouncePositions.push(destination)

			// If ray is bounced after this beam, calculate next beam.
			if (i <= this.rayBounce)
			{
				let directionVector = Vector.sub(destination, origin)
				let reflectedX = (destination.x == 0 || destination.x == Surface.Screen.width) ? -directionVector.x : directionVector.x
				let reflectedY = (destination.y == 0 || destination.y == Surface.Screen.height) ? -directionVector.y : directionVector.y
				let reflectedVector = Vector.add({x: reflectedX, y: reflectedY}, destination)
				let reflectedDestination = this.getScreenEdgeCoords(reflectedVector.x, reflectedVector.y, destination.x, destination.y)
				origin = destination
				destination = reflectedDestination
			}
		}
		return {
			hitEntities: enemiesHit,
			hitPositions: hitPositions,
			bouncePositions: bouncePositions
		}
	}

	fire(target)
	{
		super.fire(target)
		if (!this.blaster)
			this.newTarget = target.getPosition()
		else
		{
			factory.spawn(ProjBlaster, target.getPosition(), this)
			if (this.doubleBladed)
				factory.spawn (
					ProjBlaster,
					Vector.add(screenCenter, Vector.rotate(Vector.sub(target.getPosition(), screenCenter), Math.PI)),
					this
				)
		}
	}

	getEvolution()
	{
		return [
			{
				name: "evo_heatray_iceBeam",
				desc: localize("evo_heatray_iceBeam_desc", "-25", "+25", "8%"),
				icon: "",
				weight: 10,
				requirementsMet: modifiers.getModifierCount(this, "evo_heatray_iceBeam") == 0,
				reference: this,
				effect: function(heatray)
				{
					modifiers.addAbsModifier(heatray, "evo_heatray_iceBeam", { cold: 25, heat: -25 })
					modifiers.addPercModifier(heatray, "evo_heatray_iceBeam", { coldStatusChance: .05 })
					heatray.refreshModifiers()
				}
			},
			{
				name: "evo_heatray_iceBeam_2",
				desc: localize("evo_heatray_iceBeam_2_desc", "+20"),
				icon: "",
				weight: 20,
				requirementsMet: (
					modifiers.getModifierCount(this, "evo_heatray_iceBeam") > 0 &&
					modifiers.getModifierCount(this, "evo_heatray_iceBeam_2") == 0
				),
				reference: this,
				effect: function(heatray)
				{
					modifiers.addAbsModifier(heatray, "evo_heatray_iceBeam_2", { cold: 20 })
					heatray.refreshModifiers()
				}
			},
			{
				name: "evo_heatray_reflection",
				desc: localize("evo_heatray_reflection_desc_2", "2x"),
				icon: "",
				weight: 10,
				requirementsMet: this.rayBounce == 0,
				reference: this,
				effect: function(heatray)
				{
					heatray.penetrateTargets = true
					heatray.rayBounce = 2
				}
			},
			{
				name: "evo_heatray_reflection_2",
				desc: localize("evo_heatray_reflection_2_desc_2", "4x"),
				icon: "",
				weight: 20,
				requirementsMet: this.rayBounce == 2,
				reference: this,
				effect: function(heatray)
				{
					heatray.rayBounce = 4
				}
			},
			{
				name: "evo_heatray_doubleBladed",
				desc: localize("evo_heatray_doubleBladed_desc"),
				icon: "",
				weight: 10,
				requirementsMet: !this.doubleBladed,
				reference: this,
				effect: function(heatray)
				{
					heatray.doubleBladed = true
				}	
			},
			{
				name: "evo_heatray_blaster",
				desc: localize("evo_heatray_blaster_desc", "+500%"),
				icon: "",
				weight: 10,
				requirementsMet: !this.blaster,
				reference: this,
				effect: function(heatray)
				{
					heatray.blaster = true,
					heatray.reflectPts1 = heatray.reflectPts2 = [],
					heatray.hitPositions1 = heatray.hitPositions2 = [],
					modifiers.addPercModifier(heatray, "evo_heatray_blaster", {rateOfFire: 5})
				}	
			},
			{
				name: "evo_heatray_blaster_2",
				desc: localize("evo_heatray_blaster_2_desc", "+100%", "+40%"),
				icon: "",
				weight: 10,
				requirementsMet: (
					this.blaster &&
					modifiers.getModifierCount(this, "evo_heatray_blaster_2") == 0
				),
				reference: this,
				effect: function(heatray)
				{
					modifiers.addPercModifier(heatray, "evo_heatray_blaster_2", {damage: .4})
					heatray.blasterProjLength += 300
				}
			},

		]
	}

	getUpgrades()
	{
		return[
			...super.getEvolutionUpgrades(),
			{
				name: "heatray_upgrade_damage_common",
				desc: localize("heatray_upgrade_damage_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_heatray_title",
				weight: 60,
				requirementsMet: true,
				reference: this,
				effect: function(heatray)
				{
					modifiers.addPercModifier(heatray, "heatray_upgrade_damage_common", {damage: .1})
				}
			},
			{
				name: "heatray_upgrade_damage_uncommon",
				desc: localize("heatray_upgrade_damage_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_heatray_title",
				weight: 20,
				requirementsMet: true,
				reference: this,
				effect: function(heatray)
				{
					modifiers.addPercModifier(heatray, "heatray_upgrade_damage_uncommon", {damage: .2})
				}
			},
			{
				name: "heatray_upgrade_damage_rare",
				desc: localize("heatray_upgrade_damage_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_heatray_title",
				weight: 7,
				requirementsMet: true,
				reference: this,
				effect: function(heatray)
				{
					modifiers.addPercModifier(heatray, "heatray_upgrade_damage_rare", {damage: .3})
				}
			},
			{
				name: "heatray_upgrade_range_common",
				desc: localize("heatray_upgrade_range_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_heatray_title",
				weight: 60,
				group: "heatray_range",
				requirementsMet: true,
				reference: this,
				effect: function(heatray)
				{
					modifiers.addPercModifier(heatray, "heatray_upgrade_range_common", {range: .2})
				}
			},
			{
				name: "heatray_upgrade_range_uncommon",
				desc: localize("heatray_upgrade_range_desc", "40%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_heatray_title",
				weight: 20,
				group: "heatray_range",
				requirementsMet: true,
				reference: this,
				effect: function(heatray)
				{
					modifiers.addPercModifier(heatray, "heatray_upgrade_range_uncommon", {range: .4})
				}
			},
			{
				name: "heatray_upgrade_range_rare",
				desc: localize("heatray_upgrade_range_desc", "60%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_heatray_title",
				weight: 7,
				group: "heatray_range",
				requirementsMet: true,
				reference: this,
				effect: function(heatray)
				{
					modifiers.addPercModifier(heatray, "heatray_upgrade_range_rare", {range: .6})
				}
			},
			{
				name: "heatray_upgrade_rateOfFire_common",
				desc: localize("heatray_upgrade_rateOfFire_desc", "10%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.common,
				base: "weapon_heatray_title",
				weight: 60,
				group: "heatray_rate",
				requirementsMet: true,
				reference: this,
				effect: function(heatray)
				{
					modifiers.addPercModifier(heatray, "heatray_upgrade_rateOfFire_common", {rateOfFire: .1})
				}
			},
			{
				name: "heatray_upgrade_rateOfFire_uncommon",
				desc: localize("heatray_upgrade_rateOfFire_desc", "20%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.uncommon,
				base: "weapon_heatray_title",
				weight: 20,
				group: "heatray_rate",
				requirementsMet: true,
				reference: this,
				effect: function(heatray)
				{
					modifiers.addPercModifier(heatray, "heatray_upgrade_rateOfFire_uncommon", {rateOfFire: .2})
				}
			},
			{
				name: "heatray_upgrade_rateOfFire_rare",
				desc: localize("heatray_upgrade_rateOfFire_desc", "30%"),
				icon: this.constructor.getIcon(),
				rarity: rarity.rare,
				base: "weapon_heatray_title",
				weight: 7,
				group: "heatray_rate",
				requirementsMet: true,
				reference: this,
				effect: function(heatray)
				{
					modifiers.addPercModifier(heatray, "heatray_upgrade_rateOfFire_rare", {rateOfFire: .3})
				}
			}
		]
	}
}

class BeamRenderer extends Entity
{
	reset(parent)
	{
		this.parent = parent
	}
	on_renderStart()
	{
		// Draw Sparks.
		this.parent.sparks.forEach(spark => {
			if (spark.active)
				PrimNative.drawFilledCircle(Surface.Screen, spark.position.x, spark.position.y, spark.size, midGray)
		})

		// Draw outer weapon shape.
		heatRayOuterPolygon.transform.identity()
		heatRayOuterPolygon.transform.scale(scalePix(20), scalePix(20))
		heatRayOuterPolygon.transform.rotate(this.parent.rotation)
		heatRayOuterPolygon.transform.translate(screenCenter.x, screenCenter.y)
		heatRayOuterPolygon.draw(Surface.Screen)

		// Draw hit flare drop shadow.
		this.parent.allHitPos.forEach(hitPos => {
			if (!hitPos) return
			PrimNative.drawFilledCircle(Surface.Screen, hitPos.x, hitPos.y, scalePix(this.parent.mod.range) * 2.25, midGray.fadeTo(.75))
		})

		// Draw outer beams.
		let origin = screenCenter
		this.parent.reflectPts1.forEach(pt => {
			this.drawBeam(origin, pt, scalePix(this.parent.mod.range) * this.parent.pulseMult + scalePix(10), midGray.fadeTo(.75))
			PrimNative.drawFilledCircle(Surface.Screen, pt.x, pt.y, scalePix(this.parent.mod.range) * 2.25, midGray.fadeTo(.75))
			origin = pt
		})
		if (!this.parent.penetrateTargets && this.parent.hitPositions1.length > 0)
			this.drawBeam(origin, this.parent.hitPositions1[0], scalePix(this.parent.mod.range) * this.parent.pulseMult + scalePix(10), midGray.fadeTo(.75))
		if (this.parent.doubleBladed)
		{
			origin = screenCenter
			this.parent.reflectPts2.forEach(pt => {
				this.drawBeam(origin, pt, scalePix(this.parent.mod.range) * this.parent.pulseMult + scalePix(10), midGray.fadeTo(.75))
				origin = pt
			})
			if (!this.parent.penetrateTargets && this.parent.hitPositions2.length > 0)
				this.drawBeam(origin, this.parent.hitPositions2[0], scalePix(this.parent.mod.range) * this.parent.pulseMult + scalePix(10), midGray.fadeTo(.75))
		}
	}
	on_render()
	{
		// Draw inner beams.
		let origin = screenCenter
		this.parent.reflectPts1.forEach(pt => {
			this.drawBeam(origin, pt, scalePix(this.parent.mod.range) * this.parent.pulseMult, paleYellow)
			PrimNative.drawFilledCircle(Surface.Screen, pt.x, pt.y, scalePix(this.parent.mod.range) * 1.5, paleYellow)
			origin = pt
		})
		if (!this.parent.penetrateTargets && this.parent.hitPositions1.length > 0)
			this.drawBeam(origin, this.parent.hitPositions1[0], scalePix(this.parent.mod.range) * this.parent.pulseMult, paleYellow)
		if (this.parent.doubleBladed)
		{
			origin = screenCenter
			this.parent.reflectPts2.forEach(pt => {
				this.drawBeam(origin, pt, scalePix(this.parent.mod.range) * this.parent.pulseMult, paleYellow)
				origin = pt
			})
			if (!this.parent.penetrateTargets && this.parent.hitPositions2.length > 0)
				this.drawBeam(origin, this.parent.hitPositions2[0], scalePix(this.parent.mod.range) * this.parent.pulseMult, paleYellow)
		}

		// Draw hit flare glow.
		this.parent.allHitPos.forEach(hitPos => {
			if (!hitPos) return
			PrimNative.drawFilledCircle(Surface.Screen, hitPos.x, hitPos.y, scalePix(this.parent.mod.range) * 1.5, paleYellow)
		})

		// Draw inner weapon shape.
		heatRayCenterTriangle.transform.identity()
		heatRayCenterTriangle.transform.rotate(-this.parent.rotation)
		heatRayCenterTriangle.transform.scale(scalePix(12), scalePix(12))
		heatRayCenterTriangle.transform.translate(screenCenter.x, screenCenter.y)
		heatRayCenterTriangle.draw(Surface.Screen)
	}

	drawBeam(origin, destination, thickness, color)
	{
		PrimNative.drawLine (
			Surface.Screen,
			origin.x, origin.y,
			destination.x, destination.y,
			thickness,
			color
		)
	}
}

class HeatRayHitEffect extends Entity
{
	constructor()
	{
		super()
		this.tween = new FastTween(Easing.Linear)
	}
	reset(size, pos, vel)
	{
		this.size = 0
		this.pos = pos || {x: 0, y: 0}
		this.vel = vel || {x: 0, y: 0}
		this.tween.easeIn([0], [size], t => this.size = t[0], 10)
			.then(() => this.tween.easeOut([size], [0], t => this.size = t[0], 10))
				.then(() => this.suspend())
	}
	on_update() { this.pos = Vector.add(this.pos, this.vel) }
	on_renderStart() { PrimNative.drawFilledCircle(Surface.Screen, this.pos.x, this.pos.y, this.size * 1.5, midGray) }
	on_renderEnd() { PrimNative.drawFilledCircle(Surface.Screen, this.pos.x, this.pos.y, this.size, paleYellow) }
}

class HeatRayGlobEffect extends Entity
{
	constructor()
	{
		super()
		this.tween = new FastTween(Easing.Linear)
		this.movementTween = new FastTween(Easing.Exponential)
	}
	reset(size, pos, vel)
	{
		this.size = 0
		this.pos = pos
		this.vel = vel
		this.velMult = 1
		this.movementTween.easeIn([1], [0], t => this.velMult = t[0], 20)
		this.tween.easeIn([0], [size], t => this.size = t[0], 10)
			.then(() => this.tween.easeOut([size], [0], t => this.size = t[0], 10))
				.then(() => this.suspend())
	}
	on_update() { this.pos = Vector.add(this.pos, Vector.mult(this.vel, this.velMult)) }
	on_renderStart() { PrimNative.drawFilledCircle(Surface.Screen, this.pos.x, this.pos.y, this.size * 2.5, midGray) }
	on_renderEnd() { PrimNative.drawFilledCircle(Surface.Screen, this.pos.x, this.pos.y, this.size, paleYellow) }
}

class ProjBlaster extends Entity
{
	reset(target, parent)
	{
		this.parent = parent
		this.velocity = Vector.mult(Vector.normalise(Vector.sub(target, screenCenter)), scalePix(this.parent.mod.speed * 240))
		this.position = { x: screenCenter.x, y: screenCenter.y }
		this.trail = [{ x: screenCenter.x, y: screenCenter.y }]
		this.stopMoving = false
		this.screenEdgeCoords = this.parent.getScreenEdgeCoords(target.x, target.y)
		this.bouncesLeft = this.parent.rayBounce
		this.projLength = scalePix(this.parent.blasterProjLength)
	}

	getStoppingPoint(start, end, thickness, body)
	{
		let currentLength = 1
		let endLength = distanceBetween(start, end)
		let velocity = Vector.normalise(Vector.sub(end, start))
		let bodies = [body]
		let stoppingPoint
		while (currentLength < endLength)
		{
			stoppingPoint = Vector.add(start, Vector.mult(velocity, currentLength))
			if (Matter.Query.ray(bodies, start, stoppingPoint, thickness).length > 0)
				return stoppingPoint
			currentLength++
		}
		return stoppingPoint
	}

	on_update()
	{
		// Skip update if paused.
		if (isPaused()) return

		// Movement.
		if (!this.stopMoving)
		{
			let nextDestinationReached = false
			let percentageLeftToMove = 1
			while (!(this.stopMoving || nextDestinationReached))
			{
				// Detect enemy hit if not penetrating.
				if (!this.parent.penetrateTargets)
				{
					let destination = Vector.add(this.position, Vector.mult(this.velocity, percentageLeftToMove))
					let allCollisions = Matter.Query.ray(hostileBodies, this.position, destination, scalePix(this.parent.mod.range))
						.filter(col => {
							let ent = hostiles.get(col.bodyA.id)
							return ent && (ent.getType() == type.armor || ent.getType() == type.enemy)
						})
					
					// If there are collisions, end beam at nearest collision position.
					if (allCollisions.length > 0)
					{
						this.stopMoving = true
						let nearestDistance = Infinity
						let nearestTarget = allCollisions.reduce (
							(result, col) => {
								let target = hostiles.get(col.bodyA.id)
								let distance = distanceBetween(this.position, target.getPosition())
								if (distance < nearestDistance) { nearestDistance = distance; return target }
								return result
							},
							null
						)
						this.position = this.getStoppingPoint(this.position, destination, scalePix(this.parent.mod.range), nearestTarget.body)
					}
				}

				// Detect if reaching screen edge.
				let distanceToScreenEdge = distanceBetween(this.position, this.screenEdgeCoords)
				if (!this.stopMoving && distanceToScreenEdge < Vector.magnitude(this.velocity) * percentageLeftToMove)
				{
					// Snap to screen edge.
					this.position = this.screenEdgeCoords

					// No more screen edge bounces.
					if (this.bouncesLeft <= 0)
						this.stopMoving = true

					// Else, bounce!
					else
					{
						this.bouncesLeft--
						let reflectedX = (this.position.x == 0 || this.position.x == Surface.Screen.width) ? -this.velocity.x : this.velocity.x
						let reflectedY = (this.position.y == 0 || this.position.y == Surface.Screen.height) ? -this.velocity.y : this.velocity.y
						this.velocity = { x: reflectedX, y: reflectedY }
						let reflectedVector = Vector.add(this.position, this.velocity)
						this.trail.unshift(this.screenEdgeCoords)
						this.screenEdgeCoords = this.parent.getScreenEdgeCoords(reflectedVector.x, reflectedVector.y, this.position.x, this.position.y)
						percentageLeftToMove -= distanceToScreenEdge / Vector.magnitude(this.velocity)
					}
				}

				// Else, just move forward.
				else
				{
					this.position = Vector.add(this.position, Vector.mult(this.velocity, percentageLeftToMove))
					nextDestinationReached = true
				}
			}
		}

		// Kill projectile.
		if (this.stopMoving)
		{
			this.projLength -= Vector.magnitude(this.velocity)
			if (this.projLength < Vector.magnitude(this.velocity))
			{
				this.suspend()
				return
			}
		}

		// Move endpoint of blaster projectile.
		while (this.getProjLength() > this.projLength)
		{
			// If there is a bounce points in length of projectile.
			if (this.trail.length > 1)
			{
				let lastNode = this.trail[this.trail.length - 1]
				let secondLastNode = this.trail[this.trail.length - 2]
				let distanceBetweenLastTwoNodes = distanceBetween(lastNode, secondLastNode)
				if (distanceBetweenLastTwoNodes < Vector.magnitude(this.velocity))
					this.trail.pop()
				else
					this.trail[this.trail.length - 1] = Vector.add(lastNode, Vector.mult(Vector.normalise(Vector.sub(secondLastNode, lastNode)), Vector.magnitude(this.velocity)))
			}
			else this.trail[0] = Vector.add(this.trail[0], Vector.mult(Vector.normalise(Vector.sub(this.position, this.trail[0])), Vector.magnitude(this.velocity)))
		}

		// Update parent bounce points.
		this.parent.reflectPtsBlaster = this.parent.reflectPtsBlaster.concat(this.trail)
		this.parent.reflectPtsBlaster.pop()

		// Get all entities hit by projectile.
		for (let i = this.trail.length - 1; i >= 0; i--)
		{
			// Check for collisons along beam.
			let nextNode = i > 0 ? this.trail[i - 1] : Vector.add(this.position, Vector.mult(Vector.normalise(this.velocity), scalePix(this.parent.mod.range / 2)))
			let allCollisions = Matter.Query.ray(hostileBodies, this.trail[i], nextNode, scalePix(this.parent.mod.range))
				.filter(col => {
					let ent = hostiles.get(col.bodyA.id)
					return ent && (ent.getType() == type.armor || ent.getType() == type.enemy)
				})
			
			// If there are collisions, record them.
			if (allCollisions.length > 0)
			{
				// Shorten beam if no penetrate targets evo, and ignore rest of hit.
				if (!this.parent.penetrateTargets)
				{
					let nearestDistance = Infinity
					let nearestEnemy = allCollisions.reduce(
						(result, col) => {
							let enemy = hostiles.get(col.bodyA.id)
							let distanceToEnemy = distanceBetween(this.trail[i], enemy.getPosition())
							if (distanceToEnemy < nearestDistance) { nearestDistance = distanceToEnemy; return enemy }
							return result
						},
						null
					)
					let stoppingPoint = this.getStoppingPoint(this.trail[i], nextNode, scalePix(this.parent.mod.range), nearestEnemy.body)
					this.parent.entitiesHitBlaster.push(nearestEnemy)
					this.parent.hitPositionsBlaster.push(stoppingPoint)
					this.trail = this.trail.slice(i)
					this.position = stoppingPoint
				}

				// Else, report all hit entities to parent.
				else
				{
					this.parent.entitiesHitBlaster = this.parent.entitiesHitBlaster.concat(
						allCollisions.map(col => 
							hostiles.get(col.bodyA.id)
						)
					)
					this.parent.hitPositionsBlaster = this.parent.hitPositionsBlaster.concat(
						allCollisions.map(col => 
							this.getStoppingPoint(this.trail[i], nextNode, scalePix(this.parent.mod.range), col.bodyA)
						)
					)
				}
			}
		}
	}

	getProjLength()
	{
		let currentProjLength = 0
		for (let i = this.trail.length - 1; i >= 0; i--)
		{
			let nextNodeInTrail = i == 0 ? this.position : this.trail[i - 1]
			currentProjLength += distanceBetween(this.trail[i], nextNodeInTrail)
		}
		return currentProjLength
	}

	on_renderStart()
	{
		let origin = this.position
		let thickness = scalePix(this.parent.mod.range) * this.parent.pulseMult + scalePix(10)
		this.trail.forEach((pt, i) => {
			this.parent.beamRenderer.drawBeam(origin, pt, thickness, midGray.fadeTo(.75))
			if (i < this.trail.length - 1)
				PrimNative.drawFilledCircle(Surface.Screen, pt.x, pt.y, scalePix(this.parent.mod.range) * 2.25, midGray.fadeTo(.75))
			origin = pt
		})
		let lastNode = this.trail[this.trail.length - 1]
		PrimNative.drawFilledCircle(Surface.Screen, this.position.x, this.position.y, thickness / 2, midGray.fadeTo(.75))
		PrimNative.drawFilledCircle(Surface.Screen, lastNode.x, lastNode.y, thickness / 2, midGray.fadeTo(.75))
	}

	on_renderEnd()
	{
		let origin = this.position
		let thickness = scalePix(this.parent.mod.range) * this.parent.pulseMult
		this.trail.forEach((pt, i) => {
			this.parent.beamRenderer.drawBeam(origin, pt, thickness, paleYellow)
			if (i < this.trail.length - 1)
				PrimNative.drawFilledCircle(Surface.Screen, pt.x, pt.y, scalePix(this.parent.mod.range) * 1.5, paleYellow)
			origin = pt
		})
		let lastNode = this.trail[this.trail.length - 1]
		PrimNative.drawFilledCircle(Surface.Screen, this.position.x, this.position.y, thickness / 2, paleYellow)
		PrimNative.drawFilledCircle(Surface.Screen, lastNode.x, lastNode.y, thickness / 2, paleYellow)
	}
}