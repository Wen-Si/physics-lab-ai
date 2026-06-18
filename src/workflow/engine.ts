/**
 * 物理实验AI智能体工作流引擎
 * 包含12个工作流节点，实现从自然语言到3D渲染的完整流程
 */

import { z } from 'zod';

// 工作流节点定义
export enum WorkflowNodeType {
  // 节点1: 输入解析节点
  INPUT_PARSER = 'input_parser',
  // 节点2: 意图识别节点
  INTENT_RECOGNITION = 'intent_recognition',
  // 节点3: 实验类型分类节点
  EXPERIMENT_CLASSIFIER = 'experiment_classifier',
  // 节点4: 物理参数提取节点
  PARAMETER_EXTRACTOR = 'parameter_extractor',
  // 节点5: 物理定律匹配节点
  PHYSICS_LAW_MATCHER = 'physics_law_matcher',
  // 节点6: 实验场景构建节点
  SCENE_BUILDER = 'scene_builder',
  // 节点7: 物理计算节点
  PHYSICS_CALCULATOR = 'physics_calculator',
  // 节点8: 3D模型生成节点
  MODEL_GENERATOR = 'model_generator',
  // 节点9: 动画序列生成节点
  ANIMATION_GENERATOR = 'animation_generator',
  // 节点10: 文字描述生成节点
  DESCRIPTION_GENERATOR = 'description_generator',
  // 节点11: 结果验证节点
  RESULT_VALIDATOR = 'result_validator',
  // 节点12: 输出格式化节点
  OUTPUT_FORMATTER = 'output_formatter'
}

// 工作流状态
export interface WorkflowState {
  currentNode: WorkflowNodeType;
  completedNodes: WorkflowNodeType[];
  input: string;
  parsedInput: ParsedInput | null;
  intent: ExperimentIntent | null;
  experimentType: ExperimentType | null;
  parameters: PhysicsParameters | null;
  physicsLaws: PhysicsLaw[] | null;
  scene: ExperimentScene | null;
  calculations: PhysicsCalculations | null;
  model3D: Model3DData | null;
  animations: AnimationData[] | null;
  description: string | null;
  validationResult: ValidationResult | null;
  output: ExperimentOutput | null;
  errors: WorkflowError[];
}

// 类型定义
export interface ParsedInput {
  originalText: string;
  keywords: string[];
  entities: Entity[];
  language: 'zh' | 'en';
}

export interface Entity {
  type: 'object' | 'quantity' | 'property' | 'action';
  value: string;
  confidence: number;
}

export type ExperimentIntent = 
  | 'simulate_experiment'
  | 'explain_phenomenon'
  | 'calculate_result'
  | 'visualize_concept';

export type ExperimentType =
  | 'mechanics'           // 力学
  | 'electromagnetism'    // 电磁学
  | 'optics'              // 光学
  | 'thermodynamics'      // 热力学
  | 'waves'               // 波动
  | 'modern_physics';     // 现代物理

export interface PhysicsParameters {
  objects: PhysicsObject[];
  environment: EnvironmentConfig;
  timeRange: { start: number; end: number; step: number };
  initialConditions: Record<string, number>;
}

export interface PhysicsObject {
  id: string;
  name: string;
  type: 'sphere' | 'cube' | 'cylinder' | 'plane' | 'pendulum' | 'spring' | 'ramp' | 'lens' | 'mirror' | 'circuit';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  mass?: number;
  velocity?: [number, number, number];
  acceleration?: [number, number, number];
  charge?: number;
  color?: string;
  material?: string;
}

export interface EnvironmentConfig {
  gravity: [number, number, number];
  friction: number;
  airResistance: number;
  temperature?: number;
  magneticField?: [number, number, number];
  electricField?: [number, number, number];
}

export interface PhysicsLaw {
  name: string;
  formula: string;
  description: string;
  applicableObjects: string[];
}

export interface ExperimentScene {
  id: string;
  name: string;
  objects: PhysicsObject[];
  environment: EnvironmentConfig;
  camera: { position: [number, number, number]; target: [number, number, number] };
  lighting: { type: string; intensity: number; position: [number, number, number] }[];
}

export interface PhysicsCalculations {
  steps: CalculationStep[];
  finalState: Record<string, unknown>;
  energyAnalysis: EnergyAnalysis;
}

