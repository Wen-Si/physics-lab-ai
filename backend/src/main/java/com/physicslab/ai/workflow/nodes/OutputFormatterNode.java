package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.ExperimentResult;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Map;

/**
 * Node 11 - Output Formatter.
 *
 * <p>Aggregates all workflow products into the final {@link ExperimentResult}
 * and stores it on the context so the {@link com.physicslab.ai.workflow.WorkflowEngine}
 * can emit it in the {@code complete} SSE event. Also finalizes the
 * augmented input string.</p>
 */
@Component
public class OutputFormatterNode implements WorkflowNode {

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            11, "output_formatter", "输出格式化", "汇总所有产物为最终实验输出");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        ExperimentResult result = new ExperimentResult();
        result.setExperimentType(context.getExperimentType() != null
                ? context.getExperimentType() : "mechanics");
        result.setSceneType(context.getSceneType() != null
                ? context.getSceneType() : "freefall");
        result.setDescription(context.getDescription() != null
                ? context.getDescription() : "这是一个物理实验模拟。");
        result.setPhysicsLaws(context.getPhysicsLaws() != null
                ? new ArrayList<>(context.getPhysicsLaws()) : new ArrayList<>());

        Map<String, Object> aiParams = context.getAiParams();
        result.setAiParams(aiParams != null ? aiParams : Map.of());

        // Finalize the augmented input (built by Node 3, ensure it is set).
        if (context.getAugmentedInput() == null || context.getAugmentedInput().isBlank()) {
            context.setAugmentedInput(context.getInput() == null ? "" : context.getInput());
        }
        result.setAugmentedInput(context.getAugmentedInput());

        context.setResult(result);
    }
}
