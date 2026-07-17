import { type ActionId, MENU } from '../../game';
import { PixelArt } from './PixelArt';
import { ICON_PIXELS } from './pixelMatrices';

export function RitualIcon({ action }: { action: ActionId }) {
  return <span className={`ritual-icon ritual-${action}`} aria-hidden="true" />;
}

export function IconVisual({ index, retro = false }: { index: number; retro?: boolean }) {
  return retro ? (
    <PixelArt map={ICON_PIXELS[index]} className="pixel-icon" />
  ) : (
    <RitualIcon action={MENU[index]?.id ?? 'status'} />
  );
}