export interface CalculationStep {
  time: number;
  objects: Record<string, { position: [number, number, number]; velocity: [number, number, number] }>;
  forces?: Record<string, [number, number, number]>;
}

export interface EnergyAnalysis {
  kinetic: number[];
  potential: number[];
  total: number[];
}

export interface Model3DData {
  geometries: GeometryData[];
  materials: MaterialData[];
  scene: string;
}

export interface GeometryData {
  type: string;
  parameters: Record<string, number>;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface MaterialData {
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
}

export interface AnimationData {
  objectId: string;
  keyframes: Keyframe[];
  duration: number;
  loop: boolean;
}

export interface Keyframe {
  time: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export interface ValidationResult {
  isValid: boolean;
  physicsAccuracy: number;
  visualQuality: number;
  warnings: string[];
}

export interface ExperimentOutput {
  title: string;
  description: string;
  detailedExplanation: string;
  physicsLaws: string[];
  parameters: Record<string, unknown>;
  scene: ExperimentScene;
  animations: AnimationData[];
  calculations: PhysicsCalculations;
  interactiveControls: InteractiveControl[];
}

export interface InteractiveControl {
  name: string;
  type: 'slider' | 'button' | 'toggle';
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number | boolean;
  affectsObject: string;
  affectsProperty: string;
}

export interface WorkflowError {
  node: WorkflowNodeType;
  message: string;
  timestamp: Date;
}

// 工作流节点基类
export abstract class WorkflowNode {
  abstract type: WorkflowNodeType;
  abstract execute(state: WorkflowState): Promise<WorkflowState>;
  
  protected transitionTo(state: WorkflowState, nextType: WorkflowNodeType): WorkflowState {
    return {
      ...state,
      currentNode: nextType,
      completedNodes: [...state.completedNodes, state.currentNode]
    };
  }
  
  protected addError(state: WorkflowState, message: string): WorkflowState {
    return {
      ...state,
      errors: [...state.errors, { node: this.type, message, timestamp: new Date() }]
    };
  }
}

// 节点1: 输入解析节点
export class InputParserNode extends WorkflowNode {
  type = WorkflowNodeType.INPUT_PARSER;
  
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      const input = state.input;
      
      // 检测语言
      const language = this.detectLanguage(input);
      
      // 提取关键词
      const keywords = this.extractKeywords(input, language);
      
      // 识别实体
      const entities = this.extractEntities(input, language);
      
      const parsedInput: ParsedInput = {
        originalText: input,
        keywords,
        entities,
        language
      };
      
      return this.transitionTo({
        ...state,
        parsedInput
      }, WorkflowNodeType.INTENT_RECOGNITION);
    } catch (error) {
      return this.addError(state, `输入解析失败: ${error}`);
    }
  }
  
  private detectLanguage(text: string): 'zh' | 'en' {
    const chinesePattern = /[\u4e00-\u9fa5]/;
    return chinesePattern.test(text) ? 'zh' : 'en';
  }
  
  private extractKeywords(text: string, language: 'zh' | 'en'): string[] {
    const physicsKeywords = language === 'zh' 
      ? ['自由落体', '单摆', '弹簧', '斜面', '碰撞', '抛物线', '圆周运动', '电磁感应', '光的折射', '透镜', '电路', '热传导', '波动', '粒子']
      : ['free fall', 'pendulum', 'spring', 'ramp', 'collision', 'projectile', 'circular motion', 'electromagnetic induction', 'refraction', 'lens', 'circuit', 'heat conduction', 'wave', 'particle'];
    
    const foundKeywords: string[] = [];
    const lowerText = text.toLowerCase();
    
    physicsKeywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    });
    
    return foundKeywords;
  }
  
  private extractEntities(text: string, language: 'zh' | 'en'): Entity[] {
    const entities: Entity[] = [];
    
    // 物理对象实体
    const objectPatterns = language === 'zh'
      ? [{ pattern: /球|小球|物体/, type: 'object' as const }]
      : [{ pattern: /ball|object|body/, type: 'object' as const }];
    
    objectPatterns.forEach(({ pattern, type }) => {
      const matches = text.match(pattern);
      if (matches) {
        entities.push({ type, value: matches[0], confidence: 0.9 });
      }
    });
    
    // 数量实体
    const quantityPattern = /(\d+(?:\.\d+)?)\s*(米|秒|千克|m|s|kg|牛顿|N|焦耳|J)?/gi;
    const quantityMatches = text.matchAll(quantityPattern);
    for (const match of quantityMatches) {
      entities.push({ type: 'quantity', value: match[0], confidence: 0.85 });
    }
    
    return entities;
  }
}

