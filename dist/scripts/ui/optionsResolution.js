import { OptionsToggle } from "./optionsToggle.js"
import { saveGame } from "../core/loader.js"

export class OptionsResolution extends OptionsToggle
{
	constructor(navigationMenu)
	{
		super(navigationMenu)
		this.name.setText(localize("options_resolution"))
	}

	refresh()
	{
		this.varCount.setText(Surface.Screen.width + " x " + Surface.Screen.height)
		this.canVariableDecrease = findNextSmallerRes(Surface.Screen.width) != null
		this.canVariableIncrease = !Sphere.fullScreen && detectOptimalResolution(true).width > Surface.Screen.width
		super.refresh()
	}

	changeVariable(increment)
	{
		if ((increment > 0 && this.canVariableIncrease) || (increment < 0 && this.canVariableDecrease))
		{
			audioHandler.playAudioHookUI("main_menu_options_change_value")
			let currentUsingController = usingController
			let currentKeyboardArrows = keyboardArrows
			if (increment > 0)
			{
				let nextLargerRes = findNextLargerRes(Surface.Screen.width)
				if (!nextLargerRes)
				{
					nextLargerRes = detectOptimalResolution(true)
					Sphere.fullScreen = true
					save.fullScreen = true
				}
				Sphere.setResolution(nextLargerRes.width, nextLargerRes.height)
				save.resolution = nextLargerRes
			}
			else
			{
				if (Sphere.fullScreen)
				{
					Sphere.fullScreen = false
					save.fullScreen = false
				}
				let nextSmallerRes = findNextSmallerRes(Surface.Screen.width)
				Sphere.setResolution(nextSmallerRes.width, nextSmallerRes.height)
				save.resolution = nextSmallerRes
			}

			// Restore controller/keyboard-arrow status
			// (Changing res changes mouse pos, which is detected as a switch to keyboard mode.)
			Sphere.sleep(0).then(() => {
				usingController = currentUsingController
				keyboardArrows = currentKeyboardArrows
			})

			// Save game and reload interface.
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