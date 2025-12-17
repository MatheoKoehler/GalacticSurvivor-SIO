// ========================================
// GALACTIC SURVIVOR - Classe Player
// ========================================

import { CHARACTERS, WEAPONS, PASSIVES, CONFIG } from './constants.js';
import { clamp, distance, angle, normalize, circleCollision } from './utils.js';

export class Player {
    constructor(x, y, characterId, talentBonuses, effects) {
        const charData = CHARACTERS[characterId];
        
        if (!charData) {
            console.error('Character not found:', characterId);
            throw new Error(`Character "${characterId}" not found`);
        }
        
        this.x = x;
        this.y = y;
        this.characterId = characterId;
        this.charData = charData;
        this.effects = effects;
        
        // Stats de base
        this.baseMaxHp = charData.stats.hp || 100;
        this.baseSpeed = 200 * (charData.stats.speed || 1);
        this.baseDamage = charData.stats.damage || 1;
        this.baseArmor = charData.stats.armor || 0;
        
        // Bonus de talents (avec valeurs par défaut)
        this.talentBonuses = talentBonuses || {
            maxHp: 0,
            damage: 0,
            speed: 0,
            goldMult: 1,
            xpMult: 1,
            hpRegen: 0,
            luck: 0,
            cooldown: 0,
            pickupRange: 0,
            reviveChance: 0
        };
        
        // Passive du personnage (avec objet vide par défaut)
        this.charPassive = charData.passive || {};
        
        // Progression
        this.level = 1;
        this.xp = 0;
        this.xpToNext = CONFIG.BASE_XP_TO_LEVEL;
        
        // Équipement
        this.weapons = [];
        this.passives = [];
        this.passiveStats = this.getEmptyPassiveStats();
        
        // Stats calculées (doit être après passiveStats)
        this.recalculateStats();
        this.hp = this.maxHp;
        
        // Ajouter l'arme de départ
        if (charData.startingWeapon) {
            this.addWeapon(charData.startingWeapon);
        }
        
        // Dimensions
        this.size = 40;
        this.radius = 18;
        
        // État
        this.invincibleTime = 0;
        this.isInvincible = false;
        this.bossKills = 0;
        
        // Direction du regard
        this.facingAngle = 0;
        this.lastMoveX = 0;
        this.lastMoveY = 0;
        
        // Buffs temporaires
        this.buffs = {
            doubleDamage: 0,
            invincible: 0
        };
        
        // Revival
        this.hasRevived = false;
        
        console.log('Player created:', {
            character: characterId,
            hp: this.hp,
            maxHp: this.maxHp,
            speed: this.speed,
            weapons: this.weapons.map(w => w.id)
        });
    }
    
    getEmptyPassiveStats() {
        return {
            damage: 0,
            armor: 0,
            maxHp: 0,
            hpRegen: 0,
            cooldown: 0,
            area: 0,
            projectileSpeed: 0,
            duration: 0,
            speed: 0,
            pickupRange: 0,
            xpGain: 0,
            luck: 0,
            laserDamage: 0,
            homing: 0,
            orbitals: 0,
            chains: 0,
            explosionRadius: 0
        };
    }
    
