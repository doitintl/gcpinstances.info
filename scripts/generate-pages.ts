/**
 * Post-build script: generates per-route index.html files for path-based routing.
 *
 * After `vite build` produces dist/index.html, this script creates copies at:
 *   dist/cloudsql/index.html
 *   dist/memorystore/index.html
 *   dist/alloydb/index.html
 *   dist/mcp-cli/index.html
 *
 * Each copy has route-specific <title>, <meta name="description">, <link rel="canonical">,
 * and Open Graph tags so every page is crawlable with unique metadata.
 *
 * All copies reference the same JS/CSS bundles from /assets/ — no duplication of assets.
 * S3 static hosting serves the index.html from each directory for directory-level requests.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const DIST = join(process.cwd(), 'dist')
const BASE_URL = 'https://gcpinstances.doit.com'

interface RouteConfig {
  path: string        // URL path, e.g. "/cloudsql/"
  dir: string         // dist subdirectory, e.g. "cloudsql"
  title: string
  description: string
  ogTitle: string
  noscriptHeading: string
  noscriptBody: string
}

const ROUTES: RouteConfig[] = [
  {
    path: '/cloudsql/',
    dir: 'cloudsql',
    title: 'GCP Cloud SQL Pricing Comparison — MySQL, PostgreSQL, SQL Server | DoiT',
    description: 'Compare Google Cloud SQL instance types and pricing for MySQL, PostgreSQL, and SQL Server across all regions. On-demand and committed use discount pricing.',
    ogTitle: 'GCP Cloud SQL Pricing Comparison | DoiT',
    noscriptHeading: 'Google Cloud SQL Instance Pricing Comparison',
    noscriptBody: 'Compare Cloud SQL managed database instance types and pricing for MySQL, PostgreSQL, and SQL Server (Standard, Enterprise, Express, Web editions) across all GCP regions.',
  },
  {
    path: '/memorystore/',
    dir: 'memorystore',
    title: 'GCP Memorystore Pricing Comparison — Redis & Valkey | DoiT',
    description: 'Compare Google Cloud Memorystore instance types and pricing for Redis and Valkey across all GCP regions.',
    ogTitle: 'GCP Memorystore Pricing Comparison | DoiT',
    noscriptHeading: 'Google Cloud Memorystore Instance Pricing Comparison',
    noscriptBody: 'Compare Memorystore managed Redis and Valkey instance types and pricing across all GCP regions.',
  },
  {
    path: '/alloydb/',
    dir: 'alloydb',
    title: 'GCP AlloyDB Pricing Comparison — All Regions & Instance Types | DoiT',
    description: 'Compare Google Cloud AlloyDB for PostgreSQL instance types and pricing across all GCP regions.',
    ogTitle: 'GCP AlloyDB Pricing Comparison | DoiT',
    noscriptHeading: 'Google Cloud AlloyDB Instance Pricing Comparison',
    noscriptBody: 'Compare AlloyDB for PostgreSQL instance types and pricing across all GCP regions.',
  },
  {
    path: '/mcp-cli/',
    dir: 'mcp-cli',
    title: 'GCP Instances MCP & CLI Developer Tools | DoiT',
    description: 'Developer tools for GCP instance pricing data: CLI tool, MCP server for AI assistants like Claude, and automation APIs.',
    ogTitle: 'GCP Instances MCP & CLI Tools | DoiT',
    noscriptHeading: 'GCP Instances MCP & CLI Developer Tools',
    noscriptBody: 'Developer tools for GCP instance pricing: CLI tool for terminal queries, MCP server for AI assistants like Claude, and automation APIs for CI/CD pipelines.',
  },
]

function patchHtml(html: string, route: RouteConfig): string {
  const canonicalUrl = BASE_URL + route.path
  const ogImageUrl = BASE_URL + '/og-image.png'

  // Title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(route.title)}</title>`,
  )

  // Meta description
  html = html.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${escapeHtml(route.description)}$2`,
  )

  // Canonical
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${canonicalUrl}$2`,
  )

  // OG title
  html = html.replace(
    /(<meta property="og:title" content=")[^"]*(")/,
    `$1${escapeHtml(route.ogTitle)}$2`,
  )

  // OG description
  html = html.replace(
    /(<meta property="og:description" content=")[^"]*(")/,
    `$1${escapeHtml(route.description)}$2`,
  )

  // OG url
  html = html.replace(
    /(<meta property="og:url" content=")[^"]*(")/,
    `$1${canonicalUrl}$2`,
  )

  // Twitter title
  html = html.replace(
    /(<meta name="twitter:title" content=")[^"]*(")/,
    `$1${escapeHtml(route.ogTitle)}$2`,
  )

  // Twitter description
  html = html.replace(
    /(<meta name="twitter:description" content=")[^"]*(")/,
    `$1${escapeHtml(route.description)}$2`,
  )

  // Patch noscript content
  html = html.replace(
    /<h1 style="[^"]*">GCP Instance Pricing Comparison<\/h1>/,
    `<h1 style="font-size:1.75rem;margin-bottom:0.5rem;">${escapeHtml(route.noscriptHeading)}</h1>`,
  )
  html = html.replace(
    /<p style="font-size:1rem;color:#444[^>]*>A free tool[^<]*<\/p>/,
    `<p style="font-size:1rem;color:#444;margin-bottom:1.5rem;">${escapeHtml(route.noscriptBody)} Tool by <a href="https://www.doit.com" style="color:#4f46e5;">DoiT International</a>.</p>`,
  )

  return html
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const baseHtml = readFileSync(join(DIST, 'index.html'), 'utf8')

for (const route of ROUTES) {
  const dir = join(DIST, route.dir)
  mkdirSync(dir, { recursive: true })
  const patched = patchHtml(baseHtml, route)
  writeFileSync(join(dir, 'index.html'), patched, 'utf8')
  console.log(`Generated dist/${route.dir}/index.html`)
}

// Also update the sitemap with all routes
const today = new Date().toISOString().split('T')[0]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/cloudsql/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/memorystore/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/alloydb/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
`
writeFileSync(join(DIST, 'sitemap.xml'), sitemap, 'utf8')
console.log('Updated dist/sitemap.xml with all routes')

console.log('Page generation complete.')
