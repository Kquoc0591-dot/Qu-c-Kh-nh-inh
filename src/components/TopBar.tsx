import React from 'react';
import { GameMode, GameSettings, GameStatus } from '../types/game';
import { TRANSLATIONS } from '../locales/i18n';
import { Volume2, VolumeX, Settings, ShieldAlert } from 'lucide-react';

interface TopBarProps {
  status: GameStatus;
  mode: GameMode;
  settings: GameSettings;
  onSelectMode: (mode: GameMode) => void;
  onOpenArmory: () => void;
  onOpenRecords: () => void;
  onOpenSettings: () => void;
  onStartGame: () => void;
  onToggleSound: () => void;
  onToggleLanguage: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  status,
  mode,
  settings,
  onSelectMode,
  onOpenArmory,
  onOpenRecords,
  onOpenSettings,
  onStartGame,
  onToggleSound,
  onToggleLanguage,
}) => {
  const t = TRANSLATIONS[settings.language];
  const isSoundMuted = settings.sfxVolume <= 0.01 && settings.musicVolume <= 0.01;

  return (
    <header className="w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 z-40 shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="text-base md:text-lg font-bold tracking-tight text-white whitespace-nowrap">
            CyberStrike: Sector 9
          </span>
        </div>

        {/* Zone 2: 4-5 clean single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onSelectMode('SURVIVAL')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer hover:text-sky-400 ${
              mode === 'SURVIVAL' && status !== 'TITLE_MENU' ? 'text-sky-400 font-semibold' : 'text-slate-300'
            }`}
          >
            {t.campaign}
          </button>
          <button
            onClick={() => onSelectMode('BOSS_HUNT')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer hover:text-sky-400 ${
              mode === 'BOSS_HUNT' && status !== 'TITLE_MENU' ? 'text-sky-400 font-semibold' : 'text-slate-300'
            }`}
          >
            {t.bossHunt}
          </button>
          <button
            onClick={() => onSelectMode('TARGET_PRACTICE')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer hover:text-sky-400 ${
              mode === 'TARGET_PRACTICE' && status !== 'TITLE_MENU' ? 'text-sky-400 font-semibold' : 'text-slate-300'
            }`}
          >
            {t.targetPractice}
          </button>
          <button
            onClick={onOpenArmory}
            className="whitespace-nowrap transition-colors py-1 cursor-pointer text-slate-300 hover:text-sky-400"
          >
            {t.armory}
          </button>
          <button
            onClick={onOpenRecords}
            className="whitespace-nowrap transition-colors py-1 cursor-pointer text-slate-300 hover:text-sky-400"
          >
            {t.records}
          </button>
        </nav>

        {/* Zone 3: Quick settings & primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            title="Đổi ngôn ngữ / Change language"
            className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500 transition-colors whitespace-nowrap cursor-pointer"
          >
            {settings.language === 'vi' ? 'Tiếng Việt' : 'English'}
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleSound}
            title={isSoundMuted ? t.soundOn : t.soundMuted}
            className="p-2 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={onOpenSettings}
            title={t.settings}
            className="p-2 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onStartGame}
            className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 active:scale-95 transition-all shadow-sm hover:shadow-sky-500/25 whitespace-nowrap cursor-pointer"
          >
            {status === 'PLAYING' ? t.restart : t.playNow}
          </button>
        </div>
      </div>
    </header>
  );
};
