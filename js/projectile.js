// ========================================
// GALACTIC SURVIVOR - Système de Projectiles
// ========================================

import { WEAPONS } from './constants.js';
import { distance, angle, normalize, circleCollision, randomRange } from './utils.js';

// === CLASSE PROJECTILE ===
class Projectile {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.damage = 0;
        this.size = 8;
        this.color = '#00ffff';
        this.duration = 2;
        this.maxDuration = 2;
        this.pierce = 1;
        this.pierceCount = 0;
        this.type = 'normal';
        this.weaponId = null;
        this.isEnemy = false;
        this.hitTargets = new Set();
        
        // Homing
        this.homing = false;
        this.homingStrength = 0;
        this.target = null;
        
        // Explosion
        this.explosive = false;
        this.explosionRadius = 0;
        
        // Boomerang
        this.isBoomerang = false;
        this.boomerangState = 'going';
        this.startX = 0;
        this.startY = 0;
        this.maxDistance = 0;
        
        // Visuel
        this.trail = [];
        this.rotation = 0;
    }
    
    init(config) {
        this.active = true;
        this.x = config.x;
        this.y = config.y;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.damage = config.damage || 10;
        this.size = config.size || 8;
        this.color = config.color || '#00ffff';
        this.duration = config.duration || 2;
        this.maxDuration = this.duration;
        this.pierce = config.pierce || 1;
        this.pierceCount = 0;
        this.type = config.type || 'normal';
        this.weaponId = config.weaponId || null;
        this.isEnemy = config.isEnemy || false;
        this.hitTargets.clear();
        
        this.homing = config.homing || false;
        this.homingStrength = config.homingStrength || 3;
        this.target = null;
        
        this.explosive = config.explosive || false;
        this.explosionRadius = config.explosionRadius || 0;
        
        this.isBoomerang = config.isBoomerang || false;
        this.boomerangState = 'going';
        this.startX = this.x;
        this.startY = this.y;
        this.maxDistance = config.maxDistance || 300;
        this.returnTarget = config.returnTarget || null;
        
        this.trail = [];
        this.rotation = Math.atan2(this.vy, this.vx);
    }
    
    update(dt, targets, player) {
        if (!this.active) return null;
        
        // Durée de vie
        this.duration -= dt;
        if (this.duration <= 0) {
            this.active = false;
            if (this.explosive) {
                return { type: 'explosion', x: this.x, y: this.y, radius: this.explosionRadius, damage: this.damage };
            }
            return null;
        }
        
        // Homing
        if (this.homing && !this.isEnemy) {
            this.updateHoming(dt, targets);
        }
        
        // Boomerang
        if (this.isBoomerang) {
            this.updateBoomerang(dt, player);
        }
        
        // Mouvement
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) {
            this.trail.shift();
        }
        
        // Rotation
        this.rotation = Math.atan2(this.vy, this.vx);
        
        return null;
    }
    
    updateHoming(dt, targets) {
        if (!this.target || !targets.includes(this.target) || this.target.hp <= 0) {
            // Trouver une nouvelle cible
            let closest = null;
            let closestDist = Infinity;
            
            for (const target of targets) {
                if (target.hp <= 0) continue;
                const dist = distance(this.x, this.y, target.x, target.y);
                if (dist < closestDist && dist < 400) {
                    closestDist = dist;
                    closest = target;
                }
            }
            
            this.target = closest;
        }
        
        if (this.target) {
            const targetAngle = angle(this.x, this.y, this.target.x, this.target.y);
            const currentAngle = Math.atan2(this.vy, this.vx);
            
            let angleDiff = targetAngle - currentAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            const turn = this.homingStrength * dt;
            const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turn);
            
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            this.vx = Math.cos(newAngle) * speed;
            this.vy = Math.sin(newAngle) * speed;
        }
    }
    
    updateBoomerang(dt, player) {
        if (this.boomerangState === 'going') {
            const dist = distance(this.x, this.y, this.startX, this.startY);
            if (dist >= this.maxDistance) {
                this.boomerangState = 'returning';
            }
        }
        
        if (this.boomerangState === 'returning' && player) {
            const targetAngle = angle(this.x, this.y, player.x, player.y);
            const currentAngle = Math.atan2(this.vy, this.vx);
            
            let angleDiff = targetAngle - currentAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            const turn = 8 * dt;
            const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turn);
            
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) * 1.02;
            this.vx = Math.cos(newAngle) * speed;
            this.vy = Math.sin(newAngle) * speed;
            
            // Disparaître si retourné au joueur
            if (distance(this.x, this.y, player.x, player.y) < 30) {
                this.active = false;
            }
        }
    }
    
    checkCollision(target) {
        if (!this.active || this.hitTargets.has(target)) return false;
        if (this.isEnemy && target.isPlayer) {
            return circleCollision(this.x, this.y, this.size, target.x, target.y, target.radius);
        }
        if (!this.isEnemy && !target.isPlayer) {
            return circleCollision(this.x, this.y, this.size, target.x, target.y, target.radius);
        }
        return false;
    }
    
    onHit(target) {
        this.hitTargets.add(target);
        this.pierceCount++;
        
        if (this.pierceCount >= this.pierce) {
            this.active = false;
            
            if (this.explosive) {
                return { type: 'explosion', x: this.x, y: this.y, radius: this.explosionRadius, damage: this.damage };
            }
        }
        
        return null;
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // Trail
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size * 0.5;
            ctx.globalAlpha = 0.3;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        switch (this.type) {
            case 'laser':
            case 'normal':
                // Forme allongée
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, this.size * 1.5, this.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Core blanc
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(0, 0, this.size * 0.8, this.size * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'plasma':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'missile':
                // Corps du missile
                ctx.fillStyle = '#888888';
                ctx.fillRect(-this.size, -this.size * 0.4, this.size * 2, this.size * 0.8);
                
                // Pointe
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(this.size, 0);
                ctx.lineTo(this.size * 0.5, -this.size * 0.5);
                ctx.lineTo(this.size * 0.5, this.size * 0.5);
                ctx.closePath();
                ctx.fill();
                
                // Flamme
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.moveTo(-this.size, 0);
                ctx.lineTo(-this.size * 1.5, -this.size * 0.3);
                ctx.lineTo(-this.size * 2, 0);
                ctx.lineTo(-this.size * 1.5, this.size * 0.3);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'explosive':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Indicateur de danger
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
                
            case 'boomerang':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Symbole de rotation
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 1.5);
                ctx.stroke();
                break;
                
            default:
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
        }
        
        ctx.restore();
    }
}

