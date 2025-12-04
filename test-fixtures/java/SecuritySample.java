import java.sql.*;
import java.io.*;
import java.nio.file.*;
import java.security.*;
import javax.crypto.*;
import javax.crypto.spec.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Security Sample - Intentional security vulnerabilities for JavaSecurityDetector testing
 * 
 * UNSAFE PATTERNS (18 intentional vulnerabilities):
 * 1. SQL Injection (4 issues)
 * 2. XSS Vulnerabilities (3 issues)
 * 3. Path Traversal (3 issues)
 * 4. Weak Encryption (3 issues)
 * 5. Hardcoded Credentials (3 issues)
 * 6. Insecure Deserialization (2 issues)
 * 
 * SAFE PATTERNS (12 patterns that should NOT be flagged):
 * 1. Parameterized queries
 * 2. HTML escaping
 * 3. Path validation
 * 4. Strong encryption
 * 5. Externalized config
 * 6. Safe deserialization
 */
@RestController
public class SecuritySample {

    // ==================== UNSAFE PATTERNS ====================
    
    // ========== SQL INJECTION (4 issues) ==========
    
    // Issue #1: Direct string concatenation in SQL query (JDBC)
    public List<User> findUsersByNameUnsafe(Connection conn, String name) throws SQLException {
        List<User> users = new ArrayList<>();
        // SQL Injection! User input concatenated directly into query
        String query = "SELECT * FROM users WHERE name = '" + name + "'";
        // Attack: name = "'; DROP TABLE users; --"
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(query);
        while (rs.next()) {
            users.add(new User(rs.getString("name"), rs.getString("email")));
        }
        return users;
    }
    
    // Issue #2: String formatting in SQL query
    public User getUserByIdUnsafe(Connection conn, int userId) throws SQLException {
        // SQL Injection via format string
        String query = String.format("SELECT * FROM users WHERE id = %d", userId);
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(query);
        if (rs.next()) {
            return new User(rs.getString("name"), rs.getString("email"));
        }
        return null;
    }
    
    // Issue #3: JdbcTemplate with string concatenation
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    public List<User> searchUsers(String searchTerm) {
        // SQL Injection! String concatenation with JdbcTemplate
        String sql = "SELECT * FROM users WHERE name LIKE '%" + searchTerm + "%'";
        return jdbcTemplate.query(sql, (rs, rowNum) -> 
            new User(rs.getString("name"), rs.getString("email"))
        );
    }
    
    // Issue #4: Dynamic ORDER BY clause
    public List<User> getUsersSortedBy(Connection conn, String sortColumn) throws SQLException {
        // SQL Injection! sortColumn not validated
        // Attack: sortColumn = "name; DROP TABLE users; --"
        String query = "SELECT * FROM users ORDER BY " + sortColumn;
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(query);
        List<User> users = new ArrayList<>();
        while (rs.next()) {
            users.add(new User(rs.getString("name"), rs.getString("email")));
        }
        return users;
    }
    
    // ========== XSS VULNERABILITIES (3 issues) ==========
    
    // Issue #5: Returning user input directly in HTML (Spring)
    @GetMapping("/greet")
    public String greetUser(@RequestParam String name) {
        // XSS! User input not sanitized
        // Attack: name = "<script>alert('XSS')</script>"
        return "<h1>Hello " + name + "</h1>";
    }
    
    // Issue #6: Building HTML with user input
    public String renderUserProfile(String username, String bio) {
        // XSS! Both inputs vulnerable
        // Attack: bio = "<img src=x onerror='alert(document.cookie)'>"
        StringBuilder html = new StringBuilder();
        html.append("<div class='profile'>");
        html.append("<h2>").append(username).append("</h2>");
        html.append("<p>").append(bio).append("</p>");
        html.append("</div>");
        return html.toString();
    }
    
    // Issue #7: JSON response without encoding
    @GetMapping("/user-data")
    @ResponseBody
    public String getUserData(@RequestParam String userId) {
        // XSS via JSON injection
        // Attack: userId = "1\"; alert('XSS'); //"
        return "{\"userId\": \"" + userId + "\", \"status\": \"active\"}";
    }
    
    // ========== PATH TRAVERSAL (3 issues) ==========
    
    // Issue #8: File access with user input (no validation)
    @GetMapping("/download")
    public byte[] downloadFile(@RequestParam String filename) throws IOException {
        // Path Traversal! No validation on filename
        // Attack: filename = "../../etc/passwd"
        File file = new File("/var/www/uploads/" + filename);
        return Files.readAllBytes(file.toPath());
    }
    
    // Issue #9: Path concatenation with user input
    public String readUserFile(String userId, String filename) throws IOException {
        // Path Traversal! filename not validated
        // Attack: filename = "../../../sensitive.txt"
        Path userDir = Paths.get("/data/users/" + userId);
        Path filePath = userDir.resolve(filename);
        return new String(Files.readAllBytes(filePath));
    }
    
