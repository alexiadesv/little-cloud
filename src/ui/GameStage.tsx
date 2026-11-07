import { useEffect, useRef } from 'react';
import { game } from '../game/controller';
import { LEVELS } from '../data/levels';
import { useGame } from '../game/store';
import { isCrowded } from './DiscoveryTray';

/** Hosts the 3D canvas and keeps the camera framing clear of the HUD. */
export function GameStage() {
  const ref = useRef<HTMLDivElement>(null);
  const screen = useGame((s) => s.screen);
  const twoRowTray = useGame((s) => isCrowded(LEVELS[s.levelIndex].objects.length));

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
      const small = window.innerWidth < 640;
      // The HUD sits in the corners up top, so the scene can reach almost to the top edge.
      if (screen === 'title') game.setInsets(small ? 30 : 40, small ? 30 : 40);
      else game.setInsets(small ? 64 : 24, (small ? 118 : 112) + (twoRowTray ? 52 : 0));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [screen, twoRowTray]);

  return <div ref={ref} className="absolute inset-0" aria-label="Little Cloud storybook scene" role="application" />;
}
