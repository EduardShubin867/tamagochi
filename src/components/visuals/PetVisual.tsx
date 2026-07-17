import type { CSSProperties } from 'react';
import type { IdleBehavior, PetReaction } from '../../app/petPresentation';
import { type PetState, SPECIES, STAGE_LABELS, type SpeciesId, spriteIndex } from '../../game';
import { PixelArt } from './PixelArt';
import { retroPetPixels } from './pixelMatrices';

interface PetVisualProps {
  state: PetState;
  compact?: boolean;
  retro?: boolean;
  speciesOverride?: SpeciesId;
  spriteOverride?: number;
  reaction?: PetReaction | null;
  idleBehavior?: IdleBehavior | null;
  onInteract?: () => void;
}

function PetSprite({
  state,
  compact = false,
  speciesOverride,
  spriteOverride,
  reaction,
  idleBehavior,
  onInteract,
}: Omit<PetVisualProps, 'retro'>) {
  const index = spriteOverride ?? spriteIndex(state);
  const species = speciesOverride ?? state.species;
  const speciesData = SPECIES.find((item) => item.id === species) ?? SPECIES[0];
  const idleAtlas =
    idleBehavior && !reaction && !state.asleep && index >= 2 && index <= 7
      ? index <= 4
        ? speciesData.idleAtlases?.young
        : speciesData.idleAtlases?.mature
      : undefined;
  const atlas = idleAtlas ?? (state.asleep && speciesData.sleepAtlas ? speciesData.sleepAtlas : speciesData.atlas);
  const column = index % 3;
  const row = Math.floor(index / 3);
  const atlasRowPosition = state.asleep && speciesData.sleepAtlas ? row * 50 : ([0, 43.7, 93.2][row] ?? row * 50);
  const idleRow = index <= 4 ? index - 2 : index - 5;
  const idleRowPosition = idleRow * 50;
  const className = `pet-sprite ${compact ? 'compact' : ''} ${state.asleep ? 'sleeping' : ''} ${onInteract ? 'pet-interactive' : ''} ${idleAtlas ? 'idle-sprite-active' : ''}`;
  const style = {
    backgroundImage: `url('${atlas}')`,
    backgroundPosition: idleAtlas
      ? `var(--sprite-x, 0%) var(--sprite-y, ${idleRowPosition}%)`
      : `var(--sprite-x, ${column * 50}%) var(--sprite-y, ${atlasRowPosition}%)`,
    ...(idleAtlas
      ? {
          backgroundSize: '400% 300%',
          '--idle-sprite-y': `${idleRowPosition}%`,
        }
      : {}),
  } as CSSProperties;

  if (onInteract) {
    return (
      <button
        type="button"
        className={className}
        data-species={species}
        data-sprite={index}
        data-reaction={reaction?.kind}
        data-idle={idleBehavior ?? undefined}
        style={style}
        onClick={onInteract}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            onInteract();
          }
        }}
        aria-label={`Поговорить с ${state.name}`}
        title={`Поговорить с ${state.name}`}
      />
    );
  }

  return (
    <div
      className={className}
      data-species={species}
      data-sprite={index}
      data-reaction={reaction?.kind}
      data-idle={idleBehavior ?? undefined}
      style={style}
      role="img"
      aria-label={`${state.name}, ${STAGE_LABELS[state.stage]}`}
    />
  );
}

export function PetVisual({
  state,
  compact = false,
  retro = false,
  speciesOverride,
  spriteOverride,
  reaction,
  idleBehavior,
  onInteract,
}: PetVisualProps) {
  const species = speciesOverride ?? state.species;
  const index = spriteOverride ?? spriteIndex(state);
  if (retro) {
    return (
      <PixelArt
        map={retroPetPixels(species, index, state.asleep)}
        className={`pixel-pet ${compact ? 'compact' : ''} ${state.asleep ? 'sleeping' : ''}`}
        label={`${state.name}, ${STAGE_LABELS[state.stage]}`}
      />
    );
  }
  return (
    <PetSprite
      state={state}
      compact={compact}
      speciesOverride={species}
      spriteOverride={index}
      reaction={reaction}
      idleBehavior={idleBehavior}
      onInteract={onInteract}
    />
  );
}
