# 📚 Guide Complet pour Modifier GALACTIC SURVIVOR

Je vais vous expliquer comment ajouter/modifier du contenu dans le jeu de manière détaillée.

---

## 📁 Structure des fichiers à modifier

| Ce que vous voulez faire                | Fichier à modifier                                     |
| --------------------------------------- | ------------------------------------------------------- |
| Ajouter/modifier une**arme**      | `js/constants.js` + `js/weapon.js`                  |
| Ajouter/modifier un**personnage** | `js/constants.js`                                     |
| Ajouter/modifier un**ennemi**     | `js/constants.js` + `js/enemy.js`                   |
| Ajouter/modifier un**passif**     | `js/constants.js`                                     |
| Modifier les**visuels/skins**     | `js/player.js`, `js/enemy.js`, `js/projectile.js` |
| Ajouter une**map**                | `js/constants.js`                                     |

---

## 🔫 1. AJOUTER UNE NOUVELLE ARME

### Étape 1 : Définir l'arme dans `js/constants.js`

Trouvez la section `export const WEAPONS = {` et ajoutez votre arme :

```javascript
export const WEAPONS = {
    // ... armes existantes ...
  
    // VOTRE NOUVELLE ARME
    laser_sword: {
        id: 'laser_sword',                    // ID unique (pas d'espaces, pas de caractères spéciaux)
        name: "Laser Sword",                  // Nom affiché dans le jeu
        icon: "⚔️",                           // Emoji ou caractère pour l'icône
        description: "Épée laser qui tranche les ennemis proches.", // Description
      
        // TYPE D'ARME (choisir un parmi):
        // 'projectile' - tir simple
        // 'spread' - tir en éventail
        // 'lightning' - arc électrique
        // 'orbital' - tourne autour du joueur
        // 'homing' - suit les ennemis
        // 'aura' - zone de dégâts autour du joueur
        // 'piercing' - traverse les ennemis
        // 'explosive' - explose à l'impact
        // 'cone' - cône de dégâts (lance-flammes)
        // 'boomerang' - revient au joueur
        type: 'aura',
      
        // STATISTIQUES DE BASE
        cooldown: 0,                          // Temps entre les attaques (0 pour armes continues)
        baseDamage: 8,                        // Dégâts de base
      
        // Pour les projectiles:
        projectileSpeed: 500,                 // Vitesse du projectile
        projectileSize: 10,                   // Taille du projectile
        pierce: 1,                            // Nombre d'ennemis traversés
        duration: 2,                          // Durée de vie du projectile
      
        // Pour les armes de zone:
        radius: 80,                           // Rayon d'effet
        damageInterval: 0.3,                  // Intervalle entre les dégâts
      
        // Couleur (format hexadécimal)
        color: '#ff00ff',
      
        // Niveau maximum
        maxLevel: 8,
      
        // Évolution (optionnel)
        evolution: { 
            requires: 'power_core',           // ID du passif requis
            becomes: 'plasma_blade'           // ID de l'arme évoluée
        },
      
        // BONUS PAR NIVEAU (tableau de 8 valeurs, une par niveau)
        levelBonuses: {
            damage: 2,                        // +2 dégâts par niveau
            radiusMult: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8],  // Multiplicateur de rayon
            intervalMult: [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.6] // Réduction de l'intervalle
        }
    },
};
```

### Étape 2 : Implémenter le comportement dans `js/weapon.js`

Si votre arme utilise un type existant (`projectile`, `spread`, `aura`, etc.), elle fonctionnera automatiquement.

Pour un comportement **personnalisé**, modifiez la méthode `fireWeapon` ou `updateContinuousWeapon` :