// === GESTIONNAIRE DE PROJECTILES ===
export class ProjectileManager {
    constructor(maxProjectiles = 1000) {
        this.projectiles = [];
        this.maxProjectiles = maxProjectiles;
        
        // Pool de projectiles
        for (let i = 0; i < maxProjectiles; i++) {
            this.projectiles.push(new Projectile());
        }
    }
    
    getProjectile() {
        for (const p of this.projectiles) {
            if (!p.active) return p;
        }
        return null;
    }
    
    spawn(config) {
        const p = this.getProjectile();
        if (p) {
            p.init(config);
            return p;
        }
        return null;
    }
    
    spawnMultiple(configs) {
        const spawned = [];
        for (const config of configs) {
            const p = this.spawn(config);
            if (p) spawned.push(p);
        }
        return spawned;
    }
    
    update(dt, enemies, player, effects) {
        const results = {
            explosions: [],
            enemyHits: [],
            playerHits: []
        };
        
        for (const p of this.projectiles) {
            if (!p.active) continue;
            
            // Update
            const updateResult = p.update(dt, enemies, player);
            if (updateResult && updateResult.type === 'explosion') {
                results.explosions.push(updateResult);
            }
            
            if (!p.active) continue;
            
            // Collisions avec ennemis (projectiles du joueur)
            if (!p.isEnemy) {
                for (const enemy of enemies) {
                    if (enemy.hp <= 0) continue;
                    if (!enemy.canCollide()) continue;
                    
                    if (p.checkCollision(enemy)) {
                        const hitResult = p.onHit(enemy);
                        results.enemyHits.push({
                            enemy,
                            damage: p.damage,
                            projectile: p
                        });
                        
                        if (hitResult && hitResult.type === 'explosion') {
                            results.explosions.push(hitResult);
                        }
                        
                        if (effects) {
                            effects.hit(enemy.x, enemy.y, p.color, 5);
                        }
                    }
                }
            }
            
            // Collisions avec joueur (projectiles ennemis)
            if (p.isEnemy && player) {
                player.isPlayer = true;
                if (p.checkCollision(player)) {
                    p.onHit(player);
                    results.playerHits.push({
                        damage: p.damage,
                        projectile: p
                    });
                }
                player.isPlayer = false;
            }
        }
        
        // Traiter les explosions
        for (const explosion of results.explosions) {
            this.handleExplosion(explosion, enemies, effects);
        }
        
        return results;
    }
    
    handleExplosion(explosion, enemies, effects) {
        // Dégâts aux ennemis dans le rayon
        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            
            const dist = distance(explosion.x, explosion.y, enemy.x, enemy.y);
            if (dist < explosion.radius) {
                const damage = explosion.damage * (1 - dist / explosion.radius * 0.5);
                enemy.takeDamage(damage);
            }
        }
        
        // Effet visuel
        if (effects) {
            effects.explosion(explosion.x, explosion.y, '#ff6600', 25, 12);
            effects.addScreenShake(12, 0.2);
        }
    }
    
    render(ctx) {
        for (const p of this.projectiles) {
            if (p.active) {
                p.render(ctx);
            }
        }
    }
    
    clear() {
        for (const p of this.projectiles) {
            p.reset();
        }
    }
    
    getActiveCount() {
        return this.projectiles.filter(p => p.active).length;
    }
}