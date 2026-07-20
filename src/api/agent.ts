/**
 * Spring AI 智能体后端 API 客户端
 *
 * 后端运行于 http://localhost:8080，提供：
 *   - POST /api/experiment/generate  (SSE 流式响应)
 *   - GET  /api/experiment/health    (健康检查)
 *
 * 该模块负责将后端的 SSE 事件流解析为 React 可消费的回调，
 * 用于在 12 节点工作流面板上实时显示智能体的执行进度，
 * 以及 ReAct (Reason-Act) 推理过程的每一步。
 */

/** 智能体执行产出的结构化结果 */
export interface AgentResult {
  /** 实验类型，如 mechanics / electromagnetism ... */
  experimentType: string;
  /** 场景类型，如 freefall / pendulum / ramp ... */
  sceneType: string;
  /** 实验的自然语言描述 */
  description: string;
  /** 命中的物理定律名称列表 */
  physicsLaws: string[];
  /** AI 提取出的物理参数，会注入到本地工作流引擎 */
  aiParams: Record<string, any>;
  /** 经过 AI 增强后的用户输入文本（包含参数提示） */
  augmentedInput: string;
  /** 混元生3D API 生成的3D模型信息 */
  hunyuan3DModel?: Hunyuan3DModelInfo;
}

/** 混元生3D 模型文件信息 */
export interface Hunyuan3DModelFile {
  type: string;
  url: string;
  previewImageUrl?: string;
}

/** 混元生3D 生成结果 */
export interface Hunyuan3DModelInfo {
  jobId: string;
  status: string;
  prompt: string;
  modelFiles: Hunyuan3DModelFile[];
  error?: string;
}

/**
 * ReAct (Reason-Act) 推理过程中的单个步骤。
 * 后端通过 SSE `react_step` 事件推送，前端按 nodeIndex 分组显示。
 */
export interface ReActStep {
  /** 所属节点序号（0-11） */
  nodeIndex: number;
  /** 步骤类型: thought(推理) / action(行动) / observation(观察) / final_answer(最终答案) */
  stepType: 'thought' | 'action' | 'observation' | 'final_answer';
  /** 步骤内容文本 */
  content: string;
  /** 步骤序号（1-based，在当前节点内递增） */
  stepNumber: number;
}

/** 后端 SSE 事件的基础结构 */
interface AgentEvent {
  type: 'node_start' | 'node_complete' | 'ai_thinking' | 'react_step' | 'complete' | 'error';
  nodeIndex?: number;
  nodeName?: string;
  description?: string;
  message?: string;
  result?: string;
  output?: AgentResult;
  /** react_step 事件: 步骤类型 */
  reactStepType?: string;
  /** react_step 事件: 步骤内容 */
  reactStepContent?: string;
  /** react_step 事件: 步骤序号 */
  reactStepNumber?: number;
}

/**
 * 后端服务地址。
 * 开发环境通过 Next.js rewrites 代理到 http://localhost:8080，
 * 生产环境（GitHub Pages）健康检查会失败，自动回退到本地模式。
 */
// 使用 Next.js API Route 代理 (src/app/api/experiment/*/route.ts) 访问后端。
// API Route 在服务端运行, 可以直接访问 http://localhost:8080, 并通过 ReadableStream
// 逐块转发 SSE 事件, 避免 Next.js rewrite 代理的缓冲问题。
// 生产环境 (output: 'export') 不打包 API Route, 健康检查失败后自动回退到本地模式。
const BASE_PATH = '/physics-lab-ai';
// trailingSlash: true 会将无尾斜杠 URL 重定向, POST + SSE 在重定向时会丢失流式响应,
// 因此 API URL 必须显式带上尾斜杠。
const GENERATE_URL = `${BASE_PATH}/api/experiment/generate/`;
const HEALTH_URL = `${BASE_PATH}/api/experiment/health/`;

/** 默认请求超时时间（毫秒） */
const DEFAULT_TIMEOUT_MS = 360_000;

/**
 * 12 个工作流节点定义。
 * 与后端 Spring AI 工作流的节点一一对应，用于前端实时渲染执行进度。
 */
