import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

/**
 * Test fixture for JavaConcurrencyDetector
 * Contains intentional concurrency issues for detection
 */
public class ConcurrencySample {

    // ============================================================
    // ISSUE #1: Race Condition - Shared Mutable State
    // ============================================================
    
    private int counter = 0; // Shared mutable state without synchronization
    
    public void incrementCounter() {
        // ISSUE: Non-atomic increment operation on shared state
        counter++; // Race condition: read-modify-write not atomic
    }
    
    public int getCounter() {
        return counter; // Reading shared state without synchronization
    }
    
    // ============================================================
    // ISSUE #2: Unsynchronized Collection Access
    // ============================================================
    
    private List<String> names = new ArrayList<>(); // Not thread-safe
    
    public void addName(String name) {
        // ISSUE: ArrayList is not thread-safe, may cause ConcurrentModificationException
        names.add(name);
    }
    
    public List<String> getNames() {
        // ISSUE: Returning internal reference to non-thread-safe collection
        return names;
    }
    
    // ============================================================
    // ISSUE #3: HashMap in Multi-threaded Context
    // ============================================================
    
    private Map<String, Integer> cache = new HashMap<>(); // Not thread-safe
    
    public void updateCache(String key, Integer value) {
        // ISSUE: HashMap is not thread-safe, may cause infinite loop or data corruption
        cache.put(key, value);
    }
    
    public Integer getCacheValue(String key) {
        return cache.get(key);
    }
    
    // ============================================================
    // ISSUE #4: Deadlock Potential - Lock Ordering
    // ============================================================
    
    private final Object lock1 = new Object();
    private final Object lock2 = new Object();
    
    public void method1() {
        synchronized (lock1) {
            // Some work
            doWork();
            synchronized (lock2) {
                // ISSUE: Acquiring lock2 while holding lock1
                doMoreWork();
            }
        }
    }
    
    public void method2() {
        synchronized (lock2) {
            // Some work
            doWork();
            synchronized (lock1) {
                // ISSUE: Acquiring lock1 while holding lock2 (reverse order from method1)
                // This can cause deadlock!
                doMoreWork();
            }
        }
    }
    
    // ============================================================
    // ISSUE #5: Thread Safety Violation - Singleton with Mutable State
    // ============================================================
    
    public static class UnsafeSingleton {
        private static UnsafeSingleton instance;
        private List<String> data = new ArrayList<>(); // Mutable state
        
        public static UnsafeSingleton getInstance() {
            if (instance == null) {
                // ISSUE: Not thread-safe, multiple instances can be created
                instance = new UnsafeSingleton();
            }
            return instance;
        }
        
        public void addData(String item) {
            // ISSUE: Mutable state in singleton without synchronization
            data.add(item);
        }
    }
    
    // ============================================================
    // ISSUE #6: Double-Checked Locking Without Volatile
    // ============================================================
    
    public static class BrokenDoubleCheckedLocking {
        private static BrokenDoubleCheckedLocking instance; // Missing volatile
        
        public static BrokenDoubleCheckedLocking getInstance() {
            if (instance == null) {
                synchronized (BrokenDoubleCheckedLocking.class) {
                    if (instance == null) {
                        // ISSUE: Without volatile, this can break due to instruction reordering
                        instance = new BrokenDoubleCheckedLocking();
                    }
                }
            }
            return instance;
        }
    }
    
    // ============================================================
    // ISSUE #7: Concurrent Modification During Iteration
    // ============================================================
    
    private Set<String> users = new HashSet<>();
    
    public void removeInactiveUsers() {
        for (String user : users) {
            if (isInactive(user)) {
                // ISSUE: Modifying collection during iteration causes ConcurrentModificationException
                users.remove(user);
            }
        }
    }
    
    // ============================================================
    // SAFE PATTERNS (Should NOT be flagged)
    // ============================================================
    
    // Safe: Using AtomicInteger for thread-safe counter
    private AtomicInteger safeCounter = new AtomicInteger(0);
    
    public void incrementSafeCounter() {
        safeCounter.incrementAndGet(); // Atomic operation
    }
    
    // Safe: Using ConcurrentHashMap
    private ConcurrentHashMap<String, Integer> safeCache = new ConcurrentHashMap<>();
    
    public void updateSafeCache(String key, Integer value) {
        safeCache.put(key, value); // Thread-safe
    }
    
    // Safe: Using Collections.synchronizedList
    private List<String> safeName = Collections.synchronizedList(new ArrayList<>());
    
    public void addSafeName(String name) {
        safeName.add(name); // Thread-safe
    }
    
    // Safe: Proper double-checked locking with volatile
    public static class SafeSingleton {
        private static volatile SafeSingleton instance; // Volatile!
        
        public static SafeSingleton getInstance() {
            if (instance == null) {
                synchronized (SafeSingleton.class) {
                    if (instance == null) {
                        instance = new SafeSingleton();
                    }
                }
            }
            return instance;
        }
    }
    
    // Safe: Using CopyOnWriteArrayList for concurrent reads
    private CopyOnWriteArrayList<String> safeUsers = new CopyOnWriteArrayList<>();
    
    public void addSafeUser(String user) {
        safeUsers.add(user); // Thread-safe
    }
    
    // Safe: Using Iterator.remove() for safe removal
    public void removeSafeInactiveUsers() {
        Iterator<String> iterator = users.iterator();
        while (iterator.hasNext()) {
            String user = iterator.next();
            if (isInactive(user)) {
                iterator.remove(); // Safe removal
            }
        }
    }
    
    // Helper methods
    private void doWork() {
        try { Thread.sleep(10); } catch (InterruptedException e) {}
    }
    
    private void doMoreWork() {
        try { Thread.sleep(10); } catch (InterruptedException e) {}
    }
    
    private boolean isInactive(String user) {
        return user.startsWith("inactive_");
    }
}
