const Difficulties = [

	// Relaxed.
	{
		// Enemies
		droneVelocity: 1,
		droneChargeChance: 1,
		enemyHealth: 1,
		shooterInitialCooldown: 1,
		threatBudget: .5,
		specialsBudget: .5,
		eliteBudget: .5,
		spawnerCooldown: 1,
		pickupTimer: 1.5,
		wordLength: 1
	},

	// Balanced.
	{
		// Enemies
		droneVelocity: 1,
		droneChargeChance: 1.25,
		enemyHealth: 1,
		shooterInitialCooldown: 1,
		threatBudget: 1,
		specialsBudget: 1,
		eliteBudget: 1,
		spawnerCooldown: 1,
		pickupTimer: 1,
		wordLength: 2
	},

	// Challenging.
	{
		// Enemies
		droneVelocity: 1,
		droneChargeChance: 1.5,
		enemyHealth: 1,
		shooterInitialCooldown: 1,
		threatBudget: 1.5,
		specialsBudget: 1.5,
		eliteBudget: 1.5,
		spawnerCooldown: .75,
		pickupTimer: .75,
		wordLength: 3
	},

	// Intense.
	{
		// Enemies
		droneVelocity: 1,
		droneChargeChance: 2,
		enemyHealth: 1,
		shooterInitialCooldown: 1,
		threatBudget: 2,
		specialsBudget: 2,
		eliteBudget: 2,
		spawnerCooldown: .5,
		pickupTimer: .5,
		wordLength: 4
	}
]

let Scalers = Difficulties[0]

function UpdateScalers(difficulty)
{
	Scalers = Difficulties[difficulty]
}

export { Scalers, UpdateScalers }