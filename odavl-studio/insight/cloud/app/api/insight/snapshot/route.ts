import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma-minimal";
import { getRequiredEnv } from "@/lib/env";

// ZCC Validation Schema (NO source code allowed)
const SnapshotSchema = z.object({
  projectName: z.string().min(1).max(255),
  repoUrl: z.string().url().optional(),
  
  // Counts Only
  totalFiles: z.number().int().nonnegative(),
  filesAnalyzed: z.number().int().nonnegative(),
  totalIssues: z.number().int().nonnegative(),
  criticalCount: z.number().int().nonnegative(),
  highCount: z.number().int().nonnegative(),
  mediumCount: z.number().int().nonnegative(),
  lowCount: z.number().int().nonnegative(),
  infoCount: z.number().int().nonnegative(),
  
  // Risk Score
  riskScore: z.number().min(0).max(100),
  
  // Detector Metadata (names only)
  detectorsUsed: z.array(z.string()),
  
  // Timing
  analysisTimeMs: z.number().int().positive(),
  
  // Environment Fingerprint
  environment: z.object({
    os: z.string(),
    nodeVersion: z.string(),
    cliVersion: z.string(),
  }),
});

// ZCC Compliance Check: Reject any fields that might contain source code
const FORBIDDEN_FIELDS = [
  'code', 'snippet', 'source', 'content', 'file', 'path',
  'line', 'column', 'message', 'description', 'details',
  'issues', 'errors', 'warnings', 'suggestions', 'fixes'
];

const env = getRequiredEnv();
const INGEST_API_KEY = env.ingestApiKey;
const INGEST_USER_EMAIL = env.ingestUserEmail;

function extractApiKey(req: NextRequest): string | null {
  const headerKey = req.headers.get("x-api-key");
  if (headerKey) return headerKey.trim();

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return authHeader.trim();
}

function validateZCC(data: any): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  function checkObject(obj: any, prefix = '') {
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      // Check if key name suggests code content
      if (FORBIDDEN_FIELDS.some(forbidden => lowerKey.includes(forbidden))) {
        violations.push(`Forbidden field: ${fullKey}`);
      }
      
      // Recursively check nested objects
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        checkObject(obj[key], fullKey);
      }
      
      // Check string values for code-like patterns
      if (typeof obj[key] === 'string' && obj[key].length > 200) {
        // Long strings might be code
        violations.push(`Suspiciously long string in field: ${fullKey}`);
      }
    }
  }
  
  checkObject(data);
  return { valid: violations.length === 0, violations };
}

function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication via static API key (no OAuth required for ingest)
    if (!INGEST_API_KEY) {
      return NextResponse.json(
        { error: "Missing INGEST_API_KEY env var" },
        { status: 500 }
      );
    }

    const providedKey = extractApiKey(req);
    if (!providedKey || providedKey !== INGEST_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // 2. Parse Request Body
    const body = await req.json();
    
    // 3. ZCC Compliance Check
    const zccCheck = validateZCC(body);
    if (!zccCheck.valid) {
      return NextResponse.json(
        { 
          error: "ZCC Violation: Source code detected",
          violations: zccCheck.violations,
          message: "This endpoint only accepts metadata. Source code, file paths, and error details are not allowed."
        },
        { status: 400 }
      );
    }
    
    // 4. Validate Schema
    const data = SnapshotSchema.parse(body);
    
    // 5. Get or create ingest user
    const user = await prisma.user.upsert({
      where: { email: INGEST_USER_EMAIL },
      update: {},
      create: {
        email: INGEST_USER_EMAIL,
        name: "Ingest Service",
      },
    });
    
    // 6. Generate Fingerprints (Hashes Only)
    const repoHash = data.repoUrl ? hashString(data.repoUrl) : null;
    const detectorHash = hashString(JSON.stringify(data.detectorsUsed.sort()));
    const envHash = hashString(JSON.stringify(data.environment));
    
    // 7. Get or Create Project
    let project = await prisma.project.findFirst({
      where: {
        userId: user.id,
        ...(repoHash ? { repoHash } : { name: data.projectName }),
      },
    });
    
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: data.projectName,
          userId: user.id,
          repoHash,
        },
      });
    }
    
    // 8. Create Snapshot
    const snapshot = await prisma.insightSnapshot.create({
      data: {
        projectId: project.id,
        userId: user.id,
        totalFiles: data.totalFiles,
        filesAnalyzed: data.filesAnalyzed,
        totalIssues: data.totalIssues,
        criticalCount: data.criticalCount,
        highCount: data.highCount,
        mediumCount: data.mediumCount,
        lowCount: data.lowCount,
        infoCount: data.infoCount,
        riskScore: data.riskScore,
        detectorsUsed: JSON.stringify(data.detectorsUsed),
        analysisTimeMs: data.analysisTimeMs,
        detectorHash,
        envHash,
      },
    });
    
    // 9. Return Success
    return NextResponse.json({
      success: true,
      snapshotId: snapshot.id,
      projectId: project.id,
      message: "Snapshot stored successfully (ZCC compliant)",
    });
    
  } catch (error: any) {
    console.error("Snapshot API Error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
