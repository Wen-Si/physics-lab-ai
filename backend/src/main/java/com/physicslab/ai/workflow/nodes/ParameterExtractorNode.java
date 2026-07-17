package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Node 3 - Parameter Extractor (CRITICAL NODE).
 *
 * <p>Detects the experiment scene type from keywords and extracts physics
 * parameters (mass, height, angle, velocity, length, radius, spring
 * constant, amplitude) from the user's natural-language input using regex.
 * Stores extracted parameters in {@code context.aiParams} and builds an
 * augmented input string with the AI-recognized parameter hints.</p>
 */
@Component
public class ParameterExtractorNode implements WorkflowNode {

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            3, "parameter_extractor", "参数提取", "从自然语言中提取物理参数：质量、速度、位置、角度等");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        String input = context.getInput() == null ? "" : context.getInput();
        Map<String, Object> aiParams = new LinkedHashMap<>();

        // ---- 1. Detect scene type from keywords (orbital takes precedence over circular) ----
        String sceneType = detectSceneType(input);
        context.setSceneType(sceneType);
        aiParams.put("sceneType", sceneType);

        // ---- 2. Extract physics parameters via regex ----
        putIfFound(aiParams, "mass", extractFirst(input,
                "质量\\s*(\\d+(?:\\.\\d+)?)\\s*kg", "(\\d+(?:\\.\\d+)?)\\s*kg"));
        putIfFound(aiParams, "height", extractFirst(input,
                "(\\d+(?:\\.\\d+)?)\\s*米", "(\\d+(?:\\.\\d+)?)\\s*m\\b"));
        putIfFound(aiParams, "angle", extractFirst(input,
                "角度\\s*(\\d+(?:\\.\\d+)?)\\s*度", "(\\d+(?:\\.\\d+)?)\\s*度"));
        putIfFound(aiParams, "velocity", extractFirst(input,
                "(\\d+(?:\\.\\d+)?)\\s*m/s", "(\\d+(?:\\.\\d+)?)\\s*米/秒"));
        putIfFound(aiParams, "length", extractFirst(input,
                "摆长\\s*(\\d+(?:\\.\\d+)?)\\s*[米m]"));
        putIfFound(aiParams, "radius", extractFirst(input,
                "轨道半径\\s*(\\d+(?:\\.\\d+)?)\\s*[米m]",
                "半径\\s*(\\d+(?:\\.\\d+)?)\\s*[米m]"));
        putIfFound(aiParams, "springConstant", extractFirst(input,
                "弹簧系数\\s*(\\d+(?:\\.\\d+)?)\\s*N/m"));
        putIfFound(aiParams, "amplitude", extractFirst(input,
                "振幅\\s*(\\d+(?:\\.\\d+)?)\\s*m"));

        context.setAiParams(aiParams);

        // ---- 3. Build augmented input ----
        context.setAugmentedInput(buildAugmentedInput(input, aiParams));
    }

    /**
     * Detect the scene type. {@code orbital} is checked before
     * {@code circular} so that planet/orbit/star descriptions are not
     * misclassified as generic circular motion.
     */
    private String detectSceneType(String input) {
        if (containsAny(input, "行星", "轨道", "恒星")) {
            return "orbital";
        }
        if (containsAny(input, "自由落体", "落下", "下落")) {
            return "freefall";
        }
        if (containsAny(input, "单摆", "摆动", "摆长")) {
            return "pendulum";
        }
        if (containsAny(input, "弹簧", "振子", "简谐")) {
            return "spring";
        }
        if (input.contains("斜抛")) {
            return "angled_projectile";
        }
        if (input.contains("平抛")) {
            return "projectile";
        }
        if (containsAny(input, "斜面", "下滑")) {
            return "ramp";
        }
        if (containsAny(input, "圆周运动", "匀速圆周")) {
            return "circular";
        }
        if (input.contains("碰撞")) {
            return "collision";
        }
        if (containsAny(input, "滑轮", "阿特伍德")) {
            return "atwood";
        }
        // Default scene.
        return "freefall";
    }

    /**
     * Try each regex (in order) against the input and return the first
     * captured numeric group as a Double, or {@code null} if none match.
     */
    private String extractFirst(String input, String... patterns) {
        for (String pattern : patterns) {
            Matcher matcher = Pattern.compile(pattern).matcher(input);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return null;
    }

    private void putIfFound(Map<String, Object> params, String key, String value) {
        if (value != null) {
            try {
                params.put(key, Double.parseDouble(value));
            } catch (NumberFormatException e) {
                params.put(key, value);
            }
        }
    }

    private String buildAugmentedInput(String input, Map<String, Object> aiParams) {
        StringBuilder sb = new StringBuilder(input.trim());
        // Collect the human-readable parameter hints (excluding the sceneType marker).
        StringBuilder hints = new StringBuilder();
        for (Map.Entry<String, Object> entry : aiParams.entrySet()) {
            if ("sceneType".equals(entry.getKey())) {
                continue;
            }
            if (hints.length() > 0) {
                hints.append("，");
            }
            hints.append(translateKey(entry.getKey())).append(entry.getValue());
        }
        if (hints.length() > 0) {
            sb.append(" [AI识别的参数: ").append(hints).append("]");
        }
        return sb.toString();
    }

    private String translateKey(String key) {
        switch (key) {
            case "mass": return "质量";
            case "height": return "高度";
            case "angle": return "角度";
            case "velocity": return "速度";
            case "length": return "摆长";
            case "radius": return "半径";
            case "springConstant": return "弹簧系数";
            case "amplitude": return "振幅";
            default: return key;
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
