package com.physicslab.ai.model;

/**
 * Request payload for the experiment generation endpoint.
 *
 * <p>Carries the user's natural language description of the physics
 * experiment they want to simulate.</p>
 */
public class ExperimentRequest {

    /** User's natural language input describing the experiment. */
    private String input;

    public ExperimentRequest() {
    }

    public ExperimentRequest(String input) {
        this.input = input;
    }

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }
}
