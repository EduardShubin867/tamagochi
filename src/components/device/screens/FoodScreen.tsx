import type { PetState } from '../../../game';
import { IconVisual } from '../../visuals/IconVisual';
import type { GameActions } from '../types';

const FOOD_OPTIONS = [
  { name: 'Подкормка', note: '+28 сытости', index: 0 },
  { name: 'Глоток вина', note: '+13 радости', index: 5 },
] as const;

export function FoodScreen({
  state,
  actions,
  retro = false,
}: {
  state: PetState;
  actions: GameActions;
  retro?: boolean;
}) {
  return (
    <div className="screen-page food-screen">
      <div className="screen-topline">
        <span>ЧЕМ УГОСТИТЬ?</span>
        <span>{state.foodIndex + 1}/2</span>
      </div>
      {FOOD_OPTIONS.map((item, index) => (
        <button
          key={item.name}
          className={state.foodIndex === index ? 'selected' : ''}
          onClick={() => actions.feed(index ? 'snack' : 'meal')}
        >
          <IconVisual index={item.index} retro={retro} />
          <span>
            <b>{item.name}</b>
            <small>{item.note}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
