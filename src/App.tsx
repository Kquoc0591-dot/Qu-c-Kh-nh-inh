import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import {
  GameMode,
  GameSettings,
  GameStatus,
  MatchStats,
  UpgradeTier,
} from './types/game';
import { UPGRADES_LIST } from './game/upgrades';
import { soundManager } from './audio/soundManager';
import { TopBar } from './components/TopBar';
import { MenuHero } from './components/MenuHero';
import { HUD } from './components/HUD';
import { ArmoryModal } from './components/ArmoryModal';
import { SettingsModal } from './components/SettingsModal';
import { RecordsModal } from './components/RecordsModal';
import { GameOverModal } from './components/GameOverModal';

const DEFAULT_SETTINGS: GameSettings = {
  language: 'vi',
  sfxVolume: 0.7,
  musicVolume: 0.35,
  screenShake: true,
  autoReload: true,
  showDamageNumbers: true,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Settings & Storage
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('cyberstrike_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [upgrades, setUpgrades] = useState<UpgradeTier[]>(() => {
    try {
      const saved = localStorage.getItem('cyberstrike_upgrades');
      return saved ? JSON.parse(saved) : UPGRADES_LIST;
    } catch {
      return UPGRADES_LIST;
    }
  });

  const [records, setRecords] = useState<MatchStats[]>(() => {
    try {
      const saved = localStorage.getItem('cyberstrike_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State Machine
  const [status, setStatus] = useState<GameStatus>('TITLE_MENU');
  const [mode, setMode] = useState<GameMode>('SURVIVAL');
  const [lastMatchStats, setLastMatchStats] = useState<MatchStats | null>(null);

  // Modals
  const [showArmory, setShowArmory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [, setTick] = useState(0);

  // Sync settings to sound manager
  useEffect(() => {
    soundManager.setVolumes(settings.sfxVolume, settings.musicVolume);
    try {
      localStorage.setItem('cyberstrike_settings', JSON.stringify(settings));
    } catch {
      // Storage safety
    }
  }, [settings]);

  // Persist upgrades
  useEffect(() => {
    try {
      localStorage.setItem('cyberstrike_upgrades', JSON.stringify(upgrades));
    } catch {
      // Storage safety
    }
  }, [upgrades]);

  // Persist records
  useEffect(() => {
    try {
      localStorage.setItem('cyberstrike_records', JSON.stringify(records));
    } catch {
      // Storage safety
    }
  }, [records]);

  // Setup Canvas and Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const engine = new GameEngine(canvas, settings, upgrades);
    engineRef.current = engine;

    // Engine Event Callbacks
    engine.onGameOver = (stats) => {
      setLastMatchStats(stats);
      setStatus('GAME_OVER');
      setRecords((prev) => [stats, ...prev].sort((a, b) => b.score - a.score));
    };

    engine.onVictory = (stats) => {
      setLastMatchStats(stats);
      setStatus('VICTORY');
      setRecords((prev) => [stats, ...prev].sort((a, b) => b.score - a.score));
    };

    engine.onPlayerStateUpdate = () => {
      // Periodic render tick for HUD
    };

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      engine.stop();
    };
  }, []);

  // Sync Engine with upgrades & settings
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.settings = settings;
      engineRef.current.upgrades = upgrades;
    }
  }, [settings, upgrades]);

  // HUD ticker to update health, ammo, and score cleanly
  useEffect(() => {
    if (status !== 'PLAYING') return;
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 1000);
    }, 80);
    return () => clearInterval(interval);
  }, [status]);

  // Game Start & Restart
  const handleStartGame = useCallback(
    (chosenMode = mode) => {
      setMode(chosenMode);
      setShowArmory(false);
      setShowSettings(false);
      setShowRecords(false);

      if (engineRef.current) {
        engineRef.current.upgrades = upgrades;
        engineRef.current.start(chosenMode);
        setStatus('PLAYING');
      }
    },
    [mode, upgrades]
  );

  const handlePauseToggle = useCallback(() => {
    if (!engineRef.current) return;
    if (engineRef.current.isPaused) {
      engineRef.current.resume();
      setStatus('PLAYING');
    } else {
      engineRef.current.pause();
      setStatus('PAUSED');
    }
  }, []);

  // User input event listeners on window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) &&
        status === 'PLAYING'
      ) {
        e.preventDefault();
      }

      if (e.code === 'Escape' && status === 'PLAYING') {
        handlePauseToggle();
        return;
      }

      if (status === 'PLAYING' && engineRef.current) {
        engineRef.current.handleKeyDown(e.code);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (engineRef.current) {
        engineRef.current.handleKeyUp(e.code);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [status, handlePauseToggle]);

  // Canvas Mouse and Wheel Events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    engineRef.current.mouseScreenX = e.clientX - rect.left;
    engineRef.current.mouseScreenY = e.clientY - rect.top;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0 && engineRef.current) {
      engineRef.current.isMouseDown = true;
    } else if (e.button === 2 && engineRef.current) {
      // Right click triggers dash
      engineRef.current.triggerDash();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0 && engineRef.current) {
      engineRef.current.isMouseDown = false;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (status !== 'PLAYING' || !engineRef.current) return;
    if (e.deltaY > 0) {
      engineRef.current.nextWeapon();
    } else {
      engineRef.current.prevWeapon();
    }
  };

  // Sound & Language toggles
  const handleToggleSound = () => {
    if (settings.sfxVolume > 0 || settings.musicVolume > 0) {
      setSettings((s) => ({ ...s, sfxVolume: 0, musicVolume: 0 }));
      soundManager.setVolumes(0, 0);
    } else {
      setSettings((s) => ({ ...s, sfxVolume: 0.7, musicVolume: 0.35 }));
      soundManager.setVolumes(0.7, 0.35);
    }
  };

  const handleToggleLanguage = () => {
    setSettings((s) => ({ ...s, language: s.language === 'vi' ? 'en' : 'vi' }));
  };

  const handleResetProgress = () => {
    setUpgrades(UPGRADES_LIST);
    setRecords([]);
    localStorage.removeItem('cyberstrike_upgrades');
    localStorage.removeItem('cyberstrike_records');
    setShowSettings(false);
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col font-sans select-none">
      {/* Universal 3-Zone Top Bar */}
      <TopBar
        status={status}
        mode={mode}
        settings={settings}
        onSelectMode={(newMode) => {
          setMode(newMode);
          if (status === 'PLAYING') {
            handleStartGame(newMode);
          }
        }}
        onOpenArmory={() => setShowArmory(true)}
        onOpenRecords={() => setShowRecords(true)}
        onOpenSettings={() => setShowSettings(true)}
        onStartGame={() => handleStartGame()}
        onToggleSound={handleToggleSound}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Main Game Surface / Menu Surface */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Real-time HTML5 60FPS Canvas */}
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
          className={`absolute inset-0 w-full h-full cursor-crosshair-tactical canvas-touch-guard ${
            status === 'TITLE_MENU' ? 'filter brightness-40 blur-[1px]' : ''
          }`}
        />

        {/* Title Screen View */}
        {status === 'TITLE_MENU' && (
          <div className="absolute inset-0 overflow-y-auto z-20">
            <MenuHero
              selectedMode={mode}
              onSelectMode={(m) => setMode(m)}
              onStartGame={() => handleStartGame(mode)}
              onOpenArmory={() => setShowArmory(true)}
              settings={settings}
            />
          </div>
        )}

        {/* Active Combat HUD */}
        {(status === 'PLAYING' || status === 'PAUSED') && engineRef.current && (
          <HUD
            engine={engineRef.current}
            settings={settings}
            mode={mode}
            isPaused={status === 'PAUSED'}
            onPauseToggle={handlePauseToggle}
          />
        )}

        {/* Pause Overlay */}
        {status === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4">
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">
              {settings.language === 'vi' ? 'TẠM DỪNG CHIẾN ĐẤU' : 'COMBAT PAUSED'}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePauseToggle}
                className="px-6 py-2.5 bg-sky-400 text-slate-950 font-bold rounded-xl hover:bg-sky-300 transition-colors cursor-pointer"
              >
                {settings.language === 'vi' ? 'Tiếp tục trận đấu' : 'Resume Combat'}
              </button>
              <button
                onClick={() => {
                  engineRef.current?.stop();
                  setStatus('TITLE_MENU');
                }}
                className="px-5 py-2.5 bg-slate-800 text-slate-200 font-semibold rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {settings.language === 'vi' ? 'Về menu chính' : 'Main Menu'}
              </button>
            </div>
          </div>
        )}

        {/* Game Over / Victory Modal */}
        {(status === 'GAME_OVER' || status === 'VICTORY') && lastMatchStats && (
          <GameOverModal
            stats={lastMatchStats}
            settings={settings}
            isVictory={status === 'VICTORY'}
            onRestart={() => handleStartGame(mode)}
            onOpenArmory={() => setShowArmory(true)}
          />
        )}

        {/* Armory & Upgrade Shop Modal */}
        {showArmory && engineRef.current && (
          <ArmoryModal
            engine={engineRef.current}
            settings={settings}
            upgrades={upgrades}
            onClose={() => setShowArmory(false)}
            onUpgradePurchased={(updated) => setUpgrades(updated)}
          />
        )}

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={(s) => setSettings(s)}
            onClose={() => setShowSettings(false)}
            onResetProgress={handleResetProgress}
          />
        )}

        {/* Combat Records Modal */}
        {showRecords && (
          <RecordsModal
            records={records}
            settings={settings}
            onClose={() => setShowRecords(false)}
          />
        )}
      </div>
    </div>
  );
}
