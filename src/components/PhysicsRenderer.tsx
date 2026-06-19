/**
 * 3D物理实验渲染器
 * 使用Three.js实现实时3D可视化
 * 包含WebGL检测和优雅降级
 */

'use client';

import React, { useRef, useMemo, useEffect, useState, lazy, Suspense } from 'react';
import { AnimationData, PhysicsObject, ExperimentScene } from '../workflow/engine';

// 动态导入 - 仅在WebGL可用时加载Three.js相关组件
const Canvas = lazy(() => import('@react-three/fiber').then(mod => ({ default: mod.Canvas })));
const OrbitControls = lazy(() => import('@react-three/drei').then(mod => ({ default: mod.OrbitControls })));

// 检测WebGL是否可用
function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return true; // SSR时假设可用
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
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
        }
      }
    } else if (!isPlaying && !animation) {
      setPosition(object.position);
    }
  }, [animation, currentTime, isPlaying, object.position]);

  useEffect(() => {
    if (isPlaying && animation) {
      trailPoints.current.push([...position]);
      if (trailPoints.current.length > 100) {
        trailPoints.current.shift();
      }
    }
  }, [position, isPlaying, animation]);

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

      <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.8, 32]} />
        <meshBasicMaterial color={object.color || '#ff6b6b'} transparent opacity={0.3} side={2} />
      </mesh>
    </group>
  );
}

// 地面
function GroundPlane() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1a2a3a" metalness={0.1} roughness={0.8} />
      </mesh>
      <gridHelper args={[50, 50, '#4a90d9', '#2a4a5a']} position={[0, 0.01, 0]} />
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
  const marks = [];
  for (let h = 0; h <= 12; h += 1) {
    marks.push(
      <group key={h} position={[-8, h, 0]}>
        <mesh><boxGeometry args={[0.8, 0.02, 0.02]} /><meshBasicMaterial color={h % 2 === 0 ? '#ffd700' : '#4a90d9'} /></mesh>
      </group>
    );
  }
  return <group>{marks}</group>;
}

// 粒子场（简化版，不使用useFrame）
function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 15 + Math.random() * 10;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.random() * 20 - 5;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return pos;
  }, []);

  useEffect(() => {
    let frame: number;
    const animate = () => {
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.02;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={200} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#4a90d9" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// 场景
function PhysicsScene({ scene, animations, currentTime, isPlaying }: {
  scene: ExperimentScene; animations: AnimationData[]; currentTime: number; isPlaying: boolean;
}) {
  if (scene) {
    return (
      <group>
        {scene.objects.map((obj, index) => (
          <ObjectMesh key={index} object={obj} animation={animations.find(a => a.objectId === obj.id)} currentTime={currentTime} isPlaying={isPlaying} />
        ))}
        <GroundPlane />
        <CoordinateAxes />
        <MeasurementRuler />
      </group>
    );
  }
  return (
    <group>
      <ObjectMesh object={{ id: 'demo1', name: '演示球', type: 'sphere', position: [0, 5, 0], rotation: [0, 0, 0], scale: [1, 1, 1], mass: 1, color: '#ff6b6b' }} currentTime={0} isPlaying={false} />
      <ObjectMesh object={{ id: 'demo2', name: '演示方块', type: 'cube', position: [3, 0.5, 2], rotation: [0, 0, 0], scale: [1, 1, 1], mass: 2, color: '#4a90d9' }} currentTime={0} isPlaying={false} />
      <ObjectMesh object={{ id: 'demo3', name: '演示柱体', type: 'cylinder', position: [-3, 0.5, -2], rotation: [0, 0, 0], scale: [1, 1, 1], mass: 1.5, color: '#2ed573' }} currentTime={0} isPlaying={false} />
      <GroundPlane />
      <CoordinateAxes />
      <MeasurementRuler />
    </group>
  );
}

// 3D Canvas 内容（仅在WebGL可用时渲染）
function ThreeCanvasContent({ scene, animations, currentTime, isPlaying }: {
  scene: ExperimentScene | null; animations: AnimationData[]; currentTime: number; isPlaying: boolean;
}) {
  return (
    <Canvas shadows camera={{ position: [8, 6, 10], fov: 50 }}
      style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2e 100%)' }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 5]} intensity={1} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <pointLight position={[-8, 8, -8]} intensity={0.5} color="#4a90d9" />
      <pointLight position={[8, 4, 8]} intensity={0.3} color="#ff6b6b" />
      <hemisphereLight args={['#4a90d9', '#1a2a3a', 0.3]} />
      <PhysicsScene scene={scene || null} animations={animations} currentTime={currentTime} isPlaying={isPlaying} />
      <ParticleField />
      <Suspense fallback={null}>
        <OrbitControls enablePan enableZoom enableRotate minDistance={3} maxDistance={30}
          maxPolarAngle={Math.PI / 2 - 0.1} minPolarAngle={0.1} autoRotate={!scene} autoRotateSpeed={1} />
      </Suspense>
      <fog attach="fog" args={['#0a0a1a', 15, 40]} />
    </Canvas>
  );
}

// WebGL 不可用时的降级视图
function FallbackView({ scene }: { scene: ExperimentScene | null }) {
  return (
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
        请使用 Chrome、Firefox 或 Edge 浏览器以获得完整的 3D 交互体验。
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
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglAvailable(isWebGLAvailable());
  }, []);

  return (
    <div className="physics-canvas-container" style={{ width: '100%', height: '100%' }}>
      {webglAvailable === null ? (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2e 100%)',
          color: '#6ab0ff', fontSize: '16px'
        }}>
          正在初始化 3D 引擎...
        </div>
      ) : webglAvailable ? (
        <Suspense fallback={
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2e 100%)',
            color: '#6ab0ff', fontSize: '16px'
          }}>
            加载 3D 组件中...
          </div>
        }>
          <ThreeCanvasContent scene={scene} animations={animations} currentTime={currentTime} isPlaying={isPlaying} />
        </Suspense>
      ) : (
        <FallbackView scene={scene} />
      )}
    </div>
  );
}