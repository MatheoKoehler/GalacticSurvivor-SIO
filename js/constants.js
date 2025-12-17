// ========================================
// GALACTIC SURVIVOR - Constantes du Jeu
// ========================================

// === CONFIGURATION GLOBALE ===
export const CONFIG = {
    DEBUG: false,
    TARGET_FPS: 60,
    MAX_ENEMIES: 500,
    MAX_PROJECTILES: 1000,
    MAX_PARTICLES: 500,
    XP_ATTRACT_SPEED: 400,
    PICKUP_RADIUS_BASE: 50,
    INVINCIBILITY_TIME: 0.5,
    LEVEL_UP_XP_MULTIPLIER: 1.15,
    BASE_XP_TO_LEVEL: 10
};

// === PERSONNAGES ===
export const CHARACTERS = {
    commander: {
        id: 'commander',
        name: "Commander Rex",
        icon: "👨‍🚀",
        startingWeapon: "blaster",
        stats: { hp: 100, speed: 1.0, damage: 1.0, armor: 0 },
        passive: { 
            name: "Leadership",
            description: "+10% dégâts",
            damage: 0.10 
        },
        unlockCondition: null,
        lore: "Vétéran de la guerre contre les Xenos. Son expérience au combat fait de lui un leader naturel."
    },
    
    scientist: {
        id: 'scientist',
        name: "Dr. Nova",
        icon: "👩‍🔬",
        startingWeapon: "tesla_coil",
        stats: { hp: 80, speed: 1.1, damage: 0.9, armor: 0 },
        passive: { 
            name: "Génie",
            description: "+20% XP",
            xpGain: 0.20 
        },
        unlockCondition: { type: 'level', value: 20, description: "Atteindre le niveau 20" },
        lore: "Génie en physique quantique. Ses connaissances scientifiques sont inégalées."
    },
    
    soldier: {
        id: 'soldier',
        name: "Sergeant Blaze",
        icon: "💂",
        startingWeapon: "plasma_rifle",
        stats: { hp: 120, speed: 0.9, damage: 1.15, armor: 5 },
        passive: { 
            name: "Vétéran",
            description: "+15% vitesse projectiles",
            projectileSpeed: 0.15 
        },
        unlockCondition: { type: 'survive', minutes: 10, description: "Survivre 10 minutes" },
        lore: "Spécialiste des armes lourdes. Rien ne lui résiste sur le champ de bataille."
    },
    
    scout: {
        id: 'scout',
        name: "Shadow",
        icon: "🥷",
        startingWeapon: "homing_missiles",
        stats: { hp: 70, speed: 1.35, damage: 0.85, armor: 0 },
        passive: { 
            name: "Agilité",
            description: "+15% vitesse, +30% collecte",
            speed: 0.15, 
            pickupRange: 0.30 
        },
        unlockCondition: { type: 'kills', value: 3000, description: "Éliminer 3000 ennemis" },
        lore: "Ex-agent d'infiltration. Sa vitesse et son agilité sont légendaires."
    },
    
    engineer: {
        id: 'engineer',
        name: "Gearhead",
        icon: "👨‍🔧",
        startingWeapon: "shield_orbs",
        stats: { hp: 90, speed: 1.0, damage: 0.95, armor: 3 },
        passive: { 
            name: "Surcharge",
            description: "-15% cooldown",
            cooldown: 0.15 
        },
        unlockCondition: { type: 'boss', value: 1, description: "Vaincre un boss" },
        lore: "Peut réparer n'importe quoi. Ses gadgets sont toujours prêts à l'emploi."
    },
    
    psychic: {
        id: 'psychic',
        name: "Psion",
        icon: "🧙",
        startingWeapon: "force_field",
        stats: { hp: 60, speed: 1.0, damage: 1.25, armor: 0 },
        passive: { 
            name: "Télékinésie",
            description: "+25% zone d'effet",
            areaSize: 0.25 
        },
        unlockCondition: { type: 'survive', minutes: 15, map: 'alien_ship', description: "Survivre 15 min sur Vaisseau Alien" },
        lore: "Pouvoirs mentaux mystérieux. Ses capacités psychiques défient toute explication."
    },
    
    android: {
        id: 'android',
        name: "Unit-X7",
        icon: "🤖",
        startingWeapon: "rail_gun",
        stats: { hp: 150, speed: 0.85, damage: 1.3, armor: 10 },
        passive: { 
            name: "Synthétique",
            description: "+5% à toutes les stats",
            allStats: 0.05 
        },
        unlockCondition: { type: 'secret', requirement: 'complete_all_maps', description: "Compléter toutes les maps" },
        lore: "Androïde de combat expérimental. Une machine de guerre parfaite."
    }
};

