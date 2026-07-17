package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

/**
 * Node 6 - Physics Calculator.
 *
 * <p>This node is a placeholder for physics computation. The actual
 * numerical simulation (motion equations, energy analysis) is performed on
 * the frontend 3D engine; here we only flag that the calculation step is
 * ready and store basic derived metadata on the context.</p>
 */
@Component
public class PhysicsCalculatorNode implements WorkflowNode {

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            6, "physics_calculator", "物理计算", "执行物理数值计算：运动方程、能量分析");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        String sceneType = context.getSceneType() == null ? "freefall" : context.getSceneType();

        // Record that the calculation step has been performed on the backend side.
        context.getParameters().put("calculation", "ready");
        context.getParameters().put("calculationScene", sceneType);
        context.setCalculationsReady(true);
    }
}
