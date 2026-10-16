export type GameMode = 'SURVIVAL' | 'BOSS_HUNT' | 'TARGET_PRACTICE';

export type GameStatus =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'UPGRADE_SHOP'
  | 'PAUSED'
  | 'ROUND_SUMMARY'
  | 'GAME_OVER'
  | 'VICTORY';

export type WeaponId =
  | 'pistol'
  | 'assault'
  | 'shotgun'
  | 'railgun'
  | 'rocket'
  | 'flamethrower';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  nameVi: string;
  category: string;
  categoryVi: string;
  damage: number;
  fireRate: number; // shots per sec
  magazineSize: number;
  reloadTime: number; // in seconds
  bulletSpeed: number;
  spread: number; // in radians
  pelletCount: number;
  bulletColor: string;
  bulletRadius: number;
  piercing: boolean;
  splashRadius: number;
  knockback: number;
  unlockWave: number;
  cost: number;
  descriptionVi: string;
  descriptionEn: string;
}

export interface WeaponState {
  currentAmmo: number;
  reserveAmmo: number;
  isReloading: boolean;
  reloadTimer: number; // current progress
  fireCooldown: number;
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  shieldRegenTimer: number;
  dashCooldown: number;
  dashTimer: number;
  isDashing: boolean;
  dashDuration: number;
  credits: number;
  score: number;
  combo: number;
  comboTimer: number;
  shotsFired: number;
  shotsHit: number;
  kills: number;
  tacticalCooldown: number;
  tacticalTimer: number;
  quadDamageTimer: number;
  speedBoostTimer: number;
}

export type EnemyType =
  | 'scout'
  | 'trooper'
  | 'grenadier'
  | 'stalker'
  | 'heavy'
  | 'boss_titan';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  angle: number;
  shootCooldown: number;
  shootTimer: number;
  scoreValue: number;
  creditValue: number;
  color: string;
  isBoss?: boolean;
  bossPhase?: number;
  stateTimer?: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  rangeLeft: number;
  color: string;
  isPlayer: boolean;
  piercing: boolean;
  splashRadius: number;
  trail: { x: number; y: number }[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'square' | 'line' | 'shell';
  rotation?: number;
  vRot?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  alpha: number;
  vy: number;
  isCrit?: boolean;
}

export type PowerUpType = 'health' | 'shield' | 'quad_damage' | 'speed_boost' | 'nuke';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  radius: number;
  bobTimer: number;
}

export interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'crate' | 'pillar' | 'generator';
  hp?: number;
}

export interface TargetPracticeItem {
  id: string;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  score: number;
  lifespan: number;
  maxLifespan: number;
  isMoving: boolean;
  vx: number;
  vy: number;
  isGolden?: boolean;
}

export interface UpgradeTier {
  id: string;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  icon: string;
}

export interface GameSettings {
  language: 'vi' | 'en';
  sfxVolume: number;
  musicVolume: number;
  screenShake: boolean;
  autoReload: boolean;
  showDamageNumbers: boolean;
}

export interface MatchStats {
  score: number;
  wave: number;
  kills: number;
  accuracy: number;
  damageDealt: number;
  timeSurvivedSec: number;
  highestCombo: number;
  bossesDefeated: number;
}
