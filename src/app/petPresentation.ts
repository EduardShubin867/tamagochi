import type { ActionId } from '../game';

export type PrimaryStat = 'hunger' | 'happiness' | 'health' | 'energy';

export type PetReactionKind =
  | 'eat'
  | 'treat'
  | 'play'
  | 'clean'
  | 'heal'
  | 'bitter'
  | 'sleep'
  | 'wake'
  | 'praise'
  | 'scold'
  | 'pet'
  | 'startle'
  | 'observe';

export type IdleBehavior = 'look' | 'leaf' | 'yawn' | 'stomp' | 'shake' | 'sigh';

export interface PetReaction {
  id: number;
  kind: PetReactionKind;
  action?: ActionId;
  stat?: PrimaryStat;
  delta?: number;
}

export type PetReactionInput = Omit<PetReaction, 'id'>;
export type TriggerPetReaction = (reaction: PetReactionInput, duration?: number) => void;
