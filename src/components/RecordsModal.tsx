import React from 'react';
import { GameSettings, MatchStats } from '../types/game';
import { TRANSLATIONS } from '../locales/i18n';
import { Trophy, X, Target, Skull, ShieldAlert, Clock } from 'lucide-react';

interface RecordsModalProps {
  records: MatchStats[];
  settings: GameSettings;
  onClose: () => void;
}

export const RecordsModal: React.FC<RecordsModalProps> = ({ records, settings, onClose }) => {
  const t = TRANSLATIONS[settings.language];

  // Best score
  const bestRecord = records.length > 0 ? records[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">{t.records}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Record Spotlight */}
        {bestRecord ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-sky-500/10 border border-amber-500/30 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">
                {settings.language === 'vi' ? 'KỶ LỤC CAO NHẤT' : 'ALL-TIME RECORD'}
              </div>
              <div className="text-2xl font-black font-mono text-white tabular-nums mt-0.5">
                {bestRecord.score.toLocaleString()} PTS
              </div>
            </div>
            <div className="text-right text-xs text-slate-300 font-mono space-y-0.5">
              <div>
                {t.wave} {bestRecord.wave} · {bestRecord.kills} {t.kills}
              </div>
              <div className="text-slate-400">
                {bestRecord.accuracy}% {t.accuracy}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-sm">
            {settings.language === 'vi'
              ? 'Chưa có dữ liệu chiến đấu. Hãy tham gia trận đấu đầu tiên!'
              : 'No combat records recorded yet. Deploy to the battlefield!'}
          </div>
        )}

        {/* History Table */}
        {records.length > 0 && (
          <div className="overflow-y-auto flex-1 pr-1">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">{t.score}</th>
                  <th className="py-2.5 px-3">{t.wave}</th>
                  <th className="py-2.5 px-3">{t.kills}</th>
                  <th className="py-2.5 px-3">{t.accuracy}</th>
                  <th className="py-2.5 px-3">{t.timeElapsed}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {records.slice(0, 10).map((r, idx) => {
                  const mins = Math.floor(r.timeSurvivedSec / 60);
                  const secs = r.timeSurvivedSec % 60;
                  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-sky-400 tabular-nums">
                        {r.score.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200 tabular-nums">{r.wave}</td>
                      <td className="py-2.5 px-3 text-slate-200 tabular-nums">{r.kills}</td>
                      <td className="py-2.5 px-3 text-slate-200 tabular-nums">{r.accuracy}%</td>
                      <td className="py-2.5 px-3 text-slate-400 tabular-nums">{timeFormatted}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
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
