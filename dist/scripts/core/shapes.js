// This script uploads pre-defined shapes used to in drawing to the GPU.
// Needs to be re-called whenever theme changes.
export const DefineShapes = function()
{
	// Heat Ray
	{
		let points = [ { x: 0, y: 0, color: midGray } ]
		let apex = Vector.create(1, 0)
		for (let i = 0; i < 6; i++)
			points.push({ ...Vector.rotate(apex, Math.PI * .4 * i), color: midGray })
		global.heatRayOuterPolygon = new Model([
			new Shape(
				ShapeType.Fan,
				new VertexList(points)
			)
		])
		points = []
		for (let i = 0; i < 3; i++)
			points.push({ ...Vector.rotate(apex, Math.PI * .67 * i), color: paleYellow})
		global.heatRayCenterTriangle = new Model([
			new Shape(
				ShapeType.TriStrip,
				new VertexList(points)
			)
		])
	}

	// Barrage.
	{
		let outerSquareRadius = Math.sqrt(Math.pow(scalePix(20), 2) / 2)
		let outerSquare = [
			{ x: -outerSquareRadius, y: outerSquareRadius, color: midGray },
			{ x: -outerSquareRadius, y: -outerSquareRadius, color: midGray },
			{ x: outerSquareRadius, y: outerSquareRadius, color: midGray },
			{ x: outerSquareRadius, y: -outerSquareRadius, color: midGray }
		]
		let innerSquareRadius = scalePix(4)
		let innerSquare = [
			{ x: -innerSquareRadius, y: innerSquareRadius, color: paleYellow },
			{ x: -innerSquareRadius, y: -innerSquareRadius, color: paleYellow },
			{ x: innerSquareRadius, y: innerSquareRadius, color: paleYellow },
			{ x: innerSquareRadius, y: -innerSquareRadius, color: paleYellow }
		]
		let angleIncrement = Math.PI * .125
		let outerApex = { x: scalePix(20), y: 0, color: midGray }
		let innerApex = { x: scalePix(18), y: 0, color: midGray }
		let triangles = []
		for (let i = 0; i < 4; i++)
		{
			let currentAngle = i * Math.PI / 2
			triangles.push({...Vector.rotate(innerApex, currentAngle - angleIncrement), color: midGray })
			triangles.push({...Vector.rotate(outerApex, currentAngle), color: midGray })
			triangles.push({...Vector.rotate(innerApex, currentAngle + angleIncrement), color: midGray })
		}
		global.barrageShape = new Model([
			new Shape(
				ShapeType.TriStrip,
				new VertexList(outerSquare)
			),
			new Shape(
				ShapeType.TriStrip,
				new VertexList(innerSquare)
			),
			new Shape(
				ShapeType.Triangles,
				new VertexList(triangles)
			)
		])
		global.barrageProjectileShape = new Model([
			new Shape(
				ShapeType.Triangles,
				new VertexList([
					{ x: 0, y: -.5, color: midGray },
					{ x: 0, y: .5, color: midGray },
					{ x: 1, y: 0, color: midGray }
				])
			)
		])
	}

	// Snowflake model.
	{
		let short = Vector.create(.7, 0)
		let long = Vector.create(1, 0)
		let points = []
		for (let i = 0; i < 6; i++)
		{
			let startingAngle = i * Math.PI / 3
			points.push({ ...Vector.rotate(short, startingAngle), color: midGray })
			points.push({ ...Vector.rotate(long, startingAngle + Math.PI / 9), color: midGray })
			points.push({ ...Vector.rotate(long, startingAngle + Math.PI * .23), color: midGray })
			points.push({ ...Vector.rotate(short, startingAngle + Math.PI / 3), color: midGray })
		}
		for (let i = 0; i < 3; i++)
		{
			let startingAngle = i * Math.PI / 3
			points.push({ ...Vector.rotate(long, startingAngle), color: midGray })
			points.push({ ...Vector.rotate(long, startingAngle + Math.PI), color: midGray })
		}
		global.snowflakeModel = new Model([
			new Shape(
				ShapeType.Lines,
				new VertexList(points)
			)
		])
	}

	// Sparkle star model.
	{
		let long = Vector.create(scalePix(-3), 0)
		let short = Vector.rotate(Vector.create(scalePix(-1), 0), Math.PI / 4)
		let points = [ { x: 0, y: 0, color: midGray } ]
		for (let i = 0; i < 4; i++)
		{
			points.push({ ...Vector.rotate(long, i * Math.PI / 2), color: midGray })
			points.push({ ...Vector.rotate(short, i * Math.PI / 2), color: midGray })
		}
		points.push({ ...long, color: midGray })
		global.sparkleModel = new Model([
			new Shape(
				ShapeType.Fan,
				new VertexList(points)
			)
		])
	}

	// Chargeup lines for Super Spectre/Hunter
	{
		let angle = Math.PI / 100
		let near = {x: .1, y: 0}
		let far = {x: 1, y: 0}
		let vertices = new VertexList([
			{...Vector.rotate(near, angle), color: midGray.fadeTo(.5)},
			{...Vector.rotate(far, angle), color: midGray.fadeTo(0)},
			{...Vector.rotate(near, -angle), color: midGray.fadeTo(.5)},
			{...Vector.rotate(far, -angle), color: midGray.fadeTo(0)}
		])
		global.chargeUpLinesShape = new Shape(ShapeType.TriStrip, vertices)
	}

	// Debris square model.
	global.debrisModel = new Model([
		new Shape(
			ShapeType.TriStrip,
			new VertexList([
				{x: -1, y: -1, color: midGray},
				{x: 1, y: -1, color: midGray},
				{x: -1, y: 1, color: midGray},
				{x: 1, y: 1, color: midGray}
			])
		)
	])

	// Drone 6 dotted circle.
	{
		let inner = {x: .9, y: 0}
		let outer = {x: 1.3, y: 0}
		let segments = 12
		let increment = Math.PI * 2 / segments
		let shapes = []
		for (let i = 0; i < segments; i += 2)
		{
			shapes.push(new Shape(
				ShapeType.TriStrip,
				new VertexList([
					{...Vector.rotate(outer, i * increment), color: secondColor},
					{...Vector.rotate(inner, i * increment), color: secondColor},
					{...Vector.rotate(outer, (i + 1) * increment), color: secondColor},
					{...Vector.rotate(inner, (i + 1) * increment), color: secondColor}
				])
			))
		}
		global.droneDottedCircleModel = new Model(shapes)
	}

	// Shooter Cubs Models.
	global.shooterCubeModel = new Model([
		new Shape(
			ShapeType.TriStrip,
			new VertexList([
				{x: -1, y: -1, color: secondColor},
				{x: 1, y: -1, color: secondColor},
				{x: -1, y: 1, color: secondColor},
				{x: 1, y: 1, color: secondColor}
			])
		)
	])
	global.shooterCubeModel2 = new Model([
		new Shape(
			ShapeType.TriStrip,
			new VertexList([
				{x: -1, y: -1, color: secondColor},
				{x: -.5, y: -.5, color: secondColor},
				{x: 1, y: -1, color: secondColor},
				{x: .5, y: -.5, color: secondColor},
				{x: 1, y: 1, color: secondColor},
				{x: .5, y: .5, color: secondColor},
				{x: -1, y: 1, color: secondColor},
				{x: -.5, y: .5, color: secondColor},
				{x: -1, y: -1, color: secondColor},
				{x: -.5, y: -.5, color: secondColor}
			])
		)
	])
	global.shooterCubeLayer1 = new Model([
		new Shape(
			ShapeType.TriStrip,
			new VertexList([
				{x: -1, y: -1, color: secondColor},
				{x: -.8, y: -.8, color: secondColor},
				{x: 1, y: -1, color: secondColor},
				{x: .8, y: -.8, color: secondColor},
				{x: 1, y: 1, color: secondColor},
				{x: .8, y: .8, color: secondColor},
				{x: -1, y: 1, color: secondColor},
				{x: -.8, y: .8, color: secondColor},
				{x: -1, y: -1, color: secondColor},
				{x: -.8, y: -.8, color: secondColor}
			])
		)
	])
	global.shooterCubeLayer2 = new Model([
		new Shape(
			ShapeType.TriStrip,
			new VertexList([
				{x: -1, y: -1, color: secondColor},
				{x: -.85, y: -.85, color: secondColor},
				{x: 1, y: -1, color: secondColor},
				{x: .85, y: -.85, color: secondColor},
				{x: 1, y: 1, color: secondColor},
				{x: .85, y: .85, color: secondColor},
				{x: -1, y: 1, color: secondColor},
				{x: -.85, y: .85, color: secondColor},
				{x: -1, y: -1, color: secondColor},
				{x: -.85, y: -.85, color: secondColor}
			])
		)
	])

	let generateOutline = function(points, thickness, color = midGray)
	{
		let vertextList = []
		let outerApex = {x: 1, y: 0}
		let innerApex = {x: 1 - thickness, y: 0}
		let increment = Math.PI * 2 / points
		for (let i = 0; i <= points; i++)
		{
			vertextList.push({...Vector.rotate(outerApex, i * increment), color: color})
			vertextList.push({...Vector.rotate(innerApex, i * increment), color: color})	
		}
		return new Model([new Shape(ShapeType.TriStrip, new VertexList(vertextList))])
	}

	// Shield drone model.
	{
		let points = [ { x: 0, y: 0, color: secondColor } ]
		let apex = Vector.create(10, 0)
		for (let i = 0; i < 6; i++)
			points.push({ ...Vector.rotate(apex, Math.PI * .4 * i), color: secondColor })
		global.shieldDroneModel = new Model([
			new Shape(
				ShapeType.Fan,
				new VertexList(points)
			)
		])
	}

	// Shield drone layers.
	global.shieldDroneLayer1 = generateOutline(5, .2, secondColor)
	global.shieldDroneLayer2 = generateOutline(5, .15, secondColor)
	global.shieldDroneLayer1plus2 = generateOutline(5, .35, secondColor)
	global.shieldDroneLayer3 = generateOutline(5, .12, secondColor)

	// Shooter enemy model.
	{
		let pt1 = Vector.create(scalePix(-15), 0)
		let pt2 = { ...Vector.rotate(pt1, Math.PI * 2 / 3), color: secondColor }
		let pt3 = { ...Vector.rotate(pt2, Math.PI * 2 / 3), color: secondColor }
		pt1 = { ...Vector.mult(pt1, 1.5), color: secondColor }
		global.shooterModel = new Model([
			new Shape(
				ShapeType.TriStrip,
				new VertexList([pt2, pt1, { x: 0, y: 0, color: secondColor }, pt3])
			)
		])
	}

	// Armored Shooter enemy model.
	{
		// Plot pts for armor.
		let pt1 = Vector.create(scalePix(-15), 0)
		let pt2 = Vector.rotate(pt1, Math.PI * 2 / 3)
		let pt3 = Vector.rotate(pt2, Math.PI * 2 / 3)
		let offset = Vector.create(pt1.x * -1.5 + scalePix(2), pt2.y * -1 + scalePix(2))
		pt2 = Vector.add(pt2, offset)
		pt3 = Vector.add(pt3, offset)
		pt1 = Vector.add(Vector.mult(pt1, 1.5), offset)
		
		// Draw armor on surface and save as model.
		let armorSurface = new Surface(pt3.x + scalePix(3), pt3.y + scalePix(3))
		armorSurface.clipTo(0, 0, pt3.x - scalePix(2), pt3.y + scalePix(3))
		PrimNative.drawTriangle(armorSurface, pt2.x, pt2.y, pt1.x, pt1.y, pt3.x, pt3.y, scalePix(2), secondColor)
		global.shooterArmorModel = new Model([textureShape(armorSurface)])
	}

	// Swarmer model.
	global.swarmerModel = new Model([
		new Shape(
			ShapeType.TriStrip,
			new VertexList([
				{x: 0, y: scalePix(-14), color: secondColor},
				{x: scalePix(-5), y: 0, color: secondColor},
				{x: scalePix(5), y: 0, color: secondColor},
				{x: 0, y: scalePix(14), color: secondColor}
			])
		),
		new Shape(
			ShapeType.TriStrip,
			new VertexList([
				{x: 0, y: scalePix(-22), color: secondColor},
				{x: 0, y: scalePix(-17), color: secondColor},
				{x: scalePix(10), y: 0, color: secondColor},
				{x: scalePix(7), y: 0, color: secondColor},
				{x: 0, y: scalePix(22), color: secondColor},
				{x: 0, y: scalePix(17), color: secondColor},
				{x: scalePix(-10), y: 0, color: secondColor},
				{x: scalePix(-7), y: 0, color: secondColor},
				{x: 0, y: scalePix(-22), color: secondColor},
				{x: 0, y: scalePix(-17), color: secondColor}
			])
		)
	])

	// Swarmer child model.
	global.swarmerChildModel = new Model([
		new Shape(
			ShapeType.TriStrip,
			new VertexList([
				{x: 0, y: scalePix(-7), color: midGray},
				{x: scalePix(-7), y: 0, color: midGray},
				{x: scalePix(7), y: 0, color: midGray},
				{x: 0, y: scalePix(7), color: midGray}
			])
		)
	])

	// Swarmer child active model.
	global.swarmerChildActiveModel = new Model([
		new Shape(
			ShapeType.TriStrip,
			new VertexList([
				{x: 0, y: scalePix(-7), color: secondColor},
				{x: scalePix(-7), y: 0, color: secondColor},
				{x: scalePix(7), y: 0, color: secondColor},
				{x: 0, y: scalePix(7), color: secondColor}
			])
		)
	])

	// Warder model.
	{
		let long = {x: scalePix(13), y: 0}
		let short = {x: scalePix(8), y: 0}
		let increment = Math.PI / 8
		let vertices = [{x: 0, y: 0, color: secondColor}]
		for (let i = 0; i <= 16; i += 2)
		{
			vertices.push({...Vector.rotate(long, i * increment), color: secondColor})
			vertices.push({...Vector.rotate(long, (i + 1) * increment), color: secondColor})
			vertices.push({...Vector.rotate(short, (i + 1) * increment), color: secondColor})
			vertices.push({...Vector.rotate(short, (i + 2) * increment), color: secondColor})
		}
		global.warderModel = new Model([
			new Shape(
				ShapeType.Fan,
				new VertexList(vertices)
			)
		])
	}

	// Cerberus models.
	{
		// Outer Triangles.
		let outerTriangle = []
		for (let i = 0; i < 4; i++)
		{
			outerTriangle.push({ ...Vector.add({ x: .55, y: 0 }, Vector.rotate({ x: .4, y: 0 }, i * Math.PI * .6667)), color: midGray.fadeTo(.3) })
			outerTriangle.push({ ...Vector.add({ x: .55, y: 0 }, Vector.rotate({ x: .45, y: 0 }, i * Math.PI * .6667)), color: midGray.fadeTo(.3) })
		}

		// Middle Triangle.
		let middleTriangle = []
		for (let i = 0; i < 4; i++)
		{
			middleTriangle.push({ ...Vector.rotate({ x: .3, y: 0 }, i * Math.PI * .6667 + Math.PI * .3333), color: midGray })
			middleTriangle.push({ ...Vector.rotate({ x: .5, y: 0 }, i * Math.PI * .6667 + Math.PI * .3333), color: midGray })
		}

		// Build model.
		global.cerberusInnerTriangle = new Model([
			new Shape(
				ShapeType.TriStrip,
				new VertexList(middleTriangle)
			)
		])
		global.cerberusOuterTriangle = new Model([
			new Shape(
				ShapeType.TriStrip,
				new VertexList(outerTriangle)
			)
		])

		// Projectile core.
		let projCore = []
		for (let i = 0; i < 3; i++)
			projCore.push({ ...Vector.rotate({ x: .7, y: 0 }, i * Math.PI * .6667), color: secondColor })

		// Projectile outline.
		let projOutline = []
		for (let i = 0; i < 4; i++)
		{
			projOutline.push(Vector.rotate({ x: 1, y: 0 }, i * Math.PI * .6667))
			projOutline.push(Vector.rotate({ x: .8, y: 0 }, i * Math.PI * .6667))
		}

		// Build projectile models.
		global.cerberusProjModel = new Model([
			new Shape(
				ShapeType.Triangles,
				new VertexList(projCore)
			),
			new Shape(
				ShapeType.TriStrip,
				new VertexList(projOutline.map(coord => { return { ...coord, color: secondColor }}))
			)
		])
		global.cerberusProjOutlineModel = new Model([
			new Shape(
				ShapeType.TriStrip,
				new VertexList(projOutline.map(coord => { return { ...coord, color: midGray }}))
			)
		])
	}

	// Blade Trap models.
	global.bladeTipModel = new Model([
		new Shape(
			ShapeType.Triangles,
			new VertexList([
				{x: 0, y: 0, color: midGray},
				{x: scalePix(-30), y: 0, color: midGray},
				{x: 0, y: scalePix(50), color: midGray}
			])
		)
	])
	global.bladeRectModel = new Model([
		new Shape(
			ShapeType.TriStrip,
			new VertexList([
				{x: 0, y: 0, color: midGray},
				{x: 0, y: 1, color: midGray},
				{x: scalePix(-30), y: 0, color: midGray},
				{x: scalePix(-30), y: 1, color: midGray}
			])
		)
	])

	// Chopper model.
	{
		let apex = {x: 0, y: 1, color: midGray}
		global.chopperModel = new Model([
			new Shape(
				ShapeType.Fan,
				new VertexList([
					{x: 0, y: 0, color: midGray.fadeTo(0)},
					{x: 0, y: 0, color: midGray},
					apex,
					{...Vector.rotate(apex, .15 * Math.PI), color: midGray.fadeTo(.5)},
					{...Vector.rotate(apex, .3 * Math.PI), color: midGray.fadeTo(0)}
				])
			),
			new Shape(
				ShapeType.Fan,
				new VertexList([
					{x: 0, y: 0, color: midGray.fadeTo(0)},
					{x: 0, y: 0, color: midGray},
					{...Vector.rotate(apex, Math.PI), color: midGray},
					{...Vector.rotate(apex, Math.PI + .15 * Math.PI), color: midGray.fadeTo(.5)},
					{...Vector.rotate(apex, Math.PI + .3 * Math.PI), color: midGray.fadeTo(0)}
				])
			),
			new Shape(
				ShapeType.Fan,
				new VertexList([
					{x: 0, y: 0, color: midGray},
					{x: 0, y: -0.01, color: midGray},
					{x: 0.1, y: -0.01, color: midGray},
					{x: 0.1, y: 0.8, color: midGray},
					{x: 0, y: 1, color: midGray},
					{x: 0, y: 0, color: midGray},
					{x: 0, y: 0.01, color: midGray},
					{x: -0.1, y: 0.01, color: midGray},
					{x: -0.1, y: -0.8, color: midGray},
					{x: 0, y: -1, color: midGray},
					{x: 0, y: 0, color: midGray}
				])
			)
		])
	}

	// Firestorm dotted circle model.
	{
		let circlePoints = [{x: 0, y: 100, color: midGray}]
		for (let i = 0; i < 2 * Math.PI; i += Math.PI / 36)
			circlePoints.push({...Vector.rotate(circlePoints[0], i), color: midGray})
		let line = [{x: 0, y: -108, color: midGray}]
		for (let i = 0; i < 2; i++)
			line.push({x: 0, y: -116 - 8 * i, color: midGray})
		global.firestormCircleModel = new Model([
			new Shape(
				ShapeType.Lines,
				new VertexList(circlePoints)
			),
			new Shape(
				ShapeType.Lines,
				new VertexList(line)
			)
		])
		firestormCircleModel.transform.translate(screenCenter.x, screenCenter.y)
	}

	// Firestorm cannon model.
	global.firestormCannonModel = new Model([
		new Shape(
			ShapeType.TriStrip,
			new VertexList([
				{x: 0, y: 8, color: midGray},
				{x: 17, y: 6, color: midGray},
				{x: 0, y: -8, color: midGray},
				{x: 17, y: -6, color: midGray}
			])
		)
	])

	// Sentry triangle model.
	{
		let points = [
			{ x: 0, y: scalePix(-5), color: midGray },
			{ x: scalePix(5), y: 0, color: midGray },
			{ x: 0, y: scalePix(5), color: midGray }
		]
		global.sentryModel = new Model([
			new Shape (
				ShapeType.Triangles,
				new VertexList(points)
			)
		])
	}

	// Poet Boss Typing Box.
	{
		global.poetTypingBoxWidth = Surface.Screen.width * .3
		global.poetTypingBoxPositionY = Surface.Screen.height * .26
		global.poetTypingBoxFont = grandRegular
		let height = poetTypingBoxFont.height * 1.2
		let margin = Surface.Screen.height * .018
		let heightWithMargin = height + margin * 2
		let transparent = midGray.fadeTo(0)
		let bgColor = midGray.fadeTo(.2)

		global.poetTypingBoxBG = new Shape (
			ShapeType.TriStrip,
			new VertexList([
				{x: 0, y: 0, color: transparent},
				{x: 0, y: heightWithMargin, color: transparent},
				{x: poetTypingBoxWidth * .2, y: 0, color: bgColor},
				{x: poetTypingBoxWidth * .2, y: heightWithMargin, color: bgColor},
				{x: poetTypingBoxWidth * .8, y: 0, color: bgColor},
				{x: poetTypingBoxWidth * .8, y: heightWithMargin, color: bgColor},
				{x: poetTypingBoxWidth, y: 0, color: transparent},
				{x: poetTypingBoxWidth, y: heightWithMargin, color: transparent}
			])
		)
		let fadeOut = new Color(0, 0, 0, 1)
		let halfFaded = new Color(0, 0, 0, .6)
		let untouched = new Color(0, 0, 0, 0)
		global.poetBlendOpShape = new Shape (
			ShapeType.TriStrip,
			new VertexList([
				{x: 0, y: 0, color: fadeOut},
				{x: 0, y: height, color: fadeOut},
				{x: poetTypingBoxWidth * .2, y: 0, color: halfFaded},
				{x: poetTypingBoxWidth * .2, y: height, color: halfFaded},
				{x: poetTypingBoxWidth * .5 - 1, y: 0, color: halfFaded},
				{x: poetTypingBoxWidth * .5 - 1, y: height, color: halfFaded},
				{x: poetTypingBoxWidth * .5 + 1, y: 0, color: untouched},
				{x: poetTypingBoxWidth * .5 + 1, y: 0, color: untouched},
				{x: poetTypingBoxWidth * .8, y: 0, color: untouched},
				{x: poetTypingBoxWidth * .8, y: height, color: untouched},
				{x: poetTypingBoxWidth, y: 0, color: fadeOut},
				{x: poetTypingBoxWidth, y: height, color: fadeOut}
			])
		)
		global.poetTypingBoxSurface = new Surface(poetTypingBoxWidth, height)
		global.poetTypingBoxShape = textureShape(poetTypingBoxSurface)
		global.poetTransformBG = new Transform()
			.translate(
				screenCenter.x - poetTypingBoxWidth / 2,
				poetTypingBoxPositionY - height / 2 - margin
			)
		global.poetTransform = new Transform()
			.translate(
				screenCenter.x,
				poetTypingBoxPositionY
			)
	}

	// Splitter Shards.
	{
		let generateShardShape = function(radius, segments)
		{
			let apex = { x: radius, y: 0 }
			let angleBetweenSegments = Math.PI * 2 / segments
			let vertices = [
				Vector.rotate(apex, -angleBetweenSegments / 2 + .1),
				Vector.mult(apex, 2),
				{ x: scalePix(2), y: 0 },
				Vector.rotate(apex, angleBetweenSegments / 2 - .1)
			]
			vertices = vertices.map(vertex => {
				return { ...Vector.add(vertex, {x: -radius, y: 0}), color: secondColor }
			})
			return new Model([new Shape(ShapeType.TriStrip, new VertexList(vertices))])
		}
		global.splitterShardShape1 = generateShardShape(scalePix(15), 4)
		global.splitterShardShape2 = generateShardShape(scalePix(15), 5)
		global.splitterShardShape3 = generateShardShape(scalePix(15), 6)
	}

	// Pickup word surfaces.
	global.wordCompleteSurface = new Surface(scalePix(256), scalePix(64))
	global.pickupWordSurface = new Surface(scalePix(200), scalePix(100))
	global.pickupWordMask = new Surface(scalePix(200), scalePix(100))
	global.pickupWordMask.clear(new Color(0, 0, 0, .5))
	global.wordCompleteShape = textureShape(wordCompleteSurface)
	global.pickupWordShape = textureShape(pickupWordSurface)
	global.pickupWordMaskShape = textureShape(pickupWordMask, false)

	// Caltrops model.
	{
		let point = { x: 1, y: 0 }
		let recess = { x: .2, y: 0 }
		let angleIncrement = Math.PI * 2 / 6
		let vertices = [{ x: 0, y: 0, color: midGray.fadeTo(.5) }]
		for (let i = 0; i <= 6; i += 2)
		{
			vertices.push({ ...Vector.rotate(point, i * angleIncrement), color: midGray.fadeTo(.5) })
			if (i < 6) vertices.push({ ...Vector.rotate(recess, (i + 1) * angleIncrement), color: midGray.fadeTo(.5) })
		}
		global.caltropsModel = new Model([
			new Shape(
				ShapeType.Fan,
				new VertexList(vertices)
			)
		])
	}
}