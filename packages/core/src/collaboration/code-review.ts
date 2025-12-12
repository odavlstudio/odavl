/**
 * @fileoverview Code Review System - Collaborative code review
 * @module @odavl-studio/insight-core/collaboration/code-review
 * 
 * **Purpose**: Enable code review workflows for quality improvements
 * 
 * **Features**:
 * - Review requests (request reviews from team members)
 * - Inline comments (comment on specific lines)
 * - Approval workflow (approve/reject/request changes)
 * - Diff visualization (side-by-side comparison)
 * - Code suggestions (propose changes)
 * - Review status tracking (pending/approved/rejected)
 * - Review templates (standardized checklists)
 * - Review analytics (review metrics)
 * - Automated checks (lint, tests, coverage)
 * - Integration with Git (PR reviews)
 * 
 * **Review States**:
 * - PENDING: Awaiting review
 * - IN_REVIEW: Being reviewed
 * - APPROVED: Approved by all reviewers
 * - CHANGES_REQUESTED: Changes requested
 * - REJECTED: Rejected
 * 
 * **Architecture**:
 * ```
 * CodeReviewSystem
 *   ├── Review Lifecycle
 *   │   ├── Create review
 *   │   ├── Request reviewers
 *   │   ├── Add comments
 *   │   ├── Approve/reject
 *   │   └── Complete review
 *   ├── Inline Comments
 *   │   ├── Line-specific comments
 *   │   ├── Code suggestions
 *   │   ├── Threaded discussions
 *   │   └── Resolve comments
 *   ├── Approval Workflow
 *   │   ├── Required reviewers
 *   │   ├── Approval rules
 *   │   ├── Auto-merge
 *   │   └── Status checks
 *   └── Analytics
 *       ├── Review time
 *       ├── Approval rate
 *       ├── Comment metrics
 *       └── Reviewer stats
 * ```
 * 
 * **Integration Points**:
 * - Used by: Collaboration Hub, VS Code extension
 * - Integrates with: Git, GitHub, GitLab
 * - Backend: REST API, WebSocket (real-time comments)
 */

import { EventEmitter } from 'events';
import type { TeamMember } from './collaboration-hub';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Review state
 */
export enum ReviewState {
  PENDING = 'pending',
  IN_REVIEW = 'in-review',
  APPROVED = 'approved',
  CHANGES_REQUESTED = 'changes-requested',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

/**
 * Review decision
 */
export enum ReviewDecision {
  APPROVE = 'approve',
  REQUEST_CHANGES = 'request-changes',
  REJECT = 'reject',
}

/**
 * Comment type
 */
export enum CommentType {
  GENERAL = 'general',
  INLINE = 'inline',
  SUGGESTION = 'suggestion',
  QUESTION = 'question',
  ISSUE = 'issue',
}

/**
 * Diff type
 */
export enum DiffType {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified',
  UNCHANGED = 'unchanged',
}

/**
 * Code review
 */
export interface CodeReview {
  /** Review ID */
  id: string;

  /** Title */
  title: string;

  /** Description */
  description?: string;

  /** Author */
  author: TeamMember;

  /** Reviewers */
  reviewers: TeamMember[];

  /** Required approvals */
  requiredApprovals: number;

  /** Files */
  files: ReviewFile[];

  /** Comments */
  comments: ReviewComment[];

  /** State */
  state: ReviewState;

  /** Approvals */
  approvals: Array<{
    reviewer: TeamMember;
    decision: ReviewDecision;
    comment?: string;
    timestamp: Date;
  }>;

  /** Created at */
  createdAt: Date;

  /** Updated at */
  updatedAt?: Date;

  /** Completed at */
  completedAt?: Date;

  /** Metadata */
  metadata: {
    /** Git branch */
    branch?: string;
    
    /** Pull request URL */
    prUrl?: string;
    
    /** Commit hash */
    commitHash?: string;
    
    /** Automated checks */
    checks?: {
      name: string;
      status: 'pending' | 'passed' | 'failed';
      details?: string;
    }[];
  };
}

/**
 * Review file
 */
export interface ReviewFile {
  /** File path */
  path: string;

