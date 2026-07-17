package com.physicslab.ai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Physics Experiment AI Agent - Spring Boot main application class.
 *
 * <p>Uses Spring AI with ZhiPu AI (glm-4-flash) to drive a 12-node physics
 * experiment workflow and stream real-time progress via SSE.</p>
 */
@SpringBootApplication
public class PhysicsLabAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(PhysicsLabAiApplication.class, args);
    }
}
