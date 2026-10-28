import { Node, Text, Yoga, Easing } from 'sphere-runtime'
import { PageChangeButton } from './pageChangeButton.js'
import { PageCounter } from './pageCounter.js'
import { FastTween } from '../core/fastTween.js'
import { Button } from '../core/button.js'
import { findLeaderboard, downloadFriendLeaderboardScores } from '../core/leaderboard.js'
import { StaticWeaponList } from '../data/weaponsList.js'

export class StatsScreen extends Node
{
	constructor()
	{
		super()
			.setRenderMode(renderMode.color)
			.setTexture(bgColor.fadeTo(0))
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setWidth("100%")
			.setHeight("100%")

		this.panel = new Node()
			.setHeight("90%")
			.setWidth("80%")
			.setRenderMode(renderMode.color)            
			.setTexture(paleYellow)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_FLEX_START)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setPadding(Yoga.EDGE_VERTICAL, "3%")
			.setPadding(Yoga.EDGE_HORIZONTAL, "5%")
			.setChildOf(this)

		this.title = new Text()
			.setFont(titleFontUI())
			.setColor(midGray)
			.setWidth("100%")
			.setMargin(Yoga.EDGE_BOTTOM, "3%")
			.setTextAlign(textAlign.center)
			.setChildOf(this.panel)

		this.statsModeGroup = new Node()
			.setWidth("100%")
			.setHeight("6%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.panel)

		this.statsModeLeft = new PageChangeButton(-1, this.validityCheck.bind(this), this.modeChange.bind(this))
			.setWidth("6%")
			.setHeight("100%")
			.setChildOf(this.statsModeGroup)

		this.statsModeBG = new Node()
			.setWidth("50%")
			.setHeight("100%")
			.setRenderMode(renderMode.color)
			.setTexture(midGray.fadeTo(.2))
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setMargin(Yoga.EDGE_HORIZONTAL, scalePix(10))
			.setChildOf(this.statsModeGroup)
		
		this.statsModeText = new Text()
			.setWidth("100%")
			.setFont(regularFontUI())
			.setTextAlign(textAlign.center)
			.setColor(midGray)
			.setChildOf(this.statsModeBG)
		
		this.statsModeRight = new PageChangeButton(1, this.validityCheck.bind(this), this.modeChange.bind(this))
			.setWidth("6%")
			.setHeight("100%")
			.setChildOf(this.statsModeGroup)
		
		this.statsModeCounter = new PageCounter()
			.setWidth("100%")
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(30))
			.setChildOf(this.panel)

		this.wpmHistory = new WPMGraph()
			.setChildOf(this.panel)
		
