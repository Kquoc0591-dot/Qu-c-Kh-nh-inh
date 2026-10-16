import React from 'react';
import { GameEngine } from '../game/engine';
import { GameMode, GameSettings, WeaponId } from '../types/game';
import { WEAPON_REGISTRY } from '../game/weapons';
import { TRANSLATIONS } from '../locales/i18n';
import { Shield, Heart, Zap, Crosshair, Sparkles, Wind, Radio } from 'lucide-react';

interface HUDProps {
  engine: GameEngine;
  settings: GameSettings;
  mode: GameMode;
  onPauseToggle: () => void;
  isPaused: boolean;
}

export const HUD: React.FC<HUDProps> = ({ engine, settings, mode, onPauseToggle, isPaused }) => {
  const t = TRANSLATIONS[settings.language];
  const player = engine.player;
  const activeWeapon = WEAPON_REGISTRY[engine.activeWeaponId];
  const weaponState = engine.weaponStates[engine.activeWeaponId];

  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const shieldPercent = Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100));

  const dashCooldownProgress = player.dashTimer > 0 ? (player.dashTimer / player.dashCooldown) * 100 : 0;
  const tacticalCooldownProgress =
    player.tacticalTimer > 0 ? (player.tacticalTimer / player.tacticalCooldown) * 100 : 0;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Top HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Health & Shield telemetry */}
        <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex flex-col gap-2 min-w-[220px] md:min-w-[260px] shadow-lg">
          {/* Health Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                {t.health}
              </span>
              <span className="font-mono tabular-nums font-semibold">
                {Math.ceil(player.hp)} / {player.maxHp}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-150 rounded-full"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Shield Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                {t.shield}
              </span>
              <span className="font-mono tabular-nums font-semibold">
                {Math.ceil(player.shield)} / {player.maxShield}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-600 to-cyan-300 transition-all duration-150 rounded-full"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center Wave / Mode Objective */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-4 text-xs md:text-sm">
          {mode === 'SURVIVAL' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{t.wave}</span>
              <span className="text-amber-400 font-bold font-mono text-base tabular-nums">
                {engine.currentWave}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                {engine.enemies.length} {settings.language === 'vi' ? 'kẻ thù' : 'targets'}
              </span>
            </div>
          )}

          {mode === 'BOSS_HUNT' && (
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-bold uppercase tracking-wider">
                {settings.language === 'vi' ? 'MỤC TIÊU: OMEGA TITAN' : 'TARGET: OMEGA TITAN'}
              </span>
            </div>
          )}

          {mode === 'TARGET_PRACTICE' && (
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-sky-400" />
              <span className="text-slate-300 font-medium">
                {settings.language === 'vi' ? 'Luyện Phản Xạ' : 'Reflex Drill'}
              </span>
            </div>
          )}

          {/* Pause Button */}
          <button
            onClick={onPauseToggle}
            className="pointer-events-auto ml-2 px-2.5 py-1 text-xs font-semibold rounded border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {isPaused ? t.resume : t.pause}
          </button>
        </div>

        {/* Score & Credits */}
        <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex items-center gap-5 shadow-lg">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
              {t.score}
            </div>
            <div className="text-base md:text-lg font-bold font-mono text-white tabular-nums">
              {player.score.toLocaleString()}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-sky-400" />
              {t.credits}
            </div>
            <div className="text-base md:text-lg font-bold font-mono text-sky-400 tabular-nums">
              {player.credits}⚡
            </div>
          </div>

          {player.combo > 1 && (
            <div className="animate-pulse bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1 text-center">
              <div className="text-[10px] text-amber-400 font-bold uppercase">Combo</div>
              <div className="text-sm font-bold text-amber-300 font-mono">x{player.combo}</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom HUD: Tactical Abilities + Weapon Hotbar & Ammo */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4 mt-auto">
        {/* Tactical Skills: Dash & EMP */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Dash Ability */}
          <button
            onClick={() => engine.triggerDash()}
            disabled={player.dashTimer > 0}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
              player.dashTimer <= 0
                ? 'bg-slate-950/80 border-sky-500/40 text-sky-300 hover:border-sky-400 shadow-md shadow-sky-500/10'
                : 'bg-slate-950/50 border-slate-800 text-slate-500'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Wind className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-none">{t.dash} [SPACE]</div>
              <div className="text-[10px] font-mono tabular-nums text-slate-400 mt-1">
                {player.dashTimer > 0 ? `${player.dashTimer.toFixed(1)}s` : 'SẴN SÀNG'}
              </div>
            </div>
            {player.dashTimer > 0 && (
              <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden ml-1">
                <div
                  className="h-full bg-sky-400 rounded-full"
                  style={{ width: `${100 - dashCooldownProgress}%` }}
                />
              </div>
            )}
          </button>

          {/* Tactical EMP Shockwave */}
          <button
            onClick={() => engine.triggerTacticalEMP()}
            disabled={player.tacticalTimer > 0}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
              player.tacticalTimer <= 0
                ? 'bg-slate-950/80 border-purple-500/40 text-purple-300 hover:border-purple-400 shadow-md shadow-purple-500/10'
                : 'bg-slate-950/50 border-slate-800 text-slate-500'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Radio className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-none">{t.emp} [E]</div>
              <div className="text-[10px] font-mono tabular-nums text-slate-400 mt-1">
                {player.tacticalTimer > 0 ? `${player.tacticalTimer.toFixed(1)}s` : 'SẴN SÀNG'}
              </div>
            </div>
          </button>
        </div>

        {/* Arsenal Hotbar & Active Weapon Ammo */}
        <div className="pointer-events-auto flex flex-col md:flex-row items-end gap-3">
          {/* Quick Weapon Selector Strip (1-6) */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 flex items-center gap-1.5 shadow-lg">
            {(Object.keys(WEAPON_REGISTRY) as WeaponId[]).map((wId, idx) => {
              const def = WEAPON_REGISTRY[wId];
              const isUnlocked = engine.unlockedWeapons.includes(wId);
              const isActive = engine.activeWeaponId === wId;

              return (
                <button
                  key={wId}
                  onClick={() => isUnlocked && engine.switchWeapon(wId)}
                  disabled={!isUnlocked}
                  title={`${def.name} (${idx + 1})`}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 min-w-[50px] cursor-pointer ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/30'
                      : isUnlocked
                      ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'bg-slate-900/40 text-slate-600 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[10px] opacity-75 font-mono">{idx + 1}</span>
                  <span className="truncate max-w-[45px] text-[11px]">
                    {wId === 'pistol'
                      ? 'P9'
                      : wId === 'assault'
                      ? 'AR-X'
                      : wId === 'shotgun'
                      ? 'SG'
                      : wId === 'railgun'
                      ? 'ION'
                      : wId === 'rocket'
                      ? 'RPG'
                      : 'FLM'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Weapon & Ammo Card */}
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 flex items-center gap-5 min-w-[210px] shadow-lg">
            <div className="flex-1">
              <div className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">
                {settings.language === 'vi' ? activeWeapon.categoryVi : activeWeapon.category}
              </div>
              <div className="text-sm font-bold text-white truncate max-w-[150px]">
                {settings.language === 'vi' ? activeWeapon.nameVi : activeWeapon.name}
              </div>
            </div>

            <div className="text-right">
              {weaponState.isReloading ? (
                <button
                  onClick={() => engine.triggerReload()}
                  className="text-xs font-bold font-mono text-amber-400 animate-pulse bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30"
                >
                  {t.reloading}
                </button>
              ) : (
                <div
                  onClick={() => engine.triggerReload()}
                  title="Nhấn R để nạp đạn"
                  className="cursor-pointer group"
                >
                  <div className="text-2xl font-black font-mono tracking-tight text-white tabular-nums group-hover:text-amber-400 transition-colors">
                    {weaponState.currentAmmo}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    [R] {t.ammo}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
