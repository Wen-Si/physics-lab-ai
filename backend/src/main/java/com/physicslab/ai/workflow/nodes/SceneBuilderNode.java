package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Node 5 - Scene Builder.
 *
 * <p>Builds 3D experiment scene metadata (objects, environment, camera,
 * lighting). The scene type itself is already stored on the context by
 * Node 3; this node records scene metadata used by the frontend renderer.</p>
 */
@Component
public class SceneBuilderNode implements WorkflowNode {

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            5, "scene_builder", "场景构建", "构建3D实验场景：对象、环境、相机、光照");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        String sceneType = context.getSceneType() == null ? "freefall" : context.getSceneType();

        Map<String, Object> scene = new LinkedHashMap<>();
        scene.put("sceneType", sceneType);
        scene.put("environment", "default");
        scene.put("camera", "perspective");
        scene.put("lighting", "directional");

        context.getParameters().put("scene", scene);
    }
}
