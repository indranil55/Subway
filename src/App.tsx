import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SubwayEngine, GameMetrics } from './game/engine';
import { sound } from './game/audio';
import { GameHUD } from './components/GameHUD';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SubwayEngine | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<GameMetrics>({
    state: 'MENU',
    score: 0,
    highScore: 0,
    coins: 0,
    speed: 0,
    multiplier: 1,
    letters: { S: false, U: false, R: false, F: false },
    activePowerUps: {
      magnet: 0,
      superSneakers: 0,
      multiplier: 0,
      jetpack: 0,
      hoverboard: 0,
    },
    hoverboardInventory: 3,
    activeBoard: 'STAR',
    upgrades: {
      magnet: 1,
      jetpack: 1,
      sneakers: 1,
      multiplier: 1,
    },
    comboPopup: null,
  });

  // Touch & Pointer tracking
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  // Initialize 3D Engine once
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new SubwayEngine(mountRef.current);
    engineRef.current = engine;

    engine.onMetricsUpdate = (newMetrics) => {
      setMetrics({ ...newMetrics });
    };

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        engine.moveLeft();
      } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        engine.moveRight();
      } else if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (engine.state === 'MENU' || engine.state === 'GAMEOVER') {
          engine.startGame();
        } else {
          engine.jump();
        }
      } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        engine.slide();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (engine.state === 'MENU' || engine.state === 'GAMEOVER') {
          engine.startGame();
        } else {
          engine.jump();
        }
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        engine.activateHoverboard();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        if (engine.state === 'MENU' || engine.state === 'GAMEOVER') {
          engine.startGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Unified Pointer (Touch & Mouse Drag) Gesture Handlers
  const handlePointerDown = useCallback((clientX: number, clientY: number) => {
    const now = Date.now();

    // Double tap triggers hoverboard
    if (now - lastTapRef.current < 280) {
      engineRef.current?.activateHoverboard();
    }
    lastTapRef.current = now;

    pointerStartRef.current = {
      x: clientX,
      y: clientY,
      time: now,
    };
  }, []);

  const handlePointerUp = useCallback((clientX: number, clientY: number) => {
    if (!pointerStartRef.current) return;
    const start = pointerStartRef.current;
    const dx = clientX - start.x;
    const dy = clientY - start.y;
    const dt = Date.now() - start.time;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const swipeThreshold = 20; // Sensitive flick detection
    const engine = engineRef.current;
    if (!engine) return;

    // In Menu or Game Over, any tap starts game
    if (engine.state === 'MENU' || engine.state === 'GAMEOVER') {
      if (dt < 350 && absDx < 30 && absDy < 30) {
        engine.startGame();
      }
      pointerStartRef.current = null;
      return;
    }

    // Active gameplay: check swipe vs tap
    if (absDx > swipeThreshold || absDy > swipeThreshold) {
      if (absDx > absDy) {
        // Horizontal swipe:
        // dx > 0 means swiped RIGHT on screen -> Move Right
        // dx < 0 means swiped LEFT on screen -> Move Left
        if (dx > 0) {
          engine.moveRight();
        } else {
          engine.moveLeft();
        }
      } else {
        // Vertical swipe:
        // dy < 0 means swiped UP on screen -> Jump
        // dy > 0 means swiped DOWN on screen -> Roll/Slide
        if (dy < 0) {
          engine.jump();
        } else {
          engine.slide();
        }
      }
    } else {
      // Tap without dragging:
      // Tap on right side of screen -> Move Right
      // Tap on left side of screen -> Move Left
      // Tap in center upper area -> Jump
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      if (clientX > screenW * 0.58) {
        engine.moveRight();
      } else if (clientX < screenW * 0.42) {
        engine.moveLeft();
      } else if (clientY < screenH * 0.5) {
        engine.jump();
      } else {
        engine.slide();
      }
    }

    pointerStartRef.current = null;
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      sound.setMute(next);
      return next;
    });
  }, []);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-sky-400 font-sans select-none touch-none"
      onTouchStart={(e) => {
        const t = e.touches[0];
        handlePointerDown(t.clientX, t.clientY);
      }}
      onTouchEnd={(e) => {
        const t = e.changedTouches[0];
        handlePointerUp(t.clientX, t.clientY);
      }}
      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
      onMouseUp={(e) => handlePointerUp(e.clientX, e.clientY)}
    >
      {/* Isolated Three.js WebGL Mount Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Non-Occluding Game HUD & Modals */}
      <GameHUD
        metrics={metrics}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onStartGame={() => engineRef.current?.startGame()}
        onMoveLeft={() => engineRef.current?.moveLeft()}
        onMoveRight={() => engineRef.current?.moveRight()}
        onJump={() => engineRef.current?.jump()}
        onSlide={() => engineRef.current?.slide()}
        onHoverboard={() => engineRef.current?.activateHoverboard()}
        onSelectBoard={(skin) => engineRef.current?.setBoardSkin(skin)}
        onUpgrade={(type) => engineRef.current?.upgradePowerUp(type)}
        onBuyHoverboard={() => engineRef.current?.buyHoverboard(3)}
      />
    </div>
  );
}
