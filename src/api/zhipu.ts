/**
 * 智谱AI GLM-4.5-Flash API集成
 * 用于增强物理实验的自然语言理解能力
 */

const ZHIPU_API_KEY = '325d6fa364954d2e871c30ba95b553bd.KBdQdqgJgELJBhnv';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

export interface ZhipuResponse {
  id: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface PhysicsExperimentPrompt {
  userInput: string;
  context?: string;
  experimentType?: string;
}

// 系统提示词 - 定义AI物理实验助手的行为
const SYSTEM_PROMPT = `你是一个专业的物理实验AI助手，能够理解和解析用户的自然语言描述，生成详细的物理实验模拟方案。

你的能力包括：
1. 解析用户的自然语言输入，识别物理实验类型（力学、电磁学、光学、热力学、波动、现代物理）
2. 提取关键物理参数（质量、速度、位置、时间等）
3. 应用正确的物理定律和公式
4. 生成详细的实验描述和3D可视化参数

输出格式要求：
- 使用JSON格式输出
- 包含实验类型、参数、物理定律、详细描述
- 参数要具体数值化

示例输出：
{
  "experimentType": "mechanics",
  "experimentName": "自由落体实验",
  "parameters": {
    "objectType": "sphere",
    "mass": 1,
    "initialHeight": 10,
    "gravity": 9.8
  },
  "physicsLaws": ["牛顿第二定律", "自由落体公式"],
  "description": "一个质量为1kg的小球从10米高处自由落下..."
}`;

/**
 * 调用智谱AI API进行自然语言理解
 */
export async function callZhipuAI(prompt: PhysicsExperimentPrompt): Promise<string> {
  try {
    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZHIPU_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(prompt) }
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2000
      })
    });
    const data = await response.json() as ZhipuResponse;
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('智谱AI API调用失败:', error);
    throw error;
  }
}

/**
 * 构建用户提示词
 */
function buildUserPrompt(prompt: PhysicsExperimentPrompt): string {
  let userPrompt = `用户请求：${prompt.userInput}\n\n`;
  
  if (prompt.context) {
    userPrompt += `上下文信息：${prompt.context}\n\n`;
  }
  
  if (prompt.experimentType) {
    userPrompt += `已识别的实验类型：${prompt.experimentType}\n\n`;
  }
  
  userPrompt += `请分析这个物理实验请求，输出JSON格式的实验配置。`;
  
  return userPrompt;
}

/**
 * 解析AI返回的JSON配置
 */
export function parseAIResponse(response: string): {
  experimentType: string;
  experimentName: string;
  parameters: Record<string, unknown>;
  physicsLaws: string[];
  description: string;
} | null {
  try {
    // 尝试提取JSON部分
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 增强型物理实验理解 - 结合工作流和AI
 */
export async function enhancedPhysicsUnderstanding(
  userInput: string,
  workflowOutput: {
    experimentType: string;
    parameters: Record<string, unknown>;
    physicsLaws: string[];
  }
): Promise<{
  enhancedDescription: string;
  aiSuggestions: string[];
  additionalParameters: Record<string, unknown>;
}> {
  try {
    const aiResponse = await callZhipuAI({
      userInput,
      context: JSON.stringify(workflowOutput),
      experimentType: workflowOutput.experimentType
    });

    const parsed = parseAIResponse(aiResponse);
    
    return {
      enhancedDescription: parsed?.description || aiResponse,
      aiSuggestions: parsed?.physicsLaws || [],
      additionalParameters: parsed?.parameters || {}
    };
  } catch {
    // 如果AI调用失败，返回原始工作流输出
    return {
      enhancedDescription: '',
      aiSuggestions: [],
      additionalParameters: {}
    };
  }
}

/**
 * 生成实验解释文本
 */
export async function generateExperimentExplanation(
  experimentData: {
    type: string;
    name: string;
    laws: string[];
    results: Record<string, unknown>;
  }
): Promise<string> {
  try {
    const response = await callZhipuAI({
      userInput: `请为以下物理实验生成详细的科学解释：\n实验类型：${experimentData.type}\n实验名称：${experimentData.name}\n涉及的物理定律：${experimentData.laws.join(', ')}\n实验结果：${JSON.stringify(experimentData.results)}`,
      context: '这是一个物理实验模拟系统，需要生成科学准确的解释文本。'
    });

    return response;
  } catch {
    return '无法生成详细解释，请参考物理定律说明。';
  }
}