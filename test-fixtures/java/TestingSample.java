package com.odavl.testing;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mock;
import org.mockito.Mockito;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.ArrayList;

/**
 * TestingSample.java - Comprehensive test quality issues for JavaTestingDetector
 * 
 * Intentional Issues: 16 total across 4 categories
 * 
 * Categories:
 * 1. JUnit Assertions (4 issues)
 * 2. Mockito Usage (4 issues)
 * 3. Test Coverage (4 issues)
 * 4. Test Naming (4 issues)
 * 
 * Safe Patterns: 8 patterns (should NOT be flagged)
 */
public class TestingSample {

    @Mock
    private UserService userService;
    
    @Mock
    private EmailService emailService;

    // ==================== JUNIT ASSERTIONS - BAD PATTERNS ====================

    // Issue #1: Missing assertions (test does nothing)
    @Test
    public void testUserCreation() {
        // Test creates user but doesn't assert anything!
        User user = new User("John", "john@example.com");
        user.setAge(30);
        // Missing: assertNotNull(user), assertEquals("John", user.getName()), etc.
    }

    // Issue #2: Empty test method (no code at all)
    @Test
    public void testUserDeletion() {
        // Completely empty test - provides no value!
    }

    // Issue #3: Weak assertion (only assertTrue(true))
    @Test
    public void testUserValidation() {
        User user = new User("Jane", "jane@example.com");
        boolean result = user.validate();
        assertTrue(true); // Always passes! Should be: assertTrue(result)
    }

    // Issue #4: Using assertEquals with boolean (should use assertTrue/assertFalse)
    @Test
    public void testUserActive() {
        User user = new User("Bob", "bob@example.com");
        user.setActive(true);
        assertEquals(true, user.isActive()); // Bad! Use assertTrue(user.isActive())
    }

    // ==================== MOCKITO USAGE - BAD PATTERNS ====================

    // Issue #5: Over-mocking (mocking simple POJOs)
    @Test
    public void testUserEmail() {
        User mockUser = mock(User.class); // Don't mock User! It's a simple POJO
        when(mockUser.getEmail()).thenReturn("test@example.com");
        
        assertEquals("test@example.com", mockUser.getEmail());
    }

    // Issue #6: Unstubbed mock (mock used but not configured)
    @Test
    public void testSendEmail() {
        EmailService mockEmail = mock(EmailService.class);
        // Missing: when(mockEmail.send(...)).thenReturn(true);
        
        boolean result = mockEmail.send("test@example.com", "Hello");
        // result is null/false because mock is not stubbed!
        assertTrue(result); // Will fail!
    }

    // Issue #7: Unnecessary mock (mock created but never used)
    @Test
    public void testUserLogin() {
        UserService mockService = mock(UserService.class); // Created but never used
        
        User user = new User("Alice", "alice@example.com");
        assertTrue(user.validate());
    }

    // Issue #8: verify() without when() (verifying behavior without stubbing)
    @Test
    public void testUserNotification() {
        EmailService mockEmail = mock(EmailService.class);
        
        User user = new User("Charlie", "charlie@example.com");
        mockEmail.send(user.getEmail(), "Welcome");
        
        verify(mockEmail).send("charlie@example.com", "Welcome");
        // Missing: when(mockEmail.send(...)).thenReturn(true) before calling
    }

    // ==================== TEST COVERAGE - BAD PATTERNS ====================

    // Issue #9: No exception testing (method throws but test doesn't verify)
    @Test
    public void testInvalidUser() {
        // validateUser() throws IllegalArgumentException for invalid users
        // But test doesn't verify the exception!
        User user = new User("", "invalid"); // Invalid user
        try {
            user.validate(); // Should throw, but test doesn't check
        } catch (Exception e) {
            // Swallowed exception - test passes even if wrong exception thrown
        }
    }

    // Issue #10: No negative test cases (only happy path tested)
    @Test
    public void testUserAge() {
        User user = new User("David", "david@example.com");
        user.setAge(25);
        assertEquals(25, user.getAge());
        // Missing: Test negative age, zero age, very large age
    }

    // Issue #11: Missing edge cases (only testing common values)
    @Test
    public void testEmailValidation() {
        User user = new User("Emma", "emma@example.com");
        assertTrue(user.validateEmail());
        // Missing: Test empty email, null email, invalid format, special characters
    }

    // Issue #12: No boundary testing (min/max values not tested)
    @Test
    public void testUserDiscount() {
        User user = new User("Frank", "frank@example.com");
        user.setAge(30);
        double discount = user.calculateDiscount();
        assertEquals(0.1, discount, 0.01);
        // Missing: Test age 0, 18 (adult), 65 (senior), 150 (invalid)
    }

    // ==================== TEST NAMING - BAD PATTERNS ====================

    // Issue #13: Vague test name (doesn't describe what is tested)
    @Test
    public void test1() { // Bad! What does test1 test?
        User user = new User("George", "george@example.com");
        assertNotNull(user);
    }

    // Issue #14: Non-descriptive name (doesn't follow convention)
    @Test
    public void userTest() { // Bad! Should be: testUserCreation or shouldCreateUser
        User user = new User("Helen", "helen@example.com");
        assertEquals("Helen", user.getName());
    }

    // Issue #15: Missing "should" or "test" prefix (unclear intent)
    @Test
    public void validateEmail() { // Bad! Looks like production method
        User user = new User("Ivan", "ivan@example.com");
        assertTrue(user.validateEmail());
    }

    // Issue #16: Unclear behavior description
    @Test
    public void testMethod() { // Bad! Which method? What behavior?
        User user = new User("Julia", "julia@example.com");
        user.setAge(40);
        assertEquals(40, user.getAge());
    }

    // ==================== SAFE PATTERNS ====================

    // ========== JUNIT ASSERTIONS - SAFE ==========

    // Safe #1: Proper assertions with clear expectations
    @Test
    public void testUserCreation_WithValidData_ShouldCreateUser() {
        User user = new User("Alice", "alice@example.com");
        
        assertNotNull(user);
        assertEquals("Alice", user.getName());
        assertEquals("alice@example.com", user.getEmail());
        assertTrue(user.validate());
    }

    // Safe #2: Multiple assertions with descriptive messages
    @Test
    public void shouldCalculateDiscountCorrectly_ForDifferentAges() {
        User youngUser = new User("Young", "young@example.com");
        youngUser.setAge(17);
        assertEquals(0.0, youngUser.calculateDiscount(), 0.01, "Under 18 should get no discount");
        
        User adultUser = new User("Adult", "adult@example.com");
        adultUser.setAge(30);
        assertEquals(0.1, adultUser.calculateDiscount(), 0.01, "Adults get 10% discount");
        
        User seniorUser = new User("Senior", "senior@example.com");
        seniorUser.setAge(65);
        assertEquals(0.2, seniorUser.calculateDiscount(), 0.01, "Seniors get 20% discount");
    }

    // ========== MOCKITO USAGE - SAFE ==========

    // Safe #3: Proper mocking with stubbing
    @Test
    public void shouldSendEmailSuccessfully_WhenUserRegisters() {
        EmailService mockEmail = mock(EmailService.class);
        when(mockEmail.send(anyString(), anyString())).thenReturn(true);
        
        User user = new User("Bob", "bob@example.com");
        boolean result = mockEmail.send(user.getEmail(), "Welcome");
        
        assertTrue(result);
        verify(mockEmail).send("bob@example.com", "Welcome");
    }

    // Safe #4: Mocking only external dependencies (not POJOs)
    @Test
    public void shouldFetchUserFromService_WhenIdProvided() {
        UserService mockService = mock(UserService.class);
        User expectedUser = new User("Charlie", "charlie@example.com");
        when(mockService.findById(1L)).thenReturn(expectedUser);
        
        User actualUser = mockService.findById(1L);
        
        assertNotNull(actualUser);
        assertEquals("Charlie", actualUser.getName());
        verify(mockService).findById(1L);
    }

    // ========== TEST COVERAGE - SAFE ==========

    // Safe #5: Exception testing with assertThrows
    @Test
    public void shouldThrowException_WhenUserHasInvalidEmail() {
        assertThrows(IllegalArgumentException.class, () -> {
            User user = new User("Invalid", "not-an-email");
            user.validate();
        }, "Should throw IllegalArgumentException for invalid email");
    }

    // Safe #6: Testing edge cases and boundaries
    @Test
    public void shouldHandleEdgeCases_ForUserAge() {
        // Test minimum age
        User youngUser = new User("Young", "young@example.com");
        youngUser.setAge(0);
        assertEquals(0, youngUser.getAge());
        
        // Test boundary (18 years old)
        User adultUser = new User("Adult", "adult@example.com");
        adultUser.setAge(18);
        assertEquals(18, adultUser.getAge());
        
        // Test maximum reasonable age
        User oldUser = new User("Old", "old@example.com");
        oldUser.setAge(120);
        assertEquals(120, oldUser.getAge());
        
        // Test negative age (should throw)
        assertThrows(IllegalArgumentException.class, () -> {
            User invalidUser = new User("Invalid", "invalid@example.com");
            invalidUser.setAge(-1);
        });
    }

    // ========== TEST NAMING - SAFE ==========

    // Safe #7: Clear descriptive test name (Given-When-Then)
    @Test
    public void givenValidUser_whenValidating_thenReturnsTrue() {
        User user = new User("David", "david@example.com");
        user.setAge(25);
        
        boolean result = user.validate();
        
        assertTrue(result);
    }

    // Safe #8: BDD-style naming (should...when...)
    @Test
    public void shouldReturnUserDetails_whenUserExists() {
        UserService service = new UserService();
        User user = new User("Emma", "emma@example.com");
        service.save(user);
        
        User found = service.findByEmail("emma@example.com");
        
        assertNotNull(found);
        assertEquals("Emma", found.getName());
    }

    // ==================== HELPER CLASSES ====================

    static class User {
        private String name;
        private String email;
        private int age;
        private boolean active;

        public User(String name, String email) {
            this.name = name;
            this.email = email;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public int getAge() { return age; }
        public void setAge(int age) { 
            if (age < 0) throw new IllegalArgumentException("Age cannot be negative");
            this.age = age; 
        }
        
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
        
        public boolean validate() {
            if (name == null || name.isEmpty()) return false;
            return validateEmail();
        }
        
        public boolean validateEmail() {
            if (email == null || email.isEmpty()) return false;
            return email.contains("@") && email.contains(".");
        }
        
        public double calculateDiscount() {
            if (age < 18) return 0.0;
            if (age >= 65) return 0.2;
            return 0.1;
        }
    }

    static class UserService {
        private List<User> users = new ArrayList<>();
        
        public void save(User user) {
            users.add(user);
        }
        
        public User findById(Long id) {
            return users.isEmpty() ? null : users.get(0);
        }
        
        public User findByEmail(String email) {
            return users.stream()
                .filter(u -> u.getEmail().equals(email))
                .findFirst()
                .orElse(null);
        }
    }

    static class EmailService {
        public boolean send(String to, String message) {
            return true;
        }
    }
}
