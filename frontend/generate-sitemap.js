#!/usr/bin/env node
/* eslint-env node */

/**
 * Script to generate sitemap.xml with all published articles and categories
 * 
 * Usage:
 *   node generate-sitemap.js
 * 
 * Environment variables:
 *   VITE_BACKEND_URL - Backend URL (default: http://localhost:8000)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:8000';
const BASE_URL = 'https://superotech.ai';
const OUTPUT_PATH = path.join(__dirname, 'public', 'sitemap.xml');

// Get current date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// Static pages configuration
const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/articles', priority: '0.9', changefreq: 'daily' },
    { loc: '/comunicato-stampa-rebranding', priority: '0.7', changefreq: 'monthly' },
    { loc: '/thank-you-page', priority: '0.3', changefreq: 'monthly' },
];

/**
 * Fetch all published articles from backend
 */
async function fetchArticles() {
    try {
        console.log(`Fetching articles from ${BACKEND_URL}/blog/articles/published/...`);
        const response = await fetch(`${BACKEND_URL}/blog/articles/published/?page_size=1000`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const articles = data.results || data;
        console.log(`✓ Fetched ${articles.length} articles`);
        return articles;
    } catch (error) {
        console.error('Error fetching articles:', error.message);
        return [];
    }
}

/**
 * Fetch all categories from backend
 */
async function fetchCategories() {
    try {
        console.log(`Fetching categories from ${BACKEND_URL}/blog/categories/...`);
        const response = await fetch(`${BACKEND_URL}/blog/categories/?page_size=1000`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const categories = data.results || data;
        console.log(`✓ Fetched ${categories.length} categories`);
        return categories;
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        return [];
    }
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(dateString) {
    if (!dateString) return today;
    try {
        return new Date(dateString).toISOString().split('T')[0];
    } catch {
        return today;
    }
}

/**
 * Generate sitemap XML content
 */
function generateSitemapXML(articles, categories) {
    const lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ''
    ];

    // Add static pages
    console.log('\nAdding static pages...');
    staticPages.forEach(page => {
        lines.push('  <url>');
        lines.push(`    <loc>${BASE_URL}${page.loc}</loc>`);
        lines.push(`    <changefreq>${page.changefreq}</changefreq>`);
        lines.push(`    <priority>${page.priority}</priority>`);
        lines.push(`    <lastmod>${today}</lastmod>`);
        lines.push('  </url>');
        console.log(`  ✓ ${page.loc}`);
    });

    // Add articles
    if (articles.length > 0) {
        lines.push('');
        lines.push('  <!-- Published Articles -->');
        console.log('\nAdding articles...');
        
        articles.forEach(article => {
            const lastmod = formatDate(article.updated_at || article.created_at);
            lines.push('  <url>');
            lines.push(`    <loc>${BASE_URL}/articles/${article.slug}</loc>`);
            lines.push(`    <changefreq>monthly</changefreq>`);
            lines.push(`    <priority>0.8</priority>`);
            lines.push(`    <lastmod>${lastmod}</lastmod>`);
            lines.push('  </url>');
        });
        console.log(`  ✓ Added ${articles.length} articles`);
    }

    // Add categories
    if (categories.length > 0) {
        lines.push('');
        lines.push('  <!-- Categories -->');
        console.log('\nAdding categories...');
        
        categories.forEach(category => {
            lines.push('  <url>');
            lines.push(`    <loc>${BASE_URL}/category/${category.id}</loc>`);
            lines.push(`    <changefreq>weekly</changefreq>`);
            lines.push(`    <priority>0.7</priority>`);
            lines.push(`    <lastmod>${today}</lastmod>`);
            lines.push('  </url>');
        });
        console.log(`  ✓ Added ${categories.length} categories`);
    }

    lines.push('');
    lines.push('</urlset>');
    
    return lines.join('\n');
}

/**
 * Main function
 */
async function main() {
    console.log('==========================================');
    console.log('  SUPERO Sitemap Generator');
    console.log('==========================================\n');
    console.log(`Backend URL: ${BACKEND_URL}`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Output: ${OUTPUT_PATH}\n`);

    // Fetch data
    const [articles, categories] = await Promise.all([
        fetchArticles(),
        fetchCategories()
    ]);

    // Generate sitemap XML
    console.log('\nGenerating sitemap.xml...');
    const xml = generateSitemapXML(articles, categories);

    // Write to file
    try {
        fs.writeFileSync(OUTPUT_PATH, xml, 'utf8');
        console.log(`\n✓ Sitemap generated successfully!`);
        console.log(`  File: ${OUTPUT_PATH}`);
        console.log(`  Total URLs: ${staticPages.length + articles.length + categories.length}`);
        console.log('==========================================\n');
    } catch (error) {
        console.error('\n✗ Error writing sitemap file:', error.message);
        process.exit(1);
    }
}

// Run the script
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
