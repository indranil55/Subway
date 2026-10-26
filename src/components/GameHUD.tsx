import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Zap,
  Sparkles,
  Shield,
  Rocket,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  ShoppingBag,
  Check,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameMetrics, BoardSkin } from '../game/engine';

interface GameHUDProps {
  metrics: GameMetrics;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartGame: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  onHoverboard: () => void;
  onSelectBoard?: (skin: BoardSkin) => void;
  onUpgrade?: (type: 'magnet' | 'jetpack' | 'sneakers' | 'multiplier') => void;
  onBuyHoverboard?: () => void;
}

const BOARD_SKINS: { id: BoardSkin; name: string; desc: string; colors: string; border: string; glow: string }[] = [
  {
    id: 'STAR',
    name: 'STAR CRUISER',
    desc: 'Magenta Neon & Electric Cyan Thrusters',
    colors: 'from-pink-500 to-cyan-400',
    border: 'border-pink-400',
    glow: 'rgba(236,72,153,0.4)',
  },
  {
    id: 'CYBER',
    name: 'CYBER MATRIX',
    desc: 'Stealth Carbon Black & Hacker Green Neon',
    colors: 'from-slate-800 to-emerald-500',
    border: 'border-emerald-400',
    glow: 'rgba(34,197,94,0.4)',
  },
  {
    id: 'FLAME',
    name: 'INFERNO BLAZE',
    desc: 'Fiery Crimson Deck & Solar Flare Orange',
    colors: 'from-red-600 to-amber-500',
    border: 'border-amber-400',
    glow: 'rgba(249,115,22,0.4)',
  },
  {
    id: 'GOLD',
    name: '24K ROYAL GOLD',
    desc: 'Solid Gold Plating & Radiant Shimmer',
    colors: 'from-yellow-400 to-amber-600',
    border: 'border-yellow-300',
    glow: 'rgba(250,204,21,0.5)',
  },
];