```javascript
// Dans js/weapon.js, méthode fireWeapon()
fireWeapon(weapon, data, enemies, gameTime) {
    const projectiles = [];
    const level = weapon.level;
    const player = this.player;
  
    const damageBonus = (data.levelBonuses?.damage || 0) * (level - 1);
    const baseDamage = (data.baseDamage + damageBonus) * player.getDamageMultiplier();
  
    switch (weapon.id) {
        // ... autres armes ...
      
        // VOTRE NOUVELLE ARME (si comportement spécial)
        case 'laser_sword':
            projectiles.push(...this.fireLaserSword(player, enemies, data, level, baseDamage));
            break;
    }
  
    // Spawn les projectiles
    for (const config of projectiles) {
        this.projectiles.spawn(config);
    }
  
    return projectiles;
}

// Nouvelle méthode pour votre arme
fireLaserSword(player, enemies, data, level, damage) {
    const projectiles = [];
  
    // Exemple : créer une attaque circulaire
    const slashCount = 2 + level;
    const radius = (data.radius || 80) * player.areaMult;
  
    for (let i = 0; i < slashCount; i++) {
        const angle = player.facingAngle + (i / slashCount) * Math.PI * 2;
        const targetX = player.x + Math.cos(angle) * radius;
        const targetY = player.y + Math.sin(angle) * radius;
      
        projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * 300,
            vy: Math.sin(angle) * 300,
            damage: damage,
            size: 20,
            color: data.color,
            type: 'slash',
            pierce: 3,
            duration: 0.3,
            weaponId: 'laser_sword'
        });
    }
  
    return projectiles;
}
```

---

## 👤 2. AJOUTER UN NOUVEAU PERSONNAGE

### Dans `js/constants.js`, section `CHARACTERS` :

```javascript
export const CHARACTERS = {
    // ... personnages existants ...
  
    // VOTRE NOUVEAU PERSONNAGE
    ninja: {
        id: 'ninja',                          // ID unique
        name: "Shadow Ninja",                 // Nom affiché
        icon: "🥷",                           // Emoji/icône
      
        // Arme de départ (doit exister dans WEAPONS)
        startingWeapon: "boomerang_drone",
      
        // STATISTIQUES (1.0 = normal, >1 = bonus, <1 = malus)
        stats: { 
            hp: 70,                           // Points de vie
            speed: 1.4,                       // Vitesse (1.0 = normale)
            damage: 0.9,                      // Multiplicateur de dégâts
            armor: 0                          // Armure de base
        },
      
        // PASSIF UNIQUE
        passive: { 
            name: "Ombre Furtive",            // Nom du passif
            description: "+20% vitesse, +20% esquive",  // Description
          
            // Bonus (choisir parmi):
            speed: 0.20,                      // +20% vitesse
            damage: 0,                        // +X% dégâts
            maxHp: 0,                         // +X% vie max
            xpGain: 0,                        // +X% gain XP
            pickupRange: 0,                   // +X% rayon de collecte
            cooldown: 0,                      // -X% cooldown (réduction)
            areaSize: 0,                      // +X% zone d'effet
            projectileSpeed: 0,               // +X% vitesse projectiles
            armor: 0,                         // +X% réduction dégâts
            allStats: 0                       // +X% à toutes les stats
        },
      
        // CONDITION DE DÉBLOCAGE
        unlockCondition: { 
            type: 'kills',                    // Type: 'kills', 'survive', 'level', 'boss', 'secret'
            value: 5000,                      // Valeur requise
            description: "Éliminer 5000 ennemis"  // Texte affiché
        },
        // Autres exemples de conditions:
        // { type: 'survive', minutes: 15, description: "Survivre 15 minutes" }
        // { type: 'level', value: 30, description: "Atteindre niveau 30" }
        // { type: 'boss', value: 3, description: "Vaincre 3 boss" }
        // { type: 'survive', minutes: 20, map: 'alien_ship', description: "Survivre 20 min sur Vaisseau Alien" }
        // null = débloqué par défaut
      
        // Histoire/Lore du personnage
        lore: "Un assassin légendaire qui se déplace comme une ombre. Personne ne l'a jamais vu venir."
    },
};
```

