/**
 * 物理知识图谱可视化组件
 * 基于Palantir本体论的力导向交互式网络图
 * 支持节点悬浮窗(知识概要解析)、Process节点(Action类型)
 */

'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { KnowledgeGraph, KnowledgeNode, KnowledgeEdge } from '../knowledge/physics-graph';

interface GraphVisualizerProps {
  graph: KnowledgeGraph;
  /** 当前实验映射到的知识节点ID集合 — 这些节点高亮显示，其余暗淡 */
  mappedNodeIds?: Set<string>;
  width?: number;
  height?: number;
  title?: string;
}

interface NodePosition extends KnowledgeNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface EdgePosition extends KnowledgeEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Palantir ObjectType 颜色映射
const OBJECT_TYPE_COLORS: Record<string, string> = {
  entity: '#6ab0ff',
  formula: '#ffd54f',
  law: '#ff7043',
  process: '#00e676',
  experiment: '#81c784',
  person: '#f8bbd0',
  unit: '#ba68c8',
  // 旧类型兼容
  concept: '#6ab0ff',
  scientist: '#f8bbd0',
};

const OBJECT_TYPE_LABELS: Record<string, string> = {
  entity: '实体',
  formula: '公式',
  law: '定律',
  process: '过程',
  experiment: '实验',
  person: '人物',
  unit: '单位',
  concept: '概念',
  scientist: '科学家',
};

// Palantir LinkType 中文标签
const LINK_TYPE_LABELS: Record<string, string> = {
  defines: '定义',
  applies_to: '适用于',
  conserves: '守恒',
  measures: '测量',
  derived_from: '推导自',
  discovered_by: '发现',
  produces: '产生',
  transforms_to: '转化为',
  governs: '支配',
  part_of: '属于',
  relates_to: '相关',
};

function getNodeColor(node: KnowledgeNode): string {
  const ot = (node as any).objectType || node.type;
  return node.color || OBJECT_TYPE_COLORS[ot] || '#6ab0ff';
}

function getNodeRadius(node: KnowledgeNode): number {
  const ot = (node as any).objectType || node.type;
  if (ot === 'law') return 30;
  if (ot === 'formula') return 28;
  if (ot === 'process') return 26;
  if (ot === 'entity' || ot === 'concept') return 24;
  return 22;
}

function getNodeEmoji(node: KnowledgeNode): string {
  const ot = (node as any).objectType || node.type;
  switch (ot) {
    case 'law': return '⚖️';
    case 'formula': return '📐';
    case 'process': return '⚡';
    case 'person':
    case 'scientist': return '👤';
    case 'experiment': return '🔬';
    default: return '💡';
  }
}

// 一次性运行力导向布局
function runForceLayout(
  graph: KnowledgeGraph,
  width: number,
  height: number,
  iterations: number = 300
): { nodes: NodePosition[]; edges: EdgePosition[] } {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3;

  const nodes: NodePosition[] = graph.nodes.map((node, index) => {
    const angle = (index / graph.nodes.length) * 2 * Math.PI;
    const ot = (node as any).objectType || node.type;
    const r = (ot === 'law' || ot === 'formula' || ot === 'process') ? radius * 0.6 : radius;
    return {
      ...node,
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
      vx: 0,
      vy: 0,
      radius: getNodeRadius(node)
    };
  });

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (8000 * alpha) / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].vx += fx;
        nodes[i].vy += fy;
        nodes[j].vx -= fx;
        nodes[j].vy -= fy;
      }
    }

    graph.edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) return;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 120) * 0.05 * edge.weight * alpha;
      source.vx += (dx / dist) * force;
      source.vy += (dy / dist) * force;
      target.vx -= (dx / dist) * force;
      target.vy -= (dy / dist) * force;
    });

    nodes.forEach(node => {
      node.vx += (centerX - node.x) * 0.001 * alpha;
      node.vy += (centerY - node.y) * 0.001 * alpha;
    });

    nodes.forEach(node => {
      node.vx *= 0.85;
      node.vy *= 0.85;
      node.x += node.vx;
      node.y += node.vy;
      node.x = Math.max(node.radius + 10, Math.min(width - node.radius - 10, node.x));
      node.y = Math.max(node.radius + 10, Math.min(height - node.radius - 10, node.y));
    });
  }

  const edges: EdgePosition[] = graph.edges.map(edge => {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    return {
      ...edge,
      x1: source?.x || 0,
      y1: source?.y || 0,
      x2: target?.x || 0,
      y2: target?.y || 0
    };
  });

  return { nodes, edges };
}

