package com.physicslab.ai.agent;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * The AI agent that wraps Spring AI's {@link ChatClient} (backed by ZhiPu AI
 * glm-4-flash) to perform natural-language understanding for the physics
 * experiment workflow.
 *
 * <p>All AI calls are wrapped with an 8-second timeout and a try-catch. On
 * failure the methods return {@code null}/empty values so that the workflow
 * can continue with rule-based fallbacks - the workflow never fails
 * completely just because the AI is unavailable.</p>
 */
@Component
public class PhysicsExperimentAgent {

    private static final Logger log = LoggerFactory.getLogger(PhysicsExperimentAgent.class);

    /** Maximum time to wait for a single AI call (in seconds). */
    private static final long AI_TIMEOUT_SECONDS = 8;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final ChatClient chatClient;

    @Autowired
    public PhysicsExperimentAgent(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    /**
     * Call ZhiPu AI with a system prompt instructing it to parse a physics
     * experiment description and return a JSON object with
     * {@code experimentType}, {@code parameters}, {@code physicsLaws} and
     * {@code description}.
     *
     * @param userInput the user's natural-language experiment description
     * @return the raw AI response string (JSON), or {@code null} on failure/timeout
     */
    public String callAI(String userInput) {
        if (userInput == null || userInput.isBlank()) {
            return null;
        }
        String systemPrompt = """
                你是一个物理实验解析助手。请分析用户输入的物理实验描述，并返回一个 JSON 对象，\
                包含以下字段：
                - experimentType: 实验类别（mechanics/electromagnetism/optics/thermodynamics/waves/modern_physics）
                - parameters: 从文本中提取的物理参数对象（如 mass、height、angle、velocity、length、radius 等）
                - physicsLaws: 适用的物理定律数组（中文）
                - description: 一句话实验描述（中文）
                只返回纯 JSON，不要包含 markdown 代码块标记或额外解释。""";

        try {
            CompletableFuture<String> future = CompletableFuture.supplyAsync(() ->
                    chatClient.prompt()
                            .system(systemPrompt)
                            .user(userInput)
                            .call()
                            .content());
            return future.get(AI_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            log.warn("AI call timed out after {}s for input: {}", AI_TIMEOUT_SECONDS,
                    userInput.length() > 60 ? userInput.substring(0, 60) + "..." : userInput);
            return null;
        } catch (Exception e) {
            log.warn("AI call failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Parse a JSON response from the AI into a {@code Map<String, Object>}.
     * Handles responses that may be wrapped in markdown code fences.
     *
     * @param response the raw AI response string
     * @return parsed map, or an empty map on failure
     */
    public Map<String, Object> parseAIResponse(String response) {
        if (response == null || response.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            String json = response.trim();
            // Strip markdown code fences if present.
            if (json.startsWith("```")) {
                int firstNewline = json.indexOf('\n');
                if (firstNewline != -1) {
                    json = json.substring(firstNewline + 1);
                }
                int lastFence = json.lastIndexOf("```");
                if (lastFence != -1) {
                    json = json.substring(0, lastFence);
                }
                json = json.trim();
            }
            return MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception e) {
            log.warn("Failed to parse AI response as JSON: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    /**
     * Use ZhiPu AI to generate a one-sentence description of the experiment.
     *
     * @param userInput the user's natural-language experiment description
     * @param sceneType the detected scene type (may be used as a hint)
     * @return a one-sentence Chinese description, or {@code null} on failure/timeout
     */
    public String generateDescription(String userInput, String sceneType) {
        if (userInput == null || userInput.isBlank()) {
            return null;
        }
        String prompt = "请用一句话描述以下物理实验：" + userInput;
        try {
            CompletableFuture<String> future = CompletableFuture.supplyAsync(() ->
                    chatClient.prompt()
                            .system("你是一个物理实验描述助手，请用简洁准确的一句话描述物理实验。")
                            .user(prompt)
                            .call()
                            .content());
            String result = future.get(AI_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            return (result == null || result.isBlank()) ? null : result.trim();
        } catch (TimeoutException e) {
            log.warn("generateDescription timed out after {}s", AI_TIMEOUT_SECONDS);
            return null;
        } catch (Exception e) {
            log.warn("generateDescription failed: {}", e.getMessage());
            return null;
        }
    }
}
