import { type PetState, SPECIES, createPet, simulateOffline } from '../game';

export const SAVE_KEY = 'lumi-pocket-pet-v3';
export const ONBOARDING_KEY = 'lumi-onboarding-seen-v1';

export function loadPet(): PetState {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') as PetState | null;
    if (saved?.version === 3) {
      const legacyNames = ['Луми', 'Моки', 'Плюх', 'Искра'];
      return simulateOffline({
        ...createPet(saved.sound),
        ...saved,
        name: legacyNames.includes(saved.name) ? SPECIES[0].defaultName : saved.name,
        species: 'mandrake',
        speciesIndex: 0,
        screen: saved.screen === 'select' ? 'select' : 'home',
        miniGame: null,
      });
    }
  } catch (error) {
    console.warn('Не удалось прочитать сохранение', error);
  }
  return createPet();
}

export function createSelectedMandrake(sound = true): PetState {
  const pet = createPet(sound);
  return {
    ...pet,
    name: SPECIES[0].defaultName,
    species: SPECIES[0].id,
    speciesIndex: 0,
    screen: 'home',
    lastTickAt: Date.now(),
  };
}
