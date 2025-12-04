package com.example.demo;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

/**
 * Sample class with Lombok annotations
 * Tests enhanced detector with Lombok detection
 */

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LombokSample {
    
    // Lombok generates getters/setters automatically
    private String name;
    private int age;
    private String email;
    
    @Getter
    private String username;
    
    @Setter
    private String password;
    
    // Custom method
    public String getDisplayName() {
        return name + " (" + username + ")";
    }
    
    // Builder pattern example
    public static LombokSample createDefault() {
        return LombokSample.builder()
            .name("John Doe")
            .age(30)
            .email("john@example.com")
            .username("johndoe")
            .password("secret123")
            .build();
    }
}
