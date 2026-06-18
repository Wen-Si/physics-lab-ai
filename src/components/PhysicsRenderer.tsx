/**
 * 3D物理实验渲染组件
 * 使用Three.js和React Three Fiber实现3D可视化
 */

'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';
import { AnimationData, PhysicsObject, ExperimentScene } from '../workflow/engine';

// 物理对象3D组件
interface PhysicsObjectMeshProps {
  object: PhysicsObject;
  animation?: AnimationData;
  currentTime: number;
  isPlaying: boolean;
}

function PhysicsObjectMesh({ object, animation, currentTime, isPlaying }: PhysicsObjectMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [position, setPosition] = useState<[number, number, number]>(object.position);
  
  // 根据动画更新位置
  useEffect(() => {
    if (animation && isPlaying) {
      const keyframe = animation.keyframes.find(k => k.time >= currentTime) || animation.keyframes[animation.keyframes.length - 1];
      if (keyframe?.position) {
        setPosition(keyframe.position);
      }
    } else {
      setPosition(object.position);
    }
  }, [animation, currentTime, isPlaying, object.position]);
  
  // 选择几何体类型
  const geometry = useMemo(() => {
    switch (object.type) {
      case 'sphere':
        return <sphereGeometry args={[object.scale[0] / 2, 32, 32]} />;
      case 'cube':
        return <boxGeometry args={[object.scale[0], object.scale[1], object.scale[2]]} />;
      case 'cylinder':
        return <cylinderGeometry args={[object.scale[0] / 2, object.scale[0] / 2, object.scale[1], 32]} />;
      default:
        return <sphereGeometry args={[object.scale[0] / 2, 32, 32]} />;
    }
  }, [object.type, object.scale]);
  
  // 创建轨迹线
  const trailPoints = useMemo(() => {
    if (animation && isPlaying) {
      const points = animation.keyframes
        .filter(k => k.time <= currentTime)
        .map(k => k.position || object.position);
      return points.length > 1 ? points : [object.position];
    }
    return [object.position];
  }, [animation, currentTime, isPlaying, object.position]);
  
  return (
    <group>
      {/* 轨迹线 */}
      {trailPoints.length > 1 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={trailPoints.length}
              array={new Float32Array(trailPoints.flat())}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={object.color || '#4a90d9'} linewidth={2} opacity={0.5} transparent />
        </line>
      )}
      
      {/* 物理对象 */}
      <mesh ref={meshRef} position={position} castShadow receiveShadow>
        {geometry}
        <meshStandardMaterial
          color={object.color || '#4a90d9'}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      {/* 对象标签 */}
      <Text position={[position[0], position[1] + 1, position[2]]} fontSize={0.3} color="white">
        {object.name}
      </Text>
    </group>
  );
}

// 地面组件
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#2d3436" metalness={0.1} roughness={0.9} />
    </mesh>
  );
}

// 坐标轴组件
function CoordinateAxes() {
  const axisLength = 5;
  
  return (
    <group>
      {/* X轴 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([-axisLength, 0, 0, axisLength, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="red" linewidth={2} />
      </line>
      <Text position={[axisLength + 0.5, 0, 0]} fontSize={0.3} color="red">X</Text>
      
      {/* Y轴 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, -axisLength, 0, 0, axisLength, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="green" linewidth={2} />
      </line>
      <Text position={[0, axisLength + 0.5, 0]} fontSize={0.3} color="green">Y</Text>
      
      {/* Z轴 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, -axisLength, 0, 0, axisLength])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="blue" linewidth={2} />
      </line>
      <Text position={[0, 0, axisLength + 0.5]} fontSize={0.3} color="blue">Z</Text>
    </group>
  );
}

// 标尺组件
function Ruler({ maxHeight }: { maxHeight: number }) {
  const marks = [];
  const step = 2;
  
  for (let h = 0; h <= maxHeight; h += step) {
    marks.push(
      <group key={h} position={[-5, h, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.5, 0.05, 0.05]} />
          <meshBasicMaterial color="#888" />
        </mesh>
        <Text position={[0.8, 0, 0]} fontSize={0.2} color="#888">{h}m</Text>
      </group>
    );
  }
  
  return (
    <group position={[-5, 0, 0]}>
      {/* 主线 */}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, maxHeight, 8]} />
        <meshBasicMaterial color="#888" />
      </mesh>
      {marks}
    </group>
  );
}

// 场景主组件
interface PhysicsSceneProps {
  scene: ExperimentScene;
  animations: AnimationData[];
  currentTime: number;
  isPlaying: boolean;
}

function PhysicsScene({ scene, animations, currentTime, isPlaying }: PhysicsSceneProps) {
  return (
    <group>
      {/* 渲染所有物理对象 */}
      {scene.objects.map((obj) => {
        const animation = animations.find(a => a.objectId === obj.id);
        return (
          <PhysicsObjectMesh
            key={obj.id}
            object={obj}
            animation={animation}
            currentTime={currentTime}
            isPlaying={isPlaying}
          />
        );
      })}
      
      {/* 地面 */}
      <Ground />
      
      {/* 网格 */}
      <Grid
        args={[30, 30]}
        position={[0, 0.01, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f7376"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9d9d9d"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
      />
      
      {/* 坐标轴 */}
      <CoordinateAxes />
      
      {/* 标尺 */}
      <Ruler maxHeight={15} />
    </group>
  );
}

// 相机控制组件
function CameraController() {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(10, 8, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return null;
}

// 主渲染器组件
interface PhysicsRendererProps {
  scene: ExperimentScene | null;
  animations: AnimationData[];
  currentTime: number;
  isPlaying: boolean;
}

export default function PhysicsRenderer({ scene, animations, currentTime, isPlaying }: PhysicsRendererProps) {
  if (!scene) {
    return (
      <div className="renderer-placeholder" style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom, #1a1a2e, #16213e)',
        color: '#fff',
        fontSize: '18px'
      }}>
        <p>请输入实验描述开始模拟</p>
      </div>
    );
  }
  
  return (
    <div className="physics-renderer" style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [10, 8, 10], fov: 50 }}
        style={{ background: 'linear-gradient(to bottom, #1a1a2e, #16213e)' }}
      >
        <CameraController />
        
        {/* 环境光 */}
        <ambientLight intensity={0.4} />
        
        {/* 主光源 */}
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* 点光源 */}
        <pointLight position={[-5, 5, -5]} intensity={0.5} />
        
        {/* 物理场景 */}
        <PhysicsScene
          scene={scene}
          animations={animations}
          currentTime={currentTime}
          isPlaying={isPlaying}
        />
        
        {/* 轨道控制 - 允许用户旋转查看 */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}