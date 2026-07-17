/**
 * 工作流执行追踪器组件
 *
 * 在左侧面板中显示 12 个工作流节点的实时执行状态：
 *   - pending   灰色圆点
 *   - running   蓝色脉冲圆点 + 旋转 spinner
 *   - completed 绿色对勾
 *   - error     红色叉
 *
 * 顶部展示总体进度条（已完成节点数 / 12），
 * 处于 running 状态的节点会附带 ReAct 推理过程的每一步：
 *   💭 Thought → ⚡ Action → 👁 Observation → ✓ Final Answer
 *
 * 样式与项目主页面保持一致：暗色主题（#0a0a1a 背景、#6ab0ff 主色）。
 */

'use client';

import React, { useEffect, useState } from 'react';
import type { ReActStep } from '../api/agent';

/** 节点状态枚举 */
export type WorkflowNodeState = 'pending' | 'running' | 'completed' | 'error';

/** 单个工作流节点的展示状态 */
export interface WorkflowNodeStatus {
  /** 节点序号（0-11） */
  index: number;
  /** 节点中文名称 */
  name: string;
  /** 节点功能描述 */
  description: string;
  /** 当前执行状态 */
  status: WorkflowNodeState;
  /** 节点执行结果（完成后由后端返回） */
  result?: string;
}

interface WorkflowTrackerProps {
  /** 12 个节点的当前状态 */
  nodes: WorkflowNodeStatus[];
  /** 当前正在执行的节点序号（-1 表示无） */
  activeNodeIndex: number;
  /** AI 思考过程文本，仅在某个节点 running 时显示 */
  aiThinkingMessage: string | null;
  /** ReAct 推理步骤列表（按 nodeIndex 分组显示） */
  reactSteps: ReActStep[];
}

/** 状态 -> 主题色 */
const STATUS_COLORS: Record<WorkflowNodeState, string> = {
  pending: '#4a5670',
  running: '#6ab0ff',
  completed: '#00e676',
  error: '#ff5252',
};

/** ReAct 步骤类型 -> 图标 + 颜色 + 标签 */
const REACT_STEP_META: Record<string, { icon: string; color: string; label: string; bg: string }> = {
  thought:       { icon: '💭', color: '#6ab0ff', label: 'Thought',       bg: 'rgba(106, 176, 255, 0.08)' },
  action:        { icon: '⚡', color: '#ffd54f', label: 'Action',        bg: 'rgba(255, 213, 79, 0.08)' },
  observation:   { icon: '👁', color: '#00e676', label: 'Observation',   bg: 'rgba(0, 230, 118, 0.08)' },
  final_answer:  { icon: '✅', color: '#00e676', label: 'Final Answer',  bg: 'rgba(0, 230, 118, 0.12)' },
};

/** 状态 -> 图标 */
function StatusIcon({ status }: { status: WorkflowNodeState }) {
  switch (status) {
    case 'completed':
      return <span style={{ color: '#00e676', fontSize: '12px', fontWeight: 700 }}>✓</span>;
    case 'error':
      return <span style={{ color: '#ff5252', fontSize: '12px', fontWeight: 700 }}>✕</span>;
    case 'running':
      return (
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            border: '2px solid rgba(106, 176, 255, 0.25)',
            borderTopColor: '#6ab0ff',
            borderRadius: '50%',
            animation: 'wft-spin 0.7s linear infinite',
          }}
        />
      );
    case 'pending':
    default:
      return null;
  }
}

/** 单个 ReAct 步骤的渲染 */
function ReActStepItem({ step }: { step: ReActStep }) {
  const meta = REACT_STEP_META[step.stepType] || REACT_STEP_META.thought;
  const isFinal = step.stepType === 'final_answer';
  return (
    <div
      key={step.stepNumber}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        padding: '4px 8px',
        background: meta.bg,
        borderLeft: `2px solid ${meta.color}`,
        borderRadius: '2px',
        animation: 'wft-thinking-fade 0.4s ease',
      }}
    >
      <span style={{ fontSize: '12px', lineHeight: '1.5', flexShrink: 0 }}>{meta.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: '9px',
            color: meta.color,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginRight: '4px',
          }}
        >
          {meta.label}
        </span>
        <span
          style={{
            fontSize: isFinal ? '12px' : '11px',
            color: isFinal ? '#e8eef7' : '#8896b0',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: isFinal ? 600 : 400,
            lineHeight: 1.5,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {step.content}
        </span>
      </div>
    </div>
  );
}

