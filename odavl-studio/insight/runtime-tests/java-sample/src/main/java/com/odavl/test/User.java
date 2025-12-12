package com.odavl.test;

public class User {
    private String name;
    private String email;
    
    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }
    
    // BAD: Missing null check in getter
    public String getName() {
        return name; // Could return null
    }
    
    public String getEmail() {
        return email;
    }
}
