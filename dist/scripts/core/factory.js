import { EntityFactory, Entity } from './entityFactory.js'
export class Factory
{
	constructor()
	{
		this.archives = {}
		this.entityFactory = new EntityFactory()
	}

	// Check if class has inherited from Entity
	isEntity(classObject){
		let obj = classObject
		while (obj = Object.getPrototypeOf(obj)) {
			if (obj === Entity)
				return true
		}
		return false
	}

	spawn(classObject, ...args)
	{
		let className = classObject.name

		// If the class is in the entityTypes list, use the entityFactory to spawn it.
		if (this.isEntity(classObject))
			return this.entityFactory.spawn(classObject, ...args)

		if (!(className in this.archives))
			this.archives[className] = []
		let instance = this.archives[className].find(v => !v.running || (v.running && v.paused))
		if (!instance)
		{
			instance = new classObject()
			this.archives[className].push(instance)
		}
		instance.reset(...args)
		return instance
	}

	cache(classObject, amt)
	{
		if (this.isEntity(classObject))
			this.entityFactory.cache(classObject, amt)

		let className = classObject.name
		if (!(className in this.archives))
			this.archives[className] = []
		for (let i = 0; i < amt; i++)
			this.archives[className].push(new classObject())
	}

	stopAll()
	{
		for (const category of Object.values(this.archives))
			for (const task of category)
				if (task.running)
					task.stop()
		this.archives = {}

		this.entityFactory.stopAll()
	}
}