import type { IdleBehavior, PetReaction } from '../../../app/petPresentation';
import { type PetState, NEED_LABELS } from '../../../game';
import { PetVisual } from '../../visuals/PetVisual';
import type { GameActions } from '../types';

export function HomeScreen({
  state,
  message,
  actions,
  reaction,
  idleBehavior,
  retro = false,
}: {
  state: PetState;
  message: string;
  actions: GameActions;
  reaction?: PetReaction | null;
  idleBehavior?: IdleBehavior | null;
  retro?: boolean;
}) {
  const callout = state.dead
    ? 'Мой шнурок защитит тебя…'
    : message ||
      (state.callReason
        ? NEED_LABELS[state.callReason]
        : state.stage === 'egg'
          ? 'Не вздумай меня вырывать!'
          : state.asleep
            ? 'Тихо ворчит во сне…'
            : 'Чего уставился?');
  const hasLongCallout = callout.length > 40;

  return (
    <div
      className={`screen-page home-screen ${state.lightsOff ? 'lights-off' : ''} ${hasLongCallout ? 'long-callout' : ''}`}
    >
      <div className="screen-topline">
        <span>{state.name.toUpperCase()}</span>
        <span>ДЕНЬ {state.ageDays + 1}</span>
      </div>
      <div className="pet-stage" data-reaction={reaction?.kind}>
        <PetVisual
          state={state}
          reaction={reaction}
          idleBehavior={idleBehavior}
          onInteract={state.dead ? undefined : actions.interactPet}
          retro={retro}
        />
        {reaction && (
          <span className="pet-reaction-effect" data-kind={reaction.kind} key={reaction.id} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
        {state.asleep && <span className="zzz">z z z</span>}
        {state.dead && <button className="screen-primary">B — новый корень</button>}
      </div>
      <div className={`speech ${state.callReason ? 'urgent' : ''}`} aria-live="polite">
        {callout}
      </div>
    </div>
  );
}
