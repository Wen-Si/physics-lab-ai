/**
 * 3D物理实验渲染器
 * 使用Three.js实现实时3D可视化
 */

'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { AnimationData, PhysicsObject, ExperimentScene } from '../workflow/engine';

// WebGL 错误边界
class ErrorBoundary extends React.Component<{ children: React.ReactNode; onError: () => void }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// 物理对象3D组件
interface ObjectMeshProps {
  object: PhysicsObject;
  animation?: AnimationData;
  currentTime: number;
  isPlaying: boolean;
}

function ObjectMesh({ object, animation, currentTime, isPlaying }: ObjectMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [position, setPosition] = useState<[number, number, number]>(object.position);
  const trailPoints = useRef<[number, number, number][]>([]);

  // 根据动画更新位置
  useEffect(() => {
    if (animation && isPlaying) {
      const keyframes = animation.keyframes;
      if (keyframes.length > 0) {
        // 找到当前时间对应的关键帧
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
        }
      }
    } else if (!isPlaying && !animation) {
      setPosition(object.position);
    }
  }, [animation, currentTime, isPlaying, object.position]);

  // 记录轨迹点
  useEffect(() => {
    if (isPlaying && animation) {
      trailPoints.current.push([...position]);
      if (trailPoints.current.length > 100) {
        trailPoints.current.shift();
      }
    }
  }, [position, isPlaying, animation]);

  // 选择几何体
  const geometry = useMemo(() => {
    switch (object.type) {
      case 'sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'cube':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      default:
        return <sphereGeometry args={[0.5, 32, 32]} />;
    }
  }, [object.type]);

  return (
    <group>
      {/* 物理对象 */}
      <mesh ref={meshRef} position={position} castShadow>
        {geometry}
        <meshStandardMaterial
          color={object.color || '#ff6b6b'}
          metalness={0.3}
          roughness={0.4}
          emissive={object.color || '#ff6b6b'}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 轨迹线 */}
      {trailPoints.current.length > 1 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={trailPoints.current.length}
              array={new Float32Array(trailPoints.current.flat())}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={object.color || '#ff6b6b'} linewidth={2} transparent opacity={0.6} />
        </line>
      )}

      {/* 发光环 */}
      <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.8, 32]} />
        <meshBasicMaterial color={object.color || '#ff6b6b'} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// 地面组件
function GroundPlane() {
  return (
    <group>
      {/* 主地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#1a2a3a"
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      
      {/* 网格辅助线 */}
      <gridHelper args={[50, 50, '#4a90d9', '#2a4a5a']} position={[0, 0.01, 0]} />
      
      {/* 中心标记 */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2, 32]} />
        <meshBasicMaterial color="#4a90d9" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// 坐标轴
function CoordinateAxes() {
  const axisLength = 8;
  
  return (
    <group position={[0, 0.05, 0]}>
      {/* X轴 - 红色 */}
      <group>
        <mesh position={[axisLength / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, axisLength, 8]} />
          <meshBasicMaterial color="#ff4757" />
        </mesh>
        <mesh position={[axisLength, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.1, 0.3, 8]} />
          <meshBasicMaterial color="#ff4757" />
        </mesh>
      </group>

      {/* Y轴 - 绿色 */}
      <group>
        <mesh position={[0, axisLength / 2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, axisLength, 8]} />
          <meshBasicMaterial color="#2ed573" />
        </mesh>
        <mesh position={[0, axisLength, 0]}>
          <coneGeometry args={[0.1, 0.3, 8]} />
          <meshBasicMaterial color="#2ed573" />
        </mesh>
      </group>

      {/* Z轴 - 蓝色 */}
      <group>
        <mesh position={[0, 0, axisLength / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, axisLength, 8]} />
          <meshBasicMaterial color="#1e90ff" />
        </mesh>
        <mesh position={[0, 0, axisLength]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.1, 0.3, 8]} />
          <meshBasicMaterial color="#1e90ff" />
        </mesh>
      </group>
    </group>
  );
}

// 刻度尺
function MeasurementRuler() {
  const maxHeight = 12;
  const marks = [];
  
  for (let h = 0; h <= maxHeight; h += 1) {
    marks.push(
      <group key={h} position={[-8, h, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.8, 0.02, 0.02]} />
          <meshBasicMaterial color={h % 2 === 0 ? '#ffd700' : '#4a90d9'} />
        </mesh>
      </group>
    );
  }
  
  return <group>{marks}</group>;
}

// 场景主组件
interface PhysicsSceneProps {
  scene: ExperimentScene | null;
  animations: AnimationData[];
  currentTime: number;
  isPlaying: boolean;
}

