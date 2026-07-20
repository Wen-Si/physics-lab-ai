package com.physicslab.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.physicslab.ai.model.Hunyuan3DResult;
import com.physicslab.ai.model.Hunyuan3DResult.ModelFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for calling the 腾讯混元生3D (Tencent Hunyuan 3D) API.
 *
 * <p>Uses the OpenAI-compatible interface:
 * <ul>
 *   <li>Submit: POST {base-url}/v1/ai3d/submit  → returns JobId</li>
 *   <li>Query:  POST {base-url}/v1/ai3d/query   → returns Status + ResultFile3Ds</li>
 * </ul>
 *
 * <p>Authentication: the API key is sent in the {@code Authorization} header
 * (format: {@code Authorization: sk-xxx}).</p>
 *
 * <p>The API is asynchronous: after submitting a generation job, the service
 * polls the query endpoint every {@code poll-interval} seconds until the
 * job reaches a terminal state (DONE / FAIL) or the max poll time is
 * exceeded.</p>
 *
 * <p>All outbound HTTP traffic is routed through the sandbox proxy
 * (read from the {@code https_proxy} environment variable).</p>
 */
@Service
public class Hunyuan3DService {

    private static final Logger log = LoggerFactory.getLogger(Hunyuan3DService.class);

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** API key for 混元生3D (sk-xxx format, created from Tencent Cloud console). */
    @Value("${hunyuan.3d.api-key:}")
    private String apiKey;

    /** Base URL for the 混元生3D OpenAI-compatible API. */
    @Value("${hunyuan.3d.base-url:https://api.ai3d.cloud.tencent.com}")
    private String baseUrl;

    /** Model version: 3.0 or 3.1. */
    @Value("${hunyuan.3d.model-version:3.0}")
    private String modelVersion;

    /** Seconds between poll queries when waiting for 3D generation. */
    @Value("${hunyuan.3d.poll-interval:5}")
    private int pollIntervalSeconds;

    /** Maximum seconds to poll before giving up (returns TIMEOUT status). */
    @Value("${hunyuan.3d.max-poll-time:90}")
    private int maxPollTimeSeconds;

    /** HTTP client (proxy-aware, reused across calls). */
    private volatile HttpClient httpClient;

    // ========================================================================
    //  Public API
    // ========================================================================

