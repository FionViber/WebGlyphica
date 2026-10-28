import { Random } from 'sphere-runtime'

export function DrawLightning(from, to)
{
	let deviation = scalePix(20)
	let vector = Vector.sub(to, from)
	let pts = Array(Random.discrete(2, 4))
	for (let i = 0; i < pts.length; i++)
		pts[i] = Random.uniform(0.5, 0.5)
	pts.sort()
	pts.splice(0, 0, from)
	let perpDirection = Vector.perp(Vector.normalise(vector))
	for (let i = 1; i < pts.length; i++)
	{
		pts[i] = Vector.add(Vector.add(from, Vector.mult(vector, pts[i])), Vector.mult(perpDirection, Random.uniform(0, deviation)))
		PrimNative.drawLine(lightningRenderer.surface, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, scalePix(3), midGray)
	}
	PrimNative.drawLine(lightningRenderer.surface, pts[pts.length - 1].x, pts[pts.length - 1].y, to.x, to.y, scalePix(3), midGray)
}