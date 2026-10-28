import { Turrets } from "../data/turrets.js"
import { StaticWeaponList } from "../data/weaponsList.js"

function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        // hash * 33 + char code
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        // Convert to 32-bit integer
        hash = hash >>> 0;
    }
    return hash;
}

function getWeaponAndTurretHashMap()
{
    const turrets = Turrets()
    const hash = new Map()
    for(const weapon in StaticWeaponList)
    {
        hash.set(hashString(weapon), weapon)
    }
    for(const turret of turrets)
    {
        hash.set(hashString(turret.name), turret.name)
    }
    return hash
}

let weaponAndTurretHash

class LeaderboardData
{
	constructor(time, difficulty, favoriteWeapon)
	{
        // Delay init of hash map.
        if (!weaponAndTurretHash)
            weaponAndTurretHash = getWeaponAndTurretHashMap()

        // default values
        this.time = 0
        this.difficulty = 0
        this.favoriteWeapon = "None"

        if (time)
            this.time = time
        if (difficulty)
            this.difficulty = difficulty
        if (favoriteWeapon)
            this.favoriteWeapon = favoriteWeapon
	}

    toIntArray()
    {
        return [this.time, this.difficulty, hashString(this.favoriteWeapon)]
    }

    fromIntArray(array)
    {

        this.time = array[0]
        this.difficulty = array[1]
        const weaponHashAsUnsigned = array[2] >>> 0
        this.favoriteWeapon = weaponAndTurretHash.get(weaponHashAsUnsigned)
    }
}
const LeaderboardDataSize = 5

export async function findLeaderboard(turretName)
{
	const version = 2
	const modeName = "endless"
	const leaderboardName = `${modeName}_${turretName}_${version}`
	const leaderboardFetch = await callback.steamAPI(ISteamUserStats.FindOrCreateLeaderboard(leaderboardName, ELeaderboardSortMethod.k_ELeaderboardSortMethodDescending, ELeaderboardDisplayType.k_ELeaderboardDisplayTypeNumeric))
	return leaderboardFetch.m_bLeaderboardFound ? leaderboardFetch.m_hSteamLeaderboard : null
}

export async function uploadLeaderboardScore(leaderboard, score, time, difficulty, favoriteWeapon)
{
    const leaderboardData = new LeaderboardData(time, difficulty, favoriteWeapon)
    const intArray = leaderboardData.toIntArray()
	return await callback.steamAPI(ISteamUserStats.UploadLeaderboardScore(leaderboard, ELeaderboardUploadScoreMethod.k_ELeaderboardUploadScoreMethodKeepBest, score, intArray))
}

export async function downloadFriendLeaderboardScores(leaderboard)
{
	const downloadResult = await callback.steamAPI(ISteamUserStats.DownloadLeaderboardEntries(leaderboard, ELeaderboardDataRequest.k_ELeaderboardDataRequestFriends, 0, 100))
    return entriesToArray(downloadResult)
}

export async function downloadOwnLeaderboardScore(leaderboard)
{
    const downloadResult = await callback.steamAPI(ISteamUserStats.DownloadLeaderboardEntriesForUsers(leaderboard, [ISteamUser.GetSteamID()]))
    return entriesToArray(downloadResult)
}

function entriesToArray(downloadResult)
{
    const entries = []
    for(let i = 0; i < downloadResult.m_cEntryCount; i++)
    {
        const tryGetEntry = ISteamUserStats.GetDownloadedLeaderboardEntry(downloadResult.m_hSteamLeaderboardEntries, i, LeaderboardDataSize)
        if ( tryGetEntry.result )
        {
            const entry = tryGetEntry.pLeaderboardEntry
            let leaderboardData = new LeaderboardData()
            if (tryGetEntry.pDetails.length == LeaderboardDataSize)
                leaderboardData.fromIntArray(tryGetEntry.pDetails)
            const name = ISteamFriends.GetFriendPersonaName(entry.m_steamIDUser)
            entries.push({name: name, score: entry.m_nScore, globalRank: entry.m_nGlobalRank, data: leaderboardData})
        }
    }
    return entries
}
