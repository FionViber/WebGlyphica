import { Random } from 'sphere-runtime'

export function calcRandomInboundsDistance(normalizedStartDirection, minDistanceFromCenter, maxDistanceFromCenter) {
	// Sanity check if min distance is not within bounds, return smallest possible
	let destination = Vector.add(global.screenCenter, Vector.mult(normalizedStartDirection, minDistanceFromCenter))
	if (!isInActiveBounds(destination))
	{
		return destination
	}

	do {
		let distanceFromCenter = Random.discrete(minDistanceFromCenter, maxDistanceFromCenter)
		destination = Vector.add(global.screenCenter, Vector.mult(normalizedStartDirection, distanceFromCenter))
	} while (!isInActiveBounds(destination))

	return destination
}