// === ARMES ===
export const WEAPONS = {
    blaster: {
        id: 'blaster',
        name: "Blaster",
        icon: "🔫",
        description: "Pistolet laser basique. Tire vers l'ennemi le plus proche.",
        type: 'projectile',
        cooldown: 0.5,
        baseDamage: 10,
        projectileSpeed: 600,
        projectileSize: 8,
        pierce: 1,
        duration: 2,
        color: '#00ffff',
        maxLevel: 8,
        evolution: { requires: 'energy_cell', becomes: 'death_ray' },
        levelBonuses: {
            damage: 3,
            projectiles: [1, 1, 1, 2, 2, 2, 3, 3],
            cooldownMult: [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65]
        }
    },
    
    plasma_rifle: {
        id: 'plasma_rifle',
        name: "Plasma Rifle",
        icon: "🔮",
        description: "Tire un éventail de projectiles plasma.",
        type: 'spread',
        cooldown: 1.0,
        baseDamage: 8,
        projectileSpeed: 500,
        projectileSize: 10,
        pierce: 1,
        duration: 1.5,
        color: '#ff00ff',
        spreadAngle: 0.3,
        baseProjectiles: 3,
        maxLevel: 8,
        evolution: { requires: 'targeting_system', becomes: 'plasma_storm' },
        levelBonuses: {
            damage: 2,
            projectiles: [3, 4, 4, 5, 5, 6, 7, 8],
            spreadAngle: [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7]
        }
    },
    
    tesla_coil: {
        id: 'tesla_coil',
        name: "Tesla Coil",
        icon: "⚡",
        description: "Arc électrique vers un ennemi aléatoire. Peut chaîner.",
        type: 'lightning',
        cooldown: 1.2,
        baseDamage: 15,
        range: 300,
        chainCount: 1,
        chainRange: 150,
        duration: 0.15,
        color: '#ffff00',
        maxLevel: 8,
        evolution: { requires: 'capacitor', becomes: 'thunder_god' },
        levelBonuses: {
            damage: 4,
            chains: [1, 1, 2, 2, 3, 3, 4, 5],
            rangeMult: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8]
        }
    },
    
    shield_orbs: {
        id: 'shield_orbs',
        name: "Shield Orbs",
        icon: "🛡️",
        description: "Orbes qui tournent autour du joueur et endommagent les ennemis.",
        type: 'orbital',
        cooldown: 0,
        baseDamage: 12,
        orbitRadius: 80,
        orbitSpeed: 2,
        orbSize: 15,
        baseOrbs: 2,
        color: '#ffaa00',
        maxLevel: 8,
        evolution: { requires: 'reactor_core', becomes: 'orbital_strike' },
        levelBonuses: {
            damage: 3,
            orbs: [2, 3, 3, 4, 4, 5, 6, 8],
            radiusMult: [1, 1.1, 1.2, 1.25, 1.3, 1.35, 1.4, 1.5],
            sizeMult: [1, 1.1, 1.15, 1.2, 1.25, 1.3, 1.4, 1.5]
        }
    },
    
    homing_missiles: {
        id: 'homing_missiles',
        name: "Homing Missiles",
        icon: "🚀",
        description: "Missiles lents mais qui suivent les ennemis.",
        type: 'homing',
        cooldown: 1.5,
        baseDamage: 25,
        projectileSpeed: 250,
        projectileSize: 12,
        turnSpeed: 3,
        duration: 4,
        color: '#ff6600',
        maxLevel: 8,
        evolution: { requires: 'nano_swarm', becomes: 'drone_swarm' },
        levelBonuses: {
            damage: 6,
            projectiles: [1, 1, 2, 2, 3, 3, 4, 5],
            speedMult: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8]
        }
    },
    
    force_field: {
        id: 'force_field',
        name: "Force Field",
        icon: "💠",
        description: "Aura de dégâts autour du joueur.",
        type: 'aura',
        cooldown: 0,
        baseDamage: 5,
        damageInterval: 0.5,
        radius: 100,
        color: '#00ff88',
        maxLevel: 8,
        evolution: { requires: 'psychic_amp', becomes: 'singularity' },
        levelBonuses: {
            damage: 2,
            radiusMult: [1, 1.15, 1.3, 1.45, 1.6, 1.75, 1.9, 2.1],
            intervalMult: [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.6]
        }
    },
    
    rail_gun: {
        id: 'rail_gun',
        name: "Rail Gun",
        icon: "📡",
        description: "Tir perçant qui traverse tous les ennemis.",
        type: 'piercing',
        cooldown: 2.0,
        baseDamage: 40,
        projectileSpeed: 1200,
        projectileSize: 6,
        pierce: 999,
        duration: 1,
        width: 10,
        color: '#00ffaa',
        maxLevel: 8,
        evolution: { requires: 'quantum_core', becomes: 'singularity_cannon' },
        levelBonuses: {
            damage: 12,
            widthMult: [1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.3, 2.6],
            cooldownMult: [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.6]
        }
    },
    
    grenade_launcher: {
        id: 'grenade_launcher',
        name: "Grenade Launcher",
        icon: "💣",
        description: "Lance des grenades explosives.",
        type: 'explosive',
        cooldown: 1.8,
        baseDamage: 20,
        projectileSpeed: 350,
        projectileSize: 14,
        duration: 1.5,
        explosionRadius: 80,
        color: '#ff4444',
        maxLevel: 8,
        evolution: { requires: 'explosive_module', becomes: 'nuke_launcher' },
        levelBonuses: {
            damage: 5,
            radiusMult: [1, 1.15, 1.3, 1.45, 1.6, 1.8, 2.0, 2.3],
            projectiles: [1, 1, 2, 2, 2, 3, 3, 4]
        }
    },
    
    flamethrower: {
        id: 'flamethrower',
        name: "Flamethrower",
        icon: "🔥",
        description: "Cône de flammes devant le joueur.",
        type: 'cone',
        cooldown: 0,
        baseDamage: 3,
        damageInterval: 0.1,
        range: 120,
        coneAngle: 0.6,
        color: '#ff6600',
        maxLevel: 8,
        evolution: { requires: 'fuel_tank', becomes: 'inferno_core' },
        levelBonuses: {
            damage: 1,
            rangeMult: [1, 1.15, 1.3, 1.45, 1.6, 1.75, 1.9, 2.1],
            angleMult: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8]
        }
    },
    
    boomerang_drone: {
        id: 'boomerang_drone',
        name: "Boomerang Drone",
        icon: "🪃",
        description: "Drone qui revient vers le joueur.",
        type: 'boomerang',
        cooldown: 1.3,
        baseDamage: 18,
        projectileSpeed: 400,
        projectileSize: 16,
        returnSpeed: 500,
        maxDistance: 350,
        pierce: 999,
        color: '#aa88ff',
        maxLevel: 8,
        evolution: { requires: 'magnetic_field', becomes: 'vortex_blade' },
        levelBonuses: {
            damage: 4,
            projectiles: [1, 1, 2, 2, 2, 3, 3, 4],
            speedMult: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8]
        }
    }
};

