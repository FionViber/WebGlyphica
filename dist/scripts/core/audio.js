import { Tween, Easing, Random } from 'sphere-runtime'

let recentHooks = new Map()
function wasRecentlyPlayed(hook) {
    const storedHook = recentHooks.get(hook)
    if (storedHook && storedHook > global.timeLastFrame) {
        return true
    }
    else {
        recentHooks.set(hook, global.timeLastFrame + global.expectedFrameTime * 2)
        return false
    }
}

export class Audio {
    constructor() {
        // Audio
        this.sfxMixer = null
        this.ingameMixer = null
        this.bgmMixer = null

        this.audioHooks = {}
        this.sounds = {}
        this.music = {}

        this.enabled = false;

        if ( !Sphere.audioEnabled() )
            return

        this.enabled = true;
        this.sfxMixer = new Mixer(44100, 16)
        this.ingameMixer = new Mixer(44100, 16)
        this.ingameMixer.attachMixer(this.sfxMixer)
        this.bgmMixer = new Mixer(44100, 16)

		this.inGameVolumeTween = new Tween(this.ingameMixer, Easing.Linear)
    }

    getBgmVolume() { return this.enabled ? this.bgmMixer.volume : 0 }
    setBgmVolume(volume) {
        if (this.enabled)
            this.bgmMixer.volume = volume
    }
    getSfxVolume() { return this.enabled ? this.sfxMixer.volume : 0 }
    setSfxVolume(volume) {
        if (this.enabled)
            this.sfxMixer.volume = volume
    }
    getInGameVolume() { return this.enabled ? this.ingameMixer.volume : 0 }
    setInGameVolume(volume) {
        if (this.enabled)
            this.ingameMixer.volume = volume
    }

    fadeInGameVolume(target)
    {
        if(this.enabled)
            this.inGameVolumeTween.easeIn({volume: target}, 10)
    }

    //Opts = {pan, loop}
    playAudioHookInternal(hook, mixer, opts) {
        if (!this.enabled || !(hook in this.audioHooks && (opts.loop || !wasRecentlyPlayed(hook))))
            return null

        const soundName = this.audioHooks[hook].constructor === Array ? Random.sample(this.audioHooks[hook]) : this.audioHooks[hook]

        if (!(soundName in this.sounds))
            return null

        return this.sounds[soundName].play(mixer, opts)
    }
    playAudioHook(hook, pan = 0, loop = false) { return this.playAudioHookInternal(hook, this.ingameMixer, { pan, loop }) }
    playAudioHookUI(hook) { this.playAudioHookInternal(hook, this.sfxMixer, { pan: 0, loop: false }) }
    playAudioHookBGM(hook) { this.playAudioHookInternal(hook, this.bgmMixer, { pan: 0, loop: false }) }
}