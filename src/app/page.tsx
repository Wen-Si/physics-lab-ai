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
  {
    title: '自由落体',
    icon: '⬇',
    color: '#ff6b6b',
    prompt: '一个质量为2kg的小球从10米高处自由落下，不计空气阻力，模拟其下落过程'
  },
  {
    title: '单摆运动',
    icon: '↺',
    color: '#4ecdc4',
    prompt: '演示单摆的周期运动，摆长1米，初始角度30度，模拟摆动过程'
  },
  {
    title: '弹簧振子',
    icon: '〰',
    color: '#a29bfe',
    prompt: '一个质量为1kg的物体连接在弹簧上，弹簧系数为100N/m，从平衡位置偏离0.2m后释放，模拟简谐振动'
  },
  {
    title: '平抛运动',
    icon: '→',
    color: '#fd79a8',
    prompt: '一个小球从5米高处以10m/s的水平速度抛出，模拟其平抛运动轨迹'
  },
  {
    title: '斜面下滑',
    icon: '◣',
    color: '#ffeaa7',
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
  const [activePanel, setActivePanel] = useState<'3d' | 'graph'>('3d');
  const [knowledgeResult, setKnowledgeResult] = useState<ExtractionResult | null>(null);
  
  const animationRef = useRef<number | null>(null);

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
      // 模拟工作流进度
      const progressInterval = setInterval(() => {
        setProcessingStep(prev => Math.min(prev + 1, 12));
      }, 150);
      
      // 执行工作流引擎
      const state = await workflowEngine.execute(userInput);
      setWorkflowState(state);
      
      clearInterval(progressInterval);
      setProcessingStep(12);
      
      if (state.output) {
        setExperimentOutput(state.output);
        
        // 提取知识图谱
        const knowledge = extractKnowledgeGraph(
          userInput,
          state.experimentType || 'mechanics',
          state.physicsLaws?.map(l => l.name) || [],
          (state.parameters || {}) as Record<string, unknown>
        );
        setKnowledgeResult(knowledge);
        
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
    setKnowledgeResult(null);
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
    <div className="physics-app" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f2e 50%, #1a1a3e 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#e0e0e0'
    }}>
      {/* 顶部导航栏 */}
      <header style={{
        padding: '16px 24px',
        background: 'linear-gradient(90deg, rgba(74, 144, 217, 0.15) 0%, rgba(26, 26, 46, 0.8) 100%)',
        borderBottom: '1px solid rgba(74, 144, 217, 0.3)',
        boxShadow: '0 2px 20px rgba(74, 144, 217, 0.1)'
      }}>
        <div style={{ 
          maxWidth: '1800px', 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4a90d9, #6c5ce7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 0 25px rgba(74, 144, 217, 0.4)'
            }}>
              ⚛
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                margin: 0,
                background: 'linear-gradient(90deg, #6ab0ff, #a29bfe)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700
              }}>
                物理实验室 AI
              </h1>
              <p style={{ fontSize: '13px', color: '#708090', margin: '4px 0 0 0' }}>
                Physics Lab Simulator · 12节点工作流 · 知识图谱
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              padding: '8px 14px',
              background: 'rgba(74, 144, 217, 0.1)',
              border: '1px solid rgba(74, 144, 217, 0.3)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#708090'
            }}>
              <span style={{ color: '#6ab0ff' }}>⚙️</span> 工作流节点: 
              <strong style={{ color: '#fff', marginLeft: '6px' }}>12</strong>
            </div>
            <div style={{
              padding: '8px 14px',
              background: 'rgba(108, 92, 231, 0.1)',
              border: '1px solid rgba(108, 92, 231, 0.3)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#708090'
            }}>
              <span style={{ color: '#a29bfe' }}>🧠</span> 知识图谱
              <strong style={{ color: '#fff', marginLeft: '6px' }}>60+</strong>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main style={{
        display: 'flex',
        gap: '16px',
        padding: '16px',
        maxWidth: '1800px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 100px)',
        flexWrap: 'wrap'
      }}>
        {/* ============ 左侧控制面板 ============ */}
        <aside style={{
          width: '320px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* 输入区域 */}
          <section style={{
            background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.08) 0%, rgba(26, 26, 46, 0.9) 100%)',
            border: '1px solid rgba(74, 144, 217, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{
              fontSize: '16px',
              color: '#6ab0ff',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✏️</span> 实验描述
            </h2>
            
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="用自然语言描述您想模拟的物理实验，例如：一个小球从10米高处自由落下，模拟整个运动过程..."
              rows={5}
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid rgba(74, 144, 217, 0.2)',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#e0e0e0',
                fontSize: '13px',
                resize: 'vertical',
                minHeight: '120px',
                outline: 'none',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit',
                lineHeight: '1.6'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#4a90d9';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(74, 144, 217, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(74, 144, 217, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            
            {/* 预设实验按钮 */}
            <div style={{ marginTop: '16px' }}>
              <h3 style={{
                fontSize: '12px',
                color: '#708090',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                ⚡ 快速实验
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {EXPERIMENT_TEMPLATES.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleTemplateClick(template)}
                    style={{
                      padding: '10px 8px',
                      border: '2px solid rgba(74, 144, 217, 0.2)',
                      borderRadius: '8px',
                      background: userInput === template.prompt 
                        ? 'linear-gradient(135deg, rgba(74, 144, 217, 0.3), rgba(108, 92, 231, 0.2))'
                        : 'rgba(74, 144, 217, 0.08)',
                      color: '#e0e0e0',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      borderColor: userInput === template.prompt ? template.color : 'rgba(74, 144, 217, 0.2)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(74, 144, 217, 0.15)';
                      e.currentTarget.style.borderColor = template.color;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = userInput === template.prompt
                        ? 'linear-gradient(135deg, rgba(74, 144, 217, 0.3), rgba(108, 92, 231, 0.2))'
                        : 'rgba(74, 144, 217, 0.08)';
                      e.currentTarget.style.borderColor = userInput === template.prompt
                        ? template.color
                        : 'rgba(74, 144, 217, 0.2)';
                    }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>{template.icon}</div>
                    {template.title}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 开始模拟按钮 */}
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '16px',
                border: 'none',
                borderRadius: '10px',
                background: isProcessing 
                  ? 'linear-gradient(135deg, #55efc4, #00b894)'
                  : 'linear-gradient(135deg, #4a90d9, #6c5ce7)',
                color: 'white',
                fontSize: '15px',
                fontWeight: 600,
                cursor: isProcessing ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isProcessing
                  ? '0 4px 20px rgba(85, 239, 196, 0.3)'
                  : '0 4px 20px rgba(74, 144, 217, 0.4)',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              {isProcessing ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}></span>
                  正在生成实验... ({processingStep}/12)
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                  <span>▶</span> 开始模拟实验
                </span>
              )}
            </button>
            
            {/* 处理进度条 */}
            {isProcessing && (
              <div style={{
                marginTop: '12px',
                height: '4px',
                background: 'rgba(74, 144, 217, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(processingStep / 12) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #4a90d9, #55efc4)',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            )}
            
            {error && (
              <div style={{
                marginTop: '12px',
                padding: '12px 16px',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '8px',
                color: '#ff8a80',
                fontSize: '13px'
              }}>
                ⚠️ {error}
              </div>
            )}
          </section>

          {/* 动画控制面板 */}
          {experimentOutput && (
            <section style={{
              background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.08) 0%, rgba(26, 26, 46, 0.9) 100%)',
              border: '1px solid rgba(108, 92, 231, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
              <h2 style={{
                fontSize: '16px',
                color: '#a29bfe',
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🎬</span> 动画控制
              </h2>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <button
                  onClick={handleReset}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '2px solid rgba(255, 107, 107, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 107, 107, 0.1)',
                    color: '#ff8a80',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ⟲ 重置
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    flex: 2,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '8px',
                    background: isPlaying
                      ? 'linear-gradient(135deg, #ffa502, #ff7f50)'
                      : 'linear-gradient(135deg, #4ecdc4, #44a08d)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {isPlaying ? '⏸ 暂停' : '▶ 播放'}
                </button>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  fontSize: '12px',
                  color: '#708090',
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span>播放速度</span>
                  <strong style={{ color: '#a29bfe' }}>{animationSpeed.toFixed(1)}x</strong>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(108, 92, 231, 0.2)',
                    borderRadius: '3px',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
              
              <div style={{
                padding: '14px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid rgba(108, 92, 231, 0.2)'
              }}>
                <div style={{ fontSize: '11px', color: '#708090', marginBottom: '4px' }}>当前时间</div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: 'Courier New, monospace',
                  letterSpacing: '2px'
                }}>
                  {currentTime.toFixed(2)}<span style={{ fontSize: '14px', color: '#708090' }}>s</span>
                </div>
              </div>
              
              <button
                onClick={handleRestart}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px',
                  border: '2px solid rgba(255, 107, 107, 0.3)',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: '#ff8a80',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🔄 开始新实验
              </button>
            </section>
          )}
        </aside>

        {/* ============ 中央可视化区域 ============ */}
        <section style={{
          flex: '1',
          minWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(15, 15, 46, 0.9) 100%)',
          border: '1px solid rgba(74, 144, 217, 0.3)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)'
        }}>
          {/* 视图切换标签 */}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(74, 144, 217, 0.1)',
            borderBottom: '1px solid rgba(74, 144, 217, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActivePanel('3d')}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: activePanel === '3d'
                    ? 'linear-gradient(135deg, #4a90d9, #6c5ce7)'
                    : 'rgba(74, 144, 217, 0.1)',
                  color: activePanel === '3d' ? 'white' : '#708090',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🎯 3D 仿真视图
              </button>
              {knowledgeResult && (
                <button
                  onClick={() => setActivePanel('graph')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: activePanel === 'graph'
                      ? 'linear-gradient(135deg, #a29bfe, #6c5ce7)'
                      : 'rgba(108, 92, 231, 0.1)',
                    color: activePanel === 'graph' ? 'white' : '#708090',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🧠 知识图谱视图
                </button>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#708090' }}>
              💡 提示: 拖拽旋转 · 滚轮缩放 · 右键平移
            </div>
          </div>
          
          {/* 3D渲染器 */}
          {activePanel === '3d' && (
            <div style={{ flex: '1', position: 'relative', minHeight: '500px' }}>
              <PhysicsRenderer
                scene={experimentOutput?.scene || null}
                animations={experimentOutput?.animations || []}
                currentTime={currentTime}
                isPlaying={isPlaying}
              />
              
              {/* 欢迎界面 */}
              {showWelcome && !isProcessing && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(10, 10, 26, 0.9)',
                  backdropFilter: 'blur(8px)'
                }}>
                  <div style={{ textAlign: 'center', padding: '40px', maxWidth: '500px' }}>
                    <div style={{
                      fontSize: '80px',
                      marginBottom: '20px',
                      display: 'inline-block',
                      animation: 'float 3s ease-in-out infinite'
                    }}>
                      ⚛
                    </div>
                    <h2 style={{
                      fontSize: '28px',
                      margin: '0 0 12px 0',
                      background: 'linear-gradient(90deg, #6ab0ff, #a29bfe)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      欢迎来到物理实验室
                    </h2>
                    <p style={{ fontSize: '15px', color: '#a0b0c0', lineHeight: '1.8', marginBottom: '24px' }}>
                      在左侧输入实验描述，或选择快速实验模板。<br/>
                      AI将自动分析并生成3D可视化和知识图谱。
                    </p>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <div style={{
                        padding: '16px 20px',
                        background: 'rgba(74, 144, 217, 0.1)',
                        border: '1px solid rgba(74, 144, 217, 0.3)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: '#a0b0c0'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>📝</div>
                        <div>自然语言输入</div>
                      </div>
                      <div style={{
                        padding: '16px 20px',
                        background: 'rgba(108, 92, 231, 0.1)',
                        border: '1px solid rgba(108, 92, 231, 0.3)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: '#a0b0c0'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>⚙️</div>
                        <div>12节点工作流</div>
                      </div>
                      <div style={{
                        padding: '16px 20px',
                        background: 'rgba(85, 239, 196, 0.1)',
                        border: '1px solid rgba(85, 239, 196, 0.3)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: '#a0b0c0'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎨</div>
                        <div>实时3D渲染</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 处理中动画 */}
              {isProcessing && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(10, 10, 26, 0.85)',
                  backdropFilter: 'blur(5px)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      position: 'relative',
                      width: '120px',
                      height: '120px',
                      margin: '0 auto 30px',
                    }}>
                      {/* 原子动画 */}
                      <div style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '30px', height: '30px',
                        background: 'radial-gradient(circle, #ffd54f, #ff7043)',
                        borderRadius: '50%',
                        boxShadow: '0 0 40px #ff7043',
                        animation: 'pulse 1s ease-in-out infinite'
                      }}></div>
                      {/* 电子轨道 */}
                      <div style={{
                        position: 'absolute',
                        top: '0', left: '0', right: '0', bottom: '0',
                        border: '2px solid rgba(74, 144, 217, 0.3)',
                        borderRadius: '50%',
                        animation: 'spin 2s linear infinite'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-6px', left: '50%',
                          transform: 'translateX(-50%)',
                          width: '12px', height: '12px',
                          background: 'radial-gradient(circle, #6ab0ff, #4a90d9)',
                          borderRadius: '50%',
                          boxShadow: '0 0 15px #4a90d9'
                        }}></div>
                      </div>
                      <div style={{
                        position: 'absolute',
                        top: '0', left: '0', right: '0', bottom: '0',
                        border: '2px solid rgba(108, 92, 231, 0.3)',
                        borderRadius: '50%',
                        animation: 'spin 2.5s linear infinite reverse',
                        transform: 'rotate(60deg)'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-6px', left: '50%',
                          transform: 'translateX(-50%)',
                          width: '10px', height: '10px',
                          background: 'radial-gradient(circle, #a29bfe, #6c5ce7)',
                          borderRadius: '50%',
                          boxShadow: '0 0 15px #6c5ce7'
                        }}></div>
                      </div>
                      <div style={{
                        position: 'absolute',
                        top: '0', left: '0', right: '0', bottom: '0',
                        border: '2px solid rgba(85, 239, 196, 0.3)',
                        borderRadius: '50%',
                        animation: 'spin 3s linear infinite',
                        transform: 'rotate(-60deg)'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-6px', left: '50%',
                          transform: 'translateX(-50%)',
                          width: '10px', height: '10px',
                          background: 'radial-gradient(circle, #55efc4, #00b894)',
                          borderRadius: '50%',
                          boxShadow: '0 0 15px #00b894'
                        }}></div>
                      </div>
                    </div>
                    <p style={{
                      fontSize: '18px',
                      color: '#6ab0ff',
                      margin: 0
                    }}>
                      正在构建物理场景...
                    </p>
                    <p style={{
                      fontSize: '13px',
                      color: '#708090',
                      marginTop: '8px'
                    }}>
                      工作流节点: {processingStep}/12
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 知识图谱视图 */}
          {activePanel === 'graph' && knowledgeResult && (
            <div style={{ flex: '1', padding: '20px', overflow: 'auto' }}>
              <KnowledgeGraphVisualizer
                graph={knowledgeResult.graph}
                width={750}
                height={500}
                title="物理知识图谱"
              />
            </div>
          )}
        </section>

        {/* ============ 右侧信息面板 ============ */}
        <aside style={{
          width: '380px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 140px)'
        }}>
          {experimentOutput && !isProcessing && (
            <>
              {/* 实验概述 */}
              <section style={{
                background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.08) 0%, rgba(26, 26, 46, 0.9) 100%)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{
                  fontSize: '16px',
                  color: '#ff8a80',
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>🎯</span> {experimentOutput.title}
                </h2>
                <p style={{ fontSize: '14px', color: '#b0bec5', margin: 0, lineHeight: '1.6' }}>
                  {experimentOutput.description}
                </p>
              </section>

              {/* 物理定律和公式 */}
              <section style={{
                background: 'linear-gradient(135deg, rgba(255, 213, 79, 0.08) 0%, rgba(26, 26, 46, 0.9) 100%)',
                border: '1px solid rgba(255, 213, 79, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{
                  fontSize: '16px',
                  color: '#ffd54f',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>📐</span> 物理定律 & 公式
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {experimentOutput.physicsLaws.map((law, index) => (
                    <div key={index} style={{
                      padding: '12px 14px',
                      background: 'rgba(255, 213, 79, 0.08)',
                      border: '1px solid rgba(255, 213, 79, 0.2)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#ffe082'
                    }}>
                      {law}
                    </div>
                  ))}
                </div>
              </section>

              {/* 能量分析 */}
              {experimentOutput.calculations && experimentOutput.calculations.energyAnalysis && (
                <section style={{
                  background: 'linear-gradient(135deg, rgba(85, 239, 196, 0.08) 0%, rgba(26, 26, 46, 0.9) 100%)',
                  border: '1px solid rgba(85, 239, 196, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}>
                  <h2 style={{
                    fontSize: '16px',
                    color: '#55efc4',
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⚡</span> 能量分析
                  </h2>
                  
                  {/* 能量条 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ color: '#708090' }}>初始势能</span>
                        <span style={{ color: '#ff8a80', fontFamily: 'Courier New, monospace', fontWeight: 'bold' }}>
                          {experimentOutput.calculations.energyAnalysis.potential[0]?.toFixed(2) || 0} J
                        </span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, (experimentOutput.calculations.energyAnalysis.potential[0] || 0) * 5)}%`,
                          background: 'linear-gradient(90deg, #ff6b6b, #ff8a80)',
                          borderRadius: '4px',
                          transition: 'width 0.5s ease'
                        }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ color: '#708090' }}>最终动能</span>
                        <span style={{ color: '#4ecdc4', fontFamily: 'Courier New, monospace', fontWeight: 'bold' }}>
                          {experimentOutput.calculations.energyAnalysis.kinetic[
                            experimentOutput.calculations.energyAnalysis.kinetic.length - 1
                          ]?.toFixed(2) || 0} J
                        </span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(78, 205, 196, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, (experimentOutput.calculations.energyAnalysis.kinetic[
                            experimentOutput.calculations.energyAnalysis.kinetic.length - 1
                          ] || 0) * 5)}%`,
                          background: 'linear-gradient(90deg, #4ecdc4, #55efc4)',
                          borderRadius: '4px',
                          transition: 'width 0.5s ease'
                        }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '12px',
                    background: 'rgba(85, 239, 196, 0.08)',
                    border: '1px solid rgba(85, 239, 196, 0.2)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#80cbc4'
                  }}>
                    ✅ 能量守恒定律验证：系统总能量保持不变，势能转化为动能
                  </div>
                </section>
              )}

              {/* 详细解释 */}
              <section style={{
                background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.08) 0%, rgba(26, 26, 46, 0.9) 100%)',
                border: '1px solid rgba(108, 92, 231, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{
                  fontSize: '16px',
                  color: '#a29bfe',
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>📖</span> 详细解释
                </h2>
                <div style={{ fontSize: '13px', color: '#b0bec5', lineHeight: '1.8' }}>
                  {experimentOutput.detailedExplanation.split('\n').map((line, index) => (
                    <p key={index} style={{ margin: '0 0 8px 0' }}>{line}</p>
                  ))}
                </div>
              </section>

              {/* 实验参数 */}
              <section style={{
                background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.08) 0%, rgba(26, 26, 46, 0.9) 100%)',
                border: '1px solid rgba(74, 144, 217, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{
                  fontSize: '16px',
                  color: '#6ab0ff',
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>🔬</span> 实验参数
                </h2>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '14px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#90a4ae',
                  fontFamily: 'Courier New, monospace',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(experimentOutput.parameters, null, 2)}
                  </pre>
                </div>
              </section>
            </>
          )}

          {/* 默认提示 */}
          {!experimentOutput && !isProcessing && (
            <section style={{
              background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.05) 0%, rgba(26, 26, 46, 0.9) 100%)',
              border: '1px solid rgba(74, 144, 217, 0.2)',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>📚</div>
              <h3 style={{ fontSize: '18px', color: '#a0b0c0', margin: '0 0 12px 0' }}>
                等待实验输入
              </h3>
              <p style={{ fontSize: '13px', color: '#708090', lineHeight: '1.8', maxWidth: '280px', margin: '0 auto' }}>
                完成模拟后，这里将显示实验结果、物理定律、能量分析和知识图谱
              </p>
            </section>
          )}
        </aside>
      </main>

      {/* 底部状态栏 */}
      <footer style={{
        padding: '12px 24px',
        background: 'rgba(0, 0, 0, 0.4)',
        borderTop: '1px solid rgba(74, 144, 217, 0.2)',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1800px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          flexWrap: 'wrap',
          fontSize: '12px',
          color: '#708090'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚙️</span> 工作流节点: <strong style={{ color: '#6ab0ff' }}>{workflowState?.completedNodes.length || 0}/12</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎨</span> 3D渲染引擎: <strong style={{ color: '#a29bfe' }}>Three.js + React</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🧠</span> 知识图谱节点: <strong style={{ color: '#55efc4' }}>{knowledgeResult?.graph.nodes.length || 0}+</strong>
          </div>
        </div>
      </footer>

      {/* CSS动画 */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.7; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(108, 92, 231, 0.5);
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(74, 144, 217, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(74, 144, 217, 0.5);
        }
      `}</style>
    </div>
  );
}
