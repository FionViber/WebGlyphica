import { Task } from 'sphere-runtime'

// A base class with similar controls as a Task, but it's lifetime and updating is handled inside javascript.
export class Entity
{
	constructor()
	{
		this.running = false
	}

	start(...args)
	{
		this.running = true
        this.on_startUp()
		this.reset(...args)
	}

	stop()
	{
		this.running = false
        this.on_shutDown()
	}

	// resume/suspend function to fit previous task
    resume()
    {
        this.running = true
    }
	suspend()
	{
		this.running = false
	}

	reset(...args)
	{
	}

    on_startUp() {}
    on_shutDown() {}

	on_update() {}

	on_renderStart() {}
	on_render() {}
	on_renderEnd() {}
}

export class EntityTask extends Task
{
	constructor()
	{
		super()
        this.runners = []
	}

    addRunner(runningEntities, inactiveEntities){
        this.runners.push(new EntityRunner(runningEntities, inactiveEntities))
    }

    // TODO Lifecycle not complete
    on_startUp() {}
	on_shutDown() {}
	on_inputCheck() {}

	on_update() {
        for (const runner of this.runners)
        {
            runner.on_update()
        }
	}

	on_render() {
		for (const runner of this.runners)
			runner.on_renderStart()
        for (const runner of this.runners)
            runner.on_render()
		for (const runner of this.runners)
            runner.on_renderEnd()
	}
}

export class EntityRunner
{
	constructor(runningEntities, inactiveEntities)
	{
		this.runningEntities = runningEntities
		this.inactiveEntities = inactiveEntities
	}

	on_update() {
		// Loop with for loop with index so we can remove entities from the array by swapping them with the last element.
		for (let i = 0; i < this.runningEntities.length; i++)
		{
			if (!this.runningEntities[i].running)
			{
				this.inactiveEntities.push(this.runningEntities[i])
				this.runningEntities[i] = this.runningEntities[this.runningEntities.length - 1]
				this.runningEntities.pop()
				i--
                continue
			}
			this.runningEntities[i].on_update()
		}
	}

	on_renderStart() {
		for (const entity of this.runningEntities)
            if (entity.running)
                entity.on_renderStart()
	}

    on_render() {
        for (const entity of this.runningEntities)
            if (entity.running)
                entity.on_render()
    }

	on_renderEnd() {
		for (const entity of this.runningEntities)
            if (entity.running)
                entity.on_renderEnd()
	}
}

// Handles the creation of entities and their caching. Keeps track of running and inactive entities in separate arrays.
// It has a spawn method that creates a new entity or reuses an inactive one. Spawning an entity calls its start method and places it in the running array.
// Each class type has a separate array in the runningEntities object and the inactiveEntities functions similarly.
export class EntityFactory
{
	constructor()
	{
		this.runningEntities = {}
		this.inactiveEntities = {}
		this.entityTask = new EntityTask(this.runners)
	}

    spawn(classObject, ...args)
    {
        if (!this.entityTask.running)
        {
            // Late start to render on top of background as task priority not set up yet
            this.entityTask.start()
        }

        let className = classObject.name
        if (!(className in this.runningEntities))
        {
            this.runningEntities[className] = []
            this.inactiveEntities[className] = []
            this.entityTask.addRunner(this.runningEntities[className], this.inactiveEntities[className])
        }
        let entity = this.inactiveEntities[className].length > 0 ? this.inactiveEntities[className].pop() : new classObject()
        entity.start(...args)
        this.runningEntities[className].push(entity)

        return entity
    }

    cache(classObject, amt){
        let className = classObject.name
        if (!(className in this.inactiveEntities))
            this.inactiveEntities[className] = []
        for (let i = 0; i < amt; i++)
            this.inactiveEntities[className].push(new classObject())
    }

    stopAll(){
        for (const category of Object.values(this.runningEntities))
            for (const entity of category)
                entity.stop()

        // Push all entities to inactiveEntities
        for (const category of Object.values(this.runningEntities))
        {
            for (const entity of category)
                this.inactiveEntities[category[0].constructor.name].push(entity)

            category.length = 0
        }


        this.entityTask.stop()
    }
}
