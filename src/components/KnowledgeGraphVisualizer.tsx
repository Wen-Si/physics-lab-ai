/**
 * 物理知识图谱可视化组件
 * 基于力导向布局的静态交互式网络图
 */

'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { KnowledgeGraph, KnowledgeNode, KnowledgeEdge } from '../knowledge/physics-graph';

interface GraphVisualizerProps {
  graph: KnowledgeGraph;
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

const TYPE_COLORS: Record<string, string> = {
  concept: '#6ab0ff',
  formula: '#ffd54f',
  law: '#ff7043',
  experiment: '#81c784',
  unit: '#ba68c8',
  scientist: '#f8bbd0'
};

const TYPE_LABELS: Record<string, string> = {
  concept: '概念',
  formula: '公式',
  law: '定律',
  experiment: '实验',
  unit: '单位',
  scientist: '科学家'
};

// 一次性运行力导向布局，返回稳定位置
function runForceLayout(
  graph: KnowledgeGraph,
  width: number,
  height: number,
  iterations: number = 300
): { nodes: NodePosition[]; edges: EdgePosition[] } {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3;

  // 初始化节点位置
  const nodes: NodePosition[] = graph.nodes.map((node, index) => {
    const angle = (index / graph.nodes.length) * 2 * Math.PI;
    const r = node.type === 'law' || node.type === 'formula' ? radius * 0.6 : radius;
    return {
      ...node,
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
      vx: 0,
      vy: 0,
      radius: node.type === 'law' ? 30 : node.type === 'formula' ? 28 : node.type === 'concept' ? 24 : 22
    };
  });

  // 运行力导向迭代
  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations; // 冷却因子

    // 排斥力
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

    // 吸引力
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

    // 中心力
    nodes.forEach(node => {
      node.vx += (centerX - node.x) * 0.001 * alpha;
      node.vy += (centerY - node.y) * 0.001 * alpha;
    });

    // 阻尼 + 更新位置
    nodes.forEach(node => {
      node.vx *= 0.85;
      node.vy *= 0.85;
      node.x += node.vx;
      node.y += node.vy;
      node.x = Math.max(node.radius + 10, Math.min(width - node.radius - 10, node.x));
      node.y = Math.max(node.radius + 10, Math.min(height - node.radius - 10, node.y));
    });
  }

