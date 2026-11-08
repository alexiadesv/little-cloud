import { useEffect, useRef } from 'react';
import { game } from '../game/controller';
import { useGame } from '../game/store';

/** Hosts the 3D canvas and keeps the camera framing clear of the HUD. */
export function GameStage() {
  const ref = useRef<HTMLDivElement>(null);
  const screen = useGame((s) => s.screen);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    let cleanup: (() => void) | null = null;
    let cancelled = false;
    void game.mount(container).then((dispose) => {
      if (cancelled) dispose();
      else cleanup = dispose;
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const small = w < 640;
      const mid = w < 1024;
      if (screen === 'title') {
        // Frame map + cloud in the right column (matches TitleScreen ~26rem text panel).
        const leftPanel = Math.min(Math.round(w * 0.4), 416);
        if (small) game.setInsets(Math.round(window.innerHeight * 0.52), 72, 16, 16);
        else if (mid) game.setInsets(36, 48, leftPanel, Math.round(w * 0.04));
        else game.setInsets(40, 48, leftPanel, Math.round(w * 0.05));
      } else if (screen === 'apartment') {
        game.setInsets(small ? 64 : 24, small ? 168 : 156);
      } else {
        game.setInsets(small ? 64 : 24, small ? 118 : 112);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [screen]);

  return <div ref={ref} className="absolute inset-0" aria-label="Little Cloud storybook scene" role="application" />;
}
