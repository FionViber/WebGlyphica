import { saveGame } from "../core/loader.js"
import { OptionsLanguage } from "./optionsLanguage.js"

export class OptionsLanguageUI extends OptionsLanguage
{
	constructor(navigationMenu)
	{
		super(false, navigationMenu)
		this.name.setText(localize("options_UI_language"))
	}

	refresh()
	{
		this.varCount.setText(localize("language_name"))
		super.refresh()
	}

	onPopupClose(lang)
	{
		if (lang != currentUILanguage)
		{
			changeUILanguage(lang)
			save.UILanguage = currentUILanguage
			saveGame()
			super.refreshUIAndSkipToCurrentOption()
		}
	}
}