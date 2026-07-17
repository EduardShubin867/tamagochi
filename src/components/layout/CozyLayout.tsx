import { ArrowLeft, CornerDownLeft, Leaf, Pencil, Undo2 } from 'lucide-react';
import type { IdleBehavior, PetReaction, PrimaryStat } from '../../app/petPresentation';
import { DeviceScreen } from '../device/DeviceScreen';
import type { GameActions } from '../device/types';
import { Meter } from '../visuals/Meter';
import { RitualIcon } from '../visuals/IconVisual';
import { type PetState, MENU, NEED_LABELS, SPECIES, STAGE_LABELS } from '../../game';
import { getQuickCarePresentation, quickCareCopy } from '../../mandrakeCopy';

interface CozyLayoutProps {
  state: PetState;
  message: string;
  actions: GameActions;
  focusReaction: boolean;
  reaction: PetReaction | null;
  idleBehavior: IdleBehavior | null;
  rename: () => void;
  reset: () => void;
}

export function CozyLayout({
  state,
  message,
  actions,
  focusReaction,
  reaction,
  idleBehavior,
  rename,
  reset,
}: CozyLayoutProps) {
  const quickCare = getQuickCarePresentation(state);
  const alertCount = [state.hunger < 25, state.happiness < 22, state.poops > 0, state.sick, state.callReason].filter(
    Boolean,
  ).length;
  const careStatusSignal = `${quickCare.condition}-${state.callReason ?? 'quiet'}-${state.sick}-${state.poops}`;
  const feedbackFor = (stat: PrimaryStat) =>
    reaction?.stat === stat && reaction.delta ? { id: reaction.id, delta: reaction.delta } : undefined;

  return (
    <section className="game-layout">
      <div className="scene-vines" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <aside className="pet-card panel">
        <div className="pet-card-head">
          <div>
            <span>АТЛАС ЖИВОГО КОРНЯ</span>
            <button className="rename-button" onClick={rename}>
              {state.name}
              <Pencil aria-hidden="true" />
            </button>
          </div>
          <span
            className={`pulse-dot ${alertCount ? 'alert' : ''}`}
            aria-label={alertCount ? 'Нужно внимание' : 'Всё хорошо'}
          />
        </div>
        <div className="stage-row">
          <span>
            {SPECIES.find((item) => item.id === state.species)?.name ?? 'Мандрагора'} · {STAGE_LABELS[state.stage]}
          </span>
          <small>
            {state.ageDays} дн. · {state.weight.toFixed(1)} кг
          </small>
        </div>
        <div className="primary-meters">
          <Meter label="Сытость" value={state.hunger} tone="#d49b4c" feedback={feedbackFor('hunger')} />
          <Meter label="Радость" value={state.happiness} tone="#a96f78" feedback={feedbackFor('happiness')} />
          <Meter label="Здоровье" value={state.health} tone="#7f9c75" feedback={feedbackFor('health')} />
          <Meter label="Энергия" value={state.energy} tone="#8d809c" feedback={feedbackFor('energy')} />
        </div>
        <div className="mood-note">
          <span>ШЁПОТ КОРЕШКА</span>
          <p>
            {state.dead
              ? `${state.name} стал защитным талисманом.`
              : state.callReason
                ? NEED_LABELS[state.callReason]
                : state.sick
                  ? 'Корень пересох — нужно лекарство.'
                  : state.asleep
                    ? 'Ворчит во сне под притушенным светом.'
                    : 'Подозрительно спокойно. Наверняка что-то замышляет.'}
          </p>
        </div>
        <button className="reset-link" onClick={reset}>
          Пробудить новый корень
        </button>
      </aside>

      <section className="device-zone" aria-label="Корневая колыбель мандрагоры">
        <div className="sanctuary-title">
          <span>СЕРДЦЕ УБЕЖИЩА</span>
          <b>{state.asleep ? 'Тихий час под корнями' : 'Очаг хранит живой корень'}</b>
        </div>
        <div className={`device-wrap ${focusReaction ? 'focus-return' : ''}`}>
          <img className="device-art" src="/assets/root-cradle-shell-v2.webp" alt="" aria-hidden="true" />
          <div className="device-screen">
            <DeviceScreen
              state={state}
              message={message}
              actions={actions}
              reaction={reaction}
              idleBehavior={idleBehavior}
            />
            {state.paused && (
              <div className="pause-overlay">
                <b>Пауза</b>
                <span>время остановлено</span>
              </div>
            )}
          </div>
          {reaction?.action && (
            <span className="ritual-flight" key={reaction.id} aria-hidden="true">
              <RitualIcon action={reaction.action} />
            </span>
          )}
          {(['a', 'b', 'c'] as const).map((button) => (
            <button
              key={button}
              className={`device-key key-${button}`}
              onClick={() => actions.press(button)}
              aria-label={`Кнопка ${button.toUpperCase()}`}
            >
              <span>{button.toUpperCase()}</span>
            </button>
          ))}
          <div className="cradle-embers" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="key-hint">
          <span>
            <b>A</b> листать <ArrowLeft aria-hidden="true" />
          </span>
          <span>
            <b>B</b> выбрать <CornerDownLeft aria-hidden="true" />
          </span>
          <span>
            <b>C</b> назад <Undo2 aria-hidden="true" />
          </span>
        </div>
      </section>

      <aside className="action-card panel">
        <div className="aside-title">
          <div>
            <span>{quickCareCopy.title}</span>
            <b
              className={`care-status condition-${quickCare.condition}`}
              key={careStatusSignal}
              aria-live="polite"
              aria-atomic="true"
            >
              {quickCare.status}
            </b>
          </div>
          <small>{quickCareCopy.prompt}</small>
        </div>
        <div className="action-grid">
          {MENU.map((item) => (
            <button
              key={item.id}
              className={reaction?.action === item.id ? 'ritual-active' : undefined}
              onClick={() => actions.act(item.id)}
              aria-label={`${item.label}: ${item.hint}`}
              title={`${item.label}: ${item.hint}`}
            >
              <RitualIcon action={item.id} />
              <span>
                <b>{item.label}</b>
                <small>{item.hint}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="tip-card">
          <span className="tip-seal" aria-hidden="true">
            <Leaf />
          </span>
          <p>
            <b>{quickCareCopy.hintTitle}</b>
            {quickCare.hint}
          </p>
        </div>
      </aside>
    </section>
  );
}
