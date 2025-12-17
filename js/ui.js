// ========================================
// GALACTIC SURVIVOR - Interface Utilisateur
// ========================================

import { CHARACTERS, MAPS, WEAPONS, PASSIVES, TALENTS, ENEMIES } from './constants.js';
import { formatTime, formatNumber } from './utils.js';

export class UI {
    constructor(saveManager) {
        this.save = saveManager;
        this.selectedCharacter = 'commander';
        this.selectedMap = 'station';
        this.currentScreen = 'loading';
        
        // Callbacks
        this.onStartGame = null;
        this.onResumeGame = null;
        this.onQuitGame = null;
        this.onUpgradeSelected = null;
        this.onRerollRequest = null;
        
        // Reroll
        this.rerollsRemaining = 1;
        this.currentChoices = [];
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.updateCreditsDisplay();
    }
    
    cacheElements() {
        // Écrans
        this.screens = {
            loading: document.getElementById('loading-screen'),
            title: document.getElementById('title-screen'),
            characterSelect: document.getElementById('character-select'),
            mapSelect: document.getElementById('map-select'),
            talents: document.getElementById('talents-screen'),
            collection: document.getElementById('collection-screen'),
            options: document.getElementById('options-screen'),
            game: document.getElementById('game-canvas'),
            hud: document.getElementById('hud'),
            levelup: document.getElementById('levelup-screen'),
            pause: document.getElementById('pause-screen'),
            gameover: document.getElementById('gameover-screen'),
            victory: document.getElementById('victory-screen')
        };
        
        // HUD elements
        this.hud = {
            healthFill: document.getElementById('health-fill'),
            healthText: document.getElementById('health-text'),
            xpFill: document.getElementById('xp-fill'),
            levelDisplay: document.getElementById('current-level'),
            timer: document.getElementById('timer'),
            waveIndicator: document.getElementById('wave-indicator'),
            kills: document.getElementById('kills'),
            gold: document.getElementById('gold'),
            weaponsDisplay: document.getElementById('weapons-display'),
            passivesDisplay: document.getElementById('passives-display'),
            bossContainer: document.getElementById('boss-health-container'),
            bossName: document.getElementById('boss-name'),
            bossFill: document.getElementById('boss-health-fill')
        };
        
        // Autres éléments
        this.elements = {
            totalCredits: document.getElementById('total-credits'),
            characterGrid: document.getElementById('character-grid'),
            characterInfo: document.getElementById('character-info'),
            mapGrid: document.getElementById('map-grid'),
            mapInfo: document.getElementById('map-info'),
            talentGrid: document.getElementById('talent-grid'),
            talentCredits: document.getElementById('talent-credit-count'),
            collectionContent: document.getElementById('collection-content'),
            upgradeChoices: document.getElementById('upgrade-choices'),
            rerollBtn: document.getElementById('btn-reroll'),
            rerollCount: document.getElementById('reroll-count')
        };
    }
    
