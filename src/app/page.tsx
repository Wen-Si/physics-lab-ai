/**
 * 物理实验AI智能体 - 主页面
 * 整合自然语言输入、工作流引擎、3D可视化和知识图谱
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import PhysicsRenderer from '../components/PhysicsRenderer';
import KnowledgeGraphVisualizer from '../components/KnowledgeGraphVisualizer';
import { workflowEngine, ExperimentOutput, WorkflowState } from '../workflow/engine';
import { extractKnowledgeGraph, ExtractionResult, FULL_KNOWLEDGE_GRAPH } from '../knowledge/extraction-engine';
import { callZhipuAI, parseAIResponse, enhancedPhysicsUnderstanding } from '../api/zhipu';
import { generateExperimentWithAgent, AgentResult, WORKFLOW_NODES, checkAgentHealth } from '../api/agent';
import WorkflowTracker, { WorkflowNodeStatus } from '../components/WorkflowTracker';

// 预设实验模板 — 10种经典力学实验
const EXPERIMENT_TEMPLATES = [
  { title: '自由落体', icon: '⬇', color: '#ff6b6b', prompt: '一个质量为2kg的小球从10米高处自由落下，不计空气阻力，模拟其下落过程' },
  { title: '单摆运动', icon: '↺', color: '#4ecdc4', prompt: '演示单摆的周期运动，摆长1米，初始角度30度，模拟摆动过程' },
  { title: '弹簧振子', icon: '〰', color: '#a29bfe', prompt: '一个质量为1kg的物体连接在弹簧上，弹簧系数为100N/m，从平衡位置偏离0.2m后释放，模拟简谐振动' },
  { title: '平抛运动', icon: '→', color: '#fd79a8', prompt: '一个小球从5米高处以10m/s的水平速度抛出，模拟其平抛运动轨迹' },
  { title: '斜面下滑', icon: '◣', color: '#ffeaa7', prompt: '一个1kg的物体在30度角的光滑斜面顶端从静止开始下滑，模拟整个过程' },
  { title: '圆周运动', icon: '◌', color: '#00d2d3', prompt: '一个1kg的小球在半径3m的水平圆轨道上做匀速圆周运动，模拟其运动过程' },
  { title: '弹性碰撞', icon: '◉', color: '#ff6b6b', prompt: '一个1kg的小球以3m/s向右运动，与静止的1kg小球发生弹性碰撞，模拟碰撞过程' },
  { title: '斜抛运动', icon: '⤴', color: '#feca57', prompt: '一个小球以15m/s的初速度、45度仰角抛出，模拟斜抛运动轨迹' },
  { title: '滑轮系统', icon: '⊕', color: '#54a0ff', prompt: '阿特伍德机：2kg和1kg的两个物体通过轻绳跨过定滑轮连接，模拟运动过程' },
  { title: '行星轨道', icon: '★', color: '#feca57', prompt: '一颗行星绕恒星做匀速圆周运动，轨道半径5m，模拟轨道运动' }
];

// localStorage 工具函数
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch { /* ignore */ }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

