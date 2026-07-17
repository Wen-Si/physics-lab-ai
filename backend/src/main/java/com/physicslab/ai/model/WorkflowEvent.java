package com.physicslab.ai.model;

/**
 * A single Server-Sent Event emitted by the workflow engine while it
 * executes the 12 physics experiment nodes.
 *
 * <p>Event {@code type} values:</p>
 * <ul>
 *   <li>{@code node_start}    - a node has started executing</li>
 *   <li>{@code node_complete} - a node has finished executing</li>
 *   <li>{@code ai_thinking}   - the agent is calling ZhiPu AI within a node</li>
 *   <li>{@code react_step}    - a ReAct (Reason-Act) reasoning step: Thought / Action / Observation / Final Answer</li>
 *   <li>{@code complete}      - the whole workflow finished; {@link #output} holds the {@link ExperimentResult}</li>
 *   <li>{@code error}         - an error occurred during execution</li>
 * </ul>
 */
public class WorkflowEvent {

    /** Event type: node_start / node_complete / ai_thinking / react_step / complete / error. */
    private String type;

    /** Index of the node this event relates to (null for complete/error). */
    private Integer nodeIndex;

    /** Name of the node this event relates to (null for complete/error). */
    private String nodeName;

    /** Human-readable message describing the event. */
    private String message;

    /** Optional result snippet produced by the node. */
    private String result;

    /** For {@code complete} events: the final {@link ExperimentResult}. */
    private Object output;

    /** For {@code react_step} events: the step type — thought / action / observation / final_answer. */
    private String reactStepType;

    /** For {@code react_step} events: the textual content of the reasoning step. */
    private String reactStepContent;

    /** For {@code react_step} events: the 1-based step number within the current node. */
    private Integer reactStepNumber;

    public WorkflowEvent() {
    }

    /**
     * Constructor for general events (node_start, node_complete, ai_thinking, complete, error).
     *
     * @param type      event type
     * @param nodeIndex node index (null for complete/error)
     * @param nodeName  node name (null for complete/error)
     * @param message   human-readable message
     * @param result    optional result snippet
     * @param output    for complete events: the ExperimentResult
     */
    public WorkflowEvent(String type, Integer nodeIndex, String nodeName,
                         String message, String result, Object output) {
        this.type = type;
        this.nodeIndex = nodeIndex;
        this.nodeName = nodeName;
        this.message = message;
        this.result = result;
        this.output = output;
    }

    /**
     * Static factory for {@code react_step} events.
     * Avoids constructor ambiguity with the general 6-arg constructor.
     *
     * @param nodeIndex        the node emitting this step
     * @param nodeName         the node name
     * @param reactStepType    thought / action / observation / final_answer
     * @param reactStepContent the step content text
     * @param reactStepNumber  1-based step number
     * @return a new WorkflowEvent with type "react_step"
     */
    public static WorkflowEvent reactStep(Integer nodeIndex, String nodeName,
                                          String reactStepType, String reactStepContent,
                                          int reactStepNumber) {
        WorkflowEvent event = new WorkflowEvent();
        event.type = "react_step";
        event.nodeIndex = nodeIndex;
        event.nodeName = nodeName;
        event.reactStepType = reactStepType;
        event.reactStepContent = reactStepContent;
        event.reactStepNumber = reactStepNumber;
        return event;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getNodeIndex() {
        return nodeIndex;
    }

    public void setNodeIndex(Integer nodeIndex) {
        this.nodeIndex = nodeIndex;
    }

    public String getNodeName() {
        return nodeName;
    }

    public void setNodeName(String nodeName) {
        this.nodeName = nodeName;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public Object getOutput() {
        return output;
    }

    public void setOutput(Object output) {
        this.output = output;
    }

    public String getReactStepType() {
        return reactStepType;
    }

    public void setReactStepType(String reactStepType) {
        this.reactStepType = reactStepType;
    }

    public String getReactStepContent() {
        return reactStepContent;
    }

    public void setReactStepContent(String reactStepContent) {
        this.reactStepContent = reactStepContent;
    }

    public Integer getReactStepNumber() {
        return reactStepNumber;
    }

    public void setReactStepNumber(Integer reactStepNumber) {
        this.reactStepNumber = reactStepNumber;
    }
}