		this.leaderboard = new Node()
			.setWidth("100%")
			.setHeight("50%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setChildOf(this.panel)
			.hide()

		this.entries = []
		for (let i = 0; i < 11; i++)
			this.entries.push(new LeaderBoardEntry(i).setChildOf(this.leaderboard))

		this.buttonGroup = new Node()
			.setWidth("100%")
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setPosition(Yoga.EDGE_BOTTOM, "5%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN)
			.setChildOf(this.panel)
		
		this.wpmHistoryLegend = new Node()
			.setWidth("30%")
			.setHeight("100%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setJustifyContent(Yoga.JUSTIFY_FLEX_START)
			.setChildOf(this.buttonGroup)
		
		this.wpmHistoryLegendWPM = new WPMHistoryLegend(secondColor, localize("words_per_minute_text"))
			.setChildOf(this.wpmHistoryLegend)

		this.wpmHistoryLegendAccuracy = new WPMHistoryLegend(midGray, `${localize("words_per_minute_text")} x ${localize("accuracy_text")}`)
			.setChildOf(this.wpmHistoryLegend)

		this.backButton = new BackButton(this)
			.setDefault()
			.setChildOf(this.buttonGroup)

		this.mode = 0
		this.turret = null
		this.linearTween = new FastTween()
		this.exponentialTween = new FastTween(Easing.Exponential)
	}

	validityCheck(increment)
	{
		let nextMode = this.mode + increment
		return nextMode >= 0 && nextMode < 2
	}

	modeChange(increment = 0)
	{
		if (this.validityCheck(increment))
		{
			if (increment != 0) this.mode += increment
			this.refresh(this.turret)
		}
	}

	refresh(turret)
	{
		// const turret = turret
		this.title.setText(localize("stats_title", turret.name))
		this.statsModeCounter.refresh(this.mode, 2)
		this.statsModeLeft.refresh()
		this.statsModeRight.refresh()

		switch(this.mode)
		{
			case 0:
				this.statsModeText.setText(localize("wpm_history_text"))
				this.wpmHistory.refresh(turret)
				this.leaderboard.hide()
				this.wpmHistory.show()
				break

			case 1:
				this.leaderboard.show()
				this.wpmHistory.hide()
				this.statsModeText.setText(localize("leaderboards_text"))
				this.entries.forEach(entry => entry.clear())
				this.asyncRefresh(turret, this.mode)
				break
		}

		ui.calculateLayout()
	}

	async asyncRefresh(turret, mode)
	{
		const leaderboard = await findLeaderboard(turret.weapon.name)
		const downloadedEntries = await downloadFriendLeaderboardScores(leaderboard)
		
		// If player has switched away from leaderboard mode, abort.
		if (this.mode != mode) return

		for (let index = 0; index < this.entries.length; index++) {
			// Skip header row
			if (index == 0)
				continue

			const entry = this.entries[index];
			const downloadedIndex = index - 1;
			if (downloadedIndex < downloadedEntries.length)
			{
				const entryData = downloadedEntries[downloadedIndex]
				entry.rank.setText(entryData.globalRank.toString())
				entry.name.setText(entryData.name)
				entry.weapon.setText(StaticWeaponList[entryData.data.favoriteWeapon].getName())
				entry.time.setText(timeToString(entryData.data.time))
				entry.difficulty.setText(entryData.data.difficulty > 0 ? localize("omen_text", entryData.data.difficulty) : localize("no_omen_text"))
				entry.score.setText(entryData.score.toString())
			}
			else entry.clear()
		}
		ui.calculateLayout()
	}

	startIntro(currentTurret)
	{
		this.turret = currentTurret
		this.mode = 0
		this.refresh(this.turret)
		if (keyboardArrows || usingController) this.backButton.takeFocus()
		inConfirmPopUp = true
		ui.disableAllTurretButtons()
		ui.disableAllMainMenuButtons()
		this.setAnimating(true)
		control.suspend(true)
		this.panel.animYOffset = this.getComputedHeight() - this.panel.getComputedTop()
		this.show()
		this.linearTween.easeIn([0], [1], t => this.setTexture(bgColor.fadeTo(t[0])), 40)
		this.exponentialTween.easeOut([this.panel.animYOffset], [0], t => this.panel.animYOffset = t[0], 40)
			.then(() => {
				this.setAnimating(false)
				control.suspend(false)
			})
	}

	startExtro()
	{
		if (keyboardArrows || usingController) this.backButton.focusEnd()
		this.setAnimating(true)
		control.suspend(true)
		this.linearTween.easeIn([1], [0], t => this.setTexture(bgColor.fadeTo(t[0])), 40)
		this.exponentialTween.easeIn([this.panel.animYOffset], [this.getComputedHeight() - this.panel.getComputedTop()], t => this.panel.animYOffset = t[0], 40)
			.then(() => {
				this.setAnimating(false)
				control.suspend(false)
				inConfirmPopUp = false
				ui.disableAllTurretButtons(false)
				ui.disableAllMainMenuButtons(false)
				this.hide()
				if (keyboardArrows || usingController)
					ui.main_menu.turrets.turretDetails.leaderBoardButton.takeFocus()
			})
	}
}

class WPMHistoryLegend extends Node
{
	constructor(color, text)
	{
		super()
			.setWidth("100%")
			.setHeight("40%")
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_FLEX_START)
			.setAlignItems(Yoga.ALIGN_CENTER)
		
		this.line = new Node()
			.setWidth("16%")
			.setHeight("100%")
			.setMargin(Yoga.EDGE_RIGHT, "5%")
			.setChildOf(this)

		this.text = new Text()
			.setFont(smallFont())
			.setColor(midGray)
			.setText(text)
			.setWidth("70%")
			.setChildOf(this)
		
		this.color = color
	}

	render(surface, xOffset = 0, yOffset = 0)
	{
		super.render(surface, xOffset, yOffset)

		// Draw legend line.
		if (this.hidden) return
		let midpointHeight = this.getComputedTop() + yOffset + this.getComputedHeight() / 2
		let lineStart = this.getComputedLeft() + xOffset
		let lineEnd = lineStart + this.line.getComputedWidth()
		let lineMidpoint = lineStart + this.line.getComputedWidth() / 2
		PrimNative.drawLine(Surface.Screen, lineStart, midpointHeight, lineEnd, midpointHeight, scalePix(2), this.color)
		PrimNative.drawFilledCircle(Surface.Screen, lineMidpoint, midpointHeight, scalePix(4), this.color)
	}
}

class LeaderBoardEntry extends Node
{
	constructor(index)
	{
		let isOdd = index % 2 > 0
		super()
			.setRenderMode(renderMode.color)
			.setTexture(isOdd ? midGray.fadeTo(.2) : null)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setWidth("100%")
			.setHeight("10%")
			.setPadding(Yoga.EDGE_HORIZONTAL, "2%")
			.setAlignItems(Yoga.ALIGN_CENTER)

		this.rank = new Text()
			.setFont(regularFontUI())
			.setText(index == 0 ? localize("rank_txt") : "")
			.setColor(midGray)
			.setWidth("10%")
			.setChildOf(this)

		this.name = new Text()
			.setFont(regularFontUI())
			.setText(index == 0 ? localize("name_txt") : "")
			.setColor(midGray)
			.setWidth("30%")
			.setChildOf(this)

		this.weapon = new Text()
			.setFont(regularFontUI())
			.setText(index == 0 ? localize("top_weapon_txt") : "")
			.setColor(midGray)
			.setWidth("20%")
			.setChildOf(this)
		
		this.time = new Text()
			.setFont(regularFontUI())
			.setText(index == 0 ? localize("time_txt") : "")
			.setColor(midGray)
			.setWidth("15%")
			.setChildOf(this)
		
		this.difficulty = new Text()
			.setFont(regularFontUI())
			.setText(index == 0 ? localize("difficulty_txt") : "")
			.setColor(midGray)
			.setWidth("15%")
			.setChildOf(this)

		 this.score = new Text()
			.setFont(regularFontUI())
			.setText(index == 0 ? localize("score_txt") : "")
			.setColor(midGray)
			.setWidth("10%")
			.setChildOf(this)
		
		this.index = index
	}

