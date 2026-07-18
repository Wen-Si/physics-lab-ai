package com.physicslab.ai.agent;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.physicslab.ai.model.KnowledgeMappingRequest;
import com.physicslab.ai.model.KnowledgeMappingRequest.KnowledgeNodeInfo;
import com.physicslab.ai.model.KnowledgeMappingResult;
import com.physicslab.ai.model.WorkflowEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 * Agent 2 — Knowledge Mapping Agent.
 *
 * <p>This agent takes the output of Agent 1 (the 12-node experiment
 * generation workflow) and uses the ReAct (Reason-Act) paradigm to:</p>
 * <ol>
 *   <li>Analyze the experiment's physics concepts, laws, and parameters</li>
 *   <li>Match them against the knowledge-graph nodes</li>
 *   <li>Rank the mapped nodes by importance (Top-5)</li>
 *   <li>Generate a natural-language summary of the knowledge analysis</li>
 * </ol>
 *
 * <p>Like Agent 1, this agent streams its ReAct reasoning steps to the
 * frontend via SSE events, allowing the user to observe the AI's
 * thought process in real time.</p>
 */
@Component
public class KnowledgeMappingAgent {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeMappingAgent.class);

    private static final long AI_TIMEOUT_SECONDS = 30;
    private static final int MAX_REACT_ROUNDS = 3;
    private static final int MAX_RATE_LIMIT_RETRIES = 3;
    private static final long RATE_LIMIT_BASE_DELAY_MS = 2000;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final ChatClient chatClient;

    @Autowired
    public KnowledgeMappingAgent(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    /**
     * Execute the knowledge mapping agent.
     *
     * @param request   the experiment metadata + knowledge nodes from the frontend
     * @param eventSink SSE event sink for streaming ReAct steps (may be null)
     * @return the mapping result, or null on failure
     */
    public KnowledgeMappingResult mapKnowledge(KnowledgeMappingRequest request,
                                                Consumer<WorkflowEvent> eventSink) {
        String userInput = request.getUserInput() != null ? request.getUserInput() : "";
        String sceneType = request.getSceneType() != null ? request.getSceneType() : "unknown";
        String experimentType = request.getExperimentType() != null ? request.getExperimentType() : "mechanics";
        String description = request.getDescription() != null ? request.getDescription() : "";
        List<String> physicsLaws = request.getPhysicsLaws() != null ? request.getPhysicsLaws() : Collections.emptyList();
        Map<String, Object> params = request.getParameters() != null ? request.getParameters() : Collections.emptyMap();
        List<KnowledgeNodeInfo> nodes = request.getKnowledgeNodes() != null ? request.getKnowledgeNodes() : Collections.emptyList();

        // Build the knowledge node catalog for the AI
        StringBuilder nodeCatalog = new StringBuilder();
        for (KnowledgeNodeInfo node : nodes) {
            nodeCatalog.append(String.format("- %s | %s | %s\n", node.getId(), node.getName(), node.getType()));
        }

        // Build the experiment context
        StringBuilder experimentContext = new StringBuilder();
        experimentContext.append("用户输入：").append(userInput).append("\n");
        experimentContext.append("实验类型：").append(experimentType).append("\n");
        experimentContext.append("场景类型：").append(sceneType).append("\n");
        experimentContext.append("实验描述：").append(description).append("\n");
        experimentContext.append("物理定律：").append(String.join("、", physicsLaws)).append("\n");
        experimentContext.append("实验参数：").append(params.toString()).append("\n");

        // System prompt for ReAct
        String systemPrompt = """
                你是物理知识图谱映射智能体（Agent 2）。你的任务是根据已生成的物理实验，分析该实验涉及的核心知识点，并将它们映射到知识图谱中的节点。

                请使用 ReAct (Reason-Act) 范式进行推理：

                Thought: 你的推理过程
                Action: 要执行的动作
                Action Input: 动作输入

                可用工具：
                1. analyze_concepts — 分析实验涉及的核心物理概念（如力、质量、速度、能量等）
                2. match_nodes — 将分析出的概念与知识图谱节点列表进行匹配
                3. rank_importance — 对匹配到的节点按重要性排序，选出Top-5核心节点
                4. generate_summary — 生成知识分析摘要

                知识图谱节点列表（格式：ID | 名称 | 类型）：
                """ + nodeCatalog.toString() + """

                实验信息：
                """ + experimentContext.toString() + """

                规则：
                1. 每次只输出一个 Thought 和一个 Action（或 Final Answer）
                2. 推理要简洁明了，用中文
                3. Final Answer 必须是JSON格式，包含以下字段：
                   {
                     "mappedNodeIds": ["node_id_1", "node_id_2", ...],
                     "topNodeIds": ["top1", "top2", "top3", "top4", "top5"],
                     "keyConcepts": ["概念1", "概念2", ...],
                     "keyFormulas": ["公式1", ...],
                     "keyLaws": ["定律1", ...],
                     "keyProcesses": ["过程1", ...],
                     "summary": "知识分析摘要文本"
                   }
                4. mappedNodeIds 应包含所有与实验相关的节点ID
                5. topNodeIds 最多5个，是最重要的核心节点
                """;

        // ReAct conversation history
        StringBuilder conversation = new StringBuilder();
        conversation.append("请开始 ReAct 推理，分析实验并映射知识图谱节点。\n");

        int stepNumber = 0;
        Set<String> mappedIds = new LinkedHashSet<>();
        List<String> topIds = new ArrayList<>();
        List<String> keyConcepts = new ArrayList<>();
        List<String> keyFormulas = new ArrayList<>();
        List<String> keyLaws = new ArrayList<>();
        List<String> keyProcesses = new ArrayList<>();
        String summary = "";

        for (int round = 0; round < MAX_REACT_ROUNDS; round++) {
            // Small delay between rounds to avoid rate limits
            if (round > 0) {
                try { Thread.sleep(500); } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt(); break; }
            }

            String aiResponse;
            try {
                aiResponse = callChatClient(systemPrompt, conversation.toString());
            } catch (Exception e) {
                log.warn("Knowledge mapping ReAct round {} failed: {}", round, e.getMessage());
                break;
            }

            if (aiResponse == null || aiResponse.isBlank()) {
                log.warn("Knowledge mapping round {} returned empty response", round);
                break;
            }

            // Parse ReAct response
            String thought = extractField(aiResponse, "Thought");
            String finalAnswer = extractField(aiResponse, "Final Answer");
            String action = extractField(aiResponse, "Action");
            String actionInput = extractField(aiResponse, "Action Input");

            // Emit Thought step
            if (thought != null && !thought.isBlank()) {
                stepNumber++;
                emitReactStep(eventSink, "thought", thought.trim(), stepNumber);
                conversation.append("Thought: ").append(thought.trim()).append("\n");
            }

            // Check for Final Answer
            if (finalAnswer != null && !finalAnswer.isBlank()) {
                stepNumber++;
                emitReactStep(eventSink, "final_answer", finalAnswer.trim(), stepNumber);
                // Parse the JSON final answer
                try {
                    String jsonStr = extractJson(finalAnswer.trim());
                    Map<String, Object> parsed = MAPPER.readValue(jsonStr, new TypeReference<>() {});
                    mappedIds = toStringSet(parsed.get("mappedNodeIds"));
                    topIds = toStringList(parsed.get("topNodeIds"));
                    keyConcepts = toStringList(parsed.get("keyConcepts"));
                    keyFormulas = toStringList(parsed.get("keyFormulas"));
                    keyLaws = toStringList(parsed.get("keyLaws"));
                    keyProcesses = toStringList(parsed.get("keyProcesses"));
                    Object sumObj = parsed.get("summary");
                    summary = sumObj != null ? sumObj.toString() : "";
                } catch (Exception e) {
                    log.warn("Failed to parse final answer JSON: {}", e.getMessage());
                    // Fallback: use rule-based mapping
                    mappedIds = ruleBasedMapping(request);
                    topIds = ruleBasedTopNodes(mappedIds, request);
                    summary = "基于实验场景\"" + sceneType + "\"的知识图谱映射（AI解析失败，使用规则回退）";
                }

                // Filter mappedIds to only include valid node IDs
                Set<String> validIds = new HashSet<>();
                for (KnowledgeNodeInfo node : nodes) {
                    validIds.add(node.getId());
                }
                mappedIds.retainAll(validIds);
                topIds.retainAll(validIds);

                break;
            }

            // Emit Action step and execute locally
            if (action != null && !action.isBlank()) {
                stepNumber++;
                String actionDisplay = action.trim();
                if (actionInput != null && !actionInput.isBlank()) {
                    actionDisplay += "[" + actionInput.trim() + "]";
                }
                emitReactStep(eventSink, "action", actionDisplay, stepNumber);
                conversation.append("Action: ").append(action.trim()).append("\n");
                if (actionInput != null) {
                    conversation.append("Action Input: ").append(actionInput.trim()).append("\n");
                }

                // Execute the action locally
                String observation = executeAction(action.trim(), actionInput, request, nodes);
                stepNumber++;
                emitReactStep(eventSink, "observation", observation, stepNumber);
                conversation.append("Observation: ").append(observation).append("\n\n");
                conversation.append("请继续推理，或给出 Final Answer。\n");
            } else {
                conversation.append("\n请直接给出 Final Answer。\n");
            }
        }

        // If no final answer was produced, use rule-based fallback
        if (mappedIds.isEmpty()) {
            mappedIds = ruleBasedMapping(request);
            topIds = ruleBasedTopNodes(mappedIds, request);
            summary = "基于实验场景\"" + sceneType + "\"的知识图谱映射（规则回退）";
            stepNumber++;
            emitReactStep(eventSink, "final_answer",
                    "使用规则回退映射: " + mappedIds.size() + " 个节点", stepNumber);
        }

        // Build result
        KnowledgeMappingResult result = new KnowledgeMappingResult();
        result.setMappedNodeIds(new ArrayList<>(mappedIds));
        result.setTopNodeIds(topIds);
        result.setSummary(summary);
        result.setKeyConcepts(keyConcepts);
        result.setKeyFormulas(keyFormulas);
        result.setKeyLaws(keyLaws);
        result.setKeyProcesses(keyProcesses);

        log.info("Knowledge mapping complete: {} mapped nodes, {} top nodes",
                mappedIds.size(), topIds.size());
        return result;
    }

    /**
     * Execute a ReAct action locally and return an observation string.
     */
    private String executeAction(String action, String actionInput,
                                 KnowledgeMappingRequest request,
                                 List<KnowledgeNodeInfo> nodes) {
        switch (action) {
            case "analyze_concepts": {
                String sceneType = request.getSceneType() != null ? request.getSceneType() : "unknown";
                StringBuilder sb = new StringBuilder();
                sb.append("场景类型: ").append(sceneType).append("\n");
                sb.append("涉及定律: ").append(String.join("、",
                        request.getPhysicsLaws() != null ? request.getPhysicsLaws() : List.of())).append("\n");
                sb.append("实验参数: ").append(request.getParameters()).append("\n");
                sb.append("可匹配节点: ").append(nodes.size()).append(" 个");
                return sb.toString();
            }
            case "match_nodes": {
                String sceneType = request.getSceneType() != null ? request.getSceneType() : "";
                List<String> laws = request.getPhysicsLaws() != null ? request.getPhysicsLaws() : List.of();
                Set<String> matched = new LinkedHashSet<>();
                for (KnowledgeNodeInfo node : nodes) {
                    String name = node.getName();
                    String type = node.getType();
                    // Match by scene type keywords
                    if (matchesScene(sceneType, name)) {
                        matched.add(node.getId());
                    }
                    // Match by physics laws
                    for (String law : laws) {
                        if (name.contains(law) || law.contains(name)) {
                            matched.add(node.getId());
                        }
                    }
                    // Match by common physics concepts
                    if (isCoreConcept(name, type)) {
                        matched.add(node.getId());
                    }
                }
                return "匹配到 " + matched.size() + " 个知识节点: " + String.join(", ", matched);
            }
            case "rank_importance": {
                return "按重要性排序中... 实验核心概念优先，然后是公式和定律，最后是过程";
            }
            case "generate_summary": {
                String sceneType = request.getSceneType() != null ? request.getSceneType() : "unknown";
                return "正在生成场景\"" + sceneType + "\"的知识分析摘要";
            }
            default:
                return "未知动作: " + action;
        }
    }

    private boolean matchesScene(String sceneType, String nodeName) {
        if (sceneType == null || nodeName == null) return false;
        String st = sceneType.toLowerCase();
        return switch (st) {
            case "freefall" -> nodeName.contains("自由落体") || nodeName.contains("重力") || nodeName.contains("加速度");
            case "pendulum" -> nodeName.contains("单摆") || nodeName.contains("摆") || nodeName.contains("周期");
            case "spring" -> nodeName.contains("弹簧") || nodeName.contains("简谐") || nodeName.contains("胡克");
            case "projectile" -> nodeName.contains("抛体") || nodeName.contains("平抛");
            case "angled_projectile" -> nodeName.contains("斜抛") || nodeName.contains("抛体");
            case "ramp" -> nodeName.contains("斜面") || nodeName.contains("摩擦");
            case "circular" -> nodeName.contains("圆周") || nodeName.contains("向心");
            case "collision" -> nodeName.contains("碰撞") || nodeName.contains("动量");
            case "atwood" -> nodeName.contains("滑轮") || nodeName.contains("阿特伍德");
            case "orbital" -> nodeName.contains("轨道") || nodeName.contains("引力") || nodeName.contains("行星");
            default -> false;
        };
    }

    private boolean isCoreConcept(String name, String type) {
        String[] coreConcepts = {"力", "质量", "速度", "加速度", "位移", "时间", "能量",
                "动能", "势能", "动量", "牛顿第二定律", "能量守恒定律", "动量守恒定律"};
        for (String c : coreConcepts) {
            if (name.equals(c)) return true;
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private Set<String> toStringSet(Object obj) {
        if (obj instanceof List<?> list) {
            Set<String> set = new LinkedHashSet<>();
            for (Object o : list) set.add(o.toString());
            return set;
        }
        return new LinkedHashSet<>();
    }

    @SuppressWarnings("unchecked")
    private List<String> toStringList(Object obj) {
        if (obj instanceof List<?> list) {
            List<String> result = new ArrayList<>();
            for (Object o : list) result.add(o.toString());
            return result;
        }
        return new ArrayList<>();
    }

    /**
     * Rule-based fallback mapping using scene type and laws.
     */
    private Set<String> ruleBasedMapping(KnowledgeMappingRequest request) {
        Set<String> ids = new LinkedHashSet<>();
        String sceneType = request.getSceneType() != null ? request.getSceneType() : "";
        List<String> laws = request.getPhysicsLaws() != null ? request.getPhysicsLaws() : List.of();
        List<KnowledgeNodeInfo> nodes = request.getKnowledgeNodes() != null
                ? request.getKnowledgeNodes() : List.of();

        for (KnowledgeNodeInfo node : nodes) {
            if (matchesScene(sceneType, node.getName())) {
                ids.add(node.getId());
            }
            for (String law : laws) {
                if (node.getName().contains(law) || law.contains(node.getName())) {
                    ids.add(node.getId());
                }
            }
            if (isCoreConcept(node.getName(), node.getType())) {
                ids.add(node.getId());
            }
        }
        return ids;
    }

    private List<String> ruleBasedTopNodes(Set<String> mappedIds, KnowledgeMappingRequest request) {
        List<String> top = new ArrayList<>();
        String sceneType = request.getSceneType() != null ? request.getSceneType() : "";
        List<KnowledgeNodeInfo> nodes = request.getKnowledgeNodes() != null
                ? request.getKnowledgeNodes() : List.of();

        // Prioritize: scene-specific > laws > formulas > entities
        for (KnowledgeNodeInfo node : nodes) {
            if (!mappedIds.contains(node.getId())) continue;
            if ("law".equals(node.getType()) && matchesScene(sceneType, node.getName())) {
                top.add(node.getId());
            }
            if (top.size() >= 5) break;
        }
        for (KnowledgeNodeInfo node : nodes) {
            if (!mappedIds.contains(node.getId()) || top.contains(node.getId())) continue;
            if ("formula".equals(node.getType())) {
                top.add(node.getId());
            }
            if (top.size() >= 5) break;
        }
        for (KnowledgeNodeInfo node : nodes) {
            if (!mappedIds.contains(node.getId()) || top.contains(node.getId())) continue;
            top.add(node.getId());
            if (top.size() >= 5) break;
        }
        return top;
    }

    private void emitReactStep(Consumer<WorkflowEvent> eventSink, String stepType,
                               String content, int stepNumber) {
        if (eventSink != null) {
            eventSink.accept(WorkflowEvent.reactStep(
                    -1, "知识映射智能体", stepType, content, stepNumber));
        }
    }

    // --- ReAct parsing utilities (shared with PhysicsExperimentAgent) ---

    private String extractField(String text, String fieldName) {
        String[] knownFields = {"Thought", "Action Input", "Action", "Final Answer", "Observation"};
        String pattern = fieldName + "\\s*[:：]\\s*(.+)";
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile(
                pattern, java.util.regex.Pattern.MULTILINE | java.util.regex.Pattern.DOTALL).matcher(text);
        if (!matcher.find()) return null;
        String content = matcher.group(1);
        for (String field : knownFields) {
            if (field.equals(fieldName)) continue;
            int idx = content.indexOf(field + ":");
            if (idx == -1) idx = content.indexOf(field + "：");
            if (idx > 0) content = content.substring(0, idx);
        }
        return content.trim();
    }

    private String extractJson(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    // --- ChatClient wrapper with 429 retry ---

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
                String errorMsg = cause.getMessage() != null ? cause.getMessage() : "";
                boolean isRateLimit = errorMsg.contains("429") || errorMsg.contains("速率限制");
                if (isRateLimit && attempt < MAX_RATE_LIMIT_RETRIES) {
                    long delay = RATE_LIMIT_BASE_DELAY_MS * (1L << attempt);
                    log.warn("Knowledge agent rate limited, retry {}/{} in {}ms",
                            attempt + 1, MAX_RATE_LIMIT_RETRIES, delay);
                    Thread.sleep(delay);
                    lastException = cause instanceof Exception ex ? ex : e;
                    continue;
                }
                throw cause instanceof Exception ex ? ex : e;
            }
        }
        throw lastException != null ? lastException : new RuntimeException("AI call failed");
    }
}