// === ARMES ÉVOLUÉES ===
export const EVOLVED_WEAPONS = {
    death_ray: {
        id: 'death_ray',
        name: "Death Ray",
        icon: "☠️",
        baseWeapon: 'blaster',
        description: "Laser continu dévastateur",
        type: 'beam',
        cooldown: 0,
        baseDamage: 50,
        damageInterval: 0.05,
        range: 500,
        width: 20,
        color: '#ff0000'
    },
    
    plasma_storm: {
        id: 'plasma_storm',
        name: "Plasma Storm",
        icon: "🌀",
        baseWeapon: 'plasma_rifle',
        description: "Tempête de 12 projectiles auto-aim",
        type: 'spread',
        cooldown: 0.8,
        baseDamage: 15,
        projectileSpeed: 600,
        projectiles: 12,
        homing: true,
        color: '#ff00ff'
    },
    
    thunder_god: {
        id: 'thunder_god',
        name: "Thunder God",
        icon: "⛈️",
        baseWeapon: 'tesla_coil',
        description: "Chaîne à 8 ennemis, paralyse",
        type: 'lightning',
        cooldown: 0.8,
        baseDamage: 35,
        chainCount: 8,
        stunDuration: 0.5,
        color: '#ffffff'
    },
    
    orbital_strike: {
        id: 'orbital_strike',
        name: "Orbital Strike",
        icon: "☄️",
        baseWeapon: 'shield_orbs',
        description: "8 orbes avec tirs laser",
        type: 'orbital',
        baseDamage: 25,
        orbs: 8,
        shootsLasers: true,
        color: '#ffdd00'
    },
    
    drone_swarm: {
        id: 'drone_swarm',
        name: "Drone Swarm",
        icon: "🐝",
        baseWeapon: 'homing_missiles',
        description: "Essaim de 20 micro-drones",
        type: 'swarm',
        cooldown: 1.0,
        baseDamage: 8,
        droneCount: 20,
        color: '#ffaa00'
    }
};

