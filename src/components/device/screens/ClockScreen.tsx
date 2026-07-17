import { type PetState, petHour, petMinute } from '../../../game';
import { IconVisual } from '../../visuals/IconVisual';

export function ClockScreen({ state, retro = false }: { state: PetState; retro?: boolean }) {
  const real = new Date();
  const time = `${String(petHour(state)).padStart(2, '0')}:${String(petMinute(state)).padStart(2, '0')}`;
  return (
    <div className="screen-page clock-screen">
      <IconVisual index={7} retro={retro} />
      <strong>{time}</strong>
      <span>время {state.name}</span>
      <small>{real.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} у тебя</small>
    </div>
  );
}
