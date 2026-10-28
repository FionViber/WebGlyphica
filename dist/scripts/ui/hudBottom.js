import { Node, Text, Yoga, Easing } from 'sphere-runtime'
import { FastTween } from '../core/fastTween.js'

export class HUDBottom extends Node
{
	constructor()
	{
		super()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setWidth("100%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		this.weaponsGrid = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(12))
			.setChildOf(this)
		
		this.weapons = []
		for (let i = 0; i < 5; i++)
			this.weapons.push(new HUDBottomWeapon().setChildOf(this.weaponsGrid))
		
		this.evolutionPopUp = new EvolutionPopUp()
			.setChildOf(this)
			.hide()	
		
		Sphere.sleep(0).then(() => this.weaponsGrid.animYOffset = this.weaponsGrid.getComputedHeight() + scalePix(7))
		this.tween = new FastTween()
	}
	
	clearWeapons()
	{
		this.weapons.forEach(weapon => weapon.setWeapon(null))
	}

	addUpgrade(weapon)
	{
		let slot = this.getSlot(weapon)
		if (slot) slot.addUpgrade()
	}

	setUpgrade(weapon, count)
	{
		let slot = this.getSlot(weapon)
		if (slot) slot.setUpgrade(count)
	}

	addEvolution(weapon)
	{
		let slot = this.getSlot(weapon)
		if (slot) slot.addEvolution()
	}

	setEvolution(weapon, count)
	{
		let slot = this.getSlot(weapon)
		if (slot) slot.setEvolution(count)
	}

	addWeapon(weapon)
	{
		let slot = this.weapons.find(weap => weap.weaponName == "")
		slot.setWeapon(weapon)
	}

	getSlot(weapon)
	{
		let weaponName = typeof weapon == "string" ? weapon : weapon.constructor.name
		return (this.weapons.find(weap => weap.weaponName == weaponName))
	}

	startIntro()
	{
		omenLevel < -1 ? this.hide() : this.show()
		return this.tween.easeOut(
			[this.weaponsGrid.animYOffset],
			[0],
			t => this.weaponsGrid.animYOffset = t[0],
			30
		)
	}

	startExtro()
	{
		return this.tween.easeOut(
			[this.weaponsGrid.animYOffset],
			[this.weaponsGrid.getComputedHeight() + scalePix(7)],
			t => this.weaponsGrid.animYOffset = t[0],
			30
		)
	}
}

class HUDBottomWeapon extends Text
{
	constructor()
	{
		super()
			.setFont(titleIconsLarge)
			.setColor(midGray.fadeTo(.5))
			.setText("")
			.setWidth(titleIconsLarge.widthOf(""))
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW_REVERSE)
			.setHeight(titleIconsLarge.height)
		
		this.upgradeBox = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(darkGray)
			.setWidth(typingFontSmall.widthOf("99") + scalePix(10))
			.setHeight(typingFontSmall.height)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setPosition(Yoga.EDGE_TOP, scalePix(5))
			.setChildOf(this)
		
		this.upgradeText = new Text()
			.setFont(typingFontSmall)
			.setText("99")
			.setColor(paleYellow)
			.setTextAlign(textAlign.center)
			.setWidth("100%")
			.setChildOf(this.upgradeBox)
		
		this.evolutionBox = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setPosition(Yoga.EDGE_TOP, "70%")
			.setPosition(Yoga.EDGE_LEFT, "20%")
			.setWidth("60%")
			.setHeight(typingFontSmall.height * .6)
			.setTexture(darkGray.fadeTo(.6))
			.setChildOf(this)
			.hide()
		
		this.evolutionText = new Text()
			.setFont(typingFontSmall)
			.setText("")
			.setColor(paleYellow)
			.setWidth("100%")
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_TOP, "-50%")
			.setTextAlign(textAlign.center)
			.setChildOf(this.evolutionBox)
		
		this.weaponName = ""
		this.weapon = null
		this.upgradeCount = 0
		this.evolutionCount = 0
		return this
	}

	addUpgrade() { this.setUpgrade(++this.upgradeCount) }
	setUpgrade(count)
	{
		this.upgradeCount = count
		this.upgradeBox.show()
		this.upgradeText.setText(String(this.upgradeCount))
	}

	addEvolution() { this.setEvolution(++this.evolutionCount)}
	setEvolution(count)
	{
		this.evolutionCount = count
		this.evolutionBox.show()
		this.evolutionText.setText("◆".repeat(this.evolutionCount))
	}

	render(surface, xOffset = 0, yOffset = 0)
	{
		super.render(surface, xOffset, yOffset)
		if (this.weapon)
			drawProgress(
				xOffset + this.getComputedLeft() + scalePix(5),
				yOffset + this.getComputedTop() + this.getComputedHeight(),
				this.getComputedWidth() - scalePix(10),
				scalePix(5),
				this.weapon.currentEvolution / this.weapon.maxEvolution,
				false
			)
	}

	setWeapon(weapon)
	{
		if (weapon != null)
		{
			this.weaponName = weapon.constructor.name
			this.weapon = weapon
			this.setText(weapon.constructor.getIcon())
			this.setColor(secondColor)
		}

		// Reset ui to blank.
		else
		{
			this.weaponName = ""
			this.weapon = null
			this.setText("")
			this.setColor(midGray.fadeTo(.5))
			this.upgradeCount = 0
			this.upgradeBox.hide()
			this.evolutionCount = 0
			this.evolutionBox.hide()
		}
	}
}