// === MODULES PASSIFS ===
export const PASSIVES = {
    power_core: {
        id: 'power_core',
        name: "Power Core",
        icon: "💪",
        description: "+10% dégâts par niveau",
        maxLevel: 5,
        effect: { damage: 0.10 }
    },
    
    nano_armor: {
        id: 'nano_armor',
        name: "Nano Armor",
        icon: "🛡️",
        description: "+5% réduction de dégâts par niveau",
        maxLevel: 5,
        effect: { armor: 0.05 }
    },
    
    shield_booster: {
        id: 'shield_booster',
        name: "Shield Booster",
        icon: "❤️",
        description: "+20% bouclier max par niveau",
        maxLevel: 5,
        effect: { maxHp: 0.20 }
    },
    
    regenerator: {
        id: 'regenerator',
        name: "Regenerator",
        icon: "💚",
        description: "+0.3 HP/sec par niveau",
        maxLevel: 5,
        effect: { hpRegen: 0.3 }
    },
    
    overclock: {
        id: 'overclock',
        name: "Overclock",
        icon: "⏱️",
        description: "-8% cooldown par niveau",
        maxLevel: 5,
        effect: { cooldown: 0.08 }
    },
    
    amplifier: {
        id: 'amplifier',
        name: "Amplifier",
        icon: "📡",
        description: "+10% zone d'effet par niveau",
        maxLevel: 5,
        effect: { area: 0.10 }
    },
    
    accelerator: {
        id: 'accelerator',
        name: "Accelerator",
        icon: "💨",
        description: "+10% vitesse projectiles par niveau",
        maxLevel: 5,
        effect: { projectileSpeed: 0.10 }
    },
    
    stabilizer: {
        id: 'stabilizer',
        name: "Stabilizer",
        icon: "⚖️",
        description: "+10% durée effets par niveau",
        maxLevel: 5,
        effect: { duration: 0.10 }
    },
    
    jet_boots: {
        id: 'jet_boots',
        name: "Jet Boots",
        icon: "👟",
        description: "+10% vitesse déplacement par niveau",
        maxLevel: 5,
        effect: { speed: 0.10 }
    },
    
    tractor_beam: {
        id: 'tractor_beam',
        name: "Tractor Beam",
        icon: "🧲",
        description: "+40% rayon collecte XP par niveau",
        maxLevel: 3,
        effect: { pickupRange: 0.40 }
    },
    
    xp_chip: {
        id: 'xp_chip',
        name: "XP Chip",
        icon: "📊",
        description: "+10% gain d'XP par niveau",
        maxLevel: 5,
        effect: { xpGain: 0.10 }
    },
    
    lucky_chip: {
        id: 'lucky_chip',
        name: "Lucky Chip",
        icon: "🍀",
        description: "+10% critiques et drops par niveau",
        maxLevel: 5,
        effect: { luck: 0.10 }
    },
    
    energy_cell: {
        id: 'energy_cell',
        name: "Energy Cell",
        icon: "🔋",
        description: "+10% dégâts laser par niveau",
        maxLevel: 3,
        effect: { laserDamage: 0.10 },
        evolutionItem: true
    },
    
    targeting_system: {
        id: 'targeting_system',
        name: "Targeting System",
        icon: "🎯",
        description: "Projectiles suivent mieux les cibles",
        maxLevel: 3,
        effect: { homing: 0.15 },
        evolutionItem: true
    },
    
    reactor_core: {
        id: 'reactor_core',
        name: "Reactor Core",
        icon: "☢️",
        description: "+1 projectile orbital par niveau",
        maxLevel: 3,
        effect: { orbitals: 1 },
        evolutionItem: true
    },
    
    capacitor: {
        id: 'capacitor',
        name: "Capacitor",
        icon: "🔌",
        description: "+1 chaîne électrique par niveau",
        maxLevel: 3,
        effect: { chains: 1 },
        evolutionItem: true
    },
    
    explosive_module: {
        id: 'explosive_module',
        name: "Explosive Module",
        icon: "💥",
        description: "+15% rayon d'explosion par niveau",
        maxLevel: 3,
        effect: { explosionRadius: 0.15 },
        evolutionItem: true
    }
};