export const WORKFLOW_NODES = [
  { index: 0, type: 'input_parser', name: '输入解析', description: '解析用户自然语言输入' },
  { index: 1, type: 'intent_recognition', name: '意图识别', description: '识别用户意图' },
  { index: 2, type: 'experiment_classifier', name: '实验分类', description: '分类实验类型' },
  { index: 3, type: 'parameter_extractor', name: '参数提取', description: '提取物理参数' },
  { index: 4, type: 'physics_law_matcher', name: '定律匹配', description: '匹配物理定律' },
  { index: 5, type: 'scene_builder', name: '场景构建', description: '构建实验场景' },
  { index: 6, type: 'physics_calculator', name: '物理计算', description: '执行物理计算' },
  { index: 7, type: 'model_generator', name: '模型生成', description: '生成3D模型' },
  { index: 8, type: 'animation_generator', name: '动画生成', description: '生成动画序列' },
  { index: 9, type: 'description_generator', name: '描述生成', description: '生成实验描述' },
  { index: 10, type: 'result_validator', name: '结果验证', description: '验证实验结果' },
  { index: 11, type: 'output_formatter', name: '输出格式化', description: '格式化最终输出' },
];

/**
 * 将 SSE 流中的文本缓冲区解析成独立的 data: 事件。
 *
 * SSE 协议中，一条事件由若干行组成并以空行（\n\n）分隔；
 * 同时由于流式传输，单个 chunk 可能只包含半条事件，
 * 需要保留剩余部分等待下一次 chunk 拼接。
 *
 * @returns [已完整的事件 JSON 数组, 剩余未消费的文本]
 */
function parseSSEChunk(buffer: string): { events: string[]; remainder: string } {
  const events: string[] = [];

  // SSE 事件之间用空行分隔（\n\n 或 \r\n\r\n）
  const parts = buffer.split(/\r?\n\r?\n/);
  // 最后一段可能不完整，留到下一次
  const remainder = parts.pop() ?? '';

  for (const part of parts) {
    // 一个事件可能包含多行，如 data: ... / event: ... / id: ...
    // 这里只关心 data: 开头的行（多行 data 会自动拼接）
    const dataLines: string[] = [];
    for (const line of part.split(/\r?\n/)) {
      const trimmed = line.replace(/\r$/, '');
      if (trimmed.startsWith('data:')) {
        // 去掉 "data:" 前缀及可选的单个空格
        dataLines.push(trimmed.slice(5).replace(/^ /, ''));
      }
    }
    if (dataLines.length === 0) continue;

    const payload = dataLines.join('\n').trim();
    // 心跳 / 结束标记：[DONE]
    if (!payload || payload === '[DONE]' || payload === 'DONE') continue;

    events.push(payload);
  }

  return { events, remainder };
}

/**
 * 调用 Spring AI 智能体后端，流式接收工作流执行进度和 ReAct 推理过程。
 *
 * @param input           用户的自然语言实验描述
 * @param onNodeStart     当某个工作流节点开始执行时触发
 * @param onNodeComplete  当某个工作流节点执行完成时触发
 * @param onAIThinking    当 AI 输出思考过程文本时触发
 * @param onReActStep     当 ReAct 推理产生新步骤时触发（Thought/Action/Observation/Final Answer）
 * @returns               智能体最终输出的 AgentResult
 */
