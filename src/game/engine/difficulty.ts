import type { Difficulty } from "../types";

export type DifficultySpec = {
  playerHp: number;
  gold: number;
  maxEnergy: number;
  enemyHp: number;
  enemyDamage: number;
  rewardGold: number;
  startingRelics: string[];
  logName: string;
};

export const DIFFICULTY_SPECS: Record<Difficulty, DifficultySpec> = {
  story: {
    playerHp: 96,
    gold: 90,
    maxEnergy: 4,
    enemyHp: 0.82,
    enemyDamage: 0.72,
    rewardGold: 1.25,
    startingRelics: ["oldUmbrella", "blankPage"],
    logName: "演示模式",
  },
  normal: {
    playerHp: 84,
    gold: 65,
    maxEnergy: 3,
    enemyHp: 0.92,
    enemyDamage: 0.9,
    rewardGold: 1.1,
    startingRelics: [],
    logName: "标准值班",
  },
  hard: {
    playerHp: 74,
    gold: 45,
    maxEnergy: 3,
    enemyHp: 1.08,
    enemyDamage: 1.08,
    rewardGold: 1,
    startingRelics: [],
    logName: "高压演练",
  },
};
