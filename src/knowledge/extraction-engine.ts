/**
 * 物理知识图谱提取引擎
 * 根据实验内容智能提取相关物理知识并生成子图
 */

import {
  PHYSICS_NODES,
  PHYSICS_EDGES,
  KnowledgeGraph,
  KnowledgeNode,
  searchNodes,
  getSubgraph,
  getKnowledgeForExperimentType
} from './physics-graph';

export interface ExtractionResult {
  graph: KnowledgeGraph;
  primaryNodes: KnowledgeNode[];
  secondaryNodes: KnowledgeNode[];
  formulas: KnowledgeNode[];
  laws: KnowledgeNode[];
  scientists: KnowledgeNode[];
  summary: string;
  relevantKeywords: string[];
}

// 根据用户输入和实验结果提取知识图谱
export function extractKnowledgeGraph(
  userInput: string,
  experimentType: string,
  physicsLaws: string[] = [],
  experimentParameters: Record<string, unknown> = {}
): ExtractionResult {
  // 1. 从用户输入中提取关键词
  const inputKeywords = extractKeywords(userInput);
  
  // 2. 根据实验类型获取基础知识
  const typeBasedGraph = getKnowledgeForExperimentType(experimentType);
  
  // 3. 根据关键词搜索相关概念
  const keywordMatches = searchNodes(inputKeywords);
  
  // 4. 根据物理定律匹配相关节点
  const lawNodes = PHYSICS_NODES.filter(n => 
    n.type === 'law' || n.type === 'formula'
  ).filter(n => 
    physicsLaws.some(law => 
      n.name.includes(law) || 
      law.includes(n.name) ||
      n.keywords.some(kw => law.includes(kw) || kw.includes(law))
    )
  );
  
  // 5. 合并所有相关节点ID
  const allRelatedIds = new Set<string>([
    ...typeBasedGraph.nodes.map(n => n.id),
    ...keywordMatches.map(n => n.id),
    ...lawNodes.map(n => n.id)
  ]);
  
  // 6. 根据实验参数增强关键词
  const paramKeywords = extractParamKeywords(experimentParameters);
  const paramNodes = searchNodes(paramKeywords);
  paramNodes.forEach(n => allRelatedIds.add(n.id));
  
  // 7. 生成子图（深度为2，确保有足够的关系）
  const mainGraph = getSubgraph(Array.from(allRelatedIds), 2);
  
  // 8. 分类节点
  const primaryNodes = mainGraph.nodes.filter(n => 
    n.type === 'concept'
  ).sort((a, b) => {
    const aMatch = a.keywords.some(k => inputKeywords.some(ik => k.includes(ik)));
    const bMatch = b.keywords.some(k => inputKeywords.some(ik => k.includes(ik)));
    return Number(bMatch) - Number(aMatch);
  });
  
  const formulas = mainGraph.nodes.filter(n => n.type === 'formula');
  const laws = mainGraph.nodes.filter(n => n.type === 'law');
  const scientists = mainGraph.nodes.filter(n => n.type === 'scientist');
  const secondaryNodes = mainGraph.nodes.filter(n => 
    !primaryNodes.includes(n) && !formulas.includes(n) && !laws.includes(n) && !scientists.includes(n)
  );
  
  // 9. 生成摘要
  const summary = generateSummary(experimentType, primaryNodes, formulas, laws);
  
  // 10. 收集相关关键词
  const relevantKeywords = [
    ...primaryNodes.slice(0, 8).map(n => n.name),
    ...formulas.slice(0, 5).map(n => n.name),
    ...laws.slice(0, 3).map(n => n.name)
  ];
  
  return {
    graph: mainGraph,
    primaryNodes,
    secondaryNodes,
    formulas,
    laws,
    scientists,
    summary,
    relevantKeywords
  };
}

