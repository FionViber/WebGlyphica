import { Random } from 'sphere-runtime'
import '../libs/hangul.js'
import { Pinyin } from '../libs/pinyin.js'
import { specialCharacterFallback } from '../data/specialCharacterFallback.js'
import { currentBossType } from '../bosses/bossUtilities.js'
import { Cypher } from '../bosses/cypher.js'
import { hiraganaRomajiConversion } from '../data/hiraganaRomajiConversion.js'
import { bannedWords } from '../data/bannedWords.js'
import { NC } from '../libs/numbertochinese.js'

(function() {

	// Collection of alphabet characters.
	global.alphabets = Array.from("abcdefghijklmnopqrstuvwxyz")

	// Weight for each button.
	global.buttonWeightGame = [
		100, // direction_up
		100, // direction_down
		100, // direction_left
		100, // direction_right
		100, // button_top
		100, // button_bottom
		100, // button_left
		100, // button_right
		25, // stick_down_left. Too annoying.
		0, // stick_down_right. Too annoying.
		100, // shoulder_button_left
		100, // shoulder_button_right
		100, // shoulder_trigger_left
		100, // shoulder_trigger_right
	]

	global.buttonWeightMenu = [
		100, // direction_up
		100, // direction_down
		100, // direction_left
		100, // direction_right
		0, // button_top. Blocked from generation because it has other uses.
		100, // button_bottom
		100, // button_left
		100, // button_right
		0, // stick_down_left. Too annoying.
		0, // stick_down_right. Too annoying.
		50, // shoulder_button_left
		50, // shoulder_button_right
		50, // shoulder_trigger_left
		50, // shoulder_trigger_right
	]

	// Korean character conversion.
	global.koreanToQwerty = {
		"ㅁ": "a",
		"ㅠ": "b",
		"ㅊ": "c",
		"ㅇ": "d",
		"ㄷ": "e",
		"ㄹ": "f",
		"ㅎ": "g",
		"ㅗ": "h",
		"ㅑ": "i",
		"ㅓ": "j",
		"ㅏ": "k",
		"ㅣ": "l",
		"ㅡ": "m",
		"ㅜ": "n",
		"ㅐ": "o",
		"ㅔ": "p",
		"ㅂ": "q",
		"ㄱ": "r",
		"ㄴ": "s",
		"ㅅ": "t",
		"ㅕ": "u",
		"ㅍ": "v",
		"ㅈ": "w",
		"ㅌ": "x",
		"ㅛ": "y",
		"ㅋ": "z",
		"ㅃ": "Q",
		"ㅉ": "W",
		"ㄸ": "E",
		"ㄲ": "R",
		"ㅆ": "T",
		"ㅒ": "O",
		"ㅖ": "P"
	}
	global.qwertyToKorean = {
		"a": "ㅁ",
		"b": "ㅠ",
		"c": "ㅊ",
		"d": "ㅇ",
		"e": "ㄷ",
		"f": "ㄹ",
		"g": "ㅎ",
		"h": "ㅗ",
		"i": "ㅑ",
		"j": "ㅓ",
		"k": "ㅏ",
		"l": "ㅣ",
		"m": "ㅡ",
		"n": "ㅜ",
		"o": "ㅐ",
		"p": "ㅔ",
		"q": "ㅂ",
		"r": "ㄱ",
		"s": "ㄴ",
		"t": "ㅅ",
		"u": "ㅕ",
		"v": "ㅍ",
		"w": "ㅈ",
		"x": "ㅌ",
		"y": "ㅛ",
		"z": "ㅋ"
	}
	global.chinesePunctuation = {
		"，": ",",
		"！": "!",
		"？": "?",
		"；": ";",
		"：": ":",
		"（": "(",
		"）": ")",
		"［": "[",
		"］": "]",
		"【": "[",
		"】": "]",
		"。": ".",
		"「": '"',
		"」": '"',
		"﹁": '"',
		"﹂": '"',
		"“": '"',
		"”": '"',
		"、": ',',
		"·": '·',
		"《": '"',
		"》": '"',
		"〈": '"',
		"〉": '"'
	}
	global.simplifiedChineseOverride = {
		"谁": [["shui", "shei"]],
		"般若": [["bo"], ["re"]],
		"古朴": [["gu"], ["pu"]],
		"露骨": [["lu"], ["gu"]],
		"似的": [["si"], ["de"]],
		"淡薄": [["dan"], ["bo"]],
		"都会": [["du"], ["hui"]],
		"古乐": [["gu"], ["yue"]],
		"稽查": [["ji"], ["cha"]],
		"那些": [["na"], ["xie"]],
		"普查": [["pu"], ["cha"]],
		"弹拨": [["tan"], ["bo"]],
		"弹劾": [["tan"], ["he"]],
		"弹力": [["tan"], ["li"]],
		"褪色": [["tui"], ["se"]],
		"寻思": [["xun"], ["si"]],
		"隐没": [["yin"], ["mo"]],
		"犹疑": [["you"], ["yi"]],
		"查看": [["cha"], ["kan"]],
		"彻查": [["che"], ["cha"]],
		"纯朴": [["chun"], ["pu"]],
		"大王": [["da"], ["wang"]],
		"调拨": [["diao"], ["bo"]],
		"反弹": [["fan"], ["tan"]],
		"简朴": [["jian"], ["pu"]],
		"基调": [["ji"], ["diao"]],
		"勘查": [["kan"], ["cha"]],
		"禽畜": [["qin"], ["chu"]],
		"弹琴": [["tan"], ["qin"]],
		"弹奏": [["tan"], ["zou"]],
		"巡查": [["xun"], ["cha"]],
		"展露": [["zhan"], ["lu"]],
		"这些": [["zhe"], ["xie"]],
		"着笔": [["zhuo"], ["bi"]],
		"着陆": [["zhuo"], ["lu"]],
		"暴晒": [["bao"], ["shai"]],
		"抽查": [["chou"], ["cha"]],
		"动弹": [["dong"], ["tan"]],
		"民调": [["min"], ["diao"]],
		"审查": [["shen"], ["cha"]],
		"司长": [["si"], ["zhang"]],
		"随行": [["sui"], ["xing"]],
		"推行": [["tui"], ["xing"]],
		"未曾": [["wei"], ["ceng"]],
		"下调": [["xia"], ["tiao"]],
		"胸脯": [["xiong"], ["pu"]],
		"游行": [["you"], ["xing"]],
		"乐手": [["yue"], ["shou"]],
		"侦查": [["zheng"], ["cha"]],
		"追查": [["zhui"], ["cha"]],
		"着实": [["zhuo"], ["shi"]],
		"着眼": [["zhuo"], ["yan"]],
		"回头率": [["hui"], ["tou"], ["lv"]],
		"混血儿": [["hun"], ["xue"], ["er"]],
		"情调": [["qing"], ["diao"]],
		"署长": [["shu"], ["zhang"]],
		"同行": [["tong"], ["xing"]],
		"着手": [["zhuo"], ["shou"]],
		"萝卜": [["luo"], ["bo"]]
	}

	// Simplified Chinese to Pinyin converter init.
	global.pinyin = new Pinyin()

	// Keep record of words & quicktime sequences in use.
	global.wordsInUse = []
	global.wordsInUseMenu = []
	global.cyphersInUse = []

	// Quicktime Character Generator.
	global.genQuicktimeChar = function(weights)
	{
		let randomNumber = Random.discrete(0, weights.reduce((t, c) => t + c, 0))
		for (let i = 0; i < weights.length; i++)
		{
			randomNumber -= weights[i]
			if (randomNumber <= 0) return i
		}
		return 0
	}

	// Convert level number (if applicable)
	global.levelNumberText = function()
	{
		return convertIfChinese(currentLevel, true)
	}

	// Convert trial number (if applicable)
	global.convertIfChinese = function(number, ordinal = false)
	{
		switch(currentUILanguage)
		{
			case "schinese":
			case "tchinese":
			case "tchinese-cangjie":
				return ordinal ? NC.toWordsOrdinal(number) : NC.toWords(number)
			
			default:
				return number
		}
	}

	// Shuffle a string (for Cypher)
	global.shuffle = function(a) {
		let j, x, i
		a = Array.from(a)
		for (i = a.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1))
			x = a[i]
			a[i] = a[j]
			a[j] = x
		}
		return a.join('')
	}

	// Create surface and print hiragana on it.
	global.createWordSurface = function(word, font)
	{
		let surface = new Surface(font.widthOf(word), font.height)
		font.drawText(surface, 0, 0, word, Color.White)
		return surface
	}

	// Helper function to get a word assigned.
	global.addWord = function(object, menu = false, length = false, forceWord = null)
	{
		// Use the right collection.
		let currentWords = menu ? wordsInUseMenu : wordsInUse
		
		// Remove object if it already exists.
		removeWord(object, menu)

		// Determine length based on time elapsed.
		if (!length)
		{
			let rand = Random.uniform(0.5, 0.5)
			let timeElapsedScaled = timeElapsed * (omenLevel < -1 ? 1.5 : 1) * missionTier
			if (timeElapsedScaled > 360000 && rand < 0.0000001 * timeElapsedScaled)
				length = 8
			else if (timeElapsedScaled > 240000 && rand < 0.0000002 * timeElapsedScaled + 0.005)
				length = 7
			else if (timeElapsedScaled > 180000 && rand < 0.0000004 * timeElapsedScaled + 0.017)
				length = 6
			else if (rand < 0.0000008 * timeElapsedScaled + 0.1)
				length = 5
			else
				length = 4
		}

		// Get word.
		const maxAttempts = 1000
		if (!forceWord)
		{
			let attempts = 0
			let word = ""
			const words = getWordsOfLength(length)
			do { word = Random.sample(words) }
			while (anyPartialMatches(isLatinized ? word[0] : word, currentWords) && (attempts++ < maxAttempts))
			object.word = isLatinized ? word[0] : word
			object.nonLatinGlyphs = isLatinized ? word[1] : null
		}
		else
			object.word = forceWord

		// Create word surfaces for rendering partially matched East Asian characters.
		if (isEastAsianPrimaryDisplay)
			object.wordSurface = createWordSurface(object.word, menu ? titleEastAsian : regularEastAsianLarge)

		// Get variants.
		object.wordVariants = generateVariants(object.word)

		// Get Quicktime sequence.
		let quicktime = null
		let attempts = 0
		let buttonWeight = menu ? buttonWeightMenu : buttonWeightGame
		do {
			quicktime = []
			for (let i = 0; i < Math.floor(length / 2); i++)
				quicktime.push(genQuicktimeChar(buttonWeight))
		}
		while (anyPartialMatches(quicktime, currentWords) && (attempts++ < maxAttempts))
		object.quicktime = quicktime

		// Append object to wordsInUse.
		currentWords.push([object.word, object.quicktime, object])

		// If not in menu, also generate cypher string.
		if (!menu && missionMode && currentBossType() == Cypher)
		{
			do { object.cypherString = [...Array(Random.chance(.5) ? 4 : 5)].map(() => Random.sample(alphabets)).join("") }
			while (
				anyPartialMatches(object.cypherString, cyphersInUse) ||
				anyPartialMatches(object.cypherString, currentWords) ||
				bannedWords.includes(object.cypherString)
			)
			object.cypherStringVariants = [{ word: object.cypherString, increments: Array(object.cypherString.length).fill(1) }]
			object.cypherQuicktimeString = getCypherQuicktime(5, currentWords)
			cyphersInUse.push([object.cypherString, object.cypherQuicktimeString, object])
		}
		else object.cypherString = null
	}

	// Generate possible word variants.
	global.generateVariants = function(word)
	{
		switch(currentGameLanguage)
		{
			case "japanese":
				return generateRomajiVariants(word)
			
			case "koreana":
				return generateKoreanVariants(word)
			
			case "schinese":
				return generateSChineseVariants(word)

			default:
				let variants = [
					{
						word: word,
						increments: Array(word.length).fill(1)
					}
				]
				for (let k = 0; k < word.length; k++)
				{
					let char = word[k]
					if (char in specialCharacterFallback)
					{
						let currentVariantCount = variants.length
						for (let i = 0; i < currentVariantCount; i++)
							for (let j = 0; j < specialCharacterFallback[char].length; j++)
							{
								let variantString = specialCharacterFallback[char][j]
								let increments = [...variants[i].increments]
								increments.splice(k, 1, variantString.length)
								variants.push({
									word: variants[i].word.replace(char, variantString),
									increments: increments
								})
							}
					}
				}
				return variants
		}
	}

	// Regex filter for non-latin characters.
	global.onlyLatinCharacters = new RegExp("^[a-z\-\,\.\"\?\(\) ]*$")

	// Generate Romaji variants from Hiragana.
	global.generateRomajiVariants = function(hiragana)
	{
		let variants = [
			{
				word: hiragana,
				increments: Array(hiragana.length).fill(1)
			}
		]
		for (let m = 3; m > 0; m--)
			for (let k = 0; k <= hiragana.length - m; k++)
			{
				let char = hiragana.substring(k, k + m)
				if (char in hiraganaRomajiConversion)
				{
					let currentVariantCount = variants.length
					for (let i = 0; i < currentVariantCount; i++)
						if (!variants[i].word.includes(char))
							continue
						else
							for (let j = 0; j < hiraganaRomajiConversion[char].length; j++)
							{
								let variantString = hiraganaRomajiConversion[char][j]
								let increments = [...variants[i].increments]
								let args = [k, m, variantString.length].concat(Array(m - 1).fill(0))
								Array.prototype.splice.apply(increments, args)
								variants.push({
									word: variants[i].word.replace(char, variantString),
									increments: increments
								})
							}
				}
			}
		return variants.filter(variant => onlyLatinCharacters.test(variant.word))
	}

	// Special async version for Japanese Poet, because it can take a long time.
	global.generateRomajiVariantsAsync = async function(hiragana)
	{
		let variants = [
			{
				word: hiragana,
				increments: Array(hiragana.length).fill(1)
			}
		]
		let generateRomajiVariants = async function(variants, hiragana)
		{
			let timeStart = Date.now()
			for (let m = 3; m > 0; m--)
				for (let k = 0; k <= hiragana.length - m; k++)
				{
					let char = hiragana.substring(k, k + m)
					if (char in hiraganaRomajiConversion)
					{
						let currentVariantCount = variants.length
						for (let i = 0; i < currentVariantCount; i++)
							if (!variants[i].word.includes(char))
								continue
							else
								for (let j = 0; j < hiraganaRomajiConversion[char].length; j++)
								{
									// If taking too long, continue next frame.
									if (Date.now() - timeStart > 1)
									{
										await Sphere.sleep(1)
										timeStart = Date.now()
									}

									let variantString = hiraganaRomajiConversion[char][j]
									let increments = [...variants[i].increments]
									let args = [k, m, variantString.length].concat(Array(m - 1).fill(0))
									Array.prototype.splice.apply(increments, args)
									variants.push({
										word: variants[i].word.replace(char, variantString),
										increments: increments
									})
								}
					}

				}
			return variants
		}
		let result = await generateRomajiVariants(variants, hiragana)
		return result.filter(variant => onlyLatinCharacters.test(variant.word))
	}

	// Generate Korean variants.
	global.generateKoreanVariants = function(korean)
	{
		return [
			Array.from(korean).reduce (
				(result, char) => {
					let hangul = Hangul.disassemble(char)
					let hangulKeys = Array.from(hangul).reduce((keys, glyph) => { return keys += glyph in koreanToQwerty ? koreanToQwerty[glyph] : glyph }, "")
					result.word += hangulKeys
					result.increments.push(hangulKeys.length)
					return result
				},
				{ word: "", increments: [] }
			)
		]
	}

	global.generateSChineseVariants = function(chinese)
	{
		let generatedPinyin = chinese in simplifiedChineseOverride ?
			simplifiedChineseOverride[chinese] :
			pinyin.pinyin (
				chinese,
				{
					style: pinyin.STYLE_NORMAL,
					segment: "segmentit",
					heteronym: chinese.length == 1 ? true : false
				}
			)
		let variants = chinese.length == 1 ?
			generatedPinyin[0].reduce(
				(result, char) => {
					result.push({
						word: char,
						increments: [char.length]
					})
					return result
				}, []) :
			[generatedPinyin.reduce (
				(result, char) => {
					result.word += char[0]
					result.increments.push(char[0].length)
					return result
				},
				{ word: "", increments: []}
			)]
		return variants.reduce((result, variant) => {
			let differentTypings = [variant]

			// Allow all "v"s to be typed with "u".
			while (differentTypings[differentTypings.length - 1].word.includes("v"))
			{
				let current = differentTypings[differentTypings.length - 1]
				differentTypings.push({ word: current.word.replace("v", "u"), increments: current.increments})
			}
			
			// Allow "u"s in certain combinations to be typed with "v".
			["ju", "qu", "xu", "yu"].forEach(exception => {
				while (differentTypings[differentTypings.length - 1].word.includes(exception))
				{
					let current = differentTypings[differentTypings.length - 1]
					differentTypings.push({ word: current.word.replace(exception, exception.replace("u", "v")), increments: current.increments })
				}
			})
			return result.concat(differentTypings)
		}, [])
	}

	global.getCypherQuicktime = function(length, currentWords, checkForPartialMatch = true)
	{
		const quicktime = [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13]
		let cypherQuicktime
		let attempts = 0
		do {
			cypherQuicktime = []
			for (let i = 0; i < length; i++)
				cypherQuicktime.push(quicktime[Random.discrete(0, quicktime.length - 1)])
		}
		while (
			checkForPartialMatch ? 
			(
				(anyPartialMatches(cypherQuicktime, cyphersInUse) ||
					anyPartialMatches(cypherQuicktime, currentWords))
				&& (attempts++ < 1000)
			)
			: false
		)
		return cypherQuicktime
	}

	global.anyPartialMatches = function(needle, haystack)
	{
		for (let i = 0; i < needle.length; i++)
		{
			let partial = needle.slice(0, i + 1)
			if (typeof needle === 'string')
			{
				if (haystack.some(v => v[0] === partial))
					return true
			}
			else
			{
				if (haystack.some(v => v[1].equals(partial)))
					return true
			}
		}
		return false
	}

	// Clear Menu words.
	global.clearMenuWords = function()
	{
		for (let i = wordsInUseMenu.length - 1; i >= 0; i--)
			removeWord(wordsInUseMenu[i][2], true)
	}

	// Helper function to remove object from words in use list.
	global.removeWord = function(object, menu = false)
	{
		// Remove word.
		let currentWords = menu ? wordsInUseMenu : wordsInUse
		let currentIndex = currentWords.findIndex(arr => arr[2] == object)
		if (currentIndex >= 0)
		{
			currentWords[currentIndex] = currentWords[currentWords.length - 1]
			currentWords.pop()
		}
		object.word = null

		// Remove Ciphered string.
		if (object.cypherString)
		{
			currentIndex = cyphersInUse.findIndex(arr => arr[2] == object)
			if (currentIndex >= 0)
			{
				cyphersInUse[currentIndex] = cyphersInUse[cyphersInUse.length - 1]
				cyphersInUse.pop()
			}
		}
		object.cypherString = null

		// Clear Korean glyph surface.
		if (object.wordSurface) object.wordSurface = null
	}

	global.getQuickTimeString = function(quicktime)
	{
		let result = ""
		for (const glyph of quicktime)
		{
			//If using Steam Input, get button origin.
			if (steamEnabled)
			{
				let glyphOrigin = control.getSteamButtonOrigin(glyph)
				if (glyphOrigin)
				{
					switch (glyphOrigin)
					{
						// Directional buttons.

						case EInputActionOrigin.k_EInputActionOrigin_PS4_DPad_North:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_DPad_North:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_DPad_North:
						case EInputActionOrigin.k_EInputActionOrigin_Switch_DPad_North:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_DPad_North:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_DPad_North:
							result += ''
							break
						
						case EInputActionOrigin.k_EInputActionOrigin_PS4_DPad_South:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_DPad_South:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_DPad_South:
						case EInputActionOrigin.k_EInputActionOrigin_Switch_DPad_South:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_DPad_South:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_DPad_South:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_PS4_DPad_West:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_DPad_West:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_DPad_West:
						case EInputActionOrigin.k_EInputActionOrigin_Switch_DPad_West:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_DPad_West:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_DPad_West:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_PS4_DPad_East:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_DPad_East:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_DPad_East:
						case EInputActionOrigin.k_EInputActionOrigin_Switch_DPad_East:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_DPad_East:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_DPad_East:
							result += ''
							break

						// Action buttons.

						case EInputActionOrigin.k_EInputActionOrigin_PS4_X:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_X:
							result += ''
							break
							
						case EInputActionOrigin.k_EInputActionOrigin_PS4_Circle:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_Circle:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_PS4_Triangle:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_Triangle:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_PS4_Square:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_Square:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_SteamController_A:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_A:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_A:
						case EInputActionOrigin.k_EInputActionOrigin_Switch_A:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_A:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_SteamController_B:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_B:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_B:
						case EInputActionOrigin.k_EInputActionOrigin_Switch_B:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_B:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_SteamController_X:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_X:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_X:
						case EInputActionOrigin.k_EInputActionOrigin_Switch_X:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_X:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_SteamController_Y:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_Y:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_Y:
						case EInputActionOrigin.k_EInputActionOrigin_Switch_Y:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_Y:
							result += ''
							break
						
						// Shoulder buttons.

						case EInputActionOrigin.k_EInputActionOrigin_PS4_LeftBumper:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_LeftBumper:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_L1:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_SteamController_LeftBumper:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_LeftBumper:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_LeftBumper:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_Switch_LeftBumper:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_PS4_RightBumper:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_RightBumper:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_R1:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_SteamController_RightBumper:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_RightBumper:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_RightBumper:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_Switch_RightBumper:
							result += ''
							break
						
						// Triggers.

						case EInputActionOrigin.k_EInputActionOrigin_PS4_LeftTrigger_Pull:
						case EInputActionOrigin.k_EInputActionOrigin_PS4_LeftTrigger_Click:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_LeftTrigger_Pull:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_LeftTrigger_Click:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_L2_SoftPull:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_L2:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_SteamController_LeftTrigger_Pull:
						case EInputActionOrigin.k_EInputActionOrigin_SteamController_LeftTrigger_Click:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_LeftTrigger_Pull:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_LeftTrigger_Click:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_LeftTrigger_Pull:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_LeftTrigger_Click:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_Switch_LeftTrigger_Pull:
						case EInputActionOrigin.k_EInputActionOrigin_Switch_LeftTrigger_Click:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_PS4_RightTrigger_Pull:
						case EInputActionOrigin.k_EInputActionOrigin_PS4_RightTrigger_Click:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_RightTrigger_Pull:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_RightTrigger_Click:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_R2_SoftPull:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_R2:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_SteamController_RightTrigger_Pull:
						case EInputActionOrigin.k_EInputActionOrigin_SteamController_RightTrigger_Click:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_RightTrigger_Pull:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_RightTrigger_Click:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_RightTrigger_Pull:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_RightTrigger_Click:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_Switch_RightTrigger_Pull:
						case EInputActionOrigin.k_EInputActionOrigin_Switch_RightTrigger_Click:
							result += ''
							break
						
						// Analog Sticks.

						case EInputActionOrigin.k_EInputActionOrigin_PS4_LeftStick_Click:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_LeftStick_Click:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_L3:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_PS4_RightStick_Click:
						case EInputActionOrigin.k_EInputActionOrigin_PS5_RightStick_Click:
						case EInputActionOrigin.k_EInputActionOrigin_SteamDeck_R3:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_SteamController_LeftStick_Click:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_LeftStick_Click:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_LeftStick_Click:
						case EInputActionOrigin.k_EInputActionOrigin_Switch_LeftStick_Click:
							result += ''
							break

						case EInputActionOrigin.k_EInputActionOrigin_SteamController_RightPad_Click:
						case EInputActionOrigin.k_EInputActionOrigin_XBoxOne_RightStick_Click:
						case EInputActionOrigin.k_EInputActionOrigin_XBox360_RightStick_Click:
						case EInputActionOrigin.k_EInputActionOrigin_Switch_RightStick_Click:
							result += ''
							break
						
						// In-case no matches at all.
						default:
							result += ''
							break
					}
				}
				else
					result += getXboxGlyph(glyph)
			}

			// Else, use Xbox default.
			else
				result += getXboxGlyph(glyph)
		}
		return result
	}

	global.getXboxGlyph = function(glyph)
	{
		switch(glyph)
		{
			case direction_up: return ''
			case direction_down: return ''
			case direction_left: return ''
			case direction_right: return ''
			case button_top: return ''
			case button_bottom: return ''
			case button_left: return ''
			case button_right: return ''
			case stick_down_left: return ''
			case stick_down_right: return ''
			case shoulder_button_left: return ''
			case shoulder_button_right: return ''
			case shoulder_trigger_left: return ''
			case shoulder_trigger_right: return ''
		}
	}

	global.countMatchAllVariants = function(variants, array2)
	{
		return variants.reduce (
			(t, c) => {

				// See if there is a match for this variant.
				let m = countMatch(c.word, array2)

				// If complete match, return.
				if (m == c.word.length)
					return { match: c.increments.length, matchActual: c.word.length, word: c.word }

				// Otherwise, if any matches, check match adjusted for multi-char variants.
				if (m > 0)
				{
					let actual = m
					let total = c.word.length
					for (let i = c.increments.length - 1; i >= 0; i--)
					{
						total -= c.increments[i]
						if (total <= m)
						{
							let charGroupSize = 1
							for (let k = i + 1; k < c.increments.length; k++)
								if (c.increments[k] == 0)
									charGroupSize++
							let percentageOfCharGroupMatched = (m - total) / c.increments[i]
							let actualCharInGroupMatched = percentageOfCharGroupMatched * charGroupSize
							m = i + actualCharInGroupMatched
							break
						}
					}

					// Compare with current and return longest match.
					return m > t.match || m == t.match && actual > t.matchActual ? { match: m, matchActual: actual, word: c.word } : t
				}

				// Else keep current.
				else return t
			},
			{ match: 0, matchActual: 0, word: null }
		)
	}

	global.countMatch = function(array1, array2)
	{
		let result = 0
		for (let currentLength = array1.length; currentLength > 0; currentLength--)
			if (isMatch(array1, array2, currentLength))
			{
				result = currentLength
				break
			}
		return result
	}

	global.isMatch = function(array1, array2, length)
	{
		for (let currentChar = 0; currentChar < length; currentChar++)
			 if (array1[currentChar] != array2[array2.length - length + currentChar])
				 return false
		 return true
	}
})()

function getWordsOfLength(length)
{
	// Verify length.
	if (length < 4) {
		length = 4
	}
	else if (length > 8) {
		length = 8
	}
	let wordlist = wordlists[currentGameLanguage] ?
		wordlists[currentGameLanguage] :
		wordlists.english
	return wordlist[length.toString()]
}
