import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CornerDownLeft,
  Pencil,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  TriangleAlert,
  Undo2,
  X,
} from 'lucide-react';
import {
  ActionId,
  FAST_MODE,
  MENU,
  NEED_LABELS,
  PetState,
  SPECIES,
  STAGE_LABELS,
  SpeciesId,
  advanceSecond,
  createPet,
  petHour,
  petMinute,
  pct,
  satisfy,
  simulateOffline,
  spriteIndex,
} from './game';

const SAVE_KEY = 'lumi-pocket-pet-v3';
const VISUAL_MODE_KEY = 'lumi-visual-mode';
const FAVICON_SOURCE = '/assets/favicon.png';

interface TabPresentation {
  title: string;
  badge: string;
  badgeColor: string;
}

type DialogKind = 'rename' | 'reset';

const TAB_NEEDS: Record<NonNullable<PetState['callReason']>, Omit<TabPresentation, 'badgeColor'>> = {
  hungry: { title: 'хочет есть', badge: '!' },
  sad: { title: 'хочет играть', badge: '!' },
  dirty: { title: 'просит уборки', badge: '!' },
  sick: { title: 'болеет', badge: '+' },
  sleepy: { title: 'хочет спать', badge: 'z' },
  attention: { title: 'зовёт тебя', badge: '!' },
};

function getTabPresentation(state: PetState): TabPresentation {
  if (state.dead) return { title: `${state.name} — добрая память · Lumi`, badge: '×', badgeColor: '#d84d67' };
  if (state.screen === 'select') return { title: 'Выбери друга · Lumi', badge: '?', badgeColor: '#8a72d8' };
  if (state.sick) return { title: `${state.name} болеет · Lumi`, badge: '+', badgeColor: '#d84d67' };
  if (state.health < 35) return { title: `${state.name} нужна помощь · Lumi`, badge: '+', badgeColor: '#d84d67' };
  if (state.asleep && state.callReason === 'sleepy') return { title: `${state.name} спит · Lumi`, badge: 'z', badgeColor: '#6572b9' };

  if (state.callReason) {
    const need = TAB_NEEDS[state.callReason];
    return { title: `${state.name} ${need.title} · Lumi`, badge: need.badge, badgeColor: '#e89a35' };
  }

  if (state.poops > 0) return { title: `${state.name} просит уборки · Lumi`, badge: '!', badgeColor: '#e89a35' };
  if (state.hunger < 25) return { title: `${state.name} хочет есть · Lumi`, badge: '!', badgeColor: '#e89a35' };
  if (state.happiness < 22) return { title: `${state.name} грустит · Lumi`, badge: '!', badgeColor: '#e89a35' };
  if (state.asleep) return { title: `${state.name} спит · Lumi`, badge: 'z', badgeColor: '#6572b9' };
  if (state.energy < 20) return { title: `${state.name} устал · Lumi`, badge: 'z', badgeColor: '#6572b9' };
  if (state.paused) return { title: `${state.name} — пауза · Lumi`, badge: 'Ⅱ', badgeColor: '#777889' };
  if (state.stage === 'egg') return { title: `${state.name} скоро вылупится · Lumi`, badge: '•', badgeColor: '#8a72d8' };
  return { title: `${state.name} — всё хорошо · Lumi`, badge: '✓', badgeColor: '#4d9d78' };
}

const RETRO_PALETTE = ['transparent', '#17332e', '#47705a', '#a8c878', '#6b925e'];

