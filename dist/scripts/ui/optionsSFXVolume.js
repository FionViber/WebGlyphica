import { OptionsToggle } from "./optionsToggle.js"
import { saveGame } from "../core/loader.js"

export class OptionsSFXVolume extends OptionsToggle
{
	constructor(navigationMenu)
	{
		super(navigationMenu)
		this.name.setText(localize("options_SFXVolume"))
	}

	refresh()
	{
		const text = Sphere.audioEnabled() ? Math.round(audioHandler.getSfxVolume() * 100) + "%" : "---"
		this.varCount.setText(text)
		this.canVariableDecrease = audioHandler.getSfxVolume() > 0 ? true : false
		this.canVariableIncrease = audioHandler.getSfxVolume() < 1 ? true : false
		super.refresh()
	}

	changeVariable(increment)
	{
		if ((increment > 0 && this.canVariableIncrease) || (increment < 0 && this.canVariableDecrease))
		{
			audioHandler.playAudioHookUI("main_menu_options_change_value")
			audioHandler.setSfxVolume( audioHandler.getSfxVolume() + increment * .1 )
			save.sfxVolume = audioHandler.getSfxVolume()
			saveGame()
			this.refresh()
		}
	}
}