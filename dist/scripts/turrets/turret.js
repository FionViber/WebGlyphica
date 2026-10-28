import { Matter, Random } from 'sphere-runtime'
import { Weapon } from '../weapons/weapon.js'
import { triggerDoubleDamage } from '../pickups/doubleDamage.js'
import { ImmortalityCooldown } from '../data/lootItems.js'
import { Haze } from '../data/augmentsList.js'

// Abstract class for shared functionality.
export class Turret extends Weapon
{
	constructor(params = {radius: 10})
	{
		super()

		// Setup vars.
		this.shield = 0
		this.currentShield = this.shield
		this.currentShieldDelay = 0
		this.shieldRechargeDelay = 90
		this.health = omenLevel >= 3 ? 150 : 300
		this.currentHealth = this.health
		this.healthbarOffset = scalePix(20)

		// Setup collider.
		this.radius = params.radius
		this.body = circleCollider(params.radius, {category: friendly})
		Matter.World.add(physics.world, this.body)
		Matter.Body.setPosition(this.body, screenCenter)
		addFriendly(this)

		// Set this as current turret.
		currentTurret = this
	}

	calcShield()
	{
		if (this.currentShield < this.shield)
		{
			if (this.currentShieldDelay > 0)
				this.currentShieldDelay -= 1
			else
				this.currentShield += 1
		}
	}

	on_render()
	{
		// Draw shields.
		if (shields > 0)
			interfaceIcons.drawText(
				Surface.Screen,
				screenCenter.x - interfaceIcons.widthOf("+".repeat(shields)) / 2,
				screenCenter.y - scalePix(40) - interfaceIcons.height,
				"+".repeat(shields),
				midGray.fadeTo(.5)
			)
		
		// Draw health.
		drawProgress (
			screenCenter.x,
			screenCenter.y + Surface.Screen.height * .055,
			Surface.Screen.width * .04,
			Surface.Screen.height * .005,
			this.currentHealth / this.health)
		
		let healthText = `${Math.round(this.currentHealth)} / ${this.health}`
		typingFontSmall.drawText(
			Surface.Screen,
			screenCenter.x - typingFontSmall.widthOf(healthText) / 2,
			screenCenter.y + Surface.Screen.height * .065,
			healthText,
			midGray.fadeTo(.5)
		)
	}

	on_shutDown()
	{
		Matter.World.remove(physics.world, this.body)
		global.currentTurret = null
		removeFriendly(this)
	}

	getHit(damage, penetrateShield = false)
	{
		// If shields available, take it on shields.
		if (shields > 0 && !penetrateShield)
		{
			shields--
			[...allWeapons, currentTurret].forEach(weap => weap.onShieldDestroyed())
			audioHandler.playAudioHook("pickup_shield_destroyed")

			// If Last Stand item.
			if ("item_lastStand" in serializedLoot)
				triggerDoubleDamage()
		
			// If Retribution augment.
			if ("augment_retribution" in activeAugments)
				allWeapons.find(weap => weap.constructor.name == "Retribution").activate()

			// If Deliverance augment.
			if ("augment_deliverance" in activeAugments)
			{
				let deliverance = powerups.find(powerup => powerup.constructor.name == "Deliverance")
				if (deliverance) deliverance.expire()
			}
			
			return
		}

		this.currentShieldDelay = this.shieldRechargeDelay
		if (this.currentShield >= damage)
			this.currentShield -= damage
		else
		{
			damage -= this.currentShield
			this.currentShield = 0
			if (!(!isOozaru && immortal))
			{
				if (this.currentHealth > damage)
				{
					this.currentHealth -= damage
					audioHandler.playAudioHook("take_damage")

					// If Haze Augment.
					if ("augment_haze" in activeAugments &&
						this.currentHealth < this.health * .5 &&
						!powerups.some(powerup => powerup.constructor.name == "Haze")
					)
						factory.spawn(Haze, Infinity)
				}

				// If Immortality Item.
				else if ("item_immortality" in serializedLoot &&
					!powerups.some(powerup => powerup.constructor.name == "ImmortalityCooldown"))
				{
					factory.spawn(ImmortalityCooldown, 7200)
					this.currentHealth = 1
				}
				else
				{
					this.currentHealth = 0
					audioHandler.playAudioHookUI("main_turret_destroyed")
					endGame()
				}
			}
		}
	}

	fire(target)
	{
		allWeapons.forEach(x => x.onMainTurretFire(target))
	}

	addHealth(health)
	{
		if (this.currentHealth + health < this.health)
			this.currentHealth += health
		else
			this.currentHealth = this.health

		// If Haze Augment.
		if ("augment_haze" in activeAugments &&
			this.currentHealth >= this.health * .5)
		{
			let existingHaze = powerups.find(powerup => powerup.constructor.name == "Haze")
			if (existingHaze) existingHaze.expire()
		}
	}

	getType()
	{
		return "Turret"
	}
}