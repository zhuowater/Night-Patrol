import { lazy } from "react";

export const LazyCombatStage = lazy(() => import("./CombatStage").then((module) => ({ default: module.CombatStage })));
