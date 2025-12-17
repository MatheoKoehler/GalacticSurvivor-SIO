// ========================================
// GALACTIC SURVIVOR - Système d'Armes
// ========================================

import { WEAPONS } from './constants.js';
import { distance, angle, normalize, randomRange, randomChoice } from './utils.js';

export class WeaponSystem {
    constructor(player, projectileManager, effects) {
        this.player = player;
        this.projectiles = projectileManager;
        this.effects = effects;
    }
    
    update(dt, enemies, gameTime) {
        const results = {
            projectiles: [],
            auraDamage: []
        };
        
        for (const weapon of this.player.weapons) {
            const weaponData = WEAPONS[weapon.id];
            if (!weaponData) continue;
            
            // Armes à cooldown
            if (weaponData.cooldown > 0) {
                if (weapon.cooldownTimer <= 0) {
                    const fired = this.fireWeapon(weapon, weaponData, enemies, gameTime);
                    results.projectiles.push(...fired);
                    
                    // Reset cooldown avec réduction
                    weapon.cooldownTimer = weaponData.cooldown * (1 - this.player.cooldownReduction);
                }
            }
            
            // Armes continues (aura, flamme)
            else {
                const damageResult = this.updateContinuousWeapon(weapon, weaponData, enemies, dt, gameTime);
                results.auraDamage.push(...damageResult);
            }
        }
        
        return results;
    }
    
    fireWeapon(weapon, data, enemies, gameTime) {
        const projectiles = [];
        const level = weapon.level;
        const player = this.player;
        
        // Trouver la cible la plus proche
        const target = this.findClosestEnemy(enemies, player.x, player.y);
        
        // Calculer les bonus de niveau
        const damageBonus = (data.levelBonuses?.damage || 0) * (level - 1);
        const baseDamage = (data.baseDamage + damageBonus) * player.getDamageMultiplier();
        
        switch (weapon.id) {
            case 'blaster':
                projectiles.push(...this.fireBlaster(player, target, data, level, baseDamage));
                break;
                
            case 'plasma_rifle':
                projectiles.push(...this.firePlasmaRifle(player, target, data, level, baseDamage));
                break;
                
            case 'tesla_coil':
                this.fireTeslaCoil(player, enemies, data, level, baseDamage);
                break;
                
            case 'homing_missiles':
                projectiles.push(...this.fireHomingMissiles(player, enemies, data, level, baseDamage));
                break;
                
            case 'rail_gun':
                projectiles.push(...this.fireRailGun(player, target, data, level, baseDamage));
                break;
                
            case 'grenade_launcher':
                projectiles.push(...this.fireGrenadeLauncher(player, target, data, level, baseDamage));
                break;
                
            case 'boomerang_drone':
                projectiles.push(...this.fireBoomerang(player, target, data, level, baseDamage));
                break;
        }
        
        // Spawn les projectiles
        for (const config of projectiles) {
            this.projectiles.spawn(config);
        }
        
        return projectiles;
    }
    
