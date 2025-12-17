// ========================================
// GALACTIC SURVIVOR - Système Audio
// ========================================

export class AudioManager {
    constructor(saveManager) {
        this.save = saveManager;
        this.sounds = {};
        this.music = null;
        this.currentMusicId = null;
        
        this.musicVolume = this.save.getSetting('musicVolume') / 100;
        this.sfxVolume = this.save.getSetting('sfxVolume') / 100;
        
        this.audioContext = null;
        this.initialized = false;
    }
    
    async init() {
        // Créer le contexte audio au premier clic
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('AudioContext not supported');
            }
        }
        
        // Charger les sons (si vous avez des fichiers audio)
        // await this.loadSounds();
        
        this.initialized = true;
    }
    
    async loadSounds() {
        const soundList = [
            { id: 'laser', src: 'assets/audio/laser.mp3' },
            { id: 'explosion', src: 'assets/audio/explosion.mp3' },
            { id: 'pickup', src: 'assets/audio/pickup.mp3' },
            { id: 'levelup', src: 'assets/audio/levelup.mp3' },
            { id: 'hit', src: 'assets/audio/hit.mp3' },
            { id: 'death', src: 'assets/audio/death.mp3' },
            { id: 'select', src: 'assets/audio/select.mp3' }
        ];
        
        for (const sound of soundList) {
            try {
                const audio = new Audio();
                audio.src = sound.src;
                audio.preload = 'auto';
                this.sounds[sound.id] = audio;
            } catch (e) {
                console.warn(`Failed to load sound: ${sound.id}`);
            }
        }
    }
    
    play(soundId, volume = 1) {
        if (!this.initialized) return;
        
        const sound = this.sounds[soundId];
        if (sound) {
            try {
                const clone = sound.cloneNode();
                clone.volume = this.sfxVolume * volume;
                clone.play().catch(() => {});
            } catch (e) {
                // Ignorer les erreurs audio
            }
        } else {
            // Fallback: générer un son avec Web Audio API
            this.playGeneratedSound(soundId);
        }
    }
    
    playGeneratedSound(type) {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            const now = this.audioContext.currentTime;
            
            switch (type) {
                case 'laser':
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(880, now);
                    oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.1);
                    gainNode.gain.setValueAtTime(this.sfxVolume * 0.1, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    oscillator.start(now);
                    oscillator.stop(now + 0.1);
                    break;
                    
                case 'explosion':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(150, now);
                    oscillator.frequency.exponentialRampToValueAtTime(20, now + 0.3);
                    gainNode.gain.setValueAtTime(this.sfxVolume * 0.15, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    oscillator.start(now);
                    oscillator.stop(now + 0.3);
                    break;
                    
                case 'pickup':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(440, now);
                    oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.1);
                    gainNode.gain.setValueAtTime(this.sfxVolume * 0.08, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    oscillator.start(now);
                    oscillator.stop(now + 0.1);
                    break;
                    
                case 'levelup':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(440, now);
                    oscillator.frequency.setValueAtTime(550, now + 0.1);
                    oscillator.frequency.setValueAtTime(660, now + 0.2);
                    oscillator.frequency.setValueAtTime(880, now + 0.3);
                    gainNode.gain.setValueAtTime(this.sfxVolume * 0.1, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    oscillator.start(now);
                    oscillator.stop(now + 0.5);
                    break;
                    
                case 'hit':
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(200, now);
                    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.05);
                    gainNode.gain.setValueAtTime(this.sfxVolume * 0.08, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                    oscillator.start(now);
                    oscillator.stop(now + 0.05);
                    break;
                    
                case 'select':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(600, now);
                    gainNode.gain.setValueAtTime(this.sfxVolume * 0.05, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    oscillator.start(now);
                    oscillator.stop(now + 0.08);
                    break;
            }
        } catch (e) {
            // Ignorer les erreurs
        }
    }
    
    playMusic(musicId) {
        // Implémentation basique - vous pouvez ajouter des fichiers musicaux
        if (this.currentMusicId === musicId) return;
        
        this.stopMusic();
        this.currentMusicId = musicId;
        
        // Si vous avez des fichiers de musique:
        // const music = new Audio(`assets/audio/music_${musicId}.mp3`);
        // music.loop = true;
        // music.volume = this.musicVolume;
        // this.music = music;
        // music.play().catch(() => {});
    }
    
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
            this.music = null;
        }
        this.currentMusicId = null;
    }
    
    setMusicVolume(volume) {
        this.musicVolume = volume;
        if (this.music) {
            this.music.volume = volume;
        }
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = volume;
    }
    
    updateFromSettings() {
        this.musicVolume = this.save.getSetting('musicVolume') / 100;
        this.sfxVolume = this.save.getSetting('sfxVolume') / 100;
        this.setMusicVolume(this.musicVolume);
    }
}