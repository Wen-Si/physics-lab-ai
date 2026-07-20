package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.Hunyuan3DResult;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.service.Hunyuan3DService;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Node 7 - Model Generator.
 *
 * <p>Generates 3D model metadata AND calls the 腾讯混元生3D (Tencent Hunyuan 3D)
 * API to generate an actual 3D model file from a text prompt. The generated
 * model URLs (OBJ, GLB) are stored on the context for the frontend to
 * optionally load and display.</p>
 *
 * <p>The node uses ReAct-style reasoning steps to communicate progress:
 * <ol>
 *   <li>Thought: analyzes the experiment and decides what 3D object to generate</li>
 *   <li>Action: calls the Hunyuan3DService with a text prompt</li>
 *   <li>Observation: reports the API result (success/timeout/failure)</li>
 *   <li>Final Answer: summarizes the 3D model generation outcome</li>
 * </ol>
 *
 * <p>If the Hunyuan3D API is unavailable or times out, the node falls back
 * to the original behavior: storing static geometry metadata on the context.
 * The workflow continues regardless of 3D generation success.</p>
 */
@Component
public class ModelGeneratorNode implements WorkflowNode {

    private static final Logger log = LoggerFactory.getLogger(ModelGeneratorNode.class);

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            7, "model_generator", "模型生成", "调用混元生3D生成3D模型");

    private final Hunyuan3DService hunyuan3DService;

    @Autowired
    public ModelGeneratorNode(Hunyuan3DService hunyuan3DService) {
        this.hunyuan3DService = hunyuan3DService;
    }

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        String sceneType = context.getSceneType() == null ? "freefall" : context.getSceneType();
        String userInput = context.getInput() == null ? "" : context.getInput();

        // Step 1: Generate the 3D model prompt based on scene type
        String prompt3D = build3DPrompt(sceneType, userInput);

        int stepNumber = 0;

        // Thought step
        stepNumber++;
        context.emitReActStep(7, "模型生成", "thought",
                "需要为「" + sceneType + "」实验生成3D模型。将使用混元生3D API，提示词：「" + prompt3D + "」",
                stepNumber);

        // Step 2: Store static geometry metadata (always, as fallback for frontend)
        Map<String, Object> model = new LinkedHashMap<>();
        model.put("geometry", geometryForScene(sceneType));
        model.put("material", "standard");
        model.put("sceneType", sceneType);
        model.put("hunyuan3d_prompt", prompt3D);
        context.getParameters().put("model", model);

        // Step 3: Call Hunyuan3D API
        if (!hunyuan3DService.isConfigured()) {
            stepNumber++;
            context.emitReActStep(7, "模型生成", "observation",
                    "混元生3D API未配置，跳过3D模型生成，使用默认几何体", stepNumber);
            stepNumber++;
            context.emitReActStep(7, "模型生成", "final_answer",
                    "使用默认3D几何体: " + geometryForScene(sceneType), stepNumber);
            return;
        }

        // Action step
        stepNumber++;
        context.emitReActStep(7, "模型生成", "action",
                "generate_3d_model[" + prompt3D + "]", stepNumber);

        // Call the API (blocking, may take 30-90 seconds)
        Hunyuan3DResult result;
        try {
            result = hunyuan3DService.generate3DModel(prompt3D);
        } catch (Exception e) {
            log.error("Hunyuan3D generation failed for scene {}: {}", sceneType, e.getMessage(), e);
            result = new Hunyuan3DResult();
            result.setStatus("ERROR");
            result.setError(e.getMessage());
            result.setPrompt(prompt3D);
        }

        // Observation step
        stepNumber++;
        String observation;
        if ("DONE".equals(result.getStatus())) {
            int fileCount = result.getModelFiles().size();
            StringBuilder sb = new StringBuilder();
            sb.append("3D模型生成成功！共").append(fileCount).append("个文件：");
            for (Hunyuan3DResult.ModelFile f : result.getModelFiles()) {
                sb.append(f.getType()).append(" ");
            }
            if (result.getPreviewImageUrl() != null) {
                sb.append("（含预览图）");
            }
            observation = sb.toString();
        } else if ("TIMEOUT".equals(result.getStatus())) {
            observation = "3D模型生成超时（JobId: " + result.getJobId() + "），使用默认几何体";
        } else {
            observation = "3D模型生成失败: " + (result.getError() != null ? result.getError() : "未知错误") + "，使用默认几何体";
        }
        context.emitReActStep(7, "模型生成", "observation", observation, stepNumber);

        // Store the result on the context (even if failed, for debugging)
        context.setHunyuan3DModel(result);

        // Final Answer
        stepNumber++;
        String finalAnswer;
        if ("DONE".equals(result.getStatus()) && result.getGlbUrl() != null) {
            finalAnswer = "混元生3D已生成3D模型（GLB格式），模型URL已嵌入实验结果";
        } else if ("DONE".equals(result.getStatus())) {
            finalAnswer = "混元生3D已生成3D模型，使用默认几何体进行仿真渲染";
        } else {
            finalAnswer = "3D模型生成未成功，使用默认几何体: " + geometryForScene(sceneType);
        }
        context.emitReActStep(7, "模型生成", "final_answer", finalAnswer, stepNumber);

        log.info("ModelGeneratorNode: scene={}, hunyuan3d status={}, files={}",
                sceneType, result.getStatus(), result.getModelFiles().size());
    }

    /**
     * Build a text prompt for the 混元生3D API based on the experiment scene type.
     *
     * <p>The prompt describes the physical object(s) in the experiment, not the
     * motion itself — the 3D API generates static meshes, not animations.</p>
     */
    private String build3DPrompt(String sceneType, String userInput) {
        // Use the user input to add context, but keep the core prompt simple
        // for best results with the 3D generation API
        switch (sceneType) {
            case "freefall":
                return "一个金属小球，光滑表面";
            case "pendulum":
                return "一个摆球，球体连接一根细绳";
            case "spring":
            case "damped":
            case "damped_oscillation":
                return "一个金属弹簧，连接着一个方块";
            case "projectile":
            case "oblique_throw":
            case "angled_projectile":
                return "一个小球，光滑球体";
            case "ramp":
            case "incline":
                return "一个光滑斜面和一个滑块";
            case "circular":
                return "一个小球在圆形轨道上";
            case "collision":
                return "两个相同的台球";
            case "atwood":
            case "pulley":
                return "一个定滑轮和两根绳子";
            case "orbital":
                return "一颗行星，蓝绿色球体";
            case "uniform_acceleration":
                return "一辆小推车";
            case "ballistic_pendulum":
                return "一个沙袋悬挂在绳子上";
            case "binary_star":
                return "两颗恒星，一大一小";
            case "weightlessness":
            case "elevator_physics":
                return "一个体重秤";
            case "lorentz_force":
                return "一个发光的带电粒子";
            case "rc_circuit":
                return "一个电路板，上面有电阻和电容";
            case "refraction":
            case "light_refraction":
                return "一个透明玻璃棱镜";
            case "isothermal_expansion":
                return "一个气缸和活塞";
            case "wave_propagation":
                return "一条波浪形的绳索";
            default:
                // For unknown scene types, extract a simple noun from the user input
                if (userInput != null && !userInput.isBlank()) {
                    // Use a generic prompt with the user input
                    return "一个物理实验器材";
                }
                return "一个物理实验球体";
        }
    }

    /** Fallback geometry descriptor for the frontend renderer. */
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
            default: return "sphere";
        }
    }
}
