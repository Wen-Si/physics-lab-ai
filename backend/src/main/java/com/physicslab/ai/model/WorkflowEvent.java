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
 *   <li>{@code complete}      - the whole workflow finished; {@link #output} holds the {@link ExperimentResult}</li>
 *   <li>{@code error}         - an error occurred during execution</li>
 * </ul>
 */
public class WorkflowEvent {

    /** Event type: node_start / node_complete / ai_thinking / complete / error. */
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

    public WorkflowEvent() {
    }

    public WorkflowEvent(String type, Integer nodeIndex, String nodeName,
                         String message, String result, Object output) {
        this.type = type;
        this.nodeIndex = nodeIndex;
        this.nodeName = nodeName;
        this.message = message;
        this.result = result;
        this.output = output;
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
}
