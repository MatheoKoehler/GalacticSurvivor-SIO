// ========================================
// GALACTIC SURVIVOR - Système de Sauvegarde
// ========================================

// IMPORTANT: Les imports doivent être en HAUT du fichier
import { TALENTS, CHARACTERS, MAPS, PASSIVES } from './constants.js';

export class SaveManager {
    constructor() {
        this.SAVE_KEY = 'galactic_survivor_save';
        this.data = this.load();
    }
    
    getDefaultSave() {
        return {
            version: 1,
            gold: 0,
            talents: {},
            unlockedCharacters: ['commander'],
            unlockedMaps: ['station'],
            unlockedWeapons: ['blaster', 'plasma_rifle', 'tesla_coil', 'shield_orbs', 'homing_missiles', 'force_field'],
            unlockedPassives: [],
            seenWeapons: {},
            seenPassives: {},
            seenEnemies: {},
            stats: {
                totalKills: 0,
                totalPlayTime: 0,
                totalRuns: 0,
                runsCompleted: 0,
                bossKills: 0,
                highestLevel: 0,
                longestSurvival: 0,
                totalGoldEarned: 0
            },
            achievements: {},
            settings: {
                musicVolume: 50,
                sfxVolume: 70,
                particleQuality: 'high',
                screenShake: true
            }
        };
    }
    
    load() {
        try {
            const saved = localStorage.getItem(this.SAVE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return this.mergeSave(this.getDefaultSave(), parsed);
            }
        } catch (e) {
            console.error('Erreur de chargement de sauvegarde:', e);
        }
        return this.getDefaultSave();
    }
    
    mergeSave(defaults, saved) {
        const merged = { ...defaults };
        for (const key in saved) {
            if (typeof saved[key] === 'object' && !Array.isArray(saved[key]) && saved[key] !== null) {
                merged[key] = { ...defaults[key], ...saved[key] };
            } else {
                merged[key] = saved[key];
            }
        }
        return merged;
    }
    
