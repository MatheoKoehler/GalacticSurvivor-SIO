// ========================================
// GALACTIC SURVIVOR - Système d'Ennemis
// ========================================

import { ENEMIES, BOSSES, SPAWN_CONFIG, MAPS, CONFIG } from './constants.js';
import { 
    distance, angle, normalize, randomRange, randomInt, 
    randomChoice, circleCollision, clamp 
} from './utils.js';

// === CLASSE ENNEMI ===
export class Enemy {
    constructor(x, y, type, difficultyMult = 1, isElite = false) {
        const data = ENEMIES[type];
        
        if (!data) {
            console.error('Enemy type not found:', type);
            // Fallback vers grunt
            this.data = ENEMIES['grunt'] || {
                id: 'grunt',
                name: 'Alien Grunt',
                icon: '👽',
                hp: 10,
                damage: 8,
                speed: 60,
                size: 28,
                color: '#44ff44',
                xpValue: 1,
                goldChance: 0.15,
                behavior: 'chase'
            };
        } else {
            this.data = data;
        }
        
        this.x = x;
        this.y = y;
        this.type = type;
        this.isElite = isElite;
        this.isBoss = false;
        
        // Stats avec scaling
        const eliteMult = isElite ? 3 : 1;
        this.maxHp = Math.floor((this.data.hp || 10) * difficultyMult * eliteMult);
        this.hp = this.maxHp;
        this.damage = Math.floor((this.data.damage || 5) * difficultyMult * (isElite ? 1.5 : 1));
        this.speed = (this.data.speed || 60) * (isElite ? 1.2 : 1);
        this.size = (this.data.size || 28) * (isElite ? 1.3 : 1);
        this.radius = this.size / 2;
        
        // XP et drops
        this.xpValue = Math.floor((this.data.xpValue || 1) * difficultyMult * eliteMult);
        this.goldChance = (this.data.goldChance || 0.1) * (isElite ? 2 : 1);
        
        // Comportement
        this.behavior = this.data.behavior || 'chase';
        this.state = 'chase';
        this.stateTimer = 0;
        
        // Spécifique au type
        this.shootCooldown = this.data.shootCooldown || 2;
        this.shootTimer = this.shootCooldown;
        this.phaseTimer = this.data.phaseInterval || 3;
        this.isPhased = false;
        this.dashCooldown = this.data.dashCooldown || 3;
        this.dashTimer = this.dashCooldown;
        this.isDashing = false;
        this.dashVx = 0;
        this.dashVy = 0;
        
        // Spawner spécifique
        this.spawnTimer = this.data.spawnInterval || 3;
        this.spawnCount = 0;
        this.maxSpawns = this.data.maxSpawns || 10;
        
        // Knockback
        this.knockbackX = 0;
        this.knockbackY = 0;
        
        // Effets
        this.hitFlash = 0;
        this.stunTime = 0;
    }
    
    update(dt, player, enemies) {
        // Timer de flash
        if (this.hitFlash > 0) this.hitFlash -= dt;
        
        // Stun
        if (this.stunTime > 0) {
            this.stunTime -= dt;
            return { projectiles: [], spawns: [] };
        }
        
        // Knockback
        if (this.knockbackX !== 0 || this.knockbackY !== 0) {
            this.x += this.knockbackX * dt;
            this.y += this.knockbackY * dt;
            this.knockbackX *= 0.9;
            this.knockbackY *= 0.9;
            if (Math.abs(this.knockbackX) < 1) this.knockbackX = 0;
            if (Math.abs(this.knockbackY) < 1) this.knockbackY = 0;
        }
        
        const result = { projectiles: [], spawns: [] };
        
        // Comportement selon le type
        switch (this.behavior) {
            case 'chase':
                this.behaviorChase(dt, player);
                break;
                
            case 'swarm':
                this.behaviorSwarm(dt, player, enemies);
                break;
                
            case 'ranged':
                result.projectiles = this.behaviorRanged(dt, player);
                break;
                
            case 'phase':
                this.behaviorPhase(dt, player);
                break;
                
            case 'aggressive':
                this.behaviorAggressive(dt, player);
                break;
                
            case 'kamikaze':
                this.behaviorKamikaze(dt, player);
                break;
                
            case 'spawner':
                result.spawns = this.behaviorSpawner(dt, player);
                break;
                
            default:
                this.behaviorChase(dt, player);
        }
        
        return result;
    }
    
