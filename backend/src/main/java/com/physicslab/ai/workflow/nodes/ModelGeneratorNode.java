package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Node 7 - Model Generator (ReAct-powered by GLM-4.5-Flash).
 *
 * <p>Uses the ReAct (Reason-Act) paradigm with ZhiPu AI GLM-4.5-flash to
 * generate 3D model metadata (geometry, material, dimensions) based on the
 * experiment scene type and user input. The LLM reasons about what 3D
 * objects are needed, selects an appropriate geometry, and produces a
 * model descriptor that the frontend renderer uses to build the scene.</p>
 *
 * <p>The node defines a local action {@code generate_model_metadata} that
 * maps scene types to geometry descriptors. The LLM can call this action
 * to get predefined geometry, or reason about custom geometries for
 * unusual experiments. Falls back to rule-based geometry mapping if the
 * AI call fails.</p>
 */
@Component
public class ModelGeneratorNode implements WorkflowNode {

    private static final Logger log = LoggerFactory.getLogger(ModelGeneratorNode.class);

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            7, "model_generator", "模型生成", "使用GLM-4.5-Flash生成3D模型几何体和材质数据");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        String sceneType = context.getSceneType() == null ? "freefall" : context.getSceneType();
        String userInput = context.getInput() == null ? "" : context.getInput();

        // Rule-based geometry (always computed as fallback).
        String fallbackGeometry = geometryForScene(sceneType);

        // ReAct-enhanced 3D model generation using GLM-4.5-Flash.
        context.emitAiThinking(INFO.index(), INFO.name(),
                "正在使用 ReAct 范式调用 GLM-4.5-Flash 生成3D模型描述...");

        String modelDescription = fallbackGeometry;
        String material = "standard";

        try {
            String finalAnswer = agent.callWithReAct(
                    userInput,
                    "根据实验场景类型（" + sceneType + "）和用户输入，生成3D模型的几何体和材质描述。" +
                    "需要确定使用什么几何体（如sphere, box, spring, cylinder等）和材质（如metal, glass, standard等）" +
                    "来最好地呈现这个物理实验的3D场景。",
                    """
                    - get_geometry: 根据场景类型获取推荐的3D几何体描述（输入为场景类型，返回几何体描述）
                    - get_material: 根据实验类型获取推荐的材质（输入为场景类型，返回材质描述）
                    - check_scene: 检查场景类型的有效性（输入为场景类型，返回有效性和说明）
                    """,
                    (action, actionInput) -> {
                        if ("get_geometry".equals(action)) {
                            String st = actionInput != null ? actionInput.trim() : sceneType;
                            String geom = geometryForScene(st);
                            return "场景类型「" + st + "」的推荐几何体: " + geom
                                    + "。该几何体包含实验所需的所有3D对象。";
                        }
                        if ("get_material".equals(action)) {
                            String st = actionInput != null ? actionInput.trim() : sceneType;
                            String mat = materialForScene(st);
                            return "场景类型「" + st + "」的推荐材质: " + mat;
                        }
                        if ("check_scene".equals(action)) {
                            String st = actionInput != null ? actionInput.trim() : "";
                            if (isValidSceneType(st)) {
                                return "「" + st + "」是有效的物理实验场景类型";
                            }
                            return "「" + st + "」不是标准场景类型，将使用默认几何体: sphere";
                        }
                        return "未知动作: " + action;
                    },
                    context, INFO.index(), INFO.name());

            if (finalAnswer != null && !finalAnswer.isBlank()) {
                // Try to extract geometry from the final answer
                String extracted = extractGeometryFromAnswer(finalAnswer);
                if (extracted != null) {
                    modelDescription = extracted;
                }
                // Try to extract material
                String extractedMaterial = extractMaterialFromAnswer(finalAnswer);
                if (extractedMaterial != null) {
                    material = extractedMaterial;
                }
            }
        } catch (Exception e) {
            log.warn("ModelGenerator ReAct enhancement failed, using fallback: {}", e.getMessage());
            context.getErrors().add("模型生成ReAct增强失败: " + e.getMessage());
        }

        // Store the model metadata in BOTH parameters and aiParams so the
        // OutputFormatterNode includes it in the final result.
        Map<String, Object> model = new LinkedHashMap<>();
        model.put("geometry", modelDescription);
        model.put("material", material);
        model.put("sceneType", sceneType);
        model.put("ai_generated", true);
        context.getParameters().put("model", model);
        // Also put in aiParams so OutputFormatterNode includes it in the output
        context.getAiParams().put("model", model);

        log.info("ModelGeneratorNode: scene={}, geometry={}, material={}",
                sceneType, modelDescription, material);
    }

    /**
     * Extract geometry description from the LLM's final answer.
     * Looks for common geometry keywords.
     */
    private String extractGeometryFromAnswer(String answer) {
        String lower = answer.toLowerCase();
        // Check for compound geometries first
        if (lower.contains("spring") || lower.contains("弹簧")) return "spring+block";
        if (lower.contains("pendulum") || lower.contains("摆")) return "sphere+rod";
        if (lower.contains("orbit") || lower.contains("轨道") || lower.contains("行星")) return "sphere+orbit";
        if (lower.contains("pulley") || lower.contains("滑轮")) return "pulley+blocks";
        if (lower.contains("ramp") || lower.contains("斜面")) return "ramp+block";
        if (lower.contains("prism") || lower.contains("棱镜")) return "prism+ray";
        if (lower.contains("circuit") || lower.contains("电路")) return "circuit";
        if (lower.contains("cylinder") || lower.contains("气缸")) return "cylinder+piston";
        if (lower.contains("wave") || lower.contains("波")) return "wave";
        if (lower.contains("box") || lower.contains("立方体") || lower.contains("方块")) return "box";
        if (lower.contains("sphere") || lower.contains("球")) return "sphere";
        if (lower.contains("cylinder") || lower.contains("圆柱")) return "cylinder";
        // New scene type geometries
        if (lower.contains("water") || lower.contains("水") || lower.contains("浮")) return "box+water";
        if (lower.contains("source") || lower.contains("声源")) return "source+wave";
        if (lower.contains("slit") || lower.contains("双缝")) return "light_source+slits+screen";
        if (lower.contains("coil") || lower.contains("线圈") || lower.contains("magnet") || lower.contains("磁铁")) return "coil+magnet";
        if (lower.contains("rocket") || lower.contains("火箭") || lower.contains("flame") || lower.contains("火焰")) return "rocket+flame";
        // If the answer contains a geometry-like word, use the whole answer (truncated)
        if (answer.length() < 100 && (lower.contains("+") || lower.contains("geometry"))) {
            return answer.trim();
        }
        return null;
    }

    /**
     * Extract material description from the LLM's final answer.
     */
    private String extractMaterialFromAnswer(String answer) {
        String lower = answer.toLowerCase();
        if (lower.contains("metal") || lower.contains("金属")) return "metal";
        if (lower.contains("glass") || lower.contains("玻璃")) return "glass";
        if (lower.contains("plastic") || lower.contains("塑料")) return "plastic";
        if (lower.contains("wood") || lower.contains("木")) return "wood";
        return null;
    }

    private boolean isValidSceneType(String sceneType) {
        if (sceneType == null) return false;
        return switch (sceneType) {
            case "freefall", "pendulum", "spring", "projectile", "ramp", "incline",
                 "circular", "collision", "angled_projectile", "oblique_throw",
                 "atwood", "pulley", "orbital", "uniform_acceleration",
                 "damped", "damped_oscillation", "ballistic_pendulum", "binary_star",
                 "weightlessness", "elevator_physics", "lorentz_force", "rc_circuit",
                 "refraction", "light_refraction", "isothermal_expansion",
                 "wave_propagation",
                 // 5 new scene types
                 "buoyancy", "doppler_effect", "double_slit",
                 "electromagnetic_induction", "rocket_propulsion" -> true;
            default -> false;
        };
    }

    /** Geometry descriptor for the frontend renderer based on scene type. */
    private String geometryForScene(String sceneType) {
        switch (sceneType) {
            case "pendulum": return "sphere+rod";
            case "spring": return "spring+block";
            case "damped": return "spring+block";
            case "damped_oscillation": return "spring+block";
            case "orbital": return "sphere+orbit";
            case "atwood":
            case "pulley": return "pulley+blocks";
            case "ramp":
            case "incline": return "ramp+block";
            case "binary_star": return "sphere+sphere";
            case "ballistic_pendulum": return "sphere+bag";
            case "rc_circuit": return "circuit";
            case "refraction":
            case "light_refraction": return "prism+ray";
            case "isothermal_expansion": return "cylinder+piston";
            case "wave_propagation": return "wave";
            case "elevator_physics":
            case "weightlessness": return "box+scale";
            case "circular": return "sphere+track";
            case "uniform_acceleration": return "cart";
            case "lorentz_force": return "particle+field";
            // 5 new scene types
            case "buoyancy": return "box+water";
            case "doppler_effect": return "source+wave";
            case "double_slit": return "light_source+slits+screen";
            case "electromagnetic_induction": return "coil+magnet";
            case "rocket_propulsion": return "rocket+flame";
            default: return "sphere";
        }
    }

    /** Recommended material for the scene type. */
    private String materialForScene(String sceneType) {
        switch (sceneType) {
            case "orbital":
            case "binary_star":
                return "standard";
            case "refraction":
            case "light_refraction":
            case "double_slit":
                return "glass";
            case "lorentz_force":
            case "electromagnetic_induction":
                return "metal";
            case "rc_circuit":
                return "standard";
            case "buoyancy":
                return "wood";
            case "doppler_effect":
                return "standard";
            case "rocket_propulsion":
                return "metal";
            default:
                return "metal";
        }
    }
}
