import { actionLabels } from './mandrakeCopy';

export type Stage = 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'elder';
export type Form = 'egg' | 'hatchling' | 'baby' | 'ears' | 'star' | 'angel' | 'grump' | 'elder';
export type Need = 'hungry' | 'sad' | 'dirty' | 'sick' | 'sleepy' | 'attention';
export type SpeciesId = 'mandrake';
export type Screen = 'select' | 'home' | 'menu' | 'food' | 'status' | 'clock' | 'game';
export type ActionId = 'food' | 'game' | 'clean' | 'medicine' | 'light' | 'status' | 'discipline' | 'clock';

export interface MiniGame {
  round: number;
  score: number;
  cursor: 0 | 1;
  petChoice: 0 | 1;
  phase: 'choose' | 'result';
  result: string;
}

export interface PetState {
  version: 3;
  name: string;
  species: SpeciesId;
  speciesIndex: number;
  lastTickAt: number;
  lifetimeSeconds: number;
  stage: Stage;
  form: Form;
  ageDays: number;
  hunger: number;
  happiness: number;
  health: number;
  energy: number;
  hygiene: number;
  discipline: number;
  weight: number;
  poops: number;
  sick: boolean;
  asleep: boolean;
  lightsOff: boolean;
  dead: boolean;
  paused: boolean;
  careMistakes: number;
  gamesWon: number;
  gamesLost: number;
  meals: number;
  nextPoopIn: number;
  nextCallIn: number;
  nextSicknessCheckIn: number;
  callReason: Need | null;
  sound: boolean;
  screen: Screen;
  menuIndex: number;
  foodIndex: 0 | 1;
  statusPage: number;
  miniGame: MiniGame | null;
}

export const STAGE_LABELS: Record<Stage, string> = {
  egg: 'Корневой кокон',
  baby: 'Росток',
  child: 'Молодой корень',
  teen: 'Колючий нрав',
  adult: 'Живой талисман',
  elder: 'Древний корень',
};

export const SPECIES: { id: SpeciesId; name: string; shortName: string; defaultName: string; trait: string; atlas: string; sleepAtlas?: string }[] = [
  { id: 'mandrake', name: 'Живая мандрагора', shortName: 'Мандрагора', defaultName: 'Корча', trait: 'язвительная, сварливая и верная', atlas: '/assets/pet-atlas-mandrake.png', sleepAtlas: '/assets/pet-atlas-mandrake-sleep.png' },
];

export const NEED_LABELS: Record<Need, string> = {
  hungry: 'Хочу перекусить!',
  sad: 'Поиграем?',
  dirty: 'Пора прибраться',
  sick: 'Мне нездоровится…',
  sleepy: 'Хочу спать',
  attention: 'Эй, я тут!',
};

export const MENU: { id: ActionId; label: string; icon: number; hint: string }[] = [
  { id: 'food', ...actionLabels.food, icon: 0 },
  { id: 'game', ...actionLabels.game, icon: 1 },
  { id: 'clean', ...actionLabels.clean, icon: 2 },
  { id: 'medicine', ...actionLabels.medicine, icon: 3 },
  { id: 'light', ...actionLabels.light, icon: 4 },
  { id: 'status', ...actionLabels.status, icon: 5 },
  { id: 'discipline', ...actionLabels.discipline, icon: 6 },
  { id: 'clock', ...actionLabels.clock, icon: 7 },
];

export const FAST_MODE = new URLSearchParams(window.location.search).has('fast');
export const GAME_HOUR_SECONDS = FAST_MODE ? 50 : 15 * 60;
export const AGE_DAY_SECONDS = GAME_HOUR_SECONDS * 24;
export const HATCH_SECONDS = FAST_MODE ? 12 : 45;

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const randomIn = (min: number, max: number) => Math.floor(min + Math.random() * (max - min));

export function createPet(sound = true): PetState {
  return {
    version: 3,
    name: 'Корча',
    species: 'mandrake',
    speciesIndex: 0,
    lastTickAt: Date.now(),
    lifetimeSeconds: 0,
    stage: 'egg',
    form: 'egg',
    ageDays: 0,
    hunger: 84,
    happiness: 78,
    health: 100,
    energy: 86,
    hygiene: 100,
    discipline: 45,
    weight: 4.8,
    poops: 0,
    sick: false,
    asleep: false,
    lightsOff: false,
    dead: false,
    paused: false,
    careMistakes: 0,
    gamesWon: 0,
    gamesLost: 0,
    meals: 0,
    nextPoopIn: FAST_MODE ? randomIn(70, 110) : randomIn(1100, 1900),
    nextCallIn: FAST_MODE ? randomIn(45, 80) : randomIn(600, 1100),
    nextSicknessCheckIn: FAST_MODE ? 90 : 680,
    callReason: null,
    sound,
    screen: 'select',
    menuIndex: 0,
    foodIndex: 0,
    statusPage: 0,
    miniGame: null,
  };
}

export function spriteIndex(state: PetState) {
  if (state.dead) return 8;
  const byForm: Record<Form, number> = {
    egg: 0,
    hatchling: 1,
    baby: 2,
    ears: 3,
    star: 4,
    angel: 5,
    grump: 6,
    elder: 7,
  };
  return byForm[state.form];
}

