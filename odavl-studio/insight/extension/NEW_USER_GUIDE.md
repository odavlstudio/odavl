# 📖 New User Guide - ODAVL Insight

## 🎯 Step 1: Installation

### Method 1: From VS Code Marketplace (Easiest ✅)

1. **Open VS Code**
2. **Press**: `Ctrl+Shift+X` (to open Extensions panel)
3. **Search**: Type `ODAVL Insight` in the search box
4. **Click "Install"** on the ODAVL extension
5. **Wait** 5-10 seconds for installation to complete
6. **Reload VS Code** (optional but recommended)

### Method 2: From Website Directly

1. Visit: https://marketplace.visualstudio.com/items?itemName=odavl.odavl-insight-vscode
2. Click the green **"Install"** button
3. VS Code will open automatically and ask for confirmation
4. Click **"Install"** again in VS Code

### Method 3: Manual Installation from VSIX

*If you want to try a local or newer version:*

1. Open VS Code
2. Press `Ctrl+Shift+P` (Command Palette)
3. Type: `Extensions: Install from VSIX`
4. Select the file: `odavl-insight-vscode-2.0.2.vsix`
5. Wait for installation, then reload VS Code

---

## 🚀 Step 2: First Run

### After installation:

1. **Open your project** (any TypeScript, JavaScript, Python, or Java project)
   ```
   File → Open Folder → Select project folder
   ```

2. **ODAVL works automatically!** 🎉
   - No configuration needed
   - Analysis starts immediately when you open any file

3. **See results** in **Problems Panel**:
   - Press `Ctrl+Shift+M` to open Problems Panel
   - You'll see ODAVL issues with gold icon 🟡

---

## 💡 Step 3: How to Use ODAVL

### **A) Automatic Analysis**

ODAVL analyzes your files **automatically** when:
- ✅ Opening a file
- ✅ Saving a file (`Ctrl+S`)
- ✅ Editing code

**Example:**
```typescript
// Open a TypeScript file and see instant analysis
const apiKey = "sk-1234567890"; // ❌ Warning: Hardcoded API key!

function test(x: any) {      // ❌ Warning: Using 'any' type!
  return x;
}
```

### **B) Manual Commands**

Press `Ctrl+Shift+P` then type:

#### **1. `ODAVL: Analyze Workspace`**
- Analyzes **all files** in the project
- Takes 5-30 seconds depending on project size
- Useful for large projects

**When to use:**
- First time opening a project
- After updating many files
- To get comprehensive report

#### **2. `ODAVL: Clear Diagnostics`**
- Clears all ODAVL messages from Problems Panel
- Useful for a "fresh start"

#### **3. `ODAVL: Show Dashboard`**
- Opens ODAVL Dashboard
- Shows project statistics:
  - Number of issues by type
  - Most problematic files
  - Confidence scores

#### **4. `ODAVL: Export Issues`**
- Exports all issues to JSON file
- Useful for reports and sharing

#### **5. `ODAVL: Configure`**
- Opens settings page
- Customize ODAVL behavior

#### **6. `ODAVL: View Activity Log`**
- Shows ODAVL activity log
- Useful to understand what ODAVL is doing

---

## ⚙️ Step 4: Settings

### Open Settings:
```
Ctrl+, → Search "ODAVL"
```

### Important Settings:

#### **1. ODAVL: Enable Perf Metrics**
```json
"odavl.enablePerfMetrics": true
```
- **Enabled**: Shows analysis time for each file
- **Disabled**: Slightly faster (Default: enabled)

#### **2. ODAVL: Auto Open Ledger**
```json
"odavl.autoOpenLedger": true
```
- **Enabled**: Auto-opens ledger files
- **Disabled**: Won't auto-open (Default: enabled)

#### **3. ODAVL: Max Parallel Detectors**
```json
"odavl.maxParallelDetectors": 4
```
- Number of detectors running simultaneously
- **Higher** = faster but uses more memory
- **Lower** = slower but lighter on system

---

## 📊 Step 5: Understanding Results

### Message format in Problems Panel:

```
🟡 [ODAVL/security] Hardcoded API key detected
   File: src/config.ts
   Line: 42
   Confidence: 95%
```

### Issue Types (Icons):

- 🔴 **Error** → Critical issue (Critical/High)
- 🟡 **Warning** → Medium issue
- 🔵 **Info** → Information (Low)
- 💡 **Hint** → Improvement suggestion

### Sources:

- `ODAVL/typescript` → TypeScript errors
- `ODAVL/security` → Security vulnerabilities
- `ODAVL/eslint` → ESLint issues
- `ODAVL/import` → Import problems
- `ODAVL/circular` → Circular dependencies
- `ODAVL/performance` → Performance issues
- `ODAVL/complexity` → Complex code
- `ODAVL/python` → Python errors
- `ODAVL/java` → Java errors

---

## 🎓 Practical Examples

### Example 1: TypeScript Project

1. **Open VS Code** in a TypeScript project:
   ```bash
   cd your-project
   code .
   ```

2. **Open a file** (e.g., `src/index.ts`)

3. **Check Problems Panel** (`Ctrl+Shift+M`)
   - You'll see TypeScript errors
   - Security warnings
   - Import issues

4. **Click any issue** to navigate to the code

5. **Fix the issue** and save (`Ctrl+S`)
   - Issue disappears immediately if resolved

### Example 2: Python Project

1. **Open Python project**:
   ```bash
   cd python-project
   code .
   ```