// 处理中遮罩层样式（与 .processing-overlay 一致，使用内联样式以便动态内容渲染）
const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(5, 8, 16, 0.92)',
  zIndex: 10,
};

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [experimentOutput, setExperimentOutput] = useState<ExperimentOutput | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [error, setError] = useState('');
  const [processingStep, setProcessingStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [activePanel, setActivePanel] = useState<'3d' | 'graph'>('3d');
  const [knowledgeResult, setKnowledgeResult] = useState<ExtractionResult | null>(null);
  const [mounted, setMounted] = useState(false);

  // === Spring AI 智能体相关状态 ===
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNodeStatus[]>([]);
  const [activeNodeIndex, setActiveNodeIndex] = useState(-1);
  const [aiThinkingMessage, setAiThinkingMessage] = useState<string | null>(null);
  // true = 使用 Spring AI 智能体后端；false = 回退到本地工作流（callZhipuAI）
  const [agentMode, setAgentMode] = useState<boolean>(true);

  const animationRef = useRef<number | null>(null);

  // 从 localStorage 恢复状态
  useEffect(() => {
    setMounted(true);
    const savedInput = loadFromStorage<string>('physics_lab_input', '');
    const savedSpeed = loadFromStorage<number>('physics_lab_speed', 1);
    const savedPanel = loadFromStorage<'3d' | 'graph'>('physics_lab_panel', '3d');
    if (savedInput) setUserInput(savedInput);
    setAnimationSpeed(savedSpeed);
    setActivePanel(savedPanel);
  }, []);

  // 初始化 12 个工作流节点为 pending 状态，并探测 Spring AI 后端是否可用
  useEffect(() => {
    setWorkflowNodes(WORKFLOW_NODES.map(n => ({ ...n, status: 'pending' as const })));
    // 健康检查失败时自动回退到本地模式
    checkAgentHealth().then(available => setAgentMode(available)).catch(() => setAgentMode(false));
  }, []);

  // 持久化关键状态
  useEffect(() => {
    if (mounted) saveToStorage('physics_lab_input', userInput);
  }, [userInput, mounted]);

  useEffect(() => {
    if (mounted) saveToStorage('physics_lab_speed', animationSpeed);
  }, [animationSpeed, mounted]);

  useEffect(() => {
    if (mounted) saveToStorage('physics_lab_panel', activePanel);
  }, [activePanel, mounted]);

  // 持久化实验结果
  useEffect(() => {
    if (mounted && experimentOutput) {
      saveToStorage('physics_lab_output', experimentOutput);
      saveToStorage('physics_lab_knowledge', knowledgeResult);
      saveToStorage('physics_lab_workflow', workflowState);
    }
  }, [experimentOutput, knowledgeResult, workflowState, mounted]);

  // 本地处理流程（fallback）：使用智谱AI + 本地工作流引擎
  // 当 Spring AI 智能体后端不可用、或调用失败时使用
  const handleLocalProcess = useCallback(async () => {
    if (!userInput.trim()) {
      setError('请先输入实验描述或选择一个示例实验');
      return;
    }

    setIsProcessing(true);
    setError('');
    setShowWelcome(false);
    setCurrentTime(0);
    setIsPlaying(false);
    setProcessingStep(0);

    try {
      const progressTimer = setInterval(() => {
        setProcessingStep(prev => Math.min(prev + 1, 12));
      }, 150);

      // 步骤 1-2: 借助智谱AI真正"理解"自然语言（而非仅靠关键词匹配）
      // 提取自然语言中的物理参数：实验类型、初始高度、角度、质量、速度等
      let aiParams: Record<string, any> = {};
      let aiSceneType: string | undefined;
      let aiLaws: string[] = [];
      let aiDescription: string = '';
      try {
        const aiRaw = await callZhipuAI({ userInput });
        const parsed = parseAIResponse(aiRaw);
        if (parsed) {
          aiParams = (parsed.parameters as Record<string, any>) || {};
          aiSceneType = parsed.experimentType;
          aiLaws = parsed.physicsLaws || [];
          aiDescription = parsed.description || '';
        }
      } catch (e) {
        // AI 不可用时降级到工作流规则匹配
        console.warn('智谱AI不可用，使用本地规则匹配:', e);
      }

      // 将 AI 解析出的参数注入到用户输入的上下文里，让工作流节点能"看到"这些参数
      // 这样物体位置、质量、角度等就会按照自然语言中的描述生成
      let augmentedInput = userInput;
      if (aiParams && Object.keys(aiParams).length > 0) {
        const paramHints: string[] = [];
        if (aiParams.mass !== undefined) paramHints.push(`质量${aiParams.mass}kg`);
        if (aiParams.initialHeight !== undefined) paramHints.push(`初始高度${aiParams.initialHeight}m`);
        if (aiParams.angle !== undefined) paramHints.push(`斜面角度${aiParams.angle}度`);
        if (aiParams.inclineAngle !== undefined) paramHints.push(`斜面角度${aiParams.inclineAngle}度`);
        if (aiParams.initialVelocity !== undefined) paramHints.push(`初速度${aiParams.initialVelocity}m/s`);
        if (aiParams.horizontalVelocity !== undefined) paramHints.push(`水平初速度${aiParams.horizontalVelocity}m/s`);
        if (aiParams.length !== undefined) paramHints.push(`摆长${aiParams.length}m`);
        if (aiParams.springConstant !== undefined) paramHints.push(`弹簧系数${aiParams.springConstant}N/m`);
        if (aiParams.amplitude !== undefined) paramHints.push(`振幅${aiParams.amplitude}m`);
        if (aiParams.distance !== undefined) paramHints.push(`距离${aiParams.distance}m`);
        if (aiParams.height !== undefined) paramHints.push(`高度${aiParams.height}m`);
        if (aiParams.gravity !== undefined) paramHints.push(`重力${aiParams.gravity}m/s²`);
        if (paramHints.length > 0) {
          augmentedInput = `${userInput} [AI识别的参数: ${paramHints.join('，')}]`;
        }
      }

      const state = await workflowEngine.execute(augmentedInput);
      setWorkflowState(state);

      // 步骤 3-5: 用 AI 解析结果对工作流输出做增强
      // 让3D实验真正按照自然语言的描述来制作
      if (state.output && aiParams && Object.keys(aiParams).length > 0) {
        try {
          const enhanced = await enhancedPhysicsUnderstanding(userInput, {
            experimentType: state.experimentType || 'mechanics',
            parameters: state.parameters as unknown as Record<string, unknown>,
            physicsLaws: state.physicsLaws?.map(l => l.name) || []
          });
          // 把 AI 识别的额外参数覆盖到工作流的场景对象上
          const additionalParams = enhanced.additionalParameters || aiParams;
          if (additionalParams && Object.keys(additionalParams).length > 0) {
            applyAIParamsToScene(state, additionalParams);
            // 强制 scene 引用更新，触发 PhysicsRenderer 重新构建
            if (state.scene) {
              state.scene = { ...state.scene, objects: [...state.scene.objects] };
              if (state.output) {
                state.output = { ...state.output, scene: state.scene };
              }
            }
          }
        } catch (e) {
          // 增强失败不影响主流程
        }
      }

      clearInterval(progressTimer);
      setProcessingStep(12);

      if (state.output) {
        setExperimentOutput(state.output);

        const sceneType = (state.scene?.metadata as any)?.sceneType as string | undefined;
        const knowledge = extractKnowledgeGraph(
          userInput,
          state.experimentType || 'mechanics',
          state.physicsLaws?.map(l => l.name) || [],
          (state.parameters || {}) as Record<string, unknown>,
          sceneType
        );
        setKnowledgeResult(knowledge);

        setTimeout(() => setIsPlaying(true), 800);
      } else {
        setError('未能生成实验结果，请尝试其他描述');
      }
    } catch (err) {
      console.error('处理失败:', err);
      setError('处理失败: ' + String(err));
    } finally {
      setTimeout(() => setIsProcessing(false), 400);
    }
  }, [userInput]);

  // 处理用户输入：优先使用 Spring AI 智能体后端，失败时回退到本地处理
  const handleProcess = useCallback(async () => {
    if (!userInput.trim()) {
      setError('请先输入实验描述或选择一个示例实验');
      return;
    }

    // 重置所有工作流节点为 pending 状态
    setWorkflowNodes(WORKFLOW_NODES.map(n => ({ ...n, status: 'pending' as const })));
    setActiveNodeIndex(-1);
    setAiThinkingMessage(null);

    // 非智能体模式：直接走本地处理
    if (!agentMode) {
      await handleLocalProcess();
      return;
    }

    // 智能体模式：先尝试 Spring AI 后端
    setIsProcessing(true);
    setError('');
    setShowWelcome(false);
    setCurrentTime(0);
    setIsPlaying(false);
    setProcessingStep(0);

    try {
      // 调用 Spring AI 智能体，流式接收 12 节点执行进度
      const agentResult: AgentResult = await generateExperimentWithAgent(
        userInput,
        // onNodeStart: 更新节点为 running，设置 activeNodeIndex
        (nodeIndex, nodeName, nodeDescription) => {
          setActiveNodeIndex(nodeIndex);
          setWorkflowNodes(prev =>
            prev.map(n =>
              n.index === nodeIndex
                ? { ...n, status: 'running' as const, name: nodeName || n.name, description: nodeDescription || n.description }
                : n
            )
          );
        },
        // onNodeComplete: 更新节点为 completed，保存结果
        (nodeIndex, nodeName, result) => {
          setWorkflowNodes(prev =>
            prev.map(n =>
              n.index === nodeIndex
                ? { ...n, status: 'completed' as const, name: nodeName || n.name, result }
                : n
            )
          );
        },
        // onAIThinking: 设置 AI 思考文本
        (message) => {
          setAiThinkingMessage(message);
        }
      );

      // 智能体返回后，用 augmentedInput 调用本地工作流引擎
      const augmentedInput = agentResult.augmentedInput || userInput;
      const state = await workflowEngine.execute(augmentedInput);
      setWorkflowState(state);

      // 用智能体返回的 aiParams 应用到 3D 场景（复用现有的参数注入逻辑）
      const aiParams = agentResult.aiParams || {};
      if (state.output && aiParams && Object.keys(aiParams).length > 0) {
        applyAIParamsToScene(state, aiParams);
        // 强制 scene 引用更新，触发 PhysicsRenderer 重新构建
        if (state.scene) {
          state.scene = { ...state.scene, objects: [...state.scene.objects] };
          if (state.output) {
            state.output = { ...state.output, scene: state.scene };
          }
        }
      }

      setProcessingStep(12);
      setAiThinkingMessage(null);
      setActiveNodeIndex(-1);

      if (state.output) {
        setExperimentOutput(state.output);

        // 提取知识图谱（与本地模式保持一致）
        const sceneType = (state.scene?.metadata as any)?.sceneType as string | undefined;
        const knowledge = extractKnowledgeGraph(
          userInput,
          state.experimentType || 'mechanics',
          state.physicsLaws?.map(l => l.name) || [],
          (state.parameters || {}) as Record<string, unknown>,
          sceneType
        );
        setKnowledgeResult(knowledge);

        setTimeout(() => setIsPlaying(true), 800);
      } else {
        setError('未能生成实验结果，请尝试其他描述');
      }
    } catch (err) {
      console.error('Spring AI 智能体调用失败，回退到本地处理:', err);
      // 标记当前运行中的节点为 error，并清理思考状态
      setWorkflowNodes(prev =>
        prev.map(n => (n.status === 'running' ? { ...n, status: 'error' as const } : n))
      );
      setAiThinkingMessage(null);
      setActiveNodeIndex(-1);
      // 回退到本地处理（handleLocalProcess 会重新接管 isProcessing）
      await handleLocalProcess();
    } finally {
      setTimeout(() => setIsProcessing(false), 400);
    }
  }, [userInput, agentMode, handleLocalProcess]);

  // 把 AI 识别出的参数（角度、质量、高度、初速度等）应用到 3D 场景对象上
  // 这样 3D 实验才能真正按照自然语言的描述来制作
  const applyAIParamsToScene = (state: WorkflowState, aiParams: Record<string, unknown>) => {
    if (!state.scene) return;
    const objs = state.scene.objects;
    const sceneType = (state.scene.metadata as any)?.sceneType;
    const num = (v: unknown, dflt = 0) => (typeof v === 'number' && isFinite(v)) ? v : dflt;

    for (const obj of objs) {
      // 通用：质量
      if (typeof aiParams.mass === 'number') obj.mass = aiParams.mass;
    }

    if (sceneType === 'ramp') {
      const ramp = objs.find(o => o.id === 'ramp_plane');
      const block = objs.find(o => o.id === 'block_1');
      // 角度（支持"angle"或"inclineAngle"，中文描述中也可能直接给"30度"）
      const angleDeg = (typeof aiParams.angle === 'number') ? aiParams.angle
        : (typeof aiParams.inclineAngle === 'number') ? aiParams.inclineAngle
        : 30;
      const angleRad = angleDeg * Math.PI / 180;
      if (ramp) {
        ramp.rotation = [0, 0, angleRad];
        const rampLength = (ramp.scale && ramp.scale[0]) || 5;
        // 重新计算斜面高端位置
        const rampHighX = (rampLength / 2) * Math.cos(angleRad);
        const rampHighY = (ramp.position[1] || 2) + (rampLength / 2) * Math.sin(angleRad) + 0.3;
        if (block) {
          block.position = [rampHighX, rampHighY, 0];
          block.rotation = [0, 0, angleRad];
        }
      }
    } else if (sceneType === 'freefall') {
      const ball = objs.find(o => o.id === 'ball_1');
      const h = num(aiParams.initialHeight ?? aiParams.height, 10);
      if (ball) ball.position = [0, h, 0];
    } else if (sceneType === 'pendulum') {
      const bob = objs.find(o => o.id === 'bob');
      const pivot = objs.find(o => o.id === 'pivot');
      const stringLine = objs.find(o => o.id === 'string_line');
      const lengthVal = num(aiParams.length ?? aiParams.pendulumLength, 1);
      const angleDeg = num(aiParams.angle ?? aiParams.initialAngle, 30);
      const angleRad = angleDeg * Math.PI / 180;
      const pMass = num(aiParams.mass, 1);
      const pivotYVal = lengthVal + 1;
      const bobXVal = lengthVal * Math.sin(angleRad);
      const bobYVal = pivotYVal - lengthVal * Math.cos(angleRad);
      if (pivot) pivot.position = [0, pivotYVal, 0];
      if (bob) { bob.position = [bobXVal, bobYVal, 0]; bob.mass = pMass; }
      if (stringLine) { stringLine.position = [bobXVal / 2, (pivotYVal + bobYVal) / 2, 0]; stringLine.scale = [0.03, lengthVal, 0.03]; }
    } else if (sceneType === 'spring') {
      const block = objs.find(o => o.id === 'mass_block');
      const amp = num(aiParams.amplitude ?? aiParams.initialOffset, 0.2);
      if (block) block.position = [amp, 1, 0];
    } else if (sceneType === 'projectile') {
      const ball = objs.find(o => o.id === 'ball_1');
      const h = num(aiParams.initialHeight ?? aiParams.height, 5);
      if (ball) ball.position = [0, h, 0];
    } else if (sceneType === 'circular') {
      const ball = objs.find(o => o.id === 'ball_1');
      const r = num(aiParams.radius, 0);
      if (ball && r > 0) ball.position = [r, ball.position[1] || 1, 0];
    } else if (sceneType === 'collision') {
      const ball1 = objs.find(o => o.id === 'ball_1');
      const ball2 = objs.find(o => o.id === 'ball_2');
      if (ball1 && typeof aiParams.mass === 'number') ball1.mass = aiParams.mass;
      if (ball2 && typeof aiParams.mass2 === 'number') ball2.mass = aiParams.mass2;
    } else if (sceneType === 'angled_projectile') {
      const ball = objs.find(o => o.id === 'ball_1');
      const angle = num(aiParams.angle, 45) * Math.PI / 180;
      const v0 = num(aiParams.initialVelocity, 15);
      if (ball) ball.velocity = [v0 * Math.cos(angle), v0 * Math.sin(angle), 0];
    } else if (sceneType === 'atwood') {
      const m1 = objs.find(o => o.id === 'mass_1');
      const m2 = objs.find(o => o.id === 'mass_2');
      if (m1 && typeof aiParams.mass === 'number') m1.mass = aiParams.mass;
      if (m2 && typeof aiParams.mass2 === 'number') m2.mass = aiParams.mass2;
    } else if (sceneType === 'orbital') {
      const planet = objs.find(o => o.id === 'planet');
      const star = objs.find(o => o.id === 'star');
      const r = num(aiParams.orbitRadius ?? aiParams.radius, 5);
      if (star && planet) planet.position = [star.position[0] + r, star.position[1], 0];
    }
  };

  // 动画播放控制
  useEffect(() => {
    if (isPlaying && experimentOutput) {
      const duration = experimentOutput.animations[0]?.duration || 10;
      const animate = () => {
        setCurrentTime(prev => {
          const next = prev + 0.016 * animationSpeed;
          if (next >= duration) { setIsPlaying(false); return duration; }
          return next;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying, animationSpeed, experimentOutput]);

  const handleReset = () => { setCurrentTime(0); setIsPlaying(false); };

  const handleRestart = () => {
    setExperimentOutput(null);
    setWorkflowState(null);
    setKnowledgeResult(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setShowWelcome(true);
    setProcessingStep(0);
    setError('');
  };

  const handleTemplateClick = (prompt: string) => {
    setUserInput(prompt);
    setError('');
  };

  // 防止未挂载时渲染（SSR安全）
  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a1a, #0f0f2e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6ab0ff',
        fontSize: '18px',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚛</div>
          <p>物理实验室 AI 加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="physics-app">
      {/* 顶部导航栏 */}
      <header className="physics-header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">⚛</div>
            <div className="logo-text">
              <h1>物理实验室 AI</h1>
              <span>Physics Lab · 12节点工作流 · 10种实验 · 知识图谱</span>
            </div>
            {/* 智能体模式徽章：显示当前是 Spring AI 智能体模式还是本地回退模式 */}
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: agentMode ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 107, 107, 0.15)', color: agentMode ? '#00e676' : '#ff6b6b', border: `1px solid ${agentMode ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 107, 107, 0.3)'}` }}>
              {agentMode ? '🤖 Spring AI 智能体' : '📱 本地模式'}
            </span>
          </div>
          <div className="header-info">
            <div className="info-item">
              <span className="info-label">工作流节点</span>
              <span className="info-value">12</span>
            </div>
            <div className="info-item">
              <span className="info-label">知识图谱</span>
              <span className="info-value active">60+</span>
            </div>
            <div className="info-item">
              <span className="info-label">数据持久化</span>
              <span className="info-value active">localStorage</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="physics-main">
        {/* 左侧控制面板 */}
        <aside className="left-panel">
          {/* 输入区域 */}
          <section className="panel-section">
            <div className="section-header">
              <span className="section-icon">✎</span>
              <h2>实验描述</h2>
            </div>

            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="用自然语言描述您想模拟的物理实验，例如：一个小球从10米高处自由落下..."
              rows={4}
              className="input-textarea"
            />

            {/* 预设实验 */}
            <div className="templates-grid">
              <h3>快速实验</h3>
              <div className="templates-row">
                {EXPERIMENT_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    className="template-card"
                    data-prompt={t.prompt}
                    onClick={() => handleTemplateClick(t.prompt)}
                  >
                    <span className="template-icon">{t.icon}</span>
                    <span className="template-title">{t.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 开始按钮 */}
            <button
              className="start-button"
              disabled={isProcessing}
              onClick={handleProcess}
            >
              {isProcessing ? (
                <><span className="spinner" /><span>正在模拟... ({processingStep}/12)</span></>
              ) : (
                <><span>▶</span><span>开始模拟实验</span></>
              )}
            </button>

            {isProcessing && (
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${(processingStep / 12) * 100}%` }} />
              </div>
            )}

            {error && <div className="error-box"><span>⚠</span><span>{error}</span></div>}
          </section>

          {/* 动画控制面板 */}
          {experimentOutput && (
            <section className="panel-section">
              <div className="section-header">
                <span className="section-icon">⏱</span>
                <h2>动画控制</h2>
              </div>
              <div className="animation-controls">
                <div className="control-buttons">
                  <button className="control-btn" onClick={handleReset}>⟲ 重置</button>
                  <button className="control-btn primary" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? '⏸ 暂停' : '▶ 播放'}
                  </button>
                </div>
                <div className="slider-control">
                  <label>播放速度: {animationSpeed.toFixed(1)}x</label>
                  <input type="range" min="0.5" max="3" step="0.1" value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(Number(e.target.value))} />
                </div>
                <div className="time-display">
                  <span>当前时间</span>
                  <strong>{currentTime.toFixed(2)}s</strong>
                </div>
                <button className="restart-btn" onClick={handleRestart}>🔄 开始新实验</button>
              </div>
            </section>
          )}

          {/* 工作流执行追踪器：在处理中或已有节点完成时显示 */}
          {(isProcessing || workflowNodes.some(n => n.status === 'completed')) && (
            <WorkflowTracker
              nodes={workflowNodes}
              activeNodeIndex={activeNodeIndex}
              aiThinkingMessage={aiThinkingMessage}
            />
          )}
        </aside>

        {/* 中央可视化区域 */}
        <section className="viewport-section">
          <div className="viewport-header">
            <div className="viewport-title">
              <span className="title-icon">🎯</span>
              <span>{experimentOutput?.title || '3D物理实验视口'}</span>
            </div>
            <div className="view-tabs">
              <button
                className={'view-tab' + (activePanel === '3d' ? ' active' : '')}
                onClick={() => setActivePanel('3d')}
              >🎯 3D 仿真</button>
              {knowledgeResult && (
                <button
                  className={'view-tab' + (activePanel === 'graph' ? ' active' : '')}
                  onClick={() => setActivePanel('graph')}
                >🧠 知识图谱</button>
              )}
            </div>
          </div>

          <div className="viewport-container">
            {activePanel === '3d' && (
              <>
                <PhysicsRenderer
                  scene={experimentOutput?.scene || null}
                  animations={experimentOutput?.animations || []}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                />
                {showWelcome && !isProcessing && (
                  <div className="welcome-overlay">
                    <div className="welcome-content">
                      <div className="welcome-icon">⚛</div>
                      <h2>欢迎来到物理实验室</h2>
                      <p>在左侧输入实验描述，或选择快速实验模板，然后点击"开始模拟"按钮</p>
                      <div className="welcome-features">
                        <div className="feature-item"><span className="feature-icon">📝</span><span>自然语言输入</span></div>
                        <div className="feature-item"><span className="feature-icon">⚙</span><span>12节点工作流</span></div>
                        <div className="feature-item"><span className="feature-icon">🧪</span><span>10种实验</span></div>
                        <div className="feature-item"><span className="feature-icon">🎨</span><span>实时3D渲染</span></div>
                        <div className="feature-item"><span className="feature-icon">🧠</span><span>知识图谱</span></div>
                      </div>
                    </div>
                  </div>
                )}
                {isProcessing && (
                  <div style={overlayStyle}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚛</div>
                      <div style={{ color: '#6ab0ff', fontSize: '16px', marginBottom: '8px' }}>
                        {activeNodeIndex >= 0 ? `正在执行: ${WORKFLOW_NODES[activeNodeIndex]?.name}` : '正在启动智能体...'}
                      </div>
                      {aiThinkingMessage && (
                        <div style={{ color: '#708090', fontSize: '13px' }}>{aiThinkingMessage}</div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {activePanel === 'graph' && knowledgeResult && (
              <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
                {/* Palantir 本体论摘要 */}
                <div style={{
                  padding: '12px 16px', marginBottom: '12px',
                  background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.08), rgba(0, 229, 255, 0.06))',
                  border: '1px solid rgba(0, 230, 118, 0.2)',
                  borderRadius: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px' }}>🏛️</span>
                    <span style={{ fontSize: '13px', color: '#00e676', fontWeight: 'bold' }}>Palantir 本体论知识图谱</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#a0b0c0', lineHeight: '1.6', margin: 0 }}>
                    {knowledgeResult.summary}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: '#6ab0ff' }}>Object: {knowledgeResult.ontologyMetadata.objectCount}</span>
                    <span style={{ fontSize: '11px', color: '#ff7043' }}>Link: {knowledgeResult.ontologyMetadata.linkCount}</span>
                    <span style={{ fontSize: '11px', color: '#00e676' }}>Action: {knowledgeResult.ontologyMetadata.actionCount}</span>
                    {knowledgeResult.sceneType && (
                      <span style={{ fontSize: '11px', color: '#ffd54f' }}>Scene: {knowledgeResult.sceneType}</span>
                    )}
                  </div>
                </div>
                <KnowledgeGraphVisualizer
                  graph={FULL_KNOWLEDGE_GRAPH}
                  mappedNodeIds={new Set(knowledgeResult.graph.nodes.map(n => n.id))}
                  topNodeIds={knowledgeResult.topNodeIds}
                  width={750}
                  height={480}
                  title="物理知识图谱"
                />
              </div>
            )}
          </div>

          <div className="viewport-hint">
            <span>🖱 拖拽旋转</span><span>🎡 滚轮缩放</span><span>⇧ 右键平移</span>
          </div>
        </section>

        {/* 右侧信息面板 */}
        <aside className="right-panel">
          {experimentOutput && !isProcessing && (
            <>
              <section className="panel-section highlight">
                <div className="section-header">
                  <span className="section-icon">📋</span>
                  <h2>{experimentOutput.title}</h2>
                </div>
                <p className="experiment-desc">{experimentOutput.description}</p>
              </section>

              <section className="panel-section">
                <div className="section-header">
                  <span className="section-icon">📐</span>
                  <h2>物理定律 & 公式</h2>
                </div>
                <div className="laws-container">
                  {experimentOutput.physicsLaws.map((law, i) => (
                    <div key={i} className="law-card"><span className="law-number">{i + 1}</span><span className="law-text">{law}</span></div>
                  ))}
                </div>
              </section>

              {experimentOutput.calculations?.energyAnalysis && (
                <section className="panel-section">
                  <div className="section-header">
                    <span className="section-icon">⚡</span>
                    <h2>能量分析</h2>
                  </div>
                  <div className="energy-bars">
                    <div className="energy-bar-item">
                      <div className="energy-bar-label"><span>初始势能</span><span>{(experimentOutput.calculations.energyAnalysis.potential[0] || 0).toFixed(2)} J</span></div>
                      <div className="energy-bar"><div className="energy-bar-fill potential" style={{ width: `${Math.min(100, (experimentOutput.calculations.energyAnalysis.potential[0] || 0) * 5)}%` }} /></div>
                    </div>
                    <div className="energy-bar-item">
                      <div className="energy-bar-label"><span>最大动能</span><span>{Math.max(...experimentOutput.calculations.energyAnalysis.kinetic, 0).toFixed(2)} J</span></div>
                      <div className="energy-bar"><div className="energy-bar-fill kinetic" style={{ width: `${Math.min(100, Math.max(...experimentOutput.calculations.energyAnalysis.kinetic, 0) * 5)}%` }} /></div>
                    </div>
                  </div>
                  {(() => {
                    const ea = experimentOutput.calculations.energyAnalysis;
                    // 仅检查非零能量阶段的守恒性（排除落地后静止阶段）
                    const activeTotal = ea.total.filter(v => Math.abs(v) > 0.01);
                    const checkArr = activeTotal.length > 0 ? activeTotal : ea.total;
                    const maxTotal = Math.max(...checkArr);
                    const minTotal = Math.min(...checkArr);
                    const variation = maxTotal - minTotal;
                    const isConserved = variation < Math.max(0.5, Math.abs(maxTotal) * 0.05);
                    return (
                      <div className="energy-summary" style={{ color: isConserved ? 'var(--signal)' : 'var(--alert)' }}>
                        {isConserved ? '✅ 能量守恒验证通过' : `⚠️ 能量守恒存在偏差（变化量: ${variation.toFixed(2)} J）`}
                      </div>
                    );
                  })()}
                </section>
              )}

              <section className="panel-section">
                <div className="section-header">
                  <span className="section-icon">📖</span>
                  <h2>详细解释</h2>
                </div>
                <div className="explanation-content">
                  {experimentOutput.detailedExplanation.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
              </section>

              <section className="panel-section">
                <div className="section-header">
                  <span className="section-icon">🔬</span>
                  <h2>实验参数</h2>
                </div>
                <div className="params-box"><pre>{JSON.stringify(experimentOutput.parameters, null, 2)}</pre></div>
              </section>
            </>
          )}

          {!experimentOutput && !isProcessing && (
            <section className="panel-section empty-state">
              <div className="empty-content">
                <div className="empty-icon">📚</div>
                <h3>等待实验输入</h3>
                <p>完成模拟后，这里将显示物理定律、能量分析和知识图谱</p>
              </div>
            </section>
          )}
        </aside>
      </main>

      {/* 底部状态栏 */}
      <footer className="physics-footer">
        <div className="footer-content">
          <div className="footer-item"><span>⚙️</span><span>{agentMode ? `智能体: ${workflowNodes.filter(n => n.status === 'completed').length}/12` : `工作流: ${workflowState?.completedNodes.length || 0}/12`}</span></div>
          <div className="footer-item"><span>🎨</span><span>3D: Three.js</span></div>
          <div className="footer-item"><span>🧠</span><span>知识图谱: {knowledgeResult?.graph.nodes.length || 0} 节点</span></div>
          <div className="footer-item"><span>💾</span><span>localStorage 已启用</span></div>
        </div>
      </footer>
    </div>
  );
}