    setupEventListeners() {
        // Menu principal
        document.getElementById('btn-play')?.addEventListener('click', () => this.showCharacterSelect());
        document.getElementById('btn-characters')?.addEventListener('click', () => this.showCharacterSelect());
        document.getElementById('btn-talents')?.addEventListener('click', () => this.showTalents());
        document.getElementById('btn-collection')?.addEventListener('click', () => this.showCollection());
        document.getElementById('btn-options')?.addEventListener('click', () => this.showOptions());
        
        // Sélection personnage
        document.getElementById('btn-back-char')?.addEventListener('click', () => this.showTitleScreen());
        document.getElementById('btn-select-char')?.addEventListener('click', () => this.showMapSelect());
        
        // Sélection map
        document.getElementById('btn-back-map')?.addEventListener('click', () => this.showCharacterSelect());
        document.getElementById('btn-start-game')?.addEventListener('click', () => this.startGame());
        
        // Talents
        document.getElementById('btn-back-talents')?.addEventListener('click', () => this.showTitleScreen());
        
        // Collection
        document.getElementById('btn-back-collection')?.addEventListener('click', () => this.showTitleScreen());
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchCollectionTab(e.target.dataset.tab));
        });
        
        // Options
        document.getElementById('btn-back-options')?.addEventListener('click', () => this.showTitleScreen());
        document.getElementById('btn-reset-save')?.addEventListener('click', () => this.confirmResetSave());
        
        this.setupOptionSliders();
        
        // Pause
        document.getElementById('btn-resume')?.addEventListener('click', () => {
            if (this.onResumeGame) this.onResumeGame();
        });
        document.getElementById('btn-quit')?.addEventListener('click', () => {
            if (this.onQuitGame) this.onQuitGame();
        });
        
        // Game Over
        document.getElementById('btn-retry')?.addEventListener('click', () => this.startGame());
        document.getElementById('btn-menu')?.addEventListener('click', () => this.showTitleScreen());
        
        // Victory
        document.getElementById('btn-victory-continue')?.addEventListener('click', () => this.showTitleScreen());
        document.getElementById('btn-victory-menu')?.addEventListener('click', () => this.showTitleScreen());
        
        // Reroll
        this.elements.rerollBtn?.addEventListener('click', () => this.rerollUpgrades());
    }
    
    setupOptionSliders() {
        const musicSlider = document.getElementById('music-volume');
        const sfxSlider = document.getElementById('sfx-volume');
        
        if (musicSlider) {
            musicSlider.value = this.save.getSetting('musicVolume') || 50;
            musicSlider.addEventListener('input', (e) => {
                this.save.setSetting('musicVolume', parseInt(e.target.value));
                const valDisplay = document.getElementById('music-vol-val');
                if (valDisplay) valDisplay.textContent = e.target.value + '%';
            });
        }
        
        if (sfxSlider) {
            sfxSlider.value = this.save.getSetting('sfxVolume') || 70;
            sfxSlider.addEventListener('input', (e) => {
                this.save.setSetting('sfxVolume', parseInt(e.target.value));
                const valDisplay = document.getElementById('sfx-vol-val');
                if (valDisplay) valDisplay.textContent = e.target.value + '%';
            });
        }
        
        const screenShake = document.getElementById('screen-shake');
        if (screenShake) {
            screenShake.checked = this.save.getSetting('screenShake') !== false;
            screenShake.addEventListener('change', (e) => {
                this.save.setSetting('screenShake', e.target.checked);
            });
        }
    }
    
    // === NAVIGATION ===
    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.add('hidden');
        });
    }
    
    showScreen(screenName) {
        // Cacher tous les écrans sauf le jeu et le HUD si on montre le level-up ou la pause
        if (screenName === 'levelup' || screenName === 'pause') {
            // Ne pas cacher le canvas et le HUD
            this.screens.levelup?.classList.add('hidden');
            this.screens.pause?.classList.add('hidden');
            this.screens.gameover?.classList.add('hidden');
            this.screens.victory?.classList.add('hidden');
        } else {
            this.hideAllScreens();
        }
        
        // Afficher l'écran demandé
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
        }
        
        this.currentScreen = screenName;
    }
    
    showTitleScreen() {
        this.hideAllScreens();
        this.screens.title?.classList.remove('hidden');
        this.currentScreen = 'title';
        this.updateCreditsDisplay();
    }
    
    showCharacterSelect() {
        this.hideAllScreens();
        this.screens.characterSelect?.classList.remove('hidden');
        this.currentScreen = 'characterSelect';
        this.renderCharacterGrid();
        this.updateCharacterInfo();
    }
    
    showMapSelect() {
        this.hideAllScreens();
        this.screens.mapSelect?.classList.remove('hidden');
        this.currentScreen = 'mapSelect';
        this.renderMapGrid();
        this.updateMapInfo();
    }
    
    showTalents() {
        this.hideAllScreens();
        this.screens.talents?.classList.remove('hidden');
        this.currentScreen = 'talents';
        this.renderTalentGrid();
    }
    
    showCollection(tab = 'weapons') {
        this.hideAllScreens();
        this.screens.collection?.classList.remove('hidden');
        this.currentScreen = 'collection';
        this.switchCollectionTab(tab);
    }
    
    showOptions() {
        this.hideAllScreens();
        this.screens.options?.classList.remove('hidden');
        this.currentScreen = 'options';
    }
    
    showGame() {
        this.hideAllScreens();
        this.screens.game?.classList.remove('hidden');
        this.screens.hud?.classList.remove('hidden');
        this.currentScreen = 'game';
    }
    
    hideGame() {
        this.screens.game?.classList.add('hidden');
        this.screens.hud?.classList.add('hidden');
    }
    
    // === CRÉDITS ===
    updateCreditsDisplay() {
        const gold = this.save.getGold();
        if (this.elements.totalCredits) {
            this.elements.totalCredits.textContent = formatNumber(gold);
        }
        if (this.elements.talentCredits) {
            this.elements.talentCredits.textContent = formatNumber(gold);
        }
    }
    
    // === PERSONNAGES ===
    renderCharacterGrid() {
        const grid = this.elements.characterGrid;
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (const [id, char] of Object.entries(CHARACTERS)) {
            const isUnlocked = this.save.isCharacterUnlocked(id);
            const isSelected = id === this.selectedCharacter;
            
            const card = document.createElement('div');
            card.className = `character-card ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}`;
            card.dataset.id = id;
            
            card.innerHTML = `
                <div class="character-avatar">${char.icon}</div>
                <h4>${char.name}</h4>
                <p style="font-size: 0.7rem; color: var(--text-dim);">
                    ${isUnlocked ? (char.passive?.name || 'Passif') : '???'}
                </p>
            `;
            
            if (isUnlocked) {
                card.addEventListener('click', () => {
                    this.selectedCharacter = id;
                    this.renderCharacterGrid();
                    this.updateCharacterInfo();
                });
            }
            
            grid.appendChild(card);
        }
    }
    
    updateCharacterInfo() {
        const char = CHARACTERS[this.selectedCharacter];
        if (!char) return;
        
        const nameEl = document.getElementById('char-name');
        const loreEl = document.getElementById('char-lore');
        const statsDiv = document.getElementById('char-stats');
        const passiveDiv = document.getElementById('char-passive');
        
        if (nameEl) nameEl.textContent = char.name;
        if (loreEl) loreEl.textContent = char.lore || '';
        
        if (statsDiv) {
            const weaponName = WEAPONS[char.startingWeapon]?.name || 'Blaster';
            statsDiv.innerHTML = `
                <p>❤️ Vie: ${char.stats?.hp || 100} | ⚡ Vitesse: ${Math.round((char.stats?.speed || 1) * 100)}% | 💪 Dégâts: ${Math.round((char.stats?.damage || 1) * 100)}%</p>
                <p>🔫 Arme de départ: ${weaponName}</p>
            `;
        }
        
        if (passiveDiv && char.passive) {
            passiveDiv.innerHTML = `
                <p style="color: var(--accent);">✨ ${char.passive.name || 'Passif'}: ${char.passive.description || ''}</p>
            `;
        }
    }
    
    // === MAPS ===
    renderMapGrid() {
        const grid = this.elements.mapGrid;
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (const [id, map] of Object.entries(MAPS)) {
            const isUnlocked = this.save.isMapUnlocked(id);
            const isSelected = id === this.selectedMap;
            
            const card = document.createElement('div');
            card.className = `map-card ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}`;
            card.dataset.id = id;
            
            card.innerHTML = `
                <div class="character-avatar">${map.icon}</div>
                <h4>${isUnlocked ? map.name : '???'}</h4>
                <p style="font-size: 0.7rem; color: var(--text-dim);">
                    ${isUnlocked ? `${Math.floor((map.duration || 900) / 60)} min` : (map.unlockCondition?.description || '???')}
                </p>
            `;
            
            if (isUnlocked) {
                card.addEventListener('click', () => {
                    this.selectedMap = id;
                    this.renderMapGrid();
                    this.updateMapInfo();
                });
            }
            
            grid.appendChild(card);
        }
    }
    
    updateMapInfo() {
        const map = MAPS[this.selectedMap];
        if (!map) return;
        
        const nameEl = document.getElementById('map-name');
        const descEl = document.getElementById('map-desc');
        const detailsDiv = document.getElementById('map-details');
        
        if (nameEl) nameEl.textContent = map.name;
        if (descEl) descEl.textContent = map.description || '';
        
        if (detailsDiv) {
            detailsDiv.innerHTML = `
                <p>⏱️ Durée: ${Math.floor((map.duration || 900) / 60)} minutes</p>
                <p>💀 Difficulté: ${'⭐'.repeat(Math.ceil(map.difficultyMult || 1))}</p>
                <p>👾 Ennemis: ${(map.enemies || []).length} types</p>
            `;
        }
    }
    
    // === TALENTS ===
    renderTalentGrid() {
        const grid = this.elements.talentGrid;
        if (!grid) return;
        
        grid.innerHTML = '';
        this.updateCreditsDisplay();
        
        for (const [id, talent] of Object.entries(TALENTS)) {
            const currentLevel = this.save.getTalentLevel(id);
            const maxLevel = talent.maxLevel || 10;
            const isMaxed = currentLevel >= maxLevel;
            const cost = isMaxed ? null : (talent.costs?.[currentLevel] || 100);
            const canAfford = cost !== null && this.save.getGold() >= cost;
            
            const card = document.createElement('div');
            card.className = `talent-card ${isMaxed ? 'maxed' : ''}`;
            
            card.innerHTML = `
                <div class="talent-icon">${talent.icon || '⚡'}</div>
                <div class="talent-name">${talent.name}</div>
                <div class="talent-level">${currentLevel}/${maxLevel}</div>
                <p style="font-size: 0.75rem; color: var(--text-dim); margin: 5px 0;">
                    ${talent.description || ''}
                </p>
                ${isMaxed ? 
                    '<div class="talent-cost" style="color: var(--accent);">MAX</div>' : 
                    `<div class="talent-cost">💎 ${formatNumber(cost)}</div>
                     <button class="talent-btn" ${canAfford ? '' : 'disabled'}>Améliorer</button>`
                }
            `;
            
            if (!isMaxed) {
                const btn = card.querySelector('.talent-btn');
                btn?.addEventListener('click', () => {
                    if (this.save.upgradeTalent(id)) {
                        this.renderTalentGrid();
                    }
                });
            }
            
            grid.appendChild(card);
        }
    }
    
    // === COLLECTION ===
    switchCollectionTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        const content = this.elements.collectionContent;
        if (!content) return;
        
        content.innerHTML = '';
        
        let items = [];
        switch (tab) {
            case 'weapons':
                items = Object.entries(WEAPONS).map(([id, w]) => ({
                    id,
                    icon: w.icon || '🔫',
                    name: w.name || id,
                    seen: this.save.data.seenWeapons?.[id]
                }));
                break;
            case 'passives':
                items = Object.entries(PASSIVES).map(([id, p]) => ({
                    id,
                    icon: p.icon || '⚡',
                    name: p.name || id,
                    seen: this.save.data.seenPassives?.[id]
                }));
                break;
            case 'enemies':
                items = Object.entries(ENEMIES).map(([id, e]) => ({
                    id,
                    icon: e.icon || '👽',
                    name: e.name || id,
                    seen: this.save.data.seenEnemies?.[id]
                }));
                break;
        }
        
        for (const item of items) {
            const div = document.createElement('div');
            div.className = `collection-item ${item.seen ? '' : 'locked'}`;
            div.innerHTML = `
                <div class="item-icon">${item.seen ? item.icon : '❓'}</div>
                <div class="item-name">${item.seen ? item.name : '???'}</div>
            `;
            content.appendChild(div);
        }
    }
    
    // === OPTIONS ===
    confirmResetSave() {
        if (confirm('Êtes-vous sûr de vouloir effacer toutes vos données de sauvegarde ? Cette action est irréversible !')) {
            this.save.reset();
            this.updateCreditsDisplay();
            alert('Sauvegarde effacée !');
        }
    }
    
    // === DÉMARRAGE DE PARTIE ===
    startGame() {
        console.log('UI.startGame called');
        if (this.onStartGame) {
            this.onStartGame(this.selectedCharacter, this.selectedMap);
        }
    }
    
    // === HUD ===
    updateHUD(player, gameTime, kills, gold, wave) {
        if (!player) return;
        
        // Santé
        const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
        if (this.hud.healthFill) this.hud.healthFill.style.width = `${hpPercent}%`;
        if (this.hud.healthText) this.hud.healthText.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
        
        // XP
        const xpPercent = Math.max(0, (player.xp / player.xpToNext) * 100);
        if (this.hud.xpFill) this.hud.xpFill.style.width = `${xpPercent}%`;
        if (this.hud.levelDisplay) this.hud.levelDisplay.textContent = `Niv. ${player.level}`;
        
        // Timer
        if (this.hud.timer) this.hud.timer.textContent = formatTime(gameTime);
        
        // Wave
        if (this.hud.waveIndicator) this.hud.waveIndicator.textContent = `Vague ${wave || 1}`;
        
        // Stats
        if (this.hud.kills) this.hud.kills.textContent = formatNumber(kills || 0);
        if (this.hud.gold) this.hud.gold.textContent = formatNumber(gold || 0);
    }
    
    updateWeaponsDisplay(weapons) {
        const container = this.hud.weaponsDisplay;
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const weapon of (weapons || [])) {
            const data = WEAPONS[weapon.id];
            if (!data) continue;
            
            const slot = document.createElement('div');
            slot.className = 'weapon-slot';
            slot.innerHTML = `
                <span>${data.icon || '🔫'}</span>
                <span class="slot-level">${weapon.level}</span>
            `;
            container.appendChild(slot);
        }
    }
    
    updatePassivesDisplay(passives) {
        const container = this.hud.passivesDisplay;
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const passive of (passives || [])) {
            const data = PASSIVES[passive.id];
            if (!data) continue;
            
            const slot = document.createElement('div');
            slot.className = 'passive-slot';
            slot.innerHTML = `
                <span>${data.icon || '⚡'}</span>
                <span class="slot-level">${passive.level}</span>
            `;
            container.appendChild(slot);
        }
    }
    
    showBossHealth(boss) {
        if (!boss || !this.hud.bossContainer) return;
        
        this.hud.bossContainer.classList.remove('hidden');
        if (this.hud.bossName) {
            this.hud.bossName.textContent = boss.bossData?.name || 'BOSS';
        }
        const percent = Math.max(0, (boss.hp / boss.maxHp) * 100);
        if (this.hud.bossFill) this.hud.bossFill.style.width = `${percent}%`;
    }
    
    hideBossHealth() {
        if (this.hud.bossContainer) {
            this.hud.bossContainer.classList.add('hidden');
        }
    }
    
    // === LEVEL UP ===
    showLevelUp(choices, onSelect) {
        console.log('UI.showLevelUp called with', choices.length, 'choices');
        
        // Garder le jeu et HUD visibles
        this.screens.game?.classList.remove('hidden');
        this.screens.hud?.classList.remove('hidden');
        
        // Afficher l'écran de level-up
        this.screens.levelup?.classList.remove('hidden');
        
        this.rerollsRemaining = 1;
        this.currentChoices = choices;
        this.onUpgradeSelected = onSelect;
        
        this.renderUpgradeChoices(choices);
        this.updateRerollButton();
        
        this.currentScreen = 'levelup';
    }
    
    renderUpgradeChoices(choices) {
        const container = this.elements.upgradeChoices;
        if (!container) {
            console.error('upgradeChoices container not found');
            return;
        }
        
        container.innerHTML = '';
        
        for (const choice of choices) {
            const card = document.createElement('div');
            
            let icon, name, description, level, isNew;
            let cardClass = 'upgrade-card';
            
            if (choice.type === 'new_weapon' || choice.type === 'upgrade_weapon') {
                const data = WEAPONS[choice.id];
                if (!data) continue;
                icon = data.icon || '🔫';
                name = data.name || choice.id;
                description = data.description || '';
                isNew = choice.type === 'new_weapon';
                level = isNew ? 1 : ((choice.currentLevel || 0) + 1);
                cardClass += ' weapon';
            } else {
                const data = PASSIVES[choice.id];
                if (!data) continue;
                icon = data.icon || '⚡';
                name = data.name || choice.id;
                description = data.description || '';
                isNew = choice.type === 'new_passive';
                level = isNew ? 1 : ((choice.currentLevel || 0) + 1);
                cardClass += ' passive';
            }
            
            if (isNew) cardClass += ' new';
            
            card.className = cardClass;
            card.innerHTML = `
                <div class="upgrade-icon">${icon}</div>
                <h3>${name}</h3>
                <p>${description}</p>
                <div class="upgrade-level">${isNew ? 'NOUVEAU!' : `Niveau ${level}`}</div>
            `;
            
            card.addEventListener('click', () => {
                console.log('Upgrade selected:', choice.id);
                this.hideLevelUp();
                if (this.onUpgradeSelected) {
                    this.onUpgradeSelected(choice);
                }
            });
            
            container.appendChild(card);
        }
    }
    
    updateRerollButton() {
        if (this.elements.rerollBtn) {
            this.elements.rerollBtn.disabled = this.rerollsRemaining <= 0;
        }
        if (this.elements.rerollCount) {
            this.elements.rerollCount.textContent = this.rerollsRemaining;
        }
    }
    
    rerollUpgrades() {
        if (this.rerollsRemaining <= 0) return;
        
        this.rerollsRemaining--;
        this.updateRerollButton();
        
        // Demander de nouveaux choix au jeu
        if (this.onRerollRequest) {
            const newChoices = this.onRerollRequest();
            this.currentChoices = newChoices;
            this.renderUpgradeChoices(newChoices);
        }
    }
    
    hideLevelUp() {
        console.log('UI.hideLevelUp called');
        if (this.screens.levelup) {
            this.screens.levelup.classList.add('hidden');
        }
        // S'assurer que le jeu et le HUD sont visibles
        if (this.screens.game) {
            this.screens.game.classList.remove('hidden');
        }
        if (this.screens.hud) {
            this.screens.hud.classList.remove('hidden');
        }
        this.currentScreen = 'game';
    }
    
    // === PAUSE ===
    showPause(player, gameTime, kills) {
        // Garder le jeu visible en fond
        this.screens.game?.classList.remove('hidden');
        this.screens.hud?.classList.remove('hidden');
        this.screens.pause?.classList.remove('hidden');
        
        const pauseTime = document.getElementById('pause-time');
        const pauseKills = document.getElementById('pause-kills');
        const pauseLevel = document.getElementById('pause-level');
        
        if (pauseTime) pauseTime.textContent = formatTime(gameTime || 0);
        if (pauseKills) pauseKills.textContent = formatNumber(kills || 0);
        if (pauseLevel) pauseLevel.textContent = player?.level || 1;
        
        // Afficher l'équipement
        const weaponsDiv = document.getElementById('pause-weapons');
        const passivesDiv = document.getElementById('pause-passives');
        
        if (weaponsDiv && player) {
            weaponsDiv.innerHTML = '';
            for (const weapon of (player.weapons || [])) {
                const data = WEAPONS[weapon.id];
                const slot = document.createElement('div');
                slot.className = 'weapon-slot';
                slot.innerHTML = `<span>${data?.icon || '🔫'}</span><span class="slot-level">${weapon.level}</span>`;
                weaponsDiv.appendChild(slot);
            }
        }
        
        if (passivesDiv && player) {
            passivesDiv.innerHTML = '';
            for (const passive of (player.passives || [])) {
                const data = PASSIVES[passive.id];
                const slot = document.createElement('div');
                slot.className = 'passive-slot';
                slot.innerHTML = `<span>${data?.icon || '⚡'}</span><span class="slot-level">${passive.level}</span>`;
                passivesDiv.appendChild(slot);
            }
        }
        
        this.currentScreen = 'pause';
    }
    
    hidePause() {
        this.screens.pause?.classList.add('hidden');
        this.currentScreen = 'game';
    }
    
    // === GAME OVER ===
    showGameOver(victory, stats, unlocks) {
        console.log('UI.showGameOver called, victory:', victory);
        
        // Cacher le jeu
        this.hideGame();
        
        if (victory) {
            this.screens.victory?.classList.remove('hidden');
            this.populateVictoryStats(stats, unlocks);
            this.currentScreen = 'victory';
        } else {
            this.screens.gameover?.classList.remove('hidden');
            this.populateGameOverStats(stats, unlocks);
            this.currentScreen = 'gameover';
        }
    }
    
    populateGameOverStats(stats, unlocks) {
        const statTime = document.getElementById('stat-time');
        const statKills = document.getElementById('stat-kills');
        const statLevel = document.getElementById('stat-level');
        const statGold = document.getElementById('stat-gold');
        
        if (statTime) statTime.textContent = formatTime(stats?.time || 0);
        if (statKills) statKills.textContent = formatNumber(stats?.kills || 0);
        if (statLevel) statLevel.textContent = stats?.level || 1;
        if (statGold) statGold.textContent = `+${formatNumber(stats?.gold || 0)}`;
        
        const unlocksDiv = document.getElementById('unlocks');
        if (unlocksDiv) {
            unlocksDiv.innerHTML = '';
            for (const unlock of (unlocks || [])) {
                const div = document.createElement('div');
                div.className = 'unlock-item';
                div.innerHTML = `
                    <span>${unlock.icon || '🔓'}</span>
                    <span>Débloqué: ${unlock.name}</span>
                `;
                unlocksDiv.appendChild(div);
            }
        }
    }
    
    populateVictoryStats(stats, unlocks) {
        const statsDiv = document.getElementById('victory-stats');
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div class="stat-row">
                    <span class="stat-label">⏱️ Temps</span>
                    <span class="stat-value">${formatTime(stats?.time || 0)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">💀 Kills</span>
                    <span class="stat-value">${formatNumber(stats?.kills || 0)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">📈 Niveau</span>
                    <span class="stat-value">${stats?.level || 1}</span>
                </div>
                <div class="stat-row highlight">
                    <span class="stat-label">💎 Crédits</span>
                    <span class="stat-value">+${formatNumber(stats?.gold || 0)}</span>
                </div>
            `;
        }
        
        const unlocksDiv = document.getElementById('victory-unlocks');
        if (unlocksDiv) {
            unlocksDiv.innerHTML = '';
            for (const unlock of (unlocks || [])) {
                const div = document.createElement('div');
                div.className = 'unlock-item';
                div.innerHTML = `
                    <span>${unlock.icon || '🔓'}</span>
                    <span>Débloqué: ${unlock.name}</span>
                `;
                unlocksDiv.appendChild(div);
            }
        }
    }
    
    // === NOTIFICATIONS ===
    showNotification(text, icon = '🔔') {
        const notif = document.getElementById('unlock-notification');
        if (!notif) return;
        
        const iconEl = notif.querySelector('.notification-icon');
        const textEl = notif.querySelector('.notification-text');
        
        if (iconEl) iconEl.textContent = icon;
        if (textEl) textEl.textContent = text;
        
        notif.classList.remove('hidden');
        
        setTimeout(() => {
            notif.classList.add('hidden');
        }, 3000);
    }
}