import {
  Bullet,
  Enemy,
  FloatingText,
  GameMode,
  GameSettings,
  MatchStats,
  Obstacle,
  Particle,
  Player,
  PowerUp,
  TargetPracticeItem,
  UpgradeTier,
  WeaponId,
  WeaponState,
} from '../types/game';
import { WEAPON_REGISTRY, createDefaultWeaponState } from './weapons';
import { soundManager } from '../audio/soundManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Arena & Camera
  public readonly arenaWidth = 2600;
  public readonly arenaHeight = 2600;
  public cameraX = 0;
  public cameraY = 0;
  public mouseScreenX = 0;
  public mouseScreenY = 0;
  public mouseWorldX = 0;
  public mouseWorldY = 0;
  public isMouseDown = false;
  public isTouchDevice = false;

  // Game Mode & State
  public mode: GameMode = 'SURVIVAL';
  public isRunning = false;
  public isPaused = false;
  public currentWave = 1;
  public waveTimer = 0;
  public waveEnemiesRemaining = 0;
  public waveTotalEnemies = 0;
  public isWaveIntermission = false;
  public intermissionTimer = 0;
  public matchTimeSec = 0;

  // Screen shake
  private shakeIntensity = 0;
  private shakeDecay = 0.9;

  // Entities
  public player!: Player;
  public activeWeaponId: WeaponId = 'pistol';
  public weaponStates: Record<WeaponId, WeaponState> = {} as Record<WeaponId, WeaponState>;
  public unlockedWeapons: WeaponId[] = ['pistol'];
  public bullets: Bullet[] = [];
  public enemies: Enemy[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public powerUps: PowerUp[] = [];
  public obstacles: Obstacle[] = [];
  public practiceTargets: TargetPracticeItem[] = [];

  // Upgrades
  public upgrades: UpgradeTier[] = [];

  // Settings & Callbacks
  public settings: GameSettings;
  public onWaveComplete?: (wave: number) => void;
  public onGameOver?: (stats: MatchStats) => void;
  public onVictory?: (stats: MatchStats) => void;
  public onPlayerStateUpdate?: () => void;

  // Controls state
  private keys: Record<string, boolean> = {};
  public virtualMoveX = 0;
  public virtualMoveY = 0;

  constructor(canvas: HTMLCanvasElement, settings: GameSettings, upgrades: UpgradeTier[]) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.settings = settings;
    this.upgrades = upgrades;

    this.initWeapons();
    this.initPlayer();
    this.initObstacles();
  }

  private initWeapons() {
    this.unlockedWeapons = ['pistol'];
    this.activeWeaponId = 'pistol';
    this.weaponStates = {} as Record<WeaponId, WeaponState>;
    (Object.keys(WEAPON_REGISTRY) as WeaponId[]).forEach((wId) => {
      this.weaponStates[wId] = createDefaultWeaponState(WEAPON_REGISTRY[wId]);
    });
  }

  public initPlayer() {
    const shieldLvl = this.getUpgradeLevel('nano_shield');
    const speedLvl = this.getUpgradeLevel('mobility');

    const baseMaxShield = 50 + shieldLvl * 30;
    const baseSpeed = 330 * (1 + speedLvl * 0.1);

    this.player = {
      x: this.arenaWidth / 2,
      y: this.arenaHeight / 2,
      radius: 18,
      speed: baseSpeed,
      angle: 0,
      hp: 100,
      maxHp: 100,
      shield: baseMaxShield,
      maxShield: baseMaxShield,
      shieldRegenTimer: 0,
      dashCooldown: 1.5 * Math.max(0.4, 1 - speedLvl * 0.15),
      dashTimer: 0,
      isDashing: false,
      dashDuration: 0,
      credits: 0,
      score: 0,
      combo: 0,
      comboTimer: 0,
      shotsFired: 0,
      shotsHit: 0,
      kills: 0,
      tacticalCooldown: 12 * Math.max(0.4, 1 - this.getUpgradeLevel('tactical_emp') * 0.15),
      tacticalTimer: 0,
      quadDamageTimer: 0,
      speedBoostTimer: 0,
    };
  }

  public initObstacles() {
    this.obstacles = [];
    const center = { x: this.arenaWidth / 2, y: this.arenaHeight / 2 };

    // Symmetrical tactical pillars & energy barricades
    const offsets = [
      { x: -450, y: -450 },
      { x: 450, y: -450 },
      { x: -450, y: 450 },
      { x: 450, y: 450 },
      { x: 0, y: -650 },
      { x: 0, y: 650 },
      { x: -650, y: 0 },
      { x: 650, y: 0 },
    ];

    offsets.forEach((off) => {
      this.obstacles.push({
        x: center.x + off.x - 35,
        y: center.y + off.y - 35,
        w: 70,
        h: 70,
        type: 'pillar',
      });
    });

    // Barricade walls
    this.obstacles.push(
      { x: center.x - 220, y: center.y - 280, w: 140, h: 26, type: 'crate' },
      { x: center.x + 80, y: center.y - 280, w: 140, h: 26, type: 'crate' },
      { x: center.x - 220, y: center.y + 260, w: 140, h: 26, type: 'crate' },
      { x: center.x + 80, y: center.y + 260, w: 140, h: 26, type: 'crate' }
    );
  }

  public start(mode: GameMode) {
    this.mode = mode;
    this.isRunning = true;
    this.isPaused = false;
    this.matchTimeSec = 0;
    this.currentWave = 1;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.floatingTexts = [];
    this.powerUps = [];
    this.practiceTargets = [];

    this.initPlayer();
    this.initObstacles();

    if (mode === 'SURVIVAL') {
      this.startWave(1);
    } else if (mode === 'BOSS_HUNT') {
      this.unlockAllWeaponsForBoss();
      this.spawnBossTitan();
    } else if (mode === 'TARGET_PRACTICE') {
      this.initTargetPractice();
    }

    soundManager.startBgm();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    soundManager.stopBgm();
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private unlockAllWeaponsForBoss() {
    this.unlockedWeapons = ['pistol', 'assault', 'shotgun', 'railgun', 'rocket', 'flamethrower'];
    this.activeWeaponId = 'assault';
    this.unlockedWeapons.forEach((wId) => {
      const def = WEAPON_REGISTRY[wId];
      this.weaponStates[wId] = {
        currentAmmo: def.magazineSize,
        reserveAmmo: def.magazineSize * 10,
        isReloading: false,
        reloadTimer: 0,
        fireCooldown: 0,
      };
    });
  }

  public getUpgradeLevel(id: string): number {
    const u = this.upgrades.find((x) => x.id === id);
    return u ? u.level : 0;
  }

  public startWave(waveNumber: number) {
    this.currentWave = waveNumber;
    this.isWaveIntermission = false;

    // Check weapon unlocks by wave
    (Object.keys(WEAPON_REGISTRY) as WeaponId[]).forEach((wId) => {
      const def = WEAPON_REGISTRY[wId];
      if (waveNumber >= def.unlockWave && !this.unlockedWeapons.includes(wId)) {
        this.unlockedWeapons.push(wId);
        this.addFloatingText(
          `UNLOCKED: ${def.name}!`,
          this.player.x,
          this.player.y - 45,
          '#38bdf8',
          20
        );
      }
    });

    soundManager.playWaveStart();
    this.addFloatingText(`WAVE ${waveNumber}`, this.player.x, this.player.y - 35, '#f59e0b', 24);

    // Wave 5 or 10 is a Boss Wave!
    if (waveNumber === 5 || waveNumber === 10) {
      this.spawnBossTitan();
      this.waveTotalEnemies = 1 + waveNumber * 3;
      this.waveEnemiesRemaining = this.waveTotalEnemies;
      soundManager.playBossAlert();
    } else {
      const count = 12 + waveNumber * 5;
      this.waveTotalEnemies = count;
      this.waveEnemiesRemaining = count;
      this.spawnWaveEnemies(count);
    }
  }

  private spawnWaveEnemies(count: number) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.isRunning || this.isPaused) return;
        this.spawnSingleEnemy();
      }, i * 350);
    }
  }

  private spawnSingleEnemy() {
    const margin = 200;
    let spawnX = 0;
    let spawnY = 0;

    // Spawn randomly outside player's viewport
    const side = Math.floor(Math.random() * 4);
    if (side === 0) {
      spawnX = Math.random() * this.arenaWidth;
      spawnY = margin;
    } else if (side === 1) {
      spawnX = this.arenaWidth - margin;
      spawnY = Math.random() * this.arenaHeight;
    } else if (side === 2) {
      spawnX = Math.random() * this.arenaWidth;
      spawnY = this.arenaHeight - margin;
    } else {
      spawnX = margin;
      spawnY = Math.random() * this.arenaHeight;
    }

    // Determine type based on wave
    const r = Math.random();
    let type: Enemy['type'] = 'scout';
    let hp = 45 + this.currentWave * 10;
    let speed = 230 + Math.random() * 40;
    let radius = 14;
    let color = '#ef4444'; // Red
    let score = 50;
    let credit = 10;

    if (this.currentWave >= 2 && r > 0.45) {
      type = 'trooper';
      hp = 70 + this.currentWave * 12;
      speed = 175;
      radius = 16;
      color = '#f97316'; // Orange
      score = 80;
      credit = 18;
    }

    if (this.currentWave >= 3 && r > 0.72) {
      type = 'grenadier';
      hp = 90 + this.currentWave * 15;
      speed = 150;
      radius = 17;
      color = '#eab308'; // Amber
      score = 120;
      credit = 25;
    }

    if (this.currentWave >= 4 && r > 0.88) {
      type = 'heavy';
      hp = 260 + this.currentWave * 35;
      speed = 110;
      radius = 24;
      color = '#8b5cf6'; // Purple
      score = 250;
      credit = 50;
    }

    this.enemies.push({
      id: Math.random().toString(36).substring(2, 9),
      type,
      x: spawnX,
      y: spawnY,
      radius,
      hp,
      maxHp: hp,
      speed,
      angle: 0,
      shootCooldown: 2.2 + Math.random() * 1.5,
      shootTimer: Math.random() * 1.5,
      scoreValue: score,
      creditValue: credit,
      color,
    });
  }

  public spawnBossTitan() {
    const bossHp = 1800 + this.currentWave * 450;
    this.enemies.push({
      id: 'omega_titan_boss',
      type: 'boss_titan',
      x: this.arenaWidth / 2,
      y: 350,
      radius: 46,
      hp: bossHp,
      maxHp: bossHp,
      speed: 95,
      angle: Math.PI / 2,
      shootCooldown: 1.2,
      shootTimer: 0,
      scoreValue: 2500,
      creditValue: 500,
      color: '#dc2626',
      isBoss: true,
      bossPhase: 1,
      stateTimer: 0,
    });
    this.addScreenShake(14);
  }

  private initTargetPractice() {
    this.practiceTargets = [];
    for (let i = 0; i < 6; i++) {
      this.spawnPracticeTarget();
    }
  }

  private spawnPracticeTarget() {
    const center = { x: this.arenaWidth / 2, y: this.arenaHeight / 2 };
    const radiusDist = 250 + Math.random() * 450;
    const angle = Math.random() * Math.PI * 2;
    const x = center.x + Math.cos(angle) * radiusDist;
    const y = center.y + Math.sin(angle) * radiusDist;

    const isGolden = Math.random() < 0.22;
    const lifespan = isGolden ? 4.5 : 7.0;

    this.practiceTargets.push({
      id: Math.random().toString(),
      x,
      y,
      radius: isGolden ? 18 : 24,
      hp: 1,
      maxHp: 1,
      score: isGolden ? 300 : 100,
      lifespan,
      maxLifespan: lifespan,
      isMoving: Math.random() < 0.5,
      vx: (Math.random() - 0.5) * 80,
      vy: (Math.random() - 0.5) * 80,
      isGolden,
    });
  }

  // --- CONTROLS HOOKS ---
  public handleKeyDown(code: string) {
    this.keys[code.toLowerCase()] = true;

    // Quick weapon switch 1-6
    if (['digit1', 'digit2', 'digit3', 'digit4', 'digit5', 'digit6'].includes(code.toLowerCase())) {
      const idx = parseInt(code.slice(-1), 10) - 1;
      const allW: WeaponId[] = ['pistol', 'assault', 'shotgun', 'railgun', 'rocket', 'flamethrower'];
      const targetW = allW[idx];
      if (targetW && this.unlockedWeapons.includes(targetW)) {
        this.switchWeapon(targetW);
      }
    }

    // Manual reload
    if (code.toLowerCase() === 'keyr') {
      this.triggerReload();
    }

    // Tactical Dash (Space)
    if (code.toLowerCase() === 'space') {
      this.triggerDash();
    }

    // Tactical EMP (KeyE or KeyQ)
    if (code.toLowerCase() === 'keye' || code.toLowerCase() === 'keyq') {
      this.triggerTacticalEMP();
    }
  }

  public handleKeyUp(code: string) {
    this.keys[code.toLowerCase()] = false;
  }

  public switchWeapon(weaponId: WeaponId) {
    if (!this.unlockedWeapons.includes(weaponId)) return;
    this.activeWeaponId = weaponId;
    soundManager.playReload();
    this.addFloatingText(WEAPON_REGISTRY[weaponId].name, this.player.x, this.player.y - 30, '#38bdf8', 14);
  }

  public nextWeapon() {
    const curIdx = this.unlockedWeapons.indexOf(this.activeWeaponId);
    const nextIdx = (curIdx + 1) % this.unlockedWeapons.length;
    this.switchWeapon(this.unlockedWeapons[nextIdx]);
  }

  public prevWeapon() {
    const curIdx = this.unlockedWeapons.indexOf(this.activeWeaponId);
    const prevIdx = (curIdx - 1 + this.unlockedWeapons.length) % this.unlockedWeapons.length;
    this.switchWeapon(this.unlockedWeapons[prevIdx]);
  }

  public triggerReload() {
    const state = this.weaponStates[this.activeWeaponId];
    const def = WEAPON_REGISTRY[this.activeWeaponId];
    if (state.isReloading || state.currentAmmo >= def.magazineSize) return;

    // Apply reload speed upgrade
    const reloadUpgradeLvl = this.getUpgradeLevel('reload_speed');
    const actualReloadTime = def.reloadTime * Math.max(0.4, 1 - reloadUpgradeLvl * 0.2);

    state.isReloading = true;
    state.reloadTimer = actualReloadTime;
    soundManager.playReload();
  }

  public triggerDash() {
    if (this.player.dashTimer > 0 || this.player.isDashing) return;

    this.player.isDashing = true;
    this.player.dashDuration = 0.22;
    this.player.dashTimer = this.player.dashCooldown;
    soundManager.playDash();

    // Dash trail particles
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 16,
        y: this.player.y + (Math.random() - 0.5) * 16,
        vx: -Math.cos(this.player.angle) * (100 + Math.random() * 100),
        vy: -Math.sin(this.player.angle) * (100 + Math.random() * 100),
        radius: 4 + Math.random() * 3,
        color: '#38bdf8',
        alpha: 0.8,
        decay: 3.5,
      });
    }
  }

  public triggerTacticalEMP() {
    if (this.player.tacticalTimer > 0) return;

    this.player.tacticalTimer = this.player.tacticalCooldown;
    soundManager.playTacticalEMP();
    this.addScreenShake(12);

    const empRadius = 380 + this.getUpgradeLevel('tactical_emp') * 80;

    // Destroy all enemy bullets
    this.bullets = this.bullets.filter((b) => b.isPlayer);

    // Stun and damage nearby enemies
    this.enemies.forEach((enemy) => {
      const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (dist <= empRadius) {
        enemy.hp -= 120;
        enemy.shootTimer = 2.5; // Stun shooting
        this.addFloatingText('EMP STUN -120', enemy.x, enemy.y - 20, '#38bdf8', 16, true);

        // Push back
        const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
        enemy.x += Math.cos(angle) * 80;
        enemy.y += Math.sin(angle) * 80;
      }
    });

    // Expanding EMP wave particle
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(a) * (empRadius * 2.5),
        vy: Math.sin(a) * (empRadius * 2.5),
        radius: 4,
        color: '#60a5fa',
        alpha: 1,
        decay: 2.2,
      });
    }
  }

  public addScreenShake(amount: number) {
    if (!this.settings.screenShake) return;
    this.shakeIntensity = Math.min(25, this.shakeIntensity + amount);
  }

  public addFloatingText(
    text: string,
    x: number,
    y: number,
    color = '#ffffff',
    size = 14,
    isCrit = false
  ) {
    if (!this.settings.showDamageNumbers && !isCrit) return;
    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x: x + (Math.random() - 0.5) * 12,
      y,
      color,
      size,
      alpha: 1,
      vy: -60 - Math.random() * 30,
      isCrit,
    });
  }

  // --- GAME LOOP ---
  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.matchTimeSec += dt;

    // Update screen shake
    if (this.shakeIntensity > 0.1) {
      this.shakeIntensity *= Math.pow(this.shakeDecay, dt * 60);
    } else {
      this.shakeIntensity = 0;
    }

    // Camera follow player with slight mouse offset
    const targetCamX = this.player.x - this.canvas.width / 2 + (this.mouseScreenX - this.canvas.width / 2) * 0.2;
    const targetCamY = this.player.y - this.canvas.height / 2 + (this.mouseScreenY - this.canvas.height / 2) * 0.2;
    this.cameraX += (targetCamX - this.cameraX) * 0.12;
    this.cameraY += (targetCamY - this.cameraY) * 0.12;

    // Update player aim angle
    this.mouseWorldX = this.cameraX + this.mouseScreenX;
    this.mouseWorldY = this.cameraY + this.mouseScreenY;
    this.player.angle = Math.atan2(this.mouseWorldY - this.player.y, this.mouseWorldX - this.player.x);

    this.updatePlayer(dt);
    this.updateWeapons(dt);
    this.updateBullets(dt);
    this.updateEnemies(dt);
    this.updatePracticeTargets(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updatePowerUps(dt);

    // Wave status check
    if (this.mode === 'SURVIVAL' && !this.isWaveIntermission) {
      if (this.enemies.length === 0 && this.waveEnemiesRemaining <= 0) {
        this.isWaveIntermission = true;
        this.intermissionTimer = 2.5;
        soundManager.playPowerUp();
        if (this.onWaveComplete) {
          this.onWaveComplete(this.currentWave);
        }
      }
    }

    // Intermission countdown
    if (this.isWaveIntermission) {
      this.intermissionTimer -= dt;
      if (this.intermissionTimer <= 0) {
        this.startWave(this.currentWave + 1);
      }
    }

    if (this.onPlayerStateUpdate) {
      this.onPlayerStateUpdate();
    }
  }

  private updatePlayer(dt: number) {
    // Cooldown timers
    if (this.player.dashTimer > 0) this.player.dashTimer = Math.max(0, this.player.dashTimer - dt);
    if (this.player.tacticalTimer > 0)
      this.player.tacticalTimer = Math.max(0, this.player.tacticalTimer - dt);
    if (this.player.quadDamageTimer > 0)
      this.player.quadDamageTimer = Math.max(0, this.player.quadDamageTimer - dt);
    if (this.player.speedBoostTimer > 0)
      this.player.speedBoostTimer = Math.max(0, this.player.speedBoostTimer - dt);

    // Combo timer
    if (this.player.combo > 0) {
      this.player.comboTimer -= dt;
      if (this.player.comboTimer <= 0) {
        this.player.combo = 0;
      }
    }

    // Shield passive regeneration
    this.player.shieldRegenTimer += dt;
    if (this.player.shieldRegenTimer >= 3.5 && this.player.shield < this.player.maxShield) {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + 25 * dt);
    }

    // Movement calculation
    let moveX = 0;
    let moveY = 0;

    if (this.keys['keyw'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['keys'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['keya'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['keyd'] || this.keys['arrowright']) moveX += 1;

    // Virtual analog input (touch devices)
    if (Math.abs(this.virtualMoveX) > 0.05 || Math.abs(this.virtualMoveY) > 0.05) {
      moveX = this.virtualMoveX;
      moveY = this.virtualMoveY;
    }

    const mag = Math.hypot(moveX, moveY);
    if (mag > 0) {
      moveX /= mag;
      moveY /= mag;
    }

    // Speed multiplier from upgrades + speed surge
    let currentSpeed = this.player.speed;
    if (this.player.speedBoostTimer > 0) currentSpeed *= 1.45;

    // Dash burst movement
    if (this.player.isDashing) {
      this.player.dashDuration -= dt;
      currentSpeed *= 3.2;

      // Spawn ghost shadow
      if (Math.random() < 0.6) {
        this.particles.push({
          x: this.player.x,
          y: this.player.y,
          vx: 0,
          vy: 0,
          radius: this.player.radius,
          color: '#38bdf8',
          alpha: 0.5,
          decay: 4.0,
        });
      }

      if (this.player.dashDuration <= 0) {
        this.player.isDashing = false;
      }
    }

    const nextX = this.player.x + moveX * currentSpeed * dt;
    const nextY = this.player.y + moveY * currentSpeed * dt;

    // Collision with arena borders
    const margin = this.player.radius + 15;
    const clampedX = Math.max(margin, Math.min(this.arenaWidth - margin, nextX));
    const clampedY = Math.max(margin, Math.min(this.arenaHeight - margin, nextY));

    // Collision with obstacles
    let collides = false;
    for (const obs of this.obstacles) {
      if (
        clampedX + this.player.radius > obs.x &&
        clampedX - this.player.radius < obs.x + obs.w &&
        clampedY + this.player.radius > obs.y &&
        clampedY - this.player.radius < obs.y + obs.h
      ) {
        collides = true;
        break;
      }
    }

    if (!collides) {
      this.player.x = clampedX;
      this.player.y = clampedY;
    }
  }

  private updateWeapons(dt: number) {
    const def = WEAPON_REGISTRY[this.activeWeaponId];
    const state = this.weaponStates[this.activeWeaponId];

    if (!state) return;

    if (state.fireCooldown > 0) {
      state.fireCooldown = Math.max(0, state.fireCooldown - dt);
    }

    // Reloading process
    if (state.isReloading) {
      state.reloadTimer -= dt;
      if (state.reloadTimer <= 0) {
        // Complete reload
        const magUpgradeLvl = this.getUpgradeLevel('magazine_size');
        const effectiveMag = Math.floor(def.magazineSize * (1 + magUpgradeLvl * 0.25));
        state.currentAmmo = effectiveMag;
        state.isReloading = false;
      }
    }

    // Auto reload when empty
    if (state.currentAmmo <= 0 && !state.isReloading && this.settings.autoReload) {
      this.triggerReload();
    }

    // Firing logic
    if (this.isMouseDown && !state.isReloading && state.fireCooldown <= 0) {
      if (state.currentAmmo > 0) {
        this.fireWeapon(def, state);
      } else {
        this.triggerReload();
      }
    }
  }

  private fireWeapon(def: typeof WEAPON_REGISTRY[WeaponId], state: WeaponState) {
    state.currentAmmo--;
    this.player.shotsFired += def.pelletCount;

    // Fire rate upgrade
    const fireRateUpgrade = this.getUpgradeLevel('fire_rate');
    const effectiveFireRate = def.fireRate * (1 + fireRateUpgrade * 0.15);
    state.fireCooldown = 1 / effectiveFireRate;

    // Sound
    soundManager.playShoot(def.id);

    // Screen recoil
    this.addScreenShake(def.id === 'rocket' ? 8 : def.id === 'shotgun' ? 5 : 1.5);

    // Eject brass casing
    this.particles.push({
      x: this.player.x - Math.cos(this.player.angle) * 8,
      y: this.player.y - Math.sin(this.player.angle) * 8,
      vx: -Math.cos(this.player.angle + Math.PI / 2) * (80 + Math.random() * 40),
      vy: -Math.sin(this.player.angle + Math.PI / 2) * (80 + Math.random() * 40),
      radius: 2.2,
      color: '#eab308',
      alpha: 1,
      decay: 1.5,
      shape: 'shell',
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 15,
    });

    // Muzzle flash particle
    const muzzleX = this.player.x + Math.cos(this.player.angle) * (this.player.radius + 12);
    const muzzleY = this.player.y + Math.sin(this.player.angle) * (this.player.radius + 12);
    this.particles.push({
      x: muzzleX,
      y: muzzleY,
      vx: Math.cos(this.player.angle) * 30,
      vy: Math.sin(this.player.angle) * 30,
      radius: def.id === 'flamethrower' ? 14 : 7,
      color: def.bulletColor,
      alpha: 0.9,
      decay: 8.0,
    });

    // Damage bonus calculation
    const damageUpgrade = this.getUpgradeLevel('bullet_damage');
    let effectiveDamage = def.damage * (1 + damageUpgrade * 0.15);
    if (this.player.quadDamageTimer > 0) {
      effectiveDamage *= 4;
    }

    // Spawn pellets
    for (let i = 0; i < def.pelletCount; i++) {
      const spreadAngle = (Math.random() - 0.5) * def.spread;
      const angle = this.player.angle + spreadAngle;
      const speed = def.bulletSpeed * (0.95 + Math.random() * 0.1);

      this.bullets.push({
        id: Math.random().toString(),
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: def.bulletRadius,
        damage: effectiveDamage,
        rangeLeft: 1200,
        color: def.bulletColor,
        isPlayer: true,
        piercing: def.piercing,
        splashRadius: def.splashRadius,
        trail: [],
      });
    }
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const distTraveled = Math.hypot(b.vx * dt, b.vy * dt);
      b.rangeLeft -= distTraveled;

      // Add to trail
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 5) b.trail.shift();

      // Check arena boundaries
      if (b.x < 0 || b.x > this.arenaWidth || b.y < 0 || b.y > this.arenaHeight || b.rangeLeft <= 0) {
        if (b.splashRadius > 0) {
          this.triggerExplosion(b.x, b.y, b.splashRadius, b.damage);
        }
        this.bullets.splice(i, 1);
        continue;
      }

      // Check obstacle collisions
      let hitObstacle = false;
      for (const obs of this.obstacles) {
        if (b.x >= obs.x && b.x <= obs.x + obs.w && b.y >= obs.y && b.y <= obs.y + obs.h) {
          hitObstacle = true;
          // Spawn wall spark
          for (let s = 0; s < 4; s++) {
            this.particles.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 120,
              vy: (Math.random() - 0.5) * 120,
              radius: 2,
              color: b.color,
              alpha: 0.9,
              decay: 4,
            });
          }
          break;
        }
      }

      if (hitObstacle) {
        if (b.splashRadius > 0) {
          this.triggerExplosion(b.x, b.y, b.splashRadius, b.damage);
        }
        this.bullets.splice(i, 1);
        continue;
      }

      // Bullet hit Player (if enemy bullet)
      if (!b.isPlayer) {
        const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
        if (dist <= this.player.radius + b.radius && !this.player.isDashing) {
          this.damagePlayer(b.damage);
          this.bullets.splice(i, 1);
          continue;
        }
      }

      // Bullet hit Enemies (if player bullet)
      if (b.isPlayer) {
        let hitTarget = false;
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
          if (dist <= enemy.radius + b.radius) {
            this.player.shotsHit++;
            hitTarget = true;

            const isCrit = Math.random() < 0.2 || b.damage > 100;
            const finalDmg = isCrit ? Math.floor(b.damage * 1.5) : Math.floor(b.damage);
            enemy.hp -= finalDmg;

            // Combat feedback
            soundManager.playHit(isCrit);
            this.addFloatingText(
              isCrit ? `CRIT ${finalDmg}!` : `${finalDmg}`,
              enemy.x,
              enemy.y - 15,
              isCrit ? '#f59e0b' : '#ffffff',
              isCrit ? 18 : 13,
              isCrit
            );

            // Blood / spark particles
            for (let p = 0; p < 5; p++) {
              this.particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 160 + b.vx * 0.1,
                vy: (Math.random() - 0.5) * 160 + b.vy * 0.1,
                radius: 2.5,
                color: enemy.color,
                alpha: 0.9,
                decay: 3.5,
              });
            }

            // Knockback
            const kbAngle = Math.atan2(b.vy, b.vx);
            enemy.x += Math.cos(kbAngle) * 8;
            enemy.y += Math.sin(kbAngle) * 8;

            // Check enemy death
            if (enemy.hp <= 0) {
              this.handleEnemyDefeated(enemy);
              this.enemies.splice(j, 1);
            }

            if (b.splashRadius > 0) {
              this.triggerExplosion(b.x, b.y, b.splashRadius, b.damage);
            }

            if (!b.piercing) {
              this.bullets.splice(i, 1);
              break;
            }
          }
        }
      }
    }
  }

  private triggerExplosion(x: number, y: number, radius: number, damage: number) {
    soundManager.playExplosion(radius > 100);
    this.addScreenShake(radius > 100 ? 12 : 6);

    // Shockwave particle
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * (radius * 3),
        vy: Math.sin(a) * (radius * 3),
        radius: 4,
        color: '#fb923c',
        alpha: 1,
        decay: 2.8,
      });
    }

    // Damage enemies in radius
    for (let j = this.enemies.length - 1; j >= 0; j--) {
      const enemy = this.enemies[j];
      const dist = Math.hypot(enemy.x - x, enemy.y - y);
      if (dist <= radius + enemy.radius) {
        const falloff = 1 - dist / (radius + enemy.radius);
        const dmg = Math.floor(damage * falloff);
        enemy.hp -= dmg;
        this.addFloatingText(`${dmg}`, enemy.x, enemy.y - 15, '#fb923c', 16, true);

        if (enemy.hp <= 0) {
          this.handleEnemyDefeated(enemy);
          this.enemies.splice(j, 1);
        }
      }
    }
  }

  private handleEnemyDefeated(enemy: Enemy) {
    this.player.kills++;
    this.player.score += enemy.scoreValue * (1 + this.player.combo * 0.1);
    this.player.credits += enemy.creditValue;
    this.player.combo++;
    this.player.comboTimer = 3.5;

    this.addFloatingText(`+${enemy.creditValue}⚡`, enemy.x, enemy.y - 25, '#38bdf8', 14);

    if (this.mode === 'SURVIVAL') {
      this.waveEnemiesRemaining--;
    }

    // Boss defeat check
    if (enemy.isBoss) {
      soundManager.playExplosion(true);
      this.addScreenShake(20);
      this.addFloatingText('TITAN DESTROYED!', enemy.x, enemy.y - 60, '#22c55e', 28, true);

      // Drop massive powerups
      this.spawnPowerUp(enemy.x, enemy.y, 'quad_damage');
      this.spawnPowerUp(enemy.x + 40, enemy.y, 'health');
      this.spawnPowerUp(enemy.x - 40, enemy.y, 'nuke');

      if (this.mode === 'BOSS_HUNT' && this.onVictory) {
        const accuracy =
          this.player.shotsFired > 0
            ? Math.round((this.player.shotsHit / this.player.shotsFired) * 100)
            : 0;
        this.onVictory({
          score: this.player.score,
          wave: this.currentWave,
          kills: this.player.kills,
          accuracy,
          damageDealt: this.player.score * 12,
          timeSurvivedSec: Math.floor(this.matchTimeSec),
          highestCombo: this.player.combo,
          bossesDefeated: 1,
        });
      }
    }

    // Random power-up drop
    if (Math.random() < 0.12 && !enemy.isBoss) {
      const types: PowerUp['type'][] = ['health', 'shield', 'quad_damage', 'speed_boost'];
      const pType = types[Math.floor(Math.random() * types.length)];
      this.spawnPowerUp(enemy.x, enemy.y, pType);
    }
  }

  private damagePlayer(amount: number) {
    if (this.player.isDashing) return;

    this.player.shieldRegenTimer = 0;
    this.addScreenShake(6);
    soundManager.playPlayerHurt();

    // Absorb through shield first
    if (this.player.shield > 0) {
      const remainingShield = this.player.shield - amount;
      if (remainingShield >= 0) {
        this.player.shield = remainingShield;
        this.addFloatingText(`-${Math.floor(amount)}`, this.player.x, this.player.y - 25, '#38bdf8', 14);
        return;
      } else {
        this.player.shield = 0;
        amount = Math.abs(remainingShield);
      }
    }

    this.player.hp -= amount;
    this.addFloatingText(`-${Math.floor(amount)} HP`, this.player.x, this.player.y - 25, '#ef4444', 16, true);

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.handleGameOver();
    }
  }

  private handleGameOver() {
    this.stop();
    soundManager.playExplosion(true);
    if (this.onGameOver) {
      const accuracy =
        this.player.shotsFired > 0
          ? Math.round((this.player.shotsHit / this.player.shotsFired) * 100)
          : 0;
      this.onGameOver({
        score: this.player.score,
        wave: this.currentWave,
        kills: this.player.kills,
        accuracy,
        damageDealt: this.player.score * 10,
        timeSurvivedSec: Math.floor(this.matchTimeSec),
        highestCombo: this.player.combo,
        bossesDefeated: this.currentWave >= 5 ? 1 : 0,
      });
    }
  }

  private updateEnemies(dt: number) {
    for (const enemy of this.enemies) {
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      enemy.angle = Math.atan2(dy, dx);

      // Boss AI Behavior
      if (enemy.isBoss) {
        this.updateBossTitan(enemy, dt, dx, dy, dist);
        continue;
      }

      // Normal Enemy Movement & Shooting
      if (enemy.type === 'scout') {
        // Direct rush
        enemy.x += Math.cos(enemy.angle) * enemy.speed * dt;
        enemy.y += Math.sin(enemy.angle) * enemy.speed * dt;
        if (dist <= enemy.radius + this.player.radius) {
          this.damagePlayer(18 * dt);
        }
      } else if (enemy.type === 'trooper') {
        // Keep mid-distance and shoot
        if (dist > 300) {
          enemy.x += Math.cos(enemy.angle) * enemy.speed * dt;
          enemy.y += Math.sin(enemy.angle) * enemy.speed * dt;
        } else if (dist < 180) {
          enemy.x -= Math.cos(enemy.angle) * enemy.speed * dt;
          enemy.y -= Math.sin(enemy.angle) * enemy.speed * dt;
        }

        enemy.shootTimer += dt;
        if (enemy.shootTimer >= enemy.shootCooldown) {
          enemy.shootTimer = 0;
          this.bullets.push({
            id: Math.random().toString(),
            x: enemy.x + Math.cos(enemy.angle) * enemy.radius,
            y: enemy.y + Math.sin(enemy.angle) * enemy.radius,
            vx: Math.cos(enemy.angle) * 380,
            vy: Math.sin(enemy.angle) * 380,
            radius: 4,
            damage: 16,
            rangeLeft: 700,
            color: '#ef4444',
            isPlayer: false,
            piercing: false,
            splashRadius: 0,
            trail: [],
          });
        }
      } else if (enemy.type === 'grenadier') {
        // Lobs mortar cluster
        if (dist > 380) {
          enemy.x += Math.cos(enemy.angle) * enemy.speed * dt;
          enemy.y += Math.sin(enemy.angle) * enemy.speed * dt;
        }
        enemy.shootTimer += dt;
        if (enemy.shootTimer >= enemy.shootCooldown * 1.5) {
          enemy.shootTimer = 0;
          this.bullets.push({
            id: Math.random().toString(),
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(enemy.angle) * 280,
            vy: Math.sin(enemy.angle) * 280,
            radius: 6,
            damage: 28,
            rangeLeft: dist + 30,
            color: '#f59e0b',
            isPlayer: false,
            piercing: false,
            splashRadius: 75,
            trail: [],
          });
        }
      } else if (enemy.type === 'heavy') {
        // Slow march + double blast
        enemy.x += Math.cos(enemy.angle) * enemy.speed * dt;
        enemy.y += Math.sin(enemy.angle) * enemy.speed * dt;

        enemy.shootTimer += dt;
        if (enemy.shootTimer >= 1.6) {
          enemy.shootTimer = 0;
          for (const spread of [-0.15, 0.15]) {
            this.bullets.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(enemy.angle + spread) * 360,
              vy: Math.sin(enemy.angle + spread) * 360,
              radius: 5,
              damage: 22,
              rangeLeft: 800,
              color: '#a855f7',
              isPlayer: false,
              piercing: false,
              splashRadius: 0,
              trail: [],
            });
          }
        }
      }
    }
  }

  private updateBossTitan(boss: Enemy, dt: number, dx: number, dy: number, dist: number) {
    boss.stateTimer = (boss.stateTimer || 0) + dt;

    // Phase transition based on HP
    const hpRatio = boss.hp / boss.maxHp;
    if (hpRatio < 0.35) {
      boss.bossPhase = 3; // Enraged
      boss.speed = 135;
    } else if (hpRatio < 0.7) {
      boss.bossPhase = 2; // Bullet hell laser sweep
      boss.speed = 105;
    } else {
      boss.bossPhase = 1; // Heavy bombardment
      boss.speed = 85;
    }

    // Move toward player
    if (dist > 180) {
      boss.x += Math.cos(boss.angle) * boss.speed * dt;
      boss.y += Math.sin(boss.angle) * boss.speed * dt;
    }

    boss.shootTimer += dt;

    // Phase 1 Attacks: Gatling Bursts
    if (boss.bossPhase === 1 && boss.shootTimer >= 0.28) {
      boss.shootTimer = 0;
      const spread = (Math.random() - 0.5) * 0.25;
      this.bullets.push({
        id: Math.random().toString(),
        x: boss.x + Math.cos(boss.angle) * boss.radius,
        y: boss.y + Math.sin(boss.angle) * boss.radius,
        vx: Math.cos(boss.angle + spread) * 440,
        vy: Math.sin(boss.angle + spread) * 440,
        radius: 5,
        damage: 18,
        rangeLeft: 900,
        color: '#ef4444',
        isPlayer: false,
        piercing: false,
        splashRadius: 0,
        trail: [],
      });
    }

    // Phase 2 Attacks: Quad Sweeping Laser Barrage
    if (boss.bossPhase === 2 && boss.shootTimer >= 0.45) {
      boss.shootTimer = 0;
      const baseOffset = boss.stateTimer * 2.2;
      for (let arm = 0; arm < 4; arm++) {
        const armAngle = baseOffset + (arm * Math.PI) / 2;
        this.bullets.push({
          id: Math.random().toString(),
          x: boss.x,
          y: boss.y,
          vx: Math.cos(armAngle) * 320,
          vy: Math.sin(armAngle) * 320,
          radius: 6,
          damage: 24,
          rangeLeft: 850,
          color: '#ec4899',
          isPlayer: false,
          piercing: false,
          splashRadius: 0,
          trail: [],
        });
      }
    }

    // Phase 3 Attacks: Enraged Ring Shockwaves
    if (boss.bossPhase === 3 && boss.shootTimer >= 1.6) {
      boss.shootTimer = 0;
      this.addScreenShake(10);
      soundManager.playExplosion(true);
      const ringBullets = 18;
      for (let i = 0; i < ringBullets; i++) {
        const ringAngle = (i / ringBullets) * Math.PI * 2;
        this.bullets.push({
          id: Math.random().toString(),
          x: boss.x,
          y: boss.y,
          vx: Math.cos(ringAngle) * 260,
          vy: Math.sin(ringAngle) * 260,
          radius: 7,
          damage: 28,
          rangeLeft: 800,
          color: '#f97316',
          isPlayer: false,
          piercing: false,
          splashRadius: 40,
          trail: [],
        });
      }
    }
  }

  private updatePracticeTargets(dt: number) {
    if (this.mode !== 'TARGET_PRACTICE') return;

    for (let i = this.practiceTargets.length - 1; i >= 0; i--) {
      const target = this.practiceTargets[i];
      target.lifespan -= dt;

      if (target.isMoving) {
        target.x += target.vx * dt;
        target.y += target.vy * dt;
        // Bounce on boundary
        if (target.x < 300 || target.x > this.arenaWidth - 300) target.vx *= -1;
        if (target.y < 300 || target.y > this.arenaHeight - 300) target.vy *= -1;
      }

      // Check hit by player bullets
      for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
        const b = this.bullets[bIdx];
        if (!b.isPlayer) continue;

        const dist = Math.hypot(b.x - target.x, b.y - target.y);
        if (dist <= target.radius + b.radius) {
          this.player.shotsHit++;
          this.player.score += target.score * (1 + this.player.combo * 0.15);
          this.player.combo++;
          this.player.comboTimer = 4.0;
          soundManager.playHit(target.isGolden);

          this.addFloatingText(
            target.isGolden ? `PERFECT +${target.score}!` : `HIT +${target.score}`,
            target.x,
            target.y - 20,
            target.isGolden ? '#f59e0b' : '#38bdf8',
            target.isGolden ? 18 : 14,
            target.isGolden
          );

          // Disintegration particles
          for (let p = 0; p < 8; p++) {
            this.particles.push({
              x: target.x,
              y: target.y,
              vx: (Math.random() - 0.5) * 180,
              vy: (Math.random() - 0.5) * 180,
              radius: 3,
              color: target.isGolden ? '#f59e0b' : '#38bdf8',
              alpha: 1,
              decay: 4.5,
            });
          }

          this.bullets.splice(bIdx, 1);
          this.practiceTargets.splice(i, 1);
          this.spawnPracticeTarget();
          break;
        }
      }

      // Expired target
      if (target.lifespan <= 0) {
        this.practiceTargets.splice(i, 1);
        this.spawnPracticeTarget();
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;

      if (p.shape === 'shell' && p.rotation !== undefined && p.vRot !== undefined) {
        p.rotation += p.vRot * dt;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= 1.2 * dt;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private spawnPowerUp(x: number, y: number, type: PowerUp['type']) {
    this.powerUps.push({
      id: Math.random().toString(),
      type,
      x,
      y,
      radius: 16,
      bobTimer: 0,
    });
  }

  private updatePowerUps(dt: number) {
    const magnetLvl = this.getUpgradeLevel('credit_magnet');
    const magnetRange = 120 + magnetLvl * 90;

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.bobTimer += dt * 3;

      const dist = Math.hypot(pu.x - this.player.x, pu.y - this.player.y);

      // Magnet pull toward player
      if (dist < magnetRange) {
        const angle = Math.atan2(this.player.y - pu.y, this.player.x - pu.x);
        pu.x += Math.cos(angle) * 320 * dt;
        pu.y += Math.sin(angle) * 320 * dt;
      }

      // Pickup collision
      if (dist <= pu.radius + this.player.radius) {
        soundManager.playPowerUp();
        if (pu.type === 'health') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
          this.addFloatingText('+50 HP', this.player.x, this.player.y - 25, '#22c55e', 16, true);
        } else if (pu.type === 'shield') {
          this.player.shield = this.player.maxShield;
          this.addFloatingText('SHIELD OVERCHARGE', this.player.x, this.player.y - 25, '#38bdf8', 16, true);
        } else if (pu.type === 'quad_damage') {
          this.player.quadDamageTimer = 10;
          this.addFloatingText('QUAD DAMAGE 4X!', this.player.x, this.player.y - 25, '#ef4444', 18, true);
        } else if (pu.type === 'speed_boost') {
          this.player.speedBoostTimer = 10;
          this.addFloatingText('SPEED SURGE!', this.player.x, this.player.y - 25, '#eab308', 18, true);
        } else if (pu.type === 'nuke') {
          this.triggerTacticalEMP();
          this.addFloatingText('ORBITAL NUKE!', this.player.x, this.player.y - 35, '#f97316', 22, true);
        }

        this.powerUps.splice(i, 1);
      }
    }
  }

  // --- RENDERING ---
  public render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();

    // Apply screen shake
    if (this.shakeIntensity > 0) {
      const rx = (Math.random() - 0.5) * this.shakeIntensity;
      const ry = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(rx, ry);
    }

    // World camera transformation
    this.ctx.translate(-this.cameraX, -this.cameraY);

    this.renderGridAndArena();
    this.renderObstacles();
    this.renderPowerUps();
    this.renderPracticeTargets();
    this.renderBullets();
    this.renderParticles();
    this.renderEnemies();
    this.renderPlayer();
    this.renderFloatingTexts();

    this.ctx.restore();

    this.renderCrosshair();
  }

  private renderGridAndArena() {
    // Arena dark base
    this.ctx.fillStyle = '#090d16';
    this.ctx.fillRect(0, 0, this.arenaWidth, this.arenaHeight);

    // Grid tiles
    const tileSize = 80;
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#1e293b';

    const startX = Math.max(0, Math.floor(this.cameraX / tileSize) * tileSize);
    const endX = Math.min(this.arenaWidth, this.cameraX + this.canvas.width + tileSize);
    const startY = Math.max(0, Math.floor(this.cameraY / tileSize) * tileSize);
    const endY = Math.min(this.arenaHeight, this.cameraY + this.canvas.height + tileSize);

    this.ctx.beginPath();
    for (let x = startX; x <= endX; x += tileSize) {
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += tileSize) {
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
    }
    this.ctx.stroke();

    // Perimeter laser border
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.strokeRect(10, 10, this.arenaWidth - 20, this.arenaHeight - 20);

    // Hazard corners
    this.ctx.strokeStyle = '#eab308';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(30, 30, this.arenaWidth - 60, this.arenaHeight - 60);
  }

  private renderObstacles() {
    this.obstacles.forEach((obs) => {
      this.ctx.fillStyle = '#1e293b';
      this.ctx.strokeStyle = '#334155';
      this.ctx.lineWidth = 2;
      this.ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      this.ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

      // Inner tactical neon accent
      this.ctx.strokeStyle = '#0284c7';
      this.ctx.strokeRect(obs.x + 6, obs.y + 6, obs.w - 12, obs.h - 12);
    });
  }

  private renderPowerUps() {
    this.powerUps.forEach((pu) => {
      const bobY = Math.sin(pu.bobTimer) * 4;
      this.ctx.save();
      this.ctx.translate(pu.x, pu.y + bobY);

      let color = '#22c55e';
      let icon = '+';
      if (pu.type === 'shield') {
        color = '#38bdf8';
        icon = '🛡';
      } else if (pu.type === 'quad_damage') {
        color = '#ef4444';
        icon = '⚡';
      } else if (pu.type === 'speed_boost') {
        color = '#eab308';
        icon = '💨';
      } else if (pu.type === 'nuke') {
        color = '#f97316';
        icon = '☢';
      }

      // Pulsing outer aura
      this.ctx.beginPath();
      this.ctx.arc(0, 0, pu.radius + 6, 0, Math.PI * 2);
      this.ctx.fillStyle = `${color}25`;
      this.ctx.fill();

      // Core orb
      this.ctx.beginPath();
      this.ctx.arc(0, 0, pu.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.stroke();

      // Icon text
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(icon, 0, 1);

      this.ctx.restore();
    });
  }

  private renderPracticeTargets() {
    this.practiceTargets.forEach((t) => {
      this.ctx.save();
      this.ctx.translate(t.x, t.y);

      // Outer rings
      const color = t.isGolden ? '#f59e0b' : '#38bdf8';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `${color}30`;
      this.ctx.fill();
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = color;
      this.ctx.stroke();

      // Bullseye
      this.ctx.beginPath();
      this.ctx.arc(0, 0, t.radius * 0.45, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();

      // Lifespan timer ring
      const ratio = t.lifespan / t.maxLifespan;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, t.radius + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.restore();
    });
  }

  private renderBullets() {
    this.bullets.forEach((b) => {
      this.ctx.save();

      // Render bullet trails
      if (b.trail.length > 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let i = 1; i < b.trail.length; i++) {
          this.ctx.lineTo(b.trail[i].x, b.trail[i].y);
        }
        this.ctx.strokeStyle = b.color;
        this.ctx.lineWidth = b.radius * 0.8;
        this.ctx.stroke();
      }

      // Bullet core
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = b.color;
      this.ctx.shadowColor = b.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fill();

      this.ctx.restore();
    });
  }

  private renderParticles() {
    this.particles.forEach((p) => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.shape === 'shell') {
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation || 0);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-3, -1.5, 6, 3);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  }

  private renderEnemies() {
    this.enemies.forEach((enemy) => {
      this.ctx.save();
      this.ctx.translate(enemy.x, enemy.y);
      this.ctx.rotate(enemy.angle);

      if (enemy.isBoss) {
        // Colossal Titan Boss Rendering
        this.ctx.beginPath();
        this.ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#1e1b4b';
        this.ctx.fill();
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = enemy.color;
        this.ctx.stroke();

        // Twin shoulder missile pods
        this.ctx.fillStyle = '#374151';
        this.ctx.fillRect(-enemy.radius, -enemy.radius - 8, 20, 16);
        this.ctx.fillRect(-enemy.radius, enemy.radius - 8, 20, 16);

        // Core menacing sensor eye
        this.ctx.beginPath();
        this.ctx.arc(10, 0, 12, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ef4444';
        this.ctx.shadowColor = '#ef4444';
        this.ctx.shadowBlur = 14;
        this.ctx.fill();
      } else {
        // Normal unit
        this.ctx.beginPath();
        this.ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fill();
        this.ctx.lineWidth = 2.5;
        this.ctx.strokeStyle = enemy.color;
        this.ctx.stroke();

        // Front weapon barrel
        this.ctx.fillStyle = enemy.color;
        this.ctx.fillRect(0, -3, enemy.radius + 6, 6);
      }

      this.ctx.restore();

      // Enemy Health Bar Above Head
      const barW = enemy.radius * 2 + 10;
      const barH = 4;
      const barX = enemy.x - barW / 2;
      const barY = enemy.y - enemy.radius - 12;

      this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
      this.ctx.fillRect(barX, barY, barW, barH);

      const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
      this.ctx.fillStyle = enemy.isBoss ? '#dc2626' : '#22c55e';
      this.ctx.fillRect(barX, barY, barW * hpRatio, barH);
    });
  }

  private renderPlayer() {
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);

    // Quad Damage crimson aura
    if (this.player.quadDamageTimer > 0) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius + 12, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      this.ctx.fill();
    }

    // Shield energy dome
    if (this.player.shield > 0) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius + 7, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    this.ctx.rotate(this.player.angle);

    // Tactical Soldier Body
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fill();
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.stroke();

    // Glowing visor
    this.ctx.beginPath();
    this.ctx.arc(6, 0, 6, -Math.PI / 2, Math.PI / 2);
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = 8;
    this.ctx.fill();

    // Weapon barrel extending forward
    const def = WEAPON_REGISTRY[this.activeWeaponId];
    this.ctx.fillStyle = '#64748b';
    this.ctx.fillRect(8, -3.5, 18, 7);
    this.ctx.fillStyle = def.bulletColor;
    this.ctx.fillRect(22, -2, 6, 4);

    this.ctx.restore();
  }

  private renderFloatingTexts() {
    this.floatingTexts.forEach((ft) => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, ft.alpha);
      this.ctx.font = `${ft.isCrit ? 'bold' : 'normal'} ${ft.size}px 'JetBrains Mono', monospace`;
      this.ctx.fillStyle = ft.color;
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#000000';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });
  }

  private renderCrosshair() {
    // Draw tactical reticle at mouse position
    const cx = this.mouseScreenX;
    const cy = this.mouseScreenY;
    const state = this.weaponStates[this.activeWeaponId];
    const def = WEAPON_REGISTRY[this.activeWeaponId];

    this.ctx.save();
    this.ctx.translate(cx, cy);

    // Crosshair lines
    this.ctx.strokeStyle = state && state.isReloading ? '#eab308' : '#38bdf8';
    this.ctx.lineWidth = 1.5;

    const gap = 6;
    const len = 12;

    this.ctx.beginPath();
    this.ctx.moveTo(0, -gap);
    this.ctx.lineTo(0, -gap - len);
    this.ctx.moveTo(0, gap);
    this.ctx.lineTo(0, gap + len);
    this.ctx.moveTo(-gap, 0);
    this.ctx.lineTo(-gap - len, 0);
    this.ctx.moveTo(gap, 0);
    this.ctx.lineTo(gap + len, 0);
    this.ctx.stroke();

    // Reload progress radial arc
    if (state && state.isReloading) {
      const reloadRatio = 1 - state.reloadTimer / def.reloadTime;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, gap + len + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * reloadRatio);
      this.ctx.strokeStyle = '#eab308';
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }
}
