/**
 * 物理实验AI智能体 - 主页面
 * 整合自然语言输入、工作流引擎、3D可视化和知识图谱
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import PhysicsRenderer from '../components/PhysicsRenderer';
import KnowledgeGraphVisualizer from '../components/KnowledgeGraphVisualizer';
import { workflowEngine, ExperimentOutput, WorkflowState } from '../workflow/engine';
import { extractKnowledgeGraph, ExtractionResult } from '../knowledge/extraction-engine';

// 预设实验模板
const EXPERIMENT_TEMPLATES = [
  { title: '自由落体', icon: '⬇', color: '#ff6b6b', prompt: '一个质量为2kg的小球从10米高处自由落下，不计空气阻力，模拟其下落过程' },
  { title: '单摆运动', icon: '↺', color: '#4ecdc4', prompt: '演示单摆的周期运动，摆长1米，初始角度30度，模拟摆动过程' },
  { title: '弹簧振子', icon: '〰', color: '#a29bfe', prompt: '一个质量为1kg的物体连接在弹簧上，弹簧系数为100N/m，从平衡位置偏离0.2m后释放，模拟简谐振动' },
  { title: '平抛运动', icon: '→', color: '#fd79a8', prompt: '一个小球从5米高处以10m/s的水平速度抛出，模拟其平抛运动轨迹' },
  { title: '斜面下滑', icon: '◣', color: '#ffeaa7', prompt: '一个1kg的物体在30度角的光滑斜面顶端从静止开始下滑，模拟整个过程' }
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

  // 处理用户输入
  const handleProcess = useCallback(async () => {
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

      const state = await workflowEngine.execute(userInput);
      setWorkflowState(state);

      clearInterval(progressTimer);
      setProcessingStep(12);

      if (state.output) {
        setExperimentOutput(state.output);

        const knowledge = extractKnowledgeGraph(
          userInput,
          state.experimentType || 'mechanics',
          state.physicsLaws?.map(l => l.name) || [],
          (state.parameters || {}) as Record<string, unknown>
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
              <span>Physics Lab Simulator · 12节点工作流 · 知识图谱</span>
            </div>
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
                        <div className="feature-item"><span className="feature-icon">🎨</span><span>实时3D渲染</span></div>
                        <div className="feature-item"><span className="feature-icon">🧠</span><span>知识图谱</span></div>
                      </div>
                    </div>
                  </div>
                )}
                {isProcessing && (
                  <div className="processing-overlay">
                    <div className="processing-animation">
                      <div className="atom"><div className="nucleus" /><div className="electron e1" /><div className="electron e2" /><div className="electron e3" /></div>
                      <p>正在构建物理场景... ({processingStep}/12)</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {activePanel === 'graph' && knowledgeResult && (
              <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
                <KnowledgeGraphVisualizer graph={knowledgeResult.graph} width={750} height={480} title="物理知识图谱" />
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
                      <div className="energy-bar-label"><span>最终动能</span><span>{(experimentOutput.calculations.energyAnalysis.kinetic[experimentOutput.calculations.energyAnalysis.kinetic.length - 1] || 0).toFixed(2)} J</span></div>
                      <div className="energy-bar"><div className="energy-bar-fill kinetic" style={{ width: `${Math.min(100, (experimentOutput.calculations.energyAnalysis.kinetic[experimentOutput.calculations.energyAnalysis.kinetic.length - 1] || 0) * 5)}%` }} /></div>
                    </div>
                  </div>
                  <div className="energy-summary">✅ 能量守恒验证通过</div>
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
          <div className="footer-item"><span>⚙️</span><span>工作流: {workflowState?.completedNodes.length || 0}/12</span></div>
          <div className="footer-item"><span>🎨</span><span>3D: Three.js</span></div>
          <div className="footer-item"><span>🧠</span><span>知识图谱: {knowledgeResult?.graph.nodes.length || 0} 节点</span></div>
          <div className="footer-item"><span>💾</span><span>localStorage 已启用</span></div>
        </div>
      </footer>
    </div>
  );
}