    // Issue #10: FileInputStream with user-controlled path
    public InputStream openFile(String path) throws FileNotFoundException {
        // Path Traversal! Direct user input to FileInputStream
        // Attack: path = "/etc/shadow"
        return new FileInputStream(path);
    }
    
    // ========== WEAK ENCRYPTION (3 issues) ==========
    
    // Issue #11: DES encryption (deprecated, weak)
    public byte[] encryptWithDES(String data, String key) throws Exception {
        // Weak encryption! DES has 56-bit key, easily brute-forced
        Cipher cipher = Cipher.getInstance("DES");
        SecretKeySpec keySpec = new SecretKeySpec(key.getBytes(), "DES");
        cipher.init(Cipher.ENCRYPT_MODE, keySpec);
        return cipher.doFinal(data.getBytes());
    }
    
    // Issue #12: MD5 for password hashing
    public String hashPasswordMD5(String password) throws NoSuchAlgorithmException {
        // Weak hashing! MD5 is cryptographically broken
        // Rainbow tables can crack MD5 hashes instantly
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] hash = md.digest(password.getBytes());
        return Base64.getEncoder().encodeToString(hash);
    }
    
    // Issue #13: SHA-1 for signature verification
    public boolean verifySignature(String data, String signature) throws Exception {
        // Weak hashing! SHA-1 has known collision attacks
        MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
        byte[] hash = sha1.digest(data.getBytes());
        String computed = Base64.getEncoder().encodeToString(hash);
        return computed.equals(signature);
    }
    
    // ========== HARDCODED CREDENTIALS (3 issues) ==========
    
    // Issue #14: Hardcoded database password
    public Connection getDatabaseConnection() throws SQLException {
        String url = "jdbc:mysql://localhost:3306/mydb";
        String username = "root";
        // Hardcoded password! Should use environment variables or config
        String password = "P@ssw0rd123";
        return DriverManager.getConnection(url, username, password);
    }
    
    // Issue #15: Hardcoded API key
    public String callExternalAPI(String endpoint) throws IOException {
        // Hardcoded API key! Should be in secure vault
        String apiKey = "REPLACE_WITH_YOUR_API_KEY_FROM_VAULT";
        HttpURLConnection conn = (HttpURLConnection) new URL(endpoint).openConnection();
        conn.setRequestProperty("Authorization", "Bearer " + apiKey);
        // ... rest of implementation
        return "response";
    }
    
    // Issue #16: Hardcoded encryption key
    private static final String ENCRYPTION_KEY = "MySecretKey12345"; // Hardcoded!
    
    public byte[] encryptData(String data) throws Exception {
        // Using hardcoded encryption key
        SecretKeySpec keySpec = new SecretKeySpec(ENCRYPTION_KEY.getBytes(), "AES");
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.ENCRYPT_MODE, keySpec);
        return cipher.doFinal(data.getBytes());
    }
    
    // ========== INSECURE DESERIALIZATION (2 issues) ==========
    
    // Issue #17: ObjectInputStream without validation
    public Object deserializeObject(byte[] data) throws Exception {
        // Insecure deserialization! No validation of object type
        // Attack: Gadget chains can achieve RCE
        ByteArrayInputStream bis = new ByteArrayInputStream(data);
        ObjectInputStream ois = new ObjectInputStream(bis);
        return ois.readObject(); // Dangerous!
    }
    
    // Issue #18: Deserialize from user-provided file
    @PostMapping("/import")
    public Object importData(@RequestParam String filename) throws Exception {
        // Insecure deserialization from user-provided file!
        FileInputStream fis = new FileInputStream(filename);
        ObjectInputStream ois = new ObjectInputStream(fis);
        return ois.readObject();
    }
    
    // ==================== SAFE PATTERNS ====================
    
    // ========== SQL INJECTION - SAFE ==========
    
    // Safe #1: PreparedStatement (parameterized query)
    public List<User> findUsersByNameSafe(Connection conn, String name) throws SQLException {
        List<User> users = new ArrayList<>();
        // Safe! PreparedStatement with parameter binding
        String query = "SELECT * FROM users WHERE name = ?";
        PreparedStatement pstmt = conn.prepareStatement(query);
        pstmt.setString(1, name); // Parameter binding prevents injection
        ResultSet rs = pstmt.executeQuery();
        while (rs.next()) {
            users.add(new User(rs.getString("name"), rs.getString("email")));
        }
        return users;
    }
    
    // Safe #2: JdbcTemplate with parameters
    public List<User> searchUsersSafe(String searchTerm) {
        // Safe! Parameterized query with JdbcTemplate
        String sql = "SELECT * FROM users WHERE name LIKE ?";
        return jdbcTemplate.query(sql, new Object[]{"%" + searchTerm + "%"}, 
            (rs, rowNum) -> new User(rs.getString("name"), rs.getString("email"))
        );
    }
    
    // Safe #3: Whitelist validation for ORDER BY
    public List<User> getUsersSortedBySafe(Connection conn, String sortColumn) throws SQLException {
        // Safe! Whitelist validation
        Set<String> allowedColumns = Set.of("name", "email", "created_at");
        if (!allowedColumns.contains(sortColumn)) {
            throw new IllegalArgumentException("Invalid sort column");
        }
        String query = "SELECT * FROM users ORDER BY " + sortColumn;
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(query);
        List<User> users = new ArrayList<>();
        while (rs.next()) {
            users.add(new User(rs.getString("name"), rs.getString("email")));
        }
        return users;
    }
    
    // ========== XSS - SAFE ==========
    
    // Safe #4: HTML escaping
    @GetMapping("/greet-safe")
    public String greetUserSafe(@RequestParam String name) {
        // Safe! HTML escaping
        String escaped = escapeHtml(name);
        return "<h1>Hello " + escaped + "</h1>";
    }
    
    private String escapeHtml(String input) {
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#x27;");
    }
    
    // Safe #5: Using template engine (Thymeleaf auto-escapes)
    @GetMapping("/profile-safe")
    public String renderUserProfileSafe(String username, String bio) {
        // Safe! Return model for Thymeleaf to render (auto-escapes)
        // In real app: return "profile" + model with username/bio
        return "redirect:/profile";
    }
    
    // ========== PATH TRAVERSAL - SAFE ==========
    
    // Safe #6: Path validation and normalization
    @GetMapping("/download-safe")
    public byte[] downloadFileSafe(@RequestParam String filename) throws IOException {
        // Safe! Validate filename and prevent traversal
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new IllegalArgumentException("Invalid filename");
        }
        
        Path basePath = Paths.get("/var/www/uploads").toRealPath();
        Path filePath = basePath.resolve(filename).normalize();
        
        // Ensure resolved path is still within base directory
        if (!filePath.startsWith(basePath)) {
            throw new SecurityException("Path traversal detected");
        }
        
        return Files.readAllBytes(filePath);
    }
    
    // Safe #7: Whitelist approach
    public String readUserFileSafe(String userId, String filename) throws IOException {
        // Safe! Whitelist of allowed files
        Set<String> allowedFiles = Set.of("profile.txt", "settings.json", "avatar.png");
        if (!allowedFiles.contains(filename)) {
            throw new IllegalArgumentException("File not allowed");
        }
        
        Path userDir = Paths.get("/data/users/" + userId);
        Path filePath = userDir.resolve(filename);
        return new String(Files.readAllBytes(filePath));
    }
    
    // ========== WEAK ENCRYPTION - SAFE ==========
    
    // Safe #8: AES-256 encryption (strong)
    public byte[] encryptWithAES(String data, SecretKey key) throws Exception {
        // Safe! AES-256 with GCM mode (authenticated encryption)
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec spec = new GCMParameterSpec(128, new byte[12]); // 12-byte IV
        cipher.init(Cipher.ENCRYPT_MODE, key, spec);
        return cipher.doFinal(data.getBytes());
    }
    
    // Safe #9: bcrypt for password hashing
    public String hashPasswordBcrypt(String password) {
        // Safe! bcrypt with salt and work factor
        // In real app: use BCryptPasswordEncoder from Spring Security
        return "bcrypt-hashed-password";
    }
    
    // Safe #10: SHA-256 for integrity checking
    public String computeChecksum(String data) throws NoSuchAlgorithmException {
        // Safe! SHA-256 for integrity (not for passwords though)
        MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
        byte[] hash = sha256.digest(data.getBytes());
        return Base64.getEncoder().encodeToString(hash);
    }
    
    // ========== HARDCODED CREDENTIALS - SAFE ==========
    
    // Safe #11: Environment variables
    public Connection getDatabaseConnectionSafe() throws SQLException {
        String url = System.getenv("DB_URL");
        String username = System.getenv("DB_USERNAME");
        String password = System.getenv("DB_PASSWORD"); // From environment
        return DriverManager.getConnection(url, username, password);
    }
    
    // Safe #12: Configuration file
    @Value("${api.key}") // From application.properties
    private String apiKey;
    
    public String callExternalAPISafe(String endpoint) throws IOException {
        // Safe! API key from config
        HttpURLConnection conn = (HttpURLConnection) new URL(endpoint).openConnection();
        conn.setRequestProperty("Authorization", "Bearer " + apiKey);
        return "response";
    }
    
    // ========== INSECURE DESERIALIZATION - SAFE ==========
    
    // Safe #13: JSON deserialization (type-safe)
    public User deserializeUserFromJSON(String json) {
        // Safe! JSON libraries validate structure
        // In real app: use Jackson or Gson
        return new User("name", "email");
    }
}

// Simple User class for examples
class User {
    private String name;
    private String email;
    
    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }
    
    public String getName() { return name; }
    public String getEmail() { return email; }
}
