package com.example.architecture;

import java.util.*;
import java.sql.*;

/**
 * ArchitectureSample.java - Intentional architectural violations for JavaArchitectureDetector
 * 
 * This file contains 20 intentional architectural issues across 4 categories:
 * 1. LAYER VIOLATIONS (5 issues)
 * 2. GOD CLASSES (5 issues)
 * 3. CIRCULAR DEPENDENCIES (5 issues)
 * 4. PACKAGE STRUCTURE (5 issues)
 * 
 * Expected detection: 20 issues
 * Safe patterns: 6 (should NOT be flagged)
 */

// ==================== LAYER VIOLATIONS - BAD PATTERNS ====================

/**
 * Issue #1: Controller directly accessing Repository (bypass Service layer)
 * Violation: Controller → Repository (should go through Service)
 */
class UserController {
    private UserRepository userRepository; // BAD: Controller should use Service, not Repository
    
    public void createUser(String name, String email) {
        // Direct repository access from controller
        userRepository.save(name, email); // BAD: Violates layered architecture
    }
}

/**
 * Issue #2: Repository accessing external API (wrong responsibility)
 * Violation: Repository should only handle data persistence
 */
class UserRepository {
    public void save(String name, String email) {
        // BAD: Repository making HTTP calls
        HttpClient.sendRequest("https://api.example.com/notify"); // Wrong layer!
    }
    
    // Issue #3: Repository with business logic (should be in Service)
    public boolean validateEmail(String email) {
        return email.contains("@"); // BAD: Business logic in Repository
    }
}

/**
 * Issue #4: Model/Entity with business logic (should be in Service)
 * Violation: Domain objects should be data-only (anemic model acceptable)
 */
class User {
    private String name;
    private String email;
    
    // BAD: Business logic in Entity
    public double calculateDiscount() {
        if (email.endsWith("@company.com")) {
            return 0.2; // 20% discount for company emails
        }
        return 0.0;
    }
    
