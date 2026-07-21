package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Node 4 - Physics Law Matcher.
 *
 * <p>Matches applicable physics laws and formulas based on the detected
 * scene type (set by Node 3).</p>
 */
@Component
public class PhysicsLawMatcherNode implements WorkflowNode {

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            4, "physics_law_matcher", "定律匹配", "匹配适用的物理定律和公式");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        String sceneType = context.getSceneType() == null ? "freefall" : context.getSceneType();
        context.setPhysicsLaws(lawsForScene(sceneType));
    }

    private List<String> lawsForScene(String sceneType) {
        switch (sceneType) {
            case "freefall":
                return Arrays.asList("牛顿第二定律", "自由落体运动");
            case "pendulum":
                return Arrays.asList("牛顿第二定律", "能量守恒定律");
            case "spring":
                return Arrays.asList("牛顿第二定律", "胡克定律", "能量守恒定律");
            case "projectile":
                return Arrays.asList("牛顿第二定律", "抛体运动");
            case "ramp":
                return Arrays.asList("牛顿第二定律");
            case "circular":
                return Arrays.asList("牛顿第二定律", "向心力公式");
            case "collision":
                return Arrays.asList("动量守恒定律", "能量守恒定律");
            case "angled_projectile":
                return Arrays.asList("牛顿第二定律", "抛体运动");
            case "atwood":
                return Arrays.asList("牛顿第二定律");
            case "orbital":
                return Arrays.asList("万有引力定律", "能量守恒定律", "向心力公式");
            // 新增10个实验类型
            case "uniform_acceleration":
                return Arrays.asList("牛顿第二定律", "匀加速直线运动");
            case "damped_oscillation":
                return Arrays.asList("牛顿第二定律", "胡克定律", "阻尼振动方程");
            case "ballistic_pendulum":
                return Arrays.asList("动量守恒定律", "能量守恒定律");
            case "binary_star":
                return Arrays.asList("万有引力定律", "向心力公式", "角动量守恒");
            case "elevator_physics":
                return Arrays.asList("牛顿第二定律", "超重失重原理");
            case "lorentz_force":
                return Arrays.asList("洛伦兹力公式", "牛顿第二定律", "向心力公式");
            case "rc_circuit":
                return Arrays.asList("基尔霍夫定律", "RC电路充放电方程");
            case "light_refraction":
                return Arrays.asList("斯涅尔定律", "光的折射定律");
            case "isothermal_expansion":
                return Arrays.asList("玻意耳定律", "理想气体状态方程", "热力学第一定律");
            case "wave_propagation":
                return Arrays.asList("波动方程", "波长频率关系");
            // 5个全新实验类型
            case "buoyancy":
                return Arrays.asList("阿基米德原理", "浮力定律", "牛顿第二定律");
            case "doppler_effect":
                return Arrays.asList("多普勒效应公式", "声波传播原理");
            case "double_slit":
                return Arrays.asList("杨氏双缝干涉", "光的波动性", "光程差公式");
            case "electromagnetic_induction":
                return Arrays.asList("法拉第电磁感应定律", "楞次定律");
            case "rocket_propulsion":
                return Arrays.asList("动量守恒定律", "牛顿第三定律", "齐奥尔科夫斯基公式");
            default:
                return Arrays.asList("牛顿第二定律");
        }
    }
}