    behaviorChase(dt, player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }
    
    behaviorSwarm(dt, player, enemies) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Mouvement vers le joueur avec léger décalage aléatoire
        if (dist > 0) {
            const noise = Math.sin(performance.now() / 200 + this.x * 0.1) * 0.3;
            this.x += ((dx / dist) + noise) * this.speed * dt;
            this.y += ((dy / dist) + noise * 0.5) * this.speed * dt;
        }
    }
    
    behaviorRanged(dt, player) {
        const projectiles = [];
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Garder une distance
        const preferredDist = 250;
        
        if (dist < preferredDist - 50) {
            // Trop proche, reculer
            this.x -= (dx / dist) * this.speed * dt;
            this.y -= (dy / dist) * this.speed * dt;
        } else if (dist > preferredDist + 50) {
            // Trop loin, avancer
            this.x += (dx / dist) * this.speed * 0.5 * dt;
            this.y += (dy / dist) * this.speed * 0.5 * dt;
        }
        
        // Tirer
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && dist < 400) {
            this.shootTimer = this.shootCooldown;
            
            const shootAngle = Math.atan2(dy, dx);
            projectiles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(shootAngle) * (this.data.projectileSpeed || 300),
                vy: Math.sin(shootAngle) * (this.data.projectileSpeed || 300),
                damage: this.damage,
                size: 8,
                color: '#ff4444',
                isEnemy: true,
                duration: 3
            });
        }
        
        return projectiles;
    }
    
    behaviorPhase(dt, player) {
        this.phaseTimer -= dt;
        
        if (this.phaseTimer <= 0) {
            this.isPhased = !this.isPhased;
            this.phaseTimer = this.data.phaseInterval || 3;
        }
        
        // Se déplacer vers le joueur (plus vite si phasé)
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speedMult = this.isPhased ? 1.5 : 1;
        
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * speedMult * dt;
            this.y += (dy / dist) * this.speed * speedMult * dt;
        }
    }
    
    behaviorAggressive(dt, player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        this.dashTimer -= dt;
        
        if (this.isDashing) {
            this.x += this.dashVx * dt;
            this.y += this.dashVy * dt;
            
            // Fin du dash
            if (this.dashTimer <= -0.3) {
                this.isDashing = false;
                this.dashTimer = this.dashCooldown;
            }
        } else if (this.dashTimer <= 0 && dist < 300 && dist > 50) {
            // Commencer un dash
            this.isDashing = true;
            const dashSpeed = this.speed * 4;
            this.dashVx = (dx / dist) * dashSpeed;
            this.dashVy = (dy / dist) * dashSpeed;
        } else {
            // Mouvement normal
            if (dist > 0) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
        }
    }
    
    behaviorKamikaze(dt, player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Accélérer en se rapprochant
        const speedMult = dist < 100 ? 1.5 : 1;
        
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * speedMult * dt;
            this.y += (dy / dist) * this.speed * speedMult * dt;
        }
    }
    
    behaviorSpawner(dt, player) {
        const spawns = [];
        
        this.spawnTimer -= dt;
        
        if (this.spawnTimer <= 0 && this.spawnCount < this.maxSpawns) {
            this.spawnTimer = this.data.spawnInterval || 3;
            this.spawnCount++;
            
            // Spawn un ennemi
            const spawnAngle = randomRange(0, Math.PI * 2);
            const dist = 50;
            spawns.push({
                type: this.data.spawnType || 'insectoid',
                x: this.x + Math.cos(spawnAngle) * dist,
                y: this.y + Math.sin(spawnAngle) * dist
            });
        }
        
        return spawns;
    }
    
    takeDamage(amount, knockback = null) {
        this.hp -= amount;
        this.hitFlash = 0.1;
        
        if (knockback) {
            this.knockbackX += knockback.x;
            this.knockbackY += knockback.y;
        }
        
        return this.hp <= 0;
    }
    
    stun(duration) {
        this.stunTime = Math.max(this.stunTime, duration);
    }
    
    canCollide() {
        return !this.isPhased;
    }
    
    getDrops() {
        const drops = [];
        
        // XP
        if (this.xpValue <= 5) {
            drops.push({ type: 'xp_small', value: this.xpValue });
        } else if (this.xpValue <= 20) {
            drops.push({ type: 'xp_medium', value: this.xpValue });
        } else if (this.xpValue <= 50) {
            drops.push({ type: 'xp_large', value: this.xpValue });
        } else {
            drops.push({ type: 'xp_rare', value: this.xpValue });
        }
        
        // Gold
        if (Math.random() < this.goldChance) {
            drops.push({ type: 'gold_small', value: 1 });
        }
        
        // Drops spéciaux (élites)
        if (this.isElite) {
            if (Math.random() < 0.3) {
                drops.push({ type: 'gold_large', value: 5 });
            }
            if (Math.random() < 0.1) {
                drops.push({ type: 'health_small', value: 20 });
            }
        }
        
        return drops;
    }
    
    render(ctx) {
        ctx.save();
        
        // Effet de phase
        if (this.isPhased) {
            ctx.globalAlpha = 0.4;
        }
        
        // Flash de dégâts
        if (this.hitFlash > 0) {
            ctx.filter = 'brightness(3)';
        }
        
        // Indicateur d'élite
        if (this.isElite) {
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 15;
        }
        
        // Corps de l'ennemi
        const color = this.data.color || '#44ff44';
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.darkenColor(color, 0.5));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Contour
        ctx.strokeStyle = this.isElite ? '#ffff00' : color;
        ctx.lineWidth = this.isElite ? 3 : 2;
        ctx.stroke();
        
        // Icône
        ctx.fillStyle = '#000000';
        ctx.font = `${this.size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.data.icon || '👽', this.x, this.y);
        
        // Barre de vie pour élites et tanks
        if (this.isElite || this.maxHp > 30) {
            const barWidth = this.size * 1.2;
            const barHeight = 4;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.radius - 10;
            
            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = this.isElite ? '#ffff00' : '#ff4444';
            ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
        }
        
        ctx.restore();
    }
    
    darkenColor(hex, factor) {
        if (!hex || typeof hex !== 'string') return 'rgb(50, 50, 50)';
        
        try {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            
            const newR = Math.floor(r * factor);
            const newG = Math.floor(g * factor);
            const newB = Math.floor(b * factor);
            
            return `rgb(${newR}, ${newG}, ${newB})`;
        } catch (e) {
            return 'rgb(50, 50, 50)';
        }
    }
}

// === CLASSE BOSS ===
export class Boss extends Enemy {
    constructor(x, y, bossId, difficultyMult = 1) {
        const data = BOSSES[bossId];
        
        if (!data) {
            console.error('Boss not found:', bossId);
        }
        
        // Créer un pseudo-type ennemi pour le parent
        super(x, y, 'grunt', difficultyMult, false);
        
        this.bossId = bossId;
        this.bossData = data || {
            id: bossId,
            name: 'Unknown Boss',
            icon: '👹',
            hp: 500,
            damage: 30,
            speed: 40,
            size: 80,
            color: '#ff0000',
            xpValue: 200,
            goldValue: 50,
            attacks: ['charge'],
            phases: 3
        };
        this.isBoss = true;
        
        // Override les stats avec celles du boss
        this.maxHp = Math.floor((this.bossData.hp || 500) * difficultyMult);
        this.hp = this.maxHp;
        this.damage = this.bossData.damage || 30;
        this.speed = this.bossData.speed || 40;
        this.size = this.bossData.size || 80;
        this.radius = this.size / 2;
        
        this.xpValue = this.bossData.xpValue || 200;
        this.goldValue = this.bossData.goldValue || 50;
        
        // Phases
        this.phase = 1;
        this.maxPhases = this.bossData.phases || 3;
        this.phaseThresholds = [];
        for (let i = 1; i <= this.maxPhases; i++) {
            this.phaseThresholds.push(1 - (i / this.maxPhases));
        }
        
        // Attaques
        this.attacks = this.bossData.attacks || ['charge'];
        this.currentAttack = null;
        this.attackTimer = 2;
        this.attackCooldown = 3;
        
        // État
        this.isEnraged = false;
        this.spawnedMinions = [];
    }
    
    update(dt, player, enemies) {
        // Vérifier le changement de phase
        const hpPercent = this.hp / this.maxHp;
        let newPhase = 1;
        for (let i = 0; i < this.phaseThresholds.length; i++) {
            if (hpPercent <= this.phaseThresholds[i]) {
                newPhase = i + 2;
            }
        }
        
        if (newPhase > this.phase) {
            this.phase = newPhase;
            this.onPhaseChange();
        }
        
        // Enragé en dernière phase
        if (this.phase === this.maxPhases && !this.isEnraged) {
            this.isEnraged = true;
            this.speed *= 1.5;
            this.attackCooldown *= 0.7;
        }
        
        // Gestion des attaques
        this.attackTimer -= dt;
        
        if (this.attackTimer <= 0 && !this.currentAttack) {
            this.startAttack(player);
        }
        
        const result = { projectiles: [], spawns: [] };
        
        if (this.currentAttack) {
            const attackResult = this.executeAttack(dt, player);
            result.projectiles = attackResult.projectiles || [];
            result.spawns = attackResult.spawns || [];
        } else {
            // Mouvement de base
            this.behaviorChase(dt, player);
        }
        
        // Hit flash
        if (this.hitFlash > 0) this.hitFlash -= dt;
        
        return result;
    }
    
    onPhaseChange() {
        // Effet visuel, soins partiels, etc.
        this.speed *= 1.1;
    }
    
    startAttack(player) {
        const availableAttacks = this.attacks.filter(a => a !== 'all');
        if (availableAttacks.length === 0) {
            availableAttacks.push('charge');
        }
        
        this.currentAttack = randomChoice(availableAttacks);
        this.attackDuration = 2;
        this.attackState = 'starting';
        this.attackTarget = { x: player.x, y: player.y };
    }
    
    executeAttack(dt, player) {
        const result = { projectiles: [], spawns: [] };
        
        this.attackDuration -= dt;
        
        switch (this.currentAttack) {
            case 'spawn_swarm':
                if (this.attackState === 'starting') {
                    // Spawn plusieurs ennemis
                    for (let i = 0; i < 5 + this.phase * 2; i++) {
                        const spawnAngle = (i / (5 + this.phase * 2)) * Math.PI * 2;
                        const dist = this.radius + 30;
                        result.spawns.push({
                            type: 'insectoid',
                            x: this.x + Math.cos(spawnAngle) * dist,
                            y: this.y + Math.sin(spawnAngle) * dist
                        });
                    }
                    this.attackState = 'executing';
                }
                break;
                
            case 'acid_spit':
            case 'missiles':
                if (this.attackDuration > 1.5 && this.attackState !== 'fired') {
                    // Tirer des projectiles
                    const count = 3 + this.phase;
                    for (let i = 0; i < count; i++) {
                        const baseAngle = angle(this.x, this.y, player.x, player.y);
                        const spread = 0.3;
                        const a = baseAngle + (i - (count - 1) / 2) * spread;
                        
                        result.projectiles.push({
                            x: this.x,
                            y: this.y,
                            vx: Math.cos(a) * 250,
                            vy: Math.sin(a) * 250,
                            damage: this.damage,
                            size: 12,
                            color: '#88ff00',
                            isEnemy: true,
                            duration: 4
                        });
                    }
                    this.attackState = 'fired';
                }
                break;
                
            case 'charge':
            case 'stomp':
                if (this.attackState === 'starting') {
                    // Se préparer à charger
                    this.attackState = 'charging';
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    this.chargeVx = (dx / dist) * this.speed * 5;
                    this.chargeVy = (dy / dist) * this.speed * 5;
                } else if (this.attackState === 'charging') {
                    this.x += this.chargeVx * dt;
                    this.y += this.chargeVy * dt;
                }
                break;
                
            case 'laser_sweep':
                // Laser rotatif (simplifié - juste des projectiles en cercle)
                if (this.attackDuration > 1) {
                    const time = performance.now() / 100;
                    const laserAngle = time % (Math.PI * 2);
                    
                    result.projectiles.push({
                        x: this.x + Math.cos(laserAngle) * 50,
                        y: this.y + Math.sin(laserAngle) * 50,
                        vx: Math.cos(laserAngle) * 400,
                        vy: Math.sin(laserAngle) * 400,
                        damage: this.damage * 0.5,
                        size: 6,
                        color: '#ff0000',
                        isEnemy: true,
                        duration: 1
                    });
                }
                break;
                
            case 'summon_elites':
                if (this.attackState === 'starting') {
                    for (let i = 0; i < 2; i++) {
                        const spawnAngle = Math.random() * Math.PI * 2;
                        result.spawns.push({
                            type: 'elite',
                            x: this.x + Math.cos(spawnAngle) * 100,
                            y: this.y + Math.sin(spawnAngle) * 100,
                            isElite: true
                        });
                    }
                    this.attackState = 'done';
                }
                break;
        }
        
        if (this.attackDuration <= 0) {
            this.currentAttack = null;
            this.attackTimer = this.attackCooldown;
            this.attackState = null;
        }
        
        return result;
    }
    
    getDrops() {
        const drops = [];
        
        // Beaucoup d'XP
        for (let i = 0; i < 10; i++) {
            drops.push({ type: 'xp_rare', value: Math.floor(this.xpValue / 10) });
        }
        
        // Beaucoup d'or
        for (let i = 0; i < 5; i++) {
            drops.push({ type: 'gold_large', value: Math.floor(this.goldValue / 5) });
        }
        
        // Soin garanti
        drops.push({ type: 'health_large', value: 50 });
        
        return drops;
    }
    
    render(ctx) {
        ctx.save();
        
        // Aura de boss
        const pulseScale = 1 + Math.sin(performance.now() / 200) * 0.1;
        
        // Cercle d'aura
        const color = this.bossData.color || '#ff0000';
        const auraGradient = ctx.createRadialGradient(
            this.x, this.y, this.radius,
            this.x, this.y, this.radius * 2
        );
        auraGradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
        auraGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2 * pulseScale, 0, Math.PI * 2);
        ctx.fill();
        
        // Flash de dégâts
        if (this.hitFlash > 0) {
            ctx.filter = 'brightness(2)';
        }
        
        // Corps du boss
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.7, this.darkenColor(color, 0.7));
        gradient.addColorStop(1, this.darkenColor(color, 0.4));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Contour enragé
        ctx.strokeStyle = this.isEnraged ? '#ff0000' : color;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Icône
        ctx.fillStyle = '#000000';
        ctx.font = `${this.size * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.bossData.icon || '👹', this.x, this.y);
        
        // Indicateur de phase
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Orbitron, sans-serif';
        ctx.fillText(`Phase ${this.phase}/${this.maxPhases}`, this.x, this.y + this.radius + 20);
        
        ctx.restore();
    }
}

