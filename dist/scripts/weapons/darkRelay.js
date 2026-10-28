import { Random, Matter } from 'sphere-runtime'
import { Weapon, FriendlyDrone } from './weapon.js'
import { Impact } from '../effects/impact.js'
import { Debris } from '../effects/debris.js'
import { DrawLightning } from '../effects/drawLightning.js'

export class DarkRelay extends Weapon
{
	// Static info functions.
	static getIcon() { return "" }
	static getName() { return localize("augment_darkRelay") }
	static getDesc() { return localize("augment_darkRelay_desc") }
	static damageTags() { return ["tag_electric"] }
	static nonDamageTags() { return ["tag_drone"] }

	constructor()
	{
		super()
        this.isWeapon = false

        this.dmg.base.electric = 50
        this.base.range = 50
        this.base.speed = 10
        this.refreshModifiers()

		this.start()
	}

    viableTurrets()
    {
        return allWeapons
            .filter(weap => weap.constructor.nonDamageTags().includes("tag_turret"))
            .reduce((t, c) => {
                c.children.forEach(child => {
                    if (!t.some(n => n.position.x == child.position.x && n.position.y == child.position.y))
                        t.push(child)
                })
                return t
            }, [])
    }

	spawnRelay(source)
	{
        if (this.children.length < 1 && this.viableTurrets().length > 1)
            factory.spawn(DarkRelayDrone, this, source.position.x, source.position.y)
	}
}

class DarkRelayDrone extends FriendlyDrone
{
    reset(parent, x, y)
    {
        super.reset(parent)
        this.rotation = 0
        this.position = {x: x, y: y}
        this.target = this.findNextTarget()
    }

    findNextTarget()
    {
        let viableTurrets = this.parent.viableTurrets()
            .filter(turret => !(turret.position.x == this.position.x && turret.position.y == this.position.y))
        return (Random.sample(viableTurrets))
    }

    spawnDebris()
	{
		for (let i = 0; i < 10; i++)
			factory.spawn(Debris, this.position.x, this.position.y)
	}

    on_update()
    {
        if (isPaused()) return

        // Rotate lightning effects.
        this.rotation += .2

        // Check if we need to change target.
        if (!this.target || !this.target.running)
        {
            this.target = this.findNextTarget()
            if (!this.target || !this.target.running)
            {
                this.spawnDebris()
                this.suspend()
                return
            }
        }

        // Determine next position.
        let nextPosition
        if (distanceBetween(this.target.position, this.position) < scalePix(this.parent.mod.speed))
        {
            nextPosition = this.target.position
            this.target = null
        }
        else
        {
            nextPosition = Vector.add(
                Vector.mult(
                    Vector.normalise(
                        Vector.sub(
                            this.target.position,
                            this.position)),
                    scalePix(this.parent.mod.speed)),
                this.position
            )
        }

        // Collision detection.
        let collisions = Matter.Query.ray(hostileBodies, this.position, nextPosition, scalePix(this.parent.mod.range))
        for (const collision of collisions)
        {
            let other = hostiles.get(collision.bodyA.id)
            if (other)
            {
                let colPt = collisionPoint(this.position, other.getPosition(), collision.bodyA)
                let damage = Random.uniform(this.parent.dmg.mod.all, 5)
                let result = other.getHit(damage, this.parent, colPt)
                this.parent.recordDamage(result.damage)
                factory.spawn(Impact, colPt.x, colPt.y)
                audioHandler.playAudioHook("darkRelay_hit", getPanFromX(colPt.x))
            }
        }

        // Move.
        this.position = nextPosition
    }

    on_render()
    {
        PrimNative.drawFilledCircle(Surface.Screen, this.position.x, this.position.y, scalePix(5), midGray)
        PrimNative.drawCircle(Surface.Screen, this.position.x, this.position.y, scalePix(this.parent.mod.range), scalePix(2), midGray.fadeTo(.3))
        for (let i = 0; i < 3; i++)
            DrawLightning(this.position, Vector.add(Vector.rotate({x: scalePix(this.parent.mod.range), y: 0}, i * Math.PI * .67 + this.rotation), this.position))
    }
}