import { BadgeCent, BookOpen, Shield, Sparkles, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { NODE_DEFS } from "../game/content";
import type { GameState, NodeType } from "../game/types";

const routeNames = ["边界", "办公网", "终端", "日志湖", "服务器区", "情报市", "核心域", "域控"];

export function MapScreen({ game, onChoose }: { game: GameState; onChoose: (nodeId: string) => void }) {
  const rows = routeNames.map((_, row) => game.mapNodes.filter((node) => node.row === row).sort((a, b) => a.lane - b.lane));
  const available = new Set(game.availableNodeIds);
  const visited = new Set(game.visitedNodeIds || []);
  const nodeById = new globalThis.Map(game.mapNodes.map((node) => [node.id, node]));
  const mapWidth = 400;
  const mapHeight = 640;
  const laneX = (lane: number) => 28 + (lane / 4) * (mapWidth - 56);
  const rowY = (row: number) => 26 + (row / (routeNames.length - 1)) * (mapHeight - 52);
  const links = game.mapNodes.flatMap((node) =>
    node.nextIds.flatMap((targetId) => {
      const target = nodeById.get(targetId);
      return target ? [{ from: node, to: target }] : [];
    }),
  );
  return (
    <section className="route-view">
      <div className="route-map-panel">
        <div className="route-header">
          <p className="eyebrow">响应路径</p>
          <h2>攻击链分叉</h2>
          <p>每个节点只通向几条后续链路。想压高危、找维护窗口、进情报市场，都要提前看两步。</p>
        </div>
        <div className="branch-map" style={{ "--map-rows": routeNames.length } as CSSProperties}>
          <svg className="branch-links" viewBox={`0 0 ${mapWidth} ${mapHeight}`} preserveAspectRatio="none" aria-hidden="true">
            {links.map(({ from, to }) => {
              const isPast = visited.has(from.id) && visited.has(to.id);
              const isOpen = available.has(from.id) || game.currentNodeId === from.id;
              return (
                <line
                  key={`${from.id}-${to.id}`}
                  className={`branch-link ${isOpen ? "open" : ""} ${isPast ? "past" : ""}`}
                  x1={laneX(from.lane)}
                  y1={rowY(from.row)}
                  x2={laneX(to.lane)}
                  y2={rowY(to.row)}
                />
              );
            })}
          </svg>
          {routeNames.map((name, rowIndex) => (
            <span key={name} className="branch-row-label" style={{ gridColumn: 1, gridRow: rowIndex + 1 }}>
              {name}
            </span>
          ))}
          {rows.flat().map((node) => {
            const isAvailable = available.has(node.id);
            const isCurrent = game.currentNodeId === node.id;
            const isPast = visited.has(node.id) && !isCurrent;
            return (
              <button
                key={node.id}
                type="button"
                className={`map-node map-node-${node.type} ${isAvailable ? "available" : ""} ${isCurrent ? "current" : ""} ${isPast ? "past" : ""}`}
                style={{ gridColumn: node.lane + 2, gridRow: node.row + 1 }}
                disabled={!isAvailable}
                onClick={() => onChoose(node.id)}
                title={NODE_DEFS[node.type].desc}
                aria-label={`${NODE_DEFS[node.type].name}，${NODE_DEFS[node.type].desc}${isAvailable ? "，可进入" : "，暂不可进入"}`}
              >
                {nodeIcon(node.type)}
                <span>{NODE_DEFS[node.type].name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <aside className="route-legend">
        <p className="eyebrow">路径情报</p>
        <h3>当前可选节点</h3>
        {game.availableNodeIds.map((id) => {
          const node = game.mapNodes.find((item) => item.id === id)!;
          const def = NODE_DEFS[node.type];
          return (
            <button key={id} type="button" className="route-option-card" onClick={() => onChoose(id)}>
              <span>{nodeIcon(node.type)}</span>
              <strong>{def.name}</strong>
              <em>{def.desc}</em>
            </button>
          );
        })}
      </aside>
    </section>
  );
}

function nodeIcon(type: NodeType) {
  if (type === "combat") return <Zap />;
  if (type === "elite") return <Shield />;
  if (type === "event") return <BookOpen />;
  if (type === "rest") return <Sparkles />;
  if (type === "shop") return <BadgeCent />;
  return <Shield />;
}

function logTone(log: string) {
  if (/获得|采购|预算|工具|响应动作/.test(log)) return { label: "收获", tone: "gain" };
  if (/造成|攻击|伤害|降权|暴露面|IOC|防护|强度|注入/.test(log)) return { label: "处置", tone: "combat" };
  if (/回复|升级|清理|维护|恢复/.test(log)) return { label: "整备", tone: "ready" };
  if (/误报|情报|供应链|异常|市场|维护窗口/.test(log)) return { label: "事件", tone: "event" };
  return { label: "路径", tone: "route" };
}

export function LogRail({ logs }: { logs: string[] }) {
  return (
    <aside className="log-rail">
      <strong>响应日志</strong>
      {logs.length === 0 && <span className="log-entry log-route"><small>路径</small><b>控制台刚刚启动，攻击路径还没有留下痕迹。</b></span>}
      {logs.map((log, index) => {
        const meta = logTone(log);
        return (
          <span className={`log-entry log-${meta.tone}`} key={`${log}-${index}`}>
            <small>{meta.label}</small>
            <b>{log}</b>
          </span>
        );
      })}
    </aside>
  );
}