---

## 👾 3. AJOUTER UN NOUVEL ENNEMI

### Étape 1 : Définir l'ennemi dans `js/constants.js`

```javascript
export const ENEMIES = {
    // ... ennemis existants ...
  
    // VOTRE NOUVEL ENNEMI
    acid_worm: {
        id: 'acid_worm',                      // ID unique
        name: "Ver Acide",                    // Nom affiché
        icon: "🐛",                           // Emoji
      
        // STATISTIQUES
        hp: 25,                               // Points de vie
        damage: 15,                           // Dégâts au contact
        speed: 45,                            // Vitesse de déplacement
        size: 35,                             // Taille (rayon = size/2)
      
        // Apparence
        color: '#88ff00',                     // Couleur (hex)
      
        // Récompenses
        xpValue: 5,                           // XP donné à la mort
        goldChance: 0.25,                     // Chance de drop or (0-1)
      
        // COMPORTEMENT (choisir un):
        // 'chase' - marche vers le joueur
        // 'swarm' - mouvement en essaim (rapide, erratique)
        // 'ranged' - garde ses distances et tire
        // 'phase' - peut traverser les obstacles, devient intangible
        // 'aggressive' - charge le joueur
        // 'kamikaze' - explose à la mort
        // 'spawner' - invoque d'autres ennemis
        behavior: 'chase',
      
        // OPTIONS SPÉCIFIQUES AU COMPORTEMENT
      
        // Pour 'ranged':
        shootCooldown: 2.0,                   // Temps entre les tirs
        projectileSpeed: 300,                 // Vitesse des projectiles
      
        // Pour 'phase':
        phaseInterval: 3.0,                   // Intervalle de phase
      
        // Pour 'aggressive':
        dashCooldown: 3.0,                    // Cooldown du dash
      
        // Pour 'kamikaze':
        explosionRadius: 80,                  // Rayon d'explosion
      
        // Pour 'spawner':
        spawnInterval: 4.0,                   // Temps entre spawns
        spawnType: 'insectoid',               // Type d'ennemi spawné
        maxSpawns: 8                          // Nombre max de spawns
    },
};
```

### Étape 2 : Ajouter l'ennemi aux maps

Dans `js/constants.js`, section `MAPS`, ajoutez votre ennemi à la liste :

```javascript
export const MAPS = {
    station: {
        // ...
        enemies: ['grunt', 'insectoid', 'drone', 'acid_worm'],  // Ajoutez ici
        // ...
    },
};
```

### Étape 3 (Optionnel) : Comportement personnalisé

Si vous voulez un comportement unique, modifiez `js/enemy.js` :

```javascript
// Dans la classe Enemy, méthode update()
update(dt, player, enemies) {
    // ... code existant ...
  
    switch (this.behavior) {
        // ... comportements existants ...
      
        // VOTRE NOUVEAU COMPORTEMENT
        case 'acid_trail':
            this.behaviorAcidTrail(dt, player);
            break;
    }
  
    return result;
}

// Nouvelle méthode de comportement
behaviorAcidTrail(dt, player) {
    // Suit le joueur
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
  
    if (dist > 0) {
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
    }
  
    // Laisse une traînée d'acide (exemple)
    // Vous pourriez spawner des zones de dégâts ici
}
```

---

## 🎨 4. MODIFIER LES VISUELS / SKINS

### 4.1 Modifier l'apparence du JOUEUR

Dans `js/player.js`, trouvez la méthode `render()` :

