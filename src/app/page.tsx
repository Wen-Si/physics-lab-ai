/**
 * 物理实验AI智能体主页面
 * 整合自然语言输入、工作流引擎、3D渲染和智谱AI
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import PhysicsRenderer from '../components/PhysicsRenderer';
import { workflowEngine, ExperimentOutput, WorkflowState } from '../workflow/engine';
import { callZhipuAI, parseAIResponse } from '../api/zhipu';

// 示例实验提示
const EXAMPLE_PROMPTS = [
  '模拟一个质量为2kg的小球从10米高处自由落下的过程',
  '演示单摆的运动，摆长为1米，初始角度为30度',
  '模拟两个小球在光滑平面上发生弹性碰撞',
  '展示弹簧振子的振动过程',
  '演示斜面上物体的下滑运动'
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
  const [aiResponse, setAiResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const animationRef = useRef<number | null>(null);
  
  // 处理用户输入
  const handleProcess = useCallback(async () => {
    if (!userInput.trim()) {
      setError('请输入实验描述');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    setCurrentTime(0);
    setIsPlaying(false);
    
    try {
      // 调用智谱AI增强理解
      const aiResult = await callZhipuAI({ userInput });
      setAiResponse(aiResult);
      
      // 执行工作流
      const state = await workflowEngine.execute(userInput);
      setWorkflowState(state);
      
      if (state.output) {
        setExperimentOutput(state.output);
        
        // 解析AI响应并增强输出
        const parsedAI = parseAIResponse(aiResult);
        if (parsedAI) {
          // 合并AI建议
          console.log('AI增强参数:', parsedAI);
        }
      } else if (state.errors.length > 0) {
        setError(state.errors.map(e => e.message).join('\n'));
      }
    } catch (err) {
      setError(`处理失败: ${err}`);
    } finally {
      setIsProcessing(false);
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
  
  // 重置动画
  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };
  
  // 使用示例
  const handleExampleClick = (example: string) => {
    setUserInput(example);
  };
  
  return (
    <div className="app-container">
      {/* 头部 */}
      <header className="app-header">
        <h1>物理实验AI智能体</h1>
        <p>通过自然语言描述，模拟物理实验并生成3D可视化结果</p>
      </header>
      
      {/* 主内容区 */}
      <main className="main-content">
        {/* 左侧面板 - 输入和控制 */}
        <aside className="left-panel">
          {/* 输入区域 */}
          <section className="input-section">
            <h2>实验描述</h2>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="请描述您想要模拟的物理实验，例如：模拟一个质量为2kg的小球从10米高处自由落下的过程"
              rows={4}
              className="input-textarea"
            />
            
            {/* 示例按钮 */}
            <div className="examples">
              <h3>示例实验</h3>
              <div className="example-buttons">
                {EXAMPLE_PROMPTS.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="example-btn"
                  >
                    {example.substring(0, 30)}...
                  </button>
                ))}
              </div>
            </div>
            
            {/* 处理按钮 */}
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="process-btn"
            >
              {isProcessing ? '处理中...' : '开始模拟'}
            </button>
            
            {error && <div className="error-message">{error}</div>}
          </section>
          
          {/* 工作流状态 */}
          {workflowState && (
            <section className="workflow-section">
              <h2>工作流执行状态</h2>
              <div className="workflow-status">
                <div className="node-count">
                  已执行节点: {workflowState.completedNodes.length} / 12
                </div>
                <div className="nodes-list">
                  {workflowState.completedNodes.map((node, index) => (
                    <div key={index} className="node-item completed">
                      {index + 1}. {node}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
          
          {/* 控制面板 */}
          {experimentOutput && (
            <section className="control-section">
              <h2>动画控制</h2>
              <div className="controls">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="control-btn"
                >
                  {isPlaying ? '暂停' : '播放'}
                </button>
                <button onClick={handleReset} className="control-btn">
                  重置
                </button>
              </div>
              
              <div className="speed-control">
                <label>播放速度: {animationSpeed}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.5"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                />
              </div>
              
              <div className="time-display">
                当前时间: {currentTime.toFixed(2)}s
              </div>
              
              {/* 交互控制 */}
              {experimentOutput.interactiveControls.map((control, index) => (
                <div key={index} className="interactive-control">
                  <label>{control.name}</label>
                  {control.type === 'slider' && (
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      defaultValue={control.defaultValue as number}
                    />
                  )}
                </div>
              ))}
            </section>
          )}
        </aside>
        
        {/* 中央 - 3D渲染区 */}
        <section className="render-section">
          <PhysicsRenderer
            scene={experimentOutput?.scene || null}
            animations={experimentOutput?.animations || []}
            currentTime={currentTime}
            isPlaying={isPlaying}
          />
          
          {/* 提示 */}
          <div className="render-tip">
            使用鼠标拖拽旋转视角，滚轮缩放，右键平移
          </div>
        </section>
        
        {/* 右侧面板 - 结果展示 */}
        <aside className="right-panel">
          {experimentOutput && (
            <>
              {/* 实验标题 */}
              <section className="result-section">
                <h2>{experimentOutput.title}</h2>
                <p className="description">{experimentOutput.description}</p>
              </section>
              
              {/* 详细解释 */}
              <section className="explanation-section">
                <h2>详细解释</h2>
                <div className="explanation-content">
                  {experimentOutput.detailedExplanation.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </section>
              
              {/* 物理定律 */}
              <section className="laws-section">
                <h2>涉及的物理定律</h2>
                <ul className="laws-list">
                  {experimentOutput.physicsLaws.map((law, index) => (
                    <li key={index}>{law}</li>
                  ))}
                </ul>
              </section>
              
              {/* 参数信息 */}
              <section className="params-section">
                <h2>实验参数</h2>
                <div className="params-content">
                  <pre>{JSON.stringify(experimentOutput.parameters, null, 2)}</pre>
                </div>
              </section>
              
              {/* 能量分析 */}
              {experimentOutput.calculations.energyAnalysis && (
                <section className="energy-section">
                  <h2>能量分析</h2>
                  <div className="energy-chart">
                    <div className="energy-item">
                      <span>初始势能:</span>
                      <span>{experimentOutput.calculations.energyAnalysis.potential[0]?.toFixed(2)} J</span>
                    </div>
                    <div className="energy-item">
                      <span>最终动能:</span>
                      <span>{experimentOutput.calculations.energyAnalysis.kinetic[experimentOutput.calculations.energyAnalysis.kinetic.length - 1]?.toFixed(2)} J</span>
                    </div>
                    <div className="energy-item">
                      <span>总能量:</span>
                      <span>{experimentOutput.calculations.energyAnalysis.total[0]?.toFixed(2)} J</span>
                    </div>
                  </div>
                </section>
              )}
              
              {/* AI响应 */}
              {aiResponse && (
                <section className="ai-section">
                  <h2>AI分析结果</h2>
                  <div className="ai-content">
                    <pre>{aiResponse}</pre>
                  </div>
                </section>
              )}
            </>
          )}
        </aside>
      </main>
      
      {/* 底部 */}
      <footer className="app-footer">
        <p>物理实验AI智能体 - 工作流节点: 12 | AI模型: 智谱GLM-4.5-Flash | 3D渲染: Three.js</p>
      </footer>
    </div>
  );
}