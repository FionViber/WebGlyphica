import { Task, Random } from 'sphere-runtime'

// Enemies
import {
	Drone, Drone2, Drone3, Drone4, Drone5, Drone6, Drone7,
	ShieldDrone, ShieldDrone2, ShieldDrone3, ShieldDrone4, ShieldDrone5,
	Stalker, Stalker2, Stalker3, Stalker4
} from '../enemies/drone.js'
import { Shooter, Shooter2, Shooter3 } from '../enemies/shooter.js'
import { Splitter, Splitter2, Splitter3 } from '../enemies/splitter.js'
import { Warder } from '../enemies/warder.js'
import { Swarmer } from '../enemies/swarmer.js'
import { Announcer } from '../effects/announcer.js'

// Bosses.
import { currentBossType } from '../bosses/bossUtilities.js'

// Pickup Controller.
import { PickupController } from '../pickups/pickupController.js'

export class Spawner extends Task
{
	constructor()
	{
		super()

		// Timekeeping vars.
		this.maxCooldown = 280
		this.currentCooldown = 0
		this.eliteCooldown = 0
		this.lastFiveCooldowns = Array(5).fill(0)

		// Pickup controller.
		global.pickupController = new PickupController()

		// Key: End of time bracket (mins).
		// Value: Threat, Weight, Enemy Type
		this.threatTable = {

			1: [
				[2,		100,	Drone]
			],

			2: [
				[2,		90,		Drone],
				[3,		10,		Drone2]
			],

			4: [
				[2,		80,		Drone],
				[2,		20,		Drone2],
				[4,		10,		Shooter]
			],

			7: [
				[2,		50,		Drone],
				[2,		50,		Drone2],
				[4,		10,		Shooter],
				[4,		5,		Stalker],
				[4,		15,		ShieldDrone]
			],

			9: [
				[2,		90,		Drone2],
				[3,		10,		Drone3],
				[4,		15,		Shooter],
				[5,		5,		Shooter2],
				[4,		10,		Stalker],
				[5,		5,		Splitter],
				[4,		20,		ShieldDrone]
			],

			11: [
				[2,		70,		Drone2],
				[3,		30,		Drone3],
				[4,		10,		Shooter],
				[5,		10,		Shooter2],
				[4,		15,		Stalker],
				[5,		10,		Splitter],
				[4,		20,		ShieldDrone],
				[4,		10,		ShieldDrone2],
				[6,		10,		Warder]
			],

			13: [
				[2,		30,		Drone2],
				[3,		70,		Drone3],
				[4,		20,		Shooter2],
				[4,		10,		Stalker],
				[4,		5,		Stalker2],
				[5,		8,		Splitter],
				[6,		2,		Splitter2],
				[4,		10,		ShieldDrone],
				[4,		20,		ShieldDrone2],
				[6,		10,		Warder],
				[8,		5,		Swarmer]
			],

			16: [
				[3,		70,		Drone3],
				[4,		30,		Drone4],
				[4,		15,		Shooter2],
				[6,		5,		Shooter3],
				[4,		5,		Stalker],
				[4,		10,		Stalker2],
				[5,		5,		Splitter],
				[6,		5,		Splitter2],
				[4,		30,		ShieldDrone2],
				[6,		15,		Warder],
				[8,		10,		Swarmer]
			],

			19: [
				[3,		30,		Drone3],
				[4,		70,		Drone4],
				[4,		10,		Shooter2],
				[6,		10,		Shooter3],
				[4,		15,		Stalker2],
				[5,		2,		Splitter],
				[6,		8,		Splitter2],
				[4,		20,		ShieldDrone2],
				[4,		10,		ShieldDrone3],
				[6,		15,		Warder],
				[8,		10,		Swarmer]
			],

			21: [
				[4,		70,		Drone4],
				[5,		30,		Drone5],
				[6,		20,		Shooter3],
				[4,		10,		Stalker2],
				[6,		5,		Stalker3],
				[5,		10,		Splitter2],
				[4,		10,		ShieldDrone2],
				[4,		20,		ShieldDrone3],
				[6,		15,		Warder],
				[8,		10,		Swarmer]
			],

			24: [
				[4,		30,		Drone4],
				[5,		70,		Drone5],
				[6,		20,		Shooter3],
				[4,		5,		Stalker2],
				[6,		10,		Stalker3],
				[6,		8,		Splitter2],
				[7,		2,		Splitter3],
				[4,		30,		ShieldDrone3],
				[6,		15,		Warder],
				[8,		10,		Swarmer]
			],

			27: [
				[5,		70,		Drone5],
				[6,		30,		Drone6],
				[6,		20,		Shooter3],
				[6,		15,		Stalker3],
				[6,		5,		Splitter2],
				[7,		5,		Splitter3],
				[4,		20,		ShieldDrone3],
				[6,		10,		ShieldDrone4],
				[6,		15,		Warder],
				[8,		10,		Swarmer]
			],

			30: [
				[5,		30,		Drone5],
				[6,		70,		Drone6],
				[6,		20,		Shooter3],
				[6,		10,		Stalker3],
				[7,		5,		Stalker4],
				[6,		2,		Splitter2],
				[7,		8,		Splitter3],
				[4,		10,		ShieldDrone3],
				[6,		20,		ShieldDrone4],
				[6,		15,		Warder],
				[8,		10,		Swarmer]
			],

			32: [
				[6,		70,		Drone6],
				[7,		30,		Drone7],
				[6,		20,		Shooter3],
				[6,		5,		Stalker3],
				[7,		10,		Stalker4],
				[7,		10,		Splitter3],
				[6,		30,		ShieldDrone4],
				[6,		15,		Warder],
				[8,		10,		Swarmer]
			],

			34: [
				[6,		30,		Drone6],
				[7,		70,		Drone7],
				[6,		20,		Shooter3],
				[7,		15,		Stalker4],
				[7,		10,		Splitter3],
				[6,		20,		ShieldDrone4],
				[7,		10,		ShieldDrone5],
				[6,		15,		Warder],
				[8,		10,		Swarmer]
			],

			36: [
				[7,		100,	Drone7],
				[6,		20,		Shooter3],
				[7,		15,		Stalker4],
				[7,		10,		Splitter3],
				[6,		10,		ShieldDrone4],
				[7,		20,		ShieldDrone5],
				[6,		15,		Warder],
				[8,		10,		Swarmer]
			],

			Infinity: [
				[7,		100,	Drone7],
				[6,		20,		Shooter3],
				[7,		15,		Stalker4],
				[7,		10,		Splitter3],
				[7,		30,		ShieldDrone5],
				[6,		15,		Warder],
				[8,		10,		Swarmer]
			]
		}

		// Class hierachy breakdown for wiki generation.
		this.classHierachy = [
			[Drone, Drone2, Drone3, Drone4, Drone5, Drone6, Drone7],
			[ShieldDrone, ShieldDrone2, ShieldDrone3, ShieldDrone4, ShieldDrone5],
			[Stalker, Stalker2, Stalker3, Stalker4],
			[Shooter, Shooter2, Shooter3],
			[Splitter, Splitter2, Splitter3],
			[Warder],
			[Swarmer]
		]
	}

