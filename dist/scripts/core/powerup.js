import { Task } from 'sphere-runtime'
import { TempUpgrade } from '../ui/tempUpgrade.js'

export class Powerup extends Task
{
	constructor(name)
	{
		super()

		// Create UI display.
		this.node = new TempUpgrade(ui.hud.middle)
		this.node.setText(localize(name))
		this.node.hide()

		// Start.
		this.start()
		this.suspend()
	}

	on_init() {}
	reset(duration)
	{
		powerups.push(this)
		this.node.show()
		this.node.currentProgress = duration
		this.node.maxProgress = duration
		this.on_init()
		this.resume()
	}

	on_update()
	{
		if (!isPaused())
			if (--this.node.currentProgress <= 0)
				this.expire()
	}

	on_expire(forced) {}
	expire(forced = false)
	{
		this.on_expire(forced)
		powerups.splice(powerups.indexOf(this), 1);
		this.node.hide()
		this.suspend()
	}

	on_shutdown()
	{
		this.node.detach()
	}
}