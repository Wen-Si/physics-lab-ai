package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

/**
 * Node 2 - Experiment Classifier (ReAct-powered).
 *
 * <p>Classifies the experiment into one of six categories using the ReAct
 * (Reason-Act) paradigm with GLM-4.5-flash. The LLM reasons about the
 * physics domain, takes an action (keyword classification), observes the
 * result, and provides a final answer. Falls back to keyword matching.</p>
 *
 * <p>Categories: mechanics / electromagnetism / optics / thermodynamics /
 * waves / modern_physics.</p>
 */
@Component
public class ExperimentClassifierNode implements WorkflowNode {

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            2, "experiment_classifier", "实验分类", "分类实验类型：力学/电磁学/光学/热力学/波动/现代物理");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        String input = context.getInput() == null ? "" : context.getInput();

        // Rule-based classification (always computed as fallback).
        String keywordType = classifyByKeywords(input);
        String experimentType = keywordType;

        // ReAct-enhanced classification.
        context.emitAiThinking(INFO.index(), INFO.name(),
                "正在使用 ReAct 范式调用 GLM-4.5-flash 进行实验分类...");
        try {
            String finalAnswer = agent.callWithReAct(
                    input,
                    "将用户的物理实验描述分类到正确的实验类型",
                    """
                    - keyword_classify: 通过关键词匹配进行分类（输入为用户文本，返回分类结果）
                    - check_category: 检查分类是否属于有效类别（输入为类别名，返回验证结果）
                    """,
                    (action, actionInput) -> {
                        if ("keyword_classify".equals(action)) {
                            String result = classifyByKeywords(actionInput != null ? actionInput : input);
                            return "关键词分类结果: " + result
                                    + "。有效类别: mechanics, electromagnetism, optics, "
                                    + "thermodynamics, waves, modern_physics";
                        }
                        if ("check_category".equals(action)) {
                            String cat = actionInput != null ? actionInput.trim() : "";
                            if (isValidCategory(cat)) {
                                return cat + " 是有效的实验类别";
                            }
                            return cat + " 不是有效类别，请从以下选择: mechanics, electromagnetism, "
                                    + "optics, thermodynamics, waves, modern_physics";
                        }
                        return "未知动作: " + action;
                    },
                    context, INFO.index(), INFO.name());

            if (finalAnswer != null) {
                String extracted = extractCategoryFromAnswer(finalAnswer);
                if (extracted != null && isValidCategory(extracted)) {
                    experimentType = extracted;
                }
            }
        } catch (Exception e) {
            context.getErrors().add("实验分类ReAct增强失败: " + e.getMessage());
        }

        context.setExperimentType(experimentType);
    }

    private String extractCategoryFromAnswer(String answer) {
        for (String cat : new String[]{"mechanics", "electromagnetism", "optics",
                "thermodynamics", "waves", "modern_physics"}) {
            if (answer.contains(cat)) {
                return cat;
            }
        }
        return null;
    }

    private boolean isValidCategory(String cat) {
        return "mechanics".equals(cat) || "electromagnetism".equals(cat)
                || "optics".equals(cat) || "thermodynamics".equals(cat)
                || "waves".equals(cat) || "modern_physics".equals(cat);
    }

    private String classifyByKeywords(String input) {
        if (containsAny(input, "力", "运动", "质量", "速度", "加速度", "落体", "摆", "弹簧",
                "碰撞", "斜面", "抛", "圆周", "轨道", "行星", "滑轮", "动量", "摩擦")) {
            return "mechanics";
        } else if (containsAny(input, "电", "磁", "电磁", "电荷", "电场", "磁场", "电流",
                "电压", "电路", "感应", "线圈")) {
            return "electromagnetism";
        } else if (containsAny(input, "光", "折射", "反射", "透镜", "棱镜", "干涉", "衍射",
                "光谱", "激光")) {
            return "optics";
        } else if (containsAny(input, "热", "温度", "热量", "比热", "气体", "膨胀", "导热",
                "熵", "卡诺")) {
            return "thermodynamics";
        } else if (containsAny(input, "波", "振动", "声波", "频率", "波长", "振幅", "周期",
                "共振")) {
            return "waves";
        } else if (containsAny(input, "量子", "相对论", "原子", "核", "光子", "电子", "粒子",
                "波粒")) {
            return "modern_physics";
        } else {
            return "mechanics";
        }
    }

    private boolean containsAny(String input, String... keywords) {
        for (String keyword : keywords) {
            if (input.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
