import { OptionsToggle } from "./optionsToggle.js"
import { saveGame } from "../core/loader.js"

export class OptionsDarkMode extends OptionsToggle
{
	constructor(navigationMenu)
	{
		super(navigationMenu)
		this.name.setText(localize("options_dark_mode"))
	}

	refresh()
	{
		this.varCount.setText(darkMode ? localize("on_text") : localize("off_text"))
		if (darkMode)
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
		if ((increment > 0 && !darkMode) || (increment < 0 && darkMode))
		{
			audioHandler.playAudioHookUI("main_menu_options_change_value")
			darkMode = !darkMode
			save.darkMode = darkMode
			saveGame()
			super.refreshUIAndSkipToCurrentOption()
		}
	}
}