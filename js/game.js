// ========================================
// GALACTIC SURVIVOR - Classe Game Principale
// ========================================

import { Player } from './player.js';
import { Enemy, Boss, EnemySpawner } from './enemy.js';
import { ProjectileManager } from './projectile.js';
import { WeaponSystem } from './weapon.js';
import { ItemManager, Chest } from './item.js';
import { EffectsManager } from './effects.js';
import { MAPS, CONFIG, WEAPONS, PASSIVES } from './constants.js';
import { distance, randomRange, shuffleArray } from './utils.js';

export class Game {
    constructor(canvas, ctx, ui, saveManager, audioManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.save = saveManager;
        this.audio = audioManager;
        
        this.isRunning = false;
        this.isPaused = false;
        this.gameTime = 0;
        this.lastTime = 0;
        
        this.player = null;
        this.enemies = [];
        this.boss = null;
        this.projectiles = new ProjectileManager(CONFIG.MAX_PROJECTILES);
        this.items = new ItemManager(500);
        this.effects = new EffectsManager();
        this.weaponSystem = null;
        this.spawner = null;
        this.chests = [];
        
        this.killCount = 0;
        this.goldCollected = 0;
        this.bossKills = 0;
        
        this.camera = { x: 0, y: 0 };
        this.currentMap = null;
        
        this.setupInput();
        this.setupUICallbacks();
    }
    