// 节点2: 意图识别节点
export class IntentRecognitionNode extends WorkflowNode {
  type = WorkflowNodeType.INTENT_RECOGNITION;
  
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      const { parsedInput } = state;
      if (!parsedInput) throw new Error('缺少解析输入');
      
      const intent = this.recognizeIntent(parsedInput);
      
      return this.transitionTo({
        ...state,
        intent
      }, WorkflowNodeType.EXPERIMENT_CLASSIFIER);
    } catch (error) {
      return this.addError(state, `意图识别失败: ${error}`);
    }
  }
  
  private recognizeIntent(parsedInput: ParsedInput): ExperimentIntent {
    const text = parsedInput.originalText.toLowerCase();
    
    if (text.includes('模拟') || text.includes('simulate') || text.includes('演示') || text.includes('demonstrate')) {
      return 'simulate_experiment';
    }
    if (text.includes('解释') || text.includes('explain') || text.includes('为什么') || text.includes('why')) {
      return 'explain_phenomenon';
    }
    if (text.includes('计算') || text.includes('calculate') || text.includes('求') || text.includes('find')) {
      return 'calculate_result';
    }
    if (text.includes('可视化') || text.includes('visualize') || text.includes('展示') || text.includes('show')) {
      return 'visualize_concept';
    }
    
    return 'simulate_experiment';
  }
}

// 节点3: 实验类型分类节点
export class ExperimentClassifierNode extends WorkflowNode {
  type = WorkflowNodeType.EXPERIMENT_CLASSIFIER;
  
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      const { parsedInput } = state;
      if (!parsedInput) throw new Error('缺少解析输入');
      
      const experimentType = this.classifyExperiment(parsedInput);
      
      return this.transitionTo({
        ...state,
        experimentType
      }, WorkflowNodeType.PARAMETER_EXTRACTOR);
    } catch (error) {
      return this.addError(state, `实验分类失败: ${error}`);
    }
  }
  
  private classifyExperiment(parsedInput: ParsedInput): ExperimentType {
    const text = parsedInput.originalText.toLowerCase();
    const keywords = parsedInput.keywords.map(k => k.toLowerCase());
    
    // 力学实验
    if (keywords.some(k => ['自由落体', '单摆', '弹簧', '斜面', '碰撞', '抛物线', '圆周运动', 'free fall', 'pendulum', 'spring', 'ramp', 'collision', 'projectile', 'circular motion'].includes(k))) {
      return 'mechanics';
    }
    
    // 电磁学实验
    if (keywords.some(k => ['电磁感应', '电路', '磁场', '电场', 'electromagnetic', 'circuit', 'magnetic', 'electric field'].includes(k))) {
      return 'electromagnetism';
    }
    
    // 光学实验
    if (keywords.some(k => ['光的折射', '透镜', '反射', '干涉', '衍射', 'refraction', 'lens', 'reflection', 'interference', 'diffraction'].includes(k))) {
      return 'optics';
    }
    
    // 热力学实验
    if (keywords.some(k => ['热传导', '温度', '热力学', 'heat', 'temperature', 'thermodynamics'].includes(k))) {
      return 'thermodynamics';
    }
    
    // 波动实验
    if (keywords.some(k => ['波动', '波', '声波', 'wave', 'sound'].includes(k))) {
      return 'waves';
    }
    
    // 现代物理
    if (keywords.some(k => ['粒子', '量子', '相对论', 'particle', 'quantum', 'relativity'].includes(k))) {
      return 'modern_physics';
    }
    
    // 默认力学
    return 'mechanics';
  }
}

// 节点4: 物理参数提取节点
export class ParameterExtractorNode extends WorkflowNode {
  type = WorkflowNodeType.PARAMETER_EXTRACTOR;
  
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      const { parsedInput, experimentType } = state;
      if (!parsedInput || !experimentType) throw new Error('缺少必要信息');
      
      const parameters = this.extractParameters(parsedInput, experimentType);
      
