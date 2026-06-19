/**
 * 3D物理实验渲染器
 * 使用纯CSS 3D变换实现可视化（无WebGL依赖）
 */

'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { AnimationData, PhysicsObject, ExperimentScene } from '../workflow/engine';

// 物理对象3D组件
interface ObjectMeshProps {
  object: PhysicsObject;
  animation?: AnimationData;
  currentTime: number;
  isPlaying: boolean;
}

function ObjectMesh3D({ object, animation, currentTime, isPlaying }: ObjectMeshProps) {
  const [position, setPosition] = useState<[number, number, number]>(object.position);
  const [trail, setTrail] = useState<[number, number, number][]>([]);

  useEffect(() => {
    if (animation && isPlaying) {
      const keyframes = animation.keyframes;
      if (keyframes.length > 0) {
        let currentFrame = keyframes[0];
        for (let i = 0; i < keyframes.length; i++) {
          if (keyframes[i].time <= currentTime) {
            currentFrame = keyframes[i];
          } else {
            break;
          }
        }
        if (currentFrame?.position) {
          setPosition(currentFrame.position);
          setTrail(prev => {
            const newTrail = [...prev, currentFrame.position!];
            return newTrail.length > 60 ? newTrail.slice(-60) : newTrail;
          });
        }
      }
    } else if (!isPlaying && !animation) {
      setPosition(object.position);
    }
  }, [animation, currentTime, isPlaying, object.position]);

  const shapeStyle = useMemo(() => {
    const base: React.CSSProperties = {
      position: 'absolute',
      transform: `translate3d(${position[0] * 30}px, ${-position[1] * 30}px, ${position[2] * 30}px)`,
      transition: isPlaying ? 'none' : 'transform 0.3s ease',
    };

    switch (object.type) {
      case 'sphere':
        return { ...base, width: '30px', height: '30px', borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${object.color || '#ff6b6b'}, ${object.color || '#ff6b6b'}88)`, boxShadow: `0 0 20px ${object.color || '#ff6b6b'}66, inset 0 -3px 6px rgba(0,0,0,0.3)` };
      case 'cube':
        return { ...base, width: '28px', height: '28px', borderRadius: '4px', background: `linear-gradient(135deg, ${object.color || '#4a90d9'}, ${object.color || '#4a90d9'}88)`, boxShadow: `0 0 15px ${object.color || '#4a90d9'}66` };
      case 'cylinder':
        return { ...base, width: '24px', height: '32px', borderRadius: '12px', background: `linear-gradient(180deg, ${object.color || '#2ed573'}, ${object.color || '#2ed573'}88)`, boxShadow: `0 0 15px ${object.color || '#2ed573'}66` };
      default:
        return { ...base, width: '30px', height: '30px', borderRadius: '50%', background: object.color || '#4a90d9', boxShadow: `0 0 15px ${object.color || '#4a90d9'}66` };
    }
  }, [position, object.type, object.color, isPlaying]);

  return (
    <>
      {/* 轨迹线 */}
      {trail.length > 1 && (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <polyline
            points={trail.map(p => `${250 + p[0] * 30},${250 - p[1] * 30}`).join(' ')}
            fill="none"
            stroke={object.color || '#ff6b6b'}
            strokeWidth="2"
            strokeOpacity="0.4"
            strokeDasharray="4,2"
          />
        </svg>
      )}
      {/* 对象 */}
      <div style={shapeStyle} title={object.name} />
      {/* 阴影 */}
      <div style={{
        position: 'absolute',
        bottom: '5px',
        left: '50%',
        transform: `translateX(${position[0] * 30}px)`,
        width: `${Math.max(10, 30 - position[1] * 2)}px`,
        height: '6px',
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.3)',
        filter: 'blur(3px)',
        transition: isPlaying ? 'none' : 'all 0.3s ease',
      }} />
    </>
  );
}

// 地面网格
function GroundGrid() {
  const lines = [];
  for (let i = -10; i <= 10; i++) {
    lines.push(
      <div key={`h-${i}`} style={{
        position: 'absolute',
        bottom: `${i * 30 + 250}px`,
        left: '0',
        right: '0',
        height: '1px',
        background: i === 0 ? '#4a90d9' : 'rgba(74, 144, 217, 0.15)',
        opacity: i === 0 ? 0.6 : 1,
      }} />,
      <div key={`v-${i}`} style={{
        position: 'absolute',
        top: '0',
        bottom: '0',
        left: `${i * 30 + 250}px`,
        width: '1px',
        background: i === 0 ? '#4a90d9' : 'rgba(74, 144, 217, 0.15)',
        opacity: i === 0 ? 0.6 : 1,
      }} />
    );
  }
  return <>{lines}</>;
}

// 刻度尺
function Ruler() {
  const marks = [];
  for (let h = 0; h <= 12; h += 1) {
    marks.push(
      <div key={h} style={{
        position: 'absolute',
        right: '10px',
        bottom: `${h * 30 + 250}px`,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        <div style={{
          width: h % 2 === 0 ? '20px' : '12px',
          height: '2px',
          background: h % 2 === 0 ? '#ffd700' : '#4a90d9',
          borderRadius: '1px',
        }} />
        {h % 2 === 0 && (
          <span style={{ fontSize: '10px', color: '#708090', fontFamily: 'monospace' }}>{h}m</span>
        )}
      </div>
    );
  }
  return <>{marks}</>;
}

// 坐标轴标签
function AxisLabels() {
  return (
    <>
      <div style={{ position: 'absolute', bottom: '260px', left: '260px', fontSize: '12px', color: '#ff4757', fontWeight: 'bold' }}>X</div>
      <div style={{ position: 'absolute', bottom: '260px', right: '50px', fontSize: '12px', color: '#2ed573', fontWeight: 'bold' }}>Y</div>
    </>
  );
}

// 背景粒子
function BackgroundParticles() {
  const [particles] = useState(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      opacity: 0.1 + Math.random() * 0.3,
      duration: 10 + Math.random() * 20,
    }));
  });

  return (
    <>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          borderRadius: '50%',
          background: '#4a90d9',
          opacity: p.opacity,
          animation: `float-particle ${p.duration}s ease-in-out infinite`,
          animationDelay: `${-Math.random() * p.duration}s`,
        }} />
      ))}
    </>
  );
}

// 场景渲染
function PhysicsSceneView({ scene, animations, currentTime, isPlaying }: {
  scene: ExperimentScene | null; animations: AnimationData[]; currentTime: number; isPlaying: boolean;
}) {
  if (scene && scene.objects.length > 0) {
    return (
      <>
        {scene.objects.map((obj, index) => (
          <ObjectMesh3D
            key={obj.id || index}
            object={obj}
            animation={animations.find(a => a.objectId === obj.id)}
            currentTime={currentTime}
            isPlaying={isPlaying}
          />
        ))}
      </>
    );
  }

  // 默认演示场景
  return (
    <>
      <ObjectMesh3D object={{ id: 'demo1', name: '演示球', type: 'sphere', position: [0, 5, 0], rotation: [0, 0, 0], scale: [1, 1, 1], mass: 1, color: '#ff6b6b' }} currentTime={0} isPlaying={false} />
      <ObjectMesh3D object={{ id: 'demo2', name: '演示方块', type: 'cube', position: [3, 0.5, 2], rotation: [0, 0, 0], scale: [1, 1, 1], mass: 2, color: '#4a90d9' }} currentTime={0} isPlaying={false} />
      <ObjectMesh3D object={{ id: 'demo3', name: '演示柱体', type: 'cylinder', position: [-3, 0.5, -2], rotation: [0, 0, 0], scale: [1, 1, 1], mass: 1.5, color: '#2ed573' }} currentTime={0} isPlaying={false} />
    </>
  );
}

// 主渲染器
interface PhysicsRendererProps {
  scene: ExperimentScene | null;
  animations: AnimationData[];
  currentTime: number;
  isPlaying: boolean;
}

export default function PhysicsRenderer({ scene, animations, currentTime, isPlaying }: PhysicsRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: -15, y: 25 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // 鼠标拖拽旋转
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setRotation(prev => ({
        x: Math.max(-60, Math.min(60, prev.x + dy * 0.3)),
        y: prev.y + dx * 0.3,
      }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="physics-canvas-container"
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2e 100%)',
        cursor: isDragging.current ? 'grabbing' : 'grab',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* CSS 3D 透视容器 */}
      <div style={{
        width: '100%',
        height: '100%',
        perspective: '800px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '500px',
          height: '500px',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: isDragging.current ? 'none' : 'transform 0.1s ease-out',
        }}>
          {/* 背景粒子 */}
          <BackgroundParticles />

          {/* 地面网格 */}
          <GroundGrid />

          {/* 刻度尺 */}
          <Ruler />

          {/* 坐标轴标签 */}
          <AxisLabels />

          {/* 物理对象 */}
          <PhysicsSceneView
            scene={scene}
            animations={animations}
            currentTime={currentTime}
            isPlaying={isPlaying}
          />
        </div>
      </div>

      {/* 3D 信息叠加层 */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        padding: '8px 14px',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '8px',
        border: '1px solid rgba(74, 144, 217, 0.3)',
        fontSize: '11px',
        color: '#708090',
        pointerEvents: 'none',
      }}>
        <div>旋转: X={rotation.x.toFixed(0)} Y={rotation.y.toFixed(0)}</div>
        <div>时间: {currentTime.toFixed(2)}s</div>
        <div>对象: {scene?.objects.length || 3}</div>
      </div>
    </div>
  );
}
