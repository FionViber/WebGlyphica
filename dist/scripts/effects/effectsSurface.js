import { Entity } from "../core/entityFactory.js";

export class EffectsSurface extends Entity
{
    constructor()
	{
		super()
		this.surfaceMask = new Color(0, 0, 0, .75)
	}
	reset()
	{
		this.surface = new Surface(Surface.Screen.width, Surface.Screen.height)
		this.surfaceShape = textureShape(this.surface, false)
		super.reset()
	}
	on_render()
	{
		this.surface.blendOp = BlendOp.Subtract
		PrimNative.drawFilledRectangle(this.surface, 0, 0, Surface.Screen.width, Surface.Screen.height, this.surfaceMask)
		this.surface.blendOp = BlendOp.Default
		this.surfaceShape.draw(Surface.Screen, Transform.Identity)
	}
}