	clear()
	{
		if (this.index > 0)
		{
			this.rank.setText("")
			this.name.setText("")
			this.weapon.setText("")
			this.time.setText("")
			this.difficulty.setText("")
			this.score.setText("")
		}
	}
}

class BackButton extends Button
{
	constructor(parent)
	{
		super()
			.setWidth("20%")
			.setHeight(scalePix(75))
			.setRenderMode(renderMode.colorRounded)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setPadding(Yoga.EDGE_ALL, "3%")
			.setTexture(midGray)
		
		this.text = new Text()
			.setFont(regularFontUI())
			.setColor(paleYellow)
			.setTextAlign(textAlign.center)
			.setText(localize("back"))
			.setChildOf(this)
		
		this.parent = parent
	}

	focusStart()
	{
		audioHandler.playAudioHookUI("main_menu_confirmation_hover")
		this.setTexture(secondColorDark)
	}

	focusEnd()
	{
		this.setTexture(midGray)
	}

	pressShoulderButtonLeftStart() { this.parent.modeChange(-1) }
	pressShoulderButtonRightStart() { this.parent.modeChange(1) }

	pressMouseLeftStart() { this.activate() }
	pressButtonBottomStart() { this.activate() }
	activate()
	{
		audioHandler.playAudioHookUI("main_menu_confirmation_click")
		ui.leaderBoard.startExtro()
	}
}

class WPMGraph extends Node
{
	constructor()
	{
		super()
			.setWidth("100%")
			.setHeight("60%")
			.setMargin(Yoga.EDGE_TOP, "2%")
		
		global.WPMHistoryCount = 10
		this.yAxisIncrements = 50

		this.yAxisWidth = typingFontSmall.widthOf("9999") + scalePix(2)
		this.xAxisHeight = typingFontSmall.heightOf("9999") * 2 + scalePix(12)
	}

