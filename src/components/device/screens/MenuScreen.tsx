import { type PetState, MENU } from '../../../game';
import { IconVisual } from '../../visuals/IconVisual';
import type { GameActions } from '../types';

export function MenuScreen({
  state,
  actions,
  retro = false,
}: {
  state: PetState;
  actions: GameActions;
  retro?: boolean;
}) {
  return (
    <div className="screen-page menu-screen">
      <div className="screen-topline">
        <span>УХОД</span>
        <span>{state.menuIndex + 1}/8</span>
      </div>
      <div className="screen-menu-grid">
        {MENU.map((item, index) => (
          <button
            key={item.id}
            className={index === state.menuIndex ? 'selected' : ''}
            onClick={() => actions.act(item.id)}
            aria-label={`${item.label}: ${item.hint}`}
            title={`${item.label}: ${item.hint}`}
          >
            <IconVisual index={item.icon} retro={retro} />
          </button>
        ))}
      </div>
      <div className="screen-caption">
        <strong>{MENU[state.menuIndex].label}</strong>
        <span>{MENU[state.menuIndex].hint}</span>
      </div>
    </div>
  );
}
