// ========================================
// GALACTIC SURVIVOR - Système d'Effets
// ========================================

import { randomRange, colorWithAlpha, lerp, distance } from './utils.js';
import { CONFIG } from './constants.js';

// === PARTICULE ===
class Particle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.size = 0;
        this.color = '#ffffff';
        this.type = 'circle';
        this.gravity = 0;
        this.friction = 1;
        this.shrink = true;
        this.fadeOut = true;
        this.rotation = 0;
        this.rotationSpeed = 0;
    }
    
    init(config) {
        this.active = true;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.life = config.life || 1;
        this.maxLife = this.life;
        this.size = config.size || 5;
        this.color = config.color || '#ffffff';
        this.type = config.type || 'circle';
        this.gravity = config.gravity || 0;
        this.friction = config.friction || 1;
        this.shrink = config.shrink !== false;
        this.fadeOut = config.fadeOut !== false;
        this.rotation = config.rotation || 0;
        this.rotationSpeed = config.rotationSpeed || 0;
    }
    
    update(dt) {
        if (!this.active) return;
        
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }
        
        this.vy += this.gravity * dt;
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        this.rotation += this.rotationSpeed * dt;
    }
    
    render(ctx) {
        if (!this.active) return;
        
        const progress = 1 - (this.life / this.maxLife);
        const alpha = this.fadeOut ? (1 - progress) : 1;
        const size = this.shrink ? this.size * (1 - progress * 0.5) : this.size;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        switch (this.type) {
            case 'circle':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'square':
                ctx.fillStyle = this.color;
                ctx.fillRect(-size / 2, -size / 2, size, size);
                break;
                
            case 'spark':
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-size, 0);
                ctx.lineTo(size, 0);
                ctx.stroke();
                break;
                
            case 'ring':
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'star':
                this.drawStar(ctx, 0, 0, 5, size, size / 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
    
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }
}