function PhysicsScene({ scene, animations, currentTime, isPlaying }: PhysicsSceneProps) {
  if (scene) {
    return (
      <group>
        {scene.objects.map((obj, index) => {
          const animation = animations.find(a => a.objectId === obj.id);
          return (
            <ObjectMesh
              key={index}
              object={obj}
              animation={animation}
              currentTime={currentTime}
              isPlaying={isPlaying}
            />
          );
        })}
        <GroundPlane />
        <CoordinateAxes />
        <MeasurementRuler />
      </group>
    );
  }
  
  // 默认演示场景
  return (
    <group>
      {/* 演示球体1 */}
      <ObjectMesh
        object={{
          id: 'demo1',
          name: '演示球',
          type: 'sphere',
          position: [0, 5, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          mass: 1,
          color: '#ff6b6b'
        }}
        currentTime={currentTime}
        isPlaying={false}
      />
      
      {/* 演示方块 */}
      <ObjectMesh
        object={{
          id: 'demo2',
          name: '演示方块',
          type: 'cube',
          position: [3, 0.5, 2],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          mass: 2,
          color: '#4a90d9'
        }}
        currentTime={currentTime}
        isPlaying={false}
      />
      
      {/* 演示圆柱体 */}
      <ObjectMesh
        object={{
          id: 'demo3',
          name: '演示柱体',
          type: 'cylinder',
          position: [-3, 0.5, -2],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          mass: 1.5,
          color: '#2ed573'
        }}
        currentTime={currentTime}
        isPlaying={false}
      />
      
      <GroundPlane />
      <CoordinateAxes />
      <MeasurementRuler />
    </group>
  );
}

// 自动旋转的相机
function AutoCamera() {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(8, 6, 10);
    camera.lookAt(0, 2, 0);
  }, [camera]);
  
  return null;
}

// 主渲染器
interface PhysicsRendererProps {
  scene: ExperimentScene | null;
  animations: AnimationData[];
  currentTime: number;
  isPlaying: boolean;
}

export default function PhysicsRenderer({ scene, animations, currentTime, isPlaying }: PhysicsRendererProps) {
  const [webglError, setWebglError] = useState(false);

  // 在渲染前检测 WebGL 支持
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglError(true);
      }
    } catch {
      setWebglError(true);
    }
  }, []);

  return (
    <div className="physics-canvas-container">
      {webglError ? (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '16px',
          background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2e 100%)',
          color: '#a0b0c0', textAlign: 'center', padding: '40px'
        }}>
          <div style={{ fontSize: '64px' }}>🔬</div>
          <h3 style={{ fontSize: '20px', color: '#6ab0ff', margin: 0 }}>3D 物理实验视口</h3>
          <p style={{ fontSize: '14px', maxWidth: '400px', lineHeight: '1.6' }}>
            当前浏览器环境不支持 WebGL 3D 渲染。<br/>
            请使用 Chrome、Firefox 或 Edge 浏览器打开此页面以获得完整的 3D 交互体验。
          </p>
          {scene && (
            <div style={{
              marginTop: '20px', padding: '20px',
              background: 'rgba(74, 144, 217, 0.1)', border: '1px solid rgba(74, 144, 217, 0.3)',
              borderRadius: '12px', textAlign: 'left', maxWidth: '500px'
            }}>
              <h4 style={{ color: '#6ab0ff', marginBottom: '12px' }}>📋 实验场景信息</h4>
              <p style={{ fontSize: '13px', color: '#a0b0c0', marginBottom: '8px' }}>
                <strong>对象数量：</strong>{scene.objects.length} 个
              </p>
              {scene.objects.map((obj, i) => (
                <div key={i} style={{ fontSize: '12px', color: '#708090', padding: '4px 0' }}>
                  • {obj.name} ({obj.type}) — 位置: [{obj.position.map(v => v.toFixed(1)).join(', ')}]
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <ErrorBoundary onError={() => setWebglError(true)}>
          <Canvas
            shadows
            camera={{ position: [8, 6, 10], fov: 50 }}
            gl={{ antialias: true }}
            style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2e 100%)' }}
          >
        <AutoCamera />
        
        {/* 环境光 */}
        <ambientLight intensity={0.4} />
        
        {/* 主方向光 */}
        <directionalLight
          position={[10, 15, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        
        {/* 辅助点光源 */}
        <pointLight position={[-8, 8, -8]} intensity={0.5} color="#4a90d9" />
        <pointLight position={[8, 4, 8]} intensity={0.3} color="#ff6b6b" />
        
        {/* 半球光 */}
        <hemisphereLight args={['#4a90d9', '#1a2a3a', 0.3]} />
        
        {/* 物理场景 */}
        <PhysicsScene
          scene={scene}
          animations={animations}
          currentTime={currentTime}
          isPlaying={isPlaying}
        />
        
        {/* 背景粒子效果 */}
        <ParticleField />
        
        {/* 轨道控制 */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minPolarAngle={0.1}
          autoRotate={!scene}
          autoRotateSpeed={1}
        />
        
        {/* 雾效 */}
        <fog attach="fog" args={['#0a0a1a', 15, 40]} />
      </Canvas>
        </ErrorBoundary>
      )}
    </div>
  );
}

// 粒子场 - 增强视觉效果
function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 200;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 15 + Math.random() * 10;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.random() * 20 - 5;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#4a90d9"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}