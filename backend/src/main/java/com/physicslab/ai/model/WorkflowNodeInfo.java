package com.physicslab.ai.model;

/**
 * Static metadata describing a single node in the 12-step physics
 * experiment workflow.
 *
 * @param index       zero-based position of the node (0-11)
 * @param type        machine-readable node type identifier
 * @param name        human-readable (Chinese) node name
 * @param description human-readable (Chinese) description of what the node does
 */
public record WorkflowNodeInfo(int index, String type, String name, String description) {
}