// === DAMAGE NUMBER ===
class DamageNumber {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.text = '';
        this.color = '#ffffff';
        this.life = 0;
        this.maxLife = 0;
        this.scale = 1;
        this.vy = 0;
    }
    
    init(x, y, damage, isCrit = false, isHeal = false) {
        this.active = true;
        this.x = x + randomRange(-10, 10);
        this.y = y;
        this.text = isHeal ? `+${Math.floor(damage)}` : Math.floor(damage).toString();
        this.color = isHeal ? '#00ff00' : (isCrit ? '#ffff00' : '#ffffff');
        this.life = 1;
        this.maxLife = 1;
        this.scale = isCrit ? 1.5 : 1;
        this.vy = -80;
        this.isCrit = isCrit;
    }
    
    update(dt) {
        if (!this.active) return;
        
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }
        
        this.y += this.vy * dt;
        this.vy += 50 * dt;
    }
    
    render(ctx) {
        if (!this.active) return;
        
        const progress = 1 - (this.life / this.maxLife);
        const alpha = 1 - progress;
        const scale = this.scale * (1 + progress * 0.3);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${16 * scale}px Orbitron, sans-serif`;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.isCrit) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
        }
        
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

// === GESTIONNAIRE D'EFFETS ===
export class EffectsManager {
    constructor() {
        this.particles = [];
        this.damageNumbers = [];
        this.screenShake = { intensity: 0, duration: 0 };
        this.flashColor = null;
        this.flashDuration = 0;
        
        // Pool de particules
        for (let i = 0; i < CONFIG.MAX_PARTICLES; i++) {
            this.particles.push(new Particle());
        }
        
        // Pool de damage numbers
        for (let i = 0; i < 100; i++) {
            this.damageNumbers.push(new DamageNumber());
        }
    }
    
    clear() {
        for (const p of this.particles) {
            p.reset();
        }
        for (const d of this.damageNumbers) {
            d.reset();
        }
        this.screenShake = { intensity: 0, duration: 0 };
        this.flashColor = null;
        this.flashDuration = 0;
    }
    
    // === PARTICULES ===
    getParticle() {
        for (const p of this.particles) {
            if (!p.active) return p;
        }
        return null;
    }
    
    spawnParticle(config) {
        const p = this.getParticle();
        if (p) {
            p.init(config);
        }
    }
    
    // === EFFETS PRÉDÉFINIS ===
    explosion(x, y, color = '#ff6600', count = 15, size = 8) {
        for (let i = 0; i < count; i++) {
            const angle = randomRange(0, Math.PI * 2);
            const speed = randomRange(100, 300);
            this.spawnParticle({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: randomRange(0.3, 0.6),
                size: randomRange(size * 0.5, size * 1.5),
                color,
                friction: 0.95,
                type: Math.random() > 0.5 ? 'circle' : 'spark'
            });
        }
    }
    
    hit(x, y, color = '#ffffff', count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = randomRange(0, Math.PI * 2);
            const speed = randomRange(50, 150);
            this.spawnParticle({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: randomRange(0.2, 0.4),
                size: randomRange(3, 6),
                color,
                friction: 0.9
            });
        }
    }
    
    death(x, y, color = '#ff4444', size = 30) {
        // Explosion principale
        this.explosion(x, y, color, 20, 10);
        
        // Anneau d'expansion
        this.spawnParticle({
            x,
            y,
            vx: 0,
            vy: 0,
            life: 0.4,
            size,
            color,
            type: 'ring',
            shrink: false,
            fadeOut: true
        });
        
        // Screen shake léger
        this.addScreenShake(5, 0.15);
    }
    
    levelUp(x, y) {
        // Étoiles montantes
        for (let i = 0; i < 20; i++) {
            const angle = randomRange(-Math.PI * 0.7, -Math.PI * 0.3);
            const speed = randomRange(100, 200);
            this.spawnParticle({
                x: x + randomRange(-30, 30),
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: randomRange(0.5, 1),
                size: randomRange(5, 10),
                color: '#ffff00',
                type: 'star',
                friction: 0.98,
                rotationSpeed: randomRange(-5, 5)
            });
        }
        
        // Flash doré
        this.addFlash('#ffff00', 0.15);
        this.addScreenShake(8, 0.2);
    }
    
    pickup(x, y, color = '#00ff00') {
        for (let i = 0; i < 8; i++) {
            const angle = randomRange(0, Math.PI * 2);
            const speed = randomRange(30, 80);
            this.spawnParticle({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                life: 0.3,
                size: randomRange(4, 8),
                color,
                friction: 0.95
            });
        }
    }
    
    trail(x, y, color = '#00ffff', size = 5) {
        this.spawnParticle({
            x,
            y,
            vx: randomRange(-20, 20),
            vy: randomRange(-20, 20),
            life: 0.2,
            size,
            color,
            fadeOut: true
        });
    }
    
    lightning(x1, y1, x2, y2, color = '#ffff00') {
        const segments = 8;
        let lastX = x1;
        let lastY = y1;
        
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            let nextX = lerp(x1, x2, t);
            let nextY = lerp(y1, y2, t);
            
            if (i < segments) {
                nextX += randomRange(-20, 20);
                nextY += randomRange(-20, 20);
            }
            
            const midX = (lastX + nextX) / 2;
            const midY = (lastY + nextY) / 2;
            
            this.spawnParticle({
                x: midX,
                y: midY,
                vx: 0,
                vy: 0,
                life: 0.15,
                size: 4,
                color,
                type: 'spark'
            });
            
            lastX = nextX;
            lastY = nextY;
        }
    }
    
    bossDeath(x, y) {
        // Énorme explosion
        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                this.explosion(x + randomRange(-50, 50), y + randomRange(-50, 50), '#ff0000', 30, 15);
                this.explosion(x + randomRange(-50, 50), y + randomRange(-50, 50), '#ffaa00', 25, 12);
                this.addScreenShake(20, 0.3);
            }, wave * 150);
        }
        
        this.addFlash('#ff6600', 0.3);
    }
    
    // === DAMAGE NUMBERS ===
    getDamageNumber() {
        for (const d of this.damageNumbers) {
            if (!d.active) return d;
        }
        return null;
    }
    
    showDamage(x, y, damage, isCrit = false) {
        const dn = this.getDamageNumber();
        if (dn) {
            dn.init(x, y, damage, isCrit, false);
        }
    }
    
    showHeal(x, y, amount) {
        const dn = this.getDamageNumber();
        if (dn) {
            dn.init(x, y, amount, false, true);
        }
    }
    
    // === SCREEN EFFECTS ===
    addScreenShake(intensity, duration) {
        if (intensity > this.screenShake.intensity) {
            this.screenShake.intensity = intensity;
        }
        if (duration > this.screenShake.duration) {
            this.screenShake.duration = duration;
        }
    }
    
    getShakeOffset() {
        if (this.screenShake.duration <= 0) {
            return { x: 0, y: 0 };
        }
        
        return {
            x: randomRange(-1, 1) * this.screenShake.intensity,
            y: randomRange(-1, 1) * this.screenShake.intensity
        };
    }
    
    addFlash(color, duration) {
        this.flashColor = color;
        this.flashDuration = duration;
    }
    
    // === UPDATE & RENDER ===
    update(dt) {
        // Mise à jour particules
        for (const p of this.particles) {
            if (p.active) {
                p.update(dt);
            }
        }
        
        // Mise à jour damage numbers
        for (const d of this.damageNumbers) {
            if (d.active) {
                d.update(dt);
            }
        }
        
        // Screen shake decay
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= dt;
            this.screenShake.intensity *= 0.9;
        }
        
        // Flash decay
        if (this.flashDuration > 0) {
            this.flashDuration -= dt;
        }
    }
    
    render(ctx, camera) {
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        
        // Particules
        for (const p of this.particles) {
            if (p.active) {
                p.render(ctx);
            }
        }
        
        // Damage numbers
        for (const d of this.damageNumbers) {
            if (d.active) {
                d.render(ctx);
            }
        }
        
        ctx.restore();
    }
    
    renderFlash(ctx, width, height) {
        if (this.flashDuration > 0 && this.flashColor) {
            const alpha = this.flashDuration * 2;
            ctx.fillStyle = colorWithAlpha(this.flashColor, Math.min(0.3, alpha));
            ctx.fillRect(0, 0, width, height);
        }
    }
    
    getActiveParticleCount() {
        return this.particles.filter(p => p.active).length;
    }
}