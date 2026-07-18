package com.physicslab.ai.model;

import java.util.List;

/**
 * Result returned by the knowledge mapping agent (Agent 2).
 *
 * <p>Contains the mapped knowledge-node IDs, the Top-5 core node IDs,
 * and a natural-language summary of the AI's analysis.</p>
 */
public class KnowledgeMappingResult {

    /** IDs of all knowledge nodes mapped to this experiment. */
    private List<String> mappedNodeIds;

    /** IDs of the Top-5 most important nodes (highest priority). */
    private List<String> topNodeIds;

    /** AI-generated summary of the knowledge analysis. */
    private String summary;

    /** AI-identified key concepts (Chinese names). */
    private List<String> keyConcepts;

    /** AI-identified key formulas (Chinese names). */
    private List<String> keyFormulas;

    /** AI-identified key laws (Chinese names). */
    private List<String> keyLaws;

    /** AI-identified key processes (Chinese names). */
    private List<String> keyProcesses;

    public KnowledgeMappingResult() {
    }

    public List<String> getMappedNodeIds() { return mappedNodeIds; }
    public void setMappedNodeIds(List<String> mappedNodeIds) { this.mappedNodeIds = mappedNodeIds; }

    public List<String> getTopNodeIds() { return topNodeIds; }
    public void setTopNodeIds(List<String> topNodeIds) { this.topNodeIds = topNodeIds; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public List<String> getKeyConcepts() { return keyConcepts; }
    public void setKeyConcepts(List<String> keyConcepts) { this.keyConcepts = keyConcepts; }

    public List<String> getKeyFormulas() { return keyFormulas; }
    public void setKeyFormulas(List<String> keyFormulas) { this.keyFormulas = keyFormulas; }

    public List<String> getKeyLaws() { return keyLaws; }
    public void setKeyLaws(List<String> keyLaws) { this.keyLaws = keyLaws; }

    public List<String> getKeyProcesses() { return keyProcesses; }
    public void setKeyProcesses(List<String> keyProcesses) { this.keyProcesses = keyProcesses; }
}
