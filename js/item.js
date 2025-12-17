// ========================================
// GALACTIC SURVIVOR - Système d'Items
// ========================================

import { DROPS, CONFIG } from './constants.js';
import { distance, randomRange, randomChoice } from './utils.js';

// === CLASSE ITEM ===
class Item {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.type = 'xp';
        this.subType = 'xp_small';
        this.value = 1;
        this.size = 8;
        this.color = '#4488ff';
        this.lifetime = 60;
        this.maxLifetime = 60;
        this.isBeingAttracted = false;
        this.magnetized = false;
        
        // Animation
        this.bobOffset = Math.random() * Math.PI * 2;
        this.sparkleTimer = 0;
    }
    
    init(x, y, dropType, value = null) {
        const dropData = DROPS[dropType];
        if (!dropData) return false;
        
        this.active = true;
        this.x = x + randomRange(-15, 15);
        this.y = y + randomRange(-15, 15);
        this.type = dropData.type;
        this.subType = dropType;
        this.value = value !== null ? value : (dropData.value || 1);
        this.size = dropData.size || 8;
        this.color = dropData.color || '#ffffff';
        this.lifetime = 60;
        this.maxLifetime = 60;
        this.isBeingAttracted = false;
        this.magnetized = false;
        this.bobOffset = Math.random() * Math.PI * 2;
        
        return true;
    }
    
    update(dt, player) {
        if (!this.active) return false;
        
        // Lifetime
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.active = false;
            return false;
        }
        
        // Animation
        this.sparkleTimer += dt;
        
        // Distance au joueur
        const dist = distance(this.x, this.y, player.x, player.y);
        const pickupRadius = player.pickupRadius;
        
        // Attraction si dans le rayon ou magnétisé
        if (dist < pickupRadius || this.magnetized || this.isBeingAttracted) {
            this.isBeingAttracted = true;
            
            // Se déplacer vers le joueur
            const speed = CONFIG.XP_ATTRACT_SPEED * (this.magnetized ? 2 : 1);
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            
            if (len > 0) {
                this.x += (dx / len) * speed * dt;
                this.y += (dy / len) * speed * dt;
            }
        }
        
        // Collection si très proche
        if (dist < 25) {
            this.active = false;
            return true; // Collecté
        }
        
        return false;
    }
    
    render(ctx, gameTime) {
        if (!this.active) return;
        
        ctx.save();
        
        // Clignotement si bientôt expiré
        if (this.lifetime < 5 && Math.floor(this.lifetime * 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Bobbing animation
        const bob = Math.sin(gameTime * 4 + this.bobOffset) * 3;
        const drawY = this.y + bob;
        
        // Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10 + Math.sin(gameTime * 6) * 3;
        
        switch (this.type) {
            case 'xp':
                this.renderXP(ctx, this.x, drawY);
                break;
            case 'gold':
                this.renderGold(ctx, this.x, drawY);
                break;
            case 'health':
                this.renderHealth(ctx, this.x, drawY);
                break;
            case 'magnet':
                this.renderSpecial(ctx, this.x, drawY, '🧲');
                break;
            case 'nuke':
                this.renderSpecial(ctx, this.x, drawY, '💥');
                break;
            case 'invincible':
                this.renderSpecial(ctx, this.x, drawY, '🛡️');
                break;
            case 'double_damage':
                this.renderSpecial(ctx, this.x, drawY, '⚔️');
                break;
            default:
                this.renderDefault(ctx, this.x, drawY);
        }
        
        ctx.restore();
    }
    
    renderXP(ctx, x, y) {
        // Cristal XP
        const size = this.size;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.7, y);
        ctx.lineTo(x, y + size * 0.5);
        ctx.lineTo(x - size * 0.7, y);
        ctx.closePath();
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.3, y - size * 0.3);
        ctx.lineTo(x, y);
        ctx.lineTo(x - size * 0.3, y - size * 0.3);
        ctx.closePath();
        ctx.fill();
    }
    
    renderGold(ctx, x, y) {
        // Pièce d'or
        const size = this.size;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#997700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Symbole
        ctx.fillStyle = '#997700';
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', x, y);
    }
    
    renderHealth(ctx, x, y) {
        // Croix de soin
        const size = this.size;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(x - size * 0.3, y - size, size * 0.6, size * 2);
        ctx.fillRect(x - size, y - size * 0.3, size * 2, size * 0.6);
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x - size * 0.15, y - size, size * 0.3, size * 2);
    }
    
    renderSpecial(ctx, x, y, emoji) {
        // Items spéciaux avec emoji
        ctx.font = `${this.size * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, x, y);
        
        // Cercle de highlight
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, this.size * 1.2, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    renderDefault(ctx, x, y) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// === GESTIONNAIRE D'ITEMS ===
export class ItemManager {
    constructor(maxItems = 500) {
        this.items = [];
        this.maxItems = maxItems;
        
        // Pool d'items
        for (let i = 0; i < maxItems; i++) {
            this.items.push(new Item());
        }
    }
    
    getItem() {
        for (const item of this.items) {
            if (!item.active) return item;
        }
        // Si tous sont utilisés, recycler le plus ancien
        return this.items[0];
    }
    
    spawn(dropType, x, y, value = null) {
        const item = this.getItem();
        if (item.init(x, y, dropType, value)) {
            return item;
        }
        return null;
    }
    
    spawnDrops(drops, x, y) {
        for (const drop of drops) {
            // Léger décalage pour chaque drop
            const offsetX = randomRange(-20, 20);
            const offsetY = randomRange(-20, 20);
            this.spawn(drop.type, x + offsetX, y + offsetY, drop.value);
        }
    }
    
    spawnEnemyDrops(enemy) {
        const drops = enemy.getDrops();
        this.spawnDrops(drops, enemy.x, enemy.y);
    }
    
    update(dt, player, onCollect) {
        const collected = [];
        
        for (const item of this.items) {
            if (!item.active) continue;
            
            const wasCollected = item.update(dt, player);
            if (wasCollected) {
                collected.push({
                    type: item.type,
                    subType: item.subType,
                    value: item.value
                });
                
                if (onCollect) {
                    onCollect(item);
                }
            }
        }
        
        return collected;
    }
    
    render(ctx, gameTime) {
        for (const item of this.items) {
            if (item.active) {
                item.render(ctx, gameTime);
            }
        }
    }
    
    attractAll(player) {
        for (const item of this.items) {
            if (item.active && (item.type === 'xp' || item.type === 'gold')) {
                item.magnetized = true;
            }
        }
    }
    
    clear() {
        for (const item of this.items) {
            item.reset();
        }
    }
    
    getActiveCount() {
        return this.items.filter(i => i.active).length;
    }
}

// === CHEST (Coffre) ===
export class Chest {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type; // 'normal', 'golden', 'red'
        this.size = type === 'normal' ? 40 : 50;
        this.isOpen = false;
        this.openAnimation = 0;
        
        // Contenu basé sur le type
        this.contents = this.generateContents();
    }
    
    generateContents() {
        switch (this.type) {
            case 'golden':
                return {
                    upgrades: 3,
                    gold: 50
                };
            case 'red':
                return {
                    upgrades: 1,
                    guaranteed: 'evolved',
                    gold: 25
                };
            default:
                return {
                    upgrades: 1,
                    gold: 10
                };
        }
    }
    
    checkCollision(player) {
        if (this.isOpen) return false;
        return distance(this.x, this.y, player.x, player.y) < this.size + player.radius;
    }
    
    open() {
        if (this.isOpen) return null;
        this.isOpen = true;
        return this.contents;
    }
    
    update(dt) {
        if (this.isOpen && this.openAnimation < 1) {
            this.openAnimation += dt * 3;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.isOpen) {
            ctx.globalAlpha = 1 - this.openAnimation;
            ctx.scale(1 + this.openAnimation, 1 + this.openAnimation);
        }
        
        // Couleur selon le type
        let mainColor, glowColor;
        switch (this.type) {
            case 'golden':
                mainColor = '#ffd700';
                glowColor = '#ffaa00';
                break;
            case 'red':
                mainColor = '#ff4444';
                glowColor = '#ff0000';
                break;
            default:
                mainColor = '#8b4513';
                glowColor = '#aa6633';
        }
        
        // Glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20;
        
        // Corps du coffre
        ctx.fillStyle = mainColor;
        ctx.fillRect(-this.size/2, -this.size/3, this.size, this.size * 0.6);
        
        // Couvercle
        ctx.fillStyle = this.darkenColor(mainColor, 0.8);
        ctx.beginPath();
        ctx.moveTo(-this.size/2, -this.size/3);
        ctx.lineTo(-this.size/2 - 5, -this.size/3 - 10);
        ctx.lineTo(this.size/2 + 5, -this.size/3 - 10);
        ctx.lineTo(this.size/2, -this.size/3);
        ctx.closePath();
        ctx.fill();
        
        // Serrure
        ctx.fillStyle = '#ffdd44';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Icône
        ctx.font = `${this.size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type === 'golden' ? '👑' : (this.type === 'red' ? '⭐' : '📦'), 0, -this.size/2 - 20);
        
        ctx.restore();
    }
    
    darkenColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
    }
}