// === ENNEMIS ===
export const ENEMIES = {
    grunt: {
        id: 'grunt',
        name: "Alien Grunt",
        icon: "👽",
        hp: 10,
        damage: 8,
        speed: 60,
        size: 28,
        color: '#44ff44',
        xpValue: 1,
        goldChance: 0.15,
        behavior: 'chase'
    },
    
    insectoid: {
        id: 'insectoid',
        name: "Insectoïde",
        icon: "🦗",
        hp: 5,
        damage: 5,
        speed: 120,
        size: 20,
        color: '#88ff88',
        xpValue: 1,
        goldChance: 0.1,
        behavior: 'swarm'
    },
    
    drone: {
        id: 'drone',
        name: "Drone Sentinelle",
        icon: "🛸",
        hp: 15,
        damage: 12,
        speed: 80,
        size: 24,
        color: '#8888ff',
        xpValue: 3,
        goldChance: 0.2,
        behavior: 'ranged',
        shootCooldown: 2.0,
        projectileSpeed: 300
    },
    
    tank: {
        id: 'tank',
        name: "Mech Lourd",
        icon: "🤖",
        hp: 80,
        damage: 20,
        speed: 30,
        size: 45,
        color: '#ff8844',
        xpValue: 10,
        goldChance: 0.4,
        behavior: 'chase'
    },
    
    ghost: {
        id: 'ghost',
        name: "Spectre Alien",
        icon: "👻",
        hp: 20,
        damage: 15,
        speed: 90,
        size: 26,
        color: '#aa88ff',
        xpValue: 5,
        goldChance: 0.25,
        behavior: 'phase',
        phaseInterval: 3.0
    },
    
    elite: {
        id: 'elite',
        name: "Xeno Warrior",
        icon: "⚔️",
        hp: 50,
        damage: 25,
        speed: 100,
        size: 35,
        color: '#ff4444',
        xpValue: 15,
        goldChance: 0.5,
        behavior: 'aggressive',
        dashCooldown: 3.0
    },
    
    exploder: {
        id: 'exploder',
        name: "Suicide Bot",
        icon: "💣",
        hp: 12,
        damage: 40,
        speed: 110,
        size: 22,
        color: '#ffaa00',
        xpValue: 3,
        goldChance: 0.2,
        behavior: 'kamikaze',
        explosionRadius: 60
    },
    
    spawner: {
        id: 'spawner',
        name: "Ruche Organique",
        icon: "🥚",
        hp: 60,
        damage: 0,
        speed: 0,
        size: 50,
        color: '#884488',
        xpValue: 20,
        goldChance: 0.6,
        behavior: 'spawner',
        spawnInterval: 3.0,
        spawnType: 'insectoid',
        maxSpawns: 10
    }
};