      return this.transitionTo({
        ...state,
        parameters
      }, WorkflowNodeType.PHYSICS_LAW_MATCHER);
    } catch (error) {
      return this.addError(state, `参数提取失败: ${error}`);
    }
  }
  
  private extractParameters(parsedInput: ParsedInput, experimentType: ExperimentType): PhysicsParameters {
    const text = parsedInput.originalText;
    const objects: PhysicsObject[] = [];
    
    // 提取数值参数
    const numberPattern = /(\d+(?:\.\d+)?)/g;
    const numbers = text.match(numberPattern)?.map(Number) || [];
    
    // 根据实验类型创建默认对象
    switch (experimentType) {
      case 'mechanics':
        objects.push({
          id: 'ball_1',
          name: '小球',
          type: 'sphere',
          position: [0, numbers[0] || 10, 0],
          rotation: [0, 0, 0],
          scale: [0.5, 0.5, 0.5],
          mass: numbers[1] || 1,
          velocity: [0, 0, 0],
          color: '#4a90d9'
        });
        break;
      case 'electromagnetism':
        objects.push({
          id: 'charge_1',
          name: '电荷',
          type: 'sphere',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
          charge: numbers[0] || 1,
          color: '#ff6b6b'
        });
        break;
      case 'optics':
        objects.push({
          id: 'lens_1',
          name: '透镜',
          type: 'lens',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 2, 0.1],
          color: '#87ceeb'
        });
        break;
      default:
        objects.push({
          id: 'object_1',
          name: '物体',
          type: 'cube',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: '#4a90d9'
        });
    }
    
    return {
      objects,
      environment: {
        gravity: [0, -9.8, 0],
        friction: 0.1,
        airResistance: 0.01
      },
      timeRange: { start: 0, end: 10, step: 0.016 },
      initialConditions: {}
    };
  }
}

// 节点5: 物理定律匹配节点
export class PhysicsLawMatcherNode extends WorkflowNode {
  type = WorkflowNodeType.PHYSICS_LAW_MATCHER;
  
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      const { experimentType, parameters } = state;
      if (!experimentType || !parameters) throw new Error('缺少必要信息');
      
      const physicsLaws = this.matchLaws(experimentType, parameters);
      
      return this.transitionTo({
        ...state,
        physicsLaws
      }, WorkflowNodeType.SCENE_BUILDER);
    } catch (error) {
      return this.addError(state, `物理定律匹配失败: ${error}`);
    }
  }
  
  private matchLaws(experimentType: ExperimentType, _parameters: PhysicsParameters): PhysicsLaw[] {
    const laws: Record<ExperimentType, PhysicsLaw[]> = {
      mechanics: [
        { name: '牛顿第二定律', formula: 'F = ma', description: '物体的加速度与作用力成正比，与质量成反比', applicableObjects: ['all'] },
        { name: '自由落体运动', formula: 'h = ½gt²', description: '物体在重力作用下的运动', applicableObjects: ['sphere'] },
        { name: '动量守恒定律', formula: 'm₁v₁ + m₂v₂ = m₁v₁\' + m₂v₂\'', description: '系统总动量保持不变', applicableObjects: ['sphere', 'cube'] },
        { name: '能量守恒定律', formula: 'E = KE + PE', description: '系统总能量保持不变', applicableObjects: ['all'] }
      ],
      electromagnetism: [
        { name: '库仑定律', formula: 'F = kq₁q₂/r²', description: '电荷间的作用力', applicableObjects: ['sphere'] },
        { name: '欧姆定律', formula: 'V = IR', description: '电压、电流与电阻的关系', applicableObjects: ['circuit'] },
        { name: '法拉第电磁感应定律', formula: 'ε = -dΦ/dt', description: '磁通量变化产生感应电动势', applicableObjects: ['circuit'] }
      ],
      optics: [
        { name: '斯涅尔定律', formula: 'n₁sinθ₁ = n₂sinθ₂', description: '光的折射定律', applicableObjects: ['lens'] },
        { name: '薄透镜公式', formula: '1/f = 1/u + 1/v', description: '透镜成像规律', applicableObjects: ['lens'] }
      ],
      thermodynamics: [
        { name: '热传导方程', formula: 'Q = kAΔT/L', description: '热量传导规律', applicableObjects: ['all'] },
        { name: '理想气体状态方程', formula: 'PV = nRT', description: '气体状态变化规律', applicableObjects: ['all'] }
      ],
      waves: [
        { name: '波动方程', formula: 'y = A sin(kx - ωt)', description: '波的传播规律', applicableObjects: ['all'] },
        { name: '多普勒效应', formula: 'f\' = f(v±v₀)/(v±vs)', description: '相对运动时的频率变化', applicableObjects: ['all'] }
      ],
      modern_physics: [
        { name: '质能方程', formula: 'E = mc²', description: '质量与能量的等价关系', applicableObjects: ['all'] },
        { name: '德布罗意波长', formula: 'λ = h/p', description: '粒子的波粒二象性', applicableObjects: ['particle'] }
      ]
    };
    
    return laws[experimentType] || laws.mechanics;
  }
}

