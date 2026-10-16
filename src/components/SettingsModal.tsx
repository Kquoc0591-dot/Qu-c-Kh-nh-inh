import React from 'react';
import { GameSettings } from '../types/game';
import { TRANSLATIONS } from '../locales/i18n';
import { soundManager } from '../audio/soundManager';
import { X, Volume2, Music, Vibrate, Check, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onResetProgress,
}) => {
  const t = TRANSLATIONS[settings.language];

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const updated = { ...settings, sfxVolume: val };
    onUpdateSettings(updated);
    soundManager.setVolumes(val, settings.musicVolume);
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const updated = { ...settings, musicVolume: val };
    onUpdateSettings(updated);
    soundManager.setVolumes(settings.sfxVolume, val);
  };

  const toggleScreenShake = () => {
    onUpdateSettings({ ...settings, screenShake: !settings.screenShake });
  };

  const toggleAutoReload = () => {
    onUpdateSettings({ ...settings, autoReload: !settings.autoReload });
  };

  const toggleDamageNumbers = () => {
    onUpdateSettings({ ...settings, showDamageNumbers: !settings.showDamageNumbers });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white tracking-tight">{t.settings}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Sliders */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-sky-400" />
                {t.sfxVol}
              </span>
              <span className="font-mono text-slate-400">
                {Math.round(settings.sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={handleSfxChange}
              className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-purple-400" />
                {t.musicVol}
              </span>
              <span className="font-mono text-slate-400">
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={handleMusicChange}
              className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
            <span className="text-xs font-medium text-slate-200">{t.screenShake}</span>
            <input
              type="checkbox"
              checked={settings.screenShake}
              onChange={toggleScreenShake}
              className="w-4 h-4 rounded accent-sky-400 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
            <span className="text-xs font-medium text-slate-200">{t.autoReload}</span>
            <input
              type="checkbox"
              checked={settings.autoReload}
              onChange={toggleAutoReload}
              className="w-4 h-4 rounded accent-sky-400 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
            <span className="text-xs font-medium text-slate-200">{t.damageNumbers}</span>
            <input
              type="checkbox"
              checked={settings.showDamageNumbers}
              onChange={toggleDamageNumbers}
              className="w-4 h-4 rounded accent-sky-400 cursor-pointer"
            />
          </label>
        </div>

        {/* Reset Save Data */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm(settings.language === 'vi' ? 'Bạn có chắc chắn muốn đặt lại toàn bộ điểm và nâng cấp?' : 'Reset all upgrades and high scores?')) {
                onResetProgress();
              }
            }}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {settings.language === 'vi' ? 'Đặt lại dữ liệu tiến trình' : 'Reset Progress'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
