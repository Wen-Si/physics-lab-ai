package com.physicslab.ai.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.http.HttpClient;

/**
 * Application configuration: ChatClient bean (built from the ZhiPu ChatModel),
 * a proxy-aware {@link RestClient.Builder} for Spring AI's HTTP calls, and a
 * global CORS filter.
 *
 * <p>The sandbox environment requires all outbound HTTP traffic to go through
 * a proxy at 127.0.0.1:18080. The ZhiPu AI auto-configuration picks up the
 * custom {@link RestClient.Builder} via {@code ObjectProvider<RestClient.Builder>}
 * and uses it for all API calls to ZhiPu AI (GLM-4.5-flash).</p>
 */
@Configuration
public class AiConfig {

    private static final Logger log = LoggerFactory.getLogger(AiConfig.class);

    /**
     * Build the Spring AI {@link ChatClient} from the auto-configured
     * ZhiPu {@link ChatModel}. The workflow nodes use this client to call
     * ZhiPu AI (GLM-4.5-flash) for natural language understanding.
     */
    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel).build();
    }

    /**
     * A proxy-aware {@link RestClient.Builder} bean.
     *
     * <p>Spring AI's ZhiPu auto-configuration injects this via
     * {@code ObjectProvider<RestClient.Builder>}. Without this bean, the
     * ZhiPu API HTTP calls would bypass the proxy and fail in the sandbox
     * environment.</p>
     *
     * <p>The proxy is read from the {@code https_proxy} / {@code http_proxy}
     * environment variables (standard convention in containerized environments).</p>
     */
    @Bean
    public RestClient.Builder restClientBuilder() {
        RestClient.Builder builder = RestClient.builder();

        // Configure proxy from environment variables
        String proxyUrl = System.getenv("https_proxy");
        if (proxyUrl == null || proxyUrl.isBlank()) proxyUrl = System.getenv("http_proxy");
        if (proxyUrl == null || proxyUrl.isBlank()) proxyUrl = System.getenv("HTTPS_PROXY");
        if (proxyUrl == null || proxyUrl.isBlank()) proxyUrl = System.getenv("HTTP_PROXY");

        if (proxyUrl != null && !proxyUrl.isBlank()) {
            // Parse "http://127.0.0.1:18080" → host=127.0.0.1, port=18080
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

                // Use JdkClientHttpRequestFactory with explicit proxy.
                // java.net.http.HttpClient properly handles HTTPS CONNECT tunneling
                // through HTTP proxies, unlike SimpleClientHttpRequestFactory which
                // can silently fail and route requests to the wrong host.
                HttpClient httpClient = HttpClient.newBuilder()
                        .proxy(ProxySelector.of(new InetSocketAddress(host, port)))
                        .build();
                JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);

                builder.requestFactory(factory);
                log.info("Configured RestClient.Builder with HTTP proxy: {}:{}", host, port);
            }
        } else {
            log.warn("No proxy environment variable found; RestClient will attempt direct connections");
        }

        return builder;
    }

    /**
     * Global CORS filter allowing all origins, methods and headers so the
     * static frontend (hosted on GitHub Pages) can call the API directly.
     */
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOriginPattern("*");
        config.setAllowCredentials(true);
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.addExposedHeader("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