export const GameHUD: React.FC<GameHUDProps> = ({
  metrics,
  isMuted,
  onToggleMute,
  onStartGame,
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
  onHoverboard,
  onSelectBoard,
  onUpgrade,
  onBuyHoverboard,
}) => {
  const [showShop, setShowShop] = useState<boolean>(false);
  const [shopTab, setShopTab] = useState<'UPGRADES' | 'BOARDS'>('UPGRADES');

  // Trigger celebratory confetti on new high score
  React.useEffect(() => {
    if (metrics.state === 'GAMEOVER' && metrics.score > 0 && metrics.score >= metrics.highScore) {
      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#facc15', '#ef4444', '#38bdf8', '#ec4899', '#22c55e'],
        });
      } catch {
        // ignore
      }
    }
  }, [metrics.state, metrics.score, metrics.highScore]);

  const getUpgradeCost = (level: number) => level * 300;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between overflow-hidden">
      {/* 1. TOP STATUS BAR */}
      <div className="w-full flex items-center justify-between p-3 sm:p-5 pointer-events-auto">
        {/* Left Cluster: Coins & Word Hunt */}
        <div className="flex items-center gap-3">
          {/* Coin Badge */}
          <div className="flex items-center gap-2 bg-slate-900/90 border-2 border-amber-400/80 px-3.5 py-1.5 rounded-2xl shadow-lg">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-yellow-200 flex items-center justify-center shadow-inner">
              <span className="text-xs font-black text-amber-950">★</span>
            </div>
            <span className="font-game text-amber-300 text-lg sm:text-xl font-black tabular-nums tracking-wide">
              {metrics.coins}
            </span>
          </div>

          {/* Word Hunt Letters (S-U-R-F) */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900/85 border border-slate-700/70 px-2.5 py-1.5 rounded-xl">
            {(['S', 'U', 'R', 'F'] as const).map((ch) => (
              <span
                key={ch}
                className={`w-6 h-6 rounded-md flex items-center justify-center font-game text-xs font-black transition-all ${
                  metrics.letters[ch]
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                    : 'bg-slate-800 text-slate-500 opacity-50'
                }`}
              >
                {ch}
              </span>
            ))}
          </div>

          {/* Active Multiplier Badge */}
          {metrics.multiplier > 1 && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-300 text-white font-game text-xs font-black px-2.5 py-1.5 rounded-xl shadow-lg">
              <Zap className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
              <span>{metrics.multiplier.toFixed(1)}X SCORE</span>
            </div>
          )}
        </div>

        {/* Right Cluster: Score, Shop, Audio Mute */}
        <div className="flex items-center gap-2.5">
          {/* Live Score Readout */}
          <div className="flex flex-col items-end bg-slate-900/90 border-2 border-sky-500/70 px-4 py-1.5 rounded-2xl shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-300">
              SCORE
            </span>
            <span className="font-game text-white text-xl sm:text-2xl font-black tabular-nums leading-none tracking-wider">
              {metrics.score.toLocaleString()}
            </span>
          </div>

          {/* Shop Button (when in menu or gameover) */}
          {(metrics.state === 'MENU' || metrics.state === 'GAMEOVER') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShop(true);
              }}
              className="p-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 border-2 border-amber-300 text-slate-950 transition-transform active:scale-95 cursor-pointer rounded-2xl shadow-lg flex items-center gap-1.5 font-game font-black text-xs"
              title="Shop & Upgrades"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline">SHOP</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="p-2.5 bg-slate-900/85 border-2 border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-colors cursor-pointer rounded-2xl shadow-lg"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC COMBO TOAST NOTIFICATION */}
      {metrics.comboPopup && (
        <div
          key={metrics.comboPopup.id}
          className="fixed top-18 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-bounce"
        >
          <div
            className="px-6 py-2 rounded-2xl font-game font-black text-lg sm:text-2xl tracking-wide text-slate-950 uppercase shadow-[0_12px_30px_rgba(0,0,0,0.6)] border-3 border-white/95 flex items-center gap-2 transform -rotate-1"
            style={{ backgroundColor: metrics.comboPopup.color }}
          >
            <span>{metrics.comboPopup.text}</span>
          </div>
        </div>
      )}

      {/* 3. ACTIVE POWER-UPS DOCK (Left Edge Floating Badges) */}
      {metrics.state === 'PLAYING' && (
        <div className="px-4 flex flex-col gap-2 max-w-xs pointer-events-none">
          {metrics.activePowerUps.hoverboard > 0 && (
            <div className="flex items-center gap-2 bg-pink-950/85 border border-pink-500/80 text-pink-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md w-fit">
              <Shield className="w-4 h-4 text-pink-400" />
              <span>Hoverboard</span>
              <span className="font-black text-pink-300 tabular-nums">{metrics.activePowerUps.hoverboard}s</span>
            </div>
          )}
          {metrics.activePowerUps.jetpack > 0 && (
            <div className="flex items-center gap-2 bg-orange-950/85 border border-orange-500/80 text-orange-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md w-fit">
              <Rocket className="w-4 h-4 text-orange-400 animate-bounce" />
              <span>Jetpack</span>
              <span className="font-black text-orange-300 tabular-nums">{metrics.activePowerUps.jetpack}s</span>
            </div>
          )}
          {metrics.activePowerUps.superSneakers > 0 && (
            <div className="flex items-center gap-2 bg-emerald-950/85 border border-emerald-500/80 text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md w-fit">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Super Jump</span>
              <span className="font-black text-emerald-300 tabular-nums">{metrics.activePowerUps.superSneakers}s</span>
            </div>
          )}
          {metrics.activePowerUps.magnet > 0 && (
            <div className="flex items-center gap-2 bg-rose-950/85 border border-rose-500/80 text-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md w-fit">
              <Zap className="w-4 h-4 text-rose-400" />
              <span>Coin Magnet</span>
              <span className="font-black text-rose-300 tabular-nums">{metrics.activePowerUps.magnet}s</span>
            </div>
          )}
        </div>
      )}

      {/* 4. MODALS: INTRO CINEMATIC, TITLE SCREEN & GAME OVER */}

      {/* --- CINEMATIC OPENING AT MASAGRAM JUNCTION --- */}
      {metrics.state === 'INTRO' && (
        <div className="m-auto flex flex-col items-center text-center p-6 max-w-md pointer-events-none animate-fadeIn">
          {/* Station Badge */}
          <div className="flex items-center gap-2 bg-amber-400 text-slate-950 px-4 py-1.5 rounded-full font-game font-black text-xs sm:text-sm shadow-xl tracking-wider uppercase mb-2 border border-yellow-200">
            <span>🚉</span>
            <span>MASAGRAM JUNCTION • PLATFORM 1</span>
          </div>

          {/* Big Chase Callout */}
          <div className="text-4xl sm:text-5xl font-game font-black text-white text-shadow-game drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] text-stroke-black animate-pulse">
            POLICE CHASE! 👮‍♂️🐕
          </div>
          <div className="mt-2 text-xs sm:text-sm font-bold text-sky-300 bg-slate-900/80 px-4 py-1 rounded-xl shadow-md border border-slate-700">
            Inspector & Dog in pursuit! Run! 💨
          </div>
        </div>
      )}

      {/* --- TITLE SCREEN --- */}
      {metrics.state === 'MENU' && !showShop && (
        <div className="m-auto flex flex-col items-center text-center p-6 max-w-lg pointer-events-auto">
          {/* Subway Surfers Title Lockup SVG */}
          <div className="relative mb-5 flex flex-col items-center">
            <svg viewBox="0 0 460 120" className="w-80 sm:w-96 drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]">
              <defs>
                <linearGradient id="titleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="surfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>
              <text
                x="230"
                y="52"
                textAnchor="middle"
                fill="url(#titleGrad)"
                stroke="#0f172a"
                strokeWidth="10"
                paintOrder="stroke fill"
                fontFamily="Titan One, Fredoka, Impact"
                fontSize="52"
                fontWeight="900"
                letterSpacing="3"
              >
                SUBWAY
              </text>
              <text
                x="230"
                y="105"
                textAnchor="middle"
                fill="url(#surfGrad)"
                stroke="#0f172a"
                strokeWidth="10"
                paintOrder="stroke fill"
                fontFamily="Titan One, Fredoka, Impact"
                fontSize="56"
                fontWeight="900"
                letterSpacing="4"
              >
                SURFERS
              </text>
            </svg>
            <div className="mt-1 bg-amber-500/95 text-slate-950 font-black font-game text-xs tracking-wider px-3.5 py-1 rounded-full uppercase shadow-md flex items-center gap-1.5">
              <span>🚉</span>
              <span>MASAGRAM JUNCTION • 3D RUNNER</span>
            </div>
          </div>

          {/* High Score Badge & Active Board Info */}
          <div className="mb-5 flex items-center gap-3">
            {metrics.highScore > 0 && (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/50 px-4 py-2 rounded-2xl shadow-lg">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                  HIGH SCORE
                </span>
                <span className="font-game text-white text-lg font-black tabular-nums">
                  {metrics.highScore.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-pink-500/50 px-3.5 py-2 rounded-2xl shadow-lg">
              <span className="text-pink-400 font-bold text-xs uppercase tracking-wider">
                BOARD
              </span>
              <span className="font-game text-white text-xs font-black">
                {metrics.activeBoard}
              </span>
            </div>
          </div>

          {/* Action Buttons: Play + Shop */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartGame();
              }}
              className="group relative cursor-pointer px-10 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-game font-black text-2xl tracking-wider rounded-2xl shadow-[0_10px_25px_rgba(16,185,129,0.5)] active:scale-95 transition-all transform hover:-translate-y-0.5 border-b-4 border-emerald-700"
            >
              <div className="flex items-center gap-3">
                <span>TAP TO RUN!</span>
                <span className="text-xl">🏃💨</span>
              </div>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShop(true);
              }}
              className="cursor-pointer px-6 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-game font-black text-xl tracking-wider rounded-2xl shadow-lg active:scale-95 transition-all border-b-4 border-amber-700 flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>SHOP</span>
            </button>
          </div>

          {/* Control Hint Line */}
          <div className="mt-6 text-xs text-slate-300 font-bold tracking-wide bg-slate-900/85 px-4 py-2 rounded-xl border border-slate-800">
            CONTROLS: ← → Change Lane · ↑ Jump · ↓ Roll/Slide · Space Hoverboard
          </div>
        </div>
      )}

      {/* --- GAME OVER MODAL --- */}
      {metrics.state === 'GAMEOVER' && !showShop && (
        <div className="m-auto flex flex-col items-center text-center p-6 max-w-md bg-slate-900/95 border-2 border-red-500/60 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] pointer-events-auto">
          <div className="text-red-500 font-game text-4xl sm:text-5xl font-black mb-1 drop-shadow-md">
            CAUGHT!
          </div>
          <div className="text-xs text-slate-400 font-semibold mb-6">
            The inspector and guard dog caught up!
          </div>

          {/* Score & Coins Summary */}
          <div className="grid grid-cols-2 gap-3 w-full mb-6">
            <div className="bg-slate-800/85 border border-slate-700 p-3 rounded-2xl flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase">FINAL SCORE</span>
              <span className="font-game text-2xl text-white font-black tabular-nums">{metrics.score.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/85 border border-slate-700 p-3 rounded-2xl flex flex-col items-center">
              <span className="text-[11px] font-bold text-amber-400 uppercase">COINS</span>
              <span className="font-game text-2xl text-amber-300 font-black tabular-nums">+{metrics.coins}</span>
            </div>
          </div>

          {/* High Score Celebration */}
          {metrics.score >= metrics.highScore && metrics.score > 0 && (
            <div className="mb-6 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/60 px-4 py-2 rounded-xl text-amber-300 font-bold text-sm flex items-center gap-2">
              <span>🏆</span>
              <span>NEW HIGH SCORE!</span>
            </div>
          )}

          {/* Action Buttons: Play Again + Shop */}
          <div className="flex flex-col gap-2.5 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartGame();
              }}
              className="w-full cursor-pointer py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-game font-black text-xl rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-emerald-700"
            >
              <RotateCcw className="w-5 h-5" />
              <span>PLAY AGAIN</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShop(true);
              }}
              className="w-full cursor-pointer py-3 bg-slate-800 hover:bg-slate-750 border-2 border-amber-400/70 text-amber-300 font-game font-black text-base rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>SHOP & UPGRADES</span>
            </button>
          </div>
        </div>
      )}

      {/* --- SHOP & CUSTOMIZATION MODAL --- */}
      {showShop && (
        <div className="m-auto w-full max-w-lg p-5 bg-slate-900/98 border-2 border-amber-400/80 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] pointer-events-auto max-h-[85vh] flex flex-col animate-fadeIn">
          {/* Shop Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-amber-400" />
              <h2 className="font-game text-xl sm:text-2xl font-black text-white tracking-wide">
                SURF STORE
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Coin Counter in Shop */}
              <div className="flex items-center gap-1.5 bg-slate-800 border border-amber-400/80 px-3 py-1 rounded-xl">
                <span className="text-amber-400 text-xs font-black">★</span>
                <span className="font-game text-amber-300 font-black tabular-nums">{metrics.coins}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShop(false);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close Store"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-4 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setShopTab('UPGRADES')}
              className={`flex-1 py-2 rounded-xl font-game text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                shopTab === 'UPGRADES'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>POWER-UP UPGRADES</span>
            </button>
            <button
              onClick={() => setShopTab('BOARDS')}
              className={`flex-1 py-2 rounded-xl font-game text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                shopTab === 'BOARDS'
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>HOVERBOARD GARAGE</span>
            </button>
          </div>

          {/* Tab Content 1: Upgrades */}
          {shopTab === 'UPGRADES' && (
            <div className="overflow-y-auto pr-1 flex flex-col gap-3">
              {/* Magnet Upgrade */}
              {(() => {
                const lvl = metrics.upgrades.magnet;
                const cost = getUpgradeCost(lvl);
                const isMax = lvl >= 5;
                const canAfford = metrics.coins >= cost;
                return (
                  <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-game text-sm font-black text-white">COIN MAGNET</div>
                        <div className="text-[11px] text-slate-400 font-semibold">Attracts coins ({10 + lvl * 2}s)</div>
                        {/* Level pips */}
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((idx) => (
                            <div
                              key={idx}
                              className={`w-3.5 h-1.5 rounded-sm ${idx <= lvl ? 'bg-rose-400' : 'bg-slate-700'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpgrade?.('magnet')}
                      disabled={isMax || !canAfford}
                      className={`px-3 py-2 rounded-xl font-game text-xs font-black transition-all cursor-pointer ${
                        isMax
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : canAfford
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:brightness-110 active:scale-95 shadow-md'
                          : 'bg-slate-800 border border-slate-600 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? 'MAX' : `${cost} ★`}
                    </button>
                  </div>
                );
              })()}

              {/* Super Sneakers */}
              {(() => {
                const lvl = metrics.upgrades.sneakers;
                const cost = getUpgradeCost(lvl);
                const isMax = lvl >= 5;
                const canAfford = metrics.coins >= cost;
                return (
                  <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-game text-sm font-black text-white">SUPER SNEAKERS</div>
                        <div className="text-[11px] text-slate-400 font-semibold">High jumps over trains ({10 + lvl * 2}s)</div>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((idx) => (
                            <div
                              key={idx}
                              className={`w-3.5 h-1.5 rounded-sm ${idx <= lvl ? 'bg-emerald-400' : 'bg-slate-700'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpgrade?.('sneakers')}
                      disabled={isMax || !canAfford}
                      className={`px-3 py-2 rounded-xl font-game text-xs font-black transition-all cursor-pointer ${
                        isMax
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : canAfford
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:brightness-110 active:scale-95 shadow-md'
                          : 'bg-slate-800 border border-slate-600 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? 'MAX' : `${cost} ★`}
                    </button>
                  </div>
                );
              })()}

              {/* 2X Multiplier */}
              {(() => {
                const lvl = metrics.upgrades.multiplier;
                const cost = getUpgradeCost(lvl);
                const isMax = lvl >= 5;
                const canAfford = metrics.coins >= cost;
                return (
                  <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-game text-sm font-black text-white">2X MULTIPLIER</div>
                        <div className="text-[11px] text-slate-400 font-semibold">Boosts score ({10 + lvl * 2}s, +{(lvl - 1) * 25}%)</div>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((idx) => (
                            <div
                              key={idx}
                              className={`w-3.5 h-1.5 rounded-sm ${idx <= lvl ? 'bg-cyan-400' : 'bg-slate-700'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpgrade?.('multiplier')}
                      disabled={isMax || !canAfford}
                      className={`px-3 py-2 rounded-xl font-game text-xs font-black transition-all cursor-pointer ${
                        isMax
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : canAfford
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:brightness-110 active:scale-95 shadow-md'
                          : 'bg-slate-800 border border-slate-600 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? 'MAX' : `${cost} ★`}
                    </button>
                  </div>
                );
              })()}

              {/* Jetpack */}
              {(() => {
                const lvl = metrics.upgrades.jetpack;
                const cost = getUpgradeCost(lvl);
                const isMax = lvl >= 5;
                const canAfford = metrics.coins >= cost;
                return (
                  <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400">
                        <Rocket className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-game text-sm font-black text-white">JETPACK FLIGHT</div>
                        <div className="text-[11px] text-slate-400 font-semibold">Rocket into sky coins ({10 + lvl * 2}s)</div>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((idx) => (
                            <div
                              key={idx}
                              className={`w-3.5 h-1.5 rounded-sm ${idx <= lvl ? 'bg-orange-400' : 'bg-slate-700'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpgrade?.('jetpack')}
                      disabled={isMax || !canAfford}
                      className={`px-3 py-2 rounded-xl font-game text-xs font-black transition-all cursor-pointer ${
                        isMax
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : canAfford
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110 active:scale-95 shadow-md'
                          : 'bg-slate-800 border border-slate-600 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? 'MAX' : `${cost} ★`}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tab Content 2: Hoverboard Garage */}
          {shopTab === 'BOARDS' && (
            <div className="overflow-y-auto pr-1 flex flex-col gap-3">
              {/* Buy Board Pack */}
              <div className="bg-gradient-to-r from-pink-950/60 to-purple-950/60 border border-pink-500/50 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400 flex items-center justify-center text-pink-300">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-game text-sm font-black text-pink-200">
                      HOVERBOARD SUPPLY
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Current Inventory: <span className="font-black text-pink-300">×{metrics.hoverboardInventory}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onBuyHoverboard?.()}
                  disabled={metrics.coins < 250}
                  className={`px-3 py-2 rounded-xl font-game text-xs font-black transition-all cursor-pointer ${
                    metrics.coins >= 250
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:brightness-110 active:scale-95 shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  +3 BOARDS (250 ★)
                </button>
              </div>

              {/* Board Skins Selector */}
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                SELECT HOVERBOARD SKIN:
              </div>

              {BOARD_SKINS.map((b) => {
                const isSelected = metrics.activeBoard === b.id;
                return (
                  <div
                    key={b.id}
                    className={`bg-slate-800/80 border-2 rounded-2xl p-3 flex items-center justify-between transition-all ${
                      isSelected ? `${b.border} shadow-lg` : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${b.colors} border ${b.border} shadow-inner flex items-center justify-center`}>
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-game text-sm font-black text-white flex items-center gap-1.5">
                          <span>{b.name}</span>
                          {isSelected && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 px-1.5 py-0.5 rounded">EQUIPPED</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">{b.desc}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectBoard?.(b.id)}
                      disabled={isSelected}
                      className={`px-3 py-1.5 rounded-xl font-game text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 cursor-default'
                          : 'bg-slate-700 hover:bg-slate-600 text-white active:scale-95 shadow-sm'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>ACTIVE</span>
                        </>
                      ) : (
                        <span>EQUIP</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Shop Footer Return Button */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => setShowShop(false)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-game text-xs font-black rounded-xl transition-colors cursor-pointer"
            >
              DONE
            </button>
          </div>
        </div>
      )}

      {/* 5. BOTTOM INTERACTION BAR: MOBILE BUTTONS & HOVERBOARD TRIGGER */}
      {metrics.state === 'PLAYING' && (
        <div className="w-full flex items-end justify-between p-3 sm:p-5 pointer-events-auto">
          {/* Left: Move Left & Move Right Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveLeft();
              }}
              className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-sky-600 border-2 border-sky-400/70 text-white flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer"
              title="Move Left"
            >
              <ArrowLeft className="w-6 h-6 text-sky-300" />
              <span className="text-[9px] font-black uppercase text-sky-200">LEFT</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveRight();
              }}
              className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-sky-600 border-2 border-sky-400/70 text-white flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer"
              title="Move Right"
            >
              <ArrowRight className="w-6 h-6 text-sky-300" />
              <span className="text-[9px] font-black uppercase text-sky-200">RIGHT</span>
            </button>
          </div>

          {/* Center: Hoverboard Activation Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHoverboard();
            }}
            disabled={metrics.activePowerUps.hoverboard > 0 || metrics.hoverboardInventory <= 0}
            className={`group flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 transition-all cursor-pointer shadow-xl active:scale-95 ${
              metrics.activePowerUps.hoverboard > 0
                ? 'bg-pink-900/80 border-pink-400 text-pink-200'
                : metrics.hoverboardInventory > 0
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-300 text-white hover:brightness-110'
                : 'bg-slate-800/80 border-slate-700 text-slate-500 opacity-60 cursor-not-allowed'
            }`}
          >
            <Shield className="w-5 h-5 text-white" />
            <div className="flex flex-col text-left">
              <span className="font-game text-xs font-black leading-tight">
                HOVERBOARD
              </span>
              <span className="text-[10px] font-bold text-pink-200">
                {metrics.activePowerUps.hoverboard > 0
                  ? `${metrics.activePowerUps.hoverboard}s`
                  : `×${metrics.hoverboardInventory}`}
              </span>
            </div>
          </button>

          {/* Right: Roll / Slide & Jump Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSlide();
              }}
              className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-amber-600 border-2 border-amber-400/80 text-amber-300 flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer"
              title="Slide / Roll"
            >
              <ArrowDown className="w-6 h-6 text-amber-300" />
              <span className="text-[9px] font-black uppercase text-amber-200">ROLL</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJump();
              }}
              className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-emerald-600 border-2 border-emerald-400/80 text-emerald-300 flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer"
              title="Jump"
            >
              <ArrowUp className="w-6 h-6 text-emerald-300" />
              <span className="text-[9px] font-black uppercase text-emerald-200">JUMP</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
