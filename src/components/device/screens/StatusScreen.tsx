import { type PetState, STAGE_LABELS } from '../../../game';
import { Meter } from '../../visuals/Meter';

export function StatusScreen({ state }: { state: PetState }) {
  const pages = [
    [
      ['Сытость', state.hunger],
      ['Радость', state.happiness],
      ['Здоровье', state.health],
    ],
    [
      ['Энергия', state.energy],
      ['Чистота', state.hygiene],
      ['Характер', state.discipline],
    ],
  ] as const;

  return (
    <div className="screen-page status-screen">
      <div className="screen-topline">
        <span>СОСТОЯНИЕ</span>
        <span>{state.statusPage + 1}/3</span>
      </div>
      {state.statusPage < 2 ? (
        <div className="lcd-meters">
          {pages[state.statusPage].map(([label, value]) => (
            <Meter key={label} label={label} value={value} tone="#88ddb6" />
          ))}
        </div>
      ) : (
        <div className="facts">
          <span>
            <b>Возраст</b>
            {state.ageDays} дн.
          </span>
          <span>
            <b>Вес</b>
            {state.weight.toFixed(1)} кг
          </span>
          <span>
            <b>Этап</b>
            {STAGE_LABELS[state.stage]}
          </span>
          <span>
            <b>Победы</b>
            {state.gamesWon}
          </span>
          <span>
            <b>Ошибки</b>
            {state.careMistakes}
          </span>
        </div>
      )}
      <p className="screen-tip">A/B — следующая страница</p>
    </div>
  );
}
