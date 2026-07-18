package com.physicslab.ai.model;

import java.util.List;
import java.util.Map;

/**
 * Request payload for the knowledge mapping agent (Agent 2).
 *
 * <p>Carries the experiment metadata produced by Agent 1 (the 12-node
 * workflow) plus the full list of knowledge-graph node identifiers so
 * that Agent 2 can reason about which nodes are relevant to the
 * experiment.</p>
 */
public class KnowledgeMappingRequest {

    /** The user's original natural-language input. */
    private String userInput;

    /** Experiment type, e.g. "mechanics". */
    private String experimentType;

    /** Scene type, e.g. "freefall", "pendulum", "spring". */
    private String sceneType;

    /** AI-generated experiment description. */
    private String description;

    /** Physics laws matched by the workflow, e.g. ["牛顿第二定律", "能量守恒定律"]. */
    private List<String> physicsLaws;

    /** AI-extracted parameters, e.g. {"mass": 2.0, "height": 10.0}. */
    private Map<String, Object> parameters;

    /**
     * Knowledge-graph nodes available for mapping. Each entry is a
     * compact JSON string: {"id":"...","name":"...","type":"..."}.
     * Sent by the frontend from its static knowledge graph.
     */
    private List<KnowledgeNodeInfo> knowledgeNodes;

    /** Default constructor for Jackson deserialization. */
    public KnowledgeMappingRequest() {
    }

    // --- Getters and Setters ---

    public String getUserInput() {
        return userInput;
    }

    public void setUserInput(String userInput) {
        this.userInput = userInput;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getPhysicsLaws() {
        return physicsLaws;
    }

    public void setPhysicsLaws(List<String> physicsLaws) {
        this.physicsLaws = physicsLaws;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }

    public List<KnowledgeNodeInfo> getKnowledgeNodes() {
        return knowledgeNodes;
    }

    public void setKnowledgeNodes(List<KnowledgeNodeInfo> knowledgeNodes) {
        this.knowledgeNodes = knowledgeNodes;
    }

    /**
     * Compact knowledge-node descriptor sent by the frontend.
     */
    public static class KnowledgeNodeInfo {
        private String id;
        private String name;
        private String type;

        public KnowledgeNodeInfo() {
        }

        public KnowledgeNodeInfo(String id, String name, String type) {
            this.id = id;
            this.name = name;
            this.type = type;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        @Override
        public String toString() {
            return id + "(" + name + ", " + type + ")";
        }
    }
}
