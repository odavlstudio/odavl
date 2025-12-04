import java.util.*;
import java.util.regex.*;
import java.util.stream.*;

/**
 * Performance Sample - Intentional performance issues for JavaPerformanceDetector testing
 * 
 * UNSAFE PATTERNS (12 intentional issues):
 * 1. Boxing/unboxing in loops (4 issues)
 * 2. Collection without pre-allocation (3 issues)
 * 3. Regex pattern compilation in loops (2 issues)
 * 4. String concatenation in loops (3 issues)
 * 
 * SAFE PATTERNS (8 patterns that should NOT be flagged):
 * 1. Primitive types in loops
 * 2. Pre-allocated collections
 * 3. Compiled regex patterns
 * 4. StringBuilder usage
 */
public class PerformanceSample {

    // ==================== UNSAFE PATTERNS ====================
    
    // Issue #1: Boxing in loop - Integer wrapper instead of int
    public List<Integer> boxingInLoop(int limit) {
        List<Integer> numbers = new ArrayList<>();
        for (Integer i = 0; i < limit; i++) { // Integer instead of int - creates 1000 objects!
            numbers.add(i);
        }
        return numbers;
    }
    
    // Issue #2: Unboxing in loop - Integer.parseInt returns int, but assigned to Integer
    public int sumWithUnboxing(List<String> values) {
        int sum = 0;
        for (String value : values) {
            Integer parsed = Integer.parseInt(value); // parseInt returns int, boxing to Integer
            sum += parsed; // Then unboxing back to int - double conversion!
        }
        return sum;
    }
    
    // Issue #3: Boxing in enhanced for loop
    public void processPrices(int[] prices) {
        int total = 0;
        for (Integer price : prices) { // Auto-boxing int[] to Integer - wasteful!
            total += price;
        }
        System.out.println("Total: " + total);
    }
    
    // Issue #4: Double wrapper comparison in loop
    public boolean hasHighPrices(List<Double> prices) {
        for (Double price : prices) {
            if (price > 100.0) { // Unboxing Double to double for comparison
                return true;
            }
        }
        return false;
    }
    
    // Issue #5: Collection without initial capacity - multiple resizes
    public List<String> buildLargeList(int size) {
        List<String> items = new ArrayList<>(); // No initial capacity
        for (int i = 0; i < size; i++) { // size=10000 → 10+ resizes!
            items.add("item" + i);
        }
        return items;
    }
    
    // Issue #6: HashMap without initial capacity
    public Map<String, Integer> buildLargeMap(String[] keys) {
        Map<String, Integer> map = new HashMap<>(); // No capacity, default=16, load factor=0.75
        for (int i = 0; i < keys.length; i++) { // If keys.length=1000 → many rehashes
            map.put(keys[i], i);
        }
        return map;
    }
    
    // Issue #7: HashSet without initial capacity
    public Set<String> collectUniqueWords(List<String> sentences) {
        Set<String> words = new HashSet<>(); // No capacity
        for (String sentence : sentences) { // 10000 sentences → many rehashes
            String[] tokens = sentence.split(" ");
            for (String word : tokens) {
                words.add(word);
            }
        }
        return words;
    }
    
    // Issue #8: Pattern.matches in loop - compiles regex every iteration
    public List<String> validateEmails(List<String> emails) {
        List<String> valid = new ArrayList<>();
        for (String email : emails) {
            // Pattern.matches compiles the regex EVERY iteration - very slow!
            if (Pattern.matches("^[A-Za-z0-9+_.-]+@(.+)$", email)) {
                valid.add(email);
            }
        }
        return valid;
    }
    
    // Issue #9: Pattern compile inside loop
    public boolean hasValidPhones(List<String> phones) {
        for (String phone : phones) {
            Pattern pattern = Pattern.compile("\\d{3}-\\d{3}-\\d{4}"); // Compile inside loop!
            if (pattern.matcher(phone).matches()) {
                return true;
            }
        }
        return false;
    }
    
    // Issue #10: String concatenation in loop with +
    public String buildCsv(List<String> values) {
        String csv = ""; // Immutable String
        for (String value : values) {
            csv += value + ","; // Creates new String object each iteration!
        }
        return csv;
    }
    
