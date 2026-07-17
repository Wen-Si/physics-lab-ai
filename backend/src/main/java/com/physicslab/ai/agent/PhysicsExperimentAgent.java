package com.physicslab.ai.agent;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.physicslab.ai.workflow.WorkflowContext;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.BiFunction;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The AI agent that wraps Spring AI's {@link ChatClient} (backed by ZhiPu AI
 * GLM-4.5-flash) to perform natural-language understanding for the physics
 * experiment workflow.
 *
 * <p>This agent implements the <strong>ReAct (Reason-Act)</strong> paradigm:
 * the LLM reasons step-by-step using a Thought → Action → Observation loop,
 * and each step is streamed to the frontend in real time via
 * {@link WorkflowContext#emitReActStep(Integer, String, String, String, int)}.</p>
 *
 * <p>All AI calls are wrapped with a 15-second timeout and a try-catch. On
 * failure the methods return {@code null}/empty values so that the workflow
 * can continue with rule-based fallbacks.</p>
 */
@Component
public class PhysicsExperimentAgent {

    private static final Logger log = LoggerFactory.getLogger(PhysicsExperimentAgent.class);

    /** Maximum time to wait for a single AI call (in seconds). */
    private static final long AI_TIMEOUT_SECONDS = 30;

    /** Maximum ReAct reasoning rounds (Thought→Action→Observation loops). */
    private static final int MAX_REACT_ROUNDS = 3;

    /** Maximum retries on HTTP 429 (rate limit) before giving up. */
    private static final int MAX_RATE_LIMIT_RETRIES = 3;

    /** Base delay (ms) between rate-limit retries — doubles each time (exponential backoff). */
    private static final long RATE_LIMIT_BASE_DELAY_MS = 2000;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final ChatClient chatClient;

    @Autowired
    public PhysicsExperimentAgent(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    // ========================================================================
    //  ReAct (Reason-Act) Engine
    // ========================================================================

    /**
     * Functional interface for executing a ReAct action locally.
     * The implementor receives the action name and action input, and returns
     * an observation string that is fed back to the LLM.
     */
    @FunctionalInterface
    public interface ActionExecutor extends BiFunction<String, String, String> {
    }

    /**
     * Execute a ReAct (Reason-Act) loop for a specific workflow node.
     *
     * <p>The LLM (GLM-4.5-flash) is prompted to reason in the following format:</p>
     * <pre>
     * Thought: 我需要分析用户输入...
     * Action: classify_experiment
     * Action Input: 一个质量为2kg的小球从10米高处自由落下
     * </pre>
     * <p>After the action is executed locally, the observation is fed back:</p>
     * <pre>
     * Observation: 检测到关键词"自由落体"，实验类型为mechanics
     * </pre>
     * <p>The loop continues until the LLM emits a {@code Final Answer} or the
     * maximum round count is reached. Every Thought, Action, Observation, and
     * Final Answer is streamed to the frontend as a {@code react_step} event.</p>
     *
     * @param userInput         the user's natural-language input
     * @param taskDescription   what this node needs to accomplish (Chinese)
     * @param availableTools    description of available tools/actions (Chinese)
     * @param actionExecutor    function that executes an action and returns an observation
     * @param context           workflow context (for emitting ReAct step events)
     * @param nodeIndex         the index of the calling node
     * @param nodeName          the name of the calling node
     * @return the Final Answer text from the LLM, or {@code null} on failure
     */
    public String callWithReAct(String userInput, String taskDescription, String availableTools,
                                ActionExecutor actionExecutor,
                                WorkflowContext context, int nodeIndex, String nodeName) {
        if (userInput == null || userInput.isBlank()) {
            return null;
        }

        String systemPrompt = buildReActSystemPrompt(taskDescription, availableTools);

        // Conversation history: system prompt + accumulated turns
        StringBuilder conversationHistory = new StringBuilder();
        conversationHistory.append("用户输入：").append(userInput).append("\n\n");
        conversationHistory.append("请开始 ReAct 推理。\n");

        int stepNumber = 0;

        for (int round = 0; round < MAX_REACT_ROUNDS; round++) {
            // ---- 1. Call LLM for the next Thought + Action (or Final Answer) ----
            String aiResponse;
            try {
                aiResponse = callChatClient(systemPrompt, conversationHistory.toString());
            } catch (Exception e) {
                log.warn("ReAct round {} AI call failed for node {}: {} ({})",
                        round, nodeName, e.getMessage(), e.getClass().getSimpleName());
                return null;
            }

            if (aiResponse == null || aiResponse.isBlank()) {
                log.warn("ReAct round {} returned empty response for node {}", round, nodeName);
                return null;
            }

            // ---- 2. Parse the LLM response ----
            ReActParseResult parsed = parseReActResponse(aiResponse);

            // Emit Thought step
            if (parsed.thought != null && !parsed.thought.isBlank()) {
                stepNumber++;
                context.emitReActStep(nodeIndex, nodeName, "thought",
                        parsed.thought.trim(), stepNumber);
                conversationHistory.append("Thought: ").append(parsed.thought.trim()).append("\n");
            }

            // Check for Final Answer
            if (parsed.finalAnswer != null && !parsed.finalAnswer.isBlank()) {
                stepNumber++;
                context.emitReActStep(nodeIndex, nodeName, "final_answer",
                        parsed.finalAnswer.trim(), stepNumber);
                conversationHistory.append("Final Answer: ").append(parsed.finalAnswer.trim()).append("\n");
                return parsed.finalAnswer.trim();
            }

            // Emit Action step
            if (parsed.action != null && !parsed.action.isBlank()) {
                stepNumber++;
                String actionDisplay = parsed.action.trim();
                if (parsed.actionInput != null && !parsed.actionInput.isBlank()) {
                    actionDisplay += "[" + parsed.actionInput.trim() + "]";
                }
                context.emitReActStep(nodeIndex, nodeName, "action",
                        actionDisplay, stepNumber);
                conversationHistory.append("Action: ").append(parsed.action.trim()).append("\n");
                if (parsed.actionInput != null) {
                    conversationHistory.append("Action Input: ").append(parsed.actionInput.trim()).append("\n");
                }

                // ---- 3. Execute the action locally ----
                String observation;
                try {
                    observation = actionExecutor.apply(
                            parsed.action.trim(),
                            parsed.actionInput != null ? parsed.actionInput.trim() : userInput);
                } catch (Exception e) {
                    observation = "动作执行失败: " + e.getMessage();
                }

                if (observation == null || observation.isBlank()) {
                    observation = "无观察结果";
                }

                // Emit Observation step
                stepNumber++;
                context.emitReActStep(nodeIndex, nodeName, "observation",
                        observation, stepNumber);
                conversationHistory.append("Observation: ").append(observation).append("\n\n");
                conversationHistory.append("请继续推理，或给出 Final Answer。\n");
            } else {
                // LLM didn't produce an action or final answer — ask it to conclude
                conversationHistory.append("\n请直接给出 Final Answer。\n");
            }

            // Small delay between ReAct rounds to avoid hitting ZhiPu AI rate limits.
            // GLM-4.5-flash allows ~5 req/s; without this delay, rapid successive
            // calls within a single node's ReAct loop can trigger HTTP 429.
            if (round < MAX_REACT_ROUNDS - 1) {
                try {
                    Thread.sleep(500);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        // ---- Max rounds reached: ask LLM for a final answer based on observations ----
        log.info("ReAct max rounds ({}) reached for node {}, requesting final answer", MAX_REACT_ROUNDS, nodeName);
        try {
            String finalResponse = callChatClient(systemPrompt,
                    conversationHistory.toString() + "\n请根据以上推理直接给出 Final Answer。");
            if (finalResponse != null && !finalResponse.isBlank()) {
                ReActParseResult finalParsed = parseReActResponse(finalResponse);
                String answer = finalParsed.finalAnswer != null ? finalParsed.finalAnswer.trim() : finalResponse.trim();
                stepNumber++;
                context.emitReActStep(nodeIndex, nodeName, "final_answer", answer, stepNumber);
                return answer;
            }
        } catch (Exception e) {
            log.warn("ReAct final answer request failed: {}", e.getMessage());
        }

        return null;
    }

    /**
     * Build the ReAct system prompt that instructs GLM-4.5-flash to use the
     * Thought/Action/Observation format.
     */
    private String buildReActSystemPrompt(String taskDescription, String availableTools) {
        return """
                你是一个物理实验AI智能体，使用 ReAct (Reason-Act) 范式进行推理和行动。

                请严格按照以下格式输出，每一步占一行：

                Thought: 你的推理过程（分析当前情况，决定下一步做什么）
                Action: 要执行的动作名称
                Action Input: 动作的输入参数

                当你根据观察结果得出最终结论时，使用：

                Thought: 最终推理
                Final Answer: 最终答案

                可用工具：
                """ + availableTools + """

                任务：""" + taskDescription + """

                规则：
                1. 每次只输出一个 Thought 和一个 Action（或 Final Answer）
                2. Action 必须是可用工具之一
                3. 推理要简洁明了，用中文
                4. Final Answer 应该是对任务的直接回答
                """;
    }

    /**
     * Parse a ReAct-formatted LLM response, extracting Thought, Action,
     * Action Input, and Final Answer fields.
     */
    private ReActParseResult parseReActResponse(String response) {
        ReActParseResult result = new ReActParseResult();

        // Extract Thought
        result.thought = extractField(response, "Thought");

        // Extract Final Answer (takes precedence over Action)
        result.finalAnswer = extractField(response, "Final Answer");

        // Extract Action and Action Input
        result.action = extractField(response, "Action");
        result.actionInput = extractField(response, "Action Input");

        return result;
    }

    /**
     * Extract the content after a field label (e.g. "Thought:") up to the
     * next field label or end of text.
     */
    private String extractField(String text, String fieldName) {
        // Match "FieldName: content" where content extends to the next known
        // field label or end of string.
        String[] knownFields = {"Thought", "Action Input", "Action", "Final Answer", "Observation"};
        String pattern = fieldName + "\\s*[:：]\\s*(.+)";
        Matcher matcher = Pattern.compile(pattern, Pattern.MULTILINE | Pattern.DOTALL).matcher(text);
        if (!matcher.find()) {
            return null;
        }
        String content = matcher.group(1);
        // Trim at the next known field
        for (String field : knownFields) {
            if (field.equals(fieldName)) continue;
            int idx = content.indexOf(field + ":");
            if (idx == -1) idx = content.indexOf(field + "：");
            if (idx > 0) {
                content = content.substring(0, idx);
            }
        }
        return content.trim();
    }

    // ========================================================================
    //  Low-level ChatClient wrapper
    // ========================================================================

    /**
     * Call ChatClient with a system prompt and user message, with timeout.
     * Unwraps {@link ExecutionException} to expose the root cause.
     *
     * <p>Includes automatic retry with exponential backoff for HTTP 429 (rate limit)
     * errors from the ZhiPu AI API. The GLM-4.5-flash model has a rate limit of
     * ~5 requests/second, and the ReAct loop can generate rapid sequential calls
     * that exceed this limit.</p>
     */
    private String callChatClient(String systemPrompt, String userMessage) throws Exception {
        Exception lastException = null;

        for (int attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
            try {
                CompletableFuture<String> future = CompletableFuture.supplyAsync(() ->
                        chatClient.prompt()
                                .system(systemPrompt)
                                .user(userMessage)
                                .call()
                                .content());
                return future.get(AI_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            } catch (ExecutionException e) {
                Throwable cause = e.getCause() != null ? e.getCause() : e;

                // Check if this is a rate-limit error (HTTP 429)
                String errorMsg = cause.getMessage() != null ? cause.getMessage() : "";
                boolean isRateLimit = errorMsg.contains("429") || errorMsg.contains("速率限制") || errorMsg.contains("rate limit");

                if (isRateLimit && attempt < MAX_RATE_LIMIT_RETRIES) {
                    long delay = RATE_LIMIT_BASE_DELAY_MS * (1L << attempt); // 2s, 4s, 8s
                    log.warn("Rate limited (429) on attempt {}/{} for node, retrying in {}ms...",
                            attempt + 1, MAX_RATE_LIMIT_RETRIES + 1, delay);
                    Thread.sleep(delay);
                    lastException = cause instanceof Exception ex ? ex : e;
                    continue;
                }

                log.error("ChatClient call failed. Root cause: {} - {}",
                        cause.getClass().getName(), cause.getMessage(), cause);
                throw cause instanceof Exception ex ? ex : e;
            }
        }

        // Should not reach here, but just in case
        throw lastException != null ? lastException : new RuntimeException("AI call failed after retries");
    }

    // ========================================================================
    //  Legacy methods (kept for backward compatibility with nodes that
    //  haven't been migrated to ReAct yet)
    // ========================================================================

    /**
     * Call ZhiPu AI with a system prompt instructing it to parse a physics
     * experiment description and return a JSON object.
     *
     * @deprecated Prefer {@link #callWithReAct} for new code.
     * @param userInput the user's natural-language experiment description
     * @return the raw AI response string (JSON), or {@code null} on failure/timeout
     */
    @Deprecated
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
            return callChatClient(systemPrompt, userInput);
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
            String result = callChatClient(
                    "你是一个物理实验描述助手，请用简洁准确的一句话描述物理实验。", prompt);
            return (result == null || result.isBlank()) ? null : result.trim();
        } catch (TimeoutException e) {
            log.warn("generateDescription timed out after {}s", AI_TIMEOUT_SECONDS);
            return null;
        } catch (Exception e) {
            log.warn("generateDescription failed: {}", e.getMessage());
            return null;
        }
    }

    // ========================================================================
    //  Helper class for ReAct response parsing
    // ========================================================================

    /** Parsed components of a single ReAct LLM response. */
    private static class ReActParseResult {
        String thought;
        String action;
        String actionInput;
        String finalAnswer;
    }
}
