import type { ActionId, PetState } from './game';

interface ActionLabel {
  label: string;
  hint: string;
}

export const quickCareCopy = {
  title: 'РИТУАЛЫ УХОДА',
  prompt: 'Выбери резной знак',
  hintTitle: 'Запись Герды',
} as const;

export const actionLabels = {
  food: { label: 'Подкормить', hint: 'дать отвар или вкусняшку' },
  game: { label: 'Растормошить', hint: 'поднять настроение' },
  clean: { label: 'Обмыть корешок', hint: 'смыть грязь и вернуть чистоту' },
  medicine: { label: 'Целебный отвар', hint: 'помочь при хвори' },
  light: { label: 'Уложить в корни', hint: 'отправить спать' },
  status: { label: 'Сила корня', hint: 'проверить самочувствие' },
  discipline: { label: 'Унять нрав', hint: 'реагировать на капризы' },
  clock: { label: 'Ход времени', hint: 'посмотреть распорядок' },
} satisfies Record<ActionId, ActionLabel>;

export type MandrakeCondition = 'normal' | 'hungry' | 'sad' | 'dirty' | 'sick' | 'sleepy' | 'capricious' | 'critical';

export const mandrakeStatuses = {
  normal: 'всё тихо под корнями',
  hungry: 'корешок проголодался',
  sad: 'мандрагора заскучала',
  dirty: 'пора обмыть корешок',
  sick: 'корень прихворнул',
  sleepy: 'корешок клюёт носом',
  capricious: 'нрав разбушевался',
  critical: 'силы корня на исходе',
} satisfies Record<MandrakeCondition, string>;

const healingHint = 'При хвори приготовь целебный отвар. Одними добрыми словами корень не вылечить.';

export const caretakerHints = {
  normal: 'Если корешок уснул, не тревожь его. Во сне силы возвращаются быстрее.',
  hungry: 'Не заставляй корешок голодать. От пустого желудка его нрав становится только хуже.',
  sad: 'Иногда корешок ворчит не от злости. Попробуй его растормошить.',
  dirty: 'Сначала обмой корешок, а потом уже пускай его обратно в постель.',
  sick: healingHint,
  sleepy: 'Уложи мандрагору в корни и дай ей спокойно восстановить силы.',
  capricious: 'Не потакай каждому воплю. Даже мандрагора должна знать меру.',
  critical: healingHint,
} satisfies Record<MandrakeCondition, string>;

const mandrakePhrases = [
  'Не трогай листья. Я сама знаю, как их растить.',
  'Я не грязная. Это целебная земля.',
  'Ещё ложку. Последнюю. Наверное.',
  'Я вовсе не капризничаю. Я выражаю недовольство.',
  'Поставь меня ближе к огню. Но не слишком близко!',
  'Я не кусалась. Твоя рука сама оказалась рядом.',
  'Спать не хочу. Просто глаза закрылись.',
] as const;

const gerdaPhrases = [
  'Не перекармливай её. Потом сама же будешь слушать вопли.',
  'Корешок притих — значит, либо доволен, либо что-то задумал.',
  'Сначала обмой мандрагору, а потом позволяй ей лезть в постель.',
  'Отвар не обязан быть вкусным. Он обязан помогать.',
  'Спящий корень лучше не тревожить без причины.',
] as const;

const hedaPhrases = [
  'Опять раскричалась? Значит, сил у неё ещё достаточно.',
  'Не потакай этому корню, иначе совсем распустится.',
  'Если кусается — укуси в ответ. Шучу. Наверное.',
  'На листья смотри. По ним сразу видно, когда что-то не так.',
  'Землю поменяй, пока она сама не потребовала новый горшок.',
] as const;

const petInteractionPhrases = {
  normal: [
    'Ладно, можешь погладить. Один раз.',
    'Я слежу за тобой, между прочим.',
    'Листья не трогай… хотя уже поздно.',
  ],
  hungry: ['Руки тёплые. А еда где?', 'Гладить будешь после подкормки.'],
  sad: ['Ещё раз. Только никому не рассказывай.', 'Посиди рядом. Можешь даже молча.'],
  dirty: ['Не стряхивай землю! Она лечебная.', 'Сначала обмой корешок, потом обнимай.'],
  sick: ['Осторожнее… сегодня корни ноют.', 'Тише. Мне и без того нехорошо.'],
  sleepy: ['М-м-м… ещё пять минут под корнями.', 'Не буди. Я расту во сне.'],
  capricious: ['Ай! Я могла и укусить.', 'Это было поглаживание или покушение?'],
  critical: ['Не уходи далеко.', 'Посиди рядом, пока силы не вернутся.'],
} satisfies Record<MandrakeCondition, readonly string[]>;

export const characterPhrases = {
  mandrake: mandrakePhrases,
  gerda: gerdaPhrases,
  heda: hedaPhrases,
  afterAction: {
    food: [mandrakePhrases[2], gerdaPhrases[0]],
    game: [mandrakePhrases[3], gerdaPhrases[1]],
    clean: [mandrakePhrases[1], gerdaPhrases[2]],
    medicine: [gerdaPhrases[3]],
    light: [mandrakePhrases[6], gerdaPhrases[4]],
    discipline: [mandrakePhrases[5], hedaPhrases[1], hedaPhrases[2]],
  },
} as const;

export function getMandrakeCondition(state: PetState): MandrakeCondition {
  if (state.sick) return 'sick';
  if (state.health < 25 || state.hunger < 10 || state.happiness < 10 || state.energy < 10 || state.hygiene < 10)
    return 'critical';
  if (state.energy < 25 || state.callReason === 'sleepy') return 'sleepy';
  if (state.hunger < 25 || state.callReason === 'hungry') return 'hungry';
  if (state.hygiene < 35 || state.poops > 0 || state.callReason === 'dirty') return 'dirty';
  if (state.happiness < 30 || state.callReason === 'sad') return 'sad';
  if (state.callReason === 'attention' || state.discipline < 25) return 'capricious';
  return 'normal';
}

function getCriticalHintCondition(state: PetState): Exclude<MandrakeCondition, 'critical'> {
  if (state.health < 25) return 'sick';
  if (state.energy < 10) return 'sleepy';
  if (state.hunger < 10) return 'hungry';
  if (state.hygiene < 10) return 'dirty';
  return 'sad';
}

export function getQuickCarePresentation(state: PetState) {
  const condition = getMandrakeCondition(state);
  const hintCondition = condition === 'critical' ? getCriticalHintCondition(state) : condition;
  return {
    condition,
    status: mandrakeStatuses[condition],
    hint: caretakerHints[hintCondition],
  };
}

export function pickActionPhrase(action: ActionId, previousPhrase: string): string | null {
  const phrases = characterPhrases.afterAction[action as keyof typeof characterPhrases.afterAction];
  if (!phrases) return null;
  const candidates = phrases.filter((phrase) => phrase !== previousPhrase);
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function pickPetInteractionPhrase(state: PetState, previousPhrase: string): string {
  if (state.stage === 'egg') return 'Из кокона доносится недовольное шуршание.';
  const condition = getMandrakeCondition(state);
  const phrases = petInteractionPhrases[condition];
  const candidates = phrases.filter((phrase) => phrase !== previousPhrase);
  const pool = candidates.length ? candidates : phrases;
  return pool[Math.floor(Math.random() * pool.length)];
}