	start()
	{
		super.start()

		// Reset vars.
		this.currentFrame
			= this.currentCooldown
			= this.eliteCooldown
			= this.existingThreat
			= this.lastSpawn
			= this.lastEliteSpawn
			= 0
		this.hasBossSpawned = false
		this.lastFiveCooldowns.fill(0)

		// Update hud level.
		let lvlText = ui.hud.top.hud_level
		let text = `${omenLevel > -2 ? localize("level", levelNumberText()) + " " : ""}${currentTurret.constructor.getName()}`
		Sphere.sleep(0).then(() => lvlText.setText(text))
	}

	on_update()
	{
		if (isPaused()) return

		// Spawn enemies.
		this.currentFrame = Math.ceil(timeElapsed * .06)
		if (this.currentFrame - this.lastSpawn > this.currentCooldown)
			this.randomSpawn()
		
		// Spawn boss.
		if (missionMode && !this.hasBossSpawned && this.currentFrame >= missionCountdown)
		{
			this.hasBossSpawned = true
			let bossType = currentBossType()
			bgm.fadeTo(bossType.getBGM())

			// If boss has not been defeated before, show intro screen.
			if (!("defeated" + bossType.name in save))
			{
				pause("bossIncomingAnnounce")
				factory.spawn(Announcer, bossType.getName(), localize("boss_incoming"), bossType.getDesc(), true).endPromise
					.then(() => {
						unpause("bossIncomingAnnounce")
						factory.spawn(bossType)
					})
			}
			else factory.spawn(bossType)
		}
	}

	getTimeFactor(currentFrame)
	{
		if (missionMode) return currentFrame
		let adaptiveDifficulty = (Math.pow(2, 0.000025 * currentFrame) - 1.6) * currentLevel * 3600
		return Math.max(currentFrame, adaptiveDifficulty)
	}

	getThreatBudget(timeFactor)
	{
		let omenFactor = 1
		switch (omenLevel)
		{
			case omen.typist: omenFactor = .1; break
			case omen.relaxed: omenFactor = .25
		}
		let increment = .0045 * omenFactor * timeFactor
		return Math.floor((30 + increment) * missionTier)
	}

