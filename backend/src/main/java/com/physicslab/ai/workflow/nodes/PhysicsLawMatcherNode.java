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
            default:
                return Arrays.asList("牛顿第二定律");
        }
    }
}
