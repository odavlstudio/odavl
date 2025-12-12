/**
 * Asset Optimizer - ODAVL Insight
 * Detects large assets and missing optimizations
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { PerformanceErrorType } from '../performance-detector';
import { safeReadFile } from '../../utils/safe-file-reader.js';

export interface AssetIssue {
    file: string;
    line: number;
    type: PerformanceErrorType;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    pattern: string;
    suggestedFix: string;
    details?: string;
    metrics?: {
        size?: number;
        threshold?: number;
        impact?: string;
    };
}

export class AssetOptimizer {
    private readonly workspaceRoot: string;
    private readonly assetSizeThresholdKB: number;

    constructor(workspaceRoot: string, assetSizeThresholdKB = 200) {
        this.workspaceRoot = workspaceRoot;
        this.assetSizeThresholdKB = assetSizeThresholdKB;
    }

    /**
     * Detect large assets and missing optimizations
     */
    detect(file: string, content: string): AssetIssue[] {
        const issues: AssetIssue[] = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const lineNum = index + 1;

            // 1. Large image imports
            const imageImportIssue = this.detectLargeImageImport(file, line, lineNum);
            if (imageImportIssue) issues.push(imageImportIssue);

            // 2. Missing lazy loading on <img> tags
            const lazyLoadingIssue = this.detectMissingLazyLoading(file, line, lineNum);
            if (lazyLoadingIssue) issues.push(lazyLoadingIssue);

            // 3. Missing Next.js Image optimization
            const nextImageIssue = this.detectMissingNextImage(file, line, lineNum);
            if (nextImageIssue) issues.push(nextImageIssue);

            // 4. Large video files
            const videoIssue = this.detectLargeVideoFile(file, line, lineNum);
            if (videoIssue) issues.push(videoIssue);

            // 5. Uncompressed assets (SVG, JSON)
            const uncompressedIssue = this.detectUncompressedAssets(file, line, lineNum);
            if (uncompressedIssue) issues.push(uncompressedIssue);
        });

        return issues;
    }

    /**
     * Detect large image imports
     */
    private detectLargeImageImport(
        file: string,
        line: string,
        lineNum: number
    ): AssetIssue | null {
        // Pattern: import something from './image.png'
        const importMatch = line.match(/import\s+.*\s+from\s+['"]([^'"]*\.(jpg|jpeg|png|webp|gif|bmp))['"]/)
        if (!importMatch) return null;

        const imagePath = importMatch[1];
        const absolutePath = path.resolve(path.dirname(file), imagePath);

        if (!fs.existsSync(absolutePath)) return null;

        const stats = fs.statSync(absolutePath);
        const sizeKB = stats.size / 1024;

        if (sizeKB <= this.assetSizeThresholdKB) return null;

        // Calculate severity based on size
        let severity: 'critical' | 'high' | 'medium' = 'medium';
        if (sizeKB > 500) severity = 'critical'; // >500KB
        else if (sizeKB > 300) severity = 'high'; // >300KB

        // Estimate load time impact
        const loadTime3G = (sizeKB / 50).toFixed(1); // 3G: ~50KB/s
        const loadTime4G = (sizeKB / 150).toFixed(1); // 4G: ~150KB/s

        return {
            file,
            line: lineNum,
            type: PerformanceErrorType.LARGE_IMAGE_WITHOUT_OPTIMIZATION,
            severity,
            message: `Large image (${Math.round(sizeKB)}KB)`,
            pattern: line.trim(),
            suggestedFix: 'Use next/image, compress with imagemin, or convert to WebP',
            details: `Image size: ${Math.round(sizeKB)}KB (threshold: ${this.assetSizeThresholdKB}KB)`,
            metrics: {
                size: Math.round(sizeKB),
                threshold: this.assetSizeThresholdKB,
                impact: `Load time: ${loadTime3G}s (3G), ${loadTime4G}s (4G)`,
            },
        };
    }

    /**
     * Detect missing lazy loading on <img> tags
     */
    private detectMissingLazyLoading(
        file: string,
        line: string,
        lineNum: number
    ): AssetIssue | null {
        // Pattern: <img src="..." /> without loading="lazy"
        if (!/<img\s+[^>]*src=/.test(line)) return null;
        if (line.includes('loading="lazy"') || line.includes("loading='lazy'")) return null;

        // Skip if it's above the fold (first image is usually visible immediately)
        if (lineNum < 50) return null;

        return {
            file,
            line: lineNum,
            type: PerformanceErrorType.MISSING_LAZY_LOADING,
            severity: 'medium',
            message: 'Image without lazy loading',
            pattern: line.trim(),
            suggestedFix: '<img src="..." loading="lazy" />',
            details: 'Lazy loading defers offscreen images and improves initial page load',
        };
    }

    /**
     * Detect usage of <img> instead of Next.js Image component
     */
    private detectMissingNextImage(
        file: string,
        line: string,
        lineNum: number
    ): AssetIssue | null {
        // Only check Next.js projects (TSX/JSX files)
        if (!/\.(tsx|jsx)$/.test(file)) return null;

        // Pattern: <img src="..." /> in a React component
        if (!/<img\s+[^>]*src=/.test(line)) return null;

        // Skip if already using next/image
        if (line.includes('<Image ')) return null;

        // Check if file imports next/image (already optimized)
        const fileDir = path.dirname(file);
        const fileContent = safeReadFile(file);
        if (fileContent && fileContent.includes('next/image')) return null;

        return {
            file,
            line: lineNum,
            type: PerformanceErrorType.LARGE_IMAGE_WITHOUT_OPTIMIZATION,
            severity: 'low',
            message: 'Using <img> instead of Next.js Image',
            pattern: line.trim(),
            suggestedFix: 'import Image from "next/image"; <Image src="..." width={} height={} />',
            details: 'Next.js Image provides automatic optimization, lazy loading, and responsive images',
        };
    }

    /**
     * Detect large video files
     */
    private detectLargeVideoFile(
        file: string,
        line: string,
        lineNum: number
    ): AssetIssue | null {
        // Pattern: <video> or import of video files
        const videoMatch = line.match(/(?:import\s+.*\s+from\s+['"]([^'"]*\.(mp4|webm|mov|avi))['"]|<video\s+[^>]*src=['"]([^'"]+)['"])/)
        if (!videoMatch) return null;

        const videoPath = videoMatch[1] || videoMatch[3];
        if (!videoPath) return null;

        const absolutePath = path.resolve(path.dirname(file), videoPath);
        if (!fs.existsSync(absolutePath)) return null;

        const stats = fs.statSync(absolutePath);
        const sizeMB = stats.size / (1024 * 1024);

        // Only flag if video is >5MB
        if (sizeMB <= 5) return null;

        let severity: 'critical' | 'high' | 'medium' = 'medium';
        if (sizeMB > 20) severity = 'critical'; // >20MB
        else if (sizeMB > 10) severity = 'high'; // >10MB

        return {
            file,
            line: lineNum,
            type: PerformanceErrorType.UNCOMPRESSED_ASSET,
            severity,
            message: `Large video file (${sizeMB.toFixed(1)}MB)`,
            pattern: line.trim(),
            suggestedFix: 'Compress with HandBrake, use streaming service (YouTube, Vimeo), or load on-demand',
            details: `Video size: ${sizeMB.toFixed(1)}MB. Consider using a CDN or video hosting service.`,
            metrics: {
                size: Math.round(sizeMB * 1024), // Convert to KB
                threshold: 5 * 1024, // 5MB threshold
            },
        };
    }

    /**
     * Detect uncompressed assets (large SVG, JSON)
     */
    private detectUncompressedAssets(
        file: string,
        line: string,
        lineNum: number
    ): AssetIssue | null {
        // Pattern: import of SVG or JSON files
        const assetMatch = line.match(/import\s+.*\s+from\s+['"]([^'"]*\.(svg|json))['"]/)
        if (!assetMatch) return null;

        const assetPath = assetMatch[1];
        const assetType = assetMatch[2];
        const absolutePath = path.resolve(path.dirname(file), assetPath);

        if (!fs.existsSync(absolutePath)) return null;

        const stats = fs.statSync(absolutePath);
        const sizeKB = stats.size / 1024;

        // SVG: flag if >50KB, JSON: flag if >100KB
        const threshold = assetType === 'svg' ? 50 : 100;
        if (sizeKB <= threshold) return null;

        return {
            file,
            line: lineNum,
            type: PerformanceErrorType.UNCOMPRESSED_ASSET,
            severity: 'medium',
            message: `Large ${assetType.toUpperCase()} file (${Math.round(sizeKB)}KB)`,
            pattern: line.trim(),
            suggestedFix: assetType === 'svg' 
                ? 'Minify with SVGO or convert complex SVGs to PNG/WebP'
                : 'Minify JSON or load via API',
            details: `${assetType.toUpperCase()} size: ${Math.round(sizeKB)}KB (threshold: ${threshold}KB)`,
            metrics: {
                size: Math.round(sizeKB),
                threshold,
            },
        };
    }

    /**
     * Detect missing font optimization
     */
    detectFontOptimizations(file: string, content: string): AssetIssue[] {
        const issues: AssetIssue[] = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const lineNum = index + 1;

            // Pattern: @font-face without font-display
            if (/@font-face\s*{/.test(line)) {
                // Check next 10 lines for font-display property
                const nextLines = lines.slice(index, index + 10).join('\n');
                if (!nextLines.includes('font-display:')) {
                    issues.push({
                        file,
                        line: lineNum,
                        type: PerformanceErrorType.UNCOMPRESSED_ASSET,
                        severity: 'low',
                        message: 'Missing font-display property',
                        pattern: line.trim(),
                        suggestedFix: 'Add font-display: swap; to @font-face',
                        details: 'Prevents invisible text during font loading (FOIT)',
                    });
                }
            }

            // Pattern: Google Fonts without display=swap
            if (/fonts\.googleapis\.com/.test(line) && !line.includes('display=swap')) {
                issues.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.UNCOMPRESSED_ASSET,
                    severity: 'low',
                    message: 'Google Fonts without display=swap',
                    pattern: line.trim(),
                    suggestedFix: 'Add &display=swap to Google Fonts URL',
                    details: 'Improves perceived performance during font loading',
                });
            }
        });

        return issues;
    }
}
