import { Yoga } from 'sphere-runtime'
import { DiscordButton } from "./discordButton.js"

export class WikiButton extends DiscordButton
{
	constructor()
	{
		super()
			.setMargin(Yoga.EDGE_TOP, scalePix(40))
		this.logo.setText("<")
		this.logo.setWidth(interfaceIcons.widthOf("<"))
		this.text.setFont(regularFontUI())
		this.text.setText(localize("official_wiki"))
		this.text.setWidth("80%")
		this.responsiveWidth = null
		this.updateResponsiveWidth()
		this.officialLanguages = ["brazilian", "british", "english", "french", "german", "indonesian", "italian", "japanese", "polish", "spanish", "turkish"]
	}
	updateResponsiveWidth()
	{
		const compact = Surface.Screen.width <= 1600
		const width = compact ? "90%" : "75%"
		const font = compact ? smallFont() : regularFontUI()
		if (width !== this.responsiveWidth || font !== this.responsiveFont)
		{
			this.responsiveWidth = width
			this.responsiveFont = font
			this.text.setFont(font)
			this.text.setWidth("80%")
			this.setWidth(width)
		}
	}
	update()
	{
		this.updateResponsiveWidth()
		super.update()
	}
	interact()
	{
		if (!inConfirmPopUp)
		{
			let lang = this.officialLanguages.includes(currentUILanguage) ? currentUILanguage : "english"
			if (steamEnabled && ISteamUtils.IsOverlayEnabled())
				ISteamFriends.ActivateGameOverlayToWebPage(
					`https://alias.black/glyphica/wiki_${lang}.html`,
					EActivateGameOverlayToWebPageMode.k_EActivateGameOverlayToWebPageMode_Modal
				)
			else Sphere.openURL(`https://alias.black/glyphica/wiki_${lang}.html`)
		}
	}
}