const PET_PIXELS: string[][] = [
  [
    '0000001111000000', '0000012222100000', '0000122222210000', '0001223322221000',
    '0012222222222100', '0122222222222210', '0122232232222210', '0122222222222210',
    '0122222112222210', '0012222222222100', '0012222222222100', '0001222222221000',
    '0000122222210000', '0000011111100000', '0000000000000000', '0000000000000000',
  ],
  [
    '0000004400000000', '0000044404400000', '0000001441000000', '0000112222110000',
    '0001222222221000', '0012222222222100', '0122212221222210', '0122232223222210',
    '0122222122222210', '0122221112222210', '0012222222222100', '0001222222221000',
    '0000111111110000', '0000100000010000', '0001100000011000', '0000000000000000',
  ],
  [
    '0000004400000000', '0000044440000000', '0000001140000000', '0000112211000000',
    '0001222222100000', '0012222222210000', '0122212212221000', '0122232232221000',
    '0122221222221000', '0122211122221000', '0012222222210000', '0001222222100000',
    '0000111111000000', '0001100001100000', '0011000000110000', '0000000000000000',
  ],
  [
    '0110000000000110', '0121004444001210', '0122111111122210', '0011222222211100',
    '0001222222221000', '0012222222222100', '0122212221222210', '0122232223222210',
    '0122222122222210', '0122221112222210', '0012222222222100', '0001222222221000',
    '0000111111110000', '0001100000011000', '0011000000001100', '0000000000000000',
  ],
  [
    '0000001100000000', '0000112211000000', '0011122221110000', '0001222222100000',
    '0112222222211100', '0012222222221000', '0122212221222100', '0122232223222100',
    '0122222122222100', '0012221112221000', '0112222222211100', '0001222222100000',
    '0000111111000000', '0001100001100000', '0011000000110000', '0000000000000000',
  ],
  [
    '0000111111000000', '0000100001000000', '0011111111110000', '0111222222211100',
    '1122222222222110', '1222222222222211', '1122212221222110', '0122232223222100',
    '0122222122222100', '1122221112222110', '1222222222222211', '0111222222211100',
    '0000111111100000', '0001100000110000', '0011000000011000', '0000000000000000',
  ],
  [
    '0011000000001100', '0112111111122110', '0122222222222210', '0122112222112210',
    '0121222222212210', '0122212221222210', '0122122222122210', '0122232223222210',
    '0122222122222210', '0122111111122210', '0012222222222100', '0001222222221000',
    '0000111111110000', '0001100000011000', '0011000000001100', '0000000000000000',
  ],
  [
    '0000440000440000', '0000044444400000', '0000111111100000', '0001222222210000',
    '0012222222221000', '0122122222122100', '0122212221222100', '0122222222222100',
    '0122221112222100', '0012222222221000', '0001222222210000', '0000111111100000',
    '0000101000100000', '0001101000110000', '0011001000011000', '0000001000000000',
  ],
  [
    '0000001111000000', '0000012222100000', '0000122222210000', '0001222222221000',
    '0012221221222100', '0122232223222210', '0122222122222210', '0012221112222100',
    '0001222222221000', '0000122222210000', '0000012222100000', '0000001221000000',
    '0000012210000000', '0000122100000000', '0000111000000000', '0000000000000000',
  ],
];

const ICON_PIXELS: string[][] = [
  ['0000100000', '0001100000', '0001000000', '0111111110', '0122222210', '0012222100', '0001111000', '0000000000'],
  ['0000000000', '0011111100', '0122222210', '1221122121', '1222222221', '0110001100', '0000000000', '0000000000'],
  ['0000330000', '0033333300', '0111111100', '1222222210', '1222222210', '0111111100', '0000000000', '0000000000'],
  ['0001111000', '0001221000', '0001221000', '0011111100', '0011221100', '0011111100', '0000000000', '0000000000'],
  ['0001221000', '0012222100', '0012222100', '0001221000', '0001111000', '0000110000', '0001111000', '0000000000'],
  ['0110011000', '1221122100', '1222222100', '0122221000', '0012210000', '0001100000', '0000000000', '0000000000'],
  ['0110001100', '0011110000', '0001100000', '0011110000', '0110011000', '1100001100', '0000000000', '0000000000'],
  ['0001111000', '0012222100', '0122122210', '0122112210', '0122222210', '0012222100', '0001111000', '0000000000'],
];

function retroPetPixels(species: SpeciesId, index: number) {
  const grid = PET_PIXELS[index].map((row) => [...row]);
  const set = (x: number, y: number, value = '1') => {
    if (grid[y]?.[x] !== undefined) grid[y][x] = value;
  };

  if (species === 'cat') {
    [[3, 3], [3, 2], [3, 1], [4, 0], [4, 1], [4, 2], [5, 2], [10, 2], [11, 0], [11, 1], [11, 2], [12, 1], [12, 2], [12, 3]].forEach(([x, y]) => set(x, y));
    [[13, 8], [14, 7], [15, 7], [15, 8], [15, 9], [14, 10], [13, 10]].forEach(([x, y]) => set(x, y, '2'));
  }
  if (species === 'aqua') {
    [[2, 3], [1, 2], [1, 4], [0, 3], [2, 7], [1, 8], [13, 3], [14, 2], [14, 4], [15, 3], [13, 7], [14, 8]].forEach(([x, y]) => set(x, y, '4'));
    [[2, 4], [1, 5], [0, 5], [2, 6], [13, 4], [14, 5], [15, 5], [13, 6], [13, 10], [14, 11], [15, 10]].forEach(([x, y]) => set(x, y, '1'));
  }
  if (species === 'dragon') {
    [[4, 2], [4, 1], [5, 0], [5, 1], [10, 1], [10, 0], [11, 1], [11, 2]].forEach(([x, y]) => set(x, y));
    [[2, 5], [1, 4], [0, 3], [0, 4], [1, 6], [0, 7], [13, 5], [14, 4], [15, 3], [15, 4], [14, 6], [15, 7]].forEach(([x, y]) => set(x, y, '2'));
    [[2, 6], [1, 7], [13, 6], [14, 7], [13, 10], [14, 10], [15, 9], [15, 10], [14, 11]].forEach(([x, y]) => set(x, y));
  }
  return grid.map((row) => row.join(''));
}