    recalculateStats() {
        const talents = this.talentBonuses;
        const passives = this.passiveStats;
        const charPassive = this.charPassive;
        
        // HP Max - avec vérifications de sécurité
        this.maxHp = this.baseMaxHp;
        this.maxHp += (talents.maxHp || 0);
        this.maxHp *= (1 + (passives.maxHp || 0));
        this.maxHp *= (1 + (charPassive.maxHp || 0));
        this.maxHp = Math.floor(this.maxHp);
        
        // Vitesse
        this.speed = this.baseSpeed;
        this.speed *= (1 + (talents.speed || 0));
        this.speed *= (1 + (passives.speed || 0));
        this.speed *= (1 + (charPassive.speed || 0));
        
        // Dégâts
        this.damageMultiplier = this.baseDamage;
        this.damageMultiplier *= (1 + (talents.damage || 0));
        this.damageMultiplier *= (1 + (passives.damage || 0));
        this.damageMultiplier *= (1 + (charPassive.damage || 0));
        
        // Armure
        this.armor = this.baseArmor;
        this.armor += (passives.armor || 0) * 100;
        this.armor = clamp(this.armor, 0, 75);
        
        // Régénération
        this.hpRegen = (talents.hpRegen || 0) + (passives.hpRegen || 0);
        
        // Cooldown
        this.cooldownReduction = (talents.cooldown || 0) + (passives.cooldown || 0);
        this.cooldownReduction += (charPassive.cooldown || 0);
        this.cooldownReduction = clamp(this.cooldownReduction, 0, 0.75);
        
        // Zone d'effet
        this.areaMult = 1 + (passives.area || 0) + (charPassive.areaSize || 0);
        
        // Vitesse projectiles
        this.projectileSpeedMult = 1 + (passives.projectileSpeed || 0) + (charPassive.projectileSpeed || 0);
        
        // Durée
        this.durationMult = 1 + (passives.duration || 0);
        
        // Collecte
        this.pickupRadius = CONFIG.PICKUP_RADIUS_BASE;
        this.pickupRadius *= (1 + (talents.pickupRange || 0));
        this.pickupRadius *= (1 + (passives.pickupRange || 0));
        this.pickupRadius *= (1 + (charPassive.pickupRange || 0));
        
        // XP
        this.xpMultiplier = talents.xpMult || 1;
        this.xpMultiplier *= (1 + (passives.xpGain || 0));
        this.xpMultiplier *= (1 + (charPassive.xpGain || 0));
        
        // Chance
        this.luck = (talents.luck || 0) + (passives.luck || 0);
        
        // Revival
        this.reviveChance = talents.reviveChance || 0;
    }
    
    update(dt, keys, mapBounds) {
        // Mouvement
        let dx = 0, dy = 0;
        
        if (keys['KeyW'] || keys['KeyZ'] || keys['ArrowUp']) dy -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
        if (keys['KeyA'] || keys['KeyQ'] || keys['ArrowLeft']) dx -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
        
        // Normaliser la diagonale
        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }
        
        // Mettre à jour la direction
        if (dx !== 0 || dy !== 0) {
            this.facingAngle = Math.atan2(dy, dx);
            this.lastMoveX = dx;
            this.lastMoveY = dy;
        }
        
        // Appliquer le mouvement
        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;
        
        // Limiter à la map
        if (mapBounds) {
            const margin = this.radius;
            this.x = clamp(this.x, margin, mapBounds.width - margin);
            this.y = clamp(this.y, margin, mapBounds.height - margin);
        }
        
