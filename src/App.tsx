import { GameStage } from './ui/GameStage';
import { Hud } from './ui/Hud';
import { LoadingVeil } from './ui/LoadingVeil';
import { PageComplete } from './ui/PageComplete';
import { PaperGrain } from './ui/PaperGrain';
import { TitleScreen } from './ui/TitleScreen';
import { WordCard } from './ui/WordCard';
import { useGame } from './game/store';

export function App() {
  const screen = useGame((s) => s.screen);
  const engineError = useGame((s) => s.engineError);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-paper text-ink select-none">
      <GameStage />
      <PaperGrain />
      {screen === 'playing' && <Hud />}
      <WordCard />
      <PageComplete />
      <LoadingVeil />
      {screen === 'title' && <TitleScreen />}
      {engineError && (
        <div className="absolute inset-0 z-50 grid place-items-center p-6">
          <p className="paper max-w-md rounded-3xl px-8 py-6 text-center text-lg text-ink-soft">{engineError}</p>
        </div>
      )}
    </main>
  );
}
