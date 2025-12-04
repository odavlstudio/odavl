package com.example.demo;

public class UserService {
    private String apiKey; // Uninitialized field (NPE-005)
    
    public String getUserName(User user) {
        // Potential NPE: no null check on user parameter (NPE-003)
        return user.getName(); // NPE-001
    }
    
    public String formatName(User user) {
        // Null check present - should NOT flag
        if (user != null) {
            return user.getName().toUpperCase();
        }
        return null; // Returning null (NPE-004)
    }
    
    public User findUser(int id) {
        if (id < 0) {
            return null; // Consider Optional<User> (NPE-004)
        }
        User user = database.find(id);
        return user.getProfile().getName(); // Potential NPE chain (NPE-002)
    }
    
    public void processUser(User user) {
        // Missing null check before dereference
        String name = user.getName(); // NPE-001
        String email = user.getEmail(); // NPE-001
        
        // String concatenation with potentially null
        System.out.println("User: " + name + ", Email: " + email);
    }
    
    public boolean isAdmin(User user) {
        // Null comparison - could use Objects.nonNull()
        if (user == null) {
            return false;
        }
        return user.getRole().equals("ADMIN"); // Potential NPE on getRole()
    }
    
    class User {
        private String name;
        private String email;
        
        public String getName() {
            return this.name;
        }
        
        public String getEmail() {
            return this.email;
        }
        
        public Profile getProfile() {
            return null; // Always returns null - NPE risk
        }
        
        public String getRole() {
            return "USER";
        }
    }
    
    class Profile {
        public String getName() {
            return "Profile Name";
        }
    }
    
    class Database {
        public User find(int id) {
            return new User();
        }
    }
    
    private Database database = new Database();
}
