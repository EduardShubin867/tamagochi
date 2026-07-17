import type { PetState } from '../game';

const FAVICON_SOURCE = '/assets/favicon-mandrake.png';

interface TabPresentation {
  title: string;
  badge: string;
  badgeColor: string;
}

const TAB_NEEDS: Record<NonNullable<PetState['callReason']>, Omit<TabPresentation, 'badgeColor'>> = {
  hungry: { title: 'хочет есть', badge: '!' },
  sad: { title: 'хочет играть', badge: '!' },
  dirty: { title: 'просит уборки', badge: '!' },
  sick: { title: 'болеет', badge: '+' },
  sleepy: { title: 'хочет спать', badge: 'z' },
  attention: { title: 'зовёт тебя', badge: '!' },
};

export function getTabPresentation(state: PetState): TabPresentation {
  if (state.dead) return { title: `${state.name} — добрая память`, badge: '×', badgeColor: '#d84d67' };
  if (state.screen === 'select') return { title: 'Пробуди мандрагору', badge: '?', badgeColor: '#8a72d8' };
  if (state.sick) return { title: `${state.name} болеет`, badge: '+', badgeColor: '#d84d67' };
  if (state.health < 35) return { title: `${state.name} нужна помощь`, badge: '+', badgeColor: '#d84d67' };
  if (state.asleep && state.callReason === 'sleepy')
    return { title: `${state.name} спит`, badge: 'z', badgeColor: '#6572b9' };

  if (state.callReason) {
    const need = TAB_NEEDS[state.callReason];
    return { title: `${state.name} ${need.title}`, badge: need.badge, badgeColor: '#e89a35' };
  }

  if (state.poops > 0) return { title: `${state.name} просит уборки`, badge: '!', badgeColor: '#e89a35' };
  if (state.hunger < 25) return { title: `${state.name} хочет есть`, badge: '!', badgeColor: '#e89a35' };
  if (state.happiness < 22) return { title: `${state.name} грустит`, badge: '!', badgeColor: '#e89a35' };
  if (state.asleep) return { title: `${state.name} спит`, badge: 'z', badgeColor: '#6572b9' };
  if (state.energy < 20) return { title: `${state.name} устал`, badge: 'z', badgeColor: '#6572b9' };
  if (state.paused) return { title: `${state.name} — пауза`, badge: 'Ⅱ', badgeColor: '#777889' };
  if (state.stage === 'egg')
    return { title: `${state.name} скоро пробудится`, badge: '•', badgeColor: '#8a72d8' };
  return { title: `${state.name} — всё хорошо`, badge: '✓', badgeColor: '#4d9d78' };
}

export function updateTabPresentation(presentation: TabPresentation): () => void {
  document.title = presentation.title;
  const favicon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  if (!favicon) return () => undefined;

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
    context.fillStyle = presentation.badgeColor;
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = '#fff8eb';
    context.stroke();
    context.fillStyle = '#ffffff';
    context.font = '700 18px system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(presentation.badge, 49, 48);
    favicon.href = canvas.toDataURL('image/png');
  };

  return () => {
    cancelled = true;
  };
}
