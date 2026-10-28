
import { Yoga, Node, Text } from 'sphere-runtime'
import { Button } from '../core/button.js'
import { findLeaderboard, downloadFriendLeaderboardScores, downloadOwnLeaderboardScore } from '../core/leaderboard.js'

export async function testLeaderboard()
{
    const leaderboard = await findLeaderboard("Repeater")
    const entries = await downloadFriendLeaderboardScores(leaderboard)
    console.log(entries)
}

export class SteamRequests extends Node
{
	constructor()
	{
		super()
			.setWidth("100%")
			.setHeight("100%")
			.setMargin(Yoga.EDGE_TOP, 0)
			.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setRenderMode(renderMode.colorRounded)
			.setTexture(darkestGray)

		this.text = new Text()
			.setWidth("100%")
			.setHeight(regularFontUI().height)
			.setFont(regularFontUI())
			.setColor(midGray)
			.setText(JSON.stringify({foo: "bar", hej: ["foo", "bar"]}, null, 4))
			.setTextAlign(textAlign.left)
			.setChildOf(this)

        this.requests = new Node()
			.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setPosition(Yoga.EDGE_BOTTOM, "-1%")
			.setHeight("8%")
			.setWidth("100%")
            .setChildOf(this)

        this.testFoo = new Request(this, "foo", (parent) => {
			(async() => {
				const leaderboard = await findLeaderboard("Repeater")
				downloadFriendLeaderboardScores(leaderboard)
			})()
        })

            .setChildOf(this.requests)
        this.testReqFind = new Request(this, "find leaderboard", (parent) => {
            callback.steamAPI(ISteamUserStats.FindOrCreateLeaderboard("Test", ELeaderboardSortMethod.k_ELeaderboardSortMethodDescending, ELeaderboardDisplayType.k_ELeaderboardDisplayTypeNumeric))
                .then(result => {
                    parent.setMainText(`${result.m_bLeaderboardFound}`)
                    parent.leaderboard = result.m_hSteamLeaderboard
                })
        })
            .setChildOf(this.requests)

        this.testReqDown = new Request(this, "download score", (parent) => {
            callback.steamAPI(ISteamUserStats.DownloadLeaderboardEntries(parent.leaderboard, ELeaderboardDataRequest.k_ELeaderboardDataRequestGlobalAroundUser, 0, 0))
                .then(result => {
                    let allEntries = ""
                    for (let i = 0; i < result.m_cEntryCount; i++)
                    {
                        let entry = ISteamUserStats.GetDownloadedLeaderboardEntry(result.m_hSteamLeaderboardEntries, i, 0)
                        allEntries += `${JSON.stringify(entry, null, 4)}\n\n`
                    }
                    parent.setMainText(allEntries)
                })
        })
            .setChildOf(this.requests)

        this.testReqUp = new Request(this, "upload score", (parent) => {
            callback.steamAPI(ISteamUserStats.UploadLeaderboardScore(parent.leaderboard, ELeaderboardUploadScoreMethod.k_ELeaderboardUploadScoreMethodForceUpdate, 101, []))
                .then(result => {
                    parent.setMainText(`m_bSuccess: ${result.m_bSuccess}, m_hSteamLeaderboard: ${result.m_hSteamLeaderboard}, m_nScore: ${result.m_nScore}, m_bScoreChanged: ${result.m_bScoreChanged}, m_nGlobalRankNew: ${result.m_nGlobalRankNew}, m_nGlobalRankPrevious: ${result.m_nGlobalRankPrevious}`)
                })
        })
            .setChildOf(this.requests)

        this.leaderboard = null;
	}

	refresh() {}

    setMainText(text)
    {
        this.text.setText(text)
    }
}

class Request extends Button
{
	constructor(parent, text, action)
	{
		super()
			.setRenderMode(renderMode.colorRounded)
			.setJustifyContent(Yoga.JUSTIFY_CENTER)
			.setAlignItems(Yoga.ALIGN_CENTER)
			.setTexture(midGray)
			.setWidth("15%")
			.setHeight(50)

		this.text = new Text()
			.setColor(paleYellow)
			.setFont(typingFontSmall)
			.setText(text)
			.setTextAlign(textAlign.center)
			.setChildOf(this)

		this.parent = parent
        this.action = action
		return this
	}

	focusStart()
	{
        this.setTexture(darkGray)
	}

	focusEnd()
	{
        this.setTexture(midGray)
	}

	pressMouseLeftStart()
	{
        this.parent.setMainText("loading...")
        this.action(this.parent)
	}
}