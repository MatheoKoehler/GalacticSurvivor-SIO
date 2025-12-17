// ========================================
// GALACTIC SURVIVOR - Point d'Entrée
// ========================================

import { Game } from './game.js';
import { UI } from './ui.js';
import { SaveManager } from './save.js';
import { AudioManager } from './audio.js';

// === INITIALISATION ===
class GalacticSurvivor {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Gestionnaires
        this.saveManager = new SaveManager();
        this.audioManager = new AudioManager(this.saveManager);
        this.ui = new UI(this.saveManager);
        this.game = new Game(
            this.canvas, 
            this.ctx, 
            this.ui, 
            this.saveManager, 
            this.audioManager
        );
        
        this.init();
    }
    
    async init() {
        // Initialiser l'audio au premier clic
        document.addEventListener('click', () => {
            this.audioManager.init();
        }, { once: true });
        
        document.addEventListener('keydown', () => {
            this.audioManager.init();
        }, { once: true });
        
        // Cacher l'écran de chargement et afficher le menu
        await this.simulateLoading();
        this.ui.showTitleScreen();
        
        console.log('🚀 Galactic Survivor initialized!');
    }
    
    async simulateLoading() {
        // Petit délai pour l'effet de chargement
        return new Promise(resolve => {
            setTimeout(() => {
                document.getElementById('loading-screen')?.classList.add('hidden');
                resolve();
            }, 500);
        });
    }
}


// === DÉMARRAGE ===
document.addEventListener('DOMContentLoaded', () => {
    window.game = new GalacticSurvivor();
});

// === PRÉVENTION DES ERREURS ===
window.addEventListener('error', (e) => {
    console.error('Game Error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
});

// === SERVICE WORKER (optionnel pour PWA) ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}