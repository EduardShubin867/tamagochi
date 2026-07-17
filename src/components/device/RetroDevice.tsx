import type { PetState } from '../../game';
import { DeviceScreen } from './DeviceScreen';
import type { DeviceButton, GameActions } from './types';

export function RetroDevice({
  state,
  message,
  actions,
  press,
}: {
  state: PetState;
  message: string;
  actions: GameActions;
  press: (button: DeviceButton) => void;
}) {
  return (
    <section className="retro-zone" aria-label="Пиксельный виртуальный питомец">
      <div className="retro-device">
        <div className="retro-device-head">
          <span>POCKET//PET</span>
          <span className="retro-led" aria-label={state.callReason ? 'Нужно внимание' : 'Всё хорошо'} />
        </div>
        <div className="retro-bezel">
          <div className="retro-display">
            <DeviceScreen state={state} message={message} actions={actions} retro />
            {state.paused && (
              <div className="pause-overlay">
                <b>ПАУЗА</b>
                <span>ВРЕМЯ ОСТАНОВЛЕНО</span>
              </div>
            )}
          </div>
        </div>
        <div className="retro-controls" aria-label="Управление">
          {(['a', 'b', 'c'] as const).map((button, index) => (
            <div className="retro-control" key={button}>
              <button onClick={() => press(button)} aria-label={`Кнопка ${button.toUpperCase()}`}>
                {button.toUpperCase()}
              </button>
              <span>{['ЛИСТАТЬ', 'ВЫБРАТЬ', 'НАЗАД'][index]}</span>
            </div>
          ))}
        </div>
        <div className="retro-speaker" aria-hidden="true">
          ••••••••••••
        </div>
      </div>
      <div className="retro-keyboard-hint">
        <span>A / ←</span>
        <span>B / ENTER</span>
        <span>C / ESC</span>
      </div>
    </section>
  );
}
