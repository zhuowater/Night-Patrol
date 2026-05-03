import { BadgeCent, BookOpen, Shield, Sparkles, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { NODE_DEFS } from "../game/content";
import type { GameState, NodeType } from "../game/types";

const routeNames = ["边界", "办公网", "终端", "日志湖", "服务器区", "情报市", "核心域", "域控"];

const nodeBrief: Record<NodeType, { risk: string; reward: string; advice: string; timing: string; bestWhen: string }> = {
  combat: { risk: "低-中", reward: "预算 + 响应动作", advice: "适合补构筑与稳定成长。", timing: "1 场标准战斗", bestWhen: "血量健康，想找关键牌" },
  elite: { risk: "高", reward: "安全工具", advice: "血量/牌组质量足够时优先。", timing: "高压战斗，收益永久", bestWhen: "有防护/爆发，能承受波动" },
  event: { risk: "不确定", reward: "资源或治理", advice: "适合用当前局势换取弹性。", timing: "立即二选一/三选一", bestWhen: "资源尴尬，需要翻盘选项" },
  rest: { risk: "低", reward: "回血或升级", advice: "残血、关键牌未升级时走这里。", timing: "无战斗，立刻整备", bestWhen: "血量低或核心牌未升级" },
  shop: { risk: "低", reward: "采购/删牌", advice: "预算充足或噪声偏多时收益高。", timing: "花预算优化牌组", bestWhen: "预算 ≥ 70 或牌组臃肿" },
  boss: { risk: "终局", reward: "通关", advice: "确认防护、IOC 与爆发窗口。", timing: "最终战", bestWhen: "必须进入，提前备临时算力" },
};

function futureRouteHint(game: GameState, nodeId: string) {
  const nodeById = new globalThis.Map(game.mapNodes.map((node) => [node.id, node]));
  const node = nodeById.get(nodeId);
  if (!node || node.nextIds.length === 0) return "终点链路";
  const names = node.nextIds
    .map((nextId) => nodeById.get(nextId))
    .filter(Boolean)
    .map((next) => NODE_DEFS[next!.type].name);
  return names.length ? `下一跳可接：${Array.from(new Set(names)).join(" / ")}` : "下一跳暂不可见";
}

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
            const def = NODE_DEFS[node.type];
            const brief = nodeBrief[node.type];
            const isNext = !isAvailable && !isCurrent && !isPast && game.availableNodeIds.some((id) => nodeById.get(id)?.nextIds.includes(node.id));
            const nodeTier = isAvailable ? "node-current" : isNext ? "node-next" : isPast ? "node-past" : "node-distant";
            return (
              <button
                key={node.id}
                type="button"
                className={`map-node map-node-${node.type} ${nodeTier} ${isAvailable ? "available" : ""} ${isCurrent ? "current" : ""} ${isPast ? "past" : ""}`}
                style={{ gridColumn: node.lane + 2, gridRow: node.row + 1 }}
                disabled={!isAvailable}
                onClick={() => onChoose(node.id)}
                title={`${def.desc} 风险：${brief.risk}；收益：${brief.reward}`}
                aria-label={`${def.name}，${def.desc}，风险 ${brief.risk}，收益 ${brief.reward}${isAvailable ? "，可进入" : "，暂不可进入"}`}
              >
                {nodeIcon(node.type)}
                <span>{def.name}</span>
                <small>{brief.risk}</small>
              </button>
            );
          })}
        </div>
      </div>
      <aside className="route-legend">
        <p className="eyebrow">路径情报</p>
        <h3>当前可选节点</h3>
        <p className="route-legend-copy">先从当前可选节点里选；远端节点只是路线预览。路线选择不是随机点格子，而是在决定：补牌、回血、买工具，还是赌高危工具。</p>
        {game.availableNodeIds.map((id) => {
          const node = game.mapNodes.find((item) => item.id === id)!;
          const def = NODE_DEFS[node.type];
          const brief = nodeBrief[node.type];
          return (
            <button key={id} type="button" className="route-option-card" onClick={() => onChoose(id)}>
              <span>{nodeIcon(node.type)}</span>
              <strong>{def.name}</strong>
              <em>{def.desc}</em>
              <small>风险：{brief.risk} · 收益：{brief.reward}</small>
              <small>节奏：{brief.timing}</small>
              <small>{futureRouteHint(game, id)}</small>
              <b>{brief.advice}</b>
              <b>适合：{brief.bestWhen}</b>
              <em className="route-option-cta">进入该节点</em>
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