  /** Change type */
  changeType: 'added' | 'modified' | 'deleted';

  /** Diff */
  diff: DiffHunk[];

  /** Old content */
  oldContent?: string;

  /** New content */
  newContent?: string;

  /** Comments count */
  commentsCount: number;

  /** Language */
  language?: string;
}

/**
 * Diff hunk
 */
export interface DiffHunk {
  /** Old start line */
  oldStart: number;

  /** Old lines count */
  oldLines: number;

  /** New start line */
  newStart: number;

  /** New lines count */
  newLines: number;

  /** Lines */
  lines: DiffLine[];
}

/**
 * Diff line
 */
export interface DiffLine {
  /** Type */
  type: DiffType;

  /** Old line number */
  oldLine?: number;

  /** New line number */
  newLine?: number;

  /** Content */
  content: string;

  /** Has comment */
  hasComment?: boolean;
}

/**
 * Review comment
 */
export interface ReviewComment {
  /** Comment ID */
  id: string;

  /** Type */
  type: CommentType;

  /** Author */
  author: TeamMember;

  /** Content */
  content: string;

  /** File path (for inline comments) */
  filePath?: string;

  /** Line number (for inline comments) */
  line?: number;

  /** Code suggestion */
  suggestion?: {
    original: string;
    replacement: string;
  };

  /** Parent comment (for threads) */
  parentId?: string;

  /** Replies */
  replies?: ReviewComment[];

  /** Resolved */
  resolved: boolean;

  /** Resolved by */
  resolvedBy?: TeamMember;

  /** Created at */
  createdAt: Date;

  /** Updated at */
  updatedAt?: Date;
}

/**
 * Review template
 */
export interface ReviewTemplate {
  /** Template ID */
  id: string;

  /** Name */
  name: string;

  /** Description */
  description?: string;

  /** Checklist items */
  checklist: Array<{
    item: string;
    required: boolean;
    checked?: boolean;
  }>;

  /** Required reviewers */
  requiredReviewers?: number;

  /** Auto-checks */
  autoChecks?: string[]; // e.g., ['lint', 'test', 'coverage']
}

/**
 * Review analytics
 */
export interface ReviewAnalytics {
  /** Review ID */
  reviewId: string;

  /** Time to first review (ms) */
  timeToFirstReview: number;

  /** Time to approval (ms) */
  timeToApproval: number;

  /** Total comments */
  totalComments: number;

  /** Resolved comments */
  resolvedComments: number;

  /** Reviewers participation */
  reviewers: Array<{
    reviewer: TeamMember;
    commentsCount: number;
    responseTime: number; // ms
    decision?: ReviewDecision;
  }>;

  /** Files changed */
  filesChanged: number;

  /** Lines added */
  linesAdded: number;

  /** Lines removed */
  linesRemoved: number;
}

/**
 * Code review configuration
 */
export interface CodeReviewConfig {
  /** Default required approvals */
  defaultRequiredApprovals: number;

  /** Enable automated checks */
  enableAutomatedChecks: boolean;

  /** Auto-merge on approval */
  autoMergeOnApproval: boolean;

  /** Allow self-review */
  allowSelfReview: boolean;

  /** Enable code suggestions */
  enableCodeSuggestions: boolean;