    // Issue #11: String concatenation in loop with +=
    public String formatReport(Map<String, Integer> data) {
        String report = "Report:\n";
        for (Map.Entry<String, Integer> entry : data.entrySet()) {
            report += entry.getKey() + ": " + entry.getValue() + "\n"; // Many String objects!
        }
        return report;
    }
    
    // Issue #12: String concatenation in nested loop
    public String buildMatrix(int rows, int cols) {
        String matrix = "";
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                matrix += i + "," + j + " "; // O(n²) String allocations!
            }
            matrix += "\n";
        }
        return matrix;
    }
    
    // ==================== SAFE PATTERNS ====================
    
    // Safe #1: Primitive int in loop (no boxing)
    public List<Integer> primitiveInLoop(int limit) {
        List<Integer> numbers = new ArrayList<>(limit); // Pre-allocated!
        for (int i = 0; i < limit; i++) { // Primitive int - no boxing
            numbers.add(i); // Boxing only at add() - unavoidable
        }
        return numbers;
    }
    
    // Safe #2: Pre-allocated ArrayList
    public List<String> buildListWithCapacity(int size) {
        List<String> items = new ArrayList<>(size); // Initial capacity = size
        for (int i = 0; i < size; i++) {
            items.add("item" + i);
        }
        return items; // No resizes!
    }
    
    // Safe #3: Pre-allocated HashMap
    public Map<String, Integer> buildMapWithCapacity(String[] keys) {
        // Calculate capacity: keys.length / 0.75 + 1
        int capacity = (int) (keys.length / 0.75) + 1;
        Map<String, Integer> map = new HashMap<>(capacity);
        for (int i = 0; i < keys.length; i++) {
            map.put(keys[i], i);
        }
        return map; // No rehashes!
    }
    
    // Safe #4: Pre-allocated HashSet
    public Set<Integer> buildSetWithCapacity(int size) {
        Set<Integer> numbers = new HashSet<>((int) (size / 0.75) + 1);
        for (int i = 0; i < size; i++) {
            numbers.add(i);
        }
        return numbers; // No rehashes!
    }
    
    // Safe #5: Compiled regex pattern (outside loop)
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    
    public List<String> validateEmailsOptimized(List<String> emails) {
        List<String> valid = new ArrayList<>(emails.size());
        for (String email : emails) {
            if (EMAIL_PATTERN.matcher(email).matches()) { // Reuse compiled pattern!
                valid.add(email);
            }
        }
        return valid;
    }
    
    // Safe #6: Pattern compiled once before loop
    public boolean hasValidPhonesOptimized(List<String> phones) {
        Pattern pattern = Pattern.compile("\\d{3}-\\d{3}-\\d{4}"); // Compile ONCE
        for (String phone : phones) {
            if (pattern.matcher(phone).matches()) {
                return true;
            }
        }
        return false;
    }
    
    // Safe #7: StringBuilder for string concatenation
    public String buildCsvOptimized(List<String> values) {
        StringBuilder csv = new StringBuilder(values.size() * 10); // Pre-allocated
        for (String value : values) {
            csv.append(value).append(","); // Mutable append - efficient!
        }
        return csv.toString();
    }
    
    // Safe #8: StringBuilder in nested loop
    public String buildMatrixOptimized(int rows, int cols) {
        StringBuilder matrix = new StringBuilder(rows * cols * 5);
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                matrix.append(i).append(",").append(j).append(" ");
            }
            matrix.append("\n");
        }
        return matrix.toString(); // Single String allocation at end
    }
    
    // Edge case: StringBuilder outside loop (safe)
    public String formatItems(List<String> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("Items: ");
        for (String item : items) {
            sb.append(item).append(", ");
        }
        return sb.toString();
    }
    
    // Edge case: Small collection (< 10 items) - pre-allocation optional
    public List<String> buildSmallList() {
        List<String> items = new ArrayList<>(); // Small list, no need to flag
        items.add("one");
        items.add("two");
        items.add("three");
        return items;
    }
}