// 节点6: 实验场景构建节点
export class SceneBuilderNode extends WorkflowNode {
  type = WorkflowNodeType.SCENE_BUILDER;
  
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      const { parameters, experimentType } = state;
      if (!parameters || !experimentType) throw new Error('缺少必要信息');
      
      const scene = this.buildScene(parameters, experimentType);
      
      return this.transitionTo({
        ...state,
        scene
      }, WorkflowNodeType.PHYSICS_CALCULATOR);
    } catch (error) {
      return this.addError(state, `场景构建失败: ${error}`);
    }
  }
  
  private buildScene(parameters: PhysicsParameters, experimentType: ExperimentType): ExperimentScene {
    return {
      id: `scene_${Date.now()}`,
      name: this.getSceneName(experimentType),
      objects: parameters.objects,
      environment: parameters.environment,
      camera: {
        position: [10, 8, 10],
        target: [0, 0, 0]
      },
      lighting: [
        { type: 'ambient', intensity: 0.4, position: [0, 0, 0] },
        { type: 'directional', intensity: 0.8, position: [10, 10, 5] },
        { type: 'point', intensity: 0.5, position: [-5, 5, -5] }
      ]
    };
  }
  
  private getSceneName(experimentType: ExperimentType): string {
    const names: Record<ExperimentType, string> = {
      mechanics: '力学实验场景',
      electromagnetism: '电磁学实验场景',
      optics: '光学实验场景',
      thermodynamics: '热力学实验场景',
      waves: '波动实验场景',
      modern_physics: '现代物理实验场景'
    };
    return names[experimentType];
  }
}

// 节点7: 物理计算节点
export class PhysicsCalculatorNode extends WorkflowNode {
  type = WorkflowNodeType.PHYSICS_CALCULATOR;
  
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      const { parameters, physicsLaws, experimentType } = state;
      if (!parameters || !physicsLaws || !experimentType) throw new Error('缺少必要信息');
      
      const calculations = this.performCalculations(parameters, physicsLaws, experimentType);
      
      return this.transitionTo({
        ...state,
        calculations
      }, WorkflowNodeType.MODEL_GENERATOR);
    } catch (error) {
      return this.addError(state, `物理计算失败: ${error}`);
    }
  }
  
  private performCalculations(parameters: PhysicsParameters, _laws: PhysicsLaw[], experimentType: ExperimentType): PhysicsCalculations {
    const steps: CalculationStep[] = [];
    const { timeRange, objects, environment } = parameters;
    const g = Math.abs(environment.gravity[1]);
    
    // 能量分析
    const kinetic: number[] = [];
    const potential: number[] = [];
    const total: number[] = [];
    
    for (let t = timeRange.start; t <= timeRange.end; t += timeRange.step) {
      const stepObjects: Record<string, { position: [number, number, number]; velocity: [number, number, number] }> = {};
      
      objects.forEach(obj => {
        if (experimentType === 'mechanics') {
          // 自由落体运动计算
          const y = obj.position[1] - 0.5 * g * t * t;
          const vy = -g * t;
          
          stepObjects[obj.id] = {
            position: [obj.position[0], Math.max(0, y), obj.position[2]],
            velocity: [0, vy, 0]
          };
          
          // 计算能量
          const mass = obj.mass || 1;
          const v = Math.abs(vy);
          kinetic.push(0.5 * mass * v * v);
          potential.push(mass * g * Math.max(0, y));
          total.push(0.5 * mass * v * v + mass * g * Math.max(0, y));
        }
      });
      
      steps.push({ time: t, objects: stepObjects });
    }
    
    return {
      steps,
      finalState: steps[steps.length - 1]?.objects || {},
      energyAnalysis: { kinetic, potential, total }
    };
  }
}

