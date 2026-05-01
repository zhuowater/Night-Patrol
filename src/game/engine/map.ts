import { NODE_DEFS } from "../content";
import type { GameState, MapNode, NodeType } from "../types";
import { shuffle } from "./rng";

export const ROUTE_ROW_NAMES = ["边界", "办公网", "终端", "日志湖", "服务器区", "情报市", "核心域", "域控"];

export function nodeTrailLine(node: MapNode) {
  const row = ROUTE_ROW_NAMES[node.row] || "内网路径";
  const def = NODE_DEFS[node.type];
  if (node.type === "combat") return `进入${row}，探针捕获到新的异常握手。`;
  if (node.type === "elite") return `${row}告警级别抬升，高危攻击链已经展开。`;
  if (node.type === "event") return `${row}出现异常上下文，需要在误报、业务和风险之间取舍。`;
  if (node.type === "rest") return `${row}出现短暂维护窗口，可以恢复防线或升级剧本。`;
  if (node.type === "shop") return `${row}接入威胁情报市场，预算点正在等待分配。`;
  return `${row}尽头只剩${def.name}。`;
}

export function generateRouteMap(state: GameState): MapNode[] {
  const rows: Array<Array<{ lane: number; type: NodeType }>> = [
    [
      { lane: 1, type: "combat" },
      { lane: 3, type: "combat" },
    ],
    shuffle(state, [
      { lane: 0, type: "combat" as NodeType },
      { lane: 2, type: "event" as NodeType },
      { lane: 4, type: "combat" as NodeType },
    ]),
    shuffle(state, [
      { lane: 0, type: "elite" as NodeType },
      { lane: 2, type: "event" as NodeType },
      { lane: 4, type: "shop" as NodeType },
    ]),
    shuffle(state, [
      { lane: 1, type: "rest" as NodeType },
      { lane: 2, type: "combat" as NodeType },
      { lane: 3, type: "event" as NodeType },
    ]),
    shuffle(state, [
      { lane: 0, type: "elite" as NodeType },
      { lane: 2, type: "combat" as NodeType },
      { lane: 4, type: "event" as NodeType },
    ]),
    shuffle(state, [
      { lane: 0, type: "shop" as NodeType },
      { lane: 2, type: "rest" as NodeType },
      { lane: 4, type: "combat" as NodeType },
    ]),
    shuffle(state, [
      { lane: 1, type: "elite" as NodeType },
      { lane: 2, type: "rest" as NodeType },
      { lane: 3, type: "event" as NodeType },
    ]),
    [{ lane: 2, type: "boss" }],
  ];

  const nodes: MapNode[] = rows.flatMap((row, rowIndex) =>
    row
      .sort((a, b) => a.lane - b.lane)
      .map((node, index) => ({
        id: `n-${rowIndex}-${index}`,
        row: rowIndex,
        lane: node.lane,
        type: node.type,
        nextIds: [],
      })),
  );

  for (let row = 0; row < rows.length - 1; row += 1) {
    const current = nodes.filter((node) => node.row === row);
    const next = nodes.filter((node) => node.row === row + 1);
    current.forEach((node) => {
      const adjacent = next.filter((candidate) => Math.abs(candidate.lane - node.lane) <= 2);
      const fallback = [...next].sort((a, b) => Math.abs(a.lane - node.lane) - Math.abs(b.lane - node.lane));
      node.nextIds = (adjacent.length ? adjacent : fallback.slice(0, 2)).map((candidate) => candidate.id);
    });
  }
  return nodes;
}
