import { type PetState, SPECIES } from '../../../game';
import { PetVisual } from '../../visuals/PetVisual';
import type { GameActions } from '../types';

export function SpeciesScreen({
  state,
  actions,
  retro = false,
}: {
  state: PetState;
  actions: GameActions;
  retro?: boolean;
}) {
  const selected = SPECIES[state.speciesIndex] ?? SPECIES[0];
  return (
    <div className="screen-page species-screen">
      <div className="screen-topline">
        <span>ЖИВОЙ КОРЕНЬ</span>
        <span>
          {state.speciesIndex + 1}/{SPECIES.length}
        </span>
      </div>
      <div className="species-grid">
        {SPECIES.map((species, index) => (
          <button
            key={species.id}
            className={index === state.speciesIndex ? 'selected' : ''}
            onClick={() => actions.selectSpecies(species.id)}
            aria-label={`Выбрать: ${species.name}`}
          >
            <PetVisual state={state} retro={retro} speciesOverride={species.id} spriteOverride={2} />
            <span>{species.shortName}</span>
          </button>
        ))}
      </div>
      <div className="species-caption">
        <b>{selected.name}</b>
        <span>{selected.trait}</span>
      </div>
    </div>
  );
}
