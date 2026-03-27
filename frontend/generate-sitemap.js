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
 *   SITE_URL - Base public site URL for <loc> entries (default: VITE_PROD_URL or http://localhost:5173)
 *   VITE_PROD_URL - Base public site URL fallback (optional)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadDotEnvIfNeeded() {
    // This script is executed by Node directly; Vite does NOT automatically load `.env` here.
    // Load `frontend/.env` only to fill missing process.env values for local runs.
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;

    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (!key) continue;

        // Strip quotes
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        if (process.env[key] === undefined) process.env[key] = value;
    }
}

loadDotEnvIfNeeded();

// Configuration
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:8000';
const RAW_SITE_URL = process.env.SITE_URL || process.env.VITE_PROD_URL || 'http://localhost:4173';

function stripTrailingSlash(url) {
    return String(url || '').replace(/\/+$/, '');
}

function stripApiSuffix(url) {
    return String(url || '').replace(/\/api$/i, '');
}

// Support both `http://host:8000` and `http://host:8000/api` (some deployments mount APIs under /api).
// This project’s Django routes are rooted at `/blog`, `/users`, `/marketing`, so for local dev we must not
// include `/api` in the fetch URL.
const API_BASE_URL = stripApiSuffix(stripTrailingSlash(BACKEND_URL));
const BASE_URL = stripTrailingSlash(RAW_SITE_URL);
const OUTPUT_PATH = path.join(__dirname, 'public', 'sitemap.xml');

// Get current date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// Static pages configuration
const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/articles', priority: '0.9', changefreq: 'daily' },
    { loc: '/supero-finish', priority: '0.8', changefreq: 'monthly' },
    { loc: '/comunicato-stampa-rebranding', priority: '0.7', changefreq: 'monthly' },
    { loc: '/thank-you-page', priority: '0.3', changefreq: 'monthly' },
];

/**
 * Fetch all published articles from backend
 */
async function fetchArticles() {
    try {
        const url = `${API_BASE_URL}/blog/articles/published/?page_size=1000`;
        console.log(`Fetching articles from ${url} ...`);
        const response = await fetch(url);
        
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
        const url = `${API_BASE_URL}/blog/categories/?page_size=1000`;
        console.log(`Fetching categories from ${url} ...`);
        const response = await fetch(url);
        
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
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        ''
    ];

    function ensureTrailingSlashPath(p) {
        if (p === '/') return '/';
        return p.endsWith('/') ? p : `${p}/`;
    }

    function addUrl({ locPath, enPath, changefreq, priority, lastmod }) {
        const itUrl = `${BASE_URL}${ensureTrailingSlashPath(locPath)}`;
        const enUrl = `${BASE_URL}${ensureTrailingSlashPath(enPath || locPath)}`;

        lines.push('  <url>');
        lines.push(`    <loc>${itUrl}</loc>`);
        lines.push(`    <xhtml:link rel="alternate" hreflang="it" href="${itUrl}" />`);
        lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />`);
        lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${itUrl}" />`);
        lines.push(`    <changefreq>${changefreq}</changefreq>`);
        lines.push(`    <priority>${priority}</priority>`);
        lines.push(`    <lastmod>${lastmod}</lastmod>`);
        lines.push('  </url>');
    }

    // Add static pages
    console.log('\nAdding static pages...');
    staticPages.forEach(page => {
        addUrl({
            locPath: page.loc,
            enPath: page.loc, // static pages share the same URL for now
            changefreq: page.changefreq,
            priority: page.priority,
            lastmod: today,
        });
        console.log(`  ✓ ${page.loc}`);
    });

    // Add articles
    if (articles.length > 0) {
        lines.push('');
        lines.push('  <!-- Published Articles -->');
        console.log('\nAdding articles...');
        
        articles.forEach(article => {
            const slugIt = article?.slugs?.it || article.slug;
            const slugEn = article?.slugs?.en || article.slug_en || article.slug;
            const lastmod = formatDate(article.updated_at || article.created_at);
            addUrl({
                locPath: `/articles/${slugIt}`,
                enPath: `/articles/${slugEn}`,
                changefreq: 'monthly',
                priority: '0.8',
                lastmod,
            });
        });
        console.log(`  ✓ Added ${articles.length} articles`);
    }

    // Add categories
    if (categories.length > 0) {
        lines.push('');
        lines.push('  <!-- Categories -->');
        console.log('\nAdding categories...');
        
        categories.forEach(category => {
            addUrl({
                locPath: `/category/${category.id}`,
                enPath: `/category/${category.id}`,
                changefreq: 'weekly',
                priority: '0.7',
                lastmod: today,
            });
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
    console.log(`API base URL: ${API_BASE_URL}`);
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
