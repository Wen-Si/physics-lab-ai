package com.physicslab.ai.controller;

import com.physicslab.ai.agent.KnowledgeMappingAgent;
import com.physicslab.ai.model.ExperimentRequest;
import com.physicslab.ai.model.KnowledgeMappingRequest;
import com.physicslab.ai.model.KnowledgeMappingResult;
import com.physicslab.ai.model.WorkflowEvent;
import com.physicslab.ai.workflow.WorkflowEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

/**
 * REST controller exposing two AI agents:
 *
 * <ul>
 *   <li><b>Agent 1</b> — Experiment Generation Agent (12-node workflow):
 *       {@code POST /api/experiment/generate}</li>
 *   <li><b>Agent 2</b> — Knowledge Mapping Agent:
 *       {@code POST /api/experiment/knowledge-map}</li>
 * </ul>
 *
 * <p>Both endpoints return SSE streams so the frontend can display
 * real-time ReAct reasoning steps.</p>
 */
@RestController
@RequestMapping("/api/experiment")
@CrossOrigin(origins = "*")
public class ExperimentController {

    private static final Logger log = LoggerFactory.getLogger(ExperimentController.class);

    private final WorkflowEngine workflowEngine;
    private final KnowledgeMappingAgent knowledgeMappingAgent;

    public ExperimentController(WorkflowEngine workflowEngine,
                                KnowledgeMappingAgent knowledgeMappingAgent) {
        this.workflowEngine = workflowEngine;
        this.knowledgeMappingAgent = knowledgeMappingAgent;
    }

    // ========================================================================
    //  Agent 1: Experiment Generation (12-node workflow)
    // ========================================================================

    /**
     * Agent 1 — Generate a 3D physics experiment from natural language
     * via the 12-node ReAct workflow.
     *
     * @return SSE stream of workflow events (node_start, node_complete,
     *         ai_thinking, react_step, complete, error)
     */
    @PostMapping(value = "/generate", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<WorkflowEvent>> generate(
            @RequestBody(required = false) ExperimentRequest request,
            @RequestParam(value = "input", required = false) String input) {

        String userInput = resolveInput(request, input);
        log.info("Agent 1: Generating experiment for input: {}",
                userInput.length() > 80 ? userInput.substring(0, 80) + "..." : userInput);

        return workflowEngine.execute(userInput)
                .map(event -> ServerSentEvent.<WorkflowEvent>builder(event).build());
    }

    // ========================================================================
    //  Agent 2: Knowledge Mapping
    // ========================================================================

    /**
     * Agent 2 — Map the generated experiment to the knowledge graph.
     *
     * <p>Takes the experiment metadata (sceneType, physicsLaws, parameters,
     * description) plus the full knowledge-node list from the frontend,
     * and uses ReAct reasoning to identify and rank the relevant
     * knowledge nodes.</p>
     *
     * @return SSE stream of react_step events followed by a complete event
     *         containing the {@link KnowledgeMappingResult}
     */
    @PostMapping(value = "/knowledge-map", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<WorkflowEvent>> knowledgeMap(
            @RequestBody KnowledgeMappingRequest request) {

        log.info("Agent 2: Mapping knowledge for scene: {}, laws: {}",
                request.getSceneType(),
                request.getPhysicsLaws() != null ? request.getPhysicsLaws().size() : 0);

        Sinks.Many<ServerSentEvent<WorkflowEvent>> sink = Sinks.many().multicast().onBackpressureBuffer();

        // Run the agent on a background thread and emit events
        Thread agentThread = new Thread(() -> {
            try {
                Consumer<WorkflowEvent> eventSink = event -> {
                    sink.tryEmitNext(ServerSentEvent.<WorkflowEvent>builder(event).build());
                };

                // Execute the knowledge mapping agent
                KnowledgeMappingResult result = knowledgeMappingAgent.mapKnowledge(request, eventSink);

                // Emit complete event with the result
                WorkflowEvent completeEvent = new WorkflowEvent();
                completeEvent.setType("complete");
                completeEvent.setNodeName("知识映射智能体");
                completeEvent.setOutput(result);
                sink.tryEmitNext(ServerSentEvent.<WorkflowEvent>builder(completeEvent).build());

            } catch (Exception e) {
                log.error("Agent 2 failed: {}", e.getMessage(), e);
                WorkflowEvent errorEvent = new WorkflowEvent();
                errorEvent.setType("error");
                errorEvent.setMessage("知识映射智能体执行失败: " + e.getMessage());
                sink.tryEmitNext(ServerSentEvent.<WorkflowEvent>builder(errorEvent).build());
            } finally {
                sink.tryEmitComplete();
            }
        }, "agent2-knowledge-mapping");
        agentThread.setDaemon(true);
        agentThread.start();

        return sink.asFlux();
    }

    // ========================================================================
    //  Health Check
    // ========================================================================

    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    // ========================================================================
    //  Helpers
    // ========================================================================

    private String resolveInput(ExperimentRequest request, String input) {
        if (request != null && request.getInput() != null && !request.getInput().isBlank()) {
            return request.getInput();
        }
        if (input != null && !input.isBlank()) {
            return input;
        }
        return "一个质量为2kg的小球从10米高处自由落下";
    }
}
