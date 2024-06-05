import { AudioClip, AudioSource, Node, Scene, director, resources } from "cc";

export default class AudioMgr {
    private _currentScene: Scene = null;
    private _musicSource: AudioSource = null;
    private _effectSource: AudioSource = null;
    private _musicVolume: number = 1.0;
    private _effectVolume: number = 1.0;

    private _music_key = "localMusicVolume";
    private _effect_key = "localEffectVolume";

    public get musicVolume(): number {
        return this._musicVolume;
    }
    public get effectVolume(): number {
        return this._effectVolume;
    }

    constructor() {}

    public prepareAudioSource() {
        this._currentScene = director.getScene();
        const musicNode = new Node();
        musicNode.name = "__audioMgr_music";
        this._musicSource = musicNode.addComponent(AudioSource);
        this._currentScene.addChild(musicNode);

        const effectNode = new Node();
        effectNode.name = "__audioMgr_effect";
        this._effectSource = effectNode.addComponent(AudioSource);
        this._currentScene.addChild(effectNode);

        const localMusicVolume = localStorage.getItem(this._music_key);
        if (localMusicVolume != null) {
            this._musicVolume = parseFloat(localMusicVolume);
        }
        this._musicSource.volume = this._musicVolume;

        const localEffectVolume = localStorage.getItem(this._effect_key);
        if (localEffectVolume != null) {
            this._effectVolume = parseFloat(localEffectVolume);
        }
        this._effectSource.volume = this._effectVolume;
    }

    public async playMusic(clip: AudioClip, loop: boolean = false) {
        if (clip == null) {
            return;
        }
        this._musicSource.stop();
        this._musicSource.clip = clip;
        this._musicSource.loop = loop;
        this._musicSource.play();
    }
    public stopMusic() {
        this._musicSource.stop();
    }

    public changeMusicVolume(volume: number) {
        this._musicVolume = volume;
        this._musicSource.volume = volume;

        localStorage.setItem(this._music_key, volume.toString());
    }

    public playEffect(clip: AudioClip) {
        if (clip == null) {
            return;
        }
        this._effectSource.playOneShot(clip);
    }

    public changeEffectVolume(volume: number) {
        this._effectVolume = volume;
        this._effectSource.volume = volume;

        localStorage.setItem(this._effect_key, volume.toString());
    }
}
