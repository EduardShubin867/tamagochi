import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { createSelectedMandrake, ONBOARDING_KEY, SAVE_KEY } from '../app/persistence';
import type { PetState } from '../game';

export type DialogKind = 'welcome' | 'rename' | 'reset';

interface UseAppDialogOptions {
  state: PetState;
  setState: Dispatch<SetStateAction<PetState>>;
  say: (text: string) => void;
  previousStage: MutableRefObject<PetState['stage']>;
  onboardingSeen: boolean;
}

export function useAppDialog({ state, setState, say, previousStage, onboardingSeen }: UseAppDialogOptions) {
  const [dialog, setDialog] = useState<DialogKind | null>(() => (onboardingSeen ? null : 'welcome'));
  const [nameDraft, setNameDraft] = useState(state.name);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const modal = dialogRef.current;
    if (!modal) return;
    if (!dialog) {
      if (modal.open) modal.close();
      return;
    }

    if (!modal.open) modal.showModal();
    const frame = window.requestAnimationFrame(() => {
      const target = modal.querySelector<HTMLElement>('[data-autofocus]');
      target?.focus();
      if (target instanceof HTMLInputElement) target.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [dialog]);

  const closeDialog = useCallback(() => {
    if (dialog === 'welcome') localStorage.setItem(ONBOARDING_KEY, 'true');
    dialogRef.current?.close();
    setDialog(null);
    window.requestAnimationFrame(() => dialogTrigger.current?.focus());
  }, [dialog]);

  const openDialog = useCallback(
    (kind: DialogKind) => {
      dialogTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (kind === 'rename') setNameDraft(state.name);
      setDialog(kind);
    },
    [state.name],
  );

  const submitDialog = useCallback(() => {
    if (dialog === 'welcome') {
      closeDialog();
      return;
    }
    if (dialog === 'rename') {
      const name = nameDraft.trim().slice(0, 10);
      if (!name) return;
      setState((current) => ({ ...current, name }));
      closeDialog();
      say(`Теперь меня зовут ${name}!`);
      return;
    }
    if (dialog === 'reset') {
      localStorage.removeItem(SAVE_KEY);
      previousStage.current = 'egg';
      setState(createSelectedMandrake(state.sound));
      closeDialog();
      say('Новый корень уже пробуждается');
    }
  }, [closeDialog, dialog, nameDraft, previousStage, say, setState, state.sound]);

  return {
    dialog,
    dialogRef,
    nameDraft,
    setNameDraft,
    closeDialog,
    rename: () => openDialog('rename'),
    reset: () => openDialog('reset'),
    submitDialog,
  };
}