    save() {
        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('Erreur de sauvegarde:', e);
        }
    }
    
    reset() {
        this.data = this.getDefaultSave();
        this.save();
    }
    
    // === GOLD ===
    getGold() {
        return this.data.gold;
    }
    
    addGold(amount) {
        this.data.gold += Math.floor(amount);
        this.data.stats.totalGoldEarned += Math.floor(amount);
        this.save();
    }
    
    spendGold(amount) {
        if (this.data.gold >= amount) {
            this.data.gold -= amount;
            this.save();
            return true;
        }
        return false;
    }
    
    // === TALENTS ===
    getTalentLevel(talentId) {
        return this.data.talents[talentId] || 0;
    }
    
    upgradeTalent(talentId) {
        const talent = TALENTS[talentId];
        if (!talent) return false;
        
        const currentLevel = this.getTalentLevel(talentId);
        if (currentLevel >= talent.maxLevel) return false;
        
        const cost = talent.costs[currentLevel];
        if (this.spendGold(cost)) {
            this.data.talents[talentId] = currentLevel + 1;
            this.save();
            return true;
        }
        return false;
    }
    
    getTalentBonuses() {
        const bonuses = {
            maxHp: 0,
            damage: 0,
            speed: 0,
            goldMult: 0,
            xpMult: 0,
            hpRegen: 0,
            luck: 0,
            cooldown: 0,
            pickupRange: 0,
            reviveChance: 0
        };
        
        for (const [talentId, level] of Object.entries(this.data.talents)) {
            const talent = TALENTS[talentId];
            if (talent && level > 0) {
                for (const [stat, value] of Object.entries(talent.effect)) {
                    if (bonuses[stat] !== undefined) {
                        bonuses[stat] += value * level;
                    }
                }
            }
        }
        
        // Convertir en multiplicateurs
        bonuses.goldMult = 1 + bonuses.goldMult;
        bonuses.xpMult = 1 + bonuses.xpMult;
        
        return bonuses;
    }
    
    // === UNLOCKS ===
    isCharacterUnlocked(charId) {
        return this.data.unlockedCharacters.includes(charId);
    }
    
    isMapUnlocked(mapId) {
        return this.data.unlockedMaps.includes(mapId);
    }
    
    unlockCharacter(charId) {
        if (!this.data.unlockedCharacters.includes(charId)) {
            this.data.unlockedCharacters.push(charId);
            this.save();
            return true;
        }
        return false;
    }
    
    unlockMap(mapId) {
        if (!this.data.unlockedMaps.includes(mapId)) {
            this.data.unlockedMaps.push(mapId);
            this.save();
            return true;
        }
        return false;
    }
    
    // === STATS ===
    updateStats(runStats) {
        const stats = this.data.stats;
        stats.totalKills += runStats.kills || 0;
        stats.totalPlayTime += runStats.time || 0;
        stats.totalRuns += 1;
        
        if (runStats.victory) {
            stats.runsCompleted += 1;
        }
        
        if (runStats.bossKills) {
            stats.bossKills += runStats.bossKills;
        }
        
        if (runStats.level > stats.highestLevel) {
            stats.highestLevel = runStats.level;
        }
        
        if (runStats.time > stats.longestSurvival) {
            stats.longestSurvival = runStats.time;
        }
        
        this.save();
    }
    
    // === CHECK UNLOCKS ===
    checkUnlocks(runStats) {
        const unlocks = [];
        
        // Vérifier personnages
        for (const [charId, char] of Object.entries(CHARACTERS)) {
            if (this.isCharacterUnlocked(charId)) continue;
            
            const cond = char.unlockCondition;
            if (!cond) continue;
            
            let unlocked = false;
            
            switch (cond.type) {
                case 'level':
                    if (runStats.level >= cond.value) unlocked = true;
                    break;
                case 'survive':
                    if (runStats.time >= cond.minutes * 60) {
                        if (!cond.map || runStats.mapId === cond.map) {
                            unlocked = true;
                        }
                    }
                    break;
                case 'kills':
                    if (this.data.stats.totalKills + (runStats.kills || 0) >= cond.value) unlocked = true;
                    break;
                case 'boss':
                    if (this.data.stats.bossKills + (runStats.bossKills || 0) >= cond.value) unlocked = true;
                    break;
                case 'secret':
                    if (cond.requirement === 'complete_all_maps') {
                        const allMaps = Object.keys(MAPS).filter(m => m !== 'void');
                        if (allMaps.every(m => this.data.unlockedMaps.includes(m))) {
                            unlocked = true;
                        }
                    }
                    break;
            }
            
            if (unlocked && this.unlockCharacter(charId)) {
                unlocks.push({ type: 'character', id: charId, name: char.name, icon: char.icon });
            }
        }
        
        // Vérifier maps
        for (const [mapId, map] of Object.entries(MAPS)) {
            if (this.isMapUnlocked(mapId)) continue;
            
            const cond = map.unlockCondition;
            if (!cond) continue;
            
            let unlocked = false;
            
            switch (cond.type) {
                case 'survive':
                    if (runStats.time >= cond.minutes * 60) unlocked = true;
                    break;
                case 'boss':
                    if (this.data.stats.bossKills + (runStats.bossKills || 0) >= cond.value) unlocked = true;
                    break;
                case 'level':
                    if (this.data.stats.highestLevel >= cond.value || runStats.level >= cond.value) unlocked = true;
                    break;
                case 'complete_all':
                    const otherMaps = Object.keys(MAPS).filter(m => m !== mapId && m !== 'void');
                    if (otherMaps.every(m => this.data.unlockedMaps.includes(m))) {
                        unlocked = true;
                    }
                    break;
            }
            
            if (unlocked && this.unlockMap(mapId)) {
                unlocks.push({ type: 'map', id: mapId, name: map.name, icon: map.icon });
            }
        }
        
        return unlocks;
    }
    
    // === COLLECTION ===
    markWeaponSeen(weaponId) {
        this.data.seenWeapons[weaponId] = true;
        this.save();
    }
    
    markPassiveSeen(passiveId) {
        this.data.seenPassives[passiveId] = true;
        this.save();
    }
    
    markEnemySeen(enemyId) {
        this.data.seenEnemies[enemyId] = true;
        this.save();
    }
    
    // === SETTINGS ===
    getSetting(key) {
        return this.data.settings[key];
    }
    
    setSetting(key, value) {
        this.data.settings[key] = value;
        this.save();
    }
}