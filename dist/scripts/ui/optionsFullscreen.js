import { OptionsToggle } from "./optionsToggle.js"
import { saveGame } from "../core/loader.js"

export class OptionsFullscreen extends OptionsToggle
{
	constructor(navigationMenu)
	{
		super(navigationMenu)
		this.name.setText(localize("options_fullScreen"))
	}

	refresh()
	{
		const forceFullScreen = steamEnabled && ISteamUtils.IsSteamRunningOnSteamDeck() || isSmallScreen()
		this.varCount.setText(
			forceFullScreen ?
				localize("on_text") :
				Sphere.fullScreen ?
					localize("on_text") :
					localize("off_text")
		)
		if (forceFullScreen || (Sphere.fullScreen && !findNextSmallerRes(Surface.Screen.width)))
		{
			this.canVariableDecrease = false
			this.canVariableIncrease = false
		}
		else if (Sphere.fullScreen)
		{
			this.canVariableDecrease = true
			this.canVariableIncrease = false
		}
		else
		{
			this.canVariableDecrease = false
			this.canVariableIncrease = true
		}
		super.refresh()
	}

	changeVariable(increment)
	{
		if ((increment > 0 && this.canVariableIncrease) || (increment < 0 && this.canVariableDecrease))
		{
			audioHandler.playAudioHookUI("main_menu_options_change_value")
			let currentUsingController = usingController
			let currentKeyboardArrows = keyboardArrows
			Sphere.fullScreen = increment > 0 ? true : false
			let optimumRes = detectOptimalResolution(Sphere.fullScreen)
			Sphere.setResolution(optimumRes.width, optimumRes.height)
			Sphere.sleep(0).then(() => {
				usingController = currentUsingController
				keyboardArrows = currentKeyboardArrows
			})
			save.fullScreen = Sphere.fullScreen
			save.resolution = optimumRes
			saveGame()
			setScreenScale()
			loadFonts()
				.then(() => {
					calculateScreenDimensions()
					super.refreshUIAndSkipToCurrentOption()
				})
		}
	}
}