// === BOSS ===
export const BOSSES = {
    hive_queen: {
        id: 'hive_queen',
        name: "Hive Queen",
        icon: "👑",
        hp: 500,
        damage: 30,
        speed: 40,
        size: 80,
        color: '#88ff44',
        xpValue: 200,
        goldValue: 50,
        spawnTime: 5 * 60,
        attacks: ['spawn_swarm', 'acid_spit', 'charge'],
        phases: 3
    },
    
    mech_titan: {
        id: 'mech_titan',
        name: "Mech Titan",
        icon: "🦾",
        hp: 1500,
        damage: 50,
        speed: 25,
        size: 100,
        color: '#ff6644',
        xpValue: 500,
        goldValue: 100,
        spawnTime: 10 * 60,
        attacks: ['missiles', 'laser_sweep', 'stomp'],
        phases: 4
    },
    
    xeno_overlord: {
        id: 'xeno_overlord',
        name: "Xeno Overlord",
        icon: "🦑",
        hp: 3000,
        damage: 60,
        speed: 50,
        size: 90,
        color: '#aa44ff',
        xpValue: 1000,
        goldValue: 200,
        spawnTime: 15 * 60,
        attacks: ['teleport', 'psychic_blast', 'summon_elites'],
        phases: 5
    },
    
    corrupted_ai: {
        id: 'corrupted_ai',
        name: "Corrupted AI",
        icon: "🖥️",
        hp: 5000,
        damage: 45,
        speed: 0,
        size: 120,
        color: '#00ffff',
        xpValue: 2000,
        goldValue: 350,
        spawnTime: 20 * 60,
        attacks: ['spawn_drones', 'electric_field', 'hack_projectiles'],
        phases: 4
    },
    
    elder_god: {
        id: 'elder_god',
        name: "Elder God",
        icon: "👁️",
        hp: 10000,
        damage: 80,
        speed: 35,
        size: 150,
        color: '#ff00ff',
        xpValue: 5000,
        goldValue: 1000,
        spawnTime: 25 * 60,
        attacks: ['all'],
        phases: 6,
        isFinal: true
    }
};