	refresh(turret)
	{
		this.points = []
		this.yAxisMax = 150

		let graphHeight = this.getComputedHeight() - this.xAxisHeight
		let graphWidth = this.getComputedWidth() - this.yAxisWidth

		this.xAxisSpacing = graphWidth / WPMHistoryCount

		if (turret.weapon.name in save.turrets &&
			"history" in save.turrets[turret.weapon.name] &&
			save.turrets[turret.weapon.name].history.length > 0)
		{
			let history = save.turrets[turret.weapon.name].history
			let highestWPM = history.reduce((t, c) => Math.max(t, c.wpm), 0)
			
			if (highestWPM > this.yAxisMax)
				this.yAxisMax = Math.ceil(highestWPM / 50) * 50

			history.forEach((v, i) => {
				let date = new Date(v.date)
				this.points.push({
					x: this.yAxisWidth + this.xAxisSpacing / 2 + i * this.xAxisSpacing,
					y: v.wpm / this.yAxisMax * graphHeight + this.xAxisHeight,
					yAcc: v.wpm / this.yAxisMax * v.acc * graphHeight + this.xAxisHeight,
					date: localize("date_txt", date.getMonth() + 1, date.getDate()),
					wpm: `${v.wpm.toString()} (${Math.round(v.acc * 100) + "%"})`
				})
			})
		}

		this.yAxisSpacing = graphHeight / (this.yAxisMax / this.yAxisIncrements)
	}

	render(surface, xOffset = 0, yOffset = 0)
	{
		super.render(surface, xOffset, yOffset)

		if (!this.hidden)
		{
			let graphX = xOffset + this.getComputedLeft()
			let graphY = yOffset + this.getComputedTop() + this.getComputedHeight()

			// ---------
			// Draw axes
			// ---------

			// Draw y-axis.
			for (let i = 0; i <= this.yAxisMax / this.yAxisIncrements; i++)
			{
				let height = i * this.yAxisSpacing + typingFontSmall.height
				let text = (i * this.yAxisIncrements).toString()
				typingFontSmall.drawText(Surface.Screen, graphX, graphY - this.xAxisHeight - height, text, midGray.fadeTo(.5))
			}
			PrimNative.drawLine (
				Surface.Screen,
				graphX + this.yAxisWidth,
				graphY - this.xAxisHeight,
				graphX + this.yAxisWidth,
				yOffset + this.getComputedTop(),
				scalePix(2),
				midGray.fadeTo(.5)
			)

			// Draw x-axis.
			for (let i = 1; i < WPMHistoryCount; i ++)
				PrimNative.drawLine (
					Surface.Screen,
					graphX + this.yAxisWidth + i * this.xAxisSpacing,
					graphY - this.xAxisHeight,
					graphX + this.yAxisWidth + i * this.xAxisSpacing,
					yOffset + this.getComputedTop(),
					scalePix(2),
					midGray.fadeTo(.25)
				)
			PrimNative.drawLine (
				Surface.Screen,
				graphX + this.yAxisWidth,
				graphY - this.xAxisHeight,
				graphX + this.getComputedWidth(),
				graphY - this.xAxisHeight,
				scalePix(2),
				midGray.fadeTo(.5)
			)

			// ----------
			// Draw graph
			// ----------

			// Draw line to previous pt.
			this.points.forEach((v, i) => {
				if (i == 0) return
				let prev = this.points[i - 1]
				PrimNative.drawLine (
					Surface.Screen,
					graphX + prev.x,
					graphY - prev.y,
					graphX + v.x,
					graphY - v.y,
					scalePix(2),
					secondColor
				)
				PrimNative.drawLine (
					Surface.Screen,
					graphX + prev.x,
					graphY - prev.yAcc,
					graphX + v.x,
					graphY - v.yAcc,
					scalePix(2),
					midGray.fadeTo(.75)
				)
			})

			// Draw points and values
			let drawCentered = function(x, y, text, color) { typingFontSmall.drawText(Surface.Screen, x - typingFontSmall.widthOf(text) / 2, y, text, color) }
			this.points.forEach(v => {
				PrimNative.drawFilledCircle(Surface.Screen, graphX + v.x, graphY - v.y, scalePix(4), secondColor)
				PrimNative.drawFilledCircle(Surface.Screen, graphX + v.x, graphY - v.yAcc, scalePix(4), midGray)
				drawCentered(graphX + v.x, graphY - typingFontSmall.height * 2, v.wpm, midGray)
				drawCentered(graphX + v.x, graphY - typingFontSmall.height, v.date, midGray)
			})
		}
	}
}