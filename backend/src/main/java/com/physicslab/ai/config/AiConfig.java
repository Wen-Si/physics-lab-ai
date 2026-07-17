package com.physicslab.ai.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * Application configuration: ChatClient bean (built from the ZhiPu ChatModel)
 * and a global CORS filter allowing all origins (the frontend is hosted on
 * GitHub Pages).
 */
@Configuration
public class AiConfig {

    /**
     * Build the Spring AI {@link ChatClient} from the auto-configured
     * ZhiPu {@link ChatModel}. The workflow nodes use this client to call
     * ZhiPu AI (glm-4-flash) for natural language understanding.
     */
    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel).build();
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
