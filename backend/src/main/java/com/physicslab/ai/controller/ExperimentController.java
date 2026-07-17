package com.physicslab.ai.controller;

import com.physicslab.ai.model.ExperimentRequest;
import com.physicslab.ai.model.WorkflowEvent;
import com.physicslab.ai.workflow.WorkflowEngine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

/**
 * REST controller exposing the physics experiment generation API.
 *
 * <p>{@code POST /api/experiment/generate} streams the 12-node workflow
 * progress back to the client as Server-Sent Events (one JSON
 * {@link WorkflowEvent} per {@code data:} line). The frontend (hosted on
 * GitHub Pages) consumes this SSE stream to render real-time progress.</p>
 */
@RestController
@RequestMapping("/api/experiment")
@CrossOrigin(origins = "*")
public class ExperimentController {

    private final WorkflowEngine workflowEngine;

    @Autowired
    public ExperimentController(WorkflowEngine workflowEngine) {
        this.workflowEngine = workflowEngine;
    }

    /**
     * Generate a physics experiment from the user's natural-language input,
     * streaming workflow progress as SSE.
     *
     * <p>Each emitted {@link WorkflowEvent} is wrapped in a
     * {@link ServerSentEvent} so Spring serializes it as a standard SSE
     * {@code data: {json}\n\n} line.</p>
     *
     * @param request optional JSON body {@code {"input": "..."}} containing the user input
     * @param input   optional query/form parameter fallback for the user input
     * @return a {@link Flux} of SSE events
     */
    @PostMapping(value = "/generate", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<WorkflowEvent>> generate(
            @RequestBody(required = false) ExperimentRequest request,
            @RequestParam(value = "input", required = false) String input) {

        String userInput = resolveInput(request, input);

        return workflowEngine.execute(userInput)
                .map(event -> ServerSentEvent.<WorkflowEvent>builder(event).build());
    }

    /**
     * Simple health-check endpoint used by the frontend (and any uptime
     * monitor) to verify the backend is reachable.
     *
     * @return the string {@code "OK"}
     */
    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    private String resolveInput(ExperimentRequest request, String input) {
        if (request != null && request.getInput() != null && !request.getInput().isBlank()) {
            return request.getInput();
        }
        if (input != null && !input.isBlank()) {
            return input;
        }
        return "";
    }
}
