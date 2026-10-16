import React from 'react';
import { GameSettings, MatchStats } from '../types/game';
import { TRANSLATIONS } from '../locales/i18n';
import { Skull, RotateCcw, Award, Target, Zap, Clock, ShieldAlert } from 'lucide-react';

interface GameOverModalProps {
  stats: MatchStats;
  settings: GameSettings;
  isVictory?: boolean;
  onRestart: () => void;
  onOpenArmory: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  settings,
  isVictory = false,
  onRestart,
  onOpenArmory,
}) => {
  const t = TRANSLATIONS[settings.language];

  // Format time mm:ss
  const mins = Math.floor(stats.timeSurvivedSec / 60);
  const secs = stats.timeSurvivedSec % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col items-center text-center">
        {/* Header Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
            isVictory
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-500'
          }`}
        >
          {isVictory ? <Award className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1">
          {isVictory ? t.missionSuccess : t.missionFailed}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          {isVictory ? t.titanEliminated : 'Sector 9 has fallen. Regroup and deploy again.'}
        </p>

        {/* Core Final Score */}
        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            {t.score}
          </div>
          <div className="text-3xl md:text-4xl font-black font-mono text-sky-400 tabular-nums mt-1">
            {stats.score.toLocaleString()}
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-8 text-left">
          <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              {t.wave}
            </div>
            <div className="text-lg font-bold font-mono text-white tabular-nums mt-0.5">
              {stats.wave}
            </div>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              {t.kills}
            </div>
            <div className="text-lg font-bold font-mono text-white tabular-nums mt-0.5">
              {stats.kills}
            </div>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-sky-400" />
              {t.accuracy}
            </div>
            <div className="text-lg font-bold font-mono text-white tabular-nums mt-0.5">
              {stats.accuracy}%
            </div>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {t.timeElapsed}
            </div>
            <div className="text-lg font-bold font-mono text-white tabular-nums mt-0.5">
              {timeFormatted}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex items-center gap-3">
          <button
            onClick={onOpenArmory}
            className="flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-semibold border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
          >
            {t.armory}
          </button>

          <button
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 active:scale-95 transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            {t.restart}
          </button>
        </div>
      </div>
    </div>
  );
};
