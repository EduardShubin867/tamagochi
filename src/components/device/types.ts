import type { ActionId, SpeciesId } from '../../game';

export type DeviceButton = 'a' | 'b' | 'c';

export interface GameActions {
  act: (action: ActionId) => void;
  feed: (kind: 'meal' | 'snack') => void;
  interactPet: () => void;
  press: (button: DeviceButton) => void;
  chooseGame: () => void;
  selectSpecies: (species: SpeciesId) => void;
}