export async function generateExperimentWithAgent(
  input: string,
  onNodeStart: (nodeIndex: number, nodeName: string, nodeDescription: string) => void,
  onNodeComplete: (nodeIndex: number, nodeName: string, result: string) => void,
  onAIThinking: (message: string) => void,
  onReActStep: (step: ReActStep) => void,
): Promise<AgentResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error('Agent request timeout')), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(GENERATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 显式声明接收 SSE 流
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ input }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Agent backend responded with status ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Agent backend response has no body stream');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    let resolved = false;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const { events, remainder } = parseSSEChunk(buffer);
      buffer = remainder;

      for (const payload of events) {
        let event: AgentEvent;
        try {
          event = JSON.parse(payload) as AgentEvent;
        } catch (err) {
          // 跳过无法解析的事件，不中断整个流
          console.warn('[agent] Failed to parse SSE event:', payload, err);
          continue;
        }

        switch (event.type) {
          case 'node_start':
            if (typeof event.nodeIndex === 'number') {
              onNodeStart(event.nodeIndex, event.nodeName ?? '', event.description ?? '');
            }
            break;
          case 'node_complete':
            if (typeof event.nodeIndex === 'number') {
              onNodeComplete(event.nodeIndex, event.nodeName ?? '', event.result ?? '');
            }
            break;
          case 'ai_thinking':
            if (event.message) onAIThinking(event.message);
            break;
          case 'react_step':
            if (typeof event.nodeIndex === 'number' && event.reactStepType) {
              onReActStep({
                nodeIndex: event.nodeIndex,
                stepType: event.reactStepType as ReActStep['stepType'],
                content: event.reactStepContent ?? '',
                stepNumber: event.reactStepNumber ?? 0,
              });
            }
            break;
          case 'complete':
            if (event.output) {
              resolved = true;
              return event.output;
            }
            // 即使没有 output 字段，也尝试返回一个最小化结果
            return {
              experimentType: 'mechanics',
              sceneType: '',
              description: '',
              physicsLaws: [],
              aiParams: {},
              augmentedInput: input,
            };
          case 'error':
            throw new Error(event.message || 'Agent backend reported an error');
          default:
            // 未知事件类型，忽略
            break;
        }
      }
    }

    // 流结束但未收到 complete 事件
    if (!resolved) {
      throw new Error('Agent stream ended without a complete event');
    }

    // 逻辑上不会执行到这里
    throw new Error('Agent stream ended unexpectedly');
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Agent request timeout (60s)');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 检查 Spring AI 智能体后端是否可用。
 *
 * 在页面挂载时调用一次，决定是否启用智能体模式。
 * 失败时返回 false（前端会自动回退到本地工作流模式）。
 */
export async function checkAgentHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(HEALTH_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ========================================================================
//  Agent 2: Knowledge Mapping Agent
// ========================================================================

/** Agent 2 返回的知识映射结果 */
export interface KnowledgeMappingResult {
  mappedNodeIds: string[];
  topNodeIds: string[];
  summary: string;
  keyConcepts: string[];
  keyFormulas: string[];
  keyLaws: string[];
  keyProcesses: string[];
}

/** Agent 2 请求中的知识节点信息 */
export interface KnowledgeNodeInfo {
  id: string;
  name: string;
  type: string;
}

const KNOWLEDGE_MAP_URL = `${BASE_PATH}/api/experiment/knowledge-map/`;

/**
 * 调用 Agent 2（知识映射智能体），将已生成的物理实验映射到知识图谱。
 *
 * @param request        实验元数据 + 知识图谱节点列表
 * @param onReActStep    ReAct 推理步骤回调
 * @returns              知识映射结果
 */
export async function mapKnowledgeWithAgent(
  request: {
    userInput: string;
    experimentType: string;
    sceneType: string;
    description: string;
    physicsLaws: string[];
    parameters: Record<string, unknown>;
    knowledgeNodes: KnowledgeNodeInfo[];
  },
  onReActStep: (step: ReActStep) => void,
): Promise<KnowledgeMappingResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error('Agent 2 timeout')), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(KNOWLEDGE_MAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Agent 2 responded with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Agent 2 response has no body stream');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const { events, remainder } = parseSSEChunk(buffer);
      buffer = remainder;

      for (const payload of events) {
        let event: AgentEvent;
        try {
          event = JSON.parse(payload) as AgentEvent;
        } catch (err) {
          console.warn('[agent2] Failed to parse SSE event:', payload, err);
          continue;
        }

        switch (event.type) {
          case 'react_step':
            if (event.reactStepType) {
              onReActStep({
                nodeIndex: -1, // Agent 2 uses -1 to distinguish from Agent 1 nodes
                stepType: event.reactStepType as ReActStep['stepType'],
                content: event.reactStepContent ?? '',
                stepNumber: event.reactStepNumber ?? 0,
              });
            }
            break;
          case 'complete':
            if (event.output) {
              return event.output as unknown as KnowledgeMappingResult;
            }
            // Return minimal result if no output
            return {
              mappedNodeIds: [],
              topNodeIds: [],
              summary: '知识映射完成（无详细结果）',
              keyConcepts: [],
              keyFormulas: [],
              keyLaws: [],
              keyProcesses: [],
            };
          case 'error':
            throw new Error(event.message || 'Agent 2 reported an error');
          default:
            break;
        }
      }
    }

    throw new Error('Agent 2 stream ended without a complete event');
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Agent 2 request timeout (60s)');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
