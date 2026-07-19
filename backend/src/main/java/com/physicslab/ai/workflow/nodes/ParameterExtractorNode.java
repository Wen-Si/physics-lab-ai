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

        // ---- 1. Detect scene type from keywords ----
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
        // 半径/轨道半径：支持 km、cm、mm、m 多单位，统一转换为 m
        putIfFound(aiParams, "radius", extractLengthWithUnit(input,
                "轨道半径\\s*(\\d+(?:\\.\\d+)?)\\s*(km|km|公里|千米|m|米|cm|mm)",
                "半径\\s*(\\d+(?:\\.\\d+)?)\\s*(km|公里|千米|m|米|cm|mm)"));
        putIfFound(aiParams, "springConstant", extractFirst(input,
                "弹簧系数\\s*(\\d+(?:\\.\\d+)?)\\s*N/m"));
        putIfFound(aiParams, "amplitude", extractFirst(input,
                "振幅\\s*(\\d+(?:\\.\\d+)?)\\s*m"));
        // 高度：也支持 km 单位（如"从10km高处"）
        putIfFoundConverted(aiParams, "height", extractLengthWithUnit(input,
                "(?:高度|高处|高)\\s*(\\d+(?:\\.\\d+)?)\\s*(km|公里|千米|m|米|cm|mm)",
                "(\\d+(?:\\.\\d+)?)\\s*(km|公里|千米)\\s*(?:高|处|的)"));

        context.setAiParams(aiParams);

        // ---- 3. Build augmented input ----
        context.setAugmentedInput(buildAugmentedInput(input, aiParams));
    }

    /**
     * Detect the scene type from keyword matching.
     *
     * <p>Detection priority:</p>
     * <ol>
     *   <li><b>orbital</b> — unambiguous keywords: 行星, 恒星, 卫星.
     *       Checked first because planet descriptions may also contain
     *       "匀速圆周运动" (e.g. "行星绕恒星做匀速圆周运动" is orbital).</li>
     *   <li><b>circular</b> — 圆周运动, 匀速圆周, 圆轨道.
     *       Must be checked before the generic "轨道" fallback below,
     *       because "圆轨道" contains the substring "轨道".</li>
     *   <li><b>orbital (fallback)</b> — generic "轨道" without "圆"
     *       indicates orbital motion (e.g. "椭圆轨道").</li>
     * </ol>
     */
    private String detectSceneType(String input) {
        // === 电磁学实验 ===
        if (containsAny(input, "洛伦兹力", "磁场", "带电粒子", "磁感应强度")) {
            return "lorentz_force";
        }
        if (containsAny(input, "RC电路", "电容", "充电", "放电", "电阻电容")) {
            return "rc_circuit";
        }
        // === 光学实验 ===
        if (containsAny(input, "折射", "入射角", "折射率", "斯涅尔")) {
            return "light_refraction";
        }
        // === 热学实验 ===
        if (containsAny(input, "等温膨胀", "理想气体", "气体膨胀", "活塞")) {
            return "isothermal_expansion";
        }
        // === 波动实验 ===
        if (containsAny(input, "波的传播", "横波", "纵波", "波长", "波速")) {
            return "wave_propagation";
        }
        // === 新增力学实验 ===
        if (containsAny(input, "匀加速", "恒力", "直线加速", "小车加速")) {
            return "uniform_acceleration";
        }
        if (containsAny(input, "阻尼振动", "阻尼", "阻尼系数")) {
            return "damped_oscillation";
        }
        if (containsAny(input, "冲击摆", "子弹射入", "弹道摆")) {
            return "ballistic_pendulum";
        }
        if (containsAny(input, "双星", "双星系统")) {
            return "binary_star";
        }
        if (containsAny(input, "超重", "失重", "电梯", "升降梯")) {
            return "elevator_physics";
        }
        // === 原有10个实验 ===
        // 1. Unambiguous orbital keywords (planet, star, satellite)
        if (containsAny(input, "行星", "恒星", "卫星")) {
            return "orbital";
        }
        // 2. Circular motion — must precede generic "轨道" check
        if (containsAny(input, "圆周运动", "匀速圆周", "圆轨道")) {
            return "circular";
        }
        // 3. Generic "轨道" (without "圆") → orbital
        if (input.contains("轨道")) {
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

    /**
     * Extract a length value with unit (km/m/cm/mm) and convert to meters.
     * Returns the value in meters as a String, or null if no match.
     */
    private String extractLengthWithUnit(String input, String... patterns) {
        for (String pattern : patterns) {
            Matcher matcher = Pattern.compile(pattern).matcher(input);
            if (matcher.find()) {
                String valueStr = matcher.group(1);
                String unit = matcher.groupCount() >= 2 ? matcher.group(2) : "m";
                try {
                    double value = Double.parseDouble(valueStr);
                    // Convert to meters
                    switch (unit) {
                        case "km": case "公里": case "千米":
                            value *= 1000;
                            break;
                        case "cm":
                            value /= 100;
                            break;
                        case "mm":
                            value /= 1000;
                            break;
                        default: // m, 米 — no conversion
                            break;
                    }
                    // Return as string, preserving integer values without decimal
                    if (value == Math.floor(value)) {
                        return String.valueOf((long) value);
                    }
                    return String.valueOf(value);
                } catch (NumberFormatException e) {
                    return valueStr;
                }
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

    /**
     * Like putIfFound but only overwrites if the key is not already set
     * (used for height which may be set by the simple regex first).
     */
    private void putIfFoundConverted(Map<String, Object> params, String key, String value) {
        if (value != null && !params.containsKey(key)) {
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
