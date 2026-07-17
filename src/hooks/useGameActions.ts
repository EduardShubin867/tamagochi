import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type RefObject,
  type SetStateAction,
} from 'react';
import { createSelectedMandrake } from '../app/persistence';
import type { TriggerPetReaction } from '../app/petPresentation';
import type { DeviceButton, GameActions } from '../components/device/types';
import { type ActionId, MENU, type PetState, SPECIES, type SpeciesId, satisfy } from '../game';
import { getMandrakeCondition, pickPetInteractionPhrase } from '../mandrakeCopy';

interface UseGameActionsOptions {
  state: PetState;
  setState: Dispatch<SetStateAction<PetState>>;
  say: (text: string) => void;
  sayActionPhrase: (action: ActionId) => void;
  triggerReaction: TriggerPetReaction;
  beep: (frequency?: number, duration?: number) => void;
  previousStage: MutableRefObject<PetState['stage']>;
  dialogRef: RefObject<HTMLDialogElement | null>;
}

export function useGameActions({
  state,
  setState,
  say,
  sayActionPhrase,
  triggerReaction,
  beep,
  previousStage,
  dialogRef,
}: UseGameActionsOptions): GameActions {
  const previousPetPhrase = useRef('');

  const feed = useCallback(
    (kind: 'meal' | 'snack') => {
      if (state.stage === 'egg' || state.dead || state.asleep) return;
      const hungerGain = Math.min(kind === 'meal' ? 28 : 10, 100 - state.hunger);
      const happinessGain = Math.min(kind === 'snack' ? 13 : 3, 100 - state.happiness);
      setState((current) => {
        if (current.stage === 'egg' || current.dead || current.asleep) return current;
        return {
          ...current,
          hunger: Math.min(100, current.hunger + (kind === 'meal' ? 28 : 10)),
          happiness: Math.min(100, current.happiness + (kind === 'snack' ? 13 : 3)),
          health: Math.max(0, Math.min(100, current.health + (kind === 'meal' ? 2 : -1))),
          weight: Math.min(99, current.weight + (kind === 'meal' ? 0.4 : 0.7)),
          meals: current.meals + 1,
          callReason: satisfy(current, ['hungry']),
          screen: 'home',
        };
      });
      triggerReaction(
        kind === 'meal'
          ? { kind: 'eat', action: 'food', stat: 'hunger', delta: hungerGain }
          : happinessGain > 0
            ? { kind: 'treat', action: 'food', stat: 'happiness', delta: happinessGain }
            : { kind: 'treat', action: 'food', stat: 'hunger', delta: hungerGain },
      );
      sayActionPhrase('food');
      beep(740);
    },
    [
      beep,
      sayActionPhrase,
      setState,
      state.asleep,
      state.dead,
      state.happiness,
      state.hunger,
      state.stage,
      triggerReaction,
    ],
  );

  const act = useCallback(
    (action: ActionId) => {
      beep(620);
      if (action === 'food') {
        setState((current) => ({ ...current, screen: current.stage === 'egg' ? 'home' : 'food', foodIndex: 0 }));
        return;
      }
      if (action === 'status' || action === 'clock') {
        triggerReaction({ kind: 'observe', action }, 850);
        setState((current) => ({ ...current, screen: action, statusPage: 0 }));
        return;
      }
      if (action === 'game') {
        const canPlay = state.stage !== 'egg' && !state.dead && !state.asleep && !state.sick && state.energy >= 8;
        setState((current) => {
          if (current.stage === 'egg' || current.dead || current.asleep || current.sick || current.energy < 8)
            return current;
          return {
            ...current,
            screen: 'game',
            miniGame: {
              round: 1,
              score: 0,
              cursor: 0,
              petChoice: Math.random() < 0.5 ? 0 : 1,
              phase: 'choose',
              result: '',
            },
          };
        });
        if (canPlay) {
          triggerReaction({ kind: 'play', action: 'game' });
          sayActionPhrase('game');
        }
        return;
      }
      if (state.stage === 'egg' || state.dead) return;
      const correctDiscipline =
        state.callReason === 'attention' &&
        state.hunger > 35 &&
        state.happiness > 30 &&
        !state.sick &&
        state.poops === 0;

      if (action === 'clean') {
        const healthGain = Math.min(4, 100 - state.health);
        triggerReaction({ kind: 'clean', action, stat: healthGain > 0 ? 'health' : undefined, delta: healthGain });
      } else if (action === 'medicine') {
        const delta = state.sick ? Math.min(12, 100 - state.health) : -Math.min(3, state.happiness);
        triggerReaction({
          kind: state.sick ? 'heal' : 'bitter',
          action,
          stat: state.sick ? 'health' : 'happiness',
          delta,
        });
      } else if (action === 'light') {
        triggerReaction({
          kind: state.lightsOff ? 'wake' : state.asleep ? 'sleep' : 'startle',
          action,
        });
      } else {
        triggerReaction({
          kind: correctDiscipline ? 'praise' : 'scold',
          action,
          stat: 'happiness',
          delta: -Math.min(correctDiscipline ? 3 : 8, state.happiness),
        });
      }

      setState((current) => {
        if (current.stage === 'egg' || current.dead) return current;
        if (action === 'clean') {
          return {
            ...current,
            poops: 0,
            hygiene: 100,
            health: Math.min(100, current.health + 4),
            callReason: satisfy(current, ['dirty']),
            screen: 'home',
          };
        }
        if (action === 'medicine') {
          return {
            ...current,
            sick: false,
            health: Math.min(100, current.health + (current.sick ? 12 : 0)),
            happiness: Math.max(0, current.happiness - (current.sick ? 0 : 3)),
            callReason: satisfy(current, ['sick']),
            screen: 'home',
          };
        }
        if (action === 'light') {
          const lightsOff = !current.lightsOff;
          return {
            ...current,
            lightsOff,
            callReason: lightsOff ? satisfy(current, ['sleepy']) : current.callReason,
            screen: 'home',
          };
        }
        const correct =
          current.callReason === 'attention' &&
          current.hunger > 35 &&
          current.happiness > 30 &&
          !current.sick &&
          current.poops === 0;
        return {
          ...current,
          discipline: Math.max(0, Math.min(100, current.discipline + (correct ? 12 : -2))),
          happiness: Math.max(0, current.happiness - (correct ? 3 : 8)),
          callReason: correct ? null : current.callReason,
          screen: 'home',
        };
      });
      if (action === 'light') {
        if (!state.lightsOff && state.asleep) sayActionPhrase('light');
        else say(state.lightsOff ? 'Свет включён' : 'Ой, темно!');
        return;
      }
      sayActionPhrase(action);
    },
    [
      beep,
      say,
      sayActionPhrase,
      setState,
      state.asleep,
      state.callReason,
      state.dead,
      state.energy,
      state.happiness,
      state.health,
      state.hunger,
      state.lightsOff,
      state.poops,
      state.sick,
      state.stage,
      triggerReaction,
    ],
  );

  const interactPet = useCallback(() => {
    if (state.dead) return;
    const phrase = pickPetInteractionPhrase(state, previousPetPhrase.current);
    previousPetPhrase.current = phrase;
    const condition = getMandrakeCondition(state);
    triggerReaction({
      kind:
        state.stage === 'egg' || state.asleep
          ? 'startle'
          : condition === 'capricious'
            ? 'scold'
            : condition === 'sad' || condition === 'critical'
              ? 'praise'
              : 'pet',
    });
    say(phrase);
    beep(state.asleep ? 390 : 560, 0.045);
  }, [beep, say, state, triggerReaction]);

  const selectSpecies = useCallback(
    (species: SpeciesId) => {
      const choice = SPECIES.find((item) => item.id === species) ?? SPECIES[0];
      setState((current) => ({
        ...current,
        species: choice.id,
        speciesIndex: SPECIES.findIndex((item) => item.id === choice.id),
        name: choice.defaultName,
        screen: 'home',
        lastTickAt: Date.now(),
      }));
      say(`${choice.name} теперь с тобой!`);
      triggerReaction({ kind: 'startle' }, 1200);
      beep(880, 0.1);
    },
    [beep, say, setState, triggerReaction],
  );

  const selectMenu = useCallback(() => {
    const item = MENU[state.menuIndex];
    act(item.id);
  }, [act, state.menuIndex]);

  const press = useCallback(
    (button: DeviceButton) => {
      beep(button === 'b' ? 760 : button === 'c' ? 430 : 610, 0.045);
      if (state.screen === 'select') {
        if (button === 'a') {
          setState((current) => ({ ...current, speciesIndex: (current.speciesIndex + 1) % SPECIES.length }));
        } else if (button === 'b') {
          selectSpecies((SPECIES[state.speciesIndex] ?? SPECIES[0]).id);
        }
        return;
      }
      if (button === 'c') {
        setState((current) => ({ ...current, screen: 'home', miniGame: null }));
        return;
      }
      if (state.screen === 'home') {
        if (button === 'b' && state.dead) {
          previousStage.current = 'egg';
          setState(createSelectedMandrake(state.sound));
          say('Новый корень!');
        } else setState((current) => ({ ...current, screen: 'menu' }));
        return;
      }
      if (state.screen === 'menu') {
        if (button === 'a') setState((current) => ({ ...current, menuIndex: (current.menuIndex + 1) % MENU.length }));
        else selectMenu();
        return;
      }
      if (state.screen === 'food') {
        if (button === 'a') setState((current) => ({ ...current, foodIndex: current.foodIndex ? 0 : 1 }));
        else feed(state.foodIndex ? 'snack' : 'meal');
        return;
      }
      if (state.screen === 'status') {
        setState((current) => ({ ...current, statusPage: (current.statusPage + 1) % 3 }));
        return;
      }
      if (state.screen === 'clock') {
        setState((current) => ({ ...current, screen: 'home' }));
        return;
      }
      if (state.screen === 'game' && state.miniGame?.phase === 'choose') {
        if (button === 'a') {
          setState((current) => ({
            ...current,
            miniGame: current.miniGame ? { ...current.miniGame, cursor: current.miniGame.cursor ? 0 : 1 } : null,
          }));
        } else {
          setState((current) => {
            if (!current.miniGame) return current;
            const won = current.miniGame.cursor === current.miniGame.petChoice;
            return {
              ...current,
              miniGame: {
                ...current.miniGame,
                score: current.miniGame.score + (won ? 1 : 0),
                phase: 'result',
                result: won ? 'Угадал!' : 'Мимо!',
              },
            };
          });
        }
      }
    },
    [
      beep,
      feed,
      previousStage,
      say,
      selectMenu,
      selectSpecies,
      setState,
      state.dead,
      state.foodIndex,
      state.miniGame?.phase,
      state.screen,
      state.sound,
      state.speciesIndex,
    ],
  );

  useEffect(() => {
    if (state.screen !== 'game' || state.miniGame?.phase !== 'result') return;
    const timer = window.setTimeout(() => {
      const visibleGame = state.miniGame;
      if (visibleGame && visibleGame.round >= 5) {
        const won = visibleGame.score >= 3;
        const reward = won ? 24 : 9;
        triggerReaction({
          kind: won ? 'praise' : 'play',
          stat: 'happiness',
          delta: Math.min(reward, 100 - state.happiness),
        });
      }
      setState((current) => {
        const game = current.miniGame;
        if (!game) return current;
        if (game.round >= 5) {
          const won = game.score >= 3;
          say(won ? 'Мы победили!' : 'Ещё разок?');
          return {
            ...current,
            screen: 'home',
            miniGame: null,
            gamesWon: current.gamesWon + (won ? 1 : 0),
            gamesLost: current.gamesLost + (won ? 0 : 1),
            happiness: Math.min(100, current.happiness + (won ? 24 : 9)),
            energy: Math.max(0, current.energy - 9),
            weight: Math.max(3, current.weight - (won ? 0.8 : 0.35)),
            callReason: satisfy(current, ['sad', 'attention']),
          };
        }
        return {
          ...current,
          miniGame: {
            ...game,
            round: game.round + 1,
            petChoice: Math.random() < 0.5 ? 0 : 1,
            phase: 'choose',
            result: '',
          },
        };
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    say,
    setState,
    state.happiness,
    state.miniGame?.phase,
    state.miniGame?.round,
    state.miniGame?.score,
    state.screen,
    triggerReaction,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (dialogRef.current?.open) return;
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') {
        event.preventDefault();
        press('a');
      }
      if (key === 'b' || key === 'enter' || key === ' ') {
        event.preventDefault();
        press('b');
      }
      if (key === 'c' || key === 'escape' || key === 'backspace') {
        event.preventDefault();
        press('c');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialogRef, press]);

  return useMemo<GameActions>(
    () => ({ act, feed, interactPet, press, chooseGame: () => press('b'), selectSpecies }),
    [act, feed, interactPet, press, selectSpecies],
  );
}