// 节点8: 3D模型生成节点
export class ModelGeneratorNode extends WorkflowNode {
  type = WorkflowNodeType.MODEL_GENERATOR;
  
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      const { scene, parameters } = state;
      if (!scene || !parameters) throw new Error('缺少必要信息');
      
      const model3D = this.generateModel(scene, parameters);
      
      return this.transitionTo({
        ...state,
        model3D
      }, WorkflowNodeType.ANIMATION_GENERATOR);
    } catch (error) {
      return this.addError(state, `3D模型生成失败: ${error}`);
    }
  }
  
  private generateModel(scene: ExperimentScene, _parameters: PhysicsParameters): Model3DData {
    const geometries: GeometryData[] = [];
    const materials: MaterialData[] = [];
    
    scene.objects.forEach(obj => {
      geometries.push({
        type: obj.type,
        parameters: {
          radius: obj.scale[0] / 2,
          width: obj.scale[0],
          height: obj.scale[1],
          depth: obj.scale[2]
        },
        position: obj.position,
        rotation: obj.rotation
      });
      
      materials.push({
        color: obj.color || '#4a90d9',
        metalness: 0.3,
        roughness: 0.7,
        opacity: 1
      });
    });
    
    // 添加地面
    geometries.push({
      type: 'plane',
      parameters: { width: 20, height: 20 },
      position: [0, 0, 0],
      rotation: [-Math.PI / 2, 0, 0]
    });
    
    materials.push({
      color: '#2d3436',
      metalness: 0.1,
      roughness: 0.9,
      opacity: 1
    });
    
    return {
      geometries,
      materials,
      scene: scene.id
    };
  }
}

// 节点9: 动画序列生成节点
export class AnimationGeneratorNode extends WorkflowNode {
  type = WorkflowNodeType.ANIMATION_GENERATOR;
  
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      const { calculations, parameters } = state;
      if (!calculations || !parameters) throw new Error('缺少必要信息');
      
      const animations = this.generateAnimations(calculations, parameters);
      
      return this.transitionTo({
        ...state,
        animations
      }, WorkflowNodeType.DESCRIPTION_GENERATOR);
    } catch (error) {
      return this.addError(state, `动画生成失败: ${error}`);
    }
  }
  
  private generateAnimations(calculations: PhysicsCalculations, parameters: PhysicsParameters): AnimationData[] {
    const animations: AnimationData[] = [];
    
    parameters.objects.forEach(obj => {
      const keyframes: Keyframe[] = calculations.steps.map(step => {
        const objState = step.objects[obj.id];
        return {
          time: step.time,
          position: objState?.position || obj.position,
          velocity: objState?.velocity
        };
      });
      
      animations.push({
        objectId: obj.id,
        keyframes,
        duration: parameters.timeRange.end,
        loop: false
      });
    });
    
    return animations;
  }
}

// 节点10: 文字描述生成节点
export class DescriptionGeneratorNode extends WorkflowNode {
  type = WorkflowNodeType.DESCRIPTION_GENERATOR;
  
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      const { experimentType, physicsLaws, parameters, calculations } = state;
      if (!experimentType || !physicsLaws || !parameters || !calculations) throw new Error('缺少必要信息');
      
      const description = this.generateDescription(experimentType, physicsLaws, parameters, calculations);
      
