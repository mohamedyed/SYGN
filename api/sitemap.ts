import { createClient } from '@supabase/supabase-js'
import type { IncomingMessage, ServerResponse } from 'node:http'

const SITE_URL = 'https://www.sygn.tn'

const STATIC_PAGES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/collection', changefreq: 'daily', priority: '0.9' },
]

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain')
    res.end('Missing Supabase env vars')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: products } = await supabase.from('products').select('id, created_at')

  const now = new Date().toISOString()

  const urls = [
    ...STATIC_PAGES.map(p => ({
      loc: `${SITE_URL}${p.path}`,
      lastmod: now,
      changefreq: p.changefreq,
      priority: p.priority,
    })),
    ...(products ?? []).map(p => ({
      loc: `${SITE_URL}/product/${p.id}`,
      lastmod: p.created_at ?? now,
      changefreq: 'weekly',
      priority: '0.8',
    })),
  ]

  const urlset = urls
    .map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/xml')
  res.end(xml)
}
