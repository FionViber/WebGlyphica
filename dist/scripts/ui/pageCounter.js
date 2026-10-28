import { Text } from 'sphere-runtime'

export class PageCounter extends Text
{
    constructor(twoLayer = false)
    {
        super()
            .setHeight(typingFont.height)
            .setFont(typingFont)
            .setTextAlign(textAlign.center)
            .setColor(midGray.fadeTo(.5))
        
        this.twoLayer = twoLayer
    }

    refresh(current, unlocked, total = unlocked)
    {
        this.setText(this.twoLayer ? `${"◆".repeat(unlocked)}${"◇".repeat(total - unlocked)}` : "◇".repeat(unlocked))
        this.current = current
    }

    render(surface, xOffset = 0, yOffset = 0)
	{
        super.render(surface, xOffset, yOffset)
        
        // Draw current page marker.
        let center = this.getComputedLeft() + xOffset + this.getComputedWidth() / 2
        let textStart = center - typingFont.widthOf(this.text) / 2
		typingFont.drawText(
            Surface.Screen,
            textStart + typingFont.widthOf("◇") * this.current ,
            this.getComputedTop() + yOffset,
            "◆",
            secondColor
        )
	}
}