	getSpecialsBudget(timeFactor)
	{
		let omenFactor = 1
		switch (omenLevel)
		{
			case omen.typist: omenFactor = 0; break
			case omen.relaxed: omenFactor = .5
		}
		let increment = .000082 * omenFactor * timeFactor
		return Math.floor((1 + increment) * missionTier)
	}

	getEliteBudget(timeFactor)
	{
		let omenFactor = 1
		switch (omenLevel)
		{
			case omen.typist: omenFactor = 0; break
			case omen.relaxed: omenFactor = .5
		}
		let increment = .000035 * omenFactor * timeFactor
		return Math.floor(increment * missionTier)
	}

	randomSpawn()
	{
		// If freeze is not active.
		if (!powerup_freeze)
		{
			// Get total budget.
			let timeFactor = this.getTimeFactor(this.currentFrame)
			let threatBudget = this.getThreatBudget(timeFactor)
			let specialsBudget = this.getSpecialsBudget(timeFactor)
			let eliteBudget = this.getEliteBudget(timeFactor)

			// Get available budget.
			let currentThreatBudget = threatBudget - this.existingThreat
			let currentSpecials = hostilesArray.reduce((total, current) => total += current.constructor.isSpecial ? current.constructor.isSpecial() : 0, 0)
			let currentElite = hostilesArray.reduce((total, current) => total += current.constructor.isElite ? current.constructor.isElite() : 0, 0)

			// If we can still spawn enemies.
			if (currentThreatBudget > 0)
			{
				// If typist mode, just spawn Drone.
				if (omenLevel < -1)
				{
					if (currentThreatBudget > 2)
					{
						this.existingThreat += 2
						factory.spawn(Drone, 2)
					}
				}

				// Else, in any other mode...
				else
				{
					// Find eligible enemies to spawn.
					let timeBracket = Object.keys(this.threatTable).find(key => timeFactor * missionTier <= key * 3600)
					let eliteCooldownOver = this.currentFrame - this.lastEliteSpawn > this.eliteCooldown
					let randomPool = this.threatTable[timeBracket].filter((set) => {
						return set[0] <= threatBudget
							&& !(set[2].isElite() && (currentElite >= eliteBudget || !eliteCooldownOver))
							&& !(set[2].isSpecial() && currentSpecials >= specialsBudget)
					})

					// If any are found.
					if (randomPool.length > 0)
					{
						// Roll the dice.
						let totalWeight = randomPool.reduce((total, current) => total += current[1], 0)
						let weightedRandom = Random.discrete(0, totalWeight)

						// Spawn the lucky enemy.
						let enemyToSpawn = randomPool.find((set) => {
							weightedRandom -= set[1]
							return weightedRandom <= 0
						})
						this.existingThreat += enemyToSpawn[0]
						factory.spawn(enemyToSpawn[2], enemyToSpawn[0])
						
						// Set elite cooldown.
						if (enemyToSpawn[2].isElite())
						{
							this.lastEliteSpawn = this.currentFrame
							this.eliteCooldown = 800 + (++currentElite / eliteBudget * 800)
						}
					}
				}
			}
			
			// Set next cooldown.
			this.lastSpawn = this.currentFrame
			this.currentCooldown = 20 + Math.floor(
				(this.existingThreat / threatBudget)
				* this.maxCooldown
				* this.sineFactor(this.currentFrame)
			)
			this.lastFiveCooldowns.shift()
			this.lastFiveCooldowns.push(this.currentCooldown / 60)
		}
		else this.currentCooldown = powerups.find((powerup) => powerup.constructor.name == "Freeze").node.currentProgress
	}

	sineFactor(frame)
	{
		return Math.min (
			frame > 9000 ? 1.2 :
			1, .35 * Math.sin((missionMode ? .0009 : .00067) * frame) + .85
		)
	}

	removeThreat(enemy)
	{
		this.existingThreat -= enemy.threat
	}

	on_render()
	{
		if (spawnerDebug)
		{
			let timeFactor = this.getTimeFactor(this.currentFrame)
			let threatBudget = this.getThreatBudget(timeFactor)
			let line = 0
			let addLine = function(text) { typingFont.drawText(Surface.Screen, 10, 10 + typingFont.height * line, text, midGray.fadeTo(.5)); line++ }
			addLine(`Threat Budget: ${threatBudget}`)
			addLine(`Existing Threat: ${this.existingThreat} (${hostilesArray.length} Enemies)`)
			addLine(`Balance Threat: ${threatBudget - this.existingThreat}`)
			addLine("")
			addLine(`Next Spawn In: ${((this.currentCooldown - this.currentFrame + this.lastSpawn) / 60).toFixed(2)} sec`)
			addLine(`Average Spawn Time: ${(this.lastFiveCooldowns.reduce((t, c) => t + c, 0) / 5).toFixed(2)} sec`)
		}
	}
}