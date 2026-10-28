import { OptionsToggle } from "./optionsToggle.js"
import { saveGame } from "../core/loader.js"

export class OptionsBGMVolume extends OptionsToggle
{
	constructor(navigationMenu)
	{
		super(navigationMenu)
		this.name.setText(localize("options_BGMVolume"))
	}

	refresh()
	{
		const text = Sphere.audioEnabled() ? Math.round(audioHandler.getBgmVolume() * 100) + "%" : "---"
		this.varCount.setText(text)
		this.canVariableDecrease = audioHandler.getBgmVolume() > 0 ? true : false
		this.canVariableIncrease = audioHandler.getBgmVolume() < 1 ? true : false
		super.refresh()
	}

	changeVariable(increment)
	{
		if ((increment > 0 && this.canVariableIncrease) || (increment < 0 && this.canVariableDecrease))
		{
			audioHandler.playAudioHookUI("main_menu_options_change_value")
			audioHandler.setBgmVolume(audioHandler.getBgmVolume() + increment * .1)
			save.bgmVolume = audioHandler.getBgmVolume()
			saveGame()
			this.refresh()
		}
	}
}