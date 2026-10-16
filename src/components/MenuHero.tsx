import React from 'react';
import { GameMode, GameSettings } from '../types/game';
import { TRANSLATIONS } from '../locales/i18n';
import heroImg from '../assets/images/cyber_soldier_hero_1792141719272.jpg';
import bossImg from '../assets/images/cyber_boss_titan_1792141719498.jpg';
import armoryImg from '../assets/images/cyber_armory_showcase_1792141719093.jpg';
import { ShieldAlert, Crosshair, Skull, Play, MousePointer, Keyboard, Sparkles } from 'lucide-react';

interface MenuHeroProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onStartGame: () => void;
  onOpenArmory: () => void;
  settings: GameSettings;
}

export const MenuHero: React.FC<MenuHeroProps> = ({
  selectedMode,
  onSelectMode,
  onStartGame,
  onOpenArmory,
  settings,
}) => {
  const t = TRANSLATIONS[settings.language];

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10">
      {/* Hero Banner Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 md:p-10 overflow-hidden shadow-2xl relative">
        {/* Ambient subtle glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Left Column: Headline & Action */}
        <div className="lg:col-span-7 flex flex-col gap-6 z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-widest">
            <span>Tactical Sci-Fi Web Shooter</span>
            <span aria-hidden="true">·</span>
            <span>Sector 9 Defense</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] text-balance">
            {settings.language === 'vi' ? (
              <>
                Chiến Trường Bắn Súng <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                  Phản Xạ Cao Độ
                </span>
              </>
            ) : (
              <>
                High-Caliber Tactical <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                  Sector Combat
                </span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            {settings.language === 'vi'
              ? 'Trang bị kho vũ khí plasma tối tân, thực hiện các pha lướt né thần tốc và đối đầu với quân đoàn người máy sát thủ cùng siêu trùm cơ giáp Titan khổng lồ trong không gian mạng Sector 9.'
              : 'Deploy into the cybernetic ruins of Sector 9. Master responsive twin-stick mechanics, deploy tactical EMP bursts, upgrade high-tech weapon loadouts, and bring down the colossal Omega Titan Mech.'}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartGame}
              className="px-6 py-3.5 rounded-xl font-bold text-sm md:text-base text-slate-950 bg-sky-400 hover:bg-sky-300 active:scale-95 transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              {t.playNow}
            </button>

            <button
              onClick={onOpenArmory}
              className="px-5 py-3.5 rounded-xl font-semibold text-sm text-slate-200 border border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
            >
              {t.armory}
            </button>
          </div>

          {/* Key Spec Badges */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <span>60 FPS Hardware Acceleration</span>
            <span aria-hidden="true">·</span>
            <span>Web Audio Synth</span>
            <span aria-hidden="true">·</span>
            <span>Full Mouse & Keyboard</span>
          </div>
        </div>

        {/* Right Column: Hero Graphic */}
        <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl group aspect-video lg:aspect-auto lg:h-[420px]">
          <img
            src={heroImg}
            alt="Cyber Commando Soldier Art"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-xs font-mono text-slate-300 flex items-center justify-between">
            <span className="text-sky-400 font-semibold">UNIT: VANGUARD-09</span>
            <span className="text-slate-400">PLASMA RIFLE ARMED</span>
          </div>
        </div>
      </div>

      {/* Mode Selection Grid */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-4">
          {settings.language === 'vi' ? 'Chọn Chế Độ Chiến Đấu' : 'Select Combat Mode'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Mode 1: Survival */}
          <div
            onClick={() => onSelectMode('SURVIVAL')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden ${
              selectedMode === 'SURVIVAL'
                ? 'bg-sky-500/10 border-sky-400 shadow-lg shadow-sky-500/10'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-3">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">{t.campaign}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {settings.language === 'vi'
                  ? 'Sinh tồn qua các đợt càn quét vô tận của người máy sát thủ, thu thập năng lượng và mở khóa khí tài quân sự.'
                  : 'Survive incoming waves of mechanical raiders, gather energy credits, and advance through endless combat sectors.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono">10+ WAVES</span>
              <span
                className={`font-semibold ${
                  selectedMode === 'SURVIVAL' ? 'text-sky-400' : 'text-slate-500'
                }`}
              >
                {selectedMode === 'SURVIVAL'
                  ? settings.language === 'vi'
                    ? 'Đang chọn'
                    : 'Selected'
                  : settings.language === 'vi'
                  ? 'Chọn chế độ'
                  : 'Select'}
              </span>
            </div>
          </div>

          {/* Mode 2: Boss Hunt */}
          <div
            onClick={() => onSelectMode('BOSS_HUNT')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden ${
              selectedMode === 'BOSS_HUNT'
                ? 'bg-red-500/10 border-red-400 shadow-lg shadow-red-500/10'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
                <Skull className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">{t.bossHunt}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {settings.language === 'vi'
                  ? 'Đối đầu trực tiếp với Siêu Cơ Giáp Omega Titan mang bão đạn laser xoay vòng và tên lửa tự hành hạng nặng.'
                  : 'Face off against the Omega Titan Mech loaded with rotating quad death rays, homing rockets, and shockwaves.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono">FULL ARSENAL</span>
              <span
                className={`font-semibold ${
                  selectedMode === 'BOSS_HUNT' ? 'text-red-400' : 'text-slate-500'
                }`}
              >
                {selectedMode === 'BOSS_HUNT'
                  ? settings.language === 'vi'
                    ? 'Đang chọn'
                    : 'Selected'
                  : settings.language === 'vi'
                  ? 'Chọn chế độ'
                  : 'Select'}
              </span>
            </div>
          </div>

          {/* Mode 3: Target Practice */}
          <div
            onClick={() => onSelectMode('TARGET_PRACTICE')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden ${
              selectedMode === 'TARGET_PRACTICE'
                ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                <Crosshair className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">{t.targetPractice}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {settings.language === 'vi'
                  ? 'Trường bắn tập phản xạ với các mục tiêu quang học di động. Đo lường tỷ lệ chính xác và thời gian ngắm bắn.'
                  : 'Holographic reflex range with timed targets. Test reaction flicks, tracking precision, and score high combos.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono">TIMED DRILL</span>
              <span
                className={`font-semibold ${
                  selectedMode === 'TARGET_PRACTICE' ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                {selectedMode === 'TARGET_PRACTICE'
                  ? settings.language === 'vi'
                    ? 'Đang chọn'
                    : 'Selected'
                  : settings.language === 'vi'
                  ? 'Chọn chế độ'
                  : 'Select'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Field Operations & Controls Guide */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 md:p-8">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-sky-400" />
          {t.controlsGuide}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
            <span className="font-bold text-white block mb-0.5">{t.wasdMove}</span>
            <span className="text-slate-400 font-mono">W, A, S, D / Mũi tên</span>
          </div>

          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
            <span className="font-bold text-white block mb-0.5">{t.mouseAimShoot}</span>
            <span className="text-slate-400 font-mono">Chuột / Chuột trái</span>
          </div>

          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
            <span className="font-bold text-white block mb-0.5">{t.spaceDash}</span>
            <span className="text-slate-400 font-mono">Space / Chuột phải</span>
          </div>

          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
            <span className="font-bold text-white block mb-0.5">{t.rReload}</span>
            <span className="text-slate-400 font-mono">Phím R</span>
          </div>

          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
            <span className="font-bold text-white block mb-0.5">{t.eEMP}</span>
            <span className="text-slate-400 font-mono">Phím E hoặc Q</span>
          </div>

          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
            <span className="font-bold text-white block mb-0.5">{t.numKeys}</span>
            <span className="text-slate-400 font-mono">1, 2, 3, 4, 5, 6 / Scroll</span>
          </div>
        </div>
      </div>
    </div>
  );
};