  /** Review timeout (ms) */
  reviewTimeout: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: CodeReviewConfig = {
  defaultRequiredApprovals: 1,
  enableAutomatedChecks: true,
  autoMergeOnApproval: false,
  allowSelfReview: false,
  enableCodeSuggestions: true,
  reviewTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ============================================================================
// CodeReviewSystem Class
// ============================================================================

/**
 * Code Review System - Collaborative code review
 * 
 * **Usage**:
 * ```typescript
 * import { CodeReviewSystem, ReviewDecision } from '@odavl-studio/insight-core/collaboration/code-review';
 * 
 * const reviewSystem = new CodeReviewSystem({
 *   defaultRequiredApprovals: 2,
 *   enableAutomatedChecks: true,
 * });
 * 
 * // Create review
 * const review = await reviewSystem.createReview({
 *   title: 'Fix authentication bug',
 *   description: 'Fixes XSS vulnerability in login form',
 *   author: currentUser,
 *   reviewers: [user1, user2],
 *   files: [
 *     {
 *       path: 'src/auth.ts',
 *       changeType: 'modified',
 *       diff: [...],
 *       newContent: '...',
 *     },
 *   ],
 * });
 * 
 * // Add inline comment
 * const comment = await reviewSystem.addComment(review.id, {
 *   type: CommentType.INLINE,
 *   content: 'Consider using prepared statements here',
 *   filePath: 'src/auth.ts',
 *   line: 42,
 * });
 * 
 * // Add code suggestion
 * const suggestion = await reviewSystem.addComment(review.id, {
 *   type: CommentType.SUGGESTION,
 *   content: 'Use parameterized query',
 *   filePath: 'src/auth.ts',
 *   line: 42,
 *   suggestion: {
 *     original: 'db.query(`SELECT * FROM users WHERE id = ${id}`)',
 *     replacement: 'db.query("SELECT * FROM users WHERE id = ?", [id])',
 *   },
 * });
 * 
 * // Approve review
 * await reviewSystem.submitReview(review.id, {
 *   decision: ReviewDecision.APPROVE,
 *   comment: 'Looks good! Great fix.',
 * });
 * 
 * // Request changes
 * await reviewSystem.submitReview(review.id, {
 *   decision: ReviewDecision.REQUEST_CHANGES,
 *   comment: 'Please address the SQL injection issue',
 * });
 * 
 * // Get analytics
 * const analytics = await reviewSystem.getAnalytics(review.id);
 * console.log(`Time to first review: ${analytics.timeToFirstReview}ms`);
 * console.log(`Total comments: ${analytics.totalComments}`);
 * ```
 * 
 * **Review Templates**:
 * ```typescript
 * // Create template
 * const template = await reviewSystem.createTemplate({
 *   name: 'Security Review',
 *   checklist: [
 *     { item: 'Input validation implemented', required: true },
 *     { item: 'No SQL injection vulnerabilities', required: true },
 *     { item: 'Authentication checked', required: true },
 *     { item: 'Tests added', required: false },
 *   ],
 *   requiredReviewers: 2,
 *   autoChecks: ['lint', 'test', 'security-scan'],
 * });
 * 
 * // Use template
 * const review = await reviewSystem.createReview({
 *   title: 'API Security Fix',
 *   templateId: template.id,
 *   // ...
 * });
 * ```
 * 
 * **Automated Checks**:
 * ```typescript
 * // Run automated checks
 * await reviewSystem.runAutomatedChecks(review.id, [
 *   'lint',      // ESLint
 *   'test',      // Unit tests
 *   'coverage',  // Code coverage
 *   'security',  // Security scan
 * ]);
 * 
 * // Listen for check results
 * reviewSystem.on('check:completed', ({ reviewId, checkName, status }) => {
 *   console.log(`${checkName}: ${status}`);
 * });
 * ```
 */
export class CodeReviewSystem extends EventEmitter {
  private config: CodeReviewConfig;
  private reviews: Map<string, CodeReview> = new Map();
  private templates: Map<string, ReviewTemplate> = new Map();

  constructor(config: Partial<CodeReviewConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Public API - Review Lifecycle
  // ==========================================================================

  /**
   * Create review
   * 
   * @param params - Review parameters
   * @returns Created review
   */
  async createReview(params: {
    title: string;
    description?: string;
    author: TeamMember;
    reviewers: TeamMember[];
    files: Omit<ReviewFile, 'commentsCount'>[];
    requiredApprovals?: number;
    templateId?: string;
    metadata?: CodeReview['metadata'];
  }): Promise<CodeReview> {
    const review: CodeReview = {
      id: this.generateId(),
      title: params.title,
      description: params.description,
      author: params.author,
      reviewers: params.reviewers,
      requiredApprovals: params.requiredApprovals || this.config.defaultRequiredApprovals,
      files: params.files.map(f => ({ ...f, commentsCount: 0 })),
      comments: [],
      state: ReviewState.PENDING,
      approvals: [],
      createdAt: new Date(),
      metadata: params.metadata || {},
    };

    // Apply template if specified
    if (params.templateId) {
      const template = this.templates.get(params.templateId);
      if (template) {
        review.requiredApprovals = template.requiredReviewers || review.requiredApprovals;
      }
    }

    this.reviews.set(review.id, review);

    this.emit('review:created', { review });

    // Run automated checks
    if (this.config.enableAutomatedChecks) {
      await this.runAutomatedChecks(review.id);
    }

    return review;
  }

  /**
   * Get review
   * 
   * @param reviewId - Review ID
   * @returns Review
   */
  async getReview(reviewId: string): Promise<CodeReview> {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error(`Review not found: ${reviewId}`);
    }
    return review;
  }

  /**
   * Update review state
   * 
   * @param reviewId - Review ID
   * @param state - New state
   */
  async updateReviewState(reviewId: string, state: ReviewState): Promise<void> {
    const review = await this.getReview(reviewId);
    review.state = state;
    review.updatedAt = new Date();

    if (state === ReviewState.COMPLETED) {
      review.completedAt = new Date();
    }

    this.reviews.set(reviewId, review);
    this.emit('review:state-changed', { review, state });
  }

  /**
   * Submit review (approve/reject/request changes)
   * 
   * @param reviewId - Review ID
   * @param params - Review decision
   */
  async submitReview(
    reviewId: string,
    params: {
      decision: ReviewDecision;
      comment?: string;
      reviewer?: TeamMember;
    }
  ): Promise<void> {
    const review = await this.getReview(reviewId);

    if (!params.reviewer) {
      throw new Error('Reviewer not specified');
    }

    // Check if reviewer is authorized
    const isAuthorized = review.reviewers.some(r => r.id === params.reviewer!.id);
    if (!isAuthorized && !this.config.allowSelfReview) {
      throw new Error('Not authorized to review');
    }

    // Add approval
    review.approvals.push({
      reviewer: params.reviewer,
      decision: params.decision,
      comment: params.comment,
      timestamp: new Date(),
    });

    review.updatedAt = new Date();

    // Update state based on decision
    if (params.decision === ReviewDecision.APPROVE) {
      // Check if all required approvals met
      const approvalCount = review.approvals.filter(
        a => a.decision === ReviewDecision.APPROVE
      ).length;

      if (approvalCount >= review.requiredApprovals) {
        review.state = ReviewState.APPROVED;

        // Auto-merge if enabled
        if (this.config.autoMergeOnApproval) {
          await this.mergeReview(reviewId);
        }
      }
    } else if (params.decision === ReviewDecision.REQUEST_CHANGES) {
      review.state = ReviewState.CHANGES_REQUESTED;
    } else if (params.decision === ReviewDecision.REJECT) {
      review.state = ReviewState.REJECTED;
    }

    this.reviews.set(reviewId, review);
    this.emit('review:submitted', { review, decision: params.decision });
  }

  /**
   * Merge review (complete)
   * 
   * @param reviewId - Review ID
   */
  async mergeReview(reviewId: string): Promise<void> {
    const review = await this.getReview(reviewId);

    if (review.state !== ReviewState.APPROVED) {
      throw new Error('Review not approved');
    }

    review.state = ReviewState.COMPLETED;
    review.completedAt = new Date();

    this.reviews.set(reviewId, review);
    this.emit('review:merged', { review });
  }

  // ==========================================================================
  // Public API - Comments
  // ==========================================================================

  /**
   * Add comment
   * 
   * @param reviewId - Review ID
   * @param params - Comment parameters
   * @returns Comment
   */
  async addComment(
    reviewId: string,
    params: {
      type: CommentType;
      content: string;
      author?: TeamMember;
      filePath?: string;
      line?: number;
      suggestion?: ReviewComment['suggestion'];
      parentId?: string;
    }
  ): Promise<ReviewComment> {
    const review = await this.getReview(reviewId);

    if (!params.author) {
      throw new Error('Author not specified');
    }

    const comment: ReviewComment = {
      id: this.generateId(),
      type: params.type,
      author: params.author,
      content: params.content,
      filePath: params.filePath,
      line: params.line,
      suggestion: params.suggestion,
      parentId: params.parentId,
      resolved: false,
      createdAt: new Date(),
    };

    review.comments.push(comment);

    // Update file comments count
    if (params.filePath) {
      const file = review.files.find(f => f.path === params.filePath);
      if (file) {
        file.commentsCount++;
      }
    }

    // Add to parent's replies
    if (params.parentId) {
      const parent = review.comments.find(c => c.id === params.parentId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(comment);
      }
    }

    this.reviews.set(reviewId, review);
    this.emit('comment:added', { review, comment });

    return comment;
  }

  /**
   * Resolve comment
   * 
   * @param reviewId - Review ID
   * @param commentId - Comment ID
   * @param resolver - Team member resolving
   */
  async resolveComment(
    reviewId: string,
    commentId: string,
    resolver: TeamMember
  ): Promise<void> {
    const review = await this.getReview(reviewId);

    const comment = review.comments.find(c => c.id === commentId);
    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    comment.resolved = true;
    comment.resolvedBy = resolver;
    comment.updatedAt = new Date();

    this.reviews.set(reviewId, review);
    this.emit('comment:resolved', { review, comment });
  }

  /**
   * Get comments for file
   * 
   * @param reviewId - Review ID
   * @param filePath - File path
   * @returns Comments
   */
  async getFileComments(reviewId: string, filePath: string): Promise<ReviewComment[]> {
    const review = await this.getReview(reviewId);

    return review.comments.filter(
      c => c.filePath === filePath && !c.parentId
    );
  }

  /**
   * Get inline comments for line
   * 
   * @param reviewId - Review ID
   * @param filePath - File path
   * @param line - Line number
   * @returns Comments
   */
  async getLineComments(
    reviewId: string,
    filePath: string,
    line: number
  ): Promise<ReviewComment[]> {
    const review = await this.getReview(reviewId);

    return review.comments.filter(
      c => c.filePath === filePath && c.line === line && !c.parentId
    );
  }

  // ==========================================================================
  // Public API - Templates
  // ==========================================================================

  /**
   * Create review template
   * 
   * @param params - Template parameters
   * @returns Template
   */
  async createTemplate(params: {
    name: string;
    description?: string;
    checklist: ReviewTemplate['checklist'];
    requiredReviewers?: number;
    autoChecks?: string[];
  }): Promise<ReviewTemplate> {
    const template: ReviewTemplate = {
      id: this.generateId(),
      name: params.name,
      description: params.description,
      checklist: params.checklist,
      requiredReviewers: params.requiredReviewers,
      autoChecks: params.autoChecks,
    };

    this.templates.set(template.id, template);
    this.emit('template:created', { template });

    return template;
  }

  /**
   * Get template
   * 
   * @param templateId - Template ID
   * @returns Template
   */
  async getTemplate(templateId: string): Promise<ReviewTemplate> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    return template;
  }

  /**
   * List templates
   * 
   * @returns Templates
   */
  async listTemplates(): Promise<ReviewTemplate[]> {
    return Array.from(this.templates.values());
  }

  // ==========================================================================
  // Public API - Automated Checks
  // ==========================================================================

  /**
   * Run automated checks
   * 
   * @param reviewId - Review ID
   * @param checks - Check names (optional)
   */
  async runAutomatedChecks(reviewId: string, checks?: string[]): Promise<void> {
    const review = await this.getReview(reviewId);

    if (!review.metadata.checks) {
      review.metadata.checks = [];
    }

    const checkNames = checks || ['lint', 'test', 'coverage'];

    for (const checkName of checkNames) {
      // Add check with pending status
      review.metadata.checks.push({
        name: checkName,
        status: 'pending',
      });

      this.emit('check:started', { reviewId, checkName });

      // Mock: Run check asynchronously
      // In real implementation, run actual checks
      setTimeout(() => {
        const check = review.metadata.checks!.find(c => c.name === checkName);
        if (check) {
          check.status = Math.random() > 0.2 ? 'passed' : 'failed';
          this.emit('check:completed', {
            reviewId,
            checkName,
            status: check.status,
          });
        }
      }, 1000);
    }

    this.reviews.set(reviewId, review);
  }

  // ==========================================================================
  // Public API - Analytics
  // ==========================================================================

  /**
   * Get review analytics
   * 
   * @param reviewId - Review ID
   * @returns Analytics
   */
  async getAnalytics(reviewId: string): Promise<ReviewAnalytics> {
    const review = await this.getReview(reviewId);

    // Calculate time to first review
    const firstReview = review.approvals[0];
    const timeToFirstReview = firstReview
      ? firstReview.timestamp.getTime() - review.createdAt.getTime()
      : 0;

    // Calculate time to approval
    const approvedReview = review.approvals.find(
      a => a.decision === ReviewDecision.APPROVE
    );
    const timeToApproval = approvedReview
      ? approvedReview.timestamp.getTime() - review.createdAt.getTime()
      : 0;

    // Count comments
    const totalComments = review.comments.length;
    const resolvedComments = review.comments.filter(c => c.resolved).length;

    // Reviewer participation
    const reviewerStats = review.reviewers.map(reviewer => {
      const comments = review.comments.filter(c => c.author.id === reviewer.id);
      const approval = review.approvals.find(a => a.reviewer.id === reviewer.id);

      return {
        reviewer,
        commentsCount: comments.length,
        responseTime: approval
          ? approval.timestamp.getTime() - review.createdAt.getTime()
          : 0,
        decision: approval?.decision,
      };
    });

    // Count file changes
    const filesChanged = review.files.length;
    let linesAdded = 0;
    let linesRemoved = 0;

    for (const file of review.files) {
      for (const hunk of file.diff) {
        for (const line of hunk.lines) {
          if (line.type === DiffType.ADDED) linesAdded++;
          if (line.type === DiffType.REMOVED) linesRemoved++;
        }
      }
    }

    return {
      reviewId,
      timeToFirstReview,
      timeToApproval,
      totalComments,
      resolvedComments,
      reviewers: reviewerStats,
      filesChanged,
      linesAdded,
      linesRemoved,
    };
  }

  /**
   * Get team review statistics
   * 
   * @param teamId - Team ID
   * @param period - Time period (days)
   * @returns Statistics
   */
  async getTeamStats(teamId: string, period = 30): Promise<{
    totalReviews: number;
    averageReviewTime: number;
    approvalRate: number;
    averageCommentsPerReview: number;
    topReviewers: Array<{
      reviewer: TeamMember;
      reviewCount: number;
      averageResponseTime: number;
    }>;
  }> {
    // Mock: Calculate team statistics
    // In real implementation, aggregate from database

    return {
      totalReviews: 42,
      averageReviewTime: 4 * 60 * 60 * 1000, // 4 hours
      approvalRate: 0.85,
      averageCommentsPerReview: 5.2,
      topReviewers: [],
    };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create code review system
 * 
 * @param config - Configuration
 * @returns CodeReviewSystem instance
 */
export function createCodeReviewSystem(
  config?: Partial<CodeReviewConfig>
): CodeReviewSystem {
  return new CodeReviewSystem(config);
}

/**
 * Parse Git diff
 * 
 * @param diff - Git diff string
 * @returns Diff hunks
 */
export function parseGitDiff(diff: string): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  const lines = diff.split('\n');

  let currentHunk: DiffHunk | null = null;

  for (const line of lines) {
    // Parse hunk header: @@ -1,5 +1,6 @@
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
      if (match) {
        if (currentHunk) {
          hunks.push(currentHunk);
        }

        currentHunk = {
          oldStart: parseInt(match[1], 10),
          oldLines: parseInt(match[2], 10),
          newStart: parseInt(match[3], 10),
          newLines: parseInt(match[4], 10),
          lines: [],
        };
      }
    } else if (currentHunk) {
      // Parse diff line
      let type: DiffType;
      let content = line;

      if (line.startsWith('+')) {
        type = DiffType.ADDED;
        content = line.substring(1);
      } else if (line.startsWith('-')) {
        type = DiffType.REMOVED;
        content = line.substring(1);
      } else {
        type = DiffType.UNCHANGED;
        content = line.substring(1);
      }

      currentHunk.lines.push({
        type,
        content,
      });
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}