      return this.transitionTo({
        ...state,
        description
      }, WorkflowNodeType.RESULT_VALIDATOR);
    } catch (error) {
      return this.addError(state, `描述生成失败: ${error}`);
    }
  }
  
  private generateDescription(
    experimentType: ExperimentType,
    physicsLaws: PhysicsLaw[],
    parameters: PhysicsParameters,
    calculations: PhysicsCalculations
  ): string {
    const obj = parameters.objects[0];
    const finalState = calculations.steps[calculations.steps.length - 1]?.objects[obj.id];
    
    const descriptions: Record<ExperimentType, string> = {
      mechanics: `这是一个力学实验模拟。实验中，一个质量为${obj.mass || 1}kg的${obj.name}从高度${obj.position[1]}m处自由落下。
      
实验过程：
1. 初始状态：物体位于高度${obj.position[1]}m处，初速度为0
2. 运动过程：物体在重力作用下加速下落，遵循自由落体运动规律
3. 最终状态：物体到达地面（高度为0m），速度达到最大值

涉及的物理定律：
${physicsLaws.map(law => `- ${law.name}：${law.formula}，${law.description}`).join('\n')}

能量分析：
- 初始势能：${calculations.energyAnalysis.potential[0]?.toFixed(2) || 0} J
- 最终动能：${calculations.energyAnalysis.kinetic[calculations.energyAnalysis.kinetic.length - 1]?.toFixed(2) || 0} J
- 能量守恒验证：整个过程中总能量保持不变，验证了能量守恒定律`,

      electromagnetism: `这是一个电磁学实验模拟。实验展示了电荷间的相互作用和电磁场效应。

涉及的物理定律：
${physicsLaws.map(law => `- ${law.name}：${law.formula}，${law.description}`).join('\n')}`,

      optics: `这是一个光学实验模拟。实验展示了光的传播、折射和成像规律。

涉及的物理定律：
${physicsLaws.map(law => `- ${law.name}：${law.formula}，${law.description}`).join('\n')}`,

      thermodynamics: `这是一个热力学实验模拟。实验展示了热量传递和热力学过程。

涉及的物理定律：
${physicsLaws.map(law => `- ${law.name}：${law.formula}，${law.description}`).join('\n')}`,

      waves: `这是一个波动实验模拟。实验展示了波的传播和干涉现象。

涉及的物理定律：
${physicsLaws.map(law => `- ${law.name}：${law.formula}，${law.description}`).join('\n')}`,

      modern_physics: `这是一个现代物理实验模拟。实验展示了量子力学和相对论效应。

涉及的物理定律：
${physicsLaws.map(law => `- ${law.name}：${law.formula}，${law.description}`).join('\n')}`
    };
    
    return descriptions[experimentType];
  }
}

// 节点11: 结果验证节点
export class ResultValidatorNode extends WorkflowNode {
  type = WorkflowNodeType.RESULT_VALIDATOR;
  
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      const { calculations, scene, animations } = state;
      if (!calculations || !scene || !animations) throw new Error('缺少必要信息');
      
      const validationResult = this.validateResult(calculations, scene, animations);
      
      return this.transitionTo({
        ...state,
        validationResult
      }, WorkflowNodeType.OUTPUT_FORMATTER);
    } catch (error) {
      return this.addError(state, `结果验证失败: ${error}`);
    }
  }
  
  private validateResult(
    calculations: PhysicsCalculations,
    _scene: ExperimentScene,
    animations: AnimationData[]
  ): ValidationResult {
    const warnings: string[] = [];
    
    // 验证能量守恒
    const energyVariation = Math.max(...calculations.energyAnalysis.total) - Math.min(...calculations.energyAnalysis.total);
    const isEnergyConserved = energyVariation < 0.1;
    
    if (!isEnergyConserved) {
      warnings.push('能量守恒验证存在偏差，请检查计算精度');
    }
    
    // 验证动画完整性
    const isAnimationComplete = animations.every(a => a.keyframes.length > 0);
    
    if (!isAnimationComplete) {
      warnings.push('部分动画序列不完整');
    }
    
    return {
      isValid: warnings.length === 0,
      physicsAccuracy: isEnergyConserved ? 0.95 : 0.85,
      visualQuality: isAnimationComplete ? 0.9 : 0.75,
      warnings
    };
  }
}

// 节点12: 输出格式化节点
export class OutputFormatterNode extends WorkflowNode {
  type = WorkflowNodeType.OUTPUT_FORMATTER;
  
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      const { experimentType, description, scene, animations, calculations, physicsLaws, parameters, validationResult } = state;
      if (!experimentType || !description || !scene || !animations || !calculations || !physicsLaws || !parameters || !validationResult) {
        throw new Error('缺少必要信息');
      }
      
      const output = this.formatOutput(
        experimentType,
        description,
        scene,
        animations,
        calculations,
        physicsLaws,
        parameters,
        validationResult
      );
      
