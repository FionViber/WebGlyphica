import { Node, Text, Yoga } from 'sphere-runtime'

let translators =
`Shu Miyasaka (Japanese)
Ray (Japanese)
Giorgia Gorea (Italian)
Valentín Sánchez (Spanish EU)
M Dzulfiqar Faza Imaduddin (Indonesian)
Raphaël Michau (French)
David Rey (French)
Florian Pescollderungg (German)
Marcos Macagnan (Brazilian Portuguese)
Mustafa Kurt (Turkish)
Marek Kozlowski (Polish)
Riku Ville-Vaske (Finnish)
Seo Jaemin (Big Jaekuk) (Korean)
Alaric Ma (Simplified Chinese)
Nekomancer9527 (Simplified Chinese)
Qi Yicheng (Simplified Chinese)`

export class MainMenuCredits extends Node
{
	constructor()
	{
		super()
			.setWidth("100%")
			.setHeight("91%")
			.setPadding(Yoga.EDGE_LEFT, scalePix(80))
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setFlexWrap(Yoga.FLEX_FLEX)

		new MainMenuCreditsSegment(this, localize("credits_code_design_visuals"), "Xuanming Zhou")
		new MainMenuCreditsSegment(this, localize("credits_business_consultant"), "Ryan Sumo")
		new MainMenuCreditsSegment(this, localize("credits_additional_code"), "Emil Lindberg")
		new MainMenuCreditsSegment(this, localize("credits_additional_design"), "Marek Kozlowski")
		new MainMenuCreditsSegment(this, localize("credits_audio"), "Jeremy Goh (Imba Interactive)\nBings Lee (Imba Interactive)")
		new MainMenuCreditsSegment(this, localize("credits_title_font"), "Grand Regular by Charles Daoud\nwww.charlesdaoud.com/grand-typeface")
		new MainMenuCreditsSegment(this, localize("credits_controller_icons"), "Kenney (CC0)\nhttps://kenney.nl/assets/game-icons")
		new MainMenuCreditsSegment(this, localize("credits_ps_controller_icons"), "Antoine Plu (CC by 4.0)\nfigma.fun/OvxIj4")
		new MainMenuCreditsSegment(this, localize("credits_ui_icons"), "Lorc, Delapouite & contributors (CC by 3.0)\ngame-icons.net")
		new MainMenuCreditsSegment(this, localize("credits_discord_moderators"), "Kariston\nHaruto Inoue")
		new MainMenuCreditsSegment(this, localize("credits_translators"), translators)
		
		return this
	}
}

class MainMenuCreditsSegment extends Node
{
	constructor(parent, header, names)
	{
		super()
			.setWidth("50%")
			.setPadding(Yoga.EDGE_HORIZONTAL, scalePix(20))
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(40))
			.setChildOf(parent)
		
		this.header = new Text()
			.setFont(regularFontUI())
			.setColor(darkGray)
			.setText(header)
			.setMargin(Yoga.EDGE_BOTTOM, scalePix(5))
			.setChildOf(this)
		
		this.names = new Text()
			.setFont(typingFont)
			.setColor(midGray.fadeTo(.75))
			.setText(names)
			.setChildOf(this)
	}
}