import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import type { PetState } from '../../../game';
import { PetVisual } from '../../visuals/PetVisual';
import type { GameActions } from '../types';

export function GameScreen({
  state,
  actions,
  retro = false,
}: {
  state: PetState;
  actions: GameActions;
  retro?: boolean;
}) {
  const game = state.miniGame;
  if (!game) return null;

  return (
    <div className="screen-page game-screen">
      <div className="screen-topline">
        <span>ПРЫЖОК {game.round}/5</span>
        <span className="game-score">
          {game.score}
          {!retro && <Star aria-hidden="true" fill="currentColor" />}
        </span>
      </div>
      <PetVisual state={state} compact retro={retro} />
      <p>{game.phase === 'result' ? game.result : `Куда прыгнет ${state.name}?`}</p>
      <div className="game-choices">
        {[0, 1].map((choice) => (
          <button
            key={choice}
            className={game.cursor === choice ? 'selected' : ''}
            onClick={() => game.phase === 'choose' && actions.press(choice === game.cursor ? 'b' : 'a')}
          >
            {retro ? (
              choice === 0 ? (
                '←'
              ) : (
                '→'
              )
            ) : choice === 0 ? (
              <ArrowLeft aria-hidden="true" />
            ) : (
              <ArrowRight aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