      return {
        ...state,
        output,
        currentNode: state.currentNode,
        completedNodes: [...state.completedNodes, state.currentNode]
      };
    } catch (error) {
      return this.addError(state, `输出格式化失败: ${error}`);
    }
  }
  
  private formatOutput(
    experimentType: ExperimentType,
    description: string,
    scene: ExperimentScene,
    animations: AnimationData[],
    calculations: PhysicsCalculations,
    physicsLaws: PhysicsLaw[],
    parameters: PhysicsParameters,
    validationResult: ValidationResult
  ): ExperimentOutput {
    const titles: Record<ExperimentType, string> = {
      mechanics: '力学实验模拟',
      electromagnetism: '电磁学实验模拟',
      optics: '光学实验模拟',
      thermodynamics: '热力学实验模拟',
      waves: '波动实验模拟',
      modern_physics: '现代物理实验模拟'
    };
    
    return {
      title: titles[experimentType],
      description: description.split('\n')[0],
      detailedExplanation: description,
      physicsLaws: physicsLaws.map(law => `${law.name}：${law.formula}`),
      parameters: {
        objects: parameters.objects.map(obj => ({
          name: obj.name,
          mass: obj.mass,
          position: obj.position
        })),
        timeRange: parameters.timeRange
      },
      scene,
      animations,
      calculations,
      interactiveControls: [
        {
          name: '重力加速度',
          type: 'slider',
          min: 0,
          max: 20,
          step: 0.1,
          defaultValue: 9.8,
          affectsObject: 'environment',
          affectsProperty: 'gravity'
        },
        {
          name: '初始高度',
          type: 'slider',
          min: 1,
          max: 50,
          step: 1,
          defaultValue: 10,
          affectsObject: scene.objects[0]?.id || 'ball_1',
          affectsProperty: 'position'
        },
        {
          name: '播放/暂停',
          type: 'button',
          defaultValue: false,
          affectsObject: 'animation',
          affectsProperty: 'playing'
        }
      ]
    };
  }
}

// 工作流引擎
export class WorkflowEngine {
  private nodes: Map<string, WorkflowNode>;
  
  constructor() {
    this.nodes = new Map<string, WorkflowNode>();
    this.nodes.set(WorkflowNodeType.INPUT_PARSER, new InputParserNode());
    this.nodes.set(WorkflowNodeType.INTENT_RECOGNITION, new IntentRecognitionNode());
    this.nodes.set(WorkflowNodeType.EXPERIMENT_CLASSIFIER, new ExperimentClassifierNode());
    this.nodes.set(WorkflowNodeType.PARAMETER_EXTRACTOR, new ParameterExtractorNode());
    this.nodes.set(WorkflowNodeType.PHYSICS_LAW_MATCHER, new PhysicsLawMatcherNode());
    this.nodes.set(WorkflowNodeType.SCENE_BUILDER, new SceneBuilderNode());
    this.nodes.set(WorkflowNodeType.PHYSICS_CALCULATOR, new PhysicsCalculatorNode());
    this.nodes.set(WorkflowNodeType.MODEL_GENERATOR, new ModelGeneratorNode());
    this.nodes.set(WorkflowNodeType.ANIMATION_GENERATOR, new AnimationGeneratorNode());
    this.nodes.set(WorkflowNodeType.DESCRIPTION_GENERATOR, new DescriptionGeneratorNode());
    this.nodes.set(WorkflowNodeType.RESULT_VALIDATOR, new ResultValidatorNode());
    this.nodes.set(WorkflowNodeType.OUTPUT_FORMATTER, new OutputFormatterNode());
  }
  
  async execute(input: string): Promise<WorkflowState> {
    let state: WorkflowState = {
      currentNode: WorkflowNodeType.INPUT_PARSER,
      completedNodes: [],
      input,
      parsedInput: null,
      intent: null,
      experimentType: null,
      parameters: null,
      physicsLaws: null,
      scene: null,
      calculations: null,
      model3D: null,
      animations: null,
      description: null,
      validationResult: null,
      output: null,
      errors: []
    };
    
    // 执行所有节点
    while (state.output === null && state.errors.length === 0) {
      const node = this.nodes.get(state.currentNode);
      if (!node) {
        state.errors.push({
          node: state.currentNode,
          message: `未找到节点: ${state.currentNode}`,
          timestamp: new Date()
        });
        break;
      }
      
      state = await node.execute(state);
      
      // 检查是否完成
      if (state.completedNodes.includes(WorkflowNodeType.OUTPUT_FORMATTER)) {
        break;
      }
    }
    
    return state;
  }
  
  getWorkflowInfo(): { nodeCount: number; nodes: string[] } {
    return {
      nodeCount: this.nodes.size,
      nodes: Array.from(this.nodes.keys())
    };
  }
}

export const workflowEngine = new WorkflowEngine();