// ======================
// AUDIO VARIABLES
// ======================

let musicVolume = localStorage.getItem("galaxyMusicVolume") !== null ? parseFloat(localStorage.getItem("galaxyMusicVolume")) : 0.5;
let sfxVolume = localStorage.getItem("galaxySFXVolume") !== null ? parseFloat(localStorage.getItem("galaxySFXVolume")) : 0.5;

if (isNaN(musicVolume)) musicVolume = 0.5;
if (isNaN(sfxVolume)) sfxVolume = 0.5;

const shootSound = new Audio("assets/audio/shoot.mp3");
const explosionSound = new Audio("assets/audio/explosion.mp3");
const damageSound = new Audio("assets/audio/damage.mp3");
const levelupSound = new Audio("assets/audio/levelup.mp3");
const gameoverSound = new Audio("assets/audio/gameover.mp3");
const victorySound = new Audio("assets/audio/victory.mp3");
const bgMusic = new Audio("assets/audio/bgmusic.mp3");

// BG Music setting
bgMusic.loop = true;

// Set initial volumes
applyAudioVolumes();

// ======================
// AUDIO METHODS
// ======================

function applyAudioVolumes() {
    bgMusic.volume = musicVolume;
    shootSound.volume = sfxVolume;
    explosionSound.volume = sfxVolume;
    damageSound.volume = sfxVolume;
    levelupSound.volume = sfxVolume;
    gameoverSound.volume = sfxVolume;
    victorySound.volume = sfxVolume;
}

function setMusicVolume(vol) {
    musicVolume = Math.max(0, Math.min(1, vol));
    bgMusic.volume = musicVolume;
    localStorage.setItem("galaxyMusicVolume", musicVolume);
}

function setSFXVolume(vol) {
    sfxVolume = Math.max(0, Math.min(1, vol));
    applyAudioVolumes();
    localStorage.setItem("galaxySFXVolume", sfxVolume);
}

function playSFX(audio) {
    if (!audio) return;
    try {
        audio.currentTime = 0;
        audio.volume = sfxVolume;
        audio.play().catch(e => console.log("SFX play prevented:", e));
    } catch (e) {
        console.error("SFX error:", e);
    }
}
