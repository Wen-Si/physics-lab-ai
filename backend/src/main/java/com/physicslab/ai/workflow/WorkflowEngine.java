package com.physicslab.ai.workflow;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.ExperimentResult;
import com.physicslab.ai.model.WorkflowEvent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Drives the 12-node physics experiment workflow and streams real-time
 * execution progress as a reactive {@link Flux} of {@link WorkflowEvent}s
 * (consumed as Server-Sent Events by the controller).
 *
 * <p>Execution model: a {@link reactor.core.publisher.FluxSink} is created
 * via {@link Flux#create}; nodes run sequentially on a bounded-elastic
 * scheduler. Before each node a {@code node_start} event is emitted, after
 * each node a {@code node_complete} event. Nodes may emit {@code ai_thinking}
 * events through the context's event sink while calling ZhiPu AI. After all
 * nodes finish, a {@code complete} event carrying the final
 * {@link ExperimentResult} is emitted. Per-node exceptions emit an
 * {@code error} event but do not abort the workflow.</p>
 */
@Component
public class WorkflowEngine {

    private static final Logger log = LoggerFactory.getLogger(WorkflowEngine.class);

    private final List<WorkflowNode> nodes;
    private final PhysicsExperimentAgent agent;

    @Autowired
    public WorkflowEngine(List<WorkflowNode> nodes, PhysicsExperimentAgent agent) {
        this.agent = agent;
        // Sort nodes by their declared index so they execute in the correct order.
        this.nodes = new ArrayList<>(nodes);
        this.nodes.sort(Comparator.comparingInt(n -> n.getNodeInfo().index()));
    }

    /**
     * Execute the full 12-node workflow for the given user input, streaming
     * progress events.
     *
     * @param input the user's natural-language experiment description
     * @return a cold {@link Flux} of workflow events
     */
    public Flux<WorkflowEvent> execute(String input) {
        return Flux.<WorkflowEvent>create(sink -> {
            WorkflowContext context = new WorkflowContext(input);
            // Wire the context's event sink so nodes can emit ai_thinking events.
            context.setEventSink(sink::next);

            log.info("Starting physics experiment workflow for input: {}",
                    input == null ? "" : (input.length() > 60 ? input.substring(0, 60) + "..." : input));

            try {
                for (WorkflowNode node : nodes) {
                    WorkflowNodeInfo info = node.getNodeInfo();

                    // Emit node_start before executing the node.
                    sink.next(new WorkflowEvent("node_start", info.index(), info.name(),
                            "开始执行: " + info.name(), null, null));

                    try {
                        node.execute(context, agent);
                        sink.next(new WorkflowEvent("node_complete", info.index(), info.name(),
                                "完成: " + info.name(), summarizeResult(context, info), null));
                    } catch (Exception e) {
                        log.warn("Node {} ({}) failed: {}", info.index(), info.type(), e.getMessage());
                        context.getErrors().add("节点" + info.index() + "(" + info.name() + ")执行失败: "
                                + e.getMessage());
                        // Emit an error event but keep the workflow running.
                        sink.next(new WorkflowEvent("error", info.index(), info.name(),
                                "节点执行错误: " + e.getMessage(), null, null));
                    }
                }

                // Emit the final complete event with the assembled result.
                ExperimentResult result = context.getResult();
                if (result == null) {
                    result = buildFallbackResult(context);
                }
                sink.next(new WorkflowEvent("complete", null, null,
                        "工作流执行完成", null, result));
            } catch (Exception e) {
                log.error("Unexpected workflow error", e);
                sink.next(new WorkflowEvent("error", null, null,
                        "工作流执行错误: " + e.getMessage(), null, null));
            } finally {
                sink.complete();
            }
        }, reactor.core.publisher.FluxSink.OverflowStrategy.BUFFER)
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** Produce a short human-readable summary of the context state after a node. */
    private String summarizeResult(WorkflowContext context, WorkflowNodeInfo info) {
        switch (info.index()) {
            case 0: return context.getLanguage();
            case 1: return context.getIntent();
            case 2: return context.getExperimentType();
            case 3: return context.getSceneType();
            case 4: return context.getPhysicsLaws() == null ? "" : String.join(",", context.getPhysicsLaws());
            case 9: return context.getDescription() == null ? "" : context.getDescription();
            default: return null;
        }
    }

    /** Build a best-effort result if Node 11 did not run/produce one. */
    private ExperimentResult buildFallbackResult(WorkflowContext context) {
        ExperimentResult result = new ExperimentResult();
        result.setExperimentType(context.getExperimentType() != null
                ? context.getExperimentType() : "mechanics");
        result.setSceneType(context.getSceneType() != null
                ? context.getSceneType() : "freefall");
        result.setDescription(context.getDescription() != null
                ? context.getDescription() : "这是一个物理实验模拟。");
        result.setPhysicsLaws(context.getPhysicsLaws() != null
                ? new ArrayList<>(context.getPhysicsLaws()) : new ArrayList<>());
        result.setAiParams(context.getAiParams() != null ? context.getAiParams() : Map.of());
        result.setAugmentedInput(context.getAugmentedInput() != null
                ? context.getAugmentedInput() : (context.getInput() == null ? "" : context.getInput()));
        // Include 3D model from 混元生3D API if available
        if (context.getHunyuan3DModel() != null) {
            result.setHunyuan3DModel(context.getHunyuan3DModel());
        }
        return result;
    }
}
