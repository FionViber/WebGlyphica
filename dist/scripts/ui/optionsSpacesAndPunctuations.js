import { OptionsToggle } from "./optionsToggle.js"
import { saveGame } from "../core/loader.js"

export class OptionsSpacesAndPunctuation extends OptionsToggle
{
	constructor(navigationMenu)
	{
		super(navigationMenu)
		this.name.setText(localize("options_spacesAndPunctuation"))
	}

	refresh()
	{
		this.varCount.setText(spacesAndPunctuation ? localize("on_text") : localize("off_text"))
		if (spacesAndPunctuation)
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
		if ((increment > 0 && !spacesAndPunctuation) || (increment < 0 && spacesAndPunctuation))
		{
			audioHandler.playAudioHookUI("main_menu_options_change_value")
			spacesAndPunctuation = !spacesAndPunctuation
			levelUpKey = spacesAndPunctuation ? "Enter" : "__"
			save.spacesAndPunctuation = spacesAndPunctuation
			saveGame()
			super.refreshUIAndSkipToCurrentOption()
		}
	}
}