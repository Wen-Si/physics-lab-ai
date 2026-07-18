/**
 * 物理学知识图谱数据库 (Palantir Ontology Methodology)
 *
 * 采用 Palantir 的 Object-Link-Action 三原语方法论重新构建：
 * - Object Types (对象类型)：实体 / 定律 / 公式 / 过程(Action) / 实验 / 人物
 * - Link Types (链接类型)：定义 / 适用 / 守恒 / 测量 / 推导 / 发现 / 产生 / 转化 / 支配 / 属于 / 相关
 * - Action Types (动作类型)：通过 process 类型的节点表示物理过程/操作
 *
 * 包含物理概念、公式、定律、实验、过程及其相互关系。
 */

// ============================================================================
// Palantir Object / Link 类型定义
// ============================================================================

/**
 * Palantir Object 类型分类
 * - entity:    物理实体（如力、质量、能量等物理量/现象）
 * - law:       物理定律
 * - formula:   数学公式
 * - process:   Palantir Action 类型 — 物理过程/操作（如自由落体过程、弹性碰撞过程）
 * - experiment:实验类型
 * - person:    科学家
 */
export type PalantirObjectType =
  | 'entity'
  | 'law'
  | 'formula'
  | 'process'
  | 'experiment'
  | 'person';

/**
 * Palantir Link 类型分类
 * - defines:        定义
 * - applies_to:     适用于
 * - conserves:      守恒
 * - measures:       测量
 * - derived_from:   推导自
 * - discovered_by:  发现
 * - produces:       产生
 * - transforms_to:  转化为
 * - governs:        支配
 * - part_of:        属于
 * - relates_to:     相关
 */
export type PalantirLinkType =
  | 'defines'
  | 'applies_to'
  | 'conserves'
  | 'measures'
  | 'derived_from'
  | 'discovered_by'
  | 'produces'
  | 'transforms_to'
  | 'governs'
  | 'part_of'
  | 'relates_to';

// ============================================================================
// 知识图谱核心接口
// ============================================================================