// === SPAWNER D'ENNEMIS ===
export class EnemySpawner {
    constructor(mapData) {
        this.mapData = mapData;
        this.mapSize = mapData.size || { width: 4000, height: 4000 };
        this.difficultyMult = mapData.difficultyMult || 1;
        
        this.spawnTimer = 0;
        this.spawnRate = SPAWN_CONFIG.baseSpawnRate;
        this.waveIndex = 0;
        
        this.bossSpawned = {};
        this.totalSpawned = 0;
    }
    
    update(dt, gameTime, player, currentEnemyCount) {
        const result = { enemies: [], boss: null };
        
        // Déterminer la vague actuelle
        this.updateWave(gameTime);
        
        // Vérifier spawn de boss
        const bossToSpawn = this.checkBossSpawn(gameTime);
        if (bossToSpawn) {
            result.boss = this.spawnBoss(bossToSpawn, player);
        }
        
        // Limiter le nombre d'ennemis
        const maxEnemies = (SPAWN_CONFIG.maxEnemiesBase || 100) + 
            Math.floor(gameTime / 60) * (SPAWN_CONFIG.maxEnemiesScale || 10);
        
        const configMaxEnemies = (CONFIG && CONFIG.MAX_ENEMIES) ? CONFIG.MAX_ENEMIES : 500;
        
        if (currentEnemyCount >= Math.min(maxEnemies, configMaxEnemies)) {
            return result;
        }
        
        // Spawn timer
        this.spawnTimer -= dt * 1000;
        
        if (this.spawnTimer <= 0) {
            const wave = SPAWN_CONFIG.waves[this.waveIndex] || SPAWN_CONFIG.waves[SPAWN_CONFIG.waves.length - 1];
            
            // Nombre d'ennemis à spawn
            const count = Math.floor((wave.weight || 1) * (1 + gameTime / 300));
            
            for (let i = 0; i < count && currentEnemyCount + result.enemies.length < maxEnemies; i++) {
                const enemy = this.spawnEnemy(player, wave);
                if (enemy) {
                    result.enemies.push(enemy);
                }
            }
            
            // Reset timer avec decay
            this.spawnRate = Math.max(
                SPAWN_CONFIG.minSpawnRate || 300,
                this.spawnRate * (SPAWN_CONFIG.spawnRateDecay || 0.97)
            );
            this.spawnTimer = this.spawnRate;
        }
        
        return result;
    }
    