// 从文本中提取关键词
function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  
  // 中文关键词
  const chineseTerms = [
    '力', '质量', '速度', '加速度', '位移', '时间', '能量', '动能', '势能',
    '重力', '动量', '摩擦', '自由落体', '单摆', '弹簧', '碰撞', '抛体', '平抛',
    '圆周', '振动', '简谐', '电荷', '电流', '电压', '电阻', '电场', '磁场',
    '光', '折射', '反射', '透镜', '温度', '热量', '波', '波长', '频率',
    '牛顿', '爱因斯坦', '欧姆', '库仑', '法拉第'
  ];
  
  // 英文关键词
  const englishTerms = [
    'force', 'mass', 'velocity', 'acceleration', 'displacement', 'time',
    'energy', 'kinetic', 'potential', 'gravity', 'momentum', 'friction',
    'free fall', 'pendulum', 'spring', 'collision', 'projectile', 'circular',
    'oscillation', 'charge', 'current', 'voltage', 'resistance', 'electric',
    'magnetic', 'light', 'refraction', 'reflection', 'lens', 'temperature',
    'heat', 'wave', 'wavelength', 'frequency', 'newton', 'einstein', 'ohm'
  ];
  
  const lowerText = text.toLowerCase();
  
  chineseTerms.forEach(term => {
    if (text.includes(term)) {
      keywords.push(term);
    }
  });
  
  englishTerms.forEach(term => {
    if (lowerText.includes(term)) {
      keywords.push(term);
    }
  });
  
  // 去重并限制数量
  return [...new Set(keywords)].slice(0, 20);
}

// 从实验参数中提取关键词
function extractParamKeywords(params: Record<string, unknown>): string[] {
  const keywords: string[] = [];
  
  const paramText = JSON.stringify(params).toLowerCase();
  
  if (paramText.includes('mass') || paramText.includes('质量')) keywords.push('质量');
  if (paramText.includes('velocity') || paramText.includes('速度')) keywords.push('速度');
  if (paramText.includes('height') || paramText.includes('高度')) keywords.push('位移');
  if (paramText.includes('gravity') || paramText.includes('重力')) keywords.push('重力');
  if (paramText.includes('friction') || paramText.includes('摩擦')) keywords.push('摩擦');
  if (paramText.includes('spring') || paramText.includes('弹簧')) keywords.push('弹簧');
  if (paramText.includes('pendulum') || paramText.includes('摆')) keywords.push('单摆');
  
  return keywords;
}

// 生成知识图谱摘要文本
function generateSummary(
  experimentType: string,
  primaryNodes: KnowledgeNode[],
  formulas: KnowledgeNode[],
  laws: KnowledgeNode[]
): string {
  const typeNames: Record<string, string> = {
    'mechanics': '力学',
    'electromagnetism': '电磁学',
    'optics': '光学',
    'thermodynamics': '热力学',
    'waves': '波动',
    'modern_physics': '现代物理'
  };
  
  const typeName = typeNames[experimentType] || '物理';
  
  const mainConcepts = primaryNodes.slice(0, 4).map(n => n.name).join('、');
  const mainFormulas = formulas.slice(0, 3).map(n => `${n.name} (${n.formula})`).join('；');
  const mainLaws = laws.slice(0, 2).map(n => `${n.name}: ${n.description}`).join('；');
  
  return `本实验涉及${typeName}领域的核心概念：${mainConcepts || '若干物理量'}。
关键公式：${mainFormulas || '相关物理公式'}。
物理定律：${mainLaws || '基本物理原理'}。
建议深入学习这些概念以更好理解实验原理。`;
}

// 获取知识图谱统计信息
export function getGraphStats(graph: KnowledgeGraph): Record<string, number> {
  const stats: Record<string, number> = {};
  
  graph.nodes.forEach(node => {
    const type = node.type;
    stats[type] = (stats[type] || 0) + 1;
  });
  
  stats['total'] = graph.nodes.length;
  stats['relations'] = graph.edges.length;
  
  return stats;
}

// 计算节点重要度
export function getNodeImportance(nodeId: string, graph: KnowledgeGraph): number {
  let count = 0;
  
  graph.edges.forEach(edge => {
    if (edge.source === nodeId || edge.target === nodeId) {
      count += edge.weight;
    }
  });
  
  return count;
}

// 导出完整知识图谱供外部使用
export const FULL_KNOWLEDGE_GRAPH: KnowledgeGraph = {
  nodes: PHYSICS_NODES,
  edges: PHYSICS_EDGES
};
