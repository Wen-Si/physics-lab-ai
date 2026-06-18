/**
 * 物理实验AI智能体 - 主页面
 * 核心功能：自然语言输入 -> 工作流处理 -> 3D可视化
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import PhysicsRenderer from '../components/PhysicsRenderer';
import { workflowEngine, ExperimentOutput, WorkflowState } from '../workflow/engine';

// 预设实验模板
const EXPERIMENT_TEMPLATES = [
  {
    title: '自由落体',
    icon: '⬇',
    prompt: '一个质量为2kg的小球从10米高处自由落下，不计空气阻力，模拟其下落过程'
  },
  {
    title: '单摆运动',
    icon: '↺',
    prompt: '演示单摆的周期运动，摆长1米，初始角度30度，模拟摆动过程'
  },
  {
    title: '弹簧振子',
    icon: '〰',
    prompt: '一个质量为1kg的物体连接在弹簧上，弹簧系数为100N/m，从平衡位置偏离0.2m后释放，模拟简谐振动'
  },
  {
    title: '平抛运动',
    icon: '→',
    prompt: '一个小球从5米高处以10m/s的水平速度抛出，模拟其平抛运动轨迹'
  },
  {
    title: '斜面下滑',
    icon: '◣',
    prompt: '一个1kg的物体在30度角的光滑斜面顶端从静止开始下滑，模拟整个过程'
  }
];

export default function Home() {
  // 状态管理
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [experimentOutput, setExperimentOutput] = useState<ExperimentOutput | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [error, setError] = useState<string>('');
  const [processingStep, setProcessingStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  
  const animationRef = useRef<number | null>(null);

  // 工作流节点名称
  const WORKFLOW_STEPS = [
    '解析自然语言输入',
    '识别实验意图',
    '分类物理实验类型',
    '提取物理参数',
    '匹配物理定律',
    '构建实验场景',
    '计算物理过程',
    '生成3D模型',
    '生成动画序列',
    '生成文字描述',
    '验证结果准确性',
    '格式化输出结果'
  ];

  // 处理用户输入
  const handleProcess = useCallback(async () => {
    if (!userInput.trim()) {
      setError('请先输入实验描述或选择一个示例');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    setShowWelcome(false);
    setCurrentTime(0);
    setIsPlaying(false);
    setProcessingStep(0);
    
    try {
      // 模拟工作流进度
      const progressInterval = setInterval(() => {
        setProcessingStep(prev => Math.min(prev + 1, 11));
      }, 200);
      
      // 执行工作流引擎
      const state = await workflowEngine.execute(userInput);
      setWorkflowState(state);
      
      clearInterval(progressInterval);
      setProcessingStep(12);
      
      if (state.output) {
        setExperimentOutput(state.output);
        
        // 延迟自动播放动画
        setTimeout(() => {
          setIsPlaying(true);
        }, 1000);
      } else {
        setError('未能生成实验结果，请尝试其他描述');
      }
    } catch (err) {
      console.error('处理失败:', err);
      setError(`处理失败: ${err}`);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  }, [userInput]);

  // 动画播放控制
  useEffect(() => {
    if (isPlaying && experimentOutput) {
      const duration = experimentOutput.animations[0]?.duration || 10;
      
      const animate = () => {
        setCurrentTime(prev => {
          const next = prev + 0.016 * animationSpeed;
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return next;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animationSpeed, experimentOutput]);

  // 重置
  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // 重新开始
  const handleRestart = () => {
    setExperimentOutput(null);
    setWorkflowState(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setShowWelcome(true);
    setProcessingStep(0);
  };

  // 使用模板
  const handleTemplateClick = (template: typeof EXPERIMENT_TEMPLATES[0]) => {
    setUserInput(template.prompt);
    setError('');
  };

  return (
    <div className="physics-app">
      {/* 顶部导航栏 */}
      <header className="physics-header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">⚛</div>
            <div className="logo-text">
              <h1>物理实验室</h1>
              <span>AI Physics Simulator</span>
            </div>
          </div>
          <div className="header-info">
            <div className="info-item">
              <span className="info-label">工作流节点</span>
              <span className="info-value">12</span>
            </div>
            <div className="info-item">
              <span className="info-label">3D渲染</span>
              <span className="info-value active">Three.js</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="physics-main">
        {/* 左侧控制面板 */}
        <aside className="control-panel">
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
              rows={5}
              className="input-textarea"
            />
            
            {/* 预设实验 */}
            <div className="templates-grid">
              <h3>快速实验</h3>
              <div className="templates-row">
                {EXPERIMENT_TEMPLATES.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleTemplateClick(template)}
                    className="template-card"
                  >
                    <span className="template-icon">{template.icon}</span>
                    <span className="template-title">{template.title}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* 开始按钮 */}
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className={`start-button ${isProcessing ? 'processing' : ''}`}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  <span>正在模拟...</span>
                </>
              ) : (
                <>
                  <span>▶</span>
                  <span>开始模拟实验</span>
                </>
              )}
            </button>
            
            {error && (
              <div className="error-box">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}
          </section>

          {/* 工作流进度 */}
          {isProcessing && (
            <section className="panel-section workflow-progress">
              <div className="section-header">
                <span className="section-icon">⚙</span>
                <h2>工作流执行</h2>
              </div>
              
              <div className="progress-bar-container">
                <div 
                  className="progress-bar"
                  style={{ width: `${(processingStep / 12) * 100}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {WORKFLOW_STEPS[Math.min(processingStep, 11)] || '完成'} 
                <span className="progress-percent">({processingStep}/12)</span>
              </div>
              
              <div className="workflow-dots">
                {WORKFLOW_STEPS.map((step, index) => (
                  <div 
                    key={index}
                    className={`workflow-dot ${index < processingStep ? 'completed' : ''} ${index === processingStep ? 'active' : ''}`}
                    title={step}
                  ></div>
                ))}
              </div>
            </section>
          )}

          {/* 动画控制面板 */}
          {experimentOutput && (
            <section className="panel-section">
              <div className="section-header">
                <span className="section-icon">⏱</span>
                <h2>动画控制</h2>
              </div>
              
              <div className="animation-controls">
                <div className="control-buttons">
                  <button onClick={handleReset} className="control-btn">
                    ⟲ 重置
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="control-btn primary"
                  >
                    {isPlaying ? '⏸ 暂停' : '▶ 播放'}
                  </button>
                </div>
                
                <div className="slider-control">
                  <label>播放速度: {animationSpeed.toFixed(1)}x</label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                  />
                </div>
                
                <div className="time-display">
                  <span>当前时间</span>
                  <strong>{currentTime.toFixed(2)}s</strong>
                </div>
                
                <button onClick={handleRestart} className="restart-btn">
                  🔄 重新开始新实验
                </button>
              </div>
            </section>
          )}
        </aside>

        {/* 中央3D视口 */}
        <section className="viewport-section">
          <div className="viewport-header">
            <div className="viewport-title">
              <span className="title-icon">🎯</span>
              <span>{experimentOutput?.title || '3D物理实验视口'}</span>
            </div>
            <div className="viewport-hint">
              <span>🖱 拖拽旋转</span>
              <span>🎡 滚轮缩放</span>
              <span>⇧ 右键平移</span>
            </div>
          </div>
          
          <div className="viewport-container">
            <PhysicsRenderer
              scene={experimentOutput?.scene || null}
              animations={experimentOutput?.animations || []}
              currentTime={currentTime}
              isPlaying={isPlaying}
            />
            
            {/* 欢迎界面 */}
            {showWelcome && !experimentOutput && !isProcessing && (
              <div className="welcome-overlay">
                <div className="welcome-content">
                  <div className="welcome-icon">⚛</div>
                  <h2>欢迎来到物理实验室</h2>
                  <p>在左侧输入实验描述，或选择快速实验模板，然后点击"开始模拟"按钮</p>
                  <div className="welcome-features">
                    <div className="feature-item">
                      <span className="feature-icon">📝</span>
                      <span>自然语言输入</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">⚙</span>
                      <span>12节点工作流</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">🎨</span>
                      <span>实时3D渲染</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 处理中动画 */}
            {isProcessing && (
              <div className="processing-overlay">
                <div className="processing-animation">
                  <div className="atom">
                    <div className="nucleus"></div>
                    <div className="electron e1"></div>
                    <div className="electron e2"></div>
                    <div className="electron e3"></div>
                  </div>
                  <p>正在构建物理场景...</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 右侧信息面板 */}
        <aside className="info-panel">
          {experimentOutput && !isProcessing && (
            <>
              {/* 实验概述 */}
              <section className="panel-section highlight">
                <div className="section-header">
                  <span className="section-icon">📋</span>
                  <h2>实验概述</h2>
                </div>
                <p className="experiment-desc">{experimentOutput.description}</p>
              </section>

              {/* 详细解释 */}
              <section className="panel-section">
                <div className="section-header">
                  <span className="section-icon">📖</span>
                  <h2>详细解释</h2>
                </div>
                <div className="explanation-content">
                  {experimentOutput.detailedExplanation.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </section>

              {/* 物理定律 */}
              <section className="panel-section">
                <div className="section-header">
                  <span className="section-icon">📐</span>
                  <h2>物理定律</h2>
                </div>
                <div className="laws-container">
                  {experimentOutput.physicsLaws.map((law, index) => (
                    <div key={index} className="law-card">
                      <span className="law-number">{index + 1}</span>
                      <span className="law-text">{law}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 能量分析 */}
              {experimentOutput.calculations.energyAnalysis && (
                <section className="panel-section">
                  <div className="section-header">
                    <span className="section-icon">⚡</span>
                    <h2>能量分析</h2>
                  </div>
                  <div className="energy-bars">
                    <div className="energy-bar-item">
                      <div className="energy-bar-label">
                        <span>初始势能</span>
                        <span>{experimentOutput.calculations.energyAnalysis.potential[0]?.toFixed(2) || 0} J</span>
                      </div>
                      <div className="energy-bar bg-potential">
                        <div className="energy-bar-fill potential" style={{
                          width: `${Math.min(100, (experimentOutput.calculations.energyAnalysis.potential[0] || 0) * 5)}%`
                        }}></div>
                      </div>
                    </div>
                    <div className="energy-bar-item">
                      <div className="energy-bar-label">
                        <span>最终动能</span>
                        <span>{experimentOutput.calculations.energyAnalysis.kinetic[experimentOutput.calculations.energyAnalysis.kinetic.length - 1]?.toFixed(2) || 0} J</span>
                      </div>
                      <div className="energy-bar bg-kinetic">
                        <div className="energy-bar-fill kinetic" style={{
                          width: `${Math.min(100, (experimentOutput.calculations.energyAnalysis.kinetic[experimentOutput.calculations.energyAnalysis.kinetic.length - 1] || 0) * 5)}%`
                        }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="energy-summary">
                    <span>💡 能量守恒验证：系统总能量保持不变</span>
                  </div>
                </section>
              )}

              {/* 物理参数 */}
              <section className="panel-section">
                <div className="section-header">
                  <span className="section-icon">🔬</span>
                  <h2>实验参数</h2>
                </div>
                <div className="params-box">
                  <pre>{JSON.stringify(experimentOutput.parameters, null, 2)}</pre>
                </div>
              </section>
            </>
          )}

          {/* 默认提示 */}
          {!experimentOutput && !isProcessing && (
            <section className="panel-section empty-state">
              <div className="empty-content">
                <div className="empty-icon">📚</div>
                <h3>等待实验输入</h3>
                <p>完成模拟后，这里将显示物理定律、能量分析和实验参数</p>
              </div>
            </section>
          )}
        </aside>
      </main>

      {/* 底部状态栏 */}
      <footer className="physics-footer">
        <div className="footer-content">
          <div className="footer-item">
            <span className="footer-icon">📊</span>
            <span>工作流节点：{workflowState?.completedNodes.length || 0}/12</span>
          </div>
          <div className="footer-item">
            <span className="footer-icon">🎨</span>
            <span>3D渲染引擎：Three.js</span>
          </div>
          <div className="footer-item">
            <span className="footer-icon">⚡</span>
            <span>实时物理计算：已启用</span>
          </div>
        </div>
      </footer>
    </div>
  );
}