    // Issue #5: Entity making database calls (huge violation!)
    public void saveToDatabase() {
        Connection conn = null;
        try {
            conn = DriverManager.getConnection("jdbc:mysql://localhost/db");
            // BAD: Entity should not access database directly!
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}

// ==================== GOD CLASSES - BAD PATTERNS ====================

/**
 * Issue #6: God Class (too many methods - 25+)
 * Violation: Single Responsibility Principle
 */
class UserService {
    // User management methods (5)
    public void createUser(String name) {}
    public void updateUser(int id, String name) {}
    public void deleteUser(int id) {}
    public User findUserById(int id) { return null; }
    public List<User> findAllUsers() { return null; }
    
    // Email management methods (5)
    public void sendEmail(String to, String subject) {}
    public void sendBulkEmail(List<String> recipients) {}
    public void scheduleEmail(String to, Date sendDate) {}
    public void validateEmailFormat(String email) {}
    public void trackEmailDelivery(String emailId) {}
    
    // Authentication methods (5)
    public boolean login(String username, String password) { return false; }
    public void logout(String sessionId) {}
    public String generateToken(User user) { return null; }
    public boolean validateToken(String token) { return false; }
    public void resetPassword(String email) {}
    
    // Payment methods (5)
    public void processPayment(double amount) {}
    public void refundPayment(String transactionId) {}
    public void validateCreditCard(String cardNumber) {}
    public double calculateTax(double amount) { return 0.0; }
    public void generateInvoice(String orderId) {}
    
    // Reporting methods (5)
    public void generateUserReport() {}
    public void exportToCSV(List<User> users) {}
    public void sendDailyReport() {}
    public void generateAnalytics() {}
    public void archiveOldRecords() {}
    
    // More methods... (30+ total = God Class!)
}

/**
 * Issue #7: God Class (too many dependencies - 12+)
 * Violation: High coupling
 */
class OrderService {
    private UserRepository userRepo;
    private ProductRepository productRepo;
    private PaymentService paymentService;
    private EmailService emailService;
    private SmsService smsService;
    private NotificationService notificationService;
    private InventoryService inventoryService;
    private ShippingService shippingService;
    private TaxService taxService;
    private DiscountService discountService;
    private AnalyticsService analyticsService;
    private LoggingService loggingService;
    // 12+ dependencies = God Class!
    
    public void processOrder() {
        // Uses all 12 dependencies...
    }
}

/**
 * Issue #8: God Class (too many lines of code - 500+ LOC)
 * This is simulated with comments
 */
class ReportGenerator {
    // Assume this class has 500+ lines of code
    // with complex logic mixing multiple responsibilities:
    // - Data fetching
    // - Data transformation
    // - Business calculations
    // - Report formatting
    // - PDF generation
    // - Email sending
    // - File storage
    // All in one massive class!
    
    public void generateMonthlyReport() {
        // 200 lines of code here...
    }
    
    public void generateQuarterlyReport() {
        // 200 lines of code here...
    }
    
    public void generateAnnualReport() {
        // 200 lines of code here...
    }
    
    // Total: 500+ LOC = God Class!
}

/**
 * Issue #9: Class with too many fields (20+ fields)
 * Violation: Likely doing too many things
 */
class CustomerProfile {
    // Personal info (5 fields)
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private Date birthDate;
    
    // Address info (5 fields)
    private String street;
    private String city;
    private String state;
    private String zipCode;
    private String country;
    
    // Payment info (5 fields)
    private String cardNumber;
    private String cardHolderName;
    private Date expiryDate;
    private String cvv;
    private String billingAddress;
    
    // Preferences (5 fields)
    private boolean emailNotifications;
    private boolean smsNotifications;
    private String preferredLanguage;
    private String timezone;
    private String theme;
    
    // Metadata (5 fields)
    private Date createdAt;
    private Date updatedAt;
    private String createdBy;
    private String lastModifiedBy;
    private int version;
    
    // 25 fields total = God Class!
}

/**
 * Issue #10: Class with high cyclomatic complexity (CC > 20)
 * Violation: Too complex, hard to test
 */
class OrderProcessor {
    public void processOrder(Order order) {
        if (order.getType() == OrderType.STANDARD) {
            if (order.getAmount() > 100) {
                if (order.getCustomer().isPremium()) {
                    if (order.getShippingAddress().isInternational()) {
                        // Complex logic level 1
                        if (order.hasDiscount()) {
                            // Complex logic level 2
                            if (order.getPaymentMethod() == PaymentMethod.CREDIT_CARD) {
                                // Complex logic level 3
                                if (order.requiresApproval()) {
                                    // Complex logic level 4
                                    if (order.isUrgent()) {
                                        // Complex logic level 5
                                        // Cyclomatic complexity > 20!
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        // More nested conditions...
    }
}

// ==================== CIRCULAR DEPENDENCIES - BAD PATTERNS ====================

/**
 * Issue #11: Circular dependency between Service classes
 * A → B → A (circular)
 */
class ServiceA {
    private ServiceB serviceB; // A depends on B
    
    public void methodA() {
        serviceB.methodB(); // A calls B
    }
}

class ServiceB {
    private ServiceA serviceA; // B depends on A (CIRCULAR!)
    
    public void methodB() {
        serviceA.methodA(); // B calls A (CIRCULAR!)
    }
}

/**
 * Issue #12: Circular dependency between packages
 * com.example.users depends on com.example.orders
 * com.example.orders depends on com.example.users
 */
// This would be detected by analyzing import statements across packages

/**
 * Issue #13: Circular dependency with 3 classes (A → B → C → A)
 */
class ClassA {
    private ClassB classB; // A → B
}

class ClassB {
    private ClassC classC; // B → C
}

class ClassC {
    private ClassA classA; // C → A (CIRCULAR CHAIN!)
}

/**
 * Issue #14: Self-dependency (class depends on itself through field)
 * Less common but possible
 */
class Node {
    private Node parent; // OK: Tree structure
    private Node next;   // OK: Linked list
    
    // Issue: Circular reference without clear parent-child relationship
    private Node circularRef; // BAD: Unclear relationship
}

/**
 * Issue #15: Bidirectional dependency without clear ownership
 */
class Author {
    private List<Book> books; // Author → Book
}

class Book {
    private Author author; // Book → Author (bidirectional, but acceptable if managed properly)
    
    // Issue: Both sides manage the relationship
    public void setAuthor(Author author) {
        this.author = author;
        author.getBooks().add(this); // BAD: Circular updates
    }
}

// ==================== PACKAGE STRUCTURE - BAD PATTERNS ====================

/**
 * Issue #16: Wrong package placement
 * Controller in model package, Entity in controller package
 */
// package com.example.model;
// class UserController {} // BAD: Controller in model package

/**
 * Issue #17: Mixing layers in same package
 * Controller, Service, Repository all in one package
 */
// package com.example.user;
// class UserController {}
// class UserService {}
// class UserRepository {}
// BAD: No separation of concerns

/**
 * Issue #18: Deep package nesting (> 5 levels)
 */
// package com.company.project.module.submodule.feature.component.subcomponent;
// class DeepClass {} // BAD: Too deep (8 levels)

/**
 * Issue #19: Package with too many classes (> 20 classes)
 */
// package com.example.utils;
// 50+ utility classes in one package
// BAD: Package too large, needs splitting

/**
 * Issue #20: Business logic in util/helper packages
 */
class UserHelper {
    // BAD: Business logic in helper class
    public static double calculateUserDiscount(User user) {
        if (user.getEmail().endsWith("@company.com")) {
            return 0.2;
        }
        return 0.0;
    }
    // Business logic should be in Service layer, not utility classes!
}

// ==================== SAFE PATTERNS ====================

/**
 * Safe #1: Proper layered architecture
 * Controller → Service → Repository (correct flow)
 */
class GoodUserController {
    private GoodUserService userService; // Correct: Controller uses Service
    
    public void createUser(String name, String email) {
        userService.createUser(name, email); // Delegates to Service layer
    }
}

class GoodUserService {
    private GoodUserRepository userRepository; // Correct: Service uses Repository
    
    public void createUser(String name, String email) {
        // Business logic here
        if (validateEmail(email)) {
            userRepository.save(name, email);
        }
    }
    
    private boolean validateEmail(String email) {
        return email.contains("@"); // Business logic in Service (correct)
    }
}

class GoodUserRepository {
    public void save(String name, String email) {
        // Only data persistence logic (correct)
        Connection conn = null;
        // Save to database
    }
}

/**
 * Safe #2: Properly sized class (< 20 methods, < 10 dependencies)
 */
class GoodUserService2 {
    private UserRepository userRepo;
    private EmailService emailService;
    
    public void createUser(String name) {}
    public void updateUser(int id, String name) {}
    public void deleteUser(int id) {}
    public User findUserById(int id) { return null; }
    // Only 4-5 methods = Good size
}

/**
 * Safe #3: No circular dependencies (unidirectional)
 * A → B (one direction only)
 */
class ServiceX {
    private ServiceY serviceY; // X depends on Y
    
    public void methodX() {
        serviceY.methodY(); // X calls Y (one direction)
    }
}

class ServiceY {
    // Y does NOT depend on X (no circular dependency)
    
    public void methodY() {
        // Independent logic
    }
}

/**
 * Safe #4: Proper package structure
 * Clear separation: controller, service, repository packages
 */
// package com.example.controller;
// class GoodUserController {}

// package com.example.service;
// class GoodUserService {}

// package com.example.repository;
// class GoodUserRepository {}

/**
 * Safe #5: Reasonable class complexity (CC < 10)
 */
class SimpleProcessor {
    public void process(Order order) {
        if (order.isValid()) {
            save(order);
        } else {
            reject(order);
        }
        // Low cyclomatic complexity (CC = 2)
    }
    
    private void save(Order order) {}
    private void reject(Order order) {}
}

/**
 * Safe #6: Entity with only data (anemic model - acceptable)
 */
class GoodUser {
    private String name;
    private String email;
    
    // Only getters/setters (data-only)
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    // No business logic = Correct for Entity
}

// Dummy classes for compilation
class HttpClient { public static void sendRequest(String url) {} }
class Order { 
    public OrderType getType() { return null; }
    public double getAmount() { return 0; }
    public Customer getCustomer() { return null; }
    public Address getShippingAddress() { return null; }
    public boolean hasDiscount() { return false; }
    public PaymentMethod getPaymentMethod() { return null; }
    public boolean requiresApproval() { return false; }
    public boolean isUrgent() { return false; }
    public boolean isValid() { return false; }
}
enum OrderType { STANDARD }
class Customer { public boolean isPremium() { return false; } }
class Address { public boolean isInternational() { return false; } }
enum PaymentMethod { CREDIT_CARD }
class ProductRepository {}
class PaymentService {}
class EmailService {}
class SmsService {}
class NotificationService {}
class InventoryService {}
class ShippingService {}
class TaxService {}
class DiscountService {}
class AnalyticsService {}
class LoggingService {}
class Book { public Author getAuthor() { return null; } }
