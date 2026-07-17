package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Node 1 - Intent Recognition.
 *
 * <p>Determines the user's intent from keyword matching, then uses the
 * agent's ChatClient (ZhiPu AI) to enhance the recognition when possible.
 * Falls back to keyword-based intent if the AI call fails.</p>
 *
 * <p>Possible intents: simulate_experiment, explain_phenomenon,
 * calculate_result, visualize_concept.</p>
 */
@Component
public class IntentRecognitionNode implements WorkflowNode {

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            1, "intent_recognition", "意图识别", "识别用户意图：模拟实验/解释现象/计算结果/可视化概念");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        String input = context.getInput() == null ? "" : context.getInput();

        String intent = recognizeByKeywords(input);

        // Try to enhance intent recognition with AI.
        context.emitAiThinking(INFO.index(), INFO.name(), "调用智谱AI增强意图识别...");
        try {
            String aiResponse = agent.callAI(
                    "请判断以下物理实验描述的主要意图，只返回意图标签之一：" +
                            "simulate_experiment, explain_phenomenon, calculate_result, visualize_concept。" +
                            "描述：" + input);
            if (aiResponse != null) {
                Map<String, Object> parsed = agent.parseAIResponse(aiResponse);
                Object aiIntent = parsed.get("intent");
                if (aiIntent == null) {
                    // The AI may return just the label text.
                    String trimmed = aiResponse.trim();
                    if (isValidIntent(trimmed)) {
                        intent = trimmed;
                    }
                } else if (isValidIntent(aiIntent.toString())) {
                    intent = aiIntent.toString();
                }
            }
        } catch (Exception e) {
            // Fallback to keyword-based intent; workflow continues.
            context.getErrors().add("意图识别AI增强失败: " + e.getMessage());
        }

        context.setIntent(intent);
    }

    private String recognizeByKeywords(String input) {
        if (input.contains("模拟") || input.contains("实验") || input.contains("仿真")) {
            return "simulate_experiment";
        }
        if (input.contains("解释") || input.contains("为什么") || input.contains("现象")) {
            return "explain_phenomenon";
        }
        if (input.contains("计算") || input.contains("求") || input.contains("多少") || input.contains("结果")) {
            return "calculate_result";
        }
        if (input.contains("可视化") || input.contains("展示") || input.contains("演示") || input.contains("动画")) {
            return "visualize_concept";
        }
        // Default: treat as a simulation request.
        return "simulate_experiment";
    }

    private boolean isValidIntent(String intent) {
        return "simulate_experiment".equals(intent)
                || "explain_phenomenon".equals(intent)
                || "calculate_result".equals(intent)
                || "visualize_concept".equals(intent);
    }
}
