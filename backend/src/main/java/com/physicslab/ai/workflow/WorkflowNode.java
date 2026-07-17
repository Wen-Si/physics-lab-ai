package com.physicslab.ai.workflow;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;

/**
 * Contract for a single node in the 12-step physics experiment workflow.
 *
 * <p>Implementations are Spring {@code @Component} beans. The
 * {@link WorkflowEngine} injects them as an ordered list and invokes
 * {@link #execute} sequentially, passing the shared {@link WorkflowContext}
 * and the {@link PhysicsExperimentAgent} (which wraps ZhiPu AI).</p>
 */
public interface WorkflowNode {

    /**
     * Static metadata for this node (index, type, name, description).
     *
     * @return node metadata
     */
    WorkflowNodeInfo getNodeInfo();

    /**
     * Execute this node's logic, reading from and writing to the shared
     * context. May use {@code agent} to call ZhiPu AI for natural-language
     * understanding. Nodes may emit {@code ai_thinking} events via
     * {@link WorkflowContext#emitAiThinking(Integer, String, String)}.
     *
     * @param context shared workflow state
     * @param agent   the physics experiment AI agent (ZhiPu AI wrapper)
     * @throws Exception if an unrecoverable error occurs
     */
    void execute(WorkflowContext context, PhysicsExperimentAgent agent) throws Exception;
}
