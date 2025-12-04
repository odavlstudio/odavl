package com.example.demo;

import java.io.*;
import java.util.*;

/**
 * Sample Java code with Stream API and Exception handling issues
 * For testing JavaStreamDetector and JavaExceptionDetector
 */
public class StreamExceptionSample {

    // STREAM-001: Filter + collect pattern
    public List<String> getActiveUserNames(List<User> users) {
        List<String> names = new ArrayList<>();
        for (User user : users) {
            if (user.isActive()) {
                names.add(user.getName());
            }
        }
        return names;
    }

    // STREAM-002: Map + collect pattern
    public List<Integer> getUserAges(List<User> users) {
        List<Integer> ages = new ArrayList<>();
        for (User user : users) {
            ages.add(user.getAge());
        }
        return ages;
    }

    // STREAM-003: forEach pattern
    public void printUsers(List<User> users) {
        for (User user : users) {
            System.out.println(user.getName());
        }
    }

    // STREAM-004: Reduce pattern (accumulation)
    public int calculateTotalAge(List<User> users) {
        int total = 0;
        for (User user : users) {
            total += user.getAge();
        }
        return total;
    }

    // EXCEPTION-001: Empty catch block
    public String readFileContent(String path) {
        try {
            BufferedReader reader = new BufferedReader(new FileReader(path));
            return reader.readLine();
        } catch (IOException e) {
            // Empty catch block - should log or handle
        }
        return null;
    }

    // EXCEPTION-002: Generic Exception catching
    public void processData(String data) {
        try {
            // Some processing
            int value = Integer.parseInt(data);
            System.out.println(value);
        } catch (Exception e) {
            // Too generic - should catch NumberFormatException specifically
            System.out.println("Error");
        }
    }

    // EXCEPTION-003: Swallowed exception (no logging)
    public User findUserById(int id) {
        try {
            // Database call
            return fetchFromDatabase(id);
        } catch (SQLException e) {
            return null; // Exception swallowed without logging
        }
    }

    // EXCEPTION-004: Missing finally block for resource cleanup
    public String readFile(String path) {
        FileInputStream fis = null;
        try {
            fis = new FileInputStream(path);
            byte[] data = new byte[1024];
            fis.read(data);
            return new String(data);
        } catch (IOException e) {
            e.printStackTrace();
        }
        // Missing finally block to close fis
        return null;
    }

    // EXCEPTION-005: Using exception for control flow
    public boolean isNumeric(String str) {
        try {
            Integer.parseInt(str);
            return true;
        } catch (NumberFormatException e) {
            return false; // Exception used for control flow
        }
    }

    // Combined issues: Stream + Exception
    public List<Integer> parseNumbers(List<String> strings) {
        List<Integer> numbers = new ArrayList<>();
        for (String str : strings) { // STREAM-001
            try {
                int num = Integer.parseInt(str);
                if (num > 0) {
                    numbers.add(num);
                }
            } catch (Exception e) { // EXCEPTION-002 (generic)
                // EXCEPTION-001 (empty catch)
            }
        }
        return numbers;
    }

    // Good example: Try-with-resources (Java 7+)
    public String readFileCorrect(String path) throws IOException {
        try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
            return reader.readLine();
        }
        // No finally needed - auto-closed
    }

    // Good example: Stream API
    public List<String> getActiveUserNamesCorrect(List<User> users) {
        return users.stream()
            .filter(User::isActive)
            .map(User::getName)
            .collect(Collectors.toList());
    }

    // Inner classes for testing
    static class User {
        private String name;
        private int age;
        private boolean active;

        public User(String name, int age, boolean active) {
            this.name = name;
            this.age = age;
            this.active = active;
        }

        public String getName() { return name; }
        public int getAge() { return age; }
        public boolean isActive() { return active; }
    }

    static class SQLException extends Exception {
        public SQLException(String message) {
            super(message);
        }
    }

    private User fetchFromDatabase(int id) throws SQLException {
        // Simulate database call
        if (id < 0) throw new SQLException("Invalid ID");
        return new User("User" + id, 25, true);
    }
}
