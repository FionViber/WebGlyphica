import { saveGame } from "../core/loader.js"
import { OptionsLanguage } from "./optionsLanguage.js"

export class OptionsLanguageGame extends OptionsLanguage
{
	constructor(navigationMenu)
	{
		super(true, navigationMenu)
		this.name.setText(localize("options_game_language"))
	}

	refresh()
	{
		// Update options text.
		if ("language_name" in wordlists[currentGameLanguage])
		{
			this.varCount.setFont(isGameEastAsian ? regularEastAsian : typingFont)
			this.varCount.setText(wordlists[currentGameLanguage]["language_name"])
		}
		else
		{
			this.varCount.setFont(typingFont)
			this.varCount.setText(currentGameLanguage)
		}
		super.refresh()
	}
	
	onPopupClose(lang)
	{
		if (lang != currentGameLanguage)
		{
			changeGameLanguage(lang)
			save.gameLanguage = currentGameLanguage
			saveGame()
			super.refreshUIAndSkipToCurrentOption()
		}
	}
}