class EvolutionPopUp extends Node
{
	constructor()
	{
		super()
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setRenderMode(renderMode.colorRounded)
			.setTexture(midGray)
			.setHeight("17%")
			.setWidth("18%")
			.setMargin(Yoga.EDGE_BOTTOM, "2%")

		this.textTop = new Text()
			.setFont(regularFontUI())
			.setColor(paleYellow)
			.setTextAlign(textAlign.center)
			.setWidth("80%")
			.setText("Repeater has")
			.setChildOf(this)
		
		this.textBottom = new Text()
			.setFont(titleFontUI())
			.setColor(paleYellow)
			.setTextAlign(textAlign.center)
			.setWidth("80%")
			.setText(localize("evolution_pop_up_2"))
			.setChildOf(this)
		
		this.pressButtonGroup = new Node()
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setHeight(scalePix(50))
			.setChildOf(this)

		this.pressText = new Text()
			.setFont(regularFontUI())
			.setColor(paleYellow)
			.setText(localize("press_text"))
			.setWidth(regularFontUI().widthOf(localize("press_text")))
			.setMargin(Yoga.EDGE_RIGHT, scalePix(10))
			.setChildOf(this.pressButtonGroup)
		
		this.rightStickButton = new Text()
			.setFont(quicktimeFont)
			.setColor(paleYellow)
			.setText(getQuickTimeString([stick_down_right]))
			.setWidth(quicktimeFont.widthOf(getQuickTimeString([stick_down_right])))
			.setChildOf(this.pressButtonGroup)
		
		this.spaceButton = new Node()
			.setRenderMode(renderMode.colorRounded)
			.setTexture(paleYellow)
			.setWidth(typingFont.widthOf(levelUpKey) + scalePix(30))
			.setHeight(scalePix(40))
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setChildOf(this.pressButtonGroup)

		this.spaceButtonText = new Text()
			.setColor(midGray)
			.setFont(typingFont)
			.setTextAlign(textAlign.center)
			.setWidth("100%")
			.setHeight(typingFont.height)
			.setText(levelUpKey)
			.setChildOf(this.spaceButton)
		
		this.pointerXCoord = 0
		this.opacity = 1
		this.tween = new FastTween(Easing.Linear)
		return this
	}

	setEvolution(weapon)
	{
		let slot = this.getParent().getSlot(weapon)
		this.pointerXCoord = this.getParent().weaponsGrid.getComputedLeft() + slot.getComputedLeft() + slot.getComputedWidth() / 2
		this.textTop.setText(localize("evolution_pop_up_1", weapon.constructor.getName()))
		this.rightStickButton[usingController ? "show" : "hide"]()
		this.spaceButton[usingController ? "hide" : "show"]()
		this.show()

		// Blink.
		Sphere.sleep(60).then(() => {
			if (!this.hidden)
				this.blink()
		})
	}

	blink()
	{
		this.setAnimating(true)
		this.tween.easeIn([1], [0], (t) => { this.changeOpacity(t[0]) }, 30)
			.then(() => {
				this.tween.easeIn([0], [1], (t) => { this.changeOpacity(t[0]) }, 30)
					.then(() => {
						this.setAnimating(false)
						Sphere.sleep(60).then(() => {
							if (!this.hidden)
								this.blink()
						})
					})
			})
	}

	changeOpacity(opacity)
	{
		this.textTop.setColor(paleYellow.fadeTo(opacity))
		this.textBottom.setColor(paleYellow.fadeTo(opacity))
		this.pressText.setColor(paleYellow.fadeTo(opacity))
		this.rightStickButton.setColor(paleYellow.fadeTo(opacity))
		this.spaceButton.setTexture(paleYellow.fadeTo(opacity))
		this.spaceButtonText.setColor(midGray.fadeTo(opacity))
		this.setTexture(midGray.fadeTo(opacity))
		this.opacity = opacity
	}

	render(surface, xOffset = 0, yOffset = 0)
	{
		if (!this.hidden)
		{
			let bottom = yOffset + this.getComputedTop() + this.getComputedHeight() - scalePix(.5)
			let pt1 = {x: this.pointerXCoord - scalePix(10), y: bottom}
			let pt2 = {x: this.pointerXCoord, y: bottom + scalePix(30)}
			let pt3 = {x: this.pointerXCoord + scalePix(10), y: bottom}
			PrimNative.drawFilledTriangle(surface, pt1.x, pt1.y, pt2.x, pt2.y, pt3.x, pt3.y, midGray.fadeTo(this.opacity))
		}
		super.render(surface, xOffset, yOffset)
	}
}