export interface KnowledgeNode {
  id: string;
  name: string;
  /** 旧版类型，用于向后兼容（type system 仅支持 concept/formula/law/experiment/unit/scientist） */
  type: 'concept' | 'formula' | 'law' | 'experiment' | 'unit' | 'scientist';
  description: string;
  formula?: string;
  category: string;
  keywords: string[];
  color?: string;
  /** Palantir Object 分类 */
  objectType: PalantirObjectType;
  /** 结构化属性，例如 { "单位": "牛顿(N)", "量纲": "MLT⁻²" } */
  properties?: Record<string, string>;
  /** 较长的概览文本（2-3 句），用于 hover popup 展示 */
  summary: string;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  /** 旧版关系描述（中文），用于向后兼容 */
  relation: string;
  weight: number;
  /** Palantir Link 分类 */
  linkType: PalantirLinkType;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

// ============================================================================
// 知识图谱节点 (Palantir Objects)
// ============================================================================

export const PHYSICS_NODES: KnowledgeNode[] = [
  // ---------------- 力学基本实体 ----------------
  {
    id: 'force', name: '力', type: 'concept', category: '力学',
    keywords: ['力', 'force', '作用力'],
    description: '物体间的相互作用，改变物体的运动状态', color: '#ff6b6b',
    objectType: 'entity',
    properties: { '单位': '牛顿(N)', '量纲': 'MLT⁻²', '性质': '矢量' },
    summary: '力是物体间的相互作用，是改变物体运动状态的原因。力的单位是牛顿(N)，力的作用会使物体产生加速度或发生形变。力的三要素为大小、方向和作用点。'
  },
  {
    id: 'mass', name: '质量', type: 'concept', category: '力学',
    keywords: ['质量', 'mass'],
    description: '物体惯性的度量，表示物体所含物质的多少', color: '#ffa502',
    objectType: 'entity',
    properties: { '单位': '千克(kg)', '量纲': 'M', '性质': '标量' },
    summary: '质量是物体惯性的度量，表示物体所含物质的多少。质量是标量，单位为千克(kg)，质量越大，物体的惯性越大。质量是物理学的基本量之一，不随物体位置变化。'
  },
  {
    id: 'acceleration', name: '加速度', type: 'concept', category: '力学',
    keywords: ['加速度', 'acceleration'],
    description: '描述速度变化快慢的物理量', color: '#ff7f50',
    objectType: 'entity',
    properties: { '单位': 'm/s²', '量纲': 'LT⁻²', '性质': '矢量' },
    summary: '加速度是描述物体速度变化快慢和方向的物理量，等于速度对时间的变化率。加速度是矢量，单位为m/s²。正加速度表示速度增大，负加速度表示速度减小。'
  },
  {
    id: 'velocity', name: '速度', type: 'concept', category: '力学',
    keywords: ['速度', 'velocity'],
    description: '描述物体运动快慢和方向的物理量', color: '#e17055',
    objectType: 'entity',
    properties: { '单位': 'm/s', '量纲': 'LT⁻¹', '性质': '矢量' },
    summary: '速度是描述物体运动快慢和方向的物理量，等于位移对时间的变化率。速度是矢量，单位为m/s。速度的方向就是物体运动的方向。'
  },
  {
    id: 'displacement', name: '位移', type: 'concept', category: '力学',
    keywords: ['位移', 'displacement', '位置'],
    description: '物体位置的变化', color: '#d63031',
    objectType: 'entity',
    properties: { '单位': '米(m)', '量纲': 'L', '性质': '矢量' },
    summary: '位移是描述物体位置变化的物理量，是从初位置指向末位置的有向线段。位移是矢量，单位为米(m)，与路程不同，位移只与始末位置有关。'
  },
  {
    id: 'time', name: '时间', type: 'concept', category: '基本量',
    keywords: ['时间', 'time', '时刻'],
    description: '描述事件发生先后顺序的物理量', color: '#74b9ff',
    objectType: 'entity',
    properties: { '单位': '秒(s)', '量纲': 'T', '性质': '标量' },
    summary: '时间是描述事件发生先后顺序和持续过程的物理量。时间是标量，单位为秒(s)，是国际单位制七个基本量之一。'
  },
  {
    id: 'energy', name: '能量', type: 'concept', category: '能量',
    keywords: ['能量', 'energy', '能'],
    description: '物体做功的能力', color: '#fdcb6e',
    objectType: 'entity',
    properties: { '单位': '焦耳(J)', '量纲': 'ML²T⁻²', '性质': '标量' },
    summary: '能量是物体做功的能力，是物质运动的一般量度。能量的单位是焦耳(J)，能量有多种形式且可以相互转化，但总量守恒。'
  },
  {
    id: 'kinetic_energy', name: '动能', type: 'concept', category: '能量',
    keywords: ['动能', 'kinetic energy'],
    description: '物体由于运动而具有的能量', color: '#fd79a8',
    objectType: 'entity',
    properties: { '单位': '焦耳(J)', '量纲': 'ML²T⁻²', '性质': '标量' },
    summary: '动能是物体由于运动而具有的能量，等于物体质量与速度平方乘积的一半。动能是标量，单位为焦耳(J)，始终为正值。'
  },
  {
    id: 'potential_energy', name: '势能', type: 'concept', category: '能量',
    keywords: ['势能', 'potential energy', '重力势能'],
    description: '物体由于位置或形变而具有的能量', color: '#a29bfe',
    objectType: 'entity',
    properties: { '单位': '焦耳(J)', '量纲': 'ML²T⁻²', '性质': '标量' },
    summary: '势能是物体由于位置或形变而具有的能量，常见的有重力势能和弹性势能。重力势能等于质量、重力加速度和高度的乘积，单位为焦耳(J)。'
  },
  {
    id: 'gravity', name: '重力', type: 'concept', category: '力学',
    keywords: ['重力', 'gravity', '引力'],
    description: '地球对物体的吸引力', color: '#6c5ce7',
    objectType: 'entity',
    properties: { '单位': '牛顿(N)', '量纲': 'MLT⁻²', '方向': '竖直向下' },
    summary: '重力是地球对物体的吸引力，方向竖直向下。重力的大小为G=mg，g为重力加速度约9.8m/s²。重力是万有引力的一个分力。'
  },
  {
    id: 'momentum', name: '动量', type: 'concept', category: '力学',
    keywords: ['动量', 'momentum'],
    description: '物体质量与速度的乘积', color: '#55efc4',
    objectType: 'entity',
    properties: { '单位': 'kg·m/s', '量纲': 'MLT⁻¹', '性质': '矢量' },
    summary: '动量是物体质量与速度的乘积，是描述物体运动状态的物理量。动量是矢量，单位为kg·m/s，方向与速度方向相同。'
  },
  {
    id: 'friction', name: '摩擦力', type: 'concept', category: '力学',
    keywords: ['摩擦', 'friction', '阻力'],
    description: '两个接触物体间的阻碍相对运动的力', color: '#81ecec',
    objectType: 'entity',
    properties: { '单位': '牛顿(N)', '量纲': 'MLT⁻²', '方向': '与相对运动方向相反' },
    summary: '摩擦力是两个接触物体间阻碍相对运动的力，方向与相对运动方向相反。摩擦力分为静摩擦力和滑动摩擦力，大小与接触面性质和正压力有关。'
  },

  // ---------------- 力学定律与公式 ----------------
  {
    id: 'newton_second', name: '牛顿第二定律', type: 'law', category: '力学',
    keywords: ['牛顿第二定律', 'F=ma', 'second law'],
    formula: 'F = m × a',
    description: '物体加速度与合外力成正比，与质量成反比', color: '#e17055',
    objectType: 'law',
    properties: { '公式': 'F=ma', '适用条件': '宏观低速', '提出者': '牛顿' },
    summary: '牛顿第二定律指出物体的加速度与所受合外力成正比，与质量成反比，公式为F=ma。该定律定量地描述了力、质量和加速度之间的关系，是经典力学的核心定律。'
  },
  {
    id: 'kinetic_energy_formula', name: '动能公式', type: 'formula', category: '能量',
    keywords: ['动能公式', '½mv²'],
    formula: 'E_k = ½mv²',
    description: '物体动能等于质量与速度平方乘积的一半', color: '#fd79a8',
    objectType: 'formula',
    properties: { '变量': 'm, v', '单位': '焦耳(J)' },
    summary: '动能公式描述物体动能的计算方法，E_k=½mv²，其中m为质量，v为速度。动能与速度的平方成正比，速度对动能的影响比质量更大。'
  },
  {
    id: 'potential_energy_formula', name: '重力势能公式', type: 'formula', category: '能量',
    keywords: ['重力势能', 'mgh'],
    formula: 'E_p = mgh',
    description: '物体重力势能等于质量、重力加速度、高度的乘积', color: '#a29bfe',
    objectType: 'formula',
    properties: { '变量': 'm, g, h', '单位': '焦耳(J)' },
    summary: '重力势能公式E_p=mgh，其中m为质量，g为重力加速度，h为高度。重力势能是相对的，与参考平面的选取有关。'
  },
  {
    id: 'free_fall', name: '自由落体运动', type: 'formula', category: '运动学',
    keywords: ['自由落体', 'free fall', '下落'],
    formula: 'h = ½gt², v = gt',
    description: '物体仅受重力从静止开始的下落运动', color: '#6c5ce7',
    objectType: 'formula',
    properties: { '条件': '初速度为零,仅受重力', '加速度': 'g≈9.8m/s²' },
    summary: '自由落体运动是物体仅受重力作用从静止开始下落的运动，是匀加速直线运动。其加速度为重力加速度g，下落高度h=½gt²，速度v=gt。'
  },
  {
    id: 'momentum_formula', name: '动量公式', type: 'formula', category: '力学',
    keywords: ['动量', 'p=mv'],
    formula: 'p = mv',
    description: '动量等于质量与速度的乘积', color: '#55efc4',
    objectType: 'formula',
    properties: { '变量': 'm, v', '单位': 'kg·m/s' },
    summary: '动量公式p=mv，其中m为质量，v为速度。动量是矢量，方向与速度方向相同，是描述物体机械运动状态的物理量。'
  },
  {
    id: 'energy_conservation', name: '能量守恒定律', type: 'law', category: '能量',
    keywords: ['能量守恒', 'conservation of energy'],
    formula: 'E_总 = 常量',
    description: '系统总能量保持不变，能量只能转换形式', color: '#fdcb6e',
    objectType: 'law',
    properties: { '守恒量': '总能量', '适用条件': '孤立系统' },
    summary: '能量守恒定律指出在一个孤立系统中，能量既不能创生也不能消灭，只能从一种形式转化为另一种形式。系统总能量保持不变，是自然界最基本的定律之一。'
  },
  {
    id: 'momentum_conservation', name: '动量守恒定律', type: 'law', category: '力学',
    keywords: ['动量守恒', 'conservation of momentum'],
    formula: 'm₁v₁ + m₂v₂ = m₁v₁\' + m₂v₂\'',
    description: '系统不受外力时，总动量保持不变', color: '#55efc4',
    objectType: 'law',
    properties: { '守恒量': '总动量', '适用条件': '合外力为零' },
    summary: '动量守恒定律指出当系统不受外力或所受合外力为零时，系统总动量保持不变。该定律是自然界最普遍的定律之一，适用于宏观和微观系统。'
  },
  {
    id: 'newton_first', name: '牛顿第一定律', type: 'law', category: '力学',
    keywords: ['牛顿第一定律', '惯性定律'],
    formula: 'F=0 → v=常量',
    description: '物体不受外力时保持静止或匀速直线运动', color: '#d63031',
    objectType: 'law',
    properties: { '别名': '惯性定律', '提出者': '牛顿' },
    summary: '牛顿第一定律（惯性定律）指出一切物体在没有受到外力作用时，总保持静止或匀速直线运动状态。该定律揭示了物体的惯性属性。'
  },
  {
    id: 'newton_third', name: '牛顿第三定律', type: 'law', category: '力学',
    keywords: ['牛顿第三定律', '作用反作用'],
    formula: 'F₁₂ = -F₂₁',
    description: '作用力与反作用力大小相等，方向相反', color: '#e84393',
    objectType: 'law',
    properties: { '别名': '作用反作用定律', '提出者': '牛顿' },
    summary: '牛顿第三定律指出两个物体之间的作用力和反作用力总是大小相等、方向相反，作用在同一直线上。作用力与反作用力同时产生、同时消失。'
  },

  // ---------------- 运动学 ----------------
  {
    id: 'projectile_motion', name: '抛体运动', type: 'formula', category: '运动学',
    keywords: ['抛体运动', 'projectile motion', '平抛'],
    formula: 'x = v₀t, y = ½gt²',
    description: '物体具有初速度后仅受重力的运动', color: '#00b894',
    objectType: 'formula',
    properties: { '分量': '水平匀速,竖直匀变速', '轨迹': '抛物线' },
    summary: '抛体运动是物体具有初速度后仅在重力作用下的运动，可分解为水平匀速运动和竖直匀变速运动。运动轨迹为抛物线，水平方向不受力。'
  },
  {
    id: 'circular_motion', name: '圆周运动', type: 'formula', category: '运动学',
    keywords: ['圆周运动', 'circular motion'],
    formula: 'v = ωr, a = v²/r',
    description: '物体沿圆周路径的运动', color: '#00cec9',
    objectType: 'formula',
    properties: { '变量': 'v, ω, r', '向心加速度': 'a=v²/r' },
    summary: '圆周运动是物体沿圆形轨道的运动，匀速圆周运动中线速度大小不变但方向不断变化。向心加速度a=v²/r指向圆心，向心力提供向心加速度。'
  },
  {
    id: 'simple_harmonic_motion', name: '简谐振动', type: 'formula', category: '波动',
    keywords: ['简谐振动', 'simple harmonic motion', '振动'],
    formula: 'x = A sin(ωt + φ)',
    description: '物体在平衡位置附近做周期性往复运动', color: '#0984e3',
    objectType: 'formula',
    properties: { '回复力': 'F=-kx', '位移规律': '正弦/余弦' },
    summary: '简谐振动是物体在平衡位置附近做的周期性往复运动，回复力与位移成正比且方向相反。其位移随时间按正弦或余弦规律变化。'
  },
  {
    id: 'pendulum', name: '单摆', type: 'experiment', category: '力学',
    keywords: ['单摆', 'pendulum', '钟摆'],
    formula: 'T = 2π√(L/g)',
    description: '一个质点用细线悬挂后的摆动', color: '#74b9ff',
    objectType: 'experiment',
    properties: { '类型': '单摆', '周期公式': 'T=2π√(L/g)', '条件': '摆角<5°' },
    summary: '单摆是由一根不可伸长的细线下悬挂一个质点构成的系统。在小角度（小于5°）下，单摆做简谐振动，周期T=2π√(L/g)，与质量及振幅无关。'
  },
  {
    id: 'spring_mass', name: '弹簧振子', type: 'experiment', category: '力学',
    keywords: ['弹簧振子', 'spring', '弹簧'],
    formula: 'T = 2π√(m/k)',
    description: '弹簧连接质量在弹性限度内的振动', color: '#81ecec',
    objectType: 'experiment',
    properties: { '类型': '弹簧振子', '周期公式': 'T=2π√(m/k)', '条件': '弹性限度内' },
    summary: '弹簧振子是由弹簧和质量块组成的振动系统。在弹性限度内做简谐振动，周期T=2π√(m/k)，由振子质量和弹簧劲度系数决定。'
  },

  // ---------------- 电磁学 ----------------
  {
    id: 'charge', name: '电荷', type: 'concept', category: '电磁学',
    keywords: ['电荷', 'charge', '电'],
    description: '物质的基本属性，产生电磁现象', color: '#ffcc80',
    objectType: 'entity',
    properties: { '单位': '库仑(C)', '量纲': 'IT', '性质': '标量(有正负)' },
    summary: '电荷是物质的基本属性，产生电磁现象。电荷有正负之分，单位为库仑(C)。电荷守恒定律指出电荷既不能创生也不能消灭。'
  },
  {
    id: 'electric_field', name: '电场', type: 'concept', category: '电磁学',
    keywords: ['电场', 'electric field'],
    description: '电荷周围存在的特殊物质', color: '#ffb74d',
    objectType: 'entity',
    properties: { '单位': 'N/C 或 V/m', '性质': '矢量场' },
    summary: '电场是电荷周围存在的特殊物质，对放入其中的电荷产生电场力作用。电场强度是描述电场强弱的物理量，单位为N/C或V/m。'
  },
  {
    id: 'magnetic_field', name: '磁场', type: 'concept', category: '电磁学',
    keywords: ['磁场', 'magnetic field'],
    description: '运动电荷周围存在的场', color: '#ba68c8',
    objectType: 'entity',
    properties: { '单位': '特斯拉(T)', '性质': '矢量场' },
    summary: '磁场是运动电荷或电流周围存在的特殊物质，对放入其中的运动电荷或电流产生磁场力作用。磁感应强度是描述磁场强弱的物理量，单位为特斯拉(T)。'
  },
  {
    id: 'voltage', name: '电压', type: 'concept', category: '电磁学',
    keywords: ['电压', 'voltage', '电势差'],
    description: '单位正电荷在两点间移动时电场力做的功', color: '#e57373',
    objectType: 'entity',
    properties: { '单位': '伏特(V)', '别名': '电势差' },
    summary: '电压（电势差）是单位正电荷在两点间移动时电场力所做的功。电压是描述电场做功能力的物理量，单位为伏特(V)。'
  },
  {
    id: 'current', name: '电流', type: 'concept', category: '电磁学',
    keywords: ['电流', 'current'],
    description: '电荷的定向移动', color: '#f06292',
    objectType: 'entity',
    properties: { '单位': '安培(A)', '量纲': 'I', '方向': '正电荷移动方向' },
    summary: '电流是电荷的定向移动，方向规定为正电荷移动方向。电流强度是单位时间内通过导体横截面的电量，单位为安培(A)。'
  },
  {
    id: 'resistance', name: '电阻', type: 'concept', category: '电磁学',
    keywords: ['电阻', 'resistance'],
    description: '导体对电流的阻碍作用', color: '#ce93d8',
    objectType: 'entity',
    properties: { '单位': '欧姆(Ω)', '决定因素': '材料,长度,横截面积,温度' },
    summary: '电阻是导体对电流的阻碍作用，反映导体导电性能的物理量。电阻大小由导体材料、长度、横截面积和温度决定，单位为欧姆(Ω)。'
  },
  {
    id: 'ohm_law', name: '欧姆定律', type: 'law', category: '电磁学',
    keywords: ['欧姆定律', 'Ohm law'],
    formula: 'V = IR',
    description: '电压、电流与电阻的关系', color: '#e57373',
    objectType: 'law',
    properties: { '公式': 'V=IR', '变量': 'V, I, R', '提出者': '欧姆' },
    summary: '欧姆定律指出通过导体的电流与导体两端的电压成正比，与导体的电阻成反比，公式为V=IR。该定律是电路分析的基础。'
  },
  {
    id: 'coulomb_law', name: '库仑定律', type: 'law', category: '电磁学',
    keywords: ['库仑定律', 'Coulomb'],
    formula: 'F = kq₁q₂/r²',
    description: '两个点电荷间的相互作用力', color: '#ffcc80',
    objectType: 'law',
    properties: { '公式': 'F=kq₁q₂/r²', '变量': 'k, q₁, q₂, r', '提出者': '库仑' },
    summary: '库仑定律指出两个点电荷间的相互作用力与电荷量的乘积成正比，与距离的平方成反比，公式F=kq₁q₂/r²。同种电荷相斥，异种电荷相吸。'
  },
  {
    id: 'faraday', name: '法拉第电磁感应', type: 'law', category: '电磁学',
    keywords: ['法拉第', '电磁感应', 'Faraday'],
    formula: 'ε = -dΦ/dt',
    description: '磁通量变化产生感应电动势', color: '#ba68c8',
    objectType: 'law',
    properties: { '公式': 'ε=-dΦ/dt', '变量': 'Φ, t', '提出者': '法拉第' },
    summary: '法拉第电磁感应定律指出电路中感应电动势的大小与穿过电路的磁通量变化率成正比，公式ε=-dΦ/dt。该定律是发电机的工作原理。'
  },

  // ---------------- 光学 ----------------
  {
    id: 'light', name: '光', type: 'concept', category: '光学',
    keywords: ['光', 'light'],
    description: '电磁波谱中可见光部分', color: '#fff176',
    objectType: 'entity',
    properties: { '波长范围': '400-700nm', '本质': '电磁波', '速度': '3×10⁸m/s' },
    summary: '光是电磁波谱中人眼可见的部分，波长范围约400-700nm。光具有波粒二象性，在均匀介质中沿直线传播，速度约为3×10⁸m/s。'
  },
  {
    id: 'refraction', name: '折射', type: 'concept', category: '光学',
    keywords: ['折射', 'refraction'],
    description: '光通过不同介质时的偏折', color: '#81c784',
    objectType: 'entity',
    properties: { '现象': '光通过不同介质偏折', '规律': '斯涅尔定律' },
    summary: '折射是光从一种介质进入另一种介质时传播方向发生改变的现象。折射遵循斯涅尔定律，折射角与入射角的关系由两介质的折射率决定。'
  },
  {
    id: 'reflection', name: '反射', type: 'concept', category: '光学',
    keywords: ['反射', 'reflection'],
    description: '光遇到界面返回原介质', color: '#64b5f6',
    objectType: 'entity',
    properties: { '现象': '光遇界面返回原介质', '规律': '反射定律' },
    summary: '反射是光遇到界面时返回原介质的现象。反射遵循反射定律：入射角等于反射角，入射光线、反射光线和法线在同一平面内。'
  },
  {
    id: 'lens', name: '透镜', type: 'concept', category: '光学',
    keywords: ['透镜', 'lens', '镜片'],
    description: '利用折射原理成像的光学元件', color: '#4db6ac',
    objectType: 'entity',
    properties: { '类型': '凸透镜/凹透镜', '原理': '光的折射' },
    summary: '透镜是利用折射原理成像的光学元件，分为凸透镜和凹透镜。凸透镜对光有会聚作用，凹透镜对光有发散作用，广泛应用于眼镜、显微镜等。'
  },
  {
    id: 'snell_law', name: '斯涅尔定律', type: 'law', category: '光学',
    keywords: ['斯涅尔定律', 'Snell', '折射定律'],
    formula: 'n₁sinθ₁ = n₂sinθ₂',
    description: '光在界面发生折射时入射角与折射角的关系', color: '#81c784',
    objectType: 'law',
    properties: { '公式': 'n₁sinθ₁=n₂sinθ₂', '变量': 'n₁, θ₁, n₂, θ₂' },
    summary: '斯涅尔定律（折射定律）描述光在界面折射时入射角与折射角的关系：n₁sinθ₁=n₂sinθ₂，其中n为介质折射率，θ为与法线的夹角。'
  },
  {
    id: 'lens_formula', name: '透镜成像公式', type: 'formula', category: '光学',
    keywords: ['透镜公式', '成像'],
    formula: '1/f = 1/u + 1/v',
    description: '透镜焦距、物距与像距的关系', color: '#4db6ac',
    objectType: 'formula',
    properties: { '变量': 'f, u, v', '应用': '透镜成像分析' },
    summary: '透镜成像公式1/f=1/u+1/v描述了焦距f、物距u和像距v的关系。该公式是分析透镜成像规律的基本工具，配合放大率公式可确定像的性质。'
  },

  // ---------------- 热学 ----------------
  {
    id: 'temperature', name: '温度', type: 'concept', category: '热学',
    keywords: ['温度', 'temperature', '热'],
    description: '物体冷热程度的度量', color: '#ffab91',
    objectType: 'entity',
    properties: { '单位': '开尔文(K)', '性质': '标量', '本质': '分子热运动平均动能' },
    summary: '温度是物体冷热程度的度量，反映分子热运动平均动能的大小。温度的国际单位为开尔文(K)，常用单位还有摄氏度(°C)。'
  },
  {
    id: 'heat', name: '热量', type: 'concept', category: '热学',
    keywords: ['热量', 'heat'],
    description: '热传递过程中转移的能量', color: '#ff8a65',
    objectType: 'entity',
    properties: { '单位': '焦耳(J)', '方向': '高温→低温' },
    summary: '热量是热传递过程中转移的能量，从高温物体传向低温物体。热量的单位为焦耳(J)，比热容描述物质吸热或放热的能力。'
  },
  {
    id: 'thermodynamics_first', name: '热力学第一定律', type: 'law', category: '热学',
    keywords: ['热力学第一定律'],
    formula: 'ΔU = Q + W',
    description: '系统内能变化等于吸收热量与外界对系统做功之和', color: '#ffab91',
    objectType: 'law',
    properties: { '公式': 'ΔU=Q+W', '本质': '能量守恒在热学中的体现' },
    summary: '热力学第一定律指出系统内能的变化等于系统吸收的热量与外界对系统所做功之和，公式ΔU=Q+W。该定律是能量守恒在热学中的体现。'
  },
  {
    id: 'specific_heat', name: '比热容', type: 'concept', category: '热学',
    keywords: ['比热容', 'specific heat'],
    formula: 'Q = cmΔT',
    description: '单位质量物质温度升高1度所需热量', color: '#ff7043',
    objectType: 'formula',
    properties: { '公式': 'Q=cmΔT', '变量': 'c, m, ΔT', '水的比热容': '4.2×10³J/(kg·°C)' },
    summary: '比热容是单位质量物质温度升高1度所需的热量，公式Q=cmΔT。比热容是物质的特性，水的比热容较大，为4.2×10³J/(kg·°C)。'
  },

  // ---------------- 波动 ----------------
  {
    id: 'wave', name: '波', type: 'concept', category: '波动',
    keywords: ['波', 'wave', '波动'],
    description: '能量传递的一种形式', color: '#4fc3f7',
    objectType: 'entity',
    properties: { '分类': '机械波/电磁波', '本质': '能量传递' },
    summary: '波是能量传递的一种形式，分为机械波和电磁波。机械波需要介质传播，电磁波可在真空中传播。波的基本特征有波长、频率和振幅。'
  },
  {
    id: 'wavelength', name: '波长', type: 'concept', category: '波动',
    keywords: ['波长', 'wavelength'],
    description: '波在一个周期内传播的距离', color: '#81d4fa',
    objectType: 'entity',
    properties: { '单位': '米(m)', '定义': '相邻同相点间距' },
    summary: '波长是波在一个周期内传播的距离，即相邻两个同相点间的距离。波长的单位为米(m)，与频率和波速满足v=fλ的关系。'
  },
  {
    id: 'frequency', name: '频率', type: 'concept', category: '波动',
    keywords: ['频率', 'frequency'],
    description: '单位时间内波振动的次数', color: '#b3e5fc',
    objectType: 'entity',
    properties: { '单位': '赫兹(Hz)', '与周期关系': 'f=1/T' },
    summary: '频率是单位时间内波振动的次数，单位为赫兹(Hz)。频率与周期互为倒数，频率越高，波振动越快。'
  },
  {
    id: 'wave_equation', name: '波速公式', type: 'formula', category: '波动',
    keywords: ['波速', 'wave speed'],
    formula: 'v = fλ',
    description: '波速等于频率与波长的乘积', color: '#4fc3f7',
    objectType: 'formula',
    properties: { '公式': 'v=fλ', '变量': 'v, f, λ' },
    summary: '波速公式v=fλ描述了波速v、频率f和波长λ之间的关系。波速由介质决定，频率由波源决定，波长则由波速和频率共同决定。'
  },

  // ---------------- 科学家 ----------------
  {
    id: 'newton', name: '牛顿 (Newton)', type: 'scientist', category: '历史人物',
    keywords: ['牛顿', 'Newton'],
    description: '1643-1727，经典力学奠基人，提出牛顿三大定律和万有引力定律', color: '#ffd54f',
    objectType: 'person',
    properties: { '生卒': '1643-1727', '国籍': '英国', '主要贡献': '经典力学,万有引力' },
    summary: '牛顿（1643-1727），英国物理学家、数学家，经典力学奠基人。提出了牛顿三大运动定律和万有引力定律，著有《自然哲学的数学原理》。'
  },
  {
    id: 'einstein', name: '爱因斯坦 (Einstein)', type: 'scientist', category: '历史人物',
    keywords: ['爱因斯坦', 'Einstein'],
    description: '1879-1955，相对论创立者，提出质能方程', color: '#aed581',
    objectType: 'person',
    properties: { '生卒': '1879-1955', '国籍': '德国/美国', '主要贡献': '相对论,质能方程' },
    summary: '爱因斯坦（1879-1955），理论物理学家，相对论创立者。提出了狭义相对论和广义相对论，以及质能方程E=mc²，获1921年诺贝尔物理学奖。'
  },
  {
    id: 'ohm', name: '欧姆 (Ohm)', type: 'scientist', category: '历史人物',
    keywords: ['欧姆', 'Ohm'],
    description: '1789-1854，发现欧姆定律', color: '#e1bee7',
    objectType: 'person',
    properties: { '生卒': '1789-1854', '国籍': '德国', '主要贡献': '欧姆定律' },
    summary: '欧姆（1789-1854），德国物理学家，发现了欧姆定律，描述了电压、电流和电阻的关系。电阻的单位欧姆(Ω)以他的名字命名。'
  },
  {
    id: 'faraday_scientist', name: '法拉第 (Faraday)', type: 'scientist', category: '历史人物',
    keywords: ['法拉第', 'Faraday'],
    description: '1791-1867，发现电磁感应现象', color: '#b39ddb',
    objectType: 'person',
    properties: { '生卒': '1791-1867', '国籍': '英国', '主要贡献': '电磁感应' },
    summary: '法拉第（1791-1867），英国物理学家、化学家，发现了电磁感应现象，提出电场和磁场的概念。电容单位法拉第(F)以他的名字命名。'
  },
  {
    id: 'coulomb', name: '库仑 (Coulomb)', type: 'scientist', category: '历史人物',
    keywords: ['库仑', 'Coulomb'],
    description: '1736-1806，发现库仑定律', color: '#ffb74d',
    objectType: 'person',
    properties: { '生卒': '1736-1806', '国籍': '法国', '主要贡献': '库仑定律' },
    summary: '库仑（1736-1806），法国物理学家，发现了库仑定律，描述了电荷间相互作用力的规律。电荷单位库仑(C)以他的名字命名。'
  },
  {
    id: 'einstein_energy', name: '质能方程', type: 'formula', category: '现代物理',
    keywords: ['质能方程', 'E=mc²', 'E=mc2'],
    formula: 'E = mc²',
    description: '质量与能量的等价关系', color: '#aed581',
    objectType: 'formula',
    properties: { '公式': 'E=mc²', '变量': 'm, c', '提出者': '爱因斯坦' },
    summary: '质能方程E=mc²是爱因斯坦提出的质量与能量等价关系，指出质量和能量可以相互转化。该方程是核反应和粒子物理的基础。'
  },

  // ============================================================================
  // 新增定律/公式节点 (来自 engine.ts 中引用但原图谱缺失的物理定律)
  // ============================================================================

  {
    id: 'gravitational_law', name: '万有引力定律', type: 'law', category: '力学',
    keywords: ['万有引力定律', 'gravitational law', '引力', 'GMm'],
    formula: 'F = GMm/r²',
    description: '两物体间的引力与质量乘积成正比，与距离平方成反比',
    color: '#6c5ce7',
    objectType: 'law',
    properties: { '公式': 'F=GMm/r²', '变量': 'G, M, m, r', '提出者': '牛顿' },
    summary: '万有引力定律指出任何两个有质量的物体间都存在相互吸引的引力，引力大小与两物体质量乘积成正比，与距离平方成反比，公式F=GMm/r²。该定律由牛顿发现，是研究天体运动的基础。'
  },
  {
    id: 'centripetal_force', name: '向心力公式', type: 'formula', category: '力学',
    keywords: ['向心力', 'centripetal force', 'mv²/r'],
    formula: 'F = mv²/r',
    description: '匀速圆周运动所需的向心力',
    color: '#00cec9',
    objectType: 'formula',
    properties: { '公式': 'F=mv²/r', '变量': 'm, v, r', '方向': '指向圆心' },
    summary: '向心力公式F=mv²/r描述了物体做匀速圆周运动所需的向心力大小。向心力始终指向圆心，只改变速度方向不改变速度大小，由外界提供（如绳的拉力、万有引力等）。'
  },
  {
    id: 'hookes_law', name: '胡克定律', type: 'law', category: '力学',
    keywords: ['胡克定律', 'Hooke', '弹力', '-kx'],
    formula: 'F = -kx',
    description: '弹性限度内弹力与形变量成正比',
    color: '#81ecec',
    objectType: 'law',
    properties: { '公式': 'F=-kx', '变量': 'k, x', '条件': '弹性限度内', '提出者': '胡克' },
    summary: '胡克定律指出在弹性限度内，弹簧的弹力与形变量成正比且方向相反，公式F=-kx，其中k为劲度系数。该定律是研究弹簧振子和简谐振动的基础。'
  },
  {
    id: 'atwood_acceleration', name: '阿特伍德机加速度', type: 'formula', category: '力学',
    keywords: ['阿特伍德', 'atwood', '滑轮加速度'],
    formula: 'a = (m₁-m₂)g/(m₁+m₂)',
    description: '阿特伍德机中两物体的加速度',
    color: '#a29bfe',
    objectType: 'formula',
    properties: { '公式': 'a=(m₁-m₂)g/(m₁+m₂)', '变量': 'm₁, m₂, g', '推导自': '牛顿第二定律' },
    summary: '阿特伍德机加速度公式a=(m₁-m₂)g/(m₁+m₂)描述了通过轻绳跨过定滑轮连接的两物体的加速度。该公式由牛顿第二定律推导得到，常用于验证牛顿第二定律。'
  },
  {
    id: 'orbital_velocity', name: '轨道速度公式', type: 'formula', category: '力学',
    keywords: ['轨道速度', 'orbital velocity', '第一宇宙速度'],
    formula: 'v = √(GM/r)',
    description: '天体绕中心天体做圆周运动的线速度',
    color: '#fd79a8',
    objectType: 'formula',
    properties: { '公式': 'v=√(GM/r)', '变量': 'G, M, r', '推导自': '万有引力定律' },
    summary: '轨道速度公式v=√(GM/r)描述了天体绕中心天体做圆周运动所需的线速度。该公式由万有引力提供向心力推导得到，是计算卫星和行星轨道速度的基础。'
  },
  {
    id: 'elastic_collision_formula', name: '弹性碰撞速度公式', type: 'formula', category: '力学',
    keywords: ['弹性碰撞', 'elastic collision', '碰撞速度'],
    formula: 'v₁\'=((m₁-m₂)v₁+2m₂v₂)/(m₁+m₂)',
    description: '一维弹性碰撞后物体的速度',
    color: '#e17055',
    objectType: 'formula',
    properties: { '公式': 'v₁\'=((m₁-m₂)v₁+2m₂v₂)/(m₁+m₂)', '推导自': '动量守恒+动能守恒' },
    summary: '弹性碰撞速度公式v₁\'=((m₁-m₂)v₁+2m₂v₂)/(m₁+m₂)描述了一维弹性碰撞后物体的速度。该公式由动量守恒和动能守恒联立求解得到。'
  },

  // ============================================================================
  // Palantir Action 类型节点 (物理过程 / Operations)
  // type 字段使用 'formula' 以保持与旧类型系统 (concept/formula/law/experiment/unit/scientist) 兼容
  // ============================================================================

  {
    id: 'process_freefall', name: '自由落体过程', type: 'formula', category: '物理过程',
    keywords: ['自由落体过程', 'freefall process', '下落过程', 'process_freefall'],
    formula: 'h = ½gt², v = gt',
    description: '物体在仅受重力作用下从静止开始下落的物理过程',
    color: '#6c5ce7',
    objectType: 'process',
    properties: {
      '输入条件': '初速度为零,仅受重力作用',
      '守恒量': '机械能',
      '输出结果': '下落位移和速度随时间变化,h=½gt²,v=gt'
    },
    summary: '自由落体过程是物体在仅受重力作用下从静止开始下落的物理过程。该过程中加速度恒为重力加速度g，速度与时间成正比，位移与时间平方成正比。整个过程中机械能守恒，重力势能持续转化为动能。'
  },
  {
    id: 'process_pendulum', name: '单摆运动过程', type: 'formula', category: '物理过程',
    keywords: ['单摆运动过程', 'pendulum process', '摆动过程', 'process_pendulum'],
    formula: 'T = 2π√(L/g)',
    description: '摆球在重力和绳张力共同作用下做周期性摆动的过程',
    color: '#74b9ff',
    objectType: 'process',
    properties: {
      '输入条件': '摆角小于5°,仅受重力和绳张力',
      '守恒量': '机械能',
      '输出结果': '周期性摆动,周期T=2π√(L/g)'
    },
    summary: '单摆运动过程是摆球在重力和绳张力共同作用下做周期性摆动的过程。在小角度近似下，单摆的运动可视为简谐振动，其周期仅由摆长和重力加速度决定，与摆球质量及振幅无关。摆动过程中动能与重力势能相互转化，机械能守恒。'
  },
  {
    id: 'process_spring', name: '弹簧振子振动过程', type: 'formula', category: '物理过程',
    keywords: ['弹簧振子振动过程', 'spring process', '简谐振动过程', 'process_spring'],
    formula: 'T = 2π√(m/k)',
    description: '物体在弹簧弹性力作用下围绕平衡位置做简谐振动的过程',
    color: '#81ecec',
    objectType: 'process',
    properties: {
      '输入条件': '弹簧处于弹性限度内,受回复力F=-kx',
      '守恒量': '机械能(动能+弹性势能)',
      '输出结果': '简谐振动,周期T=2π√(m/k)'
    },
    summary: '弹簧振子振动过程是物体在弹簧弹性力作用下围绕平衡位置做简谐振动的过程。回复力与位移成正比且方向相反，满足胡克定律。振动周期由振子质量和弹簧劲度系数决定，过程中动能与弹性势能相互转化，机械能守恒。'
  },
  {
    id: 'process_projectile', name: '抛体运动过程', type: 'formula', category: '物理过程',
    keywords: ['抛体运动过程', 'projectile process', '平抛过程', 'process_projectile'],
    formula: 'x = v₀t, y = ½gt²',
    description: '物体具有初速度后仅在重力作用下的曲线运动过程',
    color: '#00b894',
    objectType: 'process',
    properties: {
      '输入条件': '具有初速度,仅受重力作用',
      '守恒量': '水平方向动量,机械能',
      '输出结果': '抛物线轨迹'
    },
    summary: '抛体运动过程是物体具有初速度后仅在重力作用下的曲线运动过程。运动可分解为水平方向的匀速直线运动和竖直方向的匀变速直线运动，轨迹为抛物线。整个过程中水平速度保持不变，机械能守恒。'
  },
  {
    id: 'process_ramp', name: '斜面下滑过程', type: 'formula', category: '物理过程',
    keywords: ['斜面下滑过程', 'ramp process', '斜面过程', 'process_ramp'],
    formula: 'a = g·sinθ',
    description: '物体在重力沿斜面分量作用下沿光滑斜面加速下滑的过程',
    color: '#fdcb6e',
    objectType: 'process',
    properties: {
      '输入条件': '光滑斜面,物体从静止释放',
      '守恒量': '机械能(光滑时)',
      '输出结果': '沿斜面匀加速下滑,a=gsinθ'
    },
    summary: '斜面下滑过程是物体在重力沿斜面分量作用下沿光滑斜面加速下滑的过程。下滑加速度为g·sinθ，与物体质量无关。过程中重力势能转化为动能，机械能守恒。若斜面有摩擦，则需考虑摩擦力做功导致机械能损失。'
  },
  {
    id: 'process_circular', name: '圆周运动过程', type: 'formula', category: '物理过程',
    keywords: ['圆周运动过程', 'circular process', '匀速圆周过程', 'process_circular'],
    formula: 'a = v²/r, F = mv²/r',
    description: '物体在向心力作用下沿圆形轨道做匀速运动的过程',
    color: '#00cec9',
    objectType: 'process',
    properties: {
      '输入条件': '向心力恒定,线速度大小不变',
      '守恒量': '动能',
      '输出结果': '匀速圆周运动,a=v²/r'
    },
    summary: '圆周运动过程是物体在向心力作用下沿圆形轨道做匀速运动的过程。向心力始终指向圆心，只改变速度方向不改变速度大小。向心加速度大小为v²/r，线速度、角速度和半径满足v=ωr的关系。匀速圆周运动中动能守恒。'
  },
  {
    id: 'process_collision', name: '弹性碰撞过程', type: 'formula', category: '物理过程',
    keywords: ['弹性碰撞过程', 'collision process', '碰撞过程', 'process_collision'],
    formula: 'm₁v₁ + m₂v₂ = m₁v₁\' + m₂v₂\'',
    description: '两个物体在碰撞中动量和动能同时守恒的相互作用过程',
    color: '#e17055',
    objectType: 'process',
    properties: {
      '输入条件': '系统不受外力,碰撞无动能损失',
      '守恒量': '动量,动能',
      '输出结果': '碰撞后两物体速度'
    },
    summary: '弹性碰撞过程是两个物体在碰撞中动量和动能同时守恒的相互作用过程。碰撞前后系统总动量保持不变，总动能也保持不变。一维弹性碰撞后的速度可由动量守恒和动能守恒联立求解得到。'
  },
  {
    id: 'process_atwood', name: '滑轮系统运动过程', type: 'formula', category: '物理过程',
    keywords: ['滑轮系统运动过程', 'atwood process', '阿特伍德过程', 'process_atwood'],
    formula: 'a = (m₁-m₂)g/(m₁+m₂)',
    description: '通过轻绳跨过定滑轮连接的两物体在重力差作用下加速运动的过程',
    color: '#a29bfe',
    objectType: 'process',
    properties: {
      '输入条件': '轻绳跨过定滑轮连接两物体',
      '守恒量': '机械能',
      '输出结果': '两物体加速度a=(m₁-m₂)g/(m₁+m₂)'
    },
    summary: '滑轮系统运动过程是通过轻绳跨过定滑轮连接的两物体在重力差作用下加速运动的过程。两物体加速度大小相等方向相反，加速度为(m₁-m₂)g/(m₁+m₂)。过程中系统机械能守恒，重力势能转化为动能。'
  },
  {
    id: 'process_orbital', name: '轨道运动过程', type: 'formula', category: '物理过程',
    keywords: ['轨道运动过程', 'orbital process', '天体运动过程', 'process_orbital'],
    formula: 'v = √(GM/r)',
    description: '天体在万有引力提供向心力作用下沿轨道做圆周运动的过程',
    color: '#fd79a8',
    objectType: 'process',
    properties: {
      '输入条件': '万有引力提供向心力',
      '守恒量': '机械能,角动量',
      '输出结果': '圆周轨道运动,v=√(GM/r)'
    },
    summary: '轨道运动过程是天体在万有引力提供向心力作用下沿轨道做圆周运动的过程。万有引力完全提供向心力，轨道速度为√(GM/r)。开普勒定律描述了行星运动的规律，轨道运行中机械能和角动量均守恒。'
  },
  {
    id: 'process_energy_transfer', name: '能量转换过程', type: 'formula', category: '物理过程',
    keywords: ['能量转换过程', 'energy transfer process', '能量转化', 'process_energy_transfer'],
    formula: 'E_k + E_p = 常量',
    description: '动能与势能相互转化的物理过程',
    color: '#fdcb6e',
    objectType: 'process',
    properties: {
      '输入条件': '存在保守力做功',
      '守恒量': '总机械能(理想情况)',
      '输出结果': '动能与势能相互转化'
    },
    summary: '能量转换过程是动能与势能相互转化的物理过程。在只有保守力（如重力、弹性力）做功的情况下，系统机械能守恒，动能和势能此消彼长。该过程是理解各种力学实验中能量变化规律的核心。'
  },
  {
    id: 'process_force_action', name: '力的作用过程', type: 'formula', category: '物理过程',
    keywords: ['力的作用过程', 'force action process', '力作用过程', 'process_force_action'],
    formula: 'F = ma',
    description: '力改变物体运动状态或产生形变的过程',
    color: '#ff6b6b',
    objectType: 'process',
    properties: {
      '输入条件': '物体受到合外力作用',
      '守恒量': '动量(若合外力为零)',
      '输出结果': '产生加速度或形变'
    },
    summary: '力的作用过程是力改变物体运动状态或产生形变的过程。根据牛顿第二定律，合外力使物体产生加速度，改变其速度；根据牛顿第三定律，作用力与反作用力同时存在。力的作用是力学实验中最基本的过程。'
  }
];

// ============================================================================
// 知识图谱关系 (Palantir Links)
// relation 字段保留中文描述以向后兼容, linkType 为 Palantir 链接分类
// ============================================================================

export const PHYSICS_EDGES: KnowledgeEdge[] = [
  // ---------------- 力学核心关系 ----------------
  { source: 'force', target: 'mass', relation: '作用于', weight: 0.9, linkType: 'applies_to' },
  { source: 'force', target: 'acceleration', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'newton_second', target: 'force', relation: '定义', weight: 1.0, linkType: 'defines' },
  { source: 'newton_second', target: 'mass', relation: '涉及', weight: 1.0, linkType: 'relates_to' },
  { source: 'newton_second', target: 'acceleration', relation: '涉及', weight: 1.0, linkType: 'relates_to' },
  { source: 'acceleration', target: 'velocity', relation: '变化率', weight: 0.8, linkType: 'derived_from' },
  { source: 'velocity', target: 'displacement', relation: '变化率', weight: 0.8, linkType: 'derived_from' },
  { source: 'velocity', target: 'time', relation: '与...相关', weight: 0.7, linkType: 'relates_to' },
  { source: 'displacement', target: 'time', relation: '与...相关', weight: 0.7, linkType: 'relates_to' },
  { source: 'mass', target: 'energy', relation: '具有', weight: 0.8, linkType: 'relates_to' },
  { source: 'energy', target: 'kinetic_energy', relation: '包含', weight: 1.0, linkType: 'part_of' },
  { source: 'energy', target: 'potential_energy', relation: '包含', weight: 1.0, linkType: 'part_of' },
  { source: 'kinetic_energy_formula', target: 'kinetic_energy', relation: '计算', weight: 1.0, linkType: 'defines' },
  { source: 'kinetic_energy_formula', target: 'mass', relation: '涉及', weight: 0.8, linkType: 'relates_to' },
  { source: 'kinetic_energy_formula', target: 'velocity', relation: '涉及', weight: 0.8, linkType: 'relates_to' },
  { source: 'potential_energy_formula', target: 'potential_energy', relation: '计算', weight: 1.0, linkType: 'defines' },
  { source: 'potential_energy_formula', target: 'gravity', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  { source: 'potential_energy_formula', target: 'mass', relation: '涉及', weight: 0.8, linkType: 'relates_to' },
  { source: 'energy_conservation', target: 'energy', relation: '描述', weight: 1.0, linkType: 'governs' },
  { source: 'energy_conservation', target: 'kinetic_energy', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  { source: 'energy_conservation', target: 'potential_energy', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  { source: 'gravity', target: 'force', relation: '属于', weight: 0.9, linkType: 'part_of' },
  { source: 'free_fall', target: 'gravity', relation: '由于', weight: 1.0, linkType: 'derived_from' },
  { source: 'free_fall', target: 'acceleration', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'free_fall', target: 'displacement', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'free_fall', target: 'velocity', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'momentum_formula', target: 'momentum', relation: '定义', weight: 1.0, linkType: 'defines' },
  { source: 'momentum_formula', target: 'mass', relation: '涉及', weight: 0.8, linkType: 'relates_to' },
  { source: 'momentum_formula', target: 'velocity', relation: '涉及', weight: 0.8, linkType: 'relates_to' },
  { source: 'momentum_conservation', target: 'momentum', relation: '描述', weight: 1.0, linkType: 'governs' },
  { source: 'momentum', target: 'velocity', relation: '与...相关', weight: 0.9, linkType: 'relates_to' },
  { source: 'momentum', target: 'mass', relation: '与...相关', weight: 0.9, linkType: 'relates_to' },
  { source: 'friction', target: 'force', relation: '属于', weight: 0.7, linkType: 'part_of' },
  { source: 'newton_first', target: 'force', relation: '描述', weight: 0.9, linkType: 'governs' },
  { source: 'newton_first', target: 'velocity', relation: '描述', weight: 0.8, linkType: 'governs' },
  { source: 'newton_third', target: 'force', relation: '描述', weight: 0.9, linkType: 'governs' },
  { source: 'newton', target: 'newton_first', relation: '发现', weight: 1.0, linkType: 'discovered_by' },
  { source: 'newton', target: 'newton_second', relation: '发现', weight: 1.0, linkType: 'discovered_by' },
  { source: 'newton', target: 'newton_third', relation: '发现', weight: 1.0, linkType: 'discovered_by' },

  // ---------------- 运动学关系 ----------------
  { source: 'projectile_motion', target: 'velocity', relation: '具有', weight: 0.9, linkType: 'relates_to' },
  { source: 'projectile_motion', target: 'gravity', relation: '受...作用', weight: 0.9, linkType: 'applies_to' },
  { source: 'projectile_motion', target: 'displacement', relation: '产生', weight: 0.8, linkType: 'produces' },
  { source: 'circular_motion', target: 'velocity', relation: '具有', weight: 0.9, linkType: 'relates_to' },
  { source: 'circular_motion', target: 'acceleration', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'simple_harmonic_motion', target: 'displacement', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'simple_harmonic_motion', target: 'velocity', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'pendulum', target: 'simple_harmonic_motion', relation: '属于', weight: 1.0, linkType: 'part_of' },
  { source: 'pendulum', target: 'gravity', relation: '受...作用', weight: 0.9, linkType: 'applies_to' },
  { source: 'spring_mass', target: 'simple_harmonic_motion', relation: '属于', weight: 1.0, linkType: 'part_of' },
  { source: 'spring_mass', target: 'mass', relation: '具有', weight: 0.9, linkType: 'relates_to' },
  { source: 'spring_mass', target: 'energy', relation: '涉及', weight: 0.8, linkType: 'relates_to' },

  // ---------------- 电磁学关系 ----------------
  { source: 'charge', target: 'electric_field', relation: '产生', weight: 1.0, linkType: 'produces' },
  { source: 'charge', target: 'current', relation: '流动形成', weight: 0.9, linkType: 'produces' },
  { source: 'current', target: 'magnetic_field', relation: '产生', weight: 1.0, linkType: 'produces' },
  { source: 'voltage', target: 'current', relation: '驱动', weight: 0.9, linkType: 'applies_to' },
  { source: 'voltage', target: 'electric_field', relation: '与...相关', weight: 0.9, linkType: 'relates_to' },
  { source: 'resistance', target: 'current', relation: '阻碍', weight: 0.9, linkType: 'applies_to' },
  { source: 'ohm_law', target: 'voltage', relation: '涉及', weight: 1.0, linkType: 'relates_to' },
  { source: 'ohm_law', target: 'current', relation: '涉及', weight: 1.0, linkType: 'relates_to' },
  { source: 'ohm_law', target: 'resistance', relation: '涉及', weight: 1.0, linkType: 'relates_to' },
  { source: 'ohm', target: 'ohm_law', relation: '发现', weight: 1.0, linkType: 'discovered_by' },
  { source: 'coulomb_law', target: 'charge', relation: '描述', weight: 1.0, linkType: 'governs' },
  { source: 'coulomb_law', target: 'force', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  { source: 'coulomb', target: 'coulomb_law', relation: '发现', weight: 1.0, linkType: 'discovered_by' },
  { source: 'faraday', target: 'magnetic_field', relation: '研究', weight: 0.9, linkType: 'relates_to' },
  { source: 'faraday', target: 'current', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'faraday_scientist', target: 'faraday', relation: '发现', weight: 1.0, linkType: 'discovered_by' },

  // ---------------- 光学关系 ----------------
  { source: 'light', target: 'refraction', relation: '发生', weight: 0.9, linkType: 'produces' },
  { source: 'light', target: 'reflection', relation: '发生', weight: 0.9, linkType: 'produces' },
  { source: 'lens', target: 'refraction', relation: '利用', weight: 1.0, linkType: 'relates_to' },
  { source: 'snell_law', target: 'refraction', relation: '描述', weight: 1.0, linkType: 'governs' },
  { source: 'lens_formula', target: 'lens', relation: '描述', weight: 1.0, linkType: 'governs' },
  { source: 'light', target: 'wave', relation: '具有...性质', weight: 0.8, linkType: 'relates_to' },

  // ---------------- 热学关系 ----------------
  { source: 'temperature', target: 'heat', relation: '与...相关', weight: 0.9, linkType: 'relates_to' },
  { source: 'heat', target: 'energy', relation: '属于', weight: 0.9, linkType: 'part_of' },
  { source: 'thermodynamics_first', target: 'heat', relation: '描述', weight: 1.0, linkType: 'governs' },
  { source: 'thermodynamics_first', target: 'energy', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  { source: 'specific_heat', target: 'temperature', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  { source: 'specific_heat', target: 'heat', relation: '涉及', weight: 0.9, linkType: 'relates_to' },

  // ---------------- 波动关系 ----------------
  { source: 'wave', target: 'wavelength', relation: '具有', weight: 1.0, linkType: 'relates_to' },
  { source: 'wave', target: 'frequency', relation: '具有', weight: 1.0, linkType: 'relates_to' },
  { source: 'wave_equation', target: 'wave', relation: '描述', weight: 1.0, linkType: 'governs' },
  { source: 'wave_equation', target: 'wavelength', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  { source: 'wave_equation', target: 'frequency', relation: '涉及', weight: 0.9, linkType: 'relates_to' },

  // ---------------- 现代物理 ----------------
  { source: 'einstein_energy', target: 'energy', relation: '等价', weight: 1.0, linkType: 'transforms_to' },
  { source: 'einstein_energy', target: 'mass', relation: '涉及', weight: 1.0, linkType: 'relates_to' },
  { source: 'einstein', target: 'einstein_energy', relation: '发现', weight: 1.0, linkType: 'discovered_by' },

  // ---------------- 新增定律/公式节点的关系 ----------------
  // 万有引力定律
  { source: 'gravitational_law', target: 'force', relation: '定义', weight: 1.0, linkType: 'defines' },
  { source: 'gravitational_law', target: 'mass', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  { source: 'gravitational_law', target: 'gravity', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  { source: 'newton', target: 'gravitational_law', relation: '发现', weight: 1.0, linkType: 'discovered_by' },
  // 向心力公式
  { source: 'centripetal_force', target: 'force', relation: '定义', weight: 1.0, linkType: 'defines' },
  { source: 'centripetal_force', target: 'circular_motion', relation: '定义', weight: 1.0, linkType: 'defines' },
  { source: 'centripetal_force', target: 'velocity', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  { source: 'centripetal_force', target: 'mass', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  // 胡克定律
  { source: 'hookes_law', target: 'force', relation: '定义', weight: 1.0, linkType: 'defines' },
  { source: 'hookes_law', target: 'spring_mass', relation: '描述', weight: 1.0, linkType: 'governs' },
  { source: 'hookes_law', target: 'simple_harmonic_motion', relation: '由于', weight: 1.0, linkType: 'derived_from' },
  // 阿特伍德机加速度
  { source: 'atwood_acceleration', target: 'newton_second', relation: '由于', weight: 1.0, linkType: 'derived_from' },
  { source: 'atwood_acceleration', target: 'gravity', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  { source: 'atwood_acceleration', target: 'mass', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  // 轨道速度公式
  { source: 'orbital_velocity', target: 'gravitational_law', relation: '由于', weight: 1.0, linkType: 'derived_from' },
  { source: 'orbital_velocity', target: 'circular_motion', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  { source: 'orbital_velocity', target: 'velocity', relation: '定义', weight: 1.0, linkType: 'defines' },
  // 弹性碰撞速度公式
  { source: 'elastic_collision_formula', target: 'momentum_conservation', relation: '由于', weight: 1.0, linkType: 'derived_from' },
  { source: 'elastic_collision_formula', target: 'energy_conservation', relation: '涉及', weight: 0.9, linkType: 'relates_to' },
  { source: 'elastic_collision_formula', target: 'momentum', relation: '涉及', weight: 0.9, linkType: 'relates_to' },

  // ---------------- 过程节点 (Palantir Actions) 的链接 ----------------
  // 自由落体过程
  { source: 'process_freefall', target: 'free_fall', relation: '支配', weight: 1.0, linkType: 'governs' },
  { source: 'process_freefall', target: 'gravity', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_freefall', target: 'energy_conservation', relation: '守恒', weight: 1.0, linkType: 'conserves' },
  { source: 'process_freefall', target: 'kinetic_energy', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'process_freefall', target: 'potential_energy', relation: '转化为', weight: 0.9, linkType: 'transforms_to' },
  { source: 'process_freefall', target: 'acceleration', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'process_freefall', target: 'process_energy_transfer', relation: '属于', weight: 0.8, linkType: 'part_of' },

  // 单摆运动过程
  { source: 'process_pendulum', target: 'pendulum', relation: '支配', weight: 1.0, linkType: 'governs' },
  { source: 'process_pendulum', target: 'simple_harmonic_motion', relation: '支配', weight: 1.0, linkType: 'governs' },
  { source: 'process_pendulum', target: 'gravity', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_pendulum', target: 'energy_conservation', relation: '守恒', weight: 1.0, linkType: 'conserves' },
  { source: 'process_pendulum', target: 'kinetic_energy', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'process_pendulum', target: 'potential_energy', relation: '转化为', weight: 0.9, linkType: 'transforms_to' },
  { source: 'process_pendulum', target: 'process_energy_transfer', relation: '属于', weight: 0.8, linkType: 'part_of' },

  // 弹簧振子振动过程
  { source: 'process_spring', target: 'spring_mass', relation: '支配', weight: 1.0, linkType: 'governs' },
  { source: 'process_spring', target: 'simple_harmonic_motion', relation: '支配', weight: 1.0, linkType: 'governs' },
  { source: 'process_spring', target: 'hookes_law', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_spring', target: 'energy_conservation', relation: '守恒', weight: 1.0, linkType: 'conserves' },
  { source: 'process_spring', target: 'kinetic_energy', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'process_spring', target: 'potential_energy', relation: '转化为', weight: 0.9, linkType: 'transforms_to' },
  { source: 'process_spring', target: 'process_energy_transfer', relation: '属于', weight: 0.8, linkType: 'part_of' },

  // 抛体运动过程
  { source: 'process_projectile', target: 'projectile_motion', relation: '支配', weight: 1.0, linkType: 'governs' },
  { source: 'process_projectile', target: 'gravity', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_projectile', target: 'energy_conservation', relation: '守恒', weight: 1.0, linkType: 'conserves' },
  { source: 'process_projectile', target: 'velocity', relation: '适用于', weight: 0.9, linkType: 'applies_to' },
  { source: 'process_projectile', target: 'kinetic_energy', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'process_projectile', target: 'potential_energy', relation: '转化为', weight: 0.9, linkType: 'transforms_to' },
  { source: 'process_projectile', target: 'process_energy_transfer', relation: '属于', weight: 0.8, linkType: 'part_of' },

  // 斜面下滑过程
  { source: 'process_ramp', target: 'newton_second', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_ramp', target: 'gravity', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_ramp', target: 'energy_conservation', relation: '守恒', weight: 1.0, linkType: 'conserves' },
  { source: 'process_ramp', target: 'friction', relation: '涉及', weight: 0.8, linkType: 'relates_to' },
  { source: 'process_ramp', target: 'acceleration', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'process_ramp', target: 'kinetic_energy', relation: '产生', weight: 0.9, linkType: 'produces' },
  { source: 'process_ramp', target: 'potential_energy', relation: '转化为', weight: 0.9, linkType: 'transforms_to' },
  { source: 'process_ramp', target: 'process_energy_transfer', relation: '属于', weight: 0.8, linkType: 'part_of' },

  // 圆周运动过程
  { source: 'process_circular', target: 'circular_motion', relation: '支配', weight: 1.0, linkType: 'governs' },
  { source: 'process_circular', target: 'centripetal_force', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_circular', target: 'force', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_circular', target: 'velocity', relation: '适用于', weight: 0.9, linkType: 'applies_to' },
  { source: 'process_circular', target: 'acceleration', relation: '产生', weight: 0.9, linkType: 'produces' },

  // 弹性碰撞过程
  { source: 'process_collision', target: 'momentum_conservation', relation: '守恒', weight: 1.0, linkType: 'conserves' },
  { source: 'process_collision', target: 'energy_conservation', relation: '守恒', weight: 1.0, linkType: 'conserves' },
  { source: 'process_collision', target: 'momentum', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_collision', target: 'elastic_collision_formula', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_collision', target: 'velocity', relation: '适用于', weight: 0.9, linkType: 'applies_to' },
  { source: 'process_collision', target: 'mass', relation: '适用于', weight: 0.8, linkType: 'applies_to' },

  // 滑轮系统运动过程
  { source: 'process_atwood', target: 'atwood_acceleration', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_atwood', target: 'newton_second', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_atwood', target: 'gravity', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_atwood', target: 'energy_conservation', relation: '守恒', weight: 1.0, linkType: 'conserves' },
  { source: 'process_atwood', target: 'mass', relation: '适用于', weight: 0.9, linkType: 'applies_to' },
  { source: 'process_atwood', target: 'process_energy_transfer', relation: '属于', weight: 0.8, linkType: 'part_of' },

  // 轨道运动过程
  { source: 'process_orbital', target: 'gravitational_law', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_orbital', target: 'orbital_velocity', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_orbital', target: 'circular_motion', relation: '支配', weight: 1.0, linkType: 'governs' },
  { source: 'process_orbital', target: 'centripetal_force', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_orbital', target: 'energy_conservation', relation: '守恒', weight: 1.0, linkType: 'conserves' },
  { source: 'process_orbital', target: 'process_circular', relation: '属于', weight: 0.8, linkType: 'part_of' },

  // 能量转换过程
  { source: 'process_energy_transfer', target: 'energy_conservation', relation: '守恒', weight: 1.0, linkType: 'conserves' },
  { source: 'process_energy_transfer', target: 'kinetic_energy', relation: '转化为', weight: 1.0, linkType: 'transforms_to' },
  { source: 'process_energy_transfer', target: 'potential_energy', relation: '转化为', weight: 1.0, linkType: 'transforms_to' },
  { source: 'process_energy_transfer', target: 'energy', relation: '属于', weight: 0.9, linkType: 'part_of' },

  // 力的作用过程
  { source: 'process_force_action', target: 'newton_second', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_force_action', target: 'newton_first', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_force_action', target: 'newton_third', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_force_action', target: 'force', relation: '适用于', weight: 1.0, linkType: 'applies_to' },
  { source: 'process_force_action', target: 'acceleration', relation: '产生', weight: 0.9, linkType: 'produces' }
];

// ============================================================================
// 完整知识图谱
// ============================================================================

export const PHYSICS_KNOWLEDGE_GRAPH: KnowledgeGraph = {
  nodes: PHYSICS_NODES,
  edges: PHYSICS_EDGES
};

// ============================================================================
// 实验场景 → 知识节点映射 (Scene Knowledge Mapping)
// 将实验场景类型映射到核心知识节点 / 过程节点 / 适用定律 / 关键概念
// ============================================================================

export const EXPERIMENT_KNOWLEDGE_MAP: Record<string, {
  primaryNodes: string[];    // 核心知识节点
  processNodes: string[];    // 相关过程节点 (Palantir Actions)
  laws: string[];            // 适用定律/公式
  concepts: string[];        // 关键概念
}> = {
  freefall: {
    primaryNodes: ['free_fall', 'gravity', 'acceleration', 'velocity', 'displacement'],
    processNodes: ['process_freefall', 'process_energy_transfer', 'process_force_action'],
    laws: ['newton_second', 'energy_conservation'],
    concepts: ['force', 'mass', 'kinetic_energy', 'potential_energy']
  },
  pendulum: {
    primaryNodes: ['pendulum', 'simple_harmonic_motion', 'gravity'],
    processNodes: ['process_pendulum', 'process_energy_transfer'],
    laws: ['energy_conservation'],
    concepts: ['kinetic_energy', 'potential_energy', 'velocity', 'displacement']
  },
  spring: {
    primaryNodes: ['spring_mass', 'simple_harmonic_motion'],
    processNodes: ['process_spring', 'process_energy_transfer'],
    laws: ['hookes_law', 'energy_conservation'],
    concepts: ['force', 'mass', 'kinetic_energy', 'potential_energy']
  },
  projectile: {
    primaryNodes: ['projectile_motion', 'velocity', 'gravity', 'displacement'],
    processNodes: ['process_projectile', 'process_energy_transfer'],
    laws: ['newton_second', 'energy_conservation'],
    concepts: ['acceleration', 'kinetic_energy', 'potential_energy']
  },
  ramp: {
    primaryNodes: ['free_fall', 'gravity', 'acceleration'],
    processNodes: ['process_ramp', 'process_energy_transfer', 'process_force_action'],
    laws: ['newton_second', 'energy_conservation'],
    concepts: ['force', 'mass', 'friction', 'velocity', 'displacement']
  },
  circular: {
    primaryNodes: ['circular_motion', 'velocity', 'acceleration', 'force'],
    processNodes: ['process_circular'],
    laws: ['centripetal_force', 'newton_second'],
    concepts: ['mass', 'momentum']
  },
  collision: {
    primaryNodes: ['momentum', 'velocity', 'mass'],
    processNodes: ['process_collision', 'process_force_action'],
    laws: ['momentum_conservation', 'energy_conservation', 'elastic_collision_formula'],
    concepts: ['force', 'kinetic_energy']
  },
  angled_projectile: {
    primaryNodes: ['projectile_motion', 'velocity', 'gravity', 'displacement'],
    processNodes: ['process_projectile', 'process_energy_transfer'],
    laws: ['newton_second', 'energy_conservation'],
    concepts: ['acceleration', 'kinetic_energy', 'potential_energy']
  },
  atwood: {
    primaryNodes: ['gravity', 'mass', 'acceleration'],
    processNodes: ['process_atwood', 'process_energy_transfer', 'process_force_action'],
    laws: ['atwood_acceleration', 'newton_second', 'energy_conservation'],
    concepts: ['force', 'velocity', 'kinetic_energy', 'potential_energy']
  },
  orbital: {
    primaryNodes: ['circular_motion', 'velocity', 'gravity'],
    processNodes: ['process_orbital', 'process_circular'],
    laws: ['gravitational_law', 'orbital_velocity', 'centripetal_force', 'energy_conservation'],
    concepts: ['force', 'mass', 'momentum']
  },
  // --- 新增10个实验场景的知识映射 ---
  uniform_acceleration: {
    primaryNodes: ['free_fall', 'gravity', 'acceleration', 'velocity', 'displacement'],
    processNodes: ['process_force_action'],
    laws: ['newton_second', 'energy_conservation'],
    concepts: ['force', 'mass', 'kinetic_energy']
  },
  damped_oscillation: {
    primaryNodes: ['spring_mass', 'simple_harmonic_motion'],
    processNodes: ['process_spring', 'process_energy_transfer'],
    laws: ['hookes_law', 'energy_conservation'],
    concepts: ['force', 'mass', 'kinetic_energy', 'potential_energy']
  },
  lorentz_force: {
    primaryNodes: ['circular_motion', 'velocity', 'charge', 'magnetic_field'],
    processNodes: ['process_circular', 'process_force_action'],
    laws: ['newton_second', 'centripetal_force'],
    concepts: ['force', 'mass', 'momentum']
  },
  rc_circuit: {
    primaryNodes: ['charge', 'electric_field', 'ohm_law'],
    processNodes: ['process_force_action'],
    laws: ['ohm_law'],
    concepts: ['frequency', 'heat']
  },
  light_refraction: {
    primaryNodes: ['light', 'refraction', 'snell_law'],
    processNodes: [],
    laws: ['snell_law'],
    concepts: ['light', 'refraction']
  },
  isothermal_expansion: {
    primaryNodes: ['temperature', 'heat', 'thermodynamics_first'],
    processNodes: ['process_energy_transfer'],
    laws: ['thermodynamics_first', 'energy_conservation'],
    concepts: ['temperature', 'heat', 'force']
  },
  wave_propagation: {
    primaryNodes: ['wave', 'wavelength', 'frequency'],
    processNodes: [],
    laws: ['wave_equation'],
    concepts: ['wave', 'wavelength', 'frequency', 'velocity', 'displacement']
  },
  ballistic_pendulum: {
    primaryNodes: ['momentum', 'velocity', 'mass', 'pendulum'],
    processNodes: ['process_collision', 'process_pendulum', 'process_energy_transfer'],
    laws: ['momentum_conservation', 'energy_conservation'],
    concepts: ['force', 'kinetic_energy', 'potential_energy']
  },
  binary_star: {
    primaryNodes: ['circular_motion', 'velocity', 'gravity', 'mass'],
    processNodes: ['process_orbital', 'process_circular'],
    laws: ['gravitational_law', 'orbital_velocity', 'centripetal_force', 'momentum_conservation'],
    concepts: ['force', 'momentum']
  },
  elevator_physics: {
    primaryNodes: ['gravity', 'acceleration', 'velocity', 'mass'],
    processNodes: ['process_force_action'],
    laws: ['newton_second', 'energy_conservation'],
    concepts: ['force', 'mass', 'kinetic_energy', 'potential_energy']
  }
};

// ============================================================================
// 工具函数
// ============================================================================

/** 根据关键词搜索相关节点 */
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

/** 获取与给定节点相关的所有节点（构建子图） */
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

/** 根据实验类型获取推荐知识图谱 */
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

/**
 * 根据实验场景类型获取知识图谱
 * 基于 EXPERIMENT_KNOWLEDGE_MAP 精确映射, 优先返回与场景强相关的子图;
 * 若场景未在映射表中, 则回退到按实验大类提取。
 */
export function getKnowledgeForScene(sceneType: string): KnowledgeGraph {
  const mapping = EXPERIMENT_KNOWLEDGE_MAP[sceneType];
  if (!mapping) return getKnowledgeForExperimentType('mechanics');
  const allIds = [
    ...mapping.primaryNodes,
    ...mapping.processNodes,
    ...mapping.laws,
    ...mapping.concepts
  ];
  return getSubgraph(allIds, 2);
}
