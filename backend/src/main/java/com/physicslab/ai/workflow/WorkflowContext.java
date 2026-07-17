package com.physicslab.ai.workflow;

import com.physicslab.ai.model.ExperimentResult;
import com.physicslab.ai.model.WorkflowEvent;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

/**
 * Mutable state container that is passed through the 12 workflow nodes.
 *
 * <p>Each node reads from and writes to this context. It also carries an
 * optional {@code eventSink} so that nodes can emit {@code ai_thinking}
 * events back to the SSE stream while they are calling ZhiPu AI.</p>
 */
public class WorkflowContext {

    /** Original user natural-language input. */
    private String input;

    /** Parsed/normalized input (keywords + entities) produced by Node 0. */
    private String parsedInput;

    /** Detected language: {@code "zh"} or {@code "en"}. */
    private String language = "zh";

    /** Recognized intent: simulate_experiment / explain_phenomenon / calculate_result / visualize_concept. */
    private String intent;

    /** Experiment category: mechanics / electromagnetism / optics / thermodynamics / waves / modern_physics. */
    private String experimentType;

    /** Scene type: freefall / pendulum / spring / projectile / ramp / circular / collision / angled_projectile / atwood / orbital. */
    private String sceneType;

    /** Generic extracted parameters (free-form). */
    private Map<String, Object> parameters = new LinkedHashMap<>();

    /** Applicable physics laws. */
    private List<String> physicsLaws = new ArrayList<>();

    /** AI-generated experiment description. */
    private String description;

    /** AI-extracted structured parameters (mass, height, angle, velocity, ...). */
    private Map<String, Object> aiParams = new LinkedHashMap<>();

    /** Augmented input string (original input + AI parameter hints). */
    private String augmentedInput;

    /** Validation warnings collected by Node 10. */
    private List<String> warnings = new ArrayList<>();

    /** Collected (non-fatal) errors during execution. */
    private List<String> errors = new ArrayList<>();

    /** Flag set by Node 6 indicating physics calculations are ready. */
    private boolean calculationsReady;

    /** Final experiment result assembled by Node 11 and emitted by the engine. */
    private ExperimentResult result;

    /** Optional event sink allowing nodes to emit SSE events (e.g. ai_thinking). */
    private Consumer<WorkflowEvent> eventSink;

    public WorkflowContext() {
    }

    public WorkflowContext(String input) {
        this.input = input;
    }

    /** Emit an {@code ai_thinking} event to the SSE stream, if a sink is attached. */
    public void emitAiThinking(Integer nodeIndex, String nodeName, String message) {
        if (eventSink != null) {
            eventSink.accept(new WorkflowEvent("ai_thinking", nodeIndex, nodeName, message, null, null));
        }
    }

    /**
     * Emit a {@code react_step} event carrying a single ReAct reasoning step
     * (Thought / Action / Observation / Final Answer) to the SSE stream.
     *
     * @param nodeIndex     the node currently executing
     * @param nodeName      the node name
     * @param stepType      one of: thought, action, observation, final_answer
     * @param content       the textual content of this reasoning step
     * @param stepNumber    1-based step counter within the current node
     */
    public void emitReActStep(Integer nodeIndex, String nodeName,
                              String stepType, String content, int stepNumber) {
        if (eventSink != null) {
            eventSink.accept(WorkflowEvent.reactStep(nodeIndex, nodeName, stepType, content, stepNumber));
        }
    }

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }

    public String getParsedInput() {
        return parsedInput;
    }

    public void setParsedInput(String parsedInput) {
        this.parsedInput = parsedInput;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public String getExperimentType() {
        return experimentType;
    }

    public void setExperimentType(String experimentType) {
        this.experimentType = experimentType;
    }

    public String getSceneType() {
        return sceneType;
    }

    public void setSceneType(String sceneType) {
        this.sceneType = sceneType;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }

    public List<String> getPhysicsLaws() {
        return physicsLaws;
    }

    public void setPhysicsLaws(List<String> physicsLaws) {
        this.physicsLaws = physicsLaws;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Map<String, Object> getAiParams() {
        return aiParams;
    }

    public void setAiParams(Map<String, Object> aiParams) {
        this.aiParams = aiParams;
    }

    public String getAugmentedInput() {
        return augmentedInput;
    }

    public void setAugmentedInput(String augmentedInput) {
        this.augmentedInput = augmentedInput;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public List<String> getErrors() {
        return errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors;
    }

    public boolean isCalculationsReady() {
        return calculationsReady;
    }

    public void setCalculationsReady(boolean calculationsReady) {
        this.calculationsReady = calculationsReady;
    }

    public Consumer<WorkflowEvent> getEventSink() {
        return eventSink;
    }

    public void setEventSink(Consumer<WorkflowEvent> eventSink) {
        this.eventSink = eventSink;
    }

    public ExperimentResult getResult() {
        return result;
    }

    public void setResult(ExperimentResult result) {
        this.result = result;
    }
}
