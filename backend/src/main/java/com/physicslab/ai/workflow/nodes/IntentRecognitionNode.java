package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

/**
 * Node 1 - Intent Recognition (ReAct-powered).
 *
 * <p>Uses the ReAct (Reason-Act) paradigm with GLM-4.5-flash to recognize
 * the user's intent. The LLM reasons step-by-step (Thought → Action →
 * Observation → Final Answer), and each step is streamed to the frontend.
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

        // Rule-based fallback (always computed first as a safety net).
        String keywordIntent = recognizeByKeywords(input);

        String intent = keywordIntent;

        // ReAct-enhanced intent recognition.
        context.emitAiThinking(INFO.index(), INFO.name(),
                "正在使用 ReAct 范式调用 GLM-4.5-flash 进行意图识别...");
        try {
            String finalAnswer = agent.callWithReAct(
                    input,
                    "判断用户的物理实验描述属于哪种意图类型",
                    """
                    - keyword_match: 通过关键词匹配判断意图（输入为用户文本，返回意图标签）
                    - validate_intent: 验证意图标签是否合理（输入为意图标签，返回验证结果）
                    """,
                    (action, actionInput) -> {
                        if ("keyword_match".equals(action) || "validate_intent".equals(action)) {
                            String matched = recognizeByKeywords(actionInput != null ? actionInput : input);
                            return "关键词匹配结果: " + matched
                                    + "。可选意图: simulate_experiment, explain_phenomenon, "
                                    + "calculate_result, visualize_concept";
                        }
                        return "未知动作: " + action;
                    },
                    context, INFO.index(), INFO.name());

            if (finalAnswer != null) {
                String extracted = extractIntentFromAnswer(finalAnswer);
                if (extracted != null && isValidIntent(extracted)) {
                    intent = extracted;
                }
            }
        } catch (Exception e) {
            context.getErrors().add("意图识别ReAct增强失败: " + e.getMessage());
        }

        context.setIntent(intent);
    }

    /**
     * Try to extract a valid intent label from the LLM's final answer.
     */
    private String extractIntentFromAnswer(String answer) {
        for (String intent : new String[]{"simulate_experiment", "explain_phenomenon",
                "calculate_result", "visualize_concept"}) {
            if (answer.contains(intent)) {
                return intent;
            }
        }
        return null;
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
        return "simulate_experiment";
    }

    private boolean isValidIntent(String intent) {
        return "simulate_experiment".equals(intent)
                || "explain_phenomenon".equals(intent)
                || "calculate_result".equals(intent)
                || "visualize_concept".equals(intent);
    }
}
