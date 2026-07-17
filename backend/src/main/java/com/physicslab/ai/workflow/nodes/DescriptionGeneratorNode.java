package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

/**
 * Node 9 - Description Generator (ReAct-powered).
 *
 * <p>Uses the ReAct (Reason-Act) paradigm with GLM-4.5-flash to generate
 * a description of the experiment. The LLM reasons about the experiment
 * characteristics, queries the scene type, and produces a final description.
 * Falls back to rule-based description if the AI call fails.</p>
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
        String experimentType = context.getExperimentType() == null ? "mechanics" : context.getExperimentType();

        String description = null;

        // ReAct-enhanced description generation.
        context.emitAiThinking(INFO.index(), INFO.name(),
                "正在使用 ReAct 范式调用 GLM-4.5-flash 生成实验描述...");
        try {
            String finalAnswer = agent.callWithReAct(
                    input,
                    "为用户的物理实验生成一句话的中文描述",
                    """
                    - get_scene_info: 获取当前实验的场景信息（返回场景类型和实验类型）
                    - get_physics_laws: 获取适用的物理定律（返回定律列表）
                    """,
                    (action, actionInput) -> {
                        if ("get_scene_info".equals(action)) {
                            return "场景类型: " + sceneType + "，实验类型: " + experimentType
                                    + "。场景说明: " + sceneDescription(sceneType);
                        }
                        if ("get_physics_laws".equals(action)) {
                            String laws = context.getPhysicsLaws() != null
                                    ? String.join("、", context.getPhysicsLaws()) : "未知";
                            return "适用定律: " + laws;
                        }
                        return "未知动作: " + action;
                    },
                    context, INFO.index(), INFO.name());

            if (finalAnswer != null && !finalAnswer.isBlank()) {
                description = finalAnswer;
            }
        } catch (Exception e) {
            context.getErrors().add("描述生成ReAct调用失败: " + e.getMessage());
        }

        if (description == null || description.isBlank()) {
            description = ruleBasedDescription(sceneType);
        }

        context.setDescription(description);
    }

    private String sceneDescription(String sceneType) {
        switch (sceneType) {
            case "freefall": return "物体在重力作用下自由下落";
            case "pendulum": return "摆锤在重力作用下周期摆动";
            case "spring": return "物体在弹簧弹力作用下简谐振动";
            case "projectile": return "物体在水平方向匀速、竖直方向匀加速运动";
            case "angled_projectile": return "物体以一定角度抛出做抛物线运动";
            case "ramp": return "物体在斜面上滑动";
            case "circular": return "物体做匀速圆周运动";
            case "collision": return "两个物体发生碰撞";
            case "atwood": return "阿特伍德机滑轮系统运动";
            case "orbital": return "行星绕恒星做轨道运动";
            default: return "物理实验";
        }
    }

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
