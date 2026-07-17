import { Leaf, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { FAST_MODE } from '../../game';

interface TopbarProps {
  sound: boolean;
  paused: boolean;
  toggleSound: () => void;
  togglePaused: () => void;
  reset: () => void;
}

export function Topbar({ sound, paused, toggleSound, togglePaused, reset }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <span className="brand-star">
          <Leaf aria-hidden="true" />
        </span>
        <div>
          <b>МАНДРАГОРА</b>
          <small>убежище под корнями</small>
        </div>
      </div>
      <div className="topbar-actions">
        {FAST_MODE && <span className="fast-badge">быстрый режим</span>}
        <button onClick={toggleSound}>
          {sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          <span>{sound ? 'Звук' : 'Тишина'}</span>
        </button>
        <button onClick={togglePaused}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          <span>{paused ? 'Продолжить' : 'Пауза'}</span>
        </button>
        <button onClick={reset}>
          <Leaf aria-hidden="true" />
          <span>Новый корень</span>
        </button>
      </div>
    </header>
  );
}
