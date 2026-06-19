/**
 * 物理知识图谱可视化组件
 * 基于力导向布局的交互式网络图
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
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

export default function KnowledgeGraphVisualizer({
  graph,
  width = 700,
  height = 500,
  title = '物理知识图谱'
}: GraphVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<NodePosition[]>([]);
  const [edges, setEdges] = useState<EdgePosition[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // 初始化节点位置
  useEffect(() => {
    if (!graph || graph.nodes.length === 0) return;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    const initialNodes: NodePosition[] = graph.nodes.map((node, index) => {
      const angle = (index / graph.nodes.length) * 2 * Math.PI;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: calculateNodeRadius(node)
      };
    });
    
    setNodes(initialNodes);
    
    const initialEdges: EdgePosition[] = graph.edges.map(edge => ({
      ...edge,
      x1: centerX,
      y1: centerY,
      x2: centerX,
      y2: centerY
    }));
    
    setEdges(initialEdges);
  }, [graph, width, height]);

  // 计算节点大小
  function calculateNodeRadius(node: KnowledgeNode): number {
    if (node.type === 'law') return 30;
    if (node.type === 'formula') return 28;
    if (node.type === 'concept') return 24;
    if (node.type === 'scientist') return 22;
    return 20;
  }

  // 力导向布局计算
  useEffect(() => {
    if (nodes.length === 0) return;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    const simulate = () => {
      setNodes(prevNodes => {
        if (prevNodes.length === 0) return prevNodes;
        
        const newNodes = prevNodes.map(node => ({ ...node }));
        
        // 1. 排斥力 - 节点之间相互排斥
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const n1 = newNodes[i];
            const n2 = newNodes[j];
            const dx = n1.x - n2.x;
            const dy = n1.y - n2.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const repulsion = 8000 / (dist * dist);
            
            n1.vx += (dx / dist) * repulsion;
            n1.vy += (dy / dist) * repulsion;
            n2.vx -= (dx / dist) * repulsion;
            n2.vy -= (dy / dist) * repulsion;
          }
        }
        
        // 2. 吸引力 - 连接的节点之间有吸引力
        graph.edges.forEach(edge => {
          const source = newNodes.find(n => n.id === edge.source);
          const target = newNodes.find(n => n.id === edge.target);
          if (!source || !target) return;
          
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const attraction = (dist - 120) * 0.05 * edge.weight;
          
          source.vx += (dx / dist) * attraction;
          source.vy += (dy / dist) * attraction;
          target.vx -= (dx / dist) * attraction;
          target.vy -= (dy / dist) * attraction;
        });
        
        // 3. 中心力 - 所有节点都被拉向中心
        newNodes.forEach(node => {
          if (node.id === isDragging) return;
          const dx = centerX - node.x;
          const dy = centerY - node.y;
          node.vx += dx * 0.001;
          node.vy += dy * 0.001;
        });
        
        // 4. 阻尼
        newNodes.forEach(node => {
          if (node.id === isDragging) return;
          node.vx *= 0.85;
          node.vy *= 0.85;
        });
        
        // 5. 更新位置
        newNodes.forEach(node => {
          if (node.id === isDragging) return;
          node.x += node.vx;
          node.y += node.vy;
          
          // 边界限制
          node.x = Math.max(node.radius + 10, Math.min(width - node.radius - 10, node.x));
          node.y = Math.max(node.radius + 10, Math.min(height - node.radius - 10, node.y));
        });
        
        return newNodes;
      });
      
      // 更新边的位置
      setEdges(prevEdges => {
        if (nodes.length === 0) return prevEdges;
        return prevEdges.map(edge => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          return {
            ...edge,
            x1: source?.x || 0,
            y1: source?.y || 0,
            x2: target?.x || 0,
            y2: target?.y || 0
          };
        });
      });
      
      animationRef.current = requestAnimationFrame(simulate);
    };
    
    animationRef.current = requestAnimationFrame(simulate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes.length, graph.edges, width, height, isDragging]);

  // 拖动处理
  const handleMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(nodeId);
    
    const svg = svgRef.current;
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !svgRef.current || !dragStartRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    setNodes(prevNodes => prevNodes.map(node =>
      node.id === isDragging
        ? { ...node, x, y, vx: 0, vy: 0 }
        : node
    ));
  }, [isDragging, zoom, pan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    dragStartRef.current = null;
  }, []);

  // 点击节点显示详情
  const handleNodeClick = useCallback((node: KnowledgeNode) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  }, [selectedNode]);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
  }, []);

  // 重置视图
  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  }, []);

  // 空状态
  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="graph-empty" style={{
        padding: '40px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.1), rgba(26, 26, 62, 0.5))',
        border: '1px solid #2a3a5a',
        borderRadius: '12px',
        color: '#a0b0c0'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
        <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#6ab0ff' }}>
          暂无知识图谱
        </h3>
        <p style={{ fontSize: '13px' }}>
          输入实验描述后，智能体将自动分析并呈现相关的物理知识图谱
        </p>
      </div>
    );
  }

  // 统计信息
  const nodeTypeStats: Record<string, number> = {};
  nodes.forEach(n => {
    nodeTypeStats[n.type] = (nodeTypeStats[n.type] || 0) + 1;
  });

  return (
    <div className="graph-container" style={{
      background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 46, 0.95))',
      border: '1px solid #2a3a5a',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* 头部 */}
      <div className="graph-header" style={{
        padding: '12px 16px',
        background: 'rgba(74, 144, 217, 0.15)',
        borderBottom: '1px solid #2a3a5a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{
            fontSize: '16px',
            color: '#6ab0ff',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🧠</span>
            <span>{title}</span>
          </h3>
          <div style={{ fontSize: '11px', color: '#708090', marginTop: '4px' }}>
            {graph.nodes.length} 个概念 · {graph.edges.length} 条关系 · 缩放: {(zoom * 100).toFixed(0)}%
          </div>
        </div>
        
        <div className="graph-controls" style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              border: '1px solid #2a3a5a',
              borderRadius: '6px',
              background: 'rgba(74, 144, 217, 0.1)',
              color: '#a0b0c0',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(74, 144, 217, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(74, 144, 217, 0.1)'}
          >
            重置视图
          </button>
        </div>
      </div>
      
      {/* 图例 */}
      <div className="graph-legend" style={{
        padding: '8px 16px',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '11px',
        color: '#a0b0c0'
      }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          nodeTypeStats[type] && (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 6px ${color}`
              }}></div>
              <span>{TYPE_LABELS[type]} ({nodeTypeStats[type]})</span>
            </div>
          )
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#708090' }}>
          💡 拖动节点 · 点击查看详情 · 滚轮缩放
        </div>
      </div>
      
      {/* SVG 图谱 */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ position: 'relative' }}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{
            background: 'radial-gradient(ellipse at center, rgba(74, 144, 217, 0.05) 0%, transparent 70%)',
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'block'
          }}
        >
          <defs>
            {/* 节点光晕效果 */}
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <filter key={type} id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
            
            {/* 箭头标记 */}
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#4a90d9" opacity="0.5" />
            </marker>
          </defs>
          
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* 绘制连接线 */}
            {edges.map((edge, index) => {
              const isHighlighted = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
              const isConnected = hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode);
              
              return (
                <line
                  key={`edge-${index}`}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={isConnected ? '#6ab0ff' : '#3a4a6a'}
                  strokeWidth={isHighlighted ? 2.5 : isConnected ? 2 : 1.2 * edge.weight}
                  strokeDasharray={edge.weight < 0.5 ? '4,2' : 'none'}
                  opacity={selectedNode && !isHighlighted ? 0.15 : isConnected ? 0.8 : 0.35}
                  style={{ transition: 'all 0.3s ease' }}
                />
              );
            })}
            
            {/* 绘制节点 */}
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNode === node.id;
              const nodeColor = node.color || TYPE_COLORS[node.type] || '#6ab0ff';
              const scale = isSelected ? 1.3 : isHovered ? 1.15 : 1;
              const isConnectedToSelected = selectedNode && edges.some(
                e => (e.source === node.id && e.target === selectedNode.id) ||
                     (e.target === node.id && e.source === selectedNode.id)
              );
              const opacity = selectedNode && !isSelected && !isConnectedToSelected ? 0.3 : 1;
              
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{
                    cursor: 'pointer',
                    opacity,
                    transition: 'opacity 0.3s ease'
                  }}
                  onMouseDown={(e) => handleMouseDown(node.id, e)}
                  onMouseOver={() => setHoveredNode(node.id)}
                  onMouseOut={() => setHoveredNode(null)}
                  onClick={() => handleNodeClick(node)}
                >
                  {/* 外圈光晕 */}
                  {(isSelected || isHovered) && (
                    <circle
                      r={node.radius * 1.8}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="1.5"
                      opacity="0.3"
                    />
                  )}
                  
                  {/* 主圆 */}
                  <circle
                    r={node.radius * scale}
                    fill={nodeColor}
                    stroke={isSelected ? '#fff' : '#1a1a2e'}
                    strokeWidth={isSelected ? 3 : 2}
                    filter={`url(#glow-${node.type})`}
                    opacity="0.9"
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  
                  {/* 内部装饰 */}
                  <circle
                    r={node.radius * scale * 0.6}
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1"
                  />
                  
                  {/* 节点名称 */}
                  <text
                    y={4}
                    textAnchor="middle"
                    fontSize={node.type === 'concept' ? '11px' : '10px'}
                    fill="#1a1a2e"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {node.name.length > 6 ? node.name.substring(0, 6) + '...' : node.name}
                  </text>
                </g>
              );
            })}
            
            {/* 关系标签（悬停时显示） */}
            {hoveredNode && edges.filter(e => e.source === hoveredNode).map((edge, index) => {
              const source = nodes.find(n => n.id === edge.source);
              const target = nodes.find(n => n.id === edge.target);
              if (!source || !target) return null;
              
              const midX = (source.x + target.x) / 2;
              const midY = (source.y + target.y) / 2;
              
              return (
                <text
                  key={`label-${index}`}
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  fontSize="10px"
                  fill="#6ab0ff"
                  fontWeight="500"
                  style={{
                    pointerEvents: 'none',
                    background: 'rgba(26, 26, 46, 0.9)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  <tspan x={midX} dy="-4" fill="#6ab0ff">{edge.relation}</tspan>
                </text>
              );
            })}
          </g>
        </svg>
      </div>
      
      {/* 节点详情面板 */}
      {selectedNode && (
        <div className="node-detail-panel" style={{
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.1), rgba(108, 92, 231, 0.1))',
          borderTop: '1px solid #2a3a5a'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: selectedNode.color || TYPE_COLORS[selectedNode.type],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 15px ${selectedNode.color || TYPE_COLORS[selectedNode.type]}`
            }}>
              <span style={{ fontSize: '20px' }}>
                {selectedNode.type === 'law' ? '⚖️' : 
                 selectedNode.type === 'formula' ? '📐' :
                 selectedNode.type === 'scientist' ? '👤' :
                 selectedNode.type === 'experiment' ? '🔬' : '💡'}
              </span>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h4 style={{ fontSize: '16px', color: '#fff', margin: 0 }}>{selectedNode.name}</h4>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: (selectedNode.color || TYPE_COLORS[selectedNode.type]) + '33',
                  color: selectedNode.color || TYPE_COLORS[selectedNode.type],
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {TYPE_LABELS[selectedNode.type] || selectedNode.type}
                </span>
              </div>
              
              <p style={{ fontSize: '13px', color: '#a0b0c0', marginBottom: '10px', lineHeight: '1.6' }}>
                {selectedNode.description}
              </p>
              
              {selectedNode.formula && (
                <div style={{
                  padding: '10px 16px',
                  background: 'rgba(255, 213, 79, 0.15)',
                  border: '1px solid rgba(255, 213, 79, 0.3)',
                  borderRadius: '8px',
                  display: 'inline-block',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontSize: '18px', color: '#ffd54f', fontWeight: 'bold', fontFamily: 'Courier New, monospace' }}>
                    {selectedNode.formula}
                  </span>
                </div>
              )}
              
              {selectedNode.keywords.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedNode.keywords.slice(0, 5).map((kw, i) => (
                    <span key={i} style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      background: 'rgba(74, 144, 217, 0.15)',
                      border: '1px solid rgba(74, 144, 217, 0.3)',
                      borderRadius: '4px',
                      color: '#708090'
                    }}>
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setSelectedNode(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#708090',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0 8px'
              }}
            >
              ×
            </button>
          </div>
          
          {/* 相关关系 */}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(42, 58, 90, 0.5)' }}>
            <div style={{ fontSize: '11px', color: '#708090', marginBottom: '8px' }}>相关关系 ({edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} 条)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {edges
                .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                .slice(0, 6)
                .map((edge, i) => {
                  const relatedNodeId = edge.source === selectedNode.id ? edge.target : edge.source;
                  const relatedNode = nodes.find(n => n.id === relatedNodeId);
                  const relation = edge.source === selectedNode.id ? edge.relation : `被...${edge.relation.replace('作用于', '作用').replace('产生', '产生于').replace('属于', '包含于')}`;
                  return (
                    <div key={i} style={{
                      padding: '6px 10px',
                      background: 'rgba(26, 26, 46, 0.6)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#a0b0c0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid #2a3a5a'
                    }}>
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
