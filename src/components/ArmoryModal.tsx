import React, { useState } from 'react';
import { GameEngine } from '../game/engine';
import { GameSettings, UpgradeTier, WeaponId } from '../types/game';
import { WEAPON_REGISTRY } from '../game/weapons';
import { TRANSLATIONS } from '../locales/i18n';
import { soundManager } from '../audio/soundManager';
import { Zap, X, Check, Shield, Crosshair, ChevronRight, Layers, RefreshCw, Wind, Radio, Magnet, Sword } from 'lucide-react';

interface ArmoryModalProps {
  engine: GameEngine;
  settings: GameSettings;
  upgrades: UpgradeTier[];
  onClose: () => void;
  onUpgradePurchased: (updatedUpgrades: UpgradeTier[]) => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({
  engine,
  settings,
  upgrades,
  onClose,
  onUpgradePurchased,
}) => {
  const t = TRANSLATIONS[settings.language];
  const [selectedTab, setSelectedTab] = useState<'upgrades' | 'weapons'>('upgrades');
  const [selectedWeaponId, setSelectedWeaponId] = useState<WeaponId>(engine.activeWeaponId);

  const playerCredits = engine.player.credits;

  const getUpgradeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sword':
        return <Sword className="w-5 h-5 text-amber-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-sky-400" />;
      case 'RefreshCw':
        return <RefreshCw className="w-5 h-5 text-emerald-400" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'Wind':
        return <Wind className="w-5 h-5 text-teal-400" />;
      case 'Magnet':
        return <Magnet className="w-5 h-5 text-purple-400" />;
      case 'Radio':
        return <Radio className="w-5 h-5 text-rose-400" />;
      default:
        return <Crosshair className="w-5 h-5 text-sky-400" />;
    }
  };

  const handleBuyUpgrade = (upgradeId: string) => {
    const u = upgrades.find((x) => x.id === upgradeId);
    if (!u || u.level >= u.maxLevel) return;

    const cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.level));
    if (playerCredits < cost) return;

    engine.player.credits -= cost;
    const updated = upgrades.map((item) =>
      item.id === upgradeId ? { ...item, level: item.level + 1 } : item
    );

    soundManager.playPowerUp();
    onUpgradePurchased(updated);
  };

  const selectedWeapon = WEAPON_REGISTRY[selectedWeaponId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              {t.upgradeShop}
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400 text-xs font-mono font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>{playerCredits}⚡</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setSelectedTab('upgrades')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedTab === 'upgrades'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {settings.language === 'vi' ? 'Nâng Cấp Chiến Đấu' : 'Tactical Upgrades'}
              </button>
              <button
                onClick={() => setSelectedTab('weapons')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedTab === 'weapons'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {settings.language === 'vi' ? 'Kho Vũ Khí' : 'Weapon Arsenal'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {selectedTab === 'upgrades' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upgrades.map((u) => {
                const cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.level));
                const isMax = u.level >= u.maxLevel;
                const canAfford = playerCredits >= cost && !isMax;

                return (
                  <div
                    key={u.id}
                    className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                          {getUpgradeIcon(u.icon)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">
                            {settings.language === 'vi' ? u.nameVi : u.nameEn}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {settings.language === 'vi' ? u.descVi : u.descEn}
                          </div>
                        </div>
                      </div>

                      {/* Level indicators */}
                      <div className="flex items-center gap-1 shrink-0">
                        {Array.from({ length: u.maxLevel }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-4 rounded-xs ${
                              i < u.level ? 'bg-sky-400' : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <div className="text-xs text-slate-400">
                        {settings.language === 'vi' ? 'Cấp độ:' : 'Level:'}{' '}
                        <span className="font-mono text-white font-semibold">
                          {u.level} / {u.maxLevel}
                        </span>
                      </div>

                      <button
                        onClick={() => handleBuyUpgrade(u.id)}
                        disabled={!canAfford}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isMax
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : canAfford
                            ? 'bg-sky-400 text-slate-950 hover:bg-sky-300 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isMax ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            {t.maxLevel}
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            {t.buyUpgrade} ({cost}⚡)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weapon List */}
              <div className="flex flex-col gap-2">
                {(Object.keys(WEAPON_REGISTRY) as WeaponId[]).map((wId) => {
                  const def = WEAPON_REGISTRY[wId];
                  const isUnlocked = engine.unlockedWeapons.includes(wId);
                  const isSelected = selectedWeaponId === wId;

                  return (
                    <button
                      key={wId}
                      onClick={() => setSelectedWeaponId(wId)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/10 border-sky-500/40 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs text-sky-400 font-medium">
                          {settings.language === 'vi' ? def.categoryVi : def.category}
                        </div>
                        <div className="text-sm font-bold">
                          {settings.language === 'vi' ? def.nameVi : def.name}
                        </div>
                      </div>

                      <div className="text-right">
                        {isUnlocked ? (
                          <span className="text-[11px] font-mono text-emerald-400 font-medium">
                            {settings.language === 'vi' ? 'Đã sở hữu' : 'Equipped'}
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-amber-400 font-medium">
                            {settings.language === 'vi' ? `Mở tại Đợt ${def.unlockWave}` : `Wave ${def.unlockWave}`}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Weapon Detail Showcase */}
              <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-sky-400 font-semibold">
                        {settings.language === 'vi' ? selectedWeapon.categoryVi : selectedWeapon.category}
                      </span>
                      <h3 className="text-xl font-extrabold text-white">
                        {settings.language === 'vi' ? selectedWeapon.nameVi : selectedWeapon.name}
                      </h3>
                    </div>

                    <div
                      className="w-5 h-5 rounded-full shadow-lg"
                      style={{ backgroundColor: selectedWeapon.bulletColor }}
                      title="Bullet Plasma Core"
                    />
                  </div>

                  <p className="text-sm text-slate-300 mb-6">
                    {settings.language === 'vi'
                      ? selectedWeapon.descriptionVi
                      : selectedWeapon.descriptionEn}
                  </p>

                  {/* Weapon Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase font-medium">
                        {settings.language === 'vi' ? 'Sát Thương' : 'Damage'}
                      </div>
                      <div className="text-base font-bold font-mono text-white tabular-nums mt-0.5">
                        {selectedWeapon.damage} {selectedWeapon.pelletCount > 1 ? `x${selectedWeapon.pelletCount}` : ''}
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase font-medium">
                        {settings.language === 'vi' ? 'Tốc Độ Bắn' : 'Fire Rate'}
                      </div>
                      <div className="text-base font-bold font-mono text-white tabular-nums mt-0.5">
                        {selectedWeapon.fireRate}/s
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase font-medium">
                        {settings.language === 'vi' ? 'Băng Đạn' : 'Magazine'}
                      </div>
                      <div className="text-base font-bold font-mono text-white tabular-nums mt-0.5">
                        {selectedWeapon.magazineSize}
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase font-medium">
                        {settings.language === 'vi' ? 'Nạp Đạn' : 'Reload'}
                      </div>
                      <div className="text-base font-bold font-mono text-white tabular-nums mt-0.5">
                        {selectedWeapon.reloadTime}s
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {engine.unlockedWeapons.includes(selectedWeaponId) ? (
                      <span className="text-emerald-400 font-medium">
                        ✓ {settings.language === 'vi' ? 'Sẵn sàng triển khai trong trận đấu' : 'Ready for tactical deployment'}
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium">
                        {settings.language === 'vi'
                          ? `Vũ khí sẽ tự động mở khóa khi vượt qua Đợt ${selectedWeapon.unlockWave}`
                          : `Unlocks upon reaching wave ${selectedWeapon.unlockWave}`}
                      </span>
                    )}
                  </div>

                  {engine.unlockedWeapons.includes(selectedWeaponId) && (
                    <button
                      onClick={() => {
                        engine.switchWeapon(selectedWeaponId);
                        onClose();
                      }}
                      className="px-4 py-2 bg-sky-400 text-slate-950 font-semibold text-xs rounded-lg hover:bg-sky-300 transition-colors cursor-pointer"
                    >
                      {settings.language === 'vi' ? 'Trang Bị Ngay' : 'Equip Weapon'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