// === MAPS ===
export const MAPS = {
    station: {
        id: 'station',
        name: "Station Orbitale",
        icon: "🛰️",
        description: "Une station abandonnée infestée d'aliens. Zone de départ idéale.",
        background: '#0a0a1a',
        gridColor: 'rgba(0, 255, 255, 0.1)',
        size: { width: 4000, height: 4000 },
        duration: 15 * 60,
        enemies: ['grunt', 'insectoid', 'drone'],
        eliteChance: 0.03,
        boss: 'hive_queen',
        hazards: [],
        unlockCondition: null,
        difficultyMult: 1.0
    },
    
    mars: {
        id: 'mars',
        name: "Surface de Mars",
        icon: "🔴",
        description: "Désert rouge hostile. Attention aux tempêtes de sable.",
        background: '#1a0a0a',
        gridColor: 'rgba(255, 100, 50, 0.1)',
        size: { width: 5000, height: 5000 },
        duration: 18 * 60,
        enemies: ['grunt', 'tank', 'exploder', 'spawner'],
        eliteChance: 0.04,
        boss: 'mech_titan',
        hazards: ['sandstorm'],
        unlockCondition: { type: 'survive', minutes: 10, description: "Survivre 10 min sur Station" },
        difficultyMult: 1.2
    },
    
    alien_ship: {
        id: 'alien_ship',
        name: "Vaisseau Alien",
        icon: "🛸",
        description: "Intérieur organique et hostile. Les ennemis se régénèrent.",
        background: '#0a1a0a',
        gridColor: 'rgba(100, 255, 100, 0.1)',
        size: { width: 3500, height: 3500 },
        duration: 20 * 60,
        enemies: ['grunt', 'insectoid', 'ghost', 'elite'],
        eliteChance: 0.05,
        boss: 'xeno_overlord',
        hazards: ['acid_pools', 'closing_doors'],
        unlockCondition: { type: 'boss', value: 1, description: "Vaincre un boss" },
        difficultyMult: 1.4
    },
    
    jungle: {
        id: 'jungle',
        name: "Planète Jungle",
        icon: "🌴",
        description: "Végétation alien toxique. Le poison s'accumule.",
        background: '#051505',
        gridColor: 'rgba(50, 200, 50, 0.1)',
        size: { width: 5500, height: 5500 },
        duration: 22 * 60,
        enemies: ['insectoid', 'ghost', 'spawner', 'exploder'],
        eliteChance: 0.05,
        boss: 'corrupted_ai',
        hazards: ['poison_clouds', 'explosive_plants'],
        unlockCondition: { type: 'level', value: 50, description: "Atteindre niveau 50" },
        difficultyMult: 1.6
    },
    
    void: {
        id: 'void',
        name: "Cœur de l'Essaim",
        icon: "🕳️",
        description: "Dimension alien. Tous les ennemis, difficulté maximale.",
        background: '#050510',
        gridColor: 'rgba(150, 50, 200, 0.1)',
        size: { width: 6000, height: 6000 },
        duration: 30 * 60,
        enemies: ['grunt', 'insectoid', 'drone', 'tank', 'ghost', 'elite', 'exploder', 'spawner'],
        eliteChance: 0.08,
        boss: 'elder_god',
        hazards: ['portals', 'distortion'],
        unlockCondition: { type: 'complete_all', description: "Compléter toutes les autres maps" },
        difficultyMult: 2.0
    }
};

