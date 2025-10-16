#!/usr/bin/env node

/**
 * SEO Audit Script for Proxima Report
 * Checks for common SEO issues and provides recommendations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Starting SEO Audit for Proxima Report...\n');

const issues = [];
const recommendations = [];

// Check 1: Verify all pages have proper SEO components
function checkSEOComponents() {
  console.log('📄 Checking SEO components...');
  
  const pagesDir = path.join(__dirname, '../client/src/pages');
  const pageFiles = fs.readdirSync(pagesDir).filter(file => file.endsWith('.tsx'));
  
  pageFiles.forEach(file => {
    const filePath = path.join(pagesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('SEO') && !content.includes('generateLoginSEO') && !content.includes('generateAboutSEO') && !content.includes('generateContactSEO') && !content.includes('generatePricingSEO')) {
      issues.push(`Page ${file} is missing SEO component`);
    }
    
    if (content.includes('noindex') && !content.includes('generateLoginSEO')) {
      recommendations.push(`Consider if ${file} should be indexed for better SEO`);
    }
  });
  
  console.log(`✅ Checked ${pageFiles.length} page files`);
}

// Check 2: Verify canonical URLs are properly implemented
function checkCanonicalUrls() {
  console.log('🔗 Checking canonical URL implementation...');
  
  const seoFile = path.join(__dirname, '../client/src/components/SEO.tsx');
  const content = fs.readFileSync(seoFile, 'utf8');
  
  if (!content.includes('getCanonicalUrl')) {
    issues.push('SEO component missing proper canonical URL handling');
  }
  
  if (!content.includes('canonicalUrl')) {
    issues.push('SEO component not using canonicalUrl variable');
  }
  
  console.log('✅ Canonical URL implementation checked');
}

// Check 3: Verify structured data
function checkStructuredData() {
  console.log('🏗️  Checking structured data implementation...');
  
  const validatorFile = path.join(__dirname, '../client/src/lib/structuredDataValidator.ts');
  
  if (!fs.existsSync(validatorFile)) {
    issues.push('Structured data validator missing');
  } else {
    console.log('✅ Structured data validator exists');
  }
  
  const seoUtilsFile = path.join(__dirname, '../client/src/lib/seoUtils.ts');
  const content = fs.readFileSync(seoUtilsFile, 'utf8');
  
  if (!content.includes('sanitizeStructuredData')) {
    issues.push('SEO utils not using structured data sanitization');
  }
  
  console.log('✅ Structured data implementation checked');
}

// Check 4: Verify sitemap generation
function checkSitemapGeneration() {
  console.log('🗺️  Checking sitemap generation...');
  
  const routesFile = path.join(__dirname, '../server/routes.ts');
  const content = fs.readFileSync(routesFile, 'utf8');
  
  if (!content.includes('app.get("/sitemap.xml"')) {
    issues.push('Sitemap.xml endpoint missing');
  }
  
  if (!content.includes('app.get("/news-sitemap.xml"')) {
    recommendations.push('Consider adding news sitemap for better news SEO');
  }
  
  console.log('✅ Sitemap generation checked');
}

// Check 5: Verify robots.txt
function checkRobotsTxt() {
  console.log('🤖 Checking robots.txt implementation...');
  
  const routesFile = path.join(__dirname, '../server/routes.ts');
  const content = fs.readFileSync(routesFile, 'utf8');
  
  if (!content.includes('app.get("/robots.txt"')) {
    issues.push('Robots.txt endpoint missing');
  }
  
  console.log('✅ Robots.txt implementation checked');
}

// Check 6: Verify redirects
function checkRedirects() {
  console.log('🔄 Checking redirect implementation...');
  
  const routesFile = path.join(__dirname, '../server/routes.ts');
  const content = fs.readFileSync(routesFile, 'utf8');
  
  if (!content.includes('app.get("/articles/all"')) {
    issues.push('Missing redirect for /articles/all route');
  }
  
  console.log('✅ Redirect implementation checked');
}

// Check 7: Verify meta tags
function checkMetaTags() {
  console.log('🏷️  Checking meta tags implementation...');
  
  const indexFile = path.join(__dirname, '../client/index.html');
  const content = fs.readFileSync(indexFile, 'utf8');
  
  // Check for duplicate meta tags
  const metaMatches = content.match(/<meta[^>]*>/g) || [];
  const metaNames = metaMatches
    .map(meta => meta.match(/name=["']([^"']+)["']/)?.[1])
    .filter(Boolean);
  
  const duplicates = metaNames.filter((name, index) => metaNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    issues.push(`Duplicate meta tags found: ${duplicates.join(', ')}`);
  }
  
  // Check for required meta tags
  const requiredTags = ['title', 'description', 'robots', 'viewport'];
  requiredTags.forEach(tag => {
    if (!content.includes(`name="${tag}"`) && !content.includes(`name='${tag}'`)) {
      if (tag !== 'viewport' || !content.includes('content="width=device-width')) {
        issues.push(`Missing required meta tag: ${tag}`);
      }
    }
  });
  
  console.log('✅ Meta tags implementation checked');
}

// Run all checks
function runAudit() {
  try {
    checkSEOComponents();
    checkCanonicalUrls();
    checkStructuredData();
    checkSitemapGeneration();
    checkRobotsTxt();
    checkRedirects();
    checkMetaTags();
    
    console.log('\n📊 SEO Audit Results:');
    console.log('========================\n');
    
    if (issues.length === 0) {
      console.log('🎉 No critical SEO issues found!');
    } else {
      console.log('❌ Critical Issues Found:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n📈 SEO Score:', issues.length === 0 ? '100/100' : `${Math.max(0, 100 - (issues.length * 10))}/100`);
    
    if (issues.length > 0) {
      console.log('\n🔧 To fix these issues, run the appropriate fixes in the codebase.');
      process.exit(1);
    } else {
      console.log('\n✅ All SEO checks passed! Your site is ready for Google Search Console.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Error running SEO audit:', error.message);
    process.exit(1);
  }
}

runAudit();
