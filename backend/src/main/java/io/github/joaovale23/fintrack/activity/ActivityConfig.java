package io.github.joaovale23.fintrack.activity;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
class ActivityConfig implements WebMvcConfigurer {

    private final ActivityTracker tracker;

    ActivityConfig(ActivityTracker tracker) {
        this.tracker = tracker;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tracker).addPathPatterns("/api/**").excludePathPatterns("/api/admin/**", "/api/errors");
    }
}
