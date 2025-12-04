// Java Complexity & Best Practices Issues for Screenshot Demo

package com.odavl.demo;

import java.util.*;
import java.sql.*;
import java.io.*;

public class JavaIssuesDemo {

    // ❌ COMPLEXITY: High cyclomatic complexity (15+)
    public String validateUserAccess(User user, Role role, Permissions perms) {
        if (user != null) {
            if (user.isActive()) {
                if (role != null) {
                    if (role.getLevel() > 0) {
                        if (perms != null) {
                            if (perms.canRead()) {
                                if (perms.canWrite()) {
                                    if (perms.canDelete()) {
                                        if (user.getAge() > 18) {
                                            if (user.isVerified()) {
                                                return "Full Access";
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return "No Access";
    }

    // ❌ EXCEPTION: Empty catch block
    public void saveUser(User user) {
        try {
            database.save(user);
        } catch (Exception e) {
            // Empty catch - exception swallowed
        }
    }

    // ❌ EXCEPTION: Too broad catch
    public Data loadData(String filename) {
        try {
            return readFile(filename);
        } catch (Exception e) {
            // Catching all exceptions is bad practice
            return null;
        }
    }

    // ❌ STREAM: Incorrect stream usage
    public List<String> processItems(List<Item> items) {
        List<String> result = new ArrayList<>();
        items.stream()
             .forEach(item -> result.add(item.getName())); // Side effect in forEach
        return result; // Should use .map().collect(Collectors.toList())
    }

    // ❌ STREAM: Unnecessary stream operations
    public long countActiveUsers(List<User> users) {
        return users.stream()
                    .filter(u -> u.isActive())
                    .collect(Collectors.toList())
                    .stream()  // Redundant stream after collect
                    .count();
    }

    // ❌ MEMORY: Resource leak - connection not closed
    public ResultSet getUserData(int userId) throws SQLException {
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/db");
        Statement stmt = conn.createStatement();
        return stmt.executeQuery("SELECT * FROM users WHERE id = " + userId);
        // Connection and Statement never closed
    }

    // ❌ MEMORY: StringBuilder in loop
    public String concatenateNames(List<String> names) {
        String result = "";
        for (String name : names) {
            result += name + ", "; // Creates new String object each iteration
        }
        return result;
    }

    // ❌ COMPLEXITY: Deeply nested loops
    public void processMatrix(int[][] matrix) {
        for (int i = 0; i < matrix.length; i++) {
            for (int j = 0; j < matrix[i].length; j++) {
                for (int k = 0; k < matrix[i][j]; k++) {
                    for (int l = 0; l < k; l++) {
                        System.out.println(matrix[i][j]);
                    }
                }
            }
        }
    }

    // ❌ EXCEPTION: Exception used for flow control
    public boolean isNumeric(String str) {
        try {
            Integer.parseInt(str);
            return true;
        } catch (NumberFormatException e) {
            return false; // Using exceptions for control flow
        }
    }

    // ❌ MEMORY: Static collection never cleared
    private static List<User> activeUsers = new ArrayList<>();
    
    public void addActiveUser(User user) {
        activeUsers.add(user);
        // Static collection grows indefinitely
    }

    // ❌ SPRING: Incorrect dependency injection
    public class UserService {
        private UserRepository repo = new UserRepository(); // Direct instantiation
        
        public User getUser(Long id) {
            return repo.findById(id);
        }
    }

    // Mock classes
    interface Database { void save(User user); }
    static class User {
        public boolean isActive() { return true; }
        public int getAge() { return 20; }
        public boolean isVerified() { return true; }
    }
    static class Role {
        public int getLevel() { return 1; }
    }
    static class Permissions {
        public boolean canRead() { return true; }
        public boolean canWrite() { return true; }
        public boolean canDelete() { return true; }
    }
    static class Item {
        public String getName() { return ""; }
    }
    static class Data {}
    static Database database;
    
    Data readFile(String filename) { return new Data(); }
    
    static class UserRepository {
        public User findById(Long id) { return new User(); }
    }
}
