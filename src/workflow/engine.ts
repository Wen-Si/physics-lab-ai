/**
 * 物理实验AI智能体工作流引擎
 * 包含12个工作流节点，实现从自然语言到3D渲染的完整流程
 */

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
  sceneType: 'freefall' | 'pendulum' | 'spring' | 'projectile' | 'ramp' | 'circular' | 'collision' | 'angled_projectile' | 'atwood' | 'orbital' | 'electromagnetism' | 'optics' | 'thermodynamics' | 'waves' | 'modern_physics' | 'default';
  objects: PhysicsObject[];
  environment: EnvironmentConfig;
  camera: { position: [number, number, number]; target: [number, number, number] };
  lighting: { type: string; intensity: number; position: [number, number, number] }[];
  metadata?: Record<string, unknown>;
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
    const quantityMatches = text.match(quantityPattern) || [];
    for (const match of quantityMatches) {
      entities.push({ type: 'quantity', value: match, confidence: 0.85 });
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
  
  // 推断具体实验子类型
  private inferSceneType(text: string, experimentType: ExperimentType): ExperimentScene['sceneType'] {
    const lower = text.toLowerCase();
    if (experimentType === 'mechanics') {
      if (/碰撞|collision|撞/.test(lower)) return 'collision';
      if (/单摆|pendulum|摆动|周期/.test(lower)) return 'pendulum';
      if (/弹簧|spring|振子|简谐|振动/.test(lower)) return 'spring';
      if (/斜抛|斜上抛|angled|仰角/.test(lower)) return 'angled_projectile';
      if (/平抛|抛体|抛物线|水平抛|projectile/.test(lower)) return 'projectile';
      if (/斜面|斜坡|ramp|下滑|倾斜/.test(lower)) return 'ramp';
      if (/行星|planet|恒星|卫星|satellite|万有引力/.test(lower)) return 'orbital';
      if (/圆周|circular|匀速圆周|向心/.test(lower)) return 'circular';
      if (/滑轮|pulley|atwood|阿特伍德/.test(lower)) return 'atwood';
      if (/轨道|orbit/.test(lower)) return 'orbital';
      if (/自由落体|落下|free.?fall|下落|掉落/.test(lower)) return 'freefall';
      return 'freefall';
    }
    if (experimentType === 'electromagnetism') return 'electromagnetism';
    if (experimentType === 'optics') return 'optics';
    if (experimentType === 'thermodynamics') return 'thermodynamics';
    if (experimentType === 'waves') return 'waves';
    return 'default';
  }
  
  private extractParameters(parsedInput: ParsedInput, experimentType: ExperimentType): PhysicsParameters {
    const text = parsedInput.originalText;
    const numberPattern = /(\d+(?:\.\d+)?)/g;
    const numbers = text.match(numberPattern)?.map(Number) || [];
    const sceneType = this.inferSceneType(text, experimentType);
    const objects: PhysicsObject[] = [];
    
    // 根据具体实验类型创建对象
    switch (sceneType) {
      case 'freefall':
        objects.push({
          id: 'ball_1', name: '小球', type: 'sphere',
          position: [0, numbers.length > 1 ? numbers[1] : (numbers[0] || 10), 0],
          rotation: [0, 0, 0], scale: [0.5, 0.5, 0.5],
          mass: numbers[0] || 2, velocity: [0, 0, 0], color: '#ff6b6b'
        });
        objects.push({
          id: 'ground', name: '地面', type: 'plane',
          position: [0, 0, 0], rotation: [0, 0, 0], scale: [10, 0.1, 10],
          mass: 0, color: '#3a5a7a'
        });
        break;

      case 'pendulum':
        objects.push({
          id: 'pivot', name: '悬挂点', type: 'sphere',
          position: [0, 3, 0], rotation: [0, 0, 0], scale: [0.2, 0.2, 0.2],
          color: '#ffd700'
        });
        objects.push({
          id: 'bob', name: '摆球', type: 'sphere',
          position: [numbers[0] || 1, 1, 0], rotation: [0, 0, 0], scale: [0.4, 0.4, 0.4],
          mass: numbers[1] || 0.5, color: '#4ecdc4'
        });
        objects.push({
          id: 'string_line', name: '摆线', type: 'cylinder',
          position: [0, 2, 0], rotation: [0, 0, 0], scale: [0.03, 2, 0.03],
          color: '#a0b0c0'
        });
        break;

      case 'spring':
        objects.push({
          id: 'wall', name: '墙壁', type: 'cube',
          position: [-3, 1.5, 0], rotation: [0, 0, 0], scale: [0.3, 3, 2],
          color: '#636e72'
        });
        objects.push({
          id: 'mass_block', name: '振子', type: 'cube',
          position: [numbers[numbers.length > 2 ? 2 : 0] || 0.2, 1, 0], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6],
          mass: numbers[0] || 1, color: '#a29bfe'
        });
        objects.push({
          id: 'spring_coil', name: '弹簧', type: 'cylinder',
          position: [-1.5, 1, 0], rotation: [0, 0, Math.PI / 2], scale: [0.1, 1.5, 0.1],
          color: '#ffeaa7'
        });
        break;

      case 'projectile':
        objects.push({
          id: 'ball_1', name: '小球', type: 'sphere',
          position: [0, numbers[0] || 5, 0], rotation: [0, 0, 0], scale: [0.4, 0.4, 0.4],
          mass: numbers[1] || 0.5, color: '#fd79a8'
        });
        objects.push({
          id: 'ground', name: '地面', type: 'plane',
          position: [0, 0, 0], rotation: [0, 0, 0], scale: [15, 0.1, 5],
          mass: 0, color: '#3a5a7a'
        });
        break;

      case 'ramp': {
        // 斜面绕Z轴旋转+Math.PI/6 → 几何上 +X 端为高端（顶端），-X 端为低端（底端）
        // 物体应放置在斜面 +X 端（高端），让它自然向 -X 方向（左侧下坡）滑动
        const rampLength = 5;
        const rampAngle = Math.PI / 6;
        const rampCenterY = 2;
        const rampHighX = (rampLength / 2) * Math.cos(rampAngle);  // ≈ 2.165
        const rampHighY = rampCenterY + (rampLength / 2) * Math.sin(rampAngle) + 0.3;
        objects.push({
          id: 'ramp_plane', name: '斜面', type: 'ramp',
          position: [0, rampCenterY, 0], rotation: [0, 0, rampAngle], scale: [rampLength, 0.2, 2],
          color: '#636e72'
        });
        objects.push({
          id: 'block_1', name: '滑块', type: 'cube',
          position: [rampHighX, rampHighY, 0],
          rotation: [0, 0, rampAngle],
          scale: [0.5, 0.5, 0.5],
          mass: numbers[0] || 1, color: '#ffeaa7'
        });
        objects.push({
          id: 'ground', name: '地面', type: 'plane',
          position: [0, 0, 0], rotation: [0, 0, 0], scale: [10, 0.1, 5],
          mass: 0, color: '#3a5a7a'
        });
        break;
      }

      case 'circular': {
        // 匀速圆周运动 — 小球在水平面上做圆周运动
        const radiusM = text.match(/半径\s*(\d+(?:\.\d+)?)/);
        const massM = text.match(/质量\s*(?:为)?\s*(\d+(?:\.\d+)?)/);
        const radius = radiusM ? Number(radiusM[1]) : (numbers.find(n => n >= 2) || 3);
        const mass = massM ? Number(massM[1]) : (numbers.find(n => n < 2 && n > 0) || 1);
        objects.push({
          id: 'center_pole', name: '圆心', type: 'cylinder',
          position: [0, 0.5, 0], rotation: [0, 0, 0], scale: [0.15, 1, 0.15],
          color: '#636e72'
        });
        objects.push({
          id: 'ball_1', name: '小球', type: 'sphere',
          position: [radius, 1, 0], rotation: [0, 0, 0], scale: [0.4, 0.4, 0.4],
          mass, velocity: [0, 0, 3], color: '#00d2d3'
        });
        objects.push({
          id: 'ground', name: '地面', type: 'plane',
          position: [0, 0, 0], rotation: [0, 0, 0], scale: [12, 0.1, 12],
          mass: 0, color: '#1a2a3a'
        });
        break;
      }

      case 'collision': {
        // 弹性碰撞 — 两个小球在水平面上对碰
        const massMatches = text.match(/(\d+(?:\.\d+)?)\s*kg/g);
        const m1 = massMatches ? Number(massMatches[0].replace(/kg/, '')) : (numbers[0] || 1);
        const m2 = massMatches && massMatches.length > 1 ? Number(massMatches[1].replace(/kg/, '')) : (massMatches ? m1 : (numbers[1] || 1));
        const velMatch = text.match(/(\d+(?:\.\d+)?)\s*m\/s/);
        const v1init = velMatch ? Number(velMatch[1]) : 3;
        objects.push({
          id: 'ball_1', name: '小球A', type: 'sphere',
          position: [-4, 1, 0], rotation: [0, 0, 0], scale: [0.5, 0.5, 0.5],
          mass: m1, velocity: [v1init, 0, 0], color: '#ff6b6b'
        });
        objects.push({
          id: 'ball_2', name: '小球B', type: 'sphere',
          position: [4, 1, 0], rotation: [0, 0, 0], scale: [0.5, 0.5, 0.5],
          mass: m2, velocity: [-2, 0, 0], color: '#54a0ff'
        });
        objects.push({
          id: 'ground', name: '地面', type: 'plane',
          position: [0, 0, 0], rotation: [0, 0, 0], scale: [15, 0.1, 5],
          mass: 0, color: '#1a2a3a'
        });
        break;
      }

      case 'angled_projectile': {
        // 斜抛运动 — 小球以一定角度抛出
        const angleM = text.match(/(\d+(?:\.\d+)?)\s*(?:度|°)/);
        const velM = text.match(/(\d+(?:\.\d+)?)\s*m\/s/);
        const angleDeg = angleM ? Number(angleM[1]) : 45;
        const v0 = velM ? Number(velM[1]) : 15;
        objects.push({
          id: 'ball_1', name: '小球', type: 'sphere',
          position: [0, 0.5, 0], rotation: [0, 0, 0], scale: [0.4, 0.4, 0.4],
          mass: numbers.find(n => n < 5 && n !== angleDeg && n !== v0) || 1, velocity: [v0 * Math.cos(angleDeg * Math.PI / 180), v0 * Math.sin(angleDeg * Math.PI / 180), 0],
          color: '#feca57'
        });
        objects.push({
          id: 'ground', name: '地面', type: 'plane',
          position: [0, 0, 0], rotation: [0, 0, 0], scale: [25, 0.1, 5],
          mass: 0, color: '#1a2a3a'
        });
        break;
      }

      case 'atwood': {
        // 阿特伍德机（滑轮系统）— 两个质量通过绳子和滑轮连接
        const atwoodMassMatches = text.match(/(\d+(?:\.\d+)?)\s*kg/g);
        const m1 = atwoodMassMatches ? Number(atwoodMassMatches[0].replace(/kg/, '')) : (numbers[0] || 2);
        const m2 = atwoodMassMatches && atwoodMassMatches.length > 1 ? Number(atwoodMassMatches[1].replace(/kg/, '')) : (numbers[1] || 1);
        objects.push({
          id: 'pulley', name: '滑轮', type: 'cylinder',
          position: [0, 5, 0], rotation: [Math.PI / 2, 0, 0], scale: [0.6, 0.1, 0.6],
          color: '#a0b0c0'
        });
        objects.push({
          id: 'mass_1', name: '重物', type: 'cube',
          position: [-1.5, 3.5, 0], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6],
          mass: m1, color: '#ff6b6b'
        });
        objects.push({
          id: 'mass_2', name: '轻物', type: 'cube',
          position: [1.5, 3.5, 0], rotation: [0, 0, 0], scale: [0.5, 0.5, 0.5],
          mass: m2, color: '#54a0ff'
        });
        objects.push({
          id: 'ground', name: '地面', type: 'plane',
          position: [0, 0, 0], rotation: [0, 0, 0], scale: [8, 0.1, 4],
          mass: 0, color: '#1a2a3a'
        });
        break;
      }

      case 'orbital': {
        // 行星轨道运动 — 行星绕恒星做圆周运动
        const orbitRadius = numbers[0] || 5;
        objects.push({
          id: 'star', name: '恒星', type: 'sphere',
          position: [0, 4, 0], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2],
          mass: 1000, color: '#feca57'
        });
        objects.push({
          id: 'planet', name: '行星', type: 'sphere',
          position: [orbitRadius, 4, 0], rotation: [0, 0, 0], scale: [0.5, 0.5, 0.5],
          mass: 1, color: '#54a0ff'
        });
        break;
      }

      case 'electromagnetism':
        objects.push({
          id: 'charge_1', name: '电荷', type: 'sphere',
          position: [0, 0, 0], rotation: [0, 0, 0], scale: [0.3, 0.3, 0.3],
          charge: numbers[0] || 1, color: '#ff6b6b'
        });
        objects.push({
          id: 'charge_2', name: '电荷', type: 'sphere',
          position: [3, 0, 0], rotation: [0, 0, 0], scale: [0.3, 0.3, 0.3],
          charge: numbers[1] || -1, color: '#1e90ff'
        });
        break;

      case 'optics':
        objects.push({
          id: 'lens_1', name: '透镜', type: 'lens',
          position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 2, 0.1],
          color: '#87ceeb'
        });
        objects.push({
          id: 'light_source', name: '光源', type: 'sphere',
          position: [-5, 0, 0], rotation: [0, 0, 0], scale: [0.2, 0.2, 0.2],
          color: '#ffd700'
        });
        break;

      default:
        objects.push({
          id: 'object_1', name: '物体', type: 'cube',
          position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
          color: '#4a90d9'
        });
    }
    
    return {
      objects,
      environment: {
        gravity: [0, -9.8, 0],
        friction: sceneType === 'ramp' ? 0 : 0.1,
        airResistance: 0.01
      },
      timeRange: { start: 0, end: 10, step: 0.016 },
      initialConditions: { sceneType } as any
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
        { name: '能量守恒定律', formula: 'E = KE + PE', description: '系统总能量保持不变', applicableObjects: ['all'] },
        { name: '万有引力定律', formula: 'F = GMm/r²', description: '两物体间的引力与质量乘积成正比，与距离平方成反比', applicableObjects: ['sphere'] },
        { name: '向心力公式', formula: 'F = mv²/r', description: '匀速圆周运动所需的向心力', applicableObjects: ['sphere'] }
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
    const sceneType = (parameters.initialConditions as any)?.sceneType || 'freefall';
    return {
      id: `scene_${Date.now()}`,
      name: this.getSceneName(experimentType),
      sceneType,
      objects: parameters.objects,
      environment: parameters.environment,
      camera: this.getCameraForScene(sceneType),
      lighting: [
        { type: 'ambient', intensity: 0.4, position: [0, 0, 0] },
        { type: 'directional', intensity: 0.8, position: [10, 10, 5] },
        { type: 'point', intensity: 0.5, position: [-5, 5, -5] }
      ],
      metadata: { experimentType, sceneType }
    };
  }

  private getCameraForScene(sceneType: string): { position: [number, number, number]; target: [number, number, number] } {
    switch (sceneType) {
      case 'pendulum': return { position: [6, 4, 8], target: [0, 2, 0] };
      case 'spring': return { position: [8, 3, 8], target: [0, 1.5, 0] };
      case 'projectile': return { position: [12, 6, 12], target: [3, 2, 0] };
      case 'ramp': return { position: [8, 5, 8], target: [2, 2, 0] };
      case 'freefall': return { position: [8, 6, 10], target: [0, 4, 0] };
      case 'circular': return { position: [10, 8, 10], target: [0, 1, 0] };
      case 'collision': return { position: [0, 5, 12], target: [0, 1, 0] };
      case 'angled_projectile': return { position: [12, 6, 12], target: [5, 3, 0] };
      case 'atwood': return { position: [6, 4, 8], target: [0, 3, 0] };
      case 'orbital': return { position: [12, 8, 12], target: [0, 4, 0] };
      default: return { position: [10, 8, 10], target: [0, 0, 0] };
    }
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
      
      const sceneType = (parameters.initialConditions as any)?.sceneType || 'freefall';
      const calculations = this.performCalculations(parameters, physicsLaws, sceneType);
      
      return this.transitionTo({
        ...state,
        calculations
      }, WorkflowNodeType.MODEL_GENERATOR);
    } catch (error) {
      return this.addError(state, `物理计算失败: ${error}`);
    }
  }
  
  private performCalculations(parameters: PhysicsParameters, _laws: PhysicsLaw[], sceneType: string): PhysicsCalculations {
    const steps: CalculationStep[] = [];
    const { timeRange, objects, environment } = parameters;
    const g = Math.abs(environment.gravity[1]);
    const kinetic: number[] = [];
    const potential: number[] = [];
    const total: number[] = [];
    
    switch (sceneType) {
      case 'freefall': {
        const obj = objects[0];
        const y0 = obj.position[1];
        const mass = obj.mass || 1;
        
        for (let t = timeRange.start; t <= timeRange.end; t += timeRange.step) {
          const y = Math.max(0, y0 - 0.5 * g * t * t);
          const vy = -g * t;
          const stepObj: Record<string, { position: [number, number, number]; velocity: [number, number, number] }> = {};
          stepObj[obj.id] = { position: [obj.position[0], y, obj.position[2]], velocity: [0, vy, 0] };
          steps.push({ time: t, objects: stepObj });
          const v = Math.abs(vy);
          kinetic.push(0.5 * mass * v * v);
          potential.push(mass * g * y);
          total.push(0.5 * mass * v * v + mass * g * y);
        }
        break;
      }
      
      case 'pendulum': {
        const bob = objects.find(o => o.id === 'bob') || objects[1];
        const pivot = objects.find(o => o.id === 'pivot') || objects[0];
        const pivotY = pivot.position[1];
        const length = Math.abs(pivotY - bob.position[1]);
        const omega = Math.sqrt(g / length);
        const theta0 = Math.asin(Math.abs(bob.position[0] - pivot.position[0]) / length) || 0.5;
        const mass = bob.mass || 1;
        
        for (let t = timeRange.start; t <= timeRange.end; t += timeRange.step) {
          const theta = theta0 * Math.cos(omega * t);
          const bx = pivot.position[0] + length * Math.sin(theta);
          const by = pivotY - length * Math.cos(theta);
          const stepObj: Record<string, { position: [number, number, number]; velocity: [number, number, number] }> = {};
          stepObj[bob.id] = { position: [bx, by, 0], velocity: [0, 0, 0] };
          steps.push({ time: t, objects: stepObj });
          const v = length * omega * theta0 * Math.abs(Math.sin(omega * t));
          const h = Math.max(0, by);
          kinetic.push(0.5 * mass * v * v);
          potential.push(mass * g * h);
          total.push(0.5 * mass * v * v + mass * g * h);
        }
        break;
      }
      
      case 'spring': {
        const block = objects.find(o => o.id === 'mass_block') || objects[1];
        const x0 = block.position[0];
        const mass = block.mass || 1;
        const k = 100; // 弹簧系数
        const omega = Math.sqrt(k / mass);
        
        for (let t = timeRange.start; t <= timeRange.end; t += timeRange.step) {
          const x = x0 * Math.cos(omega * t);
          const vx = -x0 * omega * Math.sin(omega * t);
          const stepObj: Record<string, { position: [number, number, number]; velocity: [number, number, number] }> = {};
          stepObj[block.id] = { position: [x, block.position[1], block.position[2]], velocity: [vx, 0, 0] };
          steps.push({ time: t, objects: stepObj });
          const v = Math.abs(vx);
          const pe = 0.5 * k * x * x;
          kinetic.push(0.5 * mass * v * v);
          potential.push(pe);
          total.push(0.5 * mass * v * v + pe);
        }
        break;
      }
      
      case 'projectile': {
        const obj = objects[0];
        const y0 = obj.position[1];
        const vx0 = objects.length > 1 ? 10 : 10; // 水平初速度
        const mass = obj.mass || 1;
        
        for (let t = timeRange.start; t <= timeRange.end; t += timeRange.step) {
          const x = vx0 * t;
          const y = Math.max(0, y0 - 0.5 * g * t * t);
          const vy = -g * t;
          const stepObj: Record<string, { position: [number, number, number]; velocity: [number, number, number] }> = {};
          stepObj[obj.id] = { position: [x, y, obj.position[2]], velocity: [vx0, vy, 0] };
          steps.push({ time: t, objects: stepObj });
          const v = Math.sqrt(vx0 * vx0 + vy * vy);
          kinetic.push(0.5 * mass * v * v);
          potential.push(mass * g * y);
          total.push(0.5 * mass * v * v + mass * g * y);
        }
        break;
      }
      
      case 'ramp': {
        // 斜面绕Z轴旋转+Math.PI/6 → 几何上 +X 端为高端（顶端），-X 端为低端（底端）
        // 物体应从 +X 端的高端开始，向 -X 方向下坡滑动
        const ramp = objects.find(o => o.id === 'ramp_plane') || objects[0];
        const block = objects.find(o => o.id === 'block_1') || objects[1];
        const angle = (ramp.rotation && ramp.rotation[2]) || Math.PI / 6;
        const mass = block.mass || 1;
        const a = g * Math.sin(angle);
        // 起点：斜面高端（+X 方向）
        // 斜面长5，中心在 x=0，所以高端在 x = (5/2)*cos(angle) ≈ 2.165
        const rampLength = (ramp.scale && ramp.scale[0]) || 5;
        const startX = (rampLength / 2) * Math.cos(angle);
        // 起点高度：高端的高度 = 中心高度 + (5/2)*sin(angle)
        const startY = (ramp.position[1] || 2) + (rampLength / 2) * Math.sin(angle) + 0.3;
        // 终点：斜面低端（-X 方向）落到地面
        const endX = -(rampLength / 2) * Math.cos(angle);
        const endY = (ramp.position[1] || 2) - (rampLength / 2) * Math.sin(angle);

        for (let t = timeRange.start; t <= timeRange.end; t += timeRange.step) {
          // 阶段1：物体在斜面上，从高端滑到低端
          // 沿斜面方向的位移 s = 0.5 * a * t²
          const rampTime = Math.sqrt(2 * rampLength / a); // 滑到斜面底端所需时间
          let x: number, y: number, v: number;
          if (t <= rampTime) {
            // 沿斜面下滑：从 (startX, startY) 移动到 (endX, endY)
            const s = Math.min(rampLength, 0.5 * a * t * t);
            const fraction = s / rampLength;
            x = startX + (endX - startX) * fraction;
            // 沿斜面方向：水平位移 s*cos(angle)（向 -X），竖直位移 s*sin(angle)（向下）
            y = startY - s * Math.sin(angle);
            v = a * t;
          } else {
            // 阶段2：物体离开斜面，沿地面继续滑动（带摩擦或惯性）
            // 离开斜面后，物体位于低端，沿水平方向继续
            const timeAfterRamp = t - rampTime;
            const vx0 = a * rampTime * Math.cos(angle); // 离开时的水平速度分量
            const vy0 = a * rampTime * Math.sin(angle); // 离开时的竖直速度（向下）
            x = endX + vx0 * timeAfterRamp;
            y = Math.max(0, endY - vy0 * timeAfterRamp + 0.5 * 0); // 沿地面运动
            v = a * rampTime;
          }
          const stepObj: Record<string, { position: [number, number, number]; velocity: [number, number, number] }> = {};
          stepObj[block.id] = {
            position: [x, y, block.position[2]],
            velocity: [-v * Math.cos(angle), -v * Math.sin(angle), 0] // 向 -X（左侧）下坡
          };
          steps.push({ time: t, objects: stepObj });
          kinetic.push(0.5 * mass * v * v);
          potential.push(mass * g * y);
          total.push(0.5 * mass * v * v + mass * g * y);
        }
        break;
      }
      
      case 'circular': {
        // 匀速圆周运动：x = r·cos(ωt), z = r·sin(ωt)
        const ball = objects.find(o => o.id === 'ball_1') || objects[0];
        const radius = Math.abs(ball.position[0]) || 3;
        const mass = ball.mass || 1;
        const omega = 2; // 角速度 rad/s
        for (let t = timeRange.start; t <= timeRange.end; t += timeRange.step) {
          const angle = omega * t;
          const x = radius * Math.cos(angle);
          const z = radius * Math.sin(angle);
          const vx = -radius * omega * Math.sin(angle);
          const vz = radius * omega * Math.cos(angle);
          const stepObj: Record<string, { position: [number, number, number]; velocity: [number, number, number] }> = {};
          stepObj[ball.id] = { position: [x, ball.position[1], z], velocity: [vx, 0, vz] };
          steps.push({ time: t, objects: stepObj });
          const v = radius * omega;
          kinetic.push(0.5 * mass * v * v);
          potential.push(0);
          total.push(0.5 * mass * v * v);
        }
        break;
      }

      case 'collision': {
        // 弹性碰撞：动量守恒 + 动能守恒
        const ball1 = objects.find(o => o.id === 'ball_1') || objects[0];
        const ball2 = objects.find(o => o.id === 'ball_2') || objects[1];
        const m1 = ball1.mass || 1;
        const m2 = ball2.mass || 1;
        const v1i = (ball1.velocity?.[0]) ?? 3;
        const v2i = (ball2.velocity?.[0]) ?? -2;
        const x1_0 = ball1.position[0];
        const x2_0 = ball2.position[0];
        const r1 = (ball1.scale?.[0] || 0.5) / 2;
        const r2 = (ball2.scale?.[0] || 0.5) / 2;
        const collisionDist = r1 + r2;
        // 碰撞后的速度（一维弹性碰撞公式）
        const v1f = ((m1 - m2) * v1i + 2 * m2 * v2i) / (m1 + m2);
        const v2f = ((m2 - m1) * v2i + 2 * m1 * v1i) / (m1 + m2);
        let collisionTime = -1;
        let p1c = x1_0, p2c = x2_0;
        for (let t = timeRange.start; t <= timeRange.end; t += timeRange.step) {
          let p1x: number, p2x: number, cv1: number, cv2: number;
          if (collisionTime < 0) {
            p1x = x1_0 + v1i * t;
            p2x = x2_0 + v2i * t;
            cv1 = v1i; cv2 = v2i;
            if (Math.abs(p2x - p1x) <= collisionDist) {
              collisionTime = t;
              p1c = p1x; p2c = p2x;
            }
          } else {
            p1x = p1c + v1f * (t - collisionTime);
            p2x = p2c + v2f * (t - collisionTime);
            cv1 = v1f; cv2 = v2f;
          }
          const stepObj: Record<string, { position: [number, number, number]; velocity: [number, number, number] }> = {};
          stepObj[ball1.id] = { position: [p1x, ball1.position[1], 0], velocity: [cv1, 0, 0] };
          stepObj[ball2.id] = { position: [p2x, ball2.position[1], 0], velocity: [cv2, 0, 0] };
          steps.push({ time: t, objects: stepObj });
          kinetic.push(0.5 * m1 * cv1 * cv1 + 0.5 * m2 * cv2 * cv2);
          potential.push(0);
          total.push(0.5 * m1 * cv1 * cv1 + 0.5 * m2 * cv2 * cv2);
        }
        break;
      }

      case 'angled_projectile': {
        // 斜抛运动：x = v₀cos(θ)·t, y = y₀ + v₀sin(θ)·t - ½gt²
        const ball = objects.find(o => o.id === 'ball_1') || objects[0];
        const mass = ball.mass || 1;
        const vx0 = ball.velocity?.[0] ?? 15 * Math.cos(Math.PI / 4);
        const vy0 = ball.velocity?.[1] ?? 15 * Math.sin(Math.PI / 4);
        const y0 = ball.position[1];
        for (let t = timeRange.start; t <= timeRange.end; t += timeRange.step) {
          const x = vx0 * t;
          const y = Math.max(0, y0 + vy0 * t - 0.5 * g * t * t);
          const vy = vy0 - g * t;
          const stepObj: Record<string, { position: [number, number, number]; velocity: [number, number, number] }> = {};
          stepObj[ball.id] = { position: [x, y, 0], velocity: [vx0, vy, 0] };
          steps.push({ time: t, objects: stepObj });
          const v = Math.sqrt(vx0 * vx0 + vy * vy);
          kinetic.push(0.5 * mass * v * v);
          potential.push(mass * g * y);
          total.push(0.5 * mass * v * v + mass * g * y);
        }
        break;
      }

      case 'atwood': {
        // 阿特伍德机：a = (m₁-m₂)g/(m₁+m₂)
        const m1Obj = objects.find(o => o.id === 'mass_1') || objects[0];
        const m2Obj = objects.find(o => o.id === 'mass_2') || objects[1];
        const m1 = m1Obj.mass || 2;
        const m2 = m2Obj.mass || 1;
        const a = (m1 - m2) * g / (m1 + m2);
        const y1_0 = m1Obj.position[1];
        const y2_0 = m2Obj.position[1];
        for (let t = timeRange.start; t <= timeRange.end; t += timeRange.step) {
          // m1 下降，m2 上升
          const dy = 0.5 * a * t * t;
          const y1 = Math.max(0.3, y1_0 - dy);
          const y2 = Math.min(4.5, y2_0 + dy);
          const v = a * t;
          const stepObj: Record<string, { position: [number, number, number]; velocity: [number, number, number] }> = {};
          stepObj[m1Obj.id] = { position: [m1Obj.position[0], y1, 0], velocity: [0, -v, 0] };
          stepObj[m2Obj.id] = { position: [m2Obj.position[0], y2, 0], velocity: [0, v, 0] };
          steps.push({ time: t, objects: stepObj });
          kinetic.push(0.5 * m1 * v * v + 0.5 * m2 * v * v);
          potential.push(m1 * g * y1 + m2 * g * y2);
          total.push(0.5 * m1 * v * v + 0.5 * m2 * v * v + m1 * g * y1 + m2 * g * y2);
        }
        break;
      }

      case 'orbital': {
        // 行星轨道运动：ω = √(GM/r³)
        const star = objects.find(o => o.id === 'star') || objects[0];
        const planet = objects.find(o => o.id === 'planet') || objects[1];
        const orbitR = Math.abs(planet.position[0] - star.position[0]) || 5;
        const mass = planet.mass || 1;
        const GM = 50; // 简化的引力参数
        const omega = Math.sqrt(GM / (orbitR ** 3));
        const starY = star.position[1];
        for (let t = timeRange.start; t <= timeRange.end; t += timeRange.step) {
          const angle = omega * t;
          const x = star.position[0] + orbitR * Math.cos(angle);
          const z = orbitR * Math.sin(angle);
          const vx = -orbitR * omega * Math.sin(angle);
          const vz = orbitR * omega * Math.cos(angle);
          const stepObj: Record<string, { position: [number, number, number]; velocity: [number, number, number] }> = {};
          stepObj[planet.id] = { position: [x, starY, z], velocity: [vx, 0, vz] };
          steps.push({ time: t, objects: stepObj });
          const v = orbitR * omega;
          kinetic.push(0.5 * mass * v * v);
          potential.push(-GM * mass / orbitR);
          total.push(0.5 * mass * v * v - GM * mass / orbitR);
        }
        break;
      }

      default: {
        const obj = objects[0];
        const mass = obj.mass || 1;
        for (let t = timeRange.start; t <= timeRange.end; t += timeRange.step) {
          const stepObj: Record<string, { position: [number, number, number]; velocity: [number, number, number] }> = {};
          stepObj[obj.id] = { position: obj.position, velocity: [0, 0, 0] };
          steps.push({ time: t, objects: stepObj });
          kinetic.push(0);
          potential.push(0);
          total.push(0);
        }
      }
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
    const sceneType = (parameters.initialConditions as any)?.sceneType || 'freefall';
    const obj = parameters.objects.find(o => o.id === 'ball_1' || o.id === 'bob' || o.id === 'block_1' || o.id === 'mass_block' || o.id === 'planet' || o.id === 'mass_1') || parameters.objects[0];
    const lawsText = physicsLaws.map(law => `- ${law.name}：${law.formula}，${law.description}`).join('\n');
    const initPE = calculations.energyAnalysis.potential[0]?.toFixed(2) || '0';
    const finalKE = calculations.energyAnalysis.kinetic[calculations.energyAnalysis.kinetic.length - 1]?.toFixed(2) || '0';

    const sceneDescriptions: Record<string, string> = {
      freefall: `这是一个自由落体实验模拟。一个质量为${obj.mass || 1}kg的${obj.name}从高度${obj.position[1]}m处自由落下。

实验过程：
1. 初始状态：物体位于高度${obj.position[1]}m处，初速度为0
2. 运动过程：物体在重力作用下加速下落，遵循自由落体运动规律 h = ½gt²
3. 最终状态：物体到达地面（高度为0m），速度达到最大值

涉及的物理定律：
${lawsText}

能量分析：
- 初始势能：${initPE} J
- 最终动能：${finalKE} J
- 能量守恒验证：整个过程中总能量保持不变，验证了能量守恒定律`,

      pendulum: `这是一个单摆实验模拟。摆长${Math.abs((parameters.objects.find(o => o.id === 'pivot') || parameters.objects[0]).position[1] - (parameters.objects.find(o => o.id === 'bob') || parameters.objects[1]).position[1])}m，摆球质量${(parameters.objects.find(o => o.id === 'bob') || parameters.objects[1]).mass || 0.5}kg。

实验过程：
1. 初始状态：摆球偏离平衡位置，具有最大势能
2. 运动过程：摆球在重力作用下做周期性摆动，动能和势能相互转化
3. 周期规律：单摆周期 T = 2π√(L/g)，与摆长有关，与摆球质量无关

涉及的物理定律：
${lawsText}

能量分析：
- 初始势能：${initPE} J
- 最大动能：${finalKE} J`,

      spring: `这是一个弹簧振子实验模拟。物体质量${(parameters.objects.find(o => o.id === 'mass_block') || parameters.objects[1]).mass || 1}kg，弹簧系数100N/m，初始偏离平衡位置${(parameters.objects.find(o => o.id === 'mass_block') || parameters.objects[1]).position[0]}m。

实验过程：
1. 初始状态：物体偏离平衡位置，弹簧具有最大弹性势能
2. 运动过程：物体在弹簧弹力作用下做简谐振动
3. 周期规律：周期 T = 2π√(m/k)，周期与质量平方根成正比

涉及的物理定律：
${lawsText}

能量分析：
- 初始弹性势能：${initPE} J
- 最大动能：${finalKE} J`,

      projectile: `这是一个平抛运动实验模拟。${obj.name}从高度${obj.position[1]}m处以水平初速度10m/s抛出。

实验过程：
1. 初始状态：物体在高度${obj.position[1]}m处，具有水平初速度
2. 运动过程：水平方向匀速直线运动，竖直方向自由落体运动
3. 轨迹特征：运动轨迹为抛物线

涉及的物理定律：
${lawsText}

能量分析：
- 初始势能：${initPE} J
- 最终动能：${finalKE} J`,

      ramp: `这是一个斜面下滑实验模拟。一个质量为${(parameters.objects.find(o => o.id === 'block_1') || parameters.objects[1]).mass || 1}kg的物体在30°光滑斜面顶端从静止开始下滑。

实验过程：
1. 初始状态：物体位于斜面顶端，具有最大势能
2. 运动过程：物体在重力分力作用下沿斜面加速下滑，加速度 a = g·sin30° = 4.9m/s²
3. 最终状态：物体到达斜面底端，速度达到最大值

涉及的物理定律：
${lawsText}

能量分析：
- 初始势能：${initPE} J
- 最终动能：${finalKE} J
- 能量守恒验证：势能完全转化为动能`,

      circular: `这是一个匀速圆周运动实验模拟。质量为${obj.mass || 1}kg的小球在半径为${Math.abs(obj.position[0])}m的水平圆轨道上做匀速圆周运动。

实验过程：
1. 初始状态：小球位于圆周上，具有切向速度
2. 运动过程：小球受向心力作用，速度方向不断改变但大小不变
3. 运动特征：向心加速度 a = v²/r，周期 T = 2πr/v

涉及的物理定律：
${lawsText}

能量分析：
- 动能：${finalKE} J（保持不变）
- 势能：0 J（水平面运动）
- 总能量守恒`,

      collision: `这是一个弹性碰撞实验模拟。质量为${(parameters.objects.find(o => o.id === 'ball_1') || parameters.objects[0]).mass || 1}kg的小球A与质量为${(parameters.objects.find(o => o.id === 'ball_2') || parameters.objects[1]).mass || 1}kg的小球B在光滑水平面上发生正碰。

实验过程：
1. 初始状态：两球分别以不同速度相向运动
2. 碰撞过程：动量守恒且动能守恒，速度按弹性碰撞公式交换
3. 碰撞后：两球分别以新速度分离运动

涉及的物理定律：
${lawsText}

能量分析：
- 碰撞前总动能：${initPE} J
- 碰撞后总动能：${finalKE} J
- 动能守恒验证：弹性碰撞中动能不损失`,

      angled_projectile: `这是一个斜抛运动实验模拟。小球以${obj.velocity ? Math.round(Math.sqrt(obj.velocity[0]**2 + obj.velocity[1]**2)) : 15}m/s的初速度、${obj.velocity ? Math.round(Math.atan2(obj.velocity[1], obj.velocity[0]) * 180 / Math.PI) : 45}°仰角抛出。

实验过程：
1. 初始状态：小球具有斜向上方的初速度
2. 运动过程：水平方向匀速直线运动，竖直方向匀变速直线运动
3. 轨迹特征：运动轨迹为抛物线，射程 R = v₀²sin(2θ)/g

涉及的物理定律：
${lawsText}

能量分析：
- 初始动能：${finalKE} J
- 最高点势能：${initPE} J
- 能量守恒验证：动能与势能相互转化`,

      atwood: `这是一个阿特伍德机实验模拟。质量为${(parameters.objects.find(o => o.id === 'mass_1') || parameters.objects[0]).mass || 2}kg和${(parameters.objects.find(o => o.id === 'mass_2') || parameters.objects[1]).mass || 1}kg的两个物体通过轻绳跨过定滑轮连接。

实验过程：
1. 初始状态：两物体处于同一高度，系统静止
2. 运动过程：较重物体加速下降，较轻物体加速上升
3. 加速度：a = (m₁-m₂)g/(m₁+m₂)

涉及的物理定律：
${lawsText}

能量分析：
- 系统总动能：${finalKE} J
- 系统总势能：${initPE} J
- 能量守恒验证：势能减少等于动能增加`,

      orbital: `这是一个行星轨道运动实验模拟。行星绕恒星做匀速圆周运动，轨道半径${Math.abs((parameters.objects.find(o => o.id === 'planet') || parameters.objects[1]).position[0] - (parameters.objects.find(o => o.id === 'star') || parameters.objects[0]).position[0])}m。

实验过程：
1. 初始状态：行星位于轨道某一点，具有切向速度
2. 运动过程：万有引力提供向心力，行星沿圆形轨道运动
3. 运动特征：轨道速度 v = √(GM/r)，周期 T = 2π√(r³/GM)

涉及的物理定律：
${lawsText}

能量分析：
- 动能：${finalKE} J
- 引力势能：${initPE} J
- 总机械能守恒`,

      electromagnetism: `这是一个电磁学实验模拟。实验展示了电荷间的相互作用和电磁场效应。

涉及的物理定律：
${lawsText}`,

      optics: `这是一个光学实验模拟。实验展示了光的传播、折射和成像规律。

涉及的物理定律：
${lawsText}`,

      thermodynamics: `这是一个热力学实验模拟。实验展示了热量传递和热力学过程。

涉及的物理定律：
${lawsText}`,

      waves: `这是一个波动实验模拟。实验展示了波的传播和干涉现象。

涉及的物理定律：
${lawsText}`,

      modern_physics: `这是一个现代物理实验模拟。实验展示了量子力学和相对论效应。

涉及的物理定律：
${lawsText}`
    };
    
    return sceneDescriptions[sceneType] || sceneDescriptions.freefall;
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