package com.example.demo;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import java.io.*;
import java.util.*;

/**
 * Sample Java code with Memory and Spring Boot issues
 * For testing JavaMemoryDetector and JavaSpringDetector
 */

// MEMORY-001: Resource leak
public class MemorySpringBadPractices {
    
    // MEMORY-005: Static collection without bounds
    private static List<String> cache = new ArrayList<>();
    
    // SPRING-003: Field injection (should use constructor)
    @Autowired
    private UserRepository userRepository;
    
    // SPRING-006: @Value without default
    @Value("${api.key}")
    private String apiKey;
    
    // MEMORY-001: Resource leak - FileInputStream not closed
    public String readFile(String path) throws IOException {
        FileInputStream fis = new FileInputStream(path);
        byte[] data = new byte[1024];
        fis.read(data);
        // Missing fis.close() - resource leak!
        return new String(data);
    }
    
    // MEMORY-002: String concatenation in loop
    public String buildMessage(List<String> parts) {
        String message = "";
        for (String part : parts) {
            message += part + " "; // Creates new String object each iteration!
        }
        return message;
    }
    
    // MEMORY-003: ArrayList without initial capacity
    public List<Integer> generateNumbers() {
        List<Integer> numbers = new ArrayList<>(); // Will resize multiple times
        for (int i = 0; i < 1000; i++) {
            numbers.add(i);
        }
        return numbers;
    }
    
    // MEMORY-004: Autoboxing in loop
    public List<Integer> processNumbers(int[] primitives) {
        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < primitives.length; i++) {
            result.add(Integer.valueOf(primitives[i])); // Boxing in loop
        }
        return result;
    }
    
    // Good example: try-with-resources (no issue)
    public String readFileCorrect(String path) throws IOException {
        try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
            return reader.readLine();
        }
    }
    
    // Good example: StringBuilder (no issue)
    public String buildMessageCorrect(List<String> parts) {
        StringBuilder message = new StringBuilder();
        for (String part : parts) {
            message.append(part).append(" ");
        }
        return message.toString();
    }
}

// SPRING-001: Missing @Transactional on multi-DB operations
@Service
class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AuditRepository auditRepository;
    
    // SPRING-001: Multiple DB operations without @Transactional
    public void updateUser(User user) {
        userRepository.save(user);
        auditRepository.save(new AuditLog("User updated"));
        // If second save fails, first is already committed!
    }
    
    // Good example: With @Transactional
    @Transactional
    public void updateUserCorrect(User user) {
        userRepository.save(user);
        auditRepository.save(new AuditLog("User updated"));
        // Both succeed or both rollback
    }
}

// SPRING-002: Prototype bean scope issue
@Component
@Scope("prototype")
class PrototypeBean {
    private int counter = 0;
    
    public int increment() {
        return ++counter;
    }
}

// SPRING-004 & SPRING-005: REST API issues
@RestController
@RequestMapping("/api/users")
class UserController {
    
    @Autowired
    private UserService userService;
    
    // SPRING-004: Missing @Valid on @RequestBody
    // SPRING-005: Missing security annotation
    @PostMapping
    public User createUser(@RequestBody UserDTO userDTO) {
        return userService.createUser(userDTO);
    }
    
    // Good example: With validation and security
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin")
    public User createUserCorrect(@Valid @RequestBody UserDTO userDTO) {
        return userService.createUser(userDTO);
    }
    
    // Good example: Public endpoint (no security needed)
    @GetMapping("/public/health")
    public String health() {
        return "OK";
    }
}

// Helper classes
class User {
    private Long id;
    private String name;
    private String email;
    
    public User(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }
    
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
}

class UserDTO {
    private String name;
    private String email;
    
    public String getName() { return name; }
    public String getEmail() { return email; }
}

class AuditLog {
    private String message;
    
    public AuditLog(String message) {
        this.message = message;
    }
    
    public String getMessage() { return message; }
}

interface UserRepository {
    User save(User user);
    User findById(Long id);
}

interface AuditRepository {
    AuditLog save(AuditLog log);
}
