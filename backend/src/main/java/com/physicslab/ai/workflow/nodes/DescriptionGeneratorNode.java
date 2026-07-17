package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

/**
 * Node 9 - Description Generator.
 *
 * <p>Uses the agent's ChatClient (ZhiPu AI) to generate a one-sentence
 * description of the experiment. If the AI call fails or times out, falls
 * back to a rule-based description derived from the scene type.</p>
 */
@Component
public class DescriptionGeneratorNode implements WorkflowNode {

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            9, "description_generator", "描述生成", "生成实验文字描述和科学解释");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        String input = context.getInput() == null ? "" : context.getInput();
        String sceneType = context.getSceneType() == null ? "freefall" : context.getSceneType();

        String description = null;

        // Try AI-generated description first.
        context.emitAiThinking(INFO.index(), INFO.name(), "调用智谱AI生成实验描述...");
        try {
            description = agent.generateDescription(input, sceneType);
        } catch (Exception e) {
            context.getErrors().add("描述生成AI调用失败: " + e.getMessage());
        }

        if (description == null || description.isBlank()) {
            description = ruleBasedDescription(sceneType);
        }

        context.setDescription(description);
    }

    /**
     * Rule-based fallback descriptions keyed by scene type.
     */
    private String ruleBasedDescription(String sceneType) {
        switch (sceneType) {
            case "freefall":
                return "这是一个自由落体实验模拟。";
            case "pendulum":
                return "这是一个单摆实验模拟。";
            case "spring":
                return "这是一个弹簧振子简谐运动实验模拟。";
            case "projectile":
                return "这是一个平抛运动实验模拟。";
            case "angled_projectile":
                return "这是一个斜抛运动实验模拟。";
            case "ramp":
                return "这是一个斜面下滑实验模拟。";
            case "circular":
                return "这是一个圆周运动实验模拟。";
            case "collision":
                return "这是一个碰撞实验模拟。";
            case "atwood":
                return "这是一个阿特伍德滑轮实验模拟。";
            case "orbital":
                return "这是一个行星轨道运动实验模拟。";
            default:
                return "这是一个物理实验模拟。";
        }
    }
}
