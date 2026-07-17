package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Node 7 - Model Generator.
 *
 * <p>Placeholder for 3D geometry and material metadata. The frontend uses
 * the scene type (and extracted parameters) to build the actual meshes;
 * this node stores a model descriptor on the context.</p>
 */
@Component
public class ModelGeneratorNode implements WorkflowNode {

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            7, "model_generator", "模型生成", "生成3D几何体和材质数据");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        String sceneType = context.getSceneType() == null ? "freefall" : context.getSceneType();

        Map<String, Object> model = new LinkedHashMap<>();
        model.put("geometry", geometryForScene(sceneType));
        model.put("material", "standard");
        model.put("sceneType", sceneType);

        context.getParameters().put("model", model);
    }

    private String geometryForScene(String sceneType) {
        switch (sceneType) {
            case "pendulum": return "sphere+rod";
            case "spring": return "spring+block";
            case "orbital": return "sphere+orbit";
            case "atwood": return "pulley+blocks";
            case "ramp": return "ramp+block";
            default: return "sphere";
        }
    }
}
