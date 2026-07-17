import type { PetState } from '../../game';
import type { IdleBehavior, PetReaction } from '../../app/petPresentation';
import { ClockScreen } from './screens/ClockScreen';
import { FoodScreen } from './screens/FoodScreen';
import { GameScreen } from './screens/GameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MenuScreen } from './screens/MenuScreen';
import { SpeciesScreen } from './screens/SpeciesScreen';
import { StatusScreen } from './screens/StatusScreen';
import type { GameActions } from './types';

export function DeviceScreen({
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
  if (state.screen === 'select') return <SpeciesScreen state={state} actions={actions} retro={retro} />;
  if (state.screen === 'menu') return <MenuScreen state={state} actions={actions} retro={retro} />;
  if (state.screen === 'food') return <FoodScreen state={state} actions={actions} retro={retro} />;
  if (state.screen === 'status') return <StatusScreen state={state} />;
  if (state.screen === 'clock') return <ClockScreen state={state} retro={retro} />;
  if (state.screen === 'game' && state.miniGame) return <GameScreen state={state} actions={actions} retro={retro} />;
  return (
    <HomeScreen
      state={state}
      message={message}
      actions={actions}
      reaction={reaction}
      idleBehavior={idleBehavior}
      retro={retro}
    />
  );
}