const WorkflowTracker: React.FC<WorkflowTrackerProps> = ({
  nodes,
  activeNodeIndex,
  aiThinkingMessage,
  reactSteps,
}) => {
  const completedCount = nodes.filter(n => n.status === 'completed').length;
  const totalCount = nodes.length || 12;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // 切换 AI 思考文本时的淡入动画 key
  const [thinkingKey, setThinkingKey] = useState(0);
  useEffect(() => {
    setThinkingKey(k => k + 1);
  }, [aiThinkingMessage]);

  // 按 nodeIndex 分组 ReAct 步骤
  const stepsByNode = new Map<number, ReActStep[]>();
  for (const step of reactSteps) {
    const arr = stepsByNode.get(step.nodeIndex) || [];
    arr.push(step);
    stepsByNode.set(step.nodeIndex, arr);
  }

  return (
    <div
      style={{
        marginTop: '14px',
        padding: '12px',
        background: 'rgba(10, 10, 26, 0.6)',
        border: '1px solid #1e2640',
        borderRadius: '6px',
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif",
      }}
    >
      {/* 关键帧动画：通过 style 标签注入，避免依赖外部 CSS */}
      <style>{`
        @keyframes wft-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes wft-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(106, 176, 255, 0.55);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(106, 176, 255, 0);
            transform: scale(1.15);
          }
        }
        @keyframes wft-thinking-fade {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wft-bar-fill {
          from { width: 0%; }
        }
      `}</style>

      {/* 头部：标题 + 进度 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', color: '#8896b0', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
          🤖 智能体工作流 (ReAct)
        </span>
        <span style={{ fontSize: '11px', color: '#6ab0ff', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* 进度条 */}
      <div
        style={{
          width: '100%',
          height: '4px',
          background: '#0f1322',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6ab0ff 0%, #00e676 100%)',
            borderRadius: '2px',
            transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 8px rgba(106, 176, 255, 0.45)',
          }}
        />
      </div>

      {/* 节点列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {nodes.map(node => {
          const isActive = node.index === activeNodeIndex && node.status === 'running';
          const nodeSteps = stepsByNode.get(node.index) || [];
          const hasSteps = nodeSteps.length > 0;
          return (
            <div
              key={node.index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '6px 8px',
                background: isActive
                  ? 'rgba(106, 176, 255, 0.08)'
                  : node.status === 'completed'
                    ? 'rgba(0, 230, 118, 0.04)'
                    : 'transparent',
                borderRadius: '4px',
                border: `1px solid ${isActive ? 'rgba(106, 176, 255, 0.3)' : 'transparent'}`,
                transition: 'all 0.2s ease',
              }}
            >
              {/* 序号圆点 */}
              <div
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    node.status === 'pending' ? '#131829' : `${STATUS_COLORS[node.status]}22`,
                  border: `1px solid ${node.status === 'pending' ? '#1e2640' : STATUS_COLORS[node.status]}`,
                  color: STATUS_COLORS[node.status],
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {node.status === 'completed' || node.status === 'error' ? (
                  <StatusIcon status={node.status} />
                ) : node.status === 'running' ? (
                  <>
                    {/* 脉冲圆环 */}
                    <span
                      style={{
                        position: 'absolute',
                        inset: '-1px',
                        borderRadius: '50%',
                        border: `1px solid ${STATUS_COLORS.running}`,
                        animation: 'wft-pulse 1.4s ease-in-out infinite',
                        pointerEvents: 'none',
                      }}
                    />
                    <StatusIcon status={node.status} />
                  </>
                ) : (
                  <span style={{ opacity: 0.7 }}>{node.index + 1}</span>
                )}
              </div>

              {/* 文本区 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color:
                        node.status === 'pending'
                          ? '#8896b0'
                          : node.status === 'completed'
                            ? '#e8eef7'
                            : node.status === 'error'
                              ? '#ff5252'
                              : '#6ab0ff',
                      lineHeight: 1.3,
                    }}
                  >
                    {node.name}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      color: '#4a5670',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    #{String(node.index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#4a5670', marginTop: '1px', lineHeight: 1.4 }}>
                  {node.description}
                </div>

                {/* AI 思考提示文本（ReAct 调用前的提示） */}
                {isActive && aiThinkingMessage && (
                  <div
                    key={thinkingKey}
                    style={{
                      marginTop: '4px',
                      padding: '4px 6px',
                      fontSize: '10px',
                      color: '#6ab0ff',
                      fontFamily: "'JetBrains Mono', monospace",
                      background: 'rgba(106, 176, 255, 0.06)',
                      borderLeft: '2px solid #6ab0ff',
                      borderRadius: '2px',
                      lineHeight: 1.5,
                      animation: 'wft-thinking-fade 0.4s ease',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {aiThinkingMessage}
                  </div>
                )}

                {/* ReAct 推理步骤（Thought → Action → Observation → Final Answer） */}
                {hasSteps && (
                  <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {nodeSteps.map(step => (
                      <ReActStepItem key={step.stepNumber} step={step} />
                    ))}
                  </div>
                )}

                {/* 已完成节点的结果摘要（可选） */}
                {node.status === 'completed' && node.result && (
                  <div
                    style={{
                      marginTop: '3px',
                      fontSize: '10px',
                      color: '#00c853',
                      fontFamily: "'JetBrains Mono', monospace",
                      opacity: 0.8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={node.result}
                  >
                    {node.result}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowTracker;