// === TALENTS (META-PROGRESSION) ===
export const TALENTS = {
    vitality: {
        id: 'vitality',
        name: "Bouclier Amélioré",
        icon: "❤️",
        description: "+5 Shield max par niveau",
        maxLevel: 10,
        costs: [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
        effect: { maxHp: 5 }
    },
    
    power: {
        id: 'power',
        name: "Puissance de Feu",
        icon: "💪",
        description: "+3% dégâts par niveau",
        maxLevel: 10,
        costs: [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
        effect: { damage: 0.03 }
    },
    
    agility: {
        id: 'agility',
        name: "Propulseurs",
        icon: "👟",
        description: "+3% vitesse par niveau",
        maxLevel: 5,
        costs: [200, 400, 800, 1600, 3200],
        effect: { speed: 0.03 }
    },
    
    greed: {
        id: 'greed',
        name: "Scanneur de Ressources",
        icon: "💰",
        description: "+8% crédits par niveau",
        maxLevel: 10,
        costs: [150, 300, 600, 1200, 2400, 4800, 9600, 19200, 38400, 76800],
        effect: { goldMult: 0.08 }
    },
    
    wisdom: {
        id: 'wisdom',
        name: "Analyseur XP",
        icon: "📚",
        description: "+5% XP par niveau",
        maxLevel: 10,
        costs: [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
        effect: { xpMult: 0.05 }
    },
    
    regen: {
        id: 'regen',
        name: "Nano-Réparation",
        icon: "💚",
        description: "+0.1 HP/sec par niveau",
        maxLevel: 5,
        costs: [300, 600, 1200, 2400, 4800],
        effect: { hpRegen: 0.1 }
    },
    
    fortune: {
        id: 'fortune',
        name: "Module de Chance",
        icon: "🍀",
        description: "+5% critiques et drops",
        maxLevel: 10,
        costs: [200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200, 102400],
        effect: { luck: 0.05 }
    },
    
    efficiency: {
        id: 'efficiency',
        name: "Refroidissement Avancé",
        icon: "❄️",
        description: "-3% cooldown armes",
        maxLevel: 5,
        costs: [250, 500, 1000, 2000, 4000],
        effect: { cooldown: 0.03 }
    },
    
    magnetism: {
        id: 'magnetism',
        name: "Champ Magnétique",
        icon: "🧲",
        description: "+15% rayon de collecte",
        maxLevel: 5,
        costs: [150, 300, 600, 1200, 2400],
        effect: { pickupRange: 0.15 }
    },
    
    revival: {
        id: 'revival',
        name: "Second Souffle",
        icon: "✨",
        description: "Chance de revivre une fois",
        maxLevel: 3,
        costs: [5000, 15000, 50000],
        effect: { reviveChance: 0.25 }
    }
};

// === DROPS ===
export const DROPS = {
    xp_small: { type: 'xp', value: 1, color: '#4488ff', size: 8, chance: 1.0 },
    xp_medium: { type: 'xp', value: 5, color: '#44ff44', size: 10, chance: 0.25 },
    xp_large: { type: 'xp', value: 25, color: '#ffff44', size: 14, chance: 0.05 },
    xp_rare: { type: 'xp', value: 100, color: '#ff4444', size: 18, chance: 0.005 },
    
    gold_small: { type: 'gold', value: 1, color: '#ffd700', size: 10, chance: 0.15 },
    gold_large: { type: 'gold', value: 10, color: '#ffaa00', size: 14, chance: 0.02 },
    
    health_small: { type: 'health', value: 20, color: '#ff6666', size: 16, chance: 0.02 },
    health_large: { type: 'health', value: 50, color: '#ff3333', size: 20, chance: 0.005 },
    
    magnet: { type: 'magnet', color: '#ff00ff', size: 18, chance: 0.008 },
    nuke: { type: 'nuke', color: '#ffffff', size: 20, chance: 0.002 },
    invincible: { type: 'invincible', color: '#00ffff', size: 18, chance: 0.004 },
    double_damage: { type: 'double_damage', color: '#ff8800', size: 18, chance: 0.006 }
};

// === SPAWN CONFIGURATION ===
export const SPAWN_CONFIG = {
    baseSpawnRate: 1500,
    minSpawnRate: 300,
    spawnRateDecay: 0.97,
    maxEnemiesBase: 100,
    maxEnemiesScale: 10,
    spawnDistance: { min: 400, max: 600 },
    
    waves: [
        { time: 0, types: ['grunt'], weight: 1.0, eliteChance: 0 },
        { time: 30, types: ['grunt', 'insectoid'], weight: 1.2, eliteChance: 0.01 },
        { time: 60, types: ['grunt', 'insectoid'], weight: 1.5, eliteChance: 0.02 },
        { time: 120, types: ['grunt', 'insectoid', 'drone'], weight: 2.0, eliteChance: 0.03 },
        { time: 180, types: ['grunt', 'insectoid', 'drone', 'tank'], weight: 2.5, eliteChance: 0.04 },
        { time: 300, types: ['all'], weight: 3.0, eliteChance: 0.05, bossWave: true },
        { time: 420, types: ['all'], weight: 3.5, eliteChance: 0.06 },
        { time: 540, types: ['all'], weight: 4.0, eliteChance: 0.07 },
        { time: 600, types: ['all'], weight: 5.0, eliteChance: 0.08, bossWave: true },
        { time: 720, types: ['all'], weight: 6.0, eliteChance: 0.10 },
        { time: 900, types: ['all'], weight: 8.0, eliteChance: 0.12, bossWave: true },
        { time: 1200, types: ['all'], weight: 10.0, eliteChance: 0.15, bossWave: true },
        { time: 1500, types: ['all'], weight: 15.0, eliteChance: 0.20, bossWave: true }
    ]
};