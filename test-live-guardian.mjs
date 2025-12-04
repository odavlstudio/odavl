#!/usr/bin/env node
/**
 * Guardian Live Demo - Test Real Website
 * This script demonstrates Guardian detecting white-screen and other issues
 */

import { WhiteScreenDetector } from '@odavl-studio/guardian-core';
import { BrowserManager } from '@odavl-studio/guardian-core';

async function testWebsite(url) {
    console.log('\n🎯 ODAVL Guardian - Live Website Test\n');
    console.log('=' .repeat(60));
    console.log(`\n🌐 Testing: ${url}`);
    console.log('⏳ Starting browser and detectors...\n');

    const browserManager = new BrowserManager();
    
    try {
        // Initialize browser
        await browserManager.initialize();
        const page = await browserManager.createPage();
        
        console.log('✅ Browser initialized');
        console.log('🔍 Running white-screen detector...\n');
        
        // Run white-screen detector
        const detector = new WhiteScreenDetector();
        const issues = await detector.detect(url, page);
        
        // Display results
        console.log('=' .repeat(60));
        console.log('\n📊 DETECTION RESULTS:\n');
        
        if (issues.length === 0) {
            console.log('✅ NO ISSUES FOUND! Website is working perfectly!');
        } else {
            console.log(`⚠️  FOUND ${issues.length} ISSUE(S):\n`);
            
            issues.forEach((issue, index) => {
                console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
                console.log(`   📝 ${issue.message}`);
                console.log(`   📍 Location: ${issue.location}`);
                
                if (issue.suggestedFix) {
                    console.log(`   💡 Fix: ${issue.suggestedFix}`);
                }
                console.log('');
            });
        }
        
        console.log('=' .repeat(60));
        console.log('\n✨ Test Complete!\n');
        
    } catch (error) {
        console.error('\n❌ Error during test:', error.message);
    } finally {
        await browserManager.cleanup();
    }
}

// Test configurations
const testUrls = [
    'https://github.com',           // Normal website
    'https://example.com',          // Simple test site
    'about:blank',                  // Blank page (should trigger white-screen)
];

// Run test on first URL
const urlToTest = process.argv[2] || testUrls[0];
testWebsite(urlToTest);
