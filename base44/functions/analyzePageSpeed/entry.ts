import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const PAGESPEED_API_KEY = Deno.env.get('PAGESPEED_API_KEY');
const APP_URL = Deno.env.get('APP_URL') || 'https://joinevnt.com';

const PAGES_TO_AUDIT = [
  { path: '/', label: 'Home / About' },
  { path: '/Swipe', label: 'Vendor Discovery (Swipe)' },
  { path: '/Bookings', label: 'Bookings Dashboard' },
  { path: '/VendorDashboard', label: 'Vendor Dashboard' },
];

async function fetchPageSpeed(url, strategy = 'mobile') {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}${PAGESPEED_API_KEY ? '&key=' + PAGESPEED_API_KEY : ''}`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PageSpeed API error ${res.status}: ${errText.substring(0, 200)}`);
  }
  return res.json();
}

function extractMetrics(result) {
  const cats = result.lighthouseResult?.categories || {};
  const audits = result.lighthouseResult?.audits || {};
  return {
    performance_score: Math.round((cats.performance?.score || 0) * 100),
    accessibility_score: Math.round((cats.accessibility?.score || 0) * 100),
    best_practices_score: Math.round((cats['best-practices']?.score || 0) * 100),
    seo_score: Math.round((cats.seo?.score || 0) * 100),
    fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
    lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
    tbt: audits['total-blocking-time']?.displayValue || 'N/A',
    cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
    speed_index: audits['speed-index']?.displayValue || 'N/A',
    opportunities: Object.values(audits)
      .filter(a => a.details?.type === 'opportunity' && a.score !== null && a.score < 0.9)
      .map(a => ({ id: a.id, title: a.title, description: a.description, savings: a.details?.overallSavingsMs }))
      .slice(0, 5),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const strategy = body.strategy || 'mobile';
    const pageFilter = body.page; // optional: audit just one page

    const pages = pageFilter
      ? PAGES_TO_AUDIT.filter(p => p.path === pageFilter || p.label.toLowerCase().includes(pageFilter.toLowerCase()))
      : PAGES_TO_AUDIT;

    // Check for existing pending insights to avoid duplicates
    const existingInsights = await base44.asServiceRole.entities.AgentInsights.filter({
      agent_name: 'performance_agent',
      status: 'pending'
    });
    const existingPrefixes = new Set(existingInsights.map(i => i.finding.substring(0, 40)));

    // Run all page audits in parallel (avoids sequential timeout risk)
    const auditPromises = pages.map(async (page) => {
      const url = `${APP_URL}${page.path}`;
      console.log(`[analyzePageSpeed] Auditing ${url} (${strategy})`);
      try {
        const psResult = await fetchPageSpeed(url, strategy);
        return { page, url, metrics: extractMetrics(psResult) };
      } catch (err) {
        console.warn(`[analyzePageSpeed] Failed for ${url}:`, err.message);
        return { page, url, error: err.message };
      }
    });

    const auditResults = await Promise.all(auditPromises);

    const results = [];
    const insightsCreated = [];

    for (const result of auditResults) {
      const { page, url } = result;

      if (result.error) {
        results.push({ page: page.label, url, error: result.error });
        continue;
      }

      const { metrics } = result;
      results.push({ page: page.label, url, strategy, metrics });

      // Auto-write critical findings to AgentInsights (deduplicated)
      const perfFinding = metrics.performance_score < 50
        ? `Critical performance score on ${page.label}: ${metrics.performance_score}/100`
        : metrics.performance_score < 70
          ? `Below-target performance on ${page.label}: ${metrics.performance_score}/100`
          : null;

      if (perfFinding && !existingPrefixes.has(perfFinding.substring(0, 40))) {
        const insight = await base44.asServiceRole.entities.AgentInsights.create({
          agent_name: 'performance_agent',
          severity: metrics.performance_score < 50 ? 'P1' : 'P2',
          finding: metrics.performance_score < 50
            ? `${perfFinding} (${strategy}). LCP: ${metrics.lcp}, FCP: ${metrics.fcp}, TBT: ${metrics.tbt}`
            : `${perfFinding} (${strategy}). LCP: ${metrics.lcp}, CLS: ${metrics.cls}`,
          recommendation: metrics.performance_score < 50
            ? `Immediate optimization needed. Top opportunities: ${metrics.opportunities.map(o => o.title).join(', ')}. Focus on LCP and TBT reduction first.`
            : `Address these opportunities: ${metrics.opportunities.map(o => `${o.title}${o.savings ? ' (~' + Math.round(o.savings) + 'ms saved)' : ''}`).join('; ')}`,
          affected_page: page.path,
          raw_data: JSON.stringify({ metrics, strategy, url })
        });
        insightsCreated.push(insight.id);
      }

      const a11yFinding = `Accessibility issues on ${page.label}: score ${metrics.accessibility_score}`;
      if (metrics.accessibility_score < 80 && !existingPrefixes.has(a11yFinding.substring(0, 40))) {
        const insight = await base44.asServiceRole.entities.AgentInsights.create({
          agent_name: 'performance_agent',
          severity: 'warning',
          finding: `${a11yFinding}/100`,
          recommendation: 'Run axe-core audit and fix missing ARIA labels, color contrast issues, and keyboard navigation gaps on interactive components.',
          affected_page: page.path,
          raw_data: JSON.stringify({ accessibility_score: metrics.accessibility_score })
        });
        insightsCreated.push(insight.id);
      }
    }

    return Response.json({
      success: true,
      audited: results.length,
      insights_created: insightsCreated.length,
      results,
      summary: results.map(r => ({
        page: r.page,
        performance: r.metrics?.performance_score ?? 'error',
        accessibility: r.metrics?.accessibility_score ?? 'error',
        lcp: r.metrics?.lcp ?? 'error',
      }))
    });

  } catch (error) {
    console.error('[analyzePageSpeed] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});