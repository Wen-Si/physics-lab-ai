package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Node 0 - Input Parser.
 *
 * <p>Extracts keywords and entities from the user's natural-language input
 * and detects the language (zh/en). Performs simple keyword matching for
 * common physics terms and stores the normalized result in
 * {@code context.parsedInput}.</p>
 */
@Component
public class InputParserNode implements WorkflowNode {

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            0, "input_parser", "输入解析", "解析用户自然语言输入，提取关键词和实体");

    /** Common physics keywords used for simple entity extraction. */
    private static final String[] PHYSICS_KEYWORDS = {
            "质量", "速度", "加速度", "力", "能量", "动量", "角度", "高度", "长度",
            "半径", "频率", "周期", "振幅", "弹簧", "摆", "碰撞", "自由落体", "圆周",
            "轨道", "行星", "恒星", "斜面", "平抛", "斜抛", "滑轮", "阿特伍德",
            "牛顿", "万有引力", "动能", "势能", "摩擦", "重力", "速度", "位移"
    };

    private static final Pattern CJK_PATTERN = Pattern.compile("[\\u4e00-\\u9fa5]");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        String input = context.getInput();
        if (input == null || input.isBlank()) {
            context.setParsedInput("");
            context.setLanguage("zh");
            return;
        }

        // Detect language: if CJK characters present, treat as Chinese.
        Matcher cjkMatcher = CJK_PATTERN.matcher(input);
        context.setLanguage(cjkMatcher.find() ? "zh" : "en");

        // Extract keyword entities.
        List<String> foundKeywords = new ArrayList<>();
        String lowerInput = input.toLowerCase();
        for (String keyword : PHYSICS_KEYWORDS) {
            if (input.contains(keyword) || lowerInput.contains(keyword.toLowerCase())) {
                foundKeywords.add(keyword);
            }
        }

        // Build a normalized parsed input containing keywords + entities.
        StringBuilder parsed = new StringBuilder(input.trim());
        if (!foundKeywords.isEmpty()) {
            parsed.append(" | 关键词: ").append(String.join(", ", foundKeywords));
        }
        context.setParsedInput(parsed.toString());
    }
}
