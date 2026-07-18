package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Node 8 - Animation Generator.
 *
 * <p>Placeholder for keyframe animation metadata. The frontend renders the
 * actual animation based on the scene type and parameters; this node
 * records a high-level animation descriptor on the context.</p>
 */
@Component
public class AnimationGeneratorNode implements WorkflowNode {

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            8, "animation_generator", "动画生成", "生成关键帧动画序列");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        String sceneType = context.getSceneType() == null ? "freefall" : context.getSceneType();

        Map<String, Object> animation = new LinkedHashMap<>();
        animation.put("type", animationTypeForScene(sceneType));
        animation.put("loop", "pendulum".equals(sceneType) || "spring".equals(sceneType)
                || "circular".equals(sceneType) || "orbital".equals(sceneType)
                || "damped_oscillation".equals(sceneType) || "lorentz_force".equals(sceneType)
                || "wave_propagation".equals(sceneType) || "binary_star".equals(sceneType)
                || "rc_circuit".equals(sceneType));
        animation.put("duration", 10);
        animation.put("sceneType", sceneType);

        context.getParameters().put("animation", animation);
    }

    private String animationTypeForScene(String sceneType) {
        switch (sceneType) {
            case "freefall": return "fall";
            case "pendulum": return "swing";
            case "spring": return "oscillate";
            case "projectile":
            case "angled_projectile": return "projectile";
            case "ramp": return "slide";
            case "circular":
            case "orbital": return "orbit";
            case "collision": return "collide";
            case "atwood": return "pulley";
            case "uniform_acceleration": return "accelerate";
            case "damped_oscillation": return "damped_oscillate";
            case "lorentz_force": return "orbit";
            case "rc_circuit": return "charge";
            case "light_refraction": return "refract";
            case "isothermal_expansion": return "expand";
            case "wave_propagation": return "wave";
            case "ballistic_pendulum": return "swing";
            case "binary_star": return "orbit";
            case "elevator_physics": return "elevate";
            default: return "custom";
        }
    }
}