```javascript
render(ctx) {
    ctx.save();
  
    // Flash si invincible
    if (this.isInvincible && Math.floor(this.invincibleTime * 15) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
  
    // === PERSONNALISER ICI ===
  
    // OPTION 1: Couleur simple
    ctx.fillStyle = '#00ddff';  // Changez cette couleur
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  
    // OPTION 2: Dégradé
    const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius
    );
    gradient.addColorStop(0, '#00ddff');    // Couleur centre
    gradient.addColorStop(0.7, '#0088aa');  // Couleur milieu
    gradient.addColorStop(1, '#004466');    // Couleur bord
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  
    // OPTION 3: Carré au lieu de cercle
    /*
    ctx.fillStyle = '#00ddff';
    ctx.fillRect(
        this.x - this.radius, 
        this.y - this.radius, 
        this.radius * 2, 
        this.radius * 2
    );
    */
  
    // OPTION 4: Triangle
    /*
    ctx.fillStyle = '#00ddff';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.radius);  // Pointe en haut
    ctx.lineTo(this.x - this.radius, this.y + this.radius);
    ctx.lineTo(this.x + this.radius, this.y + this.radius);
    ctx.closePath();
    ctx.fill();
    */
  
    // OPTION 5: Image/Sprite
    /*
    // D'abord, charger l'image au début du fichier:
    // const playerImage = new Image();
    // playerImage.src = 'assets/sprites/player.png';
  
    ctx.drawImage(
        playerImage,
        this.x - this.radius,
        this.y - this.radius,
        this.radius * 2,
        this.radius * 2
    );
    */
  
    // Contour
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.stroke();
  
    // Indicateur de direction (œil)
    const eyeX = this.x + Math.cos(this.facingAngle) * 8;
    const eyeY = this.y + Math.sin(this.facingAngle) * 8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 5, 0, Math.PI * 2);
    ctx.fill();
  
    ctx.restore();
  
    // Orbes si équipées
    this.renderOrbitals(ctx);
}
```

### 4.2 Modifier l'apparence des ENNEMIS

Dans `js/enemy.js`, méthode `render()` de la classe `Enemy` :

```javascript
render(ctx) {
    ctx.save();
  
    // Effet de phase (transparent)
    if (this.isPhased) {
        ctx.globalAlpha = 0.4;
    }
  
    // Flash de dégâts (blanc)
    if (this.hitFlash > 0) {
        ctx.filter = 'brightness(3)';
    }
  
    // Aura pour les élites
    if (this.isElite) {
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
    }
  
    // === CORPS DE L'ENNEMI ===
  
    const color = this.data.color || '#44ff44';
  
    // OPTION 1: Cercle avec dégradé (par défaut)
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
  
    // OPTION 2: Hexagone
    /*
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = this.x + Math.cos(angle) * this.radius;
        const py = this.y + Math.sin(angle) * this.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    */
  
    // OPTION 3: Forme personnalisée selon le type
    /*
    switch (this.type) {
        case 'grunt':
            // Cercle
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'tank':
            // Carré
            ctx.fillRect(this.x - this.radius, this.y - this.radius, this.size, this.size);
            break;
        case 'insectoid':
            // Ovale
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radius * 1.3, this.radius * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
    */
  
    // Contour
    ctx.strokeStyle = this.isElite ? '#ffff00' : color;
    ctx.lineWidth = this.isElite ? 3 : 2;
    ctx.stroke();
  
    // Icône/Emoji au centre
    ctx.fillStyle = '#000000';
    ctx.font = `${this.size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.data.icon || '👽', this.x, this.y);
  
    // Barre de vie (pour élites et ennemis résistants)
    if (this.isElite || this.maxHp > 30) {
        const barWidth = this.size * 1.2;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 10;
      
        // Fond
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
      
        // Vie
        ctx.fillStyle = this.isElite ? '#ffff00' : '#ff4444';
        ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
    }
  
    ctx.restore();
}
```

### 4.3 Modifier l'apparence des PROJECTILES

Dans `js/projectile.js`, méthode `render()` :

```javascript
render(ctx) {
    if (!this.active) return;
  
    ctx.save();
  
    // Trail (traînée)
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
  
    // Glow (lueur)
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
  
    // === FORME SELON LE TYPE ===
    switch (this.type) {
        case 'laser':
        case 'normal':
            // Ellipse allongée
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 1.5, this.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
          
            // Centre blanc
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 0.8, this.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
          
        case 'plasma':
            // Cercle avec centre brillant
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
          
            // Flamme arrière
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
            // Bombe
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
          
            // Contour noir (danger)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
            break;
          
        // AJOUTEZ VOS PROPRES TYPES ICI
        case 'slash':
            // Arc de cercle (pour une attaque d'épée)
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size * 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, -Math.PI * 0.3, Math.PI * 0.3);
            ctx.stroke();
            break;
          
        default:
            // Cercle simple
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
    }
  
    ctx.restore();
}
```

---

## 🖼️ 5. UTILISER DES IMAGES/SPRITES

### Étape 1 : Créer un dossier pour les assets

```
galactic-survivor/
├── assets/
│   ├── sprites/
│   │   ├── player.png
│   │   ├── enemy_grunt.png
│   │   ├── enemy_tank.png
│   │   └── ...
│   ├── weapons/
│   │   ├── blaster.png
│   │   └── ...
│   └── effects/
│       ├── explosion.png
│       └── ...
```

### Étape 2 : Charger les images

Créez un fichier `js/assets.js` :

```javascript
// ========================================
// GALACTIC SURVIVOR - Chargeur d'Assets
// ========================================

