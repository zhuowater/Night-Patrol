import { CARD_DEFS } from "../content";
import type { CardInstance, GameState } from "../types";

export function cardDef(cardOrId: CardInstance | string) {
  return CARD_DEFS[typeof cardOrId === "string" ? cardOrId : cardOrId.id];
}

export function cardName(card: CardInstance) {
  return `${cardDef(card).name}${card.upgraded ? "+" : ""}`;
}

export function cardText(card: CardInstance) {
  return cardDef(card).text[card.upgraded ? 1 : 0];
}

export function cardCost(card: CardInstance) {
  return cardDef(card).cost;
}

export function createCard(state: GameState, id: string, upgraded = false, temp = false): CardInstance {
  return { uid: `card-${state.nextCardUid++}`, id, upgraded, temp };
}

export function cloneCard(state: GameState, card: CardInstance) {
  return createCard(state, card.id, card.upgraded, card.temp);
}

export function value(card: CardInstance, base: number, upgraded: number) {
  return card.upgraded ? upgraded : base;
}