    /**
     * Submit a 3D model generation job and poll until completion.
     *
     * <p>This is a blocking call that may take 30–90 seconds. The caller
     * should ensure it runs on a background thread (e.g. bounded-elastic
     * scheduler).</p>
     *
     * @param prompt the text prompt describing the 3D object to generate
     * @return a {@link Hunyuan3DResult} with status and model file URLs,
     *         or a result with status=ERROR if the API call fails
     */
    public Hunyuan3DResult generate3DModel(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return errorResult("Prompt is empty");
        }

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Hunyuan3D API key is not configured; skipping 3D generation");
            return errorResult("API key not configured");
        }

        log.info("Hunyuan3D: Submitting 3D generation job with prompt: {}",
                prompt.length() > 80 ? prompt.substring(0, 80) + "..." : prompt);

        // Step 1: Submit the job
        String jobId;
        try {
            jobId = submitJob(prompt);
        } catch (Exception e) {
            log.error("Hunyuan3D: Failed to submit job: {}", e.getMessage(), e);
            return errorResult("Submit failed: " + e.getMessage());
        }

        if (jobId == null || jobId.isBlank()) {
            return errorResult("Submit returned empty JobId");
        }

        log.info("Hunyuan3D: Job submitted, JobId={}", jobId);

        // Step 2: Poll for the result
        Hunyuan3DResult result = pollJob(jobId, prompt);
        log.info("Hunyuan3D: Job {} final status={}, modelFiles={}",
                jobId, result.getStatus(), result.getModelFiles().size());
        return result;
    }

    /** Check if the service is configured (API key present). */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    // ========================================================================
    //  Internal: Submit
    // ========================================================================

    /**
     * Submit a 3D generation job to the API.
     *
     * @return the JobId, or null if submission failed
     */
    private String submitJob(String prompt) throws Exception {
        ObjectNode requestBody = MAPPER.createObjectNode();
        requestBody.put("Prompt", prompt);
        requestBody.put("Model", modelVersion);

        HttpResponse<String> response = postJson(
                baseUrl + "/v1/ai3d/submit", requestBody.toString());

        if (response.statusCode() != 200) {
            log.error("Hunyuan3D submit failed: HTTP {} - {}", response.statusCode(), response.body());
            throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
        }

        JsonNode root = MAPPER.readTree(response.body());
        // The response may or may not be wrapped in "Response"
        JsonNode data = root.has("Response") ? root.get("Response") : root;

        // Check for API-level errors (e.g., ResourceInsufficient, rate limit)
        if (data.has("Error")) {
            JsonNode errorNode = data.get("Error");
            String errorCode = errorNode.has("Code") ? errorNode.get("Code").asText() : "Unknown";
            String errorMsg = errorNode.has("Message") ? errorNode.get("Message").asText() : "Unknown error";
            log.error("Hunyuan3D submit API error: {} - {}", errorCode, errorMsg);
            throw new RuntimeException(errorCode + ": " + errorMsg);
        }

        // Extract JobId (try both capitalizations)
        String jobId = data.has("JobId") ? data.get("JobId").asText() : null;
        if (jobId == null && data.has("jobId")) {
            jobId = data.get("jobId").asText();
        }
        return jobId;
    }

    // ========================================================================
    //  Internal: Poll
    // ========================================================================

    /**
     * Poll the query endpoint until the job reaches a terminal state
     * (DONE / FAIL) or the max poll time is exceeded.
     */
    private Hunyuan3DResult pollJob(String jobId, String prompt) {
        long deadlineMs = System.currentTimeMillis() + (maxPollTimeSeconds * 1000L);
        int pollCount = 0;

        while (System.currentTimeMillis() < deadlineMs) {
            pollCount++;
            try {
                Thread.sleep(pollCount == 1 ? 3000 : pollIntervalSeconds * 1000L);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                Hunyuan3DResult r = new Hunyuan3DResult(jobId, "TIMEOUT");
                r.setPrompt(prompt);
                r.setError("Polling interrupted");
                return r;
            }

            try {
                ObjectNode queryBody = MAPPER.createObjectNode();
                queryBody.put("JobId", jobId);

                HttpResponse<String> response = postJson(
                        baseUrl + "/v1/ai3d/query", queryBody.toString());

                if (response.statusCode() != 200) {
                    log.warn("Hunyuan3D query HTTP {} (poll #{})", response.statusCode(), pollCount);
                    continue;
                }

                JsonNode root = MAPPER.readTree(response.body());
                JsonNode data = root.has("Response") ? root.get("Response") : root;

                String status = data.has("Status") ? data.get("Status").asText() : "";
                log.debug("Hunyuan3D: Job {} poll #{} status={}", jobId, pollCount, status);

                if ("DONE".equals(status)) {
                    return parseDoneResult(jobId, prompt, data);
                }

                if ("FAIL".equals(status)) {
                    String errorMsg = data.has("ErrorMessage") ? data.get("ErrorMessage").asText() : "Unknown error";
                    String errorCode = data.has("ErrorCode") ? data.get("ErrorCode").asText() : "";
                    Hunyuan3DResult r = new Hunyuan3DResult(jobId, "FAIL");
                    r.setPrompt(prompt);
                    r.setError(errorCode + ": " + errorMsg);
                    return r;
                }

                // WAIT or RUN: continue polling
            } catch (Exception e) {
                log.warn("Hunyuan3D: Query failed (poll #{}): {}", pollCount, e.getMessage());
            }
        }

        // Timeout
        Hunyuan3DResult r = new Hunyuan3DResult(jobId, "TIMEOUT");
        r.setPrompt(prompt);
        r.setError("Polling timed out after " + maxPollTimeSeconds + "s (" + pollCount + " polls)");
        return r;
    }

    /** Parse the query response when status is DONE, extracting model files. */
    private Hunyuan3DResult parseDoneResult(String jobId, String prompt, JsonNode data) {
        Hunyuan3DResult result = new Hunyuan3DResult(jobId, "DONE");
        result.setPrompt(prompt);

        List<ModelFile> files = new ArrayList<>();
        JsonNode fileArray = data.get("ResultFile3Ds");
        if (fileArray != null && fileArray.isArray()) {
            for (JsonNode fileNode : fileArray) {
                String type = fileNode.has("Type") ? fileNode.get("Type").asText() : "";
                String url = fileNode.has("Url") ? fileNode.get("Url").asText() : "";
                String previewUrl = fileNode.has("PreviewImageUrl") ? fileNode.get("PreviewImageUrl").asText() : "";
                if (!url.isBlank()) {
                    files.add(new ModelFile(type, url, previewUrl));
                }
            }
        }
        result.setModelFiles(files);
        return result;
    }

    // ========================================================================
    //  Internal: HTTP
    // ========================================================================

    /**
     * POST JSON to the given URL with the Authorization header.
     * Uses the proxy-aware HttpClient.
     */
    private HttpResponse<String> postJson(String url, String jsonBody) throws Exception {
        HttpClient client = getHttpClient();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", apiKey)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    /**
     * Lazily create a proxy-aware HttpClient.
     *
     * <p>Reads the {@code https_proxy} / {@code http_proxy} environment
     * variables (standard in containerized environments). If no proxy is
     * configured, a direct-connection client is used.</p>
     */
    private HttpClient getHttpClient() {
        if (httpClient != null) {
            return httpClient;
        }

        synchronized (this) {
            if (httpClient != null) {
                return httpClient;
            }

            HttpClient.Builder builder = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15));

            // Configure proxy from environment variables
            String proxyUrl = System.getenv("https_proxy");
            if (proxyUrl == null || proxyUrl.isBlank()) proxyUrl = System.getenv("http_proxy");
            if (proxyUrl == null || proxyUrl.isBlank()) proxyUrl = System.getenv("HTTPS_PROXY");
            if (proxyUrl == null || proxyUrl.isBlank()) proxyUrl = System.getenv("HTTP_PROXY");

            if (proxyUrl != null && !proxyUrl.isBlank()) {
                String cleaned = proxyUrl.replaceFirst("^https?://", "");
                String[] parts = cleaned.split(":");
                if (parts.length == 2) {
                    String host = parts[0];
                    int port;
                    try {
                        port = Integer.parseInt(parts[1]);
                    } catch (NumberFormatException e) {
                        port = 18080;
                    }
                    builder.proxy(ProxySelector.of(new InetSocketAddress(host, port)));
                    log.info("Hunyuan3D: Configured HTTP proxy: {}:{}", host, port);
                }
            } else {
                log.warn("Hunyuan3D: No proxy configured; using direct connection");
            }

            httpClient = builder.build();
            return httpClient;
        }
    }

    // ========================================================================
    //  Helpers
    // ========================================================================

    private Hunyuan3DResult errorResult(String message) {
        Hunyuan3DResult r = new Hunyuan3DResult();
        r.setStatus("ERROR");
        r.setError(message);
        return r;
    }
}
