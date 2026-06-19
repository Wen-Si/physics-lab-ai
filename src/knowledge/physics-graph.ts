/**
 * 物理学知识图谱数据库
 * 包含物理概念、公式、定律、实验及其相互关系
 */

export interface KnowledgeNode {
  id: string;
  name: string;
  type: 'concept' | 'formula' | 'law' | 'experiment' | 'unit' | 'scientist';
  description: string;
  formula?: string;
  category: string;
  keywords: string[];
  color?: string;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  relation: string;
  weight: number;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

// ======================== 知识图谱节点 ========================

export const PHYSICS_NODES: KnowledgeNode[] = [
  // ---------- 力学 ----------
  { id: 'force', name: '力', type: 'concept', category: '力学', keywords: ['力', 'force', '作用力'], description: '物体间的相互作用，改变物体的运动状态', color: '#ff6b6b' },
  { id: 'mass', name: '质量', type: 'concept', category: '力学', keywords: ['质量', 'mass'], description: '物体惯性的度量，表示物体所含物质的多少', color: '#ffa502' },
  { id: 'acceleration', name: '加速度', type: 'concept', category: '力学', keywords: ['加速度', 'acceleration'], description: '描述速度变化快慢的物理量', color: '#ff7f50' },
  { id: 'velocity', name: '速度', type: 'concept', category: '力学', keywords: ['速度', 'velocity'], description: '描述物体运动快慢和方向的物理量', color: '#e17055' },
  { id: 'displacement', name: '位移', type: 'concept', category: '力学', keywords: ['位移', 'displacement', '位置'], description: '物体位置的变化', color: '#d63031' },
  { id: 'time', name: '时间', type: 'concept', category: '基本量', keywords: ['时间', 'time', '时刻'], description: '描述事件发生先后顺序的物理量', color: '#74b9ff' },
  { id: 'energy', name: '能量', type: 'concept', category: '能量', keywords: ['能量', 'energy', '能'], description: '物体做功的能力', color: '#fdcb6e' },
  { id: 'kinetic_energy', name: '动能', type: 'concept', category: '能量', keywords: ['动能', 'kinetic energy'], description: '物体由于运动而具有的能量', color: '#fd79a8' },
  { id: 'potential_energy', name: '势能', type: 'concept', category: '能量', keywords: ['势能', 'potential energy', '重力势能'], description: '物体由于位置或形变而具有的能量', color: '#a29bfe' },
  { id: 'gravity', name: '重力', type: 'concept', category: '力学', keywords: ['重力', 'gravity', '引力'], description: '地球对物体的吸引力', color: '#6c5ce7' },
  { id: 'momentum', name: '动量', type: 'concept', category: '力学', keywords: ['动量', 'momentum'], description: '物体质量与速度的乘积', color: '#55efc4' },
  { id: 'friction', name: '摩擦力', type: 'concept', category: '力学', keywords: ['摩擦', 'friction', '阻力'], description: '两个接触物体间的阻碍相对运动的力', color: '#81ecec' },

  // 力学公式
  { id: 'newton_second', name: '牛顿第二定律', type: 'law', category: '力学', keywords: ['牛顿第二定律', 'F=ma', 'second law'], formula: 'F = m × a', description: '物体加速度与合外力成正比，与质量成反比', color: '#e17055' },
  { id: 'kinetic_energy_formula', name: '动能公式', type: 'formula', category: '能量', keywords: ['动能公式', '½mv²'], formula: 'E_k = ½mv²', description: '物体动能等于质量与速度平方乘积的一半', color: '#fd79a8' },
  { id: 'potential_energy_formula', name: '重力势能公式', type: 'formula', category: '能量', keywords: ['重力势能', 'mgh'], formula: 'E_p = mgh', description: '物体重力势能等于质量、重力加速度、高度的乘积', color: '#a29bfe' },
  { id: 'free_fall', name: '自由落体运动', type: 'formula', category: '运动学', keywords: ['自由落体', 'free fall', '下落'], formula: 'h = ½gt², v = gt', description: '物体仅受重力从静止开始的下落运动', color: '#6c5ce7' },
  { id: 'momentum_formula', name: '动量公式', type: 'formula', category: '力学', keywords: ['动量', 'p=mv'], formula: 'p = mv', description: '动量等于质量与速度的乘积', color: '#55efc4' },
  { id: 'energy_conservation', name: '能量守恒定律', type: 'law', category: '能量', keywords: ['能量守恒', 'conservation of energy'], formula: 'E_总 = 常量', description: '系统总能量保持不变，能量只能转换形式', color: '#fdcb6e' },
  { id: 'momentum_conservation', name: '动量守恒定律', type: 'law', category: '力学', keywords: ['动量守恒', 'conservation of momentum'], formula: 'm₁v₁ + m₂v₂ = m₁v₁\' + m₂v₂\'', description: '系统不受外力时，总动量保持不变', color: '#55efc4' },
  { id: 'newton_first', name: '牛顿第一定律', type: 'law', category: '力学', keywords: ['牛顿第一定律', '惯性定律'], formula: 'F=0 → v=常量', description: '物体不受外力时保持静止或匀速直线运动', color: '#d63031' },
  { id: 'newton_third', name: '牛顿第三定律', type: 'law', category: '力学', keywords: ['牛顿第三定律', '作用反作用'], formula: 'F₁₂ = -F₂₁', description: '作用力与反作用力大小相等，方向相反', color: '#e84393' },

  // ---------- 运动学 ----------
  { id: 'projectile_motion', name: '抛体运动', type: 'formula', category: '运动学', keywords: ['抛体运动', 'projectile motion', '平抛'], formula: 'x = v₀t, y = ½gt²', description: '物体具有初速度后仅受重力的运动', color: '#00b894' },
  { id: 'circular_motion', name: '圆周运动', type: 'formula', category: '运动学', keywords: ['圆周运动', 'circular motion'], formula: 'v = ωr, a = v²/r', description: '物体沿圆周路径的运动', color: '#00cec9' },
  { id: 'simple_harmonic_motion', name: '简谐振动', type: 'formula', category: '波动', keywords: ['简谐振动', 'simple harmonic motion', '振动'], formula: 'x = A sin(ωt + φ)', description: '物体在平衡位置附近做周期性往复运动', color: '#0984e3' },
  { id: 'pendulum', name: '单摆', type: 'experiment', category: '力学', keywords: ['单摆', 'pendulum', '钟摆'], formula: 'T = 2π√(L/g)', description: '一个质点用细线悬挂后的摆动', color: '#74b9ff' },
  { id: 'spring_mass', name: '弹簧振子', type: 'experiment', category: '力学', keywords: ['弹簧振子', 'spring', '弹簧'], formula: 'T = 2π√(m/k)', description: '弹簧连接质量在弹性限度内的振动', color: '#81ecec' },

  // ---------- 电磁学 ----------
  { id: 'charge', name: '电荷', type: 'concept', category: '电磁学', keywords: ['电荷', 'charge', '电'], description: '物质的基本属性，产生电磁现象', color: '#ffcc80' },
  { id: 'electric_field', name: '电场', type: 'concept', category: '电磁学', keywords: ['电场', 'electric field'], description: '电荷周围存在的特殊物质', color: '#ffb74d' },
  { id: 'magnetic_field', name: '磁场', type: 'concept', category: '电磁学', keywords: ['磁场', 'magnetic field'], description: '运动电荷周围存在的场', color: '#ba68c8' },
  { id: 'voltage', name: '电压', type: 'concept', category: '电磁学', keywords: ['电压', 'voltage', '电势差'], description: '单位正电荷在两点间移动时电场力做的功', color: '#e57373' },
  { id: 'current', name: '电流', type: 'concept', category: '电磁学', keywords: ['电流', 'current'], description: '电荷的定向移动', color: '#f06292' },
  { id: 'resistance', name: '电阻', type: 'concept', category: '电磁学', keywords: ['电阻', 'resistance'], description: '导体对电流的阻碍作用', color: '#ce93d8' },
  { id: 'ohm_law', name: '欧姆定律', type: 'law', category: '电磁学', keywords: ['欧姆定律', 'Ohm law'], formula: 'V = IR', description: '电压、电流与电阻的关系', color: '#e57373' },
  { id: 'coulomb_law', name: '库仑定律', type: 'law', category: '电磁学', keywords: ['库仑定律', 'Coulomb'], formula: 'F = kq₁q₂/r²', description: '两个点电荷间的相互作用力', color: '#ffcc80' },
  { id: 'faraday', name: '法拉第电磁感应', type: 'law', category: '电磁学', keywords: ['法拉第', '电磁感应', 'Faraday'], formula: 'ε = -dΦ/dt', description: '磁通量变化产生感应电动势', color: '#ba68c8' },

  // ---------- 光学 ----------
  { id: 'light', name: '光', type: 'concept', category: '光学', keywords: ['光', 'light'], description: '电磁波谱中可见光部分', color: '#fff176' },
  { id: 'refraction', name: '折射', type: 'concept', category: '光学', keywords: ['折射', 'refraction'], description: '光通过不同介质时的偏折', color: '#81c784' },
  { id: 'reflection', name: '反射', type: 'concept', category: '光学', keywords: ['反射', 'reflection'], description: '光遇到界面返回原介质', color: '#64b5f6' },
  { id: 'lens', name: '透镜', type: 'concept', category: '光学', keywords: ['透镜', 'lens', '镜片'], description: '利用折射原理成像的光学元件', color: '#4db6ac' },
  { id: 'snell_law', name: '斯涅尔定律', type: 'law', category: '光学', keywords: ['斯涅尔定律', 'Snell', '折射定律'], formula: 'n₁sinθ₁ = n₂sinθ₂', description: '光在界面发生折射时入射角与折射角的关系', color: '#81c784' },
  { id: 'lens_formula', name: '透镜成像公式', type: 'formula', category: '光学', keywords: ['透镜公式', '成像'], formula: '1/f = 1/u + 1/v', description: '透镜焦距、物距与像距的关系', color: '#4db6ac' },

  // ---------- 热学 ----------
  { id: 'temperature', name: '温度', type: 'concept', category: '热学', keywords: ['温度', 'temperature', '热'], description: '物体冷热程度的度量', color: '#ffab91' },
  { id: 'heat', name: '热量', type: 'concept', category: '热学', keywords: ['热量', 'heat'], description: '热传递过程中转移的能量', color: '#ff8a65' },
  { id: 'thermodynamics_first', name: '热力学第一定律', type: 'law', category: '热学', keywords: ['热力学第一定律'], formula: 'ΔU = Q + W', description: '系统内能变化等于吸收热量与外界对系统做功之和', color: '#ffab91' },
  { id: 'specific_heat', name: '比热容', type: 'concept', category: '热学', keywords: ['比热容', 'specific heat'], formula: 'Q = cmΔT', description: '单位质量物质温度升高1度所需热量', color: '#ff7043' },

  // ---------- 波动 ----------
  { id: 'wave', name: '波', type: 'concept', category: '波动', keywords: ['波', 'wave', '波动'], description: '能量传递的一种形式', color: '#4fc3f7' },
  { id: 'wavelength', name: '波长', type: 'concept', category: '波动', keywords: ['波长', 'wavelength'], description: '波在一个周期内传播的距离', color: '#81d4fa' },
  { id: 'frequency', name: '频率', type: 'concept', category: '波动', keywords: ['频率', 'frequency'], description: '单位时间内波振动的次数', color: '#b3e5fc' },
  { id: 'wave_equation', name: '波速公式', type: 'formula', category: '波动', keywords: ['波速', 'wave speed'], formula: 'v = fλ', description: '波速等于频率与波长的乘积', color: '#4fc3f7' },

  // ---------- 科学家 ----------
  { id: 'newton', name: '牛顿 (Newton)', type: 'scientist', category: '历史人物', keywords: ['牛顿', 'Newton'], description: '1643-1727，经典力学奠基人，提出牛顿三大定律和万有引力定律', color: '#ffd54f' },
  { id: 'einstein', name: '爱因斯坦 (Einstein)', type: 'scientist', category: '历史人物', keywords: ['爱因斯坦', 'Einstein'], description: '1879-1955，相对论创立者，提出质能方程', color: '#aed581' },
  { id: 'ohm', name: '欧姆 (Ohm)', type: 'scientist', category: '历史人物', keywords: ['欧姆', 'Ohm'], description: '1789-1854，发现欧姆定律', color: '#e1bee7' },
  { id: 'faraday_scientist', name: '法拉第 (Faraday)', type: 'scientist', category: '历史人物', keywords: ['法拉第', 'Faraday'], description: '1791-1867，发现电磁感应现象', color: '#b39ddb' },
  { id: 'coulomb', name: '库仑 (Coulomb)', type: 'scientist', category: '历史人物', keywords: ['库仑', 'Coulomb'], description: '1736-1806，发现库仑定律', color: '#ffb74d' },
  { id: 'einstein_energy', name: '质能方程', type: 'formula', category: '现代物理', keywords: ['质能方程', 'E=mc²', 'E=mc2'], formula: 'E = mc²', description: '质量与能量的等价关系', color: '#aed581' }
];

// ======================== 知识图谱关系 ========================

export const PHYSICS_EDGES: KnowledgeEdge[] = [
  // 力学核心关系
  { source: 'force', target: 'mass', relation: '作用于', weight: 0.9 },
  { source: 'force', target: 'acceleration', relation: '产生', weight: 0.9 },
  { source: 'newton_second', target: 'force', relation: '定义', weight: 1.0 },
  { source: 'newton_second', target: 'mass', relation: '涉及', weight: 1.0 },
  { source: 'newton_second', target: 'acceleration', relation: '涉及', weight: 1.0 },
  { source: 'acceleration', target: 'velocity', relation: '变化率', weight: 0.8 },
  { source: 'velocity', target: 'displacement', relation: '变化率', weight: 0.8 },
  { source: 'velocity', target: 'time', relation: '与...相关', weight: 0.7 },
  { source: 'displacement', target: 'time', relation: '与...相关', weight: 0.7 },
  { source: 'mass', target: 'energy', relation: '具有', weight: 0.8 },
  { source: 'energy', target: 'kinetic_energy', relation: '包含', weight: 1.0 },
  { source: 'energy', target: 'potential_energy', relation: '包含', weight: 1.0 },
  { source: 'kinetic_energy_formula', target: 'kinetic_energy', relation: '计算', weight: 1.0 },
  { source: 'kinetic_energy_formula', target: 'mass', relation: '涉及', weight: 0.8 },
  { source: 'kinetic_energy_formula', target: 'velocity', relation: '涉及', weight: 0.8 },
  { source: 'potential_energy_formula', target: 'potential_energy', relation: '计算', weight: 1.0 },
  { source: 'potential_energy_formula', target: 'gravity', relation: '涉及', weight: 0.9 },
  { source: 'potential_energy_formula', target: 'mass', relation: '涉及', weight: 0.8 },
  { source: 'energy_conservation', target: 'energy', relation: '描述', weight: 1.0 },
  { source: 'energy_conservation', target: 'kinetic_energy', relation: '涉及', weight: 0.9 },
  { source: 'energy_conservation', target: 'potential_energy', relation: '涉及', weight: 0.9 },
  { source: 'gravity', target: 'force', relation: '属于', weight: 0.9 },
  { source: 'free_fall', target: 'gravity', relation: '由于', weight: 1.0 },
  { source: 'free_fall', target: 'acceleration', relation: '产生', weight: 0.9 },
  { source: 'free_fall', target: 'displacement', relation: '产生', weight: 0.9 },
  { source: 'free_fall', target: 'velocity', relation: '产生', weight: 0.9 },
  { source: 'momentum_formula', target: 'momentum', relation: '定义', weight: 1.0 },
  { source: 'momentum_formula', target: 'mass', relation: '涉及', weight: 0.8 },
  { source: 'momentum_formula', target: 'velocity', relation: '涉及', weight: 0.8 },
  { source: 'momentum_conservation', target: 'momentum', relation: '描述', weight: 1.0 },
  { source: 'momentum', target: 'velocity', relation: '与...相关', weight: 0.9 },
  { source: 'momentum', target: 'mass', relation: '与...相关', weight: 0.9 },
  { source: 'friction', target: 'force', relation: '属于', weight: 0.7 },
  { source: 'newton_first', target: 'force', relation: '描述', weight: 0.9 },
  { source: 'newton_first', target: 'velocity', relation: '描述', weight: 0.8 },
  { source: 'newton_third', target: 'force', relation: '描述', weight: 0.9 },
  { source: 'newton', target: 'newton_first', relation: '发现', weight: 1.0 },
  { source: 'newton', target: 'newton_second', relation: '发现', weight: 1.0 },
  { source: 'newton', target: 'newton_third', relation: '发现', weight: 1.0 },

  // 运动学关系
  { source: 'projectile_motion', target: 'velocity', relation: '具有', weight: 0.9 },
  { source: 'projectile_motion', target: 'gravity', relation: '受...作用', weight: 0.9 },
  { source: 'projectile_motion', target: 'displacement', relation: '产生', weight: 0.8 },
  { source: 'circular_motion', target: 'velocity', relation: '具有', weight: 0.9 },
  { source: 'circular_motion', target: 'acceleration', relation: '产生', weight: 0.9 },
  { source: 'simple_harmonic_motion', target: 'displacement', relation: '产生', weight: 0.9 },
  { source: 'simple_harmonic_motion', target: 'velocity', relation: '产生', weight: 0.9 },
  { source: 'pendulum', target: 'simple_harmonic_motion', relation: '属于', weight: 1.0 },
  { source: 'pendulum', target: 'gravity', relation: '受...作用', weight: 0.9 },
  { source: 'spring_mass', target: 'simple_harmonic_motion', relation: '属于', weight: 1.0 },
  { source: 'spring_mass', target: 'mass', relation: '具有', weight: 0.9 },
  { source: 'spring_mass', target: 'energy', relation: '涉及', weight: 0.8 },

  // 电磁学关系
  { source: 'charge', target: 'electric_field', relation: '产生', weight: 1.0 },
  { source: 'charge', target: 'current', relation: '流动形成', weight: 0.9 },
  { source: 'current', target: 'magnetic_field', relation: '产生', weight: 1.0 },
  { source: 'voltage', target: 'current', relation: '驱动', weight: 0.9 },
  { source: 'voltage', target: 'electric_field', relation: '与...相关', weight: 0.9 },
  { source: 'resistance', target: 'current', relation: '阻碍', weight: 0.9 },
  { source: 'ohm_law', target: 'voltage', relation: '涉及', weight: 1.0 },
  { source: 'ohm_law', target: 'current', relation: '涉及', weight: 1.0 },
  { source: 'ohm_law', target: 'resistance', relation: '涉及', weight: 1.0 },
  { source: 'ohm', target: 'ohm_law', relation: '发现', weight: 1.0 },
  { source: 'coulomb_law', target: 'charge', relation: '描述', weight: 1.0 },
  { source: 'coulomb_law', target: 'force', relation: '涉及', weight: 0.9 },
  { source: 'coulomb', target: 'coulomb_law', relation: '发现', weight: 1.0 },
  { source: 'faraday', target: 'magnetic_field', relation: '研究', weight: 0.9 },
  { source: 'faraday', target: 'current', relation: '产生', weight: 0.9 },
  { source: 'faraday_scientist', target: 'faraday', relation: '发现', weight: 1.0 },

  // 光学关系
  { source: 'light', target: 'refraction', relation: '发生', weight: 0.9 },
  { source: 'light', target: 'reflection', relation: '发生', weight: 0.9 },
  { source: 'lens', target: 'refraction', relation: '利用', weight: 1.0 },
  { source: 'snell_law', target: 'refraction', relation: '描述', weight: 1.0 },
  { source: 'lens_formula', target: 'lens', relation: '描述', weight: 1.0 },
  { source: 'light', target: 'wave', relation: '具有...性质', weight: 0.8 },

  // 热学关系
  { source: 'temperature', target: 'heat', relation: '与...相关', weight: 0.9 },
  { source: 'heat', target: 'energy', relation: '属于', weight: 0.9 },
  { source: 'thermodynamics_first', target: 'heat', relation: '描述', weight: 1.0 },
  { source: 'thermodynamics_first', target: 'energy', relation: '涉及', weight: 0.9 },
  { source: 'specific_heat', target: 'temperature', relation: '涉及', weight: 0.9 },
  { source: 'specific_heat', target: 'heat', relation: '涉及', weight: 0.9 },

  // 波动关系
  { source: 'wave', target: 'wavelength', relation: '具有', weight: 1.0 },
  { source: 'wave', target: 'frequency', relation: '具有', weight: 1.0 },
  { source: 'wave_equation', target: 'wave', relation: '描述', weight: 1.0 },
  { source: 'wave_equation', target: 'wavelength', relation: '涉及', weight: 0.9 },
  { source: 'wave_equation', target: 'frequency', relation: '涉及', weight: 0.9 },

  // 现代物理
  { source: 'einstein_energy', target: 'energy', relation: '等价', weight: 1.0 },
  { source: 'einstein_energy', target: 'mass', relation: '涉及', weight: 1.0 },
  { source: 'einstein', target: 'einstein_energy', relation: '发现', weight: 1.0 }
];

// ======================== 完整知识图谱 ========================

export const PHYSICS_KNOWLEDGE_GRAPH: KnowledgeGraph = {
  nodes: PHYSICS_NODES,
  edges: PHYSICS_EDGES
};

// ======================== 工具函数 ========================

// 根据关键词搜索相关节点
export function searchNodes(keywords: string[]): KnowledgeNode[] {
  const lowerKeywords = keywords.map(k => k.toLowerCase());
  return PHYSICS_NODES.filter(node => {
    const nodeKeywords = node.keywords.map(k => k.toLowerCase());
    const nodeName = node.name.toLowerCase();
    return lowerKeywords.some(kw => 
      nodeName.includes(kw) || 
      nodeKeywords.some(nk => nk.includes(kw) || kw.includes(nk)) ||
      node.description.toLowerCase().includes(kw)
    );
  });
}

// 获取与给定节点相关的所有节点（构建子图）
export function getSubgraph(nodeIds: string[], depth: number = 2): KnowledgeGraph {
  const visited = new Set<string>();
  const subgraphNodes: KnowledgeNode[] = [];
  const subgraphEdges: KnowledgeEdge[] = [];
  
  const queue: { id: string; level: number }[] = nodeIds.map(id => ({ id, level: 0 }));
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id) || current.level > depth) continue;
    visited.add(current.id);
    
    const node = PHYSICS_NODES.find(n => n.id === current.id);
    if (node) {
      subgraphNodes.push(node);
    }
    
    // 查找相邻节点
    PHYSICS_EDGES.forEach(edge => {
      if (edge.source === current.id && !visited.has(edge.target)) {
        queue.push({ id: edge.target, level: current.level + 1 });
        subgraphEdges.push(edge);
      }
      if (edge.target === current.id && !visited.has(edge.source)) {
        queue.push({ id: edge.source, level: current.level + 1 });
        subgraphEdges.push(edge);
      }
    });
  }
  
  // 去重
  const uniqueNodes = subgraphNodes.filter((n, i) => 
    subgraphNodes.findIndex(n2 => n2.id === n.id) === i
  );
  const uniqueEdges = subgraphEdges.filter((e, i) =>
    subgraphEdges.findIndex(e2 => 
      (e2.source === e.source && e2.target === e.target) ||
      (e2.source === e.target && e2.target === e.source)
    ) === i
  );
  
  return { nodes: uniqueNodes, edges: uniqueEdges };
}

// 根据实验类型获取推荐知识图谱
export function getKnowledgeForExperimentType(experimentType: string): KnowledgeGraph {
  const typeKeywords: Record<string, string[]> = {
    'mechanics': ['力', '质量', '速度', '加速度', '位移', '重力', '自由落体', '能量', '动量', '牛顿', '摩擦'],
    'electromagnetism': ['电荷', '电流', '电压', '电阻', '电场', '磁场', '欧姆', '库仑', '法拉第', '电磁'],
    'optics': ['光', '折射', '反射', '透镜', '斯涅尔', '成像'],
    'thermodynamics': ['温度', '热量', '比热容', '热力学', '能量'],
    'waves': ['波', '波长', '频率', '振动', '波动'],
    'modern_physics': ['质量', '能量', '爱因斯坦', '质能']
  };
  
  const keywords = typeKeywords[experimentType] || typeKeywords['mechanics'];
  const foundNodes = searchNodes(keywords);
  const nodeIds = foundNodes.map(n => n.id);
  return getSubgraph(nodeIds, 1);
}