    setupInput() {
        this.keys = {};
        
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (this.isRunning && !this.ui.currentScreen.includes('levelup')) {
                    this.togglePause();
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    setupUICallbacks() {
        this.ui.onStartGame = (characterId, mapId) => {
            this.startGame(characterId, mapId);
        };
        
        this.ui.onResumeGame = () => {
            this.togglePause();
        };
        
        this.ui.onQuitGame = () => {
            this.endGame(false);
        };
        
        this.ui.onRerollRequest = () => {
            return this.generateUpgradeChoices(4);
        };
    }
    
    startGame(characterId, mapId) {
        console.log('Game.startGame called with:', characterId, mapId);
        console.log('Map data:', MAPS[mapId]);
        // Reset
        this.enemies = [];
        this.boss = null;
        this.projectiles.clear();
        this.items.clear();
        this.effects.clear();
        this.chests = [];
        this.killCount = 0;
        this.goldCollected = 0;
        this.bossKills = 0;
        this.gameTime = 0;
        
        // Charger la map
        this.currentMap = MAPS[mapId];
        
        // Créer le joueur
        const talentBonuses = this.save.getTalentBonuses();
        this.player = new Player(
            this.currentMap.size.width / 2,
            this.currentMap.size.height / 2,
            characterId,
            talentBonuses,
            this.effects
        );
        
        // Systèmes
        this.weaponSystem = new WeaponSystem(this.player, this.projectiles, this.effects);
        this.spawner = new EnemySpawner(this.currentMap);
        
        // Resize canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Démarrer
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        this.ui.showGame();
        this.ui.updateWeaponsDisplay(this.player.weapons);
        this.ui.updatePassivesDisplay(this.player.passives);
        
        // Audio
        this.audio.init();
        this.audio.playMusic('game');
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.update(deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    update(dt) {
        this.gameTime += dt;
        
        // Mise à jour du joueur
        this.player.update(dt, this.keys, this.currentMap.size);
        
        // Caméra suit le joueur
        this.updateCamera();
        
        // Spawn d'ennemis
        const spawnResult = this.spawner.update(dt, this.gameTime, this.player, this.enemies.length);
        
        for (const enemy of spawnResult.enemies) {
            this.enemies.push(enemy);
            this.save.markEnemySeen(enemy.type);
        }
        
        if (spawnResult.boss && !this.boss) {
            this.boss = spawnResult.boss;
            this.enemies.push(this.boss);
            this.ui.showBossHealth(this.boss);
            this.effects.addScreenShake(15, 0.5);
            this.audio.play('explosion');
        }
        
        // Mise à jour des ennemis
        const enemyProjectiles = [];
        const enemySpawns = [];
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const result = enemy.update(dt, this.player, this.enemies);
            
            if (result.projectiles) {
                enemyProjectiles.push(...result.projectiles);
            }
            if (result.spawns) {
                enemySpawns.push(...result.spawns);
            }
            
            // Collision ennemi-joueur
            if (enemy.canCollide() && !this.player.isInvincible) {
                const dist = distance(enemy.x, enemy.y, this.player.x, this.player.y);
                if (dist < enemy.radius + this.player.radius) {
                    this.player.takeDamage(enemy.damage);
                    this.audio.play('hit');
                    
                    // Kamikaze
                    if (enemy.behavior === 'kamikaze') {
                        this.effects.explosion(enemy.x, enemy.y, '#ff6600', 20, 12);
                        // Dégâts de zone
                        for (const other of this.enemies) {
                            if (other !== enemy && distance(enemy.x, enemy.y, other.x, other.y) < 60) {
                                other.takeDamage(enemy.damage * 0.5);
                            }
                        }
                        enemy.hp = 0;
                    }
                }
            }
            
            // Ennemi mort?
            if (enemy.hp <= 0) {
                this.onEnemyDeath(enemy);
                this.enemies.splice(i, 1);
                
                if (enemy === this.boss) {
                    this.boss = null;
                    this.ui.hideBossHealth();
                }
            }
        }
        
        // Spawn les ennemis créés par d'autres ennemis
        for (const spawn of enemySpawns) {
            const newEnemy = new Enemy(spawn.x, spawn.y, spawn.type, this.currentMap.difficultyMult, spawn.isElite);
            this.enemies.push(newEnemy);
        }
        
        // Spawn les projectiles ennemis
        for (const proj of enemyProjectiles) {
            this.projectiles.spawn(proj);
        }
        
        // Armes du joueur
        const weaponResult = this.weaponSystem.update(dt, this.enemies, this.gameTime);
        
        // Appliquer les dégâts d'aura
        for (const hit of weaponResult.auraDamage) {
            if (hit.enemy.hp > 0) {
                const killed = hit.enemy.takeDamage(hit.damage);
                this.effects.showDamage(hit.enemy.x, hit.enemy.y - 20, hit.damage);
            }
        }
        
        // Mise à jour des projectiles
        const projResult = this.projectiles.update(dt, this.enemies, this.player, this.effects);
        
        // Appliquer les dégâts des projectiles
        for (const hit of projResult.enemyHits) {
            const isCrit = Math.random() < this.player.luck;
            const damage = isCrit ? hit.damage * 2 : hit.damage;
            hit.enemy.takeDamage(damage);
            this.effects.showDamage(hit.enemy.x, hit.enemy.y - 20, damage, isCrit);
            
            if (isCrit) {
                this.audio.play('hit');
            }
        }
        
        // Dégâts au joueur
        for (const hit of projResult.playerHits) {
            this.player.takeDamage(hit.damage);
            this.audio.play('hit');
        }
        
        // Items
        const collectedItems = this.items.update(dt, this.player, (item) => {
            this.onItemCollected(item);
        });
        
        // Effets
        this.effects.update(dt);
        
        // Coffres
        for (const chest of this.chests) {
            chest.update(dt);
            if (!chest.isOpen && chest.checkCollision(this.player)) {
                const contents = chest.open();
                this.handleChestContents(contents);
            }
        }
        
        // Vérifier level up
        while (this.player.checkLevelUp()) {
            this.showLevelUpScreen();
            this.audio.play('levelup');
        }
        
        // Boss health update
        if (this.boss) {
            this.ui.showBossHealth(this.boss);
        }
        
        // Vérifier mort du joueur
        if (this.player.isDead()) {
            this.endGame(false);
            return;
        }
        
        // Vérifier victoire
        if (this.gameTime >= this.currentMap.duration) {
            this.endGame(true);
            return;
        }
        
        // Update UI
        this.ui.updateHUD(
            this.player,
            this.gameTime,
            this.killCount,
            this.goldCollected,
            this.spawner.getWaveNumber()
        );
    }
    
    updateCamera() {
        // Smooth camera follow
        const targetX = this.player.x - this.canvas.width / 2;
        const targetY = this.player.y - this.canvas.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        // Limiter à la map
        this.camera.x = Math.max(0, Math.min(this.currentMap.size.width - this.canvas.width, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.currentMap.size.height - this.canvas.height, this.camera.y));
    }
    
    render() {
        const ctx = this.ctx;
        
        // Screen shake
        const shake = this.save.getSetting('screenShake') ? this.effects.getShakeOffset() : { x: 0, y: 0 };
        
        // Clear
        ctx.fillStyle = this.currentMap.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.save();
        ctx.translate(-this.camera.x + shake.x, -this.camera.y + shake.y);
        
        // Grille de fond
        this.renderBackground();
        
        // Coffres
        for (const chest of this.chests) {
            chest.render(ctx);
        }
        
        // Items au sol
        this.items.render(ctx, this.gameTime);
        
        // Ennemis
        for (const enemy of this.enemies) {
            enemy.render(ctx);
        }
        
        // Projectiles
        this.projectiles.render(ctx);
        
        // Force Field render
        if (this.weaponSystem.forceFieldRender) {
            const ff = this.weaponSystem.forceFieldRender;
            const gradient = ctx.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, ff.radius);
            gradient.addColorStop(0, 'rgba(0, 255, 136, 0)');
            gradient.addColorStop(0.7, 'rgba(0, 255, 136, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 255, 136, 0.3)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ff.x, ff.y, ff.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = ff.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(this.gameTime * 5) * 0.2;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // === NOUVEAU: Flamethrower render ===
if (this.weaponSystem.flamethrowerRender) {
    const ft = this.weaponSystem.flamethrowerRender;
    
    ctx.save();
    ctx.translate(ft.x, ft.y);
    ctx.rotate(ft.angle);
    
    // Dessiner le cône de flammes avec un gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, ft.range * 0.5, 0, ft.range);
    gradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
    gradient.addColorStop(0.3, 'rgba(255, 100, 0, 0.6)');
    gradient.addColorStop(0.6, 'rgba(255, 50, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, ft.range, -ft.coneAngle, ft.coneAngle);
    ctx.closePath();
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Ajouter un effet de "core" plus lumineux au centre
    const coreGradient = ctx.createRadialGradient(0, 0, 0, ft.range * 0.2, 0, ft.range * 0.5);
    coreGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
    coreGradient.addColorStop(0.5, 'rgba(255, 200, 50, 0.5)');
    coreGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, ft.range * 0.6, -ft.coneAngle * 0.7, ft.coneAngle * 0.7);
    ctx.closePath();
    
    ctx.fillStyle = coreGradient;
    ctx.fill();
    
    // Effet de scintillement
    ctx.globalAlpha = 0.3 + Math.random() * 0.3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, ft.range * (0.7 + Math.random() * 0.3), -ft.coneAngle * 0.5, ft.coneAngle * 0.5);
    ctx.closePath();
    ctx.fillStyle = '#ffff00';
    ctx.fill();
    
    ctx.restore();
    ctx.globalAlpha = 1;
}
        
        // Joueur
        this.player.render(ctx);
        
        // Effets
        this.effects.render(ctx, this.camera);
        
        ctx.restore();
        
        // Flash overlay
        this.effects.renderFlash(ctx, this.canvas.width, this.canvas.height);
        
        // Debug info (optionnel)
        if (CONFIG.DEBUG) {
            this.renderDebug();
        }
    }
    
    renderBackground() {
        const ctx = this.ctx;
        const gridSize = 100;
        const map = this.currentMap;
        
        ctx.strokeStyle = map.gridColor;
        ctx.lineWidth = 1;
        
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endX = this.camera.x + this.canvas.width + gridSize;
        const endY = this.camera.y + this.canvas.height + gridSize;
        
        ctx.beginPath();
        for (let x = startX; x <= endX; x += gridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += gridSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();
        
        // Bordures de la map
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, map.size.width, map.size.height);
    }
    
    renderDebug() {
        const ctx = this.ctx;
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        
        const debugInfo = [
            `FPS: ${Math.round(1000 / (performance.now() - this.lastTime + 1))}`,
            `Enemies: ${this.enemies.length}`,
            `Projectiles: ${this.projectiles.getActiveCount()}`,
            `Items: ${this.items.getActiveCount()}`,
            `Particles: ${this.effects.getActiveParticleCount()}`
        ];
        
        debugInfo.forEach((text, i) => {
            ctx.fillText(text, 10, this.canvas.height - 100 + i * 18);
        });
    }
    
    onEnemyDeath(enemy) {
        this.killCount++;
        
        // Effets
        this.effects.death(enemy.x, enemy.y, enemy.data?.color || enemy.bossData?.color || '#ff4444', enemy.size);
        this.audio.play('explosion');
        
        // Drops
        this.items.spawnEnemyDrops(enemy);
        
        // Boss drops
        if (enemy.isBoss) {
            this.bossKills++;
            this.effects.bossDeath(enemy.x, enemy.y);
            
            // Spawn un coffre doré
            this.chests.push(new Chest(enemy.x, enemy.y, 'golden'));
        }
        
        // Marquer comme vu
        if (enemy.type) {
            this.save.markEnemySeen(enemy.type);
        }
    }
    
    onItemCollected(item) {
        this.audio.play('pickup');
        this.effects.pickup(item.x, item.y, item.color);
        
        switch (item.type) {
            case 'xp':
                this.player.addXP(item.value);
                break;
            case 'gold':
                this.goldCollected += item.value;
                break;
            case 'health':
                this.player.heal(item.value);
                break;
            case 'magnet':
                this.items.attractAll(this.player);
                this.effects.addFlash('#ff00ff', 0.2);
                break;
            case 'nuke':
                this.killAllOnScreen();
                this.effects.addFlash('#ffffff', 0.3);
                this.effects.addScreenShake(20, 0.5);
                break;
            case 'invincible':
                this.player.applyBuff('invincible', 5);
                this.effects.addFlash('#00ffff', 0.2);
                break;
            case 'double_damage':
                this.player.applyBuff('double_damage', 10);
                this.effects.addFlash('#ff8800', 0.2);
                break;
        }
    }
    
    handleChestContents(contents) {
        if (!contents) return;
        
        this.audio.play('levelup');
        this.effects.addFlash('#ffd700', 0.2);
        
        // Ajouter l'or
        if (contents.gold) {
            this.goldCollected += contents.gold;
        }
        
        // Donner les upgrades
        for (let i = 0; i < (contents.upgrades || 1); i++) {
            this.showLevelUpScreen();
        }
    }
    
    killAllOnScreen() {
        const screenBounds = {
            left: this.camera.x - 50,
            right: this.camera.x + this.canvas.width + 50,
            top: this.camera.y - 50,
            bottom: this.camera.y + this.canvas.height + 50
        };
        
        for (const enemy of this.enemies) {
            if (enemy.x > screenBounds.left && enemy.x < screenBounds.right &&
                enemy.y > screenBounds.top && enemy.y < screenBounds.bottom) {
                if (!enemy.isBoss) {
                    enemy.hp = 0;
                } else {
                    enemy.takeDamage(enemy.maxHp * 0.1);
                }
            }
        }
        
        this.audio.play('explosion');
    }
    
    showLevelUpScreen() {
        this.isPaused = true;
        
        const choices = this.generateUpgradeChoices(4);
        
        this.ui.showLevelUp(choices, (choice) => {
            this.applyUpgrade(choice);
            this.isPaused = false;
            this.ui.hideLevelUp();
            this.ui.updateWeaponsDisplay(this.player.weapons);
            this.ui.updatePassivesDisplay(this.player.passives);
        });
    }
    
    generateUpgradeChoices(count) {
        const choices = [];
        const available = [];
        
        // Armes pas encore au max
        for (const [id, weapon] of Object.entries(WEAPONS)) {
            const playerWeapon = this.player.weapons.find(w => w.id === id);
            if (!playerWeapon && this.player.weapons.length < 6) {
                available.push({ type: 'new_weapon', id, data: weapon, weight: 1 });
            } else if (playerWeapon && playerWeapon.level < weapon.maxLevel) {
                available.push({ 
                    type: 'upgrade_weapon', 
                    id, 
                    data: weapon, 
                    currentLevel: playerWeapon.level,
                    weight: 1.5 // Priorité aux upgrades
                });
            }
        }
        
        // Passifs pas encore au max
        for (const [id, passive] of Object.entries(PASSIVES)) {
            const playerPassive = this.player.passives.find(p => p.id === id);
            if (!playerPassive) {
                available.push({ type: 'new_passive', id, data: passive, weight: 0.8 });
            } else if (playerPassive.level < passive.maxLevel) {
                available.push({ 
                    type: 'upgrade_passive', 
                    id, 
                    data: passive, 
                    currentLevel: playerPassive.level,
                    weight: 1.2
                });
            }
        }
        
        // Mélanger et sélectionner
        const shuffled = shuffleArray(available);
        
        for (let i = 0; i < count && shuffled.length > 0; i++) {
            choices.push(shuffled.shift());
        }
        
        return choices;
    }
    
    applyUpgrade(choice) {
        switch (choice.type) {
            case 'new_weapon':
            case 'upgrade_weapon':
                this.player.addWeapon(choice.id);
                this.save.markWeaponSeen(choice.id);
                break;
            case 'new_passive':
            case 'upgrade_passive':
                this.player.addPassive(choice.id);
                this.save.markPassiveSeen(choice.id);
                break;
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.ui.showPause(this.player, this.gameTime, this.killCount);
        } else {
            this.ui.hidePause();
        }
    }
    
    endGame(victory) {
        this.isRunning = false;
        
        // Calculer l'or gagné avec multiplicateurs
        const goldMult = this.save.getTalentBonuses().goldMult;
        const finalGold = Math.floor(this.goldCollected * goldMult);
        
        // Sauvegarder
        this.save.addGold(finalGold);
        
        // Mise à jour des stats
        const runStats = {
            time: this.gameTime,
            kills: this.killCount,
            level: this.player.level,
            bossKills: this.bossKills,
            gold: finalGold,
            victory,
            mapId: this.currentMap.id
        };
        
        this.save.updateStats(runStats);
        
        // Vérifier les déblocages
        const unlocks = this.save.checkUnlocks(runStats);
        
        // Afficher l'écran de fin
        this.ui.showGameOver(victory, runStats, unlocks);
        
        // Audio
        this.audio.stopMusic();
                // Notification pour les déblocages
        for (const unlock of unlocks) {
            setTimeout(() => {
                this.ui.showNotification(`${unlock.name} débloqué!`, unlock.icon);
            }, 500);
        }
    }
    
    // === MÉTHODES UTILITAIRES ===
    getEnemiesInRange(x, y, range) {
        return this.enemies.filter(e => 
            e.hp > 0 && distance(x, y, e.x, e.y) < range
        );
    }
    
    getClosestEnemy(x, y, maxRange = Infinity) {
        let closest = null;
        let closestDist = maxRange;
        
        for (const enemy of this.enemies) {
            if (enemy.hp <= 0) continue;
            const dist = distance(x, y, enemy.x, enemy.y);
            if (dist < closestDist) {
                closestDist = dist;
                closest = enemy;
            }
        }
        
        return closest;
    }
    
    isOnScreen(entity) {
        const margin = 100;
        return entity.x > this.camera.x - margin &&
               entity.x < this.camera.x + this.canvas.width + margin &&
               entity.y > this.camera.y - margin &&
               entity.y < this.camera.y + this.canvas.height + margin;
    }
    
    spawnChest(x, y, type = 'normal') {
        this.chests.push(new Chest(x, y, type));
    }
    
    // === CLEANUP ===
    destroy() {
        this.isRunning = false;
        this.audio.stopMusic();
        window.removeEventListener('resize', this.resizeCanvas);
    }
}