    updateWave(gameTime) {
        for (let i = SPAWN_CONFIG.waves.length - 1; i >= 0; i--) {
            if (gameTime >= SPAWN_CONFIG.waves[i].time) {
                this.waveIndex = i;
                break;
            }
        }
    }
    
    spawnEnemy(player, wave) {
        // Position de spawn (hors écran mais pas trop loin)
        const spawnAngle = Math.random() * Math.PI * 2;
        const minDist = (SPAWN_CONFIG.spawnDistance && SPAWN_CONFIG.spawnDistance.min) || 400;
        const maxDist = (SPAWN_CONFIG.spawnDistance && SPAWN_CONFIG.spawnDistance.max) || 600;
        const dist = randomRange(minDist, maxDist);
        
        let x = player.x + Math.cos(spawnAngle) * dist;
        let y = player.y + Math.sin(spawnAngle) * dist;
        
        // Limiter à la map
        x = clamp(x, 50, this.mapSize.width - 50);
        y = clamp(y, 50, this.mapSize.height - 50);
        
        // Choisir le type d'ennemi
        let types = wave.types || ['grunt'];
        if (types.includes('all')) {
            types = this.mapData.enemies || ['grunt'];
        }
        
        // Filtrer par ennemis disponibles sur la map
        const mapEnemies = this.mapData.enemies || ['grunt'];
        types = types.filter(t => mapEnemies.includes(t));
        if (types.length === 0) types = ['grunt'];
        
        const type = randomChoice(types);
        
        // Élite?
        const eliteChance = (wave.eliteChance || 0) + (this.mapData.eliteChance || 0);
        const isElite = Math.random() < eliteChance;
        
        this.totalSpawned++;
        
        return new Enemy(x, y, type, this.difficultyMult, isElite);
    }
    
    checkBossSpawn(gameTime) {
        const bossId = this.mapData.boss;
        if (!bossId || this.bossSpawned[bossId]) return null;
        
        const bossData = BOSSES[bossId];
        if (bossData && gameTime >= (bossData.spawnTime || 300)) {
            this.bossSpawned[bossId] = true;
            return bossId;
        }
        
        return null;
    }
    
    spawnBoss(bossId, player) {
        const spawnAngle = Math.random() * Math.PI * 2;
        const dist = 500;
        
        const x = clamp(
            player.x + Math.cos(spawnAngle) * dist,
            100,
            this.mapSize.width - 100
        );
        const y = clamp(
            player.y + Math.sin(spawnAngle) * dist,
            100,
            this.mapSize.height - 100
        );
        
        return new Boss(x, y, bossId, this.difficultyMult);
    }
    
    getWaveNumber() {
        return this.waveIndex + 1;
    }
}