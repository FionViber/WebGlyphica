import { OptionsToggle } from "./optionsToggle.js"
import { saveGame } from "../core/loader.js"

export class OptionsContrast extends OptionsToggle
{
	constructor(navigationMenu)
	{
		super(navigationMenu)
		this.name.setText(localize("options_contrast"))
	}

	refresh()
	{
		this.varCount.setText(Math.round(contrast * 100) + "%")
		this.canVariableDecrease = Math.round(contrast * 10) > 0 ? true : false
		this.canVariableIncrease = Math.round(contrast * 10) < 10 ? true : false
		super.refresh()
	}

	changeVariable(increment)
	{
		if ((increment > 0 && this.canVariableIncrease) || (increment < 0 && this.canVariableDecrease))
		{
			audioHandler.playAudioHookUI("main_menu_options_change_value")
			contrast += increment * .1
			save.contrast = contrast
			saveGame()
			super.refreshUIAndSkipToCurrentOption()
		}
	}
}