function evolve(state: PetState) {
  if (state.stage === 'egg' && state.lifetimeSeconds >= HATCH_SECONDS) {
    state.stage = 'baby';
    state.form = 'hatchling';
    state.hunger = 74;
    state.happiness = 78;
  }
  if (state.stage === 'baby' && state.ageDays >= 1) {
    state.stage = 'child';
    state.form = state.careMistakes <= 3 ? 'baby' : 'grump';
  }
  if (state.stage === 'child' && state.ageDays >= 3) {
    state.stage = 'teen';
    state.form = state.discipline >= 45 ? 'ears' : 'grump';
  }
  if (state.stage === 'teen' && state.ageDays >= 6) {
    state.stage = 'adult';
    state.form = state.careMistakes <= 5 && state.discipline >= 60 ? 'angel' : state.careMistakes <= 9 ? 'star' : 'grump';
  }
  if (state.stage === 'adult' && state.ageDays >= 13) {
    state.stage = 'elder';
    state.form = 'elder';
  }
}

export function advanceSecond(previous: PetState): PetState {
  if (previous.screen === 'select') return { ...previous, lastTickAt: Date.now() };
  if (previous.paused || previous.dead) return { ...previous, lastTickAt: Date.now() };
  const state = { ...previous, lifetimeSeconds: previous.lifetimeSeconds + 1, lastTickAt: Date.now() };

  if (state.stage === 'egg') {
    evolve(state);
    return state;
  }

  state.ageDays = Math.max(0, Math.floor((state.lifetimeSeconds - HATCH_SECONDS) / AGE_DAY_SECONDS));
  const fast = FAST_MODE ? 7 : 1;
  const ageFactor = state.stage === 'baby' || state.stage === 'elder' ? 1.25 : 1;

  if (state.asleep) {
    state.energy = clamp(state.energy + 0.011 * fast);
    state.hunger = clamp(state.hunger - 0.002 * fast);
    if (!state.lightsOff) state.health = clamp(state.health - 0.002 * fast);
  } else {
    state.hunger = clamp(state.hunger - 0.005 * fast * ageFactor);
    state.happiness = clamp(state.happiness - 0.0028 * fast * ageFactor);
    state.energy = clamp(state.energy - 0.0032 * fast * ageFactor);
  }

  if (state.poops > 0) {
    state.hygiene = clamp(state.hygiene - 0.006 * fast * state.poops);
    state.health = clamp(state.health - 0.0014 * fast * state.poops);
  }
  if (state.hunger < 6 || state.happiness < 5 || state.sick) state.health = clamp(state.health - 0.004 * fast);

  state.nextPoopIn -= 1;
  if (state.nextPoopIn <= 0 && state.poops < 4) {
    state.poops += 1;
    state.hygiene = clamp(state.hygiene - 12);
    state.nextPoopIn = FAST_MODE ? randomIn(100, 170) : randomIn(1300, 2400);
  }

  state.nextSicknessCheckIn -= 1;
  if (state.nextSicknessCheckIn <= 0) {
    const risk = ((100 - state.hygiene) / 900) + state.poops * 0.018 + ((100 - state.health) / 1200);
    if (!state.sick && Math.random() < risk) state.sick = true;
    state.nextSicknessCheckIn = FAST_MODE ? randomIn(90, 150) : randomIn(650, 1200);
  }

  state.nextCallIn -= 1;
  if (state.nextCallIn <= 0) {
    if (state.callReason) {
      state.careMistakes += 1;
      state.health = clamp(state.health - 3);
      state.callReason = null;
    } else if (!state.asleep) {
      const needs: Need[] = [];
      if (state.hunger < 45) needs.push('hungry');
      if (state.happiness < 42) needs.push('sad');
      if (state.energy < 28) needs.push('sleepy');
      if (state.poops > 0) needs.push('dirty');
      if (state.sick) needs.push('sick');
      state.callReason = needs.length ? needs[randomIn(0, needs.length)] : Math.random() < 0.32 ? 'attention' : null;
    }
    state.nextCallIn = FAST_MODE ? randomIn(50, 95) : randomIn(650, 1200);
  }

  const hour = Math.floor((state.lifetimeSeconds / GAME_HOUR_SECONDS) % 24);
  const sleepTime = hour >= 21 || hour < 7;
  if (sleepTime && state.energy < 72) state.asleep = true;
  if (!sleepTime && state.asleep && state.energy > 74) {
    state.asleep = false;
    state.lightsOff = false;
  }

  evolve(state);
  if (state.health <= 0 || (state.hunger <= 0 && state.health < 12)) {
    state.dead = true;
    state.asleep = false;
    state.lightsOff = false;
    state.callReason = null;
    state.screen = 'home';
  }
  return state;
}

export function simulateOffline(state: PetState) {
  if (state.paused || state.dead || state.screen === 'select') return { ...state, lastTickAt: Date.now() };
  const elapsed = Math.min(72 * 60 * 60, Math.max(0, Math.floor((Date.now() - state.lastTickAt) / 1000)));
  if (elapsed < 2) return state;
  let next = state;
  for (let second = 0; second < elapsed && !next.dead; second += 1) next = advanceSecond(next);
  return { ...next, lastTickAt: Date.now() };
}

export const petHour = (state: PetState) => Math.floor((state.lifetimeSeconds / GAME_HOUR_SECONDS) % 24);
export const petMinute = (state: PetState) => Math.floor(((state.lifetimeSeconds % GAME_HOUR_SECONDS) / GAME_HOUR_SECONDS) * 60);
export const pct = (value: number) => `${Math.round(clamp(value))}%`;
export const satisfy = (state: PetState, needs: Need[]) => needs.includes(state.callReason as Need) ? null : state.callReason;