2. **Open a `.py` file**:
   ```python
   # src/api.py
   import os
   
   password = "admin123"  # ❌ Warning: Hardcoded password!
   
   def query(sql):
       cursor.execute(sql)  # ❌ Warning: SQL injection risk!
   ```

3. **ODAVL will detect**:
   - Hardcoded passwords
   - SQL injection vulnerabilities
   - Type hint violations (Python 3.5+)
   - Unused imports

### Example 3: Java Project

1. **Open Java project**:
   ```bash
   cd java-project
   code .
   ```

2. **Open a `.java` file**:
   ```java
   // src/Main.java
   public class Main {
       public static void main(String[] args) {
           try {
               // code
           } catch (Exception e) {  // ❌ Warning: Generic exception!
               // empty catch
           }
       }
   }
   ```

3. **ODAVL will detect**:
   - Generic exception catching
   - Empty catch blocks
   - Unused imports
   - Stream API misuse

---

## 🧠 Step 6: ML Intelligence

### ODAVL learns from your project!

#### **Trust Score System**

- Each issue has a **confidence score** (0-100%)
- **95%+** → Almost certain
- **70-95%** → Likely correct
- **50-70%** → Possible
- **<50%** → Just a suggestion

#### **Automatic Learning**

When you fix issues, ODAVL learns:
- Which types of issues you care about
- Which frameworks you use
- Your coding patterns

**Result:** Over time, warnings become more accurate with fewer false positives! 🎯

---

## 🔧 Step 7: Troubleshooting

### Issue: "ODAVL not working"

**Solution:**
1. Verify extension is installed: `Ctrl+Shift+X` → Search "ODAVL"
2. Reload VS Code: `Ctrl+Shift+P` → "Reload Window"
3. Check Output Panel: `View → Output` → Select "ODAVL Studio"

### Issue: "No results showing"

**Solution:**
1. Open Problems Panel: `Ctrl+Shift+M`
2. Check Filter: Click "Filter" and ensure ODAVL isn't hidden
3. Run manual analysis: `Ctrl+Shift+P` → "ODAVL: Analyze Workspace"

### Issue: "ODAVL is slow"

**Solution:**
1. Reduce `maxParallelDetectors` in settings (try `2` instead of `4`)
2. Close many files in Editor
3. Exclude large folders (like `node_modules`):
   ```json
   "files.exclude": {
     "**/node_modules": true,
     "**/dist": true
   }
   ```

### Issue: "Too many false positives"

**Solution:**
1. ODAVL improves over time (learns from your actions)
2. Increase `odavl.minConfidence` in settings:
   ```json
   "odavl.minConfidence": 80
   ```
   This will hide issues with confidence <80%

---

## 🎯 Step 8: Effective Usage Tips

### 1. **Use ODAVL with Git**
```bash
# Before commit
git add .
# Open VS Code and check Problems Panel
# Fix red issues (Errors)
git commit -m "Fixed ODAVL issues"
```

### 2. **Integrate with CI/CD**
Run ODAVL in GitHub Actions:
```yaml
- name: ODAVL Analysis
  run: npx @odavl-studio/cli insight analyze
```

### 3. **Share Results with Team**
```bash
# Export issues
Ctrl+Shift+P → "ODAVL: Export Issues"
# Get JSON file for sharing
```

### 4. **Focus on High Confidence**
- Start by fixing **95%+** issues
- These are usually **real problems**
- Leave <50% issues for later review

### 5. **Use Dashboard for Statistics**
```bash
Ctrl+Shift+P → "ODAVL: Show Dashboard"
```
Gives comprehensive view:
- Most problematic files → Focus on them
- Common issue types → Fix systematically

---

## 📈 Step 9: Performance Metrics

### What to expect:

| Project Size | Full Analysis Time | Memory Used |
|-------------|-------------------|-------------|
| Small (<50 files) | 2-5 seconds | ~50 MB |
| Medium (50-500 files) | 5-30 seconds | ~150 MB |
| Large (500+ files) | 30-120 seconds | ~300 MB |

### **Note:** Automatic analysis (per file) is **instant** (<1 second)!

---

## 🎓 Step 10: Additional Resources

### **Full Documentation:**
- GitHub: https://github.com/yourusername/odavl-studio
- Marketplace: https://marketplace.visualstudio.com/items?itemName=odavl.odavl-insight-vscode

### **Support:**
- Issues: https://github.com/yourusername/odavl-studio/issues
- Discussions: https://github.com/yourusername/odavl-studio/discussions

### **Example Projects:**
```bash
# Download demo project
git clone https://github.com/yourusername/odavl-examples
cd odavl-examples
code .
```

---

## 🎉 Quick Summary

### To start immediately:

1. ✅ **Install**: `Ctrl+Shift+X` → Search "ODAVL Insight" → Install
2. ✅ **Open your project**: `File → Open Folder`
3. ✅ **View results**: `Ctrl+Shift+M` (Problems Panel)
4. ✅ **Analyze everything**: `Ctrl+Shift+P` → "ODAVL: Analyze Workspace"
5. ✅ **Fix issues**: Click any issue to navigate to code

### Essential Commands:

- `Ctrl+Shift+M` → Problems Panel
- `Ctrl+Shift+P` → Commands
- `Ctrl+,` → Settings

### That's it! 🚀

ODAVL now works automatically, analyzes your code with AI, learns from your project, and helps you write better, more secure code! 💪

---

*Last updated: November 2025 | ODAVL Insight v2.0.2*
