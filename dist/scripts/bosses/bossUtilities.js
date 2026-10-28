import { Poet } from './poet.js'
import { Cypher } from './cypher.js'
import { Cerberus } from './cerberus.js'

export function currentBossType()
{
    switch(missionTier)
    {
        case 1: return Cerberus
        case 2: return Cypher
        case 3: return Poet
        case 4: return Cypher
        default: return Poet
    }
}