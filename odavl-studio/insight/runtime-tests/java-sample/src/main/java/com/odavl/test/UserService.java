package com.odavl.test;

import java.util.List;

public class UserService {
    
    // BAD: Null safety issue - no null check
    public String getUserName(User user) {
        return user.getName().toUpperCase(); // Will throw NullPointerException
    }
    
    // BAD: Inefficient loop - recreating list on each iteration
    public void processUsers(List<User> users) {
        for (int i = 0; i < users.size(); i++) {
            // BAD: Inefficient - calling size() repeatedly
            User user = users.get(i);
            System.out.println(user.getName());
        }
    }
    
    // BAD: Unused variable
    private static final String UNUSED_CONSTANT = "never used";
}