export class AssetLoader {
    constructor() {
        this.images = {};
        this.loaded = false;
    }
  
    async loadAll() {
        const imagesToLoad = [
            { id: 'player', src: 'assets/sprites/player.png' },
            { id: 'enemy_grunt', src: 'assets/sprites/enemy_grunt.png' },
            { id: 'enemy_tank', src: 'assets/sprites/enemy_tank.png' },
            // Ajoutez toutes vos images ici
        ];
      
        const promises = imagesToLoad.map(img => this.loadImage(img.id, img.src));
      
        try {
            await Promise.all(promises);
            this.loaded = true;
            console.log('All assets loaded!');
        } catch (error) {
            console.error('Failed to load assets:', error);
        }
    }
  
    loadImage(id, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[id] = img;
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${src}`);
                resolve(); // On continue même si une image manque
            };
            img.src = src;
        });
    }
  
    get(id) {
        return this.images[id] || null;
    }
}

// Instance globale
export const Assets = new AssetLoader();
```

### Étape 3 : Utiliser les images dans le rendu

```javascript
// Dans js/player.js
import { Assets } from './assets.js';

// Dans la méthode render()
render(ctx) {
    ctx.save();
  
    const playerSprite = Assets.get('player');
  
    if (playerSprite) {
        // Utiliser l'image
        ctx.drawImage(
            playerSprite,
            this.x - this.radius,
            this.y - this.radius,
            this.radius * 2,
            this.radius * 2
        );
    } else {
        // Fallback : dessiner un cercle si l'image n'est pas chargée
        ctx.fillStyle = '#00ddff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
  
    ctx.restore();
}
```

---

## ⚡ 6. AJOUTER UN NOUVEAU PASSIF

Dans `js/constants.js`, section `PASSIVES` :

```javascript
export const PASSIVES = {
    // ... passifs existants ...
  
    // VOTRE NOUVEAU PASSIF
    vampire: {
        id: 'vampire',                        // ID unique
        name: "Vampirisme",                   // Nom affiché
        icon: "🧛",                           // Emoji
        description: "+3% vol de vie par niveau",  // Description
        maxLevel: 5,                          // Niveau maximum
      
        // EFFET (choisir parmi):
        effect: { 
            lifesteal: 0.03                   // Nouveau stat à implémenter
        }
      
        // Effets disponibles par défaut:
        // damage: 0.10        - +10% dégâts
        // armor: 0.05         - +5% réduction dégâts
        // maxHp: 0.20         - +20% vie max
        // hpRegen: 0.3        - +0.3 HP/sec
        // cooldown: 0.08      - -8% cooldown
        // area: 0.10          - +10% zone d'effet
        // projectileSpeed: 0.10 - +10% vitesse projectiles
        // duration: 0.10      - +10% durée
        // speed: 0.10         - +10% vitesse déplacement
        // pickupRange: 0.40   - +40% rayon collecte
        // xpGain: 0.10        - +10% gain XP
        // luck: 0.10          - +10% chance critiques/drops
      
        // Pour les évolutions d'armes:
        // evolutionItem: true
    },
};
```

Pour implémenter un effet personnalisé comme `lifesteal`, modifiez `js/player.js` :

```javascript
// Dans recalculateStats()
recalculateStats() {
    // ... code existant ...
  
    // Votre nouvelle stat
    this.lifesteal = (passives.lifesteal || 0);
}

// Dans la gestion des dégâts (weapon.js ou game.js)
// Quand un ennemi prend des dégâts:
if (this.player.lifesteal > 0) {
    const healAmount = damage * this.player.lifesteal;
    this.player.heal(healAmount);
}
```

---

## 🗺️ 7. AJOUTER UNE NOUVELLE MAP

Dans `js/constants.js`, section `MAPS` :

```javascript
export const MAPS = {
    // ... maps existantes ...
  
    // VOTRE NOUVELLE MAP
    ice_planet: {
        id: 'ice_planet',                     // ID unique
        name: "Planète de Glace",             // Nom affiché
        icon: "❄️",                           // Emoji
        description: "Un monde gelé hostile. Le froid ralentit tout le monde.",
      
        // Apparence
        background: '#101830',                // Couleur de fond
        gridColor: 'rgba(100, 150, 255, 0.15)', // Couleur de la grille
      
        // Taille de la map
        size: { width: 5000, height: 5000 },
      
        // Durée pour gagner (en secondes)
        duration: 20 * 60,                    // 20 minutes
      
        // Ennemis présents (IDs de ENEMIES)
        enemies: ['grunt', 'tank', 'ghost', 'elite'],
      
        // Chance d'apparition d'élites
        eliteChance: 0.05,                    // 5%
      
        // Boss de la map (ID de BOSSES)
        boss: 'mech_titan',
      
        // Dangers environnementaux
        hazards: ['ice_patches', 'blizzard'],
      
        // Condition de déblocage
        unlockCondition: { 
            type: 'survive', 
            minutes: 15, 
            description: "Survivre 15 minutes" 
        },
      
        // Multiplicateur de difficulté
        difficultyMult: 1.5
    },
};
```

---

## 📋 RÉSUMÉ RAPIDE

| Action                     | Fichier           | Section          |
| -------------------------- | ----------------- | ---------------- |
| Ajouter arme               | `constants.js`  | `WEAPONS`      |
| Ajouter personnage         | `constants.js`  | `CHARACTERS`   |
| Ajouter ennemi             | `constants.js`  | `ENEMIES`      |
| Ajouter passif             | `constants.js`  | `PASSIVES`     |
| Ajouter boss               | `constants.js`  | `BOSSES`       |
| Ajouter map                | `constants.js`  | `MAPS`         |
| Modifier visuel joueur     | `player.js`     | `render()`     |
| Modifier visuel ennemi     | `enemy.js`      | `render()`     |
| Modifier visuel projectile | `projectile.js` | `render()`     |
| Comportement arme          | `weapon.js`     | `fireWeapon()` |
| Comportement ennemi        | `enemy.js`      | `update()`     |

---

## 💡 CONSEILS

1. **Testez souvent** : Après chaque modification, rechargez le jeu et testez
2. **Console (F12)** : Regardez les erreurs dans la console du navigateur
3. **Sauvegardez** : Faites des copies de vos fichiers avant de modifier
4. **IDs uniques** : Chaque arme/personnage/ennemi doit avoir un ID unique
5. **Équilibre** : Ajustez les stats progressivement pour équilibrer le jeu

Bonne création ! 🎮
