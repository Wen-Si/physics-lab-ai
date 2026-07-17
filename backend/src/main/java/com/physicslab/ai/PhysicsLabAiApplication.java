package com.physicslab.ai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Physics Experiment AI Agent - Spring Boot main application class.
 *
 * <p>Uses Spring AI with ZhiPu AI (GLM-4.5-flash) to drive a 12-node physics
 * experiment workflow using the ReAct (Reason-Act) paradigm, and streams
 * real-time reasoning progress via SSE.</p>
 */
@SpringBootApplication
public class PhysicsLabAiApplication {

    public static void main(String[] args) {
        // Ensure the JVM HTTP proxy is configured for Spring AI's HTTP client.
        // The environment exposes http_proxy / https_proxy env vars, but the
        // JDK HttpClient (used by Spring AI's RestClient) reads JVM system
        // properties instead. We set them here so every HTTP call — including
        // ZhiPu AI API requests — goes through the proxy.
        configureProxy();

        SpringApplication.run(PhysicsLabAiApplication.class, args);
    }

    /**
     * Configure JVM-level HTTP/HTTPS proxy from environment variables.
     * This is needed because the sandbox environment requires all outbound
     * traffic to go through a proxy at 127.0.0.1:18080.
     */
    private static void configureProxy() {
        String httpProxy = System.getenv("https_proxy");
        if (httpProxy == null || httpProxy.isBlank()) {
            httpProxy = System.getenv("http_proxy");
        }
        if (httpProxy == null || httpProxy.isBlank()) {
            httpProxy = System.getenv("HTTPS_PROXY");
        }
        if (httpProxy == null || httpProxy.isBlank()) {
            httpProxy = System.getenv("HTTP_PROXY");
        }

        if (httpProxy != null && !httpProxy.isBlank()) {
            // Parse proxy URL like "http://127.0.0.1:18080"
            String proxyStr = httpProxy.replaceFirst("^https?://", "");
            String[] parts = proxyStr.split(":");
            if (parts.length == 2) {
                String host = parts[0];
                String port = parts[1];
                System.setProperty("http.proxyHost", host);
                System.setProperty("http.proxyPort", port);
                System.setProperty("https.proxyHost", host);
                System.setProperty("https.proxyPort", port);
                System.setProperty("http.nonProxyHosts", "localhost|127.0.0.1");
                System.out.println("[Proxy] Configured JVM HTTP proxy: " + host + ":" + port);
            }
        } else {
            // Fallback: try MAVEN_OPTS-style system properties already set
            String proxyHost = System.getProperty("https.proxyHost");
            if (proxyHost != null) {
                System.out.println("[Proxy] Using existing JVM proxy: " + proxyHost + ":" + System.getProperty("https.proxyPort"));
            } else {
                System.out.println("[Proxy] No proxy configuration found");
            }
        }
    }
}
