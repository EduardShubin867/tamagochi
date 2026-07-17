import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { ONBOARDING_KEY, SAVE_KEY, loadPet } from '../app/persistence';
import {
  type IdleBehavior,
  type PetReaction,
  type PetReactionInput,
  type TriggerPetReaction,
} from '../app/petPresentation';
import { getTabPresentation, updateTabPresentation } from '../app/tabPresentation';
import { type ActionId, type PetState, STAGE_LABELS, advanceSecond, simulateOffline } from '../game';
import { getMandrakeCondition, pickActionPhrase } from '../mandrakeCopy';

export interface PetRuntime {
  state: PetState;
  setState: Dispatch<SetStateAction<PetState>>;
  message: string;
  focusReaction: boolean;
  callPulse: boolean;
  reaction: PetReaction | null;
  idleBehavior: IdleBehavior | null;
  say: (text: string) => void;
  sayActionPhrase: (action: ActionId) => void;
  triggerReaction: TriggerPetReaction;
  beep: (frequency?: number, duration?: number) => void;
  previousStage: MutableRefObject<PetState['stage']>;
  onboardingSeen: boolean;
}

export function usePetRuntime(): PetRuntime {
  const [state, setState] = useState<PetState>(loadPet);
  const [message, setMessage] = useState('');
  const [focusReaction, setFocusReaction] = useState(false);
  const [callPulse, setCallPulse] = useState(false);
  const [reaction, setReaction] = useState<PetReaction | null>(null);
  const [idleBehavior, setIdleBehavior] = useState<IdleBehavior | null>(null);
  const messageTimer = useRef<number | undefined>(undefined);
  const focusReactionTimer = useRef<number | undefined>(undefined);
  const focusReactionFrame = useRef<number | undefined>(undefined);
  const callPulseTimer = useRef<number | undefined>(undefined);
  const callPulseFrame = useRef<number | undefined>(undefined);
  const reactionTimer = useRef<number | undefined>(undefined);
  const reactionFrame = useRef<number | undefined>(undefined);
  const nextReactionId = useRef(0);
  const wasAway = useRef(false);
  const previousStage = useRef(state.stage);
  const previousCallReason = useRef(state.callReason);
  const previousCharacterPhrase = useRef('');
  const tabPresentation = getTabPresentation(state);
  const condition = getMandrakeCondition(state);

  const say = useCallback((text: string) => {
    setMessage(text);
    window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(() => setMessage(''), 2400);
  }, []);

  const sayActionPhrase = useCallback(
    (action: ActionId) => {
      const phrase = pickActionPhrase(action, previousCharacterPhrase.current);
      if (!phrase) return;
      previousCharacterPhrase.current = phrase;
      say(phrase);
    },
    [say],
  );

  const triggerReaction = useCallback((input: PetReactionInput, duration = 1050) => {
    const id = nextReactionId.current + 1;
    nextReactionId.current = id;
    window.clearTimeout(reactionTimer.current);
    window.cancelAnimationFrame(reactionFrame.current ?? 0);
    setIdleBehavior(null);
    setReaction(null);
    reactionFrame.current = window.requestAnimationFrame(() => {
      setReaction({ ...input, id });
      reactionTimer.current = window.setTimeout(
        () => setReaction((current) => (current?.id === id ? null : current)),
        duration,
      );
    });
  }, []);

  const beep = useCallback(
    (frequency = 620, duration = 0.06) => {
      if (!state.sound) return;
      try {
        const Audio =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const context = new Audio();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.045, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + duration);
        oscillator.addEventListener('ended', () => context.close());
      } catch {
        /* audio is optional */
      }
    },
    [state.sound],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setState((current) => advanceSecond(current)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const markAway = () => {
      wasAway.current = true;
    };
    const welcomeBack = () => {
      if (!wasAway.current || document.hidden) return;
      wasAway.current = false;
      window.clearTimeout(focusReactionTimer.current);
      window.cancelAnimationFrame(focusReactionFrame.current ?? 0);
      setFocusReaction(false);
      focusReactionFrame.current = window.requestAnimationFrame(() => {
        setFocusReaction(true);
        focusReactionTimer.current = window.setTimeout(() => setFocusReaction(false), 1100);
      });
      if (state.screen === 'home' && !state.dead) say('С возвращением!');
    };
    const onVisibilityChange = () => {
      if (document.hidden) markAway();
      else welcomeBack();
    };

    window.addEventListener('blur', markAway);
    window.addEventListener('focus', welcomeBack);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('blur', markAway);
      window.removeEventListener('focus', welcomeBack);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [say, state.dead, state.screen]);

  useEffect(() => {
    const previous = previousCallReason.current;
    previousCallReason.current = state.callReason;
    if (!state.callReason || state.callReason === previous) return;
    window.clearTimeout(callPulseTimer.current);
    window.cancelAnimationFrame(callPulseFrame.current ?? 0);
    setCallPulse(false);
    callPulseFrame.current = window.requestAnimationFrame(() => {
      setCallPulse(true);
      callPulseTimer.current = window.setTimeout(() => setCallPulse(false), 820);
    });
  }, [state.callReason]);

  useEffect(() => {
    if (state.screen !== 'home' || state.stage === 'egg' || state.dead || state.asleep || state.paused || reaction) {
      setIdleBehavior(null);
      return;
    }

    let idleTimer: number | undefined;
    let idleClearTimer: number | undefined;
    const choices: Record<typeof condition, IdleBehavior[]> = {
      normal: ['look', 'leaf'],
      hungry: ['stomp', 'look'],
      sad: ['sigh', 'look'],
      dirty: ['shake', 'stomp'],
      sick: ['sigh', 'yawn'],
      sleepy: ['yawn', 'sigh'],
      capricious: ['stomp', 'shake'],
      critical: ['sigh', 'yawn'],
    };
    let stopped = false;
    const scheduleIdle = () => {
      const delay = condition === 'capricious' ? 5200 + Math.random() * 4200 : 7600 + Math.random() * 6800;
      idleTimer = window.setTimeout(() => {
        const pool = choices[condition];
        setIdleBehavior(pool[Math.floor(Math.random() * pool.length)]);
        idleClearTimer = window.setTimeout(() => {
          setIdleBehavior(null);
          if (!stopped) scheduleIdle();
        }, 1400);
      }, delay);
    };
    scheduleIdle();

    return () => {
      stopped = true;
      window.clearTimeout(idleTimer);
      window.clearTimeout(idleClearTimer);
    };
  }, [condition, reaction, state.asleep, state.dead, state.paused, state.screen, state.stage]);

  useEffect(
    () => () => {
      window.clearTimeout(messageTimer.current);
      window.clearTimeout(focusReactionTimer.current);
      window.clearTimeout(callPulseTimer.current);
      window.clearTimeout(reactionTimer.current);
      window.cancelAnimationFrame(focusReactionFrame.current ?? 0);
      window.cancelAnimationFrame(callPulseFrame.current ?? 0);
      window.cancelAnimationFrame(reactionFrame.current ?? 0);
    },
    [],
  );

  useEffect(
    () => updateTabPresentation(tabPresentation),
    [tabPresentation.badge, tabPresentation.badgeColor, tabPresentation.title],
  );

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if (previousStage.current !== state.stage) {
      previousStage.current = state.stage;
      say(state.stage === 'baby' ? 'А-а-а! Я проснулась!' : `Новая форма: ${STAGE_LABELS[state.stage]}!`);
      triggerReaction({ kind: state.stage === 'baby' ? 'startle' : 'praise' }, 1250);
      beep(880, 0.12);
    }
  }, [state, say, beep, triggerReaction]);

  useEffect(() => {
    const save = () => localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastTickAt: Date.now() }));
    const visibility = () => {
      if (document.hidden) save();
      else setState((current) => simulateOffline(current));
    };
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [state]);

  return {
    state,
    setState,
    message,
    focusReaction,
    callPulse,
    reaction,
    idleBehavior,
    say,
    sayActionPhrase,
    triggerReaction,
    beep,
    previousStage,
    onboardingSeen: Boolean(localStorage.getItem(ONBOARDING_KEY)),
  };
}
