// TypeScript Security & Performance Issues for Screenshot Demo

// ❌ SECURITY: Hardcoded API key
const API_KEY = "sk-1234567890abcdefghijklmnopqrstuvwxyz";
const DATABASE_PASSWORD = "admin123";

// ❌ NETWORK: Missing timeout on fetch
async function fetchUserData(userId: string) {
  const response = await fetch(`https://api.example.com/users/${userId}`);
  return response.json();
}

// ❌ PERFORMANCE: Potential memory leak - event listener not removed
export class EventManager {
  private handlers: Map<string, Function> = new Map();

  addHandler(event: string, handler: Function) {
    this.handlers.set(event, handler);
    window.addEventListener(event, handler as EventListener);
    // Missing cleanup in destructor
  }
}

// ❌ COMPLEXITY: High cyclomatic complexity (42)
function processUserPermissions(
  user: any, // ❌ TYPE: Using 'any' instead of proper type
  role: any,
  permissions: any
) {
  if (user) {
    if (user.isActive) {
      if (role) {
        if (role.level > 0) {
          if (permissions) {
            if (permissions.canRead) {
              if (permissions.canWrite) {
                if (permissions.canDelete) {
                  if (user.age > 18) {
                    if (user.verified) {
                      if (user.email) {
                        if (user.phone) {
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
    }
  }
  return "No Access";
}

// ❌ SECURITY: SQL Injection vulnerability
function getUserById(id: string) {
  const query = `SELECT * FROM users WHERE id = ${id}`;
  // Direct string interpolation in SQL query
  return database.execute(query);
}

// ❌ PERFORMANCE: Synchronous operation in async context
async function loadConfig() {
  const fs = require("fs");
  const config = fs.readFileSync("config.json", "utf8"); // Should use async
  return JSON.parse(config);
}

// ❌ SECURITY: XSS vulnerability
function displayUserInput(input: string) {
  document.getElementById("output")!.innerHTML = input;
  // Direct HTML injection without sanitization
}

// ❌ ISOLATION: Tight coupling between modules
class UserService {
  private db = new Database(); // Direct instantiation
  private logger = new Logger(); // Should use dependency injection
  private cache = new Cache();

  async getUser(id: string) {
    this.logger.log("Fetching user");
    return this.db.query(`SELECT * FROM users WHERE id = '${id}'`);
  }
}

// ❌ CIRCULAR DEPENDENCY: This file imports from file that imports this
import { helperFunction } from "./helper";

declare const database: any;
declare const window: any;
declare class Database {}
declare class Logger {}
declare class Cache {}