function PixelArt({ map, className = '', label }: { map: string[]; className?: string; label?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = Math.max(...map.map((row) => row.length));
    canvas.width = width;
    canvas.height = map.length;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, width, map.length);
    map.forEach((row, y) => [...row].forEach((pixel, x) => {
      const color = RETRO_PALETTE[Number(pixel)];
      if (!color || color === 'transparent') return;
      context.fillStyle = color;
      context.fillRect(x, y, 1, 1);
    }));
  }, [map]);

  return <canvas ref={canvasRef} className={`pixel-art ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

function loadPet() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') as PetState | null;
    if (saved?.version === 3) return simulateOffline({ ...createPet(saved.sound), ...saved, screen: saved.screen === 'select' ? 'select' : 'home', miniGame: null });
  } catch (error) {
    console.warn('Не удалось прочитать сохранение', error);
  }
  return createPet();
}

function IconAsset({ index, className = '' }: { index: number; className?: string }) {
  const column = index % 4;
  const row = Math.floor(index / 4);
  return (
    <span
      className={`icon-asset ${className}`}
      style={{ backgroundPosition: `${column * 33.333}% ${row * 100}%` }}
      aria-hidden="true"
    />
  );
}

function PetSprite({ state, compact = false, speciesOverride, spriteOverride }: {
  state: PetState;
  compact?: boolean;
  speciesOverride?: SpeciesId;
  spriteOverride?: number;
}) {
  const index = spriteOverride ?? spriteIndex(state);
  const species = speciesOverride ?? state.species;
  const column = index % 3;
  const row = Math.floor(index / 3);
  return (
    <div
      className={`pet-sprite ${compact ? 'compact' : ''} ${state.asleep ? 'sleeping' : ''}`}
      data-species={species}
      style={{
        backgroundImage: `url('${SPECIES.find((item) => item.id === species)?.atlas ?? SPECIES[0].atlas}')`,
        backgroundPosition: `var(--sprite-x, ${column * 50}%) var(--sprite-y, ${row * 50}%)`,
      }}
      role="img"
      aria-label={`${state.name}, ${STAGE_LABELS[state.stage]}`}
    />
  );
}

function PetVisual({ state, compact = false, retro = false, speciesOverride, spriteOverride }: {
  state: PetState;
  compact?: boolean;
  retro?: boolean;
  speciesOverride?: SpeciesId;
  spriteOverride?: number;
}) {
  const species = speciesOverride ?? state.species;
  const index = spriteOverride ?? spriteIndex(state);
  if (retro) {
    return (
      <PixelArt
        map={retroPetPixels(species, index)}
        className={`pixel-pet ${compact ? 'compact' : ''} ${state.asleep ? 'sleeping' : ''}`}
        label={`${state.name}, ${STAGE_LABELS[state.stage]}`}
      />
    );
  }
  return <PetSprite state={state} compact={compact} speciesOverride={species} spriteOverride={index} />;
}

function IconVisual({ index, retro = false }: { index: number; retro?: boolean }) {
  return retro
    ? <PixelArt map={ICON_PIXELS[index]} className="pixel-icon" />
    : <IconAsset index={index} />;
}

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="meter">
      <div className="meter-label"><span>{label}</span><strong>{Math.round(value)}%</strong></div>
      <div className="meter-track"><span style={{ width: pct(value), background: tone }} /></div>
    </div>
  );
}

interface GameActions {
  act: (action: ActionId) => void;
  feed: (kind: 'meal' | 'snack') => void;
  press: (button: 'a' | 'b' | 'c') => void;
  chooseGame: () => void;
  selectSpecies: (species: SpeciesId) => void;
}

function SpeciesScreen({ state, actions, retro = false }: { state: PetState; actions: GameActions; retro?: boolean }) {
  const selected = SPECIES[state.speciesIndex] ?? SPECIES[0];
  return (
    <div className="screen-page species-screen">
      <div className="screen-topline"><span>ВЫБЕРИ ДРУГА</span><span>{state.speciesIndex + 1}/4</span></div>
      <div className="species-grid">
        {SPECIES.map((species, index) => (
          <button
            key={species.id}
            className={index === state.speciesIndex ? 'selected' : ''}
            onClick={() => actions.selectSpecies(species.id)}
            aria-label={`Выбрать: ${species.name}`}
          >
            <PetVisual state={state} retro={retro} speciesOverride={species.id} spriteOverride={2} />
            <span>{species.shortName}</span>
          </button>
        ))}
      </div>
      <div className="species-caption"><b>{selected.name}</b><span>{selected.trait}</span></div>
    </div>
  );
}

function HomeScreen({ state, message, retro = false }: { state: PetState; message: string; retro?: boolean }) {
  const callout = state.dead
    ? 'Спасибо за заботу…'
    : message || (state.callReason ? NEED_LABELS[state.callReason] : state.stage === 'egg' ? 'Скоро увидимся!' : state.asleep ? 'Тихо сопит…' : 'Рад тебя видеть!');

  return (
    <div className={`screen-page home-screen ${state.lightsOff ? 'lights-off' : ''}`}>
      <div className="screen-topline"><span>{state.name.toUpperCase()}</span><span>ДЕНЬ {state.ageDays + 1}</span></div>
      <div className={`speech ${state.callReason ? 'urgent' : ''}`}>{callout}</div>
      <div className="pet-stage">
        <PetVisual state={state} retro={retro} />
        {state.asleep && <span className="zzz">z z z</span>}
      </div>
      <div className="ground-line">
        <span>{state.sick ? 'болеет' : state.asleep ? 'спит' : 'бодрствует'}</span>
        {state.poops > 0 && <span>{!retro && <Trash2 aria-hidden="true" />}уборка ×{state.poops}</span>}
      </div>
      {state.dead && <button className="screen-primary">B — новое яйцо</button>}
    </div>
  );
}

function MenuScreen({ state, actions, retro = false }: { state: PetState; actions: GameActions; retro?: boolean }) {
  return (
    <div className="screen-page menu-screen">
      <div className="screen-topline"><span>УХОД</span><span>{state.menuIndex + 1}/8</span></div>
      <div className="screen-menu-grid">
        {MENU.map((item, index) => (
          <button
            key={item.id}
            className={index === state.menuIndex ? 'selected' : ''}
            onClick={() => actions.act(item.id)}
            aria-label={item.label}
          >
            <IconVisual index={item.icon} retro={retro} />
          </button>
        ))}
      </div>
      <div className="screen-caption">
        <strong>{MENU[state.menuIndex].label}</strong>
        <span>{MENU[state.menuIndex].hint}</span>
      </div>
    </div>
  );
}

function StatusScreen({ state }: { state: PetState }) {
  const pages = [
    [['Сытость', state.hunger], ['Радость', state.happiness], ['Здоровье', state.health]],
    [['Энергия', state.energy], ['Чистота', state.hygiene], ['Характер', state.discipline]],
  ] as const;

  return (
    <div className="screen-page status-screen">
      <div className="screen-topline"><span>СОСТОЯНИЕ</span><span>{state.statusPage + 1}/3</span></div>
      {state.statusPage < 2 ? (
        <div className="lcd-meters">
          {pages[state.statusPage].map(([label, value]) => <Meter key={label} label={label} value={value} tone="#88ddb6" />)}
        </div>
      ) : (
        <div className="facts">
          <span><b>Возраст</b>{state.ageDays} дн.</span>
          <span><b>Вес</b>{state.weight.toFixed(1)} кг</span>
          <span><b>Этап</b>{STAGE_LABELS[state.stage]}</span>
          <span><b>Победы</b>{state.gamesWon}</span>
          <span><b>Ошибки</b>{state.careMistakes}</span>
        </div>
      )}
      <p className="screen-tip">A/B — следующая страница</p>
    </div>
  );
}

function DeviceScreen({ state, message, actions, retro = false }: { state: PetState; message: string; actions: GameActions; retro?: boolean }) {
  if (state.screen === 'select') return <SpeciesScreen state={state} actions={actions} retro={retro} />;
  if (state.screen === 'menu') return <MenuScreen state={state} actions={actions} retro={retro} />;
  if (state.screen === 'food') return (
    <div className="screen-page food-screen">
      <div className="screen-topline"><span>ЧЕМ УГОСТИТЬ?</span><span>{state.foodIndex + 1}/2</span></div>
      {[
        { name: 'Тёплый обед', note: '+28 сытости', index: 0 },
        { name: 'Звёздное печенье', note: '+13 радости', index: 5 },
      ].map((item, index) => (
        <button key={item.name} className={state.foodIndex === index ? 'selected' : ''} onClick={() => actions.feed(index ? 'snack' : 'meal')}>
          <IconVisual index={item.index} retro={retro} />
          <span><b>{item.name}</b><small>{item.note}</small></span>
        </button>
      ))}
    </div>
  );
  if (state.screen === 'status') return <StatusScreen state={state} />;
  if (state.screen === 'clock') {
    const real = new Date();
    const time = `${String(petHour(state)).padStart(2, '0')}:${String(petMinute(state)).padStart(2, '0')}`;
    return (
      <div className="screen-page clock-screen">
        <IconVisual index={7} retro={retro} />
        <strong>{time}</strong><span>время Луми</span>
        <small>{real.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} у тебя</small>
      </div>
    );
  }
  if (state.screen === 'game' && state.miniGame) {
    const game = state.miniGame;
    return (
      <div className="screen-page game-screen">
        <div className="screen-topline"><span>ПРЫЖОК {game.round}/5</span><span className="game-score">{game.score}{!retro && <Star aria-hidden="true" fill="currentColor" />}</span></div>
        <PetVisual state={state} compact retro={retro} />
        <p>{game.phase === 'result' ? game.result : 'Куда прыгнет Луми?'}</p>
        <div className="game-choices">
          {[0, 1].map((choice) => (
            <button
              key={choice}
              className={game.cursor === choice ? 'selected' : ''}
              onClick={() => game.phase === 'choose' && actions.press(choice === game.cursor ? 'b' : 'a')}
            >{retro ? (choice === 0 ? '←' : '→') : choice === 0 ? <ArrowLeft aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}</button>
          ))}
        </div>
      </div>
    );
  }
  return <HomeScreen state={state} message={message} retro={retro} />;
}

function RetroDevice({ state, message, actions, press }: {
  state: PetState;
  message: string;
  actions: GameActions;
  press: (button: 'a' | 'b' | 'c') => void;
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
            {state.paused && <div className="pause-overlay"><b>ПАУЗА</b><span>ВРЕМЯ ОСТАНОВЛЕНО</span></div>}
          </div>
        </div>
        <div className="retro-controls" aria-label="Управление">
          {(['a', 'b', 'c'] as const).map((button, index) => (
            <div className="retro-control" key={button}>
              <button onClick={() => press(button)} aria-label={`Кнопка ${button.toUpperCase()}`}>{button.toUpperCase()}</button>
              <span>{['ЛИСТАТЬ', 'ВЫБРАТЬ', 'НАЗАД'][index]}</span>
            </div>
          ))}
        </div>
        <div className="retro-speaker" aria-hidden="true">••••••••••••</div>
      </div>
      <div className="retro-keyboard-hint">
        <span>A / ←</span><span>B / ENTER</span><span>C / ESC</span>
      </div>
    </section>
  );
}

function App() {
  const [state, setState] = useState<PetState>(loadPet);
  const [message, setMessage] = useState('');
  const [retroMode, setRetroMode] = useState(() => localStorage.getItem(VISUAL_MODE_KEY) !== 'modern');
  const [focusReaction, setFocusReaction] = useState(false);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [nameDraft, setNameDraft] = useState(state.name);
  const messageTimer = useRef<number | undefined>(undefined);
  const focusReactionTimer = useRef<number | undefined>(undefined);
  const focusReactionFrame = useRef<number | undefined>(undefined);
  const wasAway = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const previousStage = useRef(state.stage);
  const tabPresentation = getTabPresentation(state);

  const say = useCallback((text: string) => {
    setMessage(text);
    window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(() => setMessage(''), 2400);
  }, []);

  const beep = useCallback((frequency = 620, duration = 0.06) => {
    if (!state.sound) return;
    try {
      const Audio = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    } catch { /* audio is optional */ }
  }, [state.sound]);

  useEffect(() => {
    const timer = window.setInterval(() => setState((current) => advanceSecond(current)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(VISUAL_MODE_KEY, retroMode ? 'retro' : 'modern');
  }, [retroMode]);

  useEffect(() => {
    const markAway = () => { wasAway.current = true; };
    const welcomeBack = () => {
      if (!wasAway.current || document.hidden) return;
      wasAway.current = false;
      if (retroMode) return;

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
  }, [retroMode, say, state.dead, state.screen]);

  useEffect(() => () => {
    window.clearTimeout(focusReactionTimer.current);
    window.cancelAnimationFrame(focusReactionFrame.current ?? 0);
  }, []);

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

  useEffect(() => {
    document.title = tabPresentation.title;
    const favicon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!favicon) return;

    let cancelled = false;
    const source = new Image();
    source.src = FAVICON_SOURCE;
    source.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.drawImage(source, 0, 0, 64, 64);
      context.beginPath();
      context.arc(49, 49, 13, 0, Math.PI * 2);
      context.fillStyle = tabPresentation.badgeColor;
      context.fill();
      context.lineWidth = 3;
      context.strokeStyle = '#fff8eb';
      context.stroke();
      context.fillStyle = '#ffffff';
      context.font = '700 18px system-ui, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(tabPresentation.badge, 49, 48);
      favicon.href = canvas.toDataURL('image/png');
    };

    return () => { cancelled = true; };
  }, [tabPresentation.badge, tabPresentation.badgeColor, tabPresentation.title]);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if (previousStage.current !== state.stage) {
      previousStage.current = state.stage;
      say(state.stage === 'baby' ? 'Пи-пи! Я родился!' : `Новая форма: ${STAGE_LABELS[state.stage]}!`);
      beep(880, 0.12);
    }
  }, [state, say, beep]);

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

  const feed = useCallback((kind: 'meal' | 'snack') => {
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
    say(kind === 'meal' ? 'Ням! Как вкусно!' : 'Хрум-хрум!');
    beep(740);
  }, [beep, say]);

  const act = useCallback((action: ActionId) => {
    beep(620);
    if (action === 'food') {
      setState((current) => ({ ...current, screen: current.stage === 'egg' ? 'home' : 'food', foodIndex: 0 }));
      return;
    }
    if (action === 'status' || action === 'clock') {
      setState((current) => ({ ...current, screen: action, statusPage: 0 }));
      return;
    }
    if (action === 'game') {
      setState((current) => {
        if (current.stage === 'egg' || current.dead || current.asleep || current.sick || current.energy < 8) return current;
        return { ...current, screen: 'game', miniGame: { round: 1, score: 0, cursor: 0, petChoice: Math.random() < 0.5 ? 0 : 1, phase: 'choose', result: '' } };
      });
      return;
    }
    setState((current) => {
      if (current.stage === 'egg' || current.dead) return current;
      if (action === 'clean') {
        say(current.poops ? 'Снова чисто!' : 'И так всё блестит');
        return { ...current, poops: 0, hygiene: 100, health: Math.min(100, current.health + 4), callReason: satisfy(current, ['dirty']), screen: 'home' };
      }
      if (action === 'medicine') {
        say(current.sick ? 'Уже гораздо лучше!' : 'Фу, горько…');
        return { ...current, sick: false, health: Math.min(100, current.health + (current.sick ? 12 : 0)), happiness: Math.max(0, current.happiness - (current.sick ? 0 : 3)), callReason: satisfy(current, ['sick']), screen: 'home' };
      }
      if (action === 'light') {
        const lightsOff = !current.lightsOff;
        say(lightsOff ? (current.asleep ? 'Спокойной ночи…' : 'Ой, темно!') : 'Свет включён');
        return { ...current, lightsOff, callReason: lightsOff ? satisfy(current, ['sleepy']) : current.callReason, screen: 'home' };
      }
      const correct = current.callReason === 'attention' && current.hunger > 35 && current.happiness > 30 && !current.sick && current.poops === 0;
      say(correct ? 'Хорошо, не капризничаю' : 'Но я же не шалил!');
      return {
        ...current,
        discipline: Math.max(0, Math.min(100, current.discipline + (correct ? 12 : -2))),
        happiness: Math.max(0, current.happiness - (correct ? 3 : 8)),
        callReason: correct ? null : current.callReason,
        screen: 'home',
      };
    });
  }, [beep, say]);

  const selectSpecies = useCallback((species: SpeciesId) => {
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
    beep(880, 0.1);
  }, [beep, say]);

  const selectMenu = useCallback(() => {
    const item = MENU[state.menuIndex];
    act(item.id);
  }, [act, state.menuIndex]);

  const press = useCallback((button: 'a' | 'b' | 'c') => {
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
        setState(createPet(state.sound));
        say('Новое яйцо!');
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
        setState((current) => ({ ...current, miniGame: current.miniGame ? { ...current.miniGame, cursor: current.miniGame.cursor ? 0 : 1 } : null }));
      } else {
        setState((current) => {
          if (!current.miniGame) return current;
          const won = current.miniGame.cursor === current.miniGame.petChoice;
          return { ...current, miniGame: { ...current.miniGame, score: current.miniGame.score + (won ? 1 : 0), phase: 'result', result: won ? 'Угадал!' : 'Мимо!' } };
        });
      }
    }
  }, [beep, feed, say, selectMenu, selectSpecies, state.dead, state.foodIndex, state.miniGame?.phase, state.screen, state.sound, state.speciesIndex]);

  useEffect(() => {
    if (state.screen !== 'game' || state.miniGame?.phase !== 'result') return;
    const timer = window.setTimeout(() => {
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
        return { ...current, miniGame: { ...game, round: game.round + 1, petChoice: Math.random() < 0.5 ? 0 : 1, phase: 'choose', result: '' } };
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [say, state.miniGame?.phase, state.screen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (dialogRef.current?.open) return;
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') { event.preventDefault(); press('a'); }
      if (key === 'b' || key === 'enter' || key === ' ') { event.preventDefault(); press('b'); }
      if (key === 'c' || key === 'escape' || key === 'backspace') { event.preventDefault(); press('c'); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [press]);

  const actions = useMemo<GameActions>(() => ({ act, feed, press, chooseGame: () => press('b'), selectSpecies }), [act, feed, press, selectSpecies]);
  const alertCount = [state.hunger < 25, state.happiness < 22, state.poops > 0, state.sick, state.callReason].filter(Boolean).length;

  const closeDialog = () => {
    dialogRef.current?.close();
    setDialog(null);
    window.requestAnimationFrame(() => dialogTrigger.current?.focus());
  };

  const openDialog = (kind: DialogKind) => {
    dialogTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (kind === 'rename') setNameDraft(state.name);
    setDialog(kind);
  };

  const rename = () => {
    openDialog('rename');
  };

  const reset = () => {
    openDialog('reset');
  };

  const submitDialog = () => {
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
      setState(createPet(state.sound));
      closeDialog();
      say('Новое яйцо уже согревается');
    }
  };

  return (
    <main className={`app-shell ${retroMode ? 'retro-mode' : 'modern-mode'}`}>
      <header className="topbar">
        <div className="brand-lockup"><span className="brand-star"><Sparkles aria-hidden="true" /></span><div><b>LUMI</b><small>карманный друг</small></div></div>
        <div className="topbar-actions">
          {FAST_MODE && <span className="fast-badge">быстрый режим</span>}
          <button className="mode-toggle" onClick={() => setRetroMode((current) => !current)}>
            {retroMode ? 'Режим: ретро' : 'Режим: уют'}
          </button>
          <button onClick={() => setState((current) => ({ ...current, sound: !current.sound }))}>{state.sound ? 'Звук включён' : 'Без звука'}</button>
          <button onClick={() => setState((current) => ({ ...current, paused: !current.paused }))}>{state.paused ? 'Продолжить' : 'Пауза'}</button>
          <button onClick={reset}>Новый питомец</button>
        </div>
      </header>

      {retroMode ? (
        <RetroDevice state={state} message={message} actions={actions} press={press} />
      ) : (
      <section className="game-layout">
        <aside className="pet-card panel">
          <div className="pet-card-head">
            <div><span>ТВОЙ ПИТОМЕЦ</span><button className="rename-button" onClick={rename}>{state.name}<Pencil aria-hidden="true" /></button></div>
            <span className={`pulse-dot ${alertCount ? 'alert' : ''}`} aria-label={alertCount ? 'Нужно внимание' : 'Всё хорошо'} />
          </div>
          <div className="stage-row"><span>{SPECIES.find((item) => item.id === state.species)?.name ?? 'Росток'} · {STAGE_LABELS[state.stage]}</span><small>{state.ageDays} дн. · {state.weight.toFixed(1)} кг</small></div>
          <div className="primary-meters">
            <Meter label="Сытость" value={state.hunger} tone="#f2b56b" />
            <Meter label="Радость" value={state.happiness} tone="#ef86a7" />
            <Meter label="Здоровье" value={state.health} tone="#83d2ae" />
            <Meter label="Энергия" value={state.energy} tone="#a897ea" />
          </div>
          <div className="mood-note">
            <span>НАСТРОЕНИЕ</span>
            <p>{state.dead ? 'Луми оставил добрые воспоминания.' : state.callReason ? NEED_LABELS[state.callReason] : state.sick ? 'Нужна помощь и немного лекарства.' : state.asleep ? 'Сладко спит под звёздным ночником.' : 'Всё хорошо. Можно немного поиграть!'}</p>
          </div>
          <button className="reset-link" onClick={reset}>Начать с нового яйца</button>
        </aside>

        <section className="device-zone" aria-label="Игровое устройство">
          <div className={`device-wrap ${focusReaction ? 'focus-return' : ''}`}>
            <img className="device-art" src="/assets/device.png" alt="Лавандовый карманный тамагочи" />
            <div className="device-screen">
              <DeviceScreen state={state} message={message} actions={actions} />
              {state.paused && <div className="pause-overlay"><b>Пауза</b><span>время остановлено</span></div>}
            </div>
            {(['a', 'b', 'c'] as const).map((button) => (
              <button
                key={button}
                className={`device-key key-${button}`}
                onClick={() => press(button)}
                aria-label={`Кнопка ${button.toUpperCase()}`}
              ><span>{button.toUpperCase()}</span></button>
            ))}
          </div>
          <div className="key-hint">
            <span>A · листать <ArrowLeft aria-hidden="true" /></span>
            <span>B · выбрать <CornerDownLeft aria-hidden="true" /></span>
            <span>C · назад <Undo2 aria-hidden="true" /></span>
          </div>
        </section>

        <aside className="action-card panel">
          <div className="aside-title"><div><span>БЫСТРЫЙ УХОД</span><b>{alertCount ? `${alertCount} ${alertCount === 1 ? 'сигнал' : 'сигнала'}` : 'всё спокойно'}</b></div><small>Нажми на действие</small></div>
          <div className="action-grid">
            {MENU.map((item) => (
              <button key={item.id} onClick={() => act(item.id)}>
                <IconAsset index={item.icon} />
                <span><b>{item.label}</b><small>{item.hint}</small></span>
              </button>
            ))}
          </div>
          <div className="tip-card"><IconAsset index={4} /><p><b>Подсказка дня</b>Если Луми уснул, выключи ночник. Так энергия восстановится быстрее.</p></div>
        </aside>
      </section>
      )}

      <dialog
        ref={dialogRef}
        className="app-dialog"
        role={dialog === 'reset' ? 'alertdialog' : 'dialog'}
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-description"
        onCancel={(event) => { event.preventDefault(); closeDialog(); }}
        onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('input:not([disabled]), button:not([disabled])')];
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
        <form onSubmit={(event) => { event.preventDefault(); submitDialog(); }}>
          <div className={`dialog-icon ${dialog === 'reset' ? 'danger' : ''}`} aria-hidden="true">
            {dialog === 'reset' ? <TriangleAlert /> : <Pencil />}
          </div>
          <div className="dialog-copy">
            <h2 id="app-dialog-title">{dialog === 'reset' ? 'Начать заново?' : 'Как зовут питомца?'}</h2>
            <p id="app-dialog-description">
              {dialog === 'reset' ? 'Текущий прогресс будет удалён, а выбор нового яйца начнётся сначала.' : 'Имя можно изменить в любой момент. До 10 символов.'}
            </p>
          </div>
          {dialog === 'rename' && (
            <label className="dialog-field" htmlFor="pet-name">
              <span>Имя питомца</span>
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
            <button type="button" className="dialog-secondary" data-autofocus={dialog === 'reset' ? '' : undefined} onClick={closeDialog}>
              <X aria-hidden="true" />Отмена
            </button>
            <button type="submit" className={`dialog-primary ${dialog === 'reset' ? 'danger' : ''}`} disabled={dialog === 'rename' && !nameDraft.trim()}>
              {dialog === 'reset' ? <RotateCcw aria-hidden="true" /> : <Check aria-hidden="true" />}
              {dialog === 'reset' ? 'Начать заново' : 'Сохранить'}
            </button>
          </div>
        </form>
      </dialog>

    </main>
  );
}

export default App;