        // Régénération HP
        if (this.hpRegen > 0 && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * dt);
        }
        
        // Timer d'invincibilité
        if (this.invincibleTime > 0) {
            this.invincibleTime -= dt;
            this.isInvincible = true;
        } else {
            this.isInvincible = false;
        }
        
        // Buffs
        if (this.buffs.doubleDamage > 0) {
            this.buffs.doubleDamage -= dt;
        }
        if (this.buffs.invincible > 0) {
            this.buffs.invincible -= dt;
        }
        
        // Update cooldowns des armes
        for (const weapon of this.weapons) {
            if (weapon.cooldownTimer > 0) {
                weapon.cooldownTimer -= dt;
            }
            
            // Timer pour les armes à dégâts continus
            if (weapon.damageTimer !== undefined) {
                weapon.damageTimer -= dt;
            }
        }
    }
    
    // === ARMES ===
    addWeapon(weaponId) {
        const weaponData = WEAPONS[weaponId];
        if (!weaponData) {
            console.warn('Weapon not found:', weaponId);
            return null;
        }
        
        const existing = this.weapons.find(w => w.id === weaponId);
        if (existing) {
            existing.level = Math.min(weaponData.maxLevel || 8, existing.level + 1);
            return { upgraded: true, level: existing.level };
        } else if (this.weapons.length < 6) {
            this.weapons.push({
                id: weaponId,
                level: 1,
                cooldown: weaponData.cooldown || 1,
                cooldownTimer: 0,
                damageTimer: 0
            });
            return { new: true };
        }
        return null;
    }
    
    getWeaponLevel(weaponId) {
        const weapon = this.weapons.find(w => w.id === weaponId);
        return weapon ? weapon.level : 0;
    }
    
    isWeaponMaxed(weaponId) {
        const weapon = this.weapons.find(w => w.id === weaponId);
        if (!weapon) return false;
        const data = WEAPONS[weaponId];
        return weapon.level >= (data?.maxLevel || 8);
    }
    
    hasWeapon(weaponId) {
        return this.weapons.some(w => w.id === weaponId);
    }
    
    // === PASSIFS ===
    addPassive(passiveId) {
        const passiveData = PASSIVES[passiveId];
        if (!passiveData) {
            console.warn('Passive not found:', passiveId);
            return null;
        }
        
        const existing = this.passives.find(p => p.id === passiveId);
        if (existing) {
            if (existing.level < (passiveData.maxLevel || 5)) {
                existing.level++;
                this.recalculatePassiveStats();
                return { upgraded: true, level: existing.level };
            }
            return null;
        } else {
            this.passives.push({ id: passiveId, level: 1 });
            this.recalculatePassiveStats();
            return { new: true };
        }
    }
    
    getPassiveLevel(passiveId) {
        const passive = this.passives.find(p => p.id === passiveId);
        return passive ? passive.level : 0;
    }
    
    isPassiveMaxed(passiveId) {
        const passive = this.passives.find(p => p.id === passiveId);
        if (!passive) return false;
        const data = PASSIVES[passiveId];
        return passive.level >= (data?.maxLevel || 5);
    }
    
    hasPassive(passiveId) {
        return this.passives.some(p => p.id === passiveId);
    }
    
    recalculatePassiveStats() {
        this.passiveStats = this.getEmptyPassiveStats();
        
        for (const passive of this.passives) {
            const data = PASSIVES[passive.id];
            if (data && data.effect) {
                for (const [stat, value] of Object.entries(data.effect)) {
                    if (this.passiveStats[stat] !== undefined) {
                        this.passiveStats[stat] += value * passive.level;
                    }
                }
            }
        }
        
        this.recalculateStats();
    }
    
    // === XP & LEVEL ===
    addXP(amount) {
        this.xp += Math.floor(amount * this.xpMultiplier);
    }
    
    checkLevelUp() {
        if (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.xpToNext = Math.floor(this.xpToNext * CONFIG.LEVEL_UP_XP_MULTIPLIER);
            
            // Effet visuel
            if (this.effects) {
                this.effects.levelUp(this.x, this.y);
            }
            
            return true;
        }
        return false;
    }
    
    // === DÉGÂTS & SOINS ===
    takeDamage(amount) {
        if (this.isInvincible || this.buffs.invincible > 0) return 0;
        
        // Appliquer l'armure
        const reduction = this.armor / 100;
        const finalDamage = Math.max(1, amount * (1 - reduction));
        
        this.hp -= finalDamage;
        this.invincibleTime = CONFIG.INVINCIBILITY_TIME;
        
        // Effet visuel
        if (this.effects) {
            this.effects.hit(this.x, this.y, '#ff0000', 5);
            this.effects.addScreenShake(8, 0.15);
        }
        
        // Vérifier la mort
        if (this.hp <= 0) {
            // Chance de revival
            if (!this.hasRevived && this.reviveChance > 0 && Math.random() < this.reviveChance) {
                this.hp = this.maxHp * 0.5;
                this.hasRevived = true;
                this.invincibleTime = 2;
                if (this.effects) {
                    this.effects.addFlash('#00ff00', 0.3);
                }
                return finalDamage;
            }
            this.hp = 0;
        }
        
        return finalDamage;
    }
    
    heal(amount) {
        const healed = Math.min(this.maxHp - this.hp, amount);
        this.hp += healed;
        
        if (healed > 0 && this.effects) {
            this.effects.showHeal(this.x, this.y - 30, healed);
            this.effects.pickup(this.x, this.y, '#00ff00');
        }
        
        return healed;
    }
    
    isDead() {
        return this.hp <= 0;
    }
    
    // === BUFFS ===
    applyBuff(type, duration) {
        switch (type) {
            case 'double_damage':
                this.buffs.doubleDamage = Math.max(this.buffs.doubleDamage, duration);
                break;
            case 'invincible':
                this.buffs.invincible = Math.max(this.buffs.invincible, duration);
                break;
        }
    }
    
    getDamageMultiplier() {
        let mult = this.damageMultiplier;
        if (this.buffs.doubleDamage > 0) mult *= 2;
        return mult;
    }
    
    // === RENDU ===
    render(ctx) {
        ctx.save();
        
        // Flash si invincible
        if (this.isInvincible && Math.floor(this.invincibleTime * 15) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Buff glow
        if (this.buffs.doubleDamage > 0) {
            ctx.shadowColor = '#ff8800';
            ctx.shadowBlur = 20;
        } else if (this.buffs.invincible > 0) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
        }
        
        // Corps principal
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#00ddff');
        gradient.addColorStop(0.7, '#0088aa');
        gradient.addColorStop(1, '#004466');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Contour
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Indicateur de direction
        const eyeX = this.x + Math.cos(this.facingAngle) * 8;
        const eyeY = this.y + Math.sin(this.facingAngle) * 8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Core lumineux
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Render shield orbs if equipped
        this.renderOrbitals(ctx);
    }
    
    renderOrbitals(ctx) {
        const shieldOrbs = this.weapons.find(w => w.id === 'shield_orbs');
        if (!shieldOrbs) return;
        
        const data = WEAPONS.shield_orbs;
        if (!data || !data.levelBonuses) return;
        
        const level = shieldOrbs.level;
        const orbCount = data.levelBonuses.orbs[level - 1] || 2;
        const radiusMult = data.levelBonuses.radiusMult?.[level - 1] || 1;
        const sizeMult = data.levelBonuses.sizeMult?.[level - 1] || 1;
        
        const orbRadius = (data.orbitRadius || 80) * radiusMult * this.areaMult;
        const orbSize = (data.orbSize || 15) * sizeMult * this.areaMult;
        const time = performance.now() / 1000;
        
        for (let i = 0; i < orbCount; i++) {
            const baseAngle = (time * (data.orbitSpeed || 2)) + (i * Math.PI * 2 / orbCount);
            const ox = this.x + Math.cos(baseAngle) * orbRadius;
            const oy = this.y + Math.sin(baseAngle) * orbRadius;
            
            // Glow
            const gradient = ctx.createRadialGradient(ox, oy, 0, ox, oy, orbSize);
            gradient.addColorStop(0, '#ffdd00');
            gradient.addColorStop(0.5, '#ffaa00');
            gradient.addColorStop(1, 'rgba(255, 170, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ox, oy, orbSize * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ox, oy, orbSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // === SERIALIZATION ===
    getStats() {
        return {
            level: this.level,
            hp: Math.floor(this.hp),
            maxHp: this.maxHp,
            xp: this.xp,
            xpToNext: this.xpToNext,
            weapons: this.weapons.map(w => ({ id: w.id, level: w.level })),
            passives: this.passives.map(p => ({ id: p.id, level: p.level }))
        };
    }
}