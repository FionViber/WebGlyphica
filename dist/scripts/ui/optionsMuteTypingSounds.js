import { OptionsToggle } from "./optionsToggle.js"
import { saveGame } from "../core/loader.js"

export class OptionsMuteTypingSounds extends OptionsToggle
{
	constructor(navigationMenu)
	{
		super(navigationMenu)
		this.name.setText(localize("options_muteTypingSounds"))
	}

	refresh()
	{
		this.varCount.setText(muteTypingSounds ? localize("on_text") : localize("off_text"))
		if (muteTypingSounds)
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
		if ((increment > 0 && !muteTypingSounds) || (increment < 0 && muteTypingSounds))
		{
			audioHandler.playAudioHookUI("main_menu_options_change_value")
			muteTypingSounds = !muteTypingSounds
			save.muteTypingSounds = muteTypingSounds
			saveGame()
			this.refresh()
		}
	}
}