export default function KnowledgeGraphVisualizer({
  graph,
  mappedNodeIds,
  width = 700,
  height = 500,
  title = '物理知识图谱'
}: GraphVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<KnowledgeNode | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const layoutResult = useMemo(() => {
    if (!graph || graph.nodes.length === 0) return null;
    return runForceLayout(graph, width, height, 300);
  }, [graph, width, height]);

  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [edgePositions, setEdgePositions] = useState<EdgePosition[]>([]);

  // 是否有映射信息 — 有则启用高亮/暗淡模式
  const hasMapping = mappedNodeIds && mappedNodeIds.size > 0;
  const mappedCount = hasMapping ? mappedNodeIds.size : 0;
  const totalCount = graph.nodes.length;

  useEffect(() => {
    if (layoutResult) {
      setNodePositions(layoutResult.nodes);
      setEdgePositions(layoutResult.edges);
    }
  }, [layoutResult]);

  // 拖动处理
  const handleMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodePositions.find(n => n.id === nodeId);
    if (!node) return;
    setIsDragging(nodeId);
    setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
  }, [nodePositions]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x;
    const y = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y;
    setNodePositions(prev => prev.map(node =>
      node.id === isDragging ? { ...node, x, y } : node
    ));
    setEdgePositions(prev => prev.map(edge => {
      if (edge.source === isDragging) {
        const target = nodePositions.find(n => n.id === edge.target);
        return { ...edge, x1: x, y1: y, x2: target?.x || edge.x2, y2: target?.y || edge.y2 };
      }
      if (edge.target === isDragging) {
        const source = nodePositions.find(n => n.id === edge.source);
        return { ...edge, x1: source?.x || edge.x1, y1: source?.y || edge.y1, x2: x, y2: y };
      }
      return edge;
    }));
  }, [isDragging, zoom, pan, dragOffset, nodePositions]);

  const handleMouseUp = useCallback(() => setIsDragging(null), []);

  const handleNodeClick = useCallback((node: KnowledgeNode) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  }, [selectedNode]);

  // 节点悬浮处理 - 记录鼠标位置用于悬浮窗定位
  const handleNodeHover = useCallback((node: KnowledgeNode | null, e?: React.MouseEvent) => {
    if (node) {
      setHoveredNode(node);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    } else {
      setHoveredNode(null);
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.3, Math.min(3, prev * (e.deltaY > 0 ? 0.9 : 1.1))));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    setHoveredNode(null);
    if (layoutResult) {
      setNodePositions(layoutResult.nodes);
      setEdgePositions(layoutResult.edges);
    }
  }, [layoutResult]);

  if (!graph || graph.nodes.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.1), rgba(26, 26, 62, 0.5))', border: '1px solid #2a3a5a', borderRadius: '12px', color: '#a0b0c0' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
        <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#6ab0ff' }}>暂无知识图谱</h3>
        <p style={{ fontSize: '13px' }}>输入实验描述后，智能体将自动分析并呈现相关的物理知识图谱</p>
      </div>
    );
  }

  // 按Palantir ObjectType统计
  const objectTypeStats: Record<string, number> = {};
  nodePositions.forEach(n => {
    const ot = (n as any).objectType || n.type;
    objectTypeStats[ot] = (objectTypeStats[ot] || 0) + 1;
  });

  return (
    <div ref={containerRef} style={{ position: 'relative', background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 46, 0.95))', border: '1px solid #2a3a5a', borderRadius: '12px', overflow: 'hidden' }}>
      {/* 头部 */}
      <div style={{ padding: '12px 16px', background: 'rgba(74, 144, 217, 0.15)', borderBottom: '1px solid #2a3a5a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', color: '#6ab0ff', margin: 0 }}>🧠 {title}</h3>
          <div style={{ fontSize: '11px', color: '#708090', marginTop: '4px' }}>
            {graph.nodes.length} 个节点 · {graph.edges.length} 条关系 · 缩放: {(zoom * 100).toFixed(0)}%
            {hasMapping && (
              <span style={{ marginLeft: '8px', color: '#00e676' }}>● 映射: {mappedCount}/{totalCount}</span>
            )}
          </div>
        </div>
        <button onClick={handleReset} style={{ padding: '6px 12px', border: '1px solid #2a3a5a', borderRadius: '6px', background: 'rgba(74, 144, 217, 0.1)', color: '#a0b0c0', fontSize: '12px', cursor: 'pointer' }}>
          重置视图
        </button>
      </div>

      {/* 图例 */}
      <div style={{ padding: '8px 16px', background: 'rgba(0, 0, 0, 0.2)', display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '11px', color: '#a0b0c0' }}>
        {Object.entries(OBJECT_TYPE_COLORS).map(([type, color]) => (
          objectTypeStats[type] && (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
              <span>{OBJECT_TYPE_LABELS[type]} ({objectTypeStats[type]})</span>
            </div>
          )
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#708090' }}>
          {hasMapping ? (
            <>
              <span style={{ color: '#00e676' }}>● 高亮=已映射</span>
              <span style={{ marginLeft: '6px', color: '#505060' }}>● 暗淡=未映射</span>
              <span style={{ marginLeft: '6px' }}>· 拖动 · 悬浮 · 点击 · 滚轮</span>
            </>
          ) : (
            <span>💡 拖动节点 · 悬浮查看概要 · 点击展开详情 · 滚轮缩放</span>
          )}
        </div>
      </div>

      {/* SVG画布 */}
      <div onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { handleMouseUp(); setHoveredNode(null); }} onWheel={handleWheel} style={{ position: 'relative' }}>
        <svg ref={svgRef} width={width} height={height} style={{ background: 'radial-gradient(ellipse at center, rgba(74, 144, 217, 0.05) 0%, transparent 70%)', cursor: isDragging ? 'grabbing' : 'grab', display: 'block', userSelect: 'none', WebkitUserSelect: 'none' }}>
          <defs>
            {Object.entries(OBJECT_TYPE_COLORS).map(([type, color]) => (
              <filter key={type} id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#4a90d9" opacity="0.5" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* 边 */}
            {edgePositions.map((edge, index) => {
              const isHighlighted = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
              const isConnected = hoveredNode && (edge.source === hoveredNode.id || edge.target === hoveredNode.id);
              // 映射高亮：两端都是映射节点则为高亮边
              const bothMapped = hasMapping && mappedNodeIds.has(edge.source) && mappedNodeIds.has(edge.target);
              const eitherMapped = hasMapping && (mappedNodeIds.has(edge.source) || mappedNodeIds.has(edge.target));
              // 基础透明度
              let baseOpacity = 0.35;
              if (hasMapping) {
                baseOpacity = bothMapped ? 0.7 : eitherMapped ? 0.2 : 0.08;
              }
              // 选中/悬浮覆盖
              const finalOpacity = selectedNode && !isHighlighted ? 0.1 : isConnected ? 0.8 : baseOpacity;
              const strokeColor = bothMapped ? '#6ab0ff' : isConnected ? '#6ab0ff' : '#3a4a6a';
              return (
                <line key={`edge-${index}`} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
                  stroke={strokeColor}
                  strokeWidth={isHighlighted ? 2.5 : isConnected ? 2 : bothMapped ? 1.8 : 1.2 * edge.weight}
                  strokeDasharray={edge.weight < 0.5 ? '4,2' : 'none'}
                  opacity={finalOpacity}
                  markerEnd="url(#arrowhead)"
                  style={{ transition: 'all 0.3s ease' }} />
              );
            })}

            {/* 节点 */}
            {nodePositions.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNode?.id === node.id;
              const nodeColor = getNodeColor(node);
              const ot = (node as any).objectType || node.type;
              // 映射状态
              const isMapped = !hasMapping || mappedNodeIds.has(node.id);
              // 缩放：映射节点正常大小，未映射节点缩小
              const baseScale = isSelected ? 1.3 : isHovered ? 1.15 : 1;
              const scale = isMapped ? baseScale : baseScale * 0.7;
              // 透明度：映射节点全亮，未映射节点暗淡
              const isConnected = selectedNode && edgePositions.some(
                e => (e.source === node.id && e.target === selectedNode.id) || (e.target === node.id && e.source === selectedNode.id)
              );
              let opacity = 1;
              if (selectedNode && !isSelected && !isConnected) {
                opacity = 0.3;
              } else if (hasMapping && !isMapped) {
                opacity = 0.2; // 未映射节点暗淡
              }

              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: 'pointer', opacity, transition: 'opacity 0.3s ease' }}
                  onMouseDown={(e) => handleMouseDown(node.id, e)}
                  onMouseOver={(e) => handleNodeHover(node, e)}
                  onMouseOut={() => handleNodeHover(null)}
                  onMouseMove={(e) => {
                    if (!isDragging) {
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }
                  }}
                  onClick={() => handleNodeClick(node)}>
                  {(isSelected || isHovered) && (
                    <circle r={node.radius * 1.8} fill="none" stroke={nodeColor} strokeWidth="1.5" opacity="0.3" />
                  )}
                  {/* 映射节点外圈光环 */}
                  {isMapped && hasMapping && !isSelected && !isHovered && (
                    <circle r={node.radius * 1.35} fill="none" stroke={nodeColor} strokeWidth="1" opacity="0.35" />
                  )}
                  <circle r={node.radius * scale} fill={nodeColor} stroke={isSelected ? '#fff' : '#1a1a2e'}
                    strokeWidth={isSelected ? 3 : 2}
                    filter={isMapped ? `url(#glow-${ot})` : 'none'}
                    opacity={isMapped ? 0.9 : 0.5}
                    style={{ transition: 'all 0.2s ease' }} />
                  <circle r={node.radius * scale * 0.6} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <text y={4} textAnchor="middle" fontSize={ot === 'entity' || ot === 'concept' ? '11px' : '10px'}
                    fill={isMapped ? '#1a1a2e' : '#3a3a4e'} fontWeight="bold" style={{ pointerEvents: 'none' }}>
                    {node.name.length > 6 ? node.name.substring(0, 6) + '...' : node.name}
                  </text>
                </g>
              );
            })}

            {/* 悬浮节点的边标签 */}
            {hoveredNode && edgePositions.filter(e => e.source === hoveredNode.id || e.target === hoveredNode.id).slice(0, 5).map((edge, index) => {
              const source = nodePositions.find(n => n.id === edge.source);
              const target = nodePositions.find(n => n.id === edge.target);
              if (!source || !target) return null;
              const linkType = (edge as any).linkType || 'relates_to';
              const label = LINK_TYPE_LABELS[linkType] || edge.relation;
              return (
                <text key={`label-${index}`} x={(source.x + target.x) / 2} y={(source.y + target.y) / 2}
                  textAnchor="middle" fontSize="9px" fill="#6ab0ff" fontWeight="500" style={{ pointerEvents: 'none' }}>
                  <tspan dy="-4" fill="#6ab0ff">{label}</tspan>
                </text>
              );
            })}
          </g>
        </svg>

        {/* ===== 悬浮窗：知识概要解析 ===== */}
        {hoveredNode && !isDragging && (
          <div style={{
            position: 'absolute',
            left: Math.min(hoverPos.x + 16, (containerRef.current?.clientWidth || width) - 300),
            top: Math.min(hoverPos.y + 16, (containerRef.current?.clientHeight || height) - 200),
            width: '280px',
            background: 'linear-gradient(135deg, rgba(15, 15, 46, 0.98), rgba(26, 26, 46, 0.98))',
            border: `1px solid ${getNodeColor(hoveredNode)}66`,
            borderRadius: '10px',
            padding: '14px',
            boxShadow: `0 4px 24px rgba(0, 0, 0, 0.6), 0 0 12px ${getNodeColor(hoveredNode)}33`,
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            pointerEvents: 'none',
            animation: 'fadeIn 0.15s ease',
          }}>
            {/* 头部：图标 + 名称 + 类型标签 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: getNodeColor(hoveredNode),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 0 10px ${getNodeColor(hoveredNode)}88`,
              }}>
                <span style={{ fontSize: '14px' }}>{getNodeEmoji(hoveredNode)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hoveredNode.name}
                </div>
                <span style={{
                  fontSize: '9px', padding: '1px 6px', borderRadius: '8px',
                  background: getNodeColor(hoveredNode) + '33',
                  color: getNodeColor(hoveredNode),
                  textTransform: 'uppercase',
                }}>
                  {OBJECT_TYPE_LABELS[(hoveredNode as any).objectType || hoveredNode.type] || hoveredNode.type}
                </span>
              </div>
            </div>

            {/* 概要解析 (summary) */}
            {(hoveredNode as any).summary && (
              <div style={{
                fontSize: '12px', color: '#c0d0e0', lineHeight: '1.6',
                marginBottom: '8px',
                padding: '8px 10px',
                background: 'rgba(74, 144, 217, 0.08)',
                borderRadius: '6px',
                border: '1px solid rgba(74, 144, 217, 0.15)',
              }}>
                {(hoveredNode as any).summary}
              </div>
            )}

            {/* 公式 */}
            {hoveredNode.formula && (
              <div style={{
                padding: '6px 12px',
                background: 'rgba(255, 213, 79, 0.12)',
                border: '1px solid rgba(255, 213, 79, 0.3)',
                borderRadius: '6px',
                marginBottom: '8px',
              }}>
                <span style={{ fontSize: '15px', color: '#ffd54f', fontWeight: 'bold', fontFamily: 'Courier New, monospace' }}>
                  {hoveredNode.formula}
                </span>
              </div>
            )}

            {/* Palantir 属性 (properties) */}
            {(hoveredNode as any).properties && Object.keys((hoveredNode as any).properties).length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', color: '#708090', marginBottom: '4px' }}>Palantir Properties:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {Object.entries((hoveredNode as any).properties).slice(0, 4).map(([key, val]) => (
                    <span key={key} style={{
                      fontSize: '10px', padding: '2px 6px',
                      background: 'rgba(74, 144, 217, 0.12)',
                      border: '1px solid rgba(74, 144, 217, 0.25)',
                      borderRadius: '4px',
                      color: '#a0b0c0',
                    }}>
                      {key}: {String(val)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 关键词 */}
            {hoveredNode.keywords.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {hoveredNode.keywords.slice(0, 4).map((kw, i) => (
                  <span key={i} style={{
                    fontSize: '10px', padding: '2px 6px',
                    background: 'rgba(108, 92, 231, 0.12)',
                    border: '1px solid rgba(108, 92, 231, 0.25)',
                    borderRadius: '4px',
                    color: '#b0a0d0',
                  }}>{kw}</span>
                ))}
              </div>
            )}

            {/* 提示 */}
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(42, 58, 90, 0.5)', fontSize: '10px', color: '#506070', textAlign: 'center' }}>
              点击节点查看完整详情 →
            </div>
          </div>
        )}
      </div>

      {/* 选中节点详情面板 */}
      {selectedNode && (
        <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.1), rgba(108, 92, 231, 0.1))', borderTop: '1px solid #2a3a5a' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: getNodeColor(selectedNode), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 15px ${getNodeColor(selectedNode)}` }}>
              <span style={{ fontSize: '20px' }}>{getNodeEmoji(selectedNode)}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h4 style={{ fontSize: '16px', color: '#fff', margin: 0 }}>{selectedNode.name}</h4>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: getNodeColor(selectedNode) + '33', color: getNodeColor(selectedNode), textTransform: 'uppercase' }}>
                  {OBJECT_TYPE_LABELS[(selectedNode as any).objectType || selectedNode.type] || selectedNode.type}
                </span>
              </div>
              {/* 概要解析 */}
              {(selectedNode as any).summary && (
                <p style={{ fontSize: '13px', color: '#c0d0e0', marginBottom: '8px', lineHeight: '1.7', padding: '8px 10px', background: 'rgba(74, 144, 217, 0.08)', borderRadius: '6px', border: '1px solid rgba(74, 144, 217, 0.15)' }}>
                  {(selectedNode as any).summary}
                </p>
              )}
              <p style={{ fontSize: '13px', color: '#a0b0c0', marginBottom: '10px', lineHeight: '1.6' }}>{selectedNode.description}</p>
              {selectedNode.formula && (
                <div style={{ padding: '10px 16px', background: 'rgba(255, 213, 79, 0.15)', border: '1px solid rgba(255, 213, 79, 0.3)', borderRadius: '8px', display: 'inline-block', marginBottom: '10px' }}>
                  <span style={{ fontSize: '18px', color: '#ffd54f', fontWeight: 'bold', fontFamily: 'Courier New, monospace' }}>{selectedNode.formula}</span>
                </div>
              )}
              {/* Palantir 属性 */}
              {(selectedNode as any).properties && Object.keys((selectedNode as any).properties).length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#708090', marginBottom: '4px' }}>Palantir Properties:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Object.entries((selectedNode as any).properties).map(([key, val]) => (
                      <span key={key} style={{ fontSize: '11px', padding: '3px 8px', background: 'rgba(74, 144, 217, 0.12)', border: '1px solid rgba(74, 144, 217, 0.25)', borderRadius: '4px', color: '#a0b0c0' }}>
                        {key}: {String(val)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedNode.keywords.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedNode.keywords.slice(0, 5).map((kw, i) => (
                    <span key={i} style={{ fontSize: '10px', padding: '3px 8px', background: 'rgba(74, 144, 217, 0.15)', border: '1px solid rgba(74, 144, 217, 0.3)', borderRadius: '4px', color: '#708090' }}>{kw}</span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setSelectedNode(null)} style={{ background: 'transparent', border: 'none', color: '#708090', fontSize: '20px', cursor: 'pointer', padding: '0 8px' }}>×</button>
          </div>
          {/* 相关关系（显示Palantir LinkType） */}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(42, 58, 90, 0.5)' }}>
            <div style={{ fontSize: '11px', color: '#708090', marginBottom: '8px' }}>
              Palantir Links ({edgePositions.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} 条)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {edgePositions.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).slice(0, 8).map((edge, i) => {
                const relatedNodeId = edge.source === selectedNode.id ? edge.target : edge.source;
                const relatedNode = nodePositions.find(n => n.id === relatedNodeId);
                const linkType = (edge as any).linkType || 'relates_to';
                const linkLabel = LINK_TYPE_LABELS[linkType] || edge.relation;
                const relation = edge.source === selectedNode.id ? linkLabel : linkLabel;
                return (
                  <div key={i} style={{ padding: '6px 10px', background: 'rgba(26, 26, 46, 0.6)', borderRadius: '6px', fontSize: '11px', color: '#a0b0c0', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #2a3a5a' }}>
                    <span style={{ color: '#6ab0ff' }}>{selectedNode.name}</span>
                    <span style={{ color: '#00e676', fontSize: '10px' }}>─{relation}→</span>
                    <span style={{ color: relatedNode ? getNodeColor(relatedNode) : '#ffd54f' }}>{relatedNode?.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
