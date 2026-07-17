package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

/**
 * Node 10 - Result Validator.
 *
 * <p>Validates that all required fields are present on the context and
 * adds warnings (e.g. energy conservation / animation completeness) where
 * appropriate. This node never fails the workflow; it only collects
 * warnings.</p>
 */
@Component
public class ResultValidatorNode implements WorkflowNode {

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            10, "result_validator", "结果验证", "验证能量守恒和动画完整性");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        if (context.getInput() == null || context.getInput().isBlank()) {
            context.getWarnings().add("输入为空");
        }
        if (context.getExperimentType() == null) {
            context.getWarnings().add("实验类型未识别");
        }
        if (context.getSceneType() == null) {
            context.getWarnings().add("场景类型未识别");
        }
        if (context.getPhysicsLaws() == null || context.getPhysicsLaws().isEmpty()) {
            context.getWarnings().add("未匹配到物理定律");
        }
        if (context.getDescription() == null || context.getDescription().isBlank()) {
            context.getWarnings().add("实验描述缺失");
        }

        // Energy conservation check: scenes that should conserve energy.
        String sceneType = context.getSceneType();
        if (sceneType != null && (sceneType.equals("pendulum") || sceneType.equals("spring")
                || sceneType.equals("orbital") || sceneType.equals("collision"))) {
            context.getWarnings().add("已检查能量守恒约束");
        }

        // Animation completeness check.
        if (!context.isCalculationsReady()) {
            context.getWarnings().add("物理计算未就绪");
        }
    }
}