  // 构建边
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
  width = 700,
  height = 500,
  title = '物理知识图谱'
}: GraphVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 一次性计算静止布局
  const layoutResult = useMemo(() => {
    if (!graph || graph.nodes.length === 0) return null;
    return runForceLayout(graph, width, height, 300);
  }, [graph, width, height]);

  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [edgePositions, setEdgePositions] = useState<EdgePosition[]>([]);

  useEffect(() => {
    if (layoutResult) {
      setNodePositions(layoutResult.nodes);
      setEdgePositions(layoutResult.edges);
    }
  }, [layoutResult]);

  // 拖动处理
  const handleMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.3, Math.min(3, prev * (e.deltaY > 0 ? 0.9 : 1.1))));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
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

  const nodeTypeStats: Record<string, number> = {};
  nodePositions.forEach(n => { nodeTypeStats[n.type] = (nodeTypeStats[n.type] || 0) + 1; });

  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 46, 0.95))', border: '1px solid #2a3a5a', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: 'rgba(74, 144, 217, 0.15)', borderBottom: '1px solid #2a3a5a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', color: '#6ab0ff', margin: 0 }}>🧠 {title}</h3>
          <div style={{ fontSize: '11px', color: '#708090', marginTop: '4px' }}>
            {graph.nodes.length} 个概念 · {graph.edges.length} 条关系 · 缩放: {(zoom * 100).toFixed(0)}%
          </div>
        </div>
        <button onClick={handleReset} style={{ padding: '6px 12px', border: '1px solid #2a3a5a', borderRadius: '6px', background: 'rgba(74, 144, 217, 0.1)', color: '#a0b0c0', fontSize: '12px', cursor: 'pointer' }}>
          重置视图
        </button>
      </div>

      <div style={{ padding: '8px 16px', background: 'rgba(0, 0, 0, 0.2)', display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '11px', color: '#a0b0c0' }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          nodeTypeStats[type] && (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
              <span>{TYPE_LABELS[type]} ({nodeTypeStats[type]})</span>
            </div>
          )
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#708090' }}>💡 拖动节点 · 点击查看详情 · 滚轮缩放</div>
      </div>

      <div onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel} style={{ position: 'relative' }}>
        <svg ref={svgRef} width={width} height={height} style={{ background: 'radial-gradient(ellipse at center, rgba(74, 144, 217, 0.05) 0%, transparent 70%)', cursor: isDragging ? 'grabbing' : 'grab', display: 'block' }}>
          <defs>
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
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
            {edgePositions.map((edge, index) => {
              const isHighlighted = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
              const isConnected = hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode);
              return (
                <line key={`edge-${index}`} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
                  stroke={isConnected ? '#6ab0ff' : '#3a4a6a'}
                  strokeWidth={isHighlighted ? 2.5 : isConnected ? 2 : 1.2 * edge.weight}
                  strokeDasharray={edge.weight < 0.5 ? '4,2' : 'none'}
                  opacity={selectedNode && !isHighlighted ? 0.15 : isConnected ? 0.8 : 0.35}
                  style={{ transition: 'all 0.3s ease' }} />
              );
            })}

            {nodePositions.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNode === node.id;
              const nodeColor = node.color || TYPE_COLORS[node.type] || '#6ab0ff';
              const scale = isSelected ? 1.3 : isHovered ? 1.15 : 1;
              const isConnected = selectedNode && edgePositions.some(
                e => (e.source === node.id && e.target === selectedNode.id) || (e.target === node.id && e.source === selectedNode.id)
              );
              const opacity = selectedNode && !isSelected && !isConnected ? 0.3 : 1;

              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: 'pointer', opacity, transition: 'opacity 0.3s ease' }}
                  onMouseDown={(e) => handleMouseDown(node.id, e)}
                  onMouseOver={() => setHoveredNode(node.id)}
                  onMouseOut={() => setHoveredNode(null)}
                  onClick={() => handleNodeClick(node)}>
                  {(isSelected || isHovered) && (
                    <circle r={node.radius * 1.8} fill="none" stroke={nodeColor} strokeWidth="1.5" opacity="0.3" />
                  )}
                  <circle r={node.radius * scale} fill={nodeColor} stroke={isSelected ? '#fff' : '#1a1a2e'}
                    strokeWidth={isSelected ? 3 : 2} filter={`url(#glow-${node.type})`} opacity="0.9"
                    style={{ transition: 'all 0.2s ease' }} />
                  <circle r={node.radius * scale * 0.6} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <text y={4} textAnchor="middle" fontSize={node.type === 'concept' ? '11px' : '10px'}
                    fill="#1a1a2e" fontWeight="bold" style={{ pointerEvents: 'none' }}>
                    {node.name.length > 6 ? node.name.substring(0, 6) + '...' : node.name}
                  </text>
                </g>
              );
            })}

            {hoveredNode && edgePositions.filter(e => e.source === hoveredNode).map((edge, index) => {
              const source = nodePositions.find(n => n.id === edge.source);
              const target = nodePositions.find(n => n.id === edge.target);
              if (!source || !target) return null;
              return (
                <text key={`label-${index}`} x={(source.x + target.x) / 2} y={(source.y + target.y) / 2}
                  textAnchor="middle" fontSize="10px" fill="#6ab0ff" fontWeight="500" style={{ pointerEvents: 'none' }}>
                  <tspan dy="-4" fill="#6ab0ff">{edge.relation}</tspan>
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      {selectedNode && (
        <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.1), rgba(108, 92, 231, 0.1))', borderTop: '1px solid #2a3a5a' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: selectedNode.color || TYPE_COLORS[selectedNode.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 15px ${selectedNode.color || TYPE_COLORS[selectedNode.type]}` }}>
              <span style={{ fontSize: '20px' }}>
                {selectedNode.type === 'law' ? '⚖️' : selectedNode.type === 'formula' ? '📐' : selectedNode.type === 'scientist' ? '👤' : selectedNode.type === 'experiment' ? '🔬' : '💡'}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h4 style={{ fontSize: '16px', color: '#fff', margin: 0 }}>{selectedNode.name}</h4>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: (selectedNode.color || TYPE_COLORS[selectedNode.type]) + '33', color: selectedNode.color || TYPE_COLORS[selectedNode.type], textTransform: 'uppercase' }}>
                  {TYPE_LABELS[selectedNode.type] || selectedNode.type}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#a0b0c0', marginBottom: '10px', lineHeight: '1.6' }}>{selectedNode.description}</p>
              {selectedNode.formula && (
                <div style={{ padding: '10px 16px', background: 'rgba(255, 213, 79, 0.15)', border: '1px solid rgba(255, 213, 79, 0.3)', borderRadius: '8px', display: 'inline-block', marginBottom: '10px' }}>
                  <span style={{ fontSize: '18px', color: '#ffd54f', fontWeight: 'bold', fontFamily: 'Courier New, monospace' }}>{selectedNode.formula}</span>
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
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(42, 58, 90, 0.5)' }}>
            <div style={{ fontSize: '11px', color: '#708090', marginBottom: '8px' }}>相关关系 ({edgePositions.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} 条)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {edgePositions.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).slice(0, 6).map((edge, i) => {
                const relatedNodeId = edge.source === selectedNode.id ? edge.target : edge.source;
                const relatedNode = nodePositions.find(n => n.id === relatedNodeId);
                const relation = edge.source === selectedNode.id ? edge.relation : '相关';
                return (
                  <div key={i} style={{ padding: '6px 10px', background: 'rgba(26, 26, 46, 0.6)', borderRadius: '6px', fontSize: '11px', color: '#a0b0c0', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #2a3a5a' }}>
                    <span style={{ color: '#6ab0ff' }}>{selectedNode.name}</span>
                    <span style={{ color: '#708090' }}>{relation}</span>
                    <span style={{ color: relatedNode?.color || '#ffd54f' }}>{relatedNode?.name}</span>
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