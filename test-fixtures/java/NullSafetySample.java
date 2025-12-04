package com.example.demo;

import java.util.List;
import java.util.Optional;
import java.util.Map;

/**
 * Sample class with intentional null safety issues for testing
 * JavaNullSafetyDetector
 * 
 * Issues to detect:
 * 1. Null dereference (calling methods on potentially null objects)
 * 2. Method chaining on null
 * 3. Optional misuse (calling .get() without isPresent())
 * 4. Returning null for collections
 * 5. Missing @Nullable/@NonNull annotations
 * 6. Ternary expressions that may return null
 */
public class NullSafetySample {
    
    // Field without initialization or @Nullable annotation (Issue #5)
    private String uninitializedField;
    
    // Field with proper initialization
    private String initializedField = "default";
    
    /**
     * Method with potential null dereference (Issue #1)
     */
    public String getUserEmail(User user) {
        // NPE: user might be null
        return user.getEmail().toLowerCase();
    }
    
    /**
     * Method chaining on potentially null objects (Issue #2)
     */
    public String getUserCityName(User user) {
        // NPE: user, address, or city might be null
        return user.getAddress().getCity().getName();
    }
    
    /**
     * Optional misuse - calling .get() without isPresent() (Issue #3)
     */
    public String getOptionalValueUnsafe(Optional<String> opt) {
        // NPE: Optional might be empty
        return opt.get().toUpperCase();
    }
    
    /**
     * Optional.of() with potentially null value (Issue #3)
     */
    public Optional<String> createOptionalUnsafe(String value) {
        // NPE: Optional.of(null) throws NPE
        return Optional.of(value);
    }
    
    /**
     * Returning null for collection (Issue #4)
     */
    public List<String> getUserNamesUnsafe(Map<String, User> users) {
        if (users == null || users.isEmpty()) {
            // Should return empty list, not null
            return null;
        }
        return users.values().stream()
            .map(User::getName)
            .toList();
    }
    
    /**
     * Method without @NonNull annotation on parameter (Issue #5)
     */
    public void processUser(User user) {
        // user parameter has no null check or @NonNull annotation
        System.out.println(user.getName());
    }
    
    /**
     * Ternary expression that may return null (Issue #6)
     */
    public String getDisplayName(User user, boolean useFullName) {
        // May return null if user is null
        return useFullName ? user.getFullName() : user.getShortName();
    }
    
    /**
     * Method with proper null check (should NOT be flagged)
     */
    public String getUserEmailSafe(User user) {
        if (user == null) {
            return "no-email";
        }
        String email = user.getEmail();
        return email != null ? email.toLowerCase() : "no-email";
    }
    
    /**
     * Method with Optional.ofNullable (should NOT be flagged)
     */
    public Optional<String> getOptionalValueSafe(String value) {
        return Optional.ofNullable(value);
    }
    
    /**
     * Method returning empty collection instead of null (should NOT be flagged)
     */
    public List<String> getUserNamesSafe(Map<String, User> users) {
        if (users == null || users.isEmpty()) {
            return List.of(); // Empty list, not null
        }
        return users.values().stream()
            .map(User::getName)
            .toList();
    }
    
    /**
     * Method with Objects.requireNonNull() (should NOT be flagged)
     */
    public void processUserSafe(User user) {
        java.util.Objects.requireNonNull(user, "user must not be null");
        System.out.println(user.getName());
    }
    
    /**
     * Nested class User for testing
     */
    static class User {
        private String name;
        private String email;
        private Address address;
        
        public String getName() { return name; }
        public String getEmail() { return email; }
        public Address getAddress() { return address; }
        public String getFullName() { return name + " (Full)"; }
        public String getShortName() { return name != null ? name.substring(0, 1) : "?"; }
    }
    
    /**
     * Nested class Address for testing
     */
    static class Address {
        private City city;
        
        public City getCity() { return city; }
    }
    
    /**
     * Nested class City for testing
     */
    static class City {
        private String name;
        
        public String getName() { return name; }
    }
}
