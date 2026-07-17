import { Check, Pencil, RotateCcw, Sparkles, TriangleAlert, X } from 'lucide-react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { DialogKind } from '../../hooks/useAppDialog';

interface AppDialogProps {
  dialog: DialogKind | null;
  dialogRef: RefObject<HTMLDialogElement | null>;
  nameDraft: string;
  setNameDraft: Dispatch<SetStateAction<string>>;
  closeDialog: () => void;
  submitDialog: () => void;
}

export function AppDialog({ dialog, dialogRef, nameDraft, setNameDraft, closeDialog, submitDialog }: AppDialogProps) {
  return (
    <dialog
      ref={dialogRef}
      className="app-dialog"
      role={dialog === 'reset' ? 'alertdialog' : 'dialog'}
      aria-labelledby="app-dialog-title"
      aria-describedby="app-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const focusable = [
          ...event.currentTarget.querySelectorAll<HTMLElement>('input:not([disabled]), button:not([disabled])'),
        ];
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitDialog();
        }}
      >
        <div className={`dialog-icon ${dialog === 'reset' ? 'danger' : ''}`} aria-hidden="true">
          {dialog === 'welcome' ? <Sparkles /> : dialog === 'reset' ? <TriangleAlert /> : <Pencil />}
        </div>
        <div className="dialog-copy">
          <h2 id="app-dialog-title">
            {dialog === 'welcome'
              ? 'Добро пожаловать в корни Госпожи!'
              : dialog === 'reset'
                ? 'Начать заново?'
                : 'Как зовут мандрагору?'}
          </h2>
          <p id="app-dialog-description">
            {dialog === 'welcome'
              ? 'В живом корне поселилась крошечная альрауна. Она язвительна, сварлива и всё равно нуждается в твоей заботе.'
              : dialog === 'reset'
                ? 'Текущий прогресс будет удалён, а пробуждение нового корня начнётся сначала.'
                : 'Имя можно изменить в любой момент. До 10 символов.'}
          </p>
        </div>
        {dialog === 'welcome' && (
          <div className="welcome-points">
            <p>
              <b>Живёт в реальном времени</b>Питомец растёт и ждёт ухода даже без открытого браузера. При возвращении
              учитывается до 72 часов.
            </p>
            <p>
              <b>Живое убежище</b>Состояние корня видно в атласе, а ритуалы ухода собраны на резной полке.
            </p>
            <p>
              <b>Всё под рукой</b>Нажимай A, B и C на устройстве или используй клавиатуру: A/←, B/Enter, C/Esc.
            </p>
          </div>
        )}
        {dialog === 'rename' && (
          <label className="dialog-field" htmlFor="pet-name">
            <span>Имя мандрагоры</span>
            <input
              id="pet-name"
              data-autofocus
              value={nameDraft}
              maxLength={10}
              onChange={(event) => setNameDraft(event.target.value)}
              autoComplete="off"
            />
          </label>
        )}
        <div className="dialog-actions">
          {dialog !== 'welcome' && (
            <button
              type="button"
              className="dialog-secondary"
              data-autofocus={dialog === 'reset' ? '' : undefined}
              onClick={closeDialog}
            >
              <X aria-hidden="true" />
              Отмена
            </button>
          )}
          <button
            type="submit"
            className={`dialog-primary ${dialog === 'reset' ? 'danger' : ''}`}
            disabled={dialog === 'rename' && !nameDraft.trim()}
          >
            {dialog === 'reset' ? <RotateCcw aria-hidden="true" /> : <Check aria-hidden="true" />}
            {dialog === 'welcome' ? 'Начать заботиться' : dialog === 'reset' ? 'Начать заново' : 'Сохранить'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
