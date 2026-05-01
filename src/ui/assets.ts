const assetUrl = (path: string) => new URL(`../../assets/${path}`, import.meta.url).href;

export const hudBloodUrl = assetUrl("vendor/shushan/icon-blood-orb.png");
export const baguaIconUrl = assetUrl("vendor/shushan/icon-bagua-gold.png");
export const talismanIconUrl = assetUrl("vendor/shushan/icon-talisman-paper.png");
export const swordFireUrl = assetUrl("vendor/shushan/icon-sword-flame.png");
export const swordCrossUrl = assetUrl("vendor/shushan/icon-sword-cross.png");
export const blockBadgeUrl = assetUrl("vendor/shushan/badge-shield.png");
export const incenseBadgeUrl = assetUrl("vendor/shushan/relic-bell.png");
export const sealBadgeUrl = assetUrl("vendor/shushan/relic-orb-blue.png");
export const pileDrawUrl = assetUrl("vendor/shushan/badge-scroll.png");
export const pileDiscardUrl = assetUrl("vendor/shushan/icon-talisman-paper.png");
export const relicIconUrl = assetUrl("vendor/shushan/relic-umbrella.png");
export const goldIconUrl = assetUrl("vendor/shushan/icon-bagua-gold.png");
export const mapIconUrl = assetUrl("vendor/aigei/pile-draw.png");
export const gameIconUrl = assetUrl("marketing/icon.png");

export const costGemUrls: Record<string, string> = {
  empty: assetUrl("vendor/shushan/cost/cost-empty.png"),
  "0": assetUrl("vendor/shushan/cost/cost-0.png"),
  "1": assetUrl("vendor/shushan/cost/cost-1.png"),
  "2": assetUrl("vendor/shushan/cost/cost-2.png"),
  "3": assetUrl("vendor/shushan/cost/cost-3.png"),
};

export const playerNightPatrolUrl = assetUrl("generated/characters/player-night-patrol.png");
export const sceneLoopVideoUrl = assetUrl("generated/backgrounds/night-temple-loop.mp4");

export const enemyArtUrls: Record<string, string> = {
  lantern: assetUrl("generated/enemies/lantern.png"),
  waterghost: assetUrl("generated/enemies/waterghost.png"),
  templecorpse: assetUrl("generated/enemies/templecorpse.png"),
  macaque: assetUrl("generated/enemies/macaque.png"),
  warlock: assetUrl("generated/enemies/warlock.png"),
  foxshade: assetUrl("generated/enemies/foxshade.png"),
  tigerlord: assetUrl("generated/enemies/tigerlord.png"),
};

export const cinematicPosterUrls: Record<string, string> = {
  lantern: assetUrl("generated/cinematics/victory-lantern-poster.png"),
  waterghost: assetUrl("generated/cinematics/victory-waterghost-poster.png"),
  templecorpse: assetUrl("generated/cinematics/victory-templecorpse-poster.png"),
  macaque: assetUrl("generated/cinematics/victory-macaque-poster.png"),
  warlock: assetUrl("generated/cinematics/victory-warlock-poster.png"),
  foxshade: assetUrl("generated/cinematics/victory-foxshade-poster.png"),
  "boss-tigerlord": assetUrl("generated/cinematics/victory-boss-tigerlord-poster.png"),
};

export const cinematicVideoUrls: Record<string, string> = {
  lantern: assetUrl("generated/cinematics/victory-lantern.mp4"),
  waterghost: assetUrl("generated/cinematics/victory-waterghost.mp4"),
  templecorpse: assetUrl("generated/cinematics/victory-templecorpse.mp4"),
  macaque: assetUrl("generated/cinematics/victory-macaque.mp4"),
  warlock: assetUrl("generated/cinematics/victory-warlock.mp4"),
  foxshade: assetUrl("generated/cinematics/victory-foxshade.mp4"),
  "boss-tigerlord": assetUrl("generated/cinematics/victory-boss-tigerlord.mp4"),
};