    fireBlaster(player, target, data, level, damage) {
        const projectiles = [];
        
        if (!target) return projectiles;
        
        const projectileCount = data.levelBonuses.projectiles[level - 1] || 1;
        const baseAngle = angle(player.x, player.y, target.x, target.y);
        const speed = data.projectileSpeed * player.projectileSpeedMult;
        const pierce = level >= 5 ? 2 : 1;
        
        for (let i = 0; i < projectileCount; i++) {
            const spreadAngle = projectileCount > 1 ? 
                (i - (projectileCount - 1) / 2) * 0.15 : 0;
            const a = baseAngle + spreadAngle;
            
            projectiles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                damage: damage,
                size: data.projectileSize,
                color: data.color,
                type: 'laser',
                pierce: pierce,
                duration: data.duration * player.durationMult,
                weaponId: 'blaster'
            });
        }
        
        return projectiles;
    }
    
    firePlasmaRifle(player, target, data, level, damage) {
        const projectiles = [];
        
        const baseAngle = target ? 
            angle(player.x, player.y, target.x, target.y) : 
            player.facingAngle;
        
        const count = data.levelBonuses.projectiles[level - 1] || 3;
        const spread = data.levelBonuses.spreadAngle[level - 1] || 0.3;
        const speed = data.projectileSpeed * player.projectileSpeedMult;
        
        for (let i = 0; i < count; i++) {
            const a = baseAngle + (i - (count - 1) / 2) * spread;
            
            projectiles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                damage: damage,
                size: data.projectileSize,
                color: data.color,
                type: 'plasma',
                pierce: 1,
                duration: data.duration * player.durationMult,
                weaponId: 'plasma_rifle'
            });
        }
        
        return projectiles;
    }
    
    fireTeslaCoil(player, enemies, data, level, damage) {
        if (enemies.length === 0) return;
        
        const range = data.range * (data.levelBonuses.rangeMult[level - 1] || 1) * player.areaMult;
        const chainCount = data.levelBonuses.chains[level - 1] || 1;
        
        // Trouver les ennemis à portée
        const inRange = enemies.filter(e => 
            e.hp > 0 && distance(player.x, player.y, e.x, e.y) < range
        );
        
        if (inRange.length === 0) return;
        
        // Première cible
        const firstTarget = randomChoice(inRange);
        let currentTarget = firstTarget;
        const hitTargets = new Set([firstTarget]);
        
        // Chaîne d'éclairs
        let lastX = player.x;
        let lastY = player.y;
        
        for (let i = 0; i <= chainCount && currentTarget; i++) {
            // Appliquer les dégâts
            const actualDamage = damage * (i === 0 ? 1 : 0.7);
            currentTarget.takeDamage(actualDamage);
            currentTarget.stun(0.1);
            
            // Effet visuel
            if (this.effects) {
                this.effects.lightning(lastX, lastY, currentTarget.x, currentTarget.y, data.color);
                this.effects.hit(currentTarget.x, currentTarget.y, data.color, 3);
                this.effects.showDamage(currentTarget.x, currentTarget.y, actualDamage);
            }
            
            lastX = currentTarget.x;
            lastY = currentTarget.y;
            
            // Trouver la prochaine cible
            if (i < chainCount) {
                const chainRange = data.chainRange * player.areaMult;
                const nextTargets = enemies.filter(e => 
                    e.hp > 0 && 
                    !hitTargets.has(e) && 
                    distance(currentTarget.x, currentTarget.y, e.x, e.y) < chainRange
                );
                
                if (nextTargets.length > 0) {
                    currentTarget = randomChoice(nextTargets);
                    hitTargets.add(currentTarget);
                } else {
                    currentTarget = null;
                }
            }
        }
    }
    
    fireHomingMissiles(player, enemies, data, level, damage) {
        const projectiles = [];
        
        const count = data.levelBonuses.projectiles[level - 1] || 1;
        const speed = data.projectileSpeed * (data.levelBonuses.speedMult[level - 1] || 1) * player.projectileSpeedMult;
        
        for (let i = 0; i < count; i++) {
            const spreadAngle = player.facingAngle + (i - (count - 1) / 2) * 0.5 + randomRange(-0.2, 0.2);
            
            projectiles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(spreadAngle) * speed,
                vy: Math.sin(spreadAngle) * speed,
                damage: damage,
                size: data.projectileSize,
                color: data.color,
                type: 'missile',
                pierce: 1,
                duration: data.duration * player.durationMult,
                homing: true,
                homingStrength: data.turnSpeed,
                weaponId: 'homing_missiles'
            });
        }
        
        return projectiles;
    }
    
    fireRailGun(player, target, data, level, damage) {
        const projectiles = [];
        
        const targetAngle = target ? 
            angle(player.x, player.y, target.x, target.y) : 
            player.facingAngle;
        
        const speed = data.projectileSpeed * player.projectileSpeedMult;
        const width = data.width * (data.levelBonuses.widthMult[level - 1] || 1) * player.areaMult;
        
        projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(targetAngle) * speed,
            vy: Math.sin(targetAngle) * speed,
            damage: damage,
            size: width,
            color: data.color,
            type: 'laser',
            pierce: 999,
            duration: data.duration * player.durationMult,
            weaponId: 'rail_gun'
        });
        
        // Effet visuel de recul
        if (this.effects) {
            this.effects.addScreenShake(5, 0.1);
        }
        
        return projectiles;
    }
    
    fireGrenadeLauncher(player, target, data, level, damage) {
        const projectiles = [];
        
        const count = data.levelBonuses.projectiles[level - 1] || 1;
        const explosionRadius = data.explosionRadius * (data.levelBonuses.radiusMult[level - 1] || 1) * player.areaMult;
        
        for (let i = 0; i < count; i++) {
            const targetAngle = target ? 
                angle(player.x, player.y, target.x, target.y) + randomRange(-0.3, 0.3) : 
                player.facingAngle + randomRange(-0.5, 0.5);
            
            const speed = data.projectileSpeed * player.projectileSpeedMult;
            
            projectiles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(targetAngle) * speed,
                vy: Math.sin(targetAngle) * speed,
                damage: damage,
                size: data.projectileSize,
                color: data.color,
                type: 'explosive',
                pierce: 1,
                duration: data.duration,
                explosive: true,
                explosionRadius: explosionRadius,
                weaponId: 'grenade_launcher'
            });
        }
        
        return projectiles;
    }
    
    fireBoomerang(player, target, data, level, damage) {
        const projectiles = [];
        
        const count = data.levelBonuses.projectiles[level - 1] || 1;
        const speed = data.projectileSpeed * (data.levelBonuses.speedMult[level - 1] || 1) * player.projectileSpeedMult;
        
        for (let i = 0; i < count; i++) {
            const spreadAngle = player.facingAngle + (i - (count - 1) / 2) * 0.8;
            
            projectiles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(spreadAngle) * speed,
                vy: Math.sin(spreadAngle) * speed,
                damage: damage,
                size: data.projectileSize,
                color: data.color,
                type: 'boomerang',
                pierce: 999,
                duration: 10,
                isBoomerang: true,
                maxDistance: data.maxDistance * player.areaMult,
                returnTarget: player,
                weaponId: 'boomerang_drone'
            });
        }
        
        return projectiles;
    }
    
    updateContinuousWeapon(weapon, data, enemies, dt, gameTime) {
        const results = [];
        const level = weapon.level;
        const player = this.player;
        const damageBonus = (data.levelBonuses?.damage || 0) * (level - 1);
        const baseDamage = (data.baseDamage + damageBonus) * player.getDamageMultiplier();
        
        switch (weapon.id) {
            case 'shield_orbs':
                results.push(...this.updateShieldOrbs(weapon, data, level, enemies, baseDamage, gameTime));
                break;
                
            case 'force_field':
                results.push(...this.updateForceField(weapon, data, level, enemies, baseDamage, dt));
                break;
                
            case 'flamethrower':
                results.push(...this.updateFlamethrower(weapon, data, level, enemies, baseDamage, dt));
                break;
        }
        
        return results;
    }
    
    updateShieldOrbs(weapon, data, level, enemies, damage, gameTime) {
        const results = [];
        const player = this.player;
        
        const orbCount = data.levelBonuses.orbs[level - 1] || 2;
        const orbRadius = data.orbitRadius * (data.levelBonuses.radiusMult[level - 1] || 1) * player.areaMult;
        const orbSize = data.orbSize * (data.levelBonuses.sizeMult[level - 1] || 1) * player.areaMult;
        const time = gameTime;
        
        for (let i = 0; i < orbCount; i++) {
            const orbAngle = (time * data.orbitSpeed) + (i * Math.PI * 2 / orbCount);
            const orbX = player.x + Math.cos(orbAngle) * orbRadius;
            const orbY = player.y + Math.sin(orbAngle) * orbRadius;
            
            // Vérifier collision avec ennemis
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;
                
                const dist = distance(orbX, orbY, enemy.x, enemy.y);
                if (dist < orbSize + enemy.radius) {
                    // Marquer comme touché pour éviter les dégâts multiples par frame
                    const hitKey = `orb_${i}_${enemy.x}_${enemy.y}`;
                    if (!weapon.hitCooldowns) weapon.hitCooldowns = {};
                    if (!weapon.hitCooldowns[hitKey] || weapon.hitCooldowns[hitKey] <= 0) {
                        results.push({ enemy, damage });
                        weapon.hitCooldowns[hitKey] = 0.3;
                        
                        if (this.effects) {
                            this.effects.hit(enemy.x, enemy.y, data.color, 3);
                        }
                    }
                }
            }
        }
        
        // Décrémenter les cooldowns
        if (weapon.hitCooldowns) {
            for (const key in weapon.hitCooldowns) {
                weapon.hitCooldowns[key] -= 1/60;
            }
        }
        
        return results;
    }
    
    updateForceField(weapon, data, level, enemies, damage, dt) {
        const results = [];
        const player = this.player;
        
        const radius = data.radius * (data.levelBonuses.radiusMult[level - 1] || 1) * player.areaMult;
        const interval = data.damageInterval * (data.levelBonuses.intervalMult[level - 1] || 1);
        
        // Timer de dégâts
        if (!weapon.damageTimer) weapon.damageTimer = 0;
        weapon.damageTimer -= dt;
        
        if (weapon.damageTimer <= 0) {
            weapon.damageTimer = interval;
            
            // Dégâts à tous les ennemis dans le rayon
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;
                
                const dist = distance(player.x, player.y, enemy.x, enemy.y);
                if (dist < radius + enemy.radius) {
                    results.push({ enemy, damage });
                    
                    if (this.effects) {
                        this.effects.hit(enemy.x, enemy.y, data.color, 2);
                    }
                }
            }
        }
        
        // Rendu de l'aura
        this.renderForceField(player.x, player.y, radius, data.color);
        
        return results;
    }
    
    updateFlamethrower(weapon, data, level, enemies, damage, dt) {
        const results = [];
        const player = this.player;
        
        const range = data.range * (data.levelBonuses.rangeMult[level - 1] || 1) * player.areaMult;
        const coneAngle = data.coneAngle * (data.levelBonuses.angleMult[level - 1] || 1);
        const interval = data.damageInterval;
        
        // Timer de dégâts
        if (!weapon.damageTimer) weapon.damageTimer = 0;
        weapon.damageTimer -= dt;
        
        if (weapon.damageTimer <= 0) {
            weapon.damageTimer = interval;
            
            const facingAngle = player.facingAngle;
            
            // Dégâts aux ennemis dans le cône
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;
                
                const dist = distance(player.x, player.y, enemy.x, enemy.y);
                if (dist > range) continue;
                
                const enemyAngle = angle(player.x, player.y, enemy.x, enemy.y);
                let angleDiff = enemyAngle - facingAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                if (Math.abs(angleDiff) < coneAngle) {
                    results.push({ enemy, damage });
                    
                    // Particules de feu
                    if (this.effects && Math.random() < 0.3) {
                        this.effects.spawnParticle({
                            x: enemy.x + randomRange(-10, 10),
                            y: enemy.y + randomRange(-10, 10),
                            vx: randomRange(-30, 30),
                            vy: randomRange(-50, -20),
                            life: 0.3,
                            size: randomRange(5, 10),
                            color: data.color,
                            type: 'circle'
                        });
                    }
                }
            }
        }
        
        return results;
    }
    
    renderForceField(x, y, radius, color) {
        // Cette méthode sera appelée dans le render du jeu
        // Stocke les infos pour le rendu
        this.forceFieldRender = { x, y, radius, color };
    }
    
    findClosestEnemy(enemies, x, y) {
        let closest = null;
        let closestDist = Infinity;
        
        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            const dist = distance(x, y, enemy.x, enemy.y);
            if (dist < closestDist) {
                closestDist = dist;
                closest = enemy;
            }
        }
        
        return closest;
    }
}