/**
 * Byparr & FlareSolverr anti-bot bypass client
 * Compatible with FlareSolverr v1 API and Byparr (FastAPI Camoufox solver)
 */

export interface ByparrResponse {
  status: 'ok' | 'error';
  message: string;
  startTimestamp?: number;
  endTimestamp?: number;
  version?: string;
  solution?: {
    url: string;
    status: number;
    headers?: Record<string, string>;
    response: string; // The solved HTML page
    cookies?: Array<{
      name: string;
      value: string;
      domain?: string;
      path?: string;
    }>;
    userAgent: string;
  };
}

export interface BypassFetchResult {
  html: string;
  status: number;
  cookies: Record<string, string>;
  userAgent: string;
  solvedBy: 'byparr' | 'direct';
}

const DEFAULT_BYPARR_URL = process.env.BYPARR_URL || 'http://localhost:8191/v1';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// In-memory cookie store per domain
const cookieJar = new Map<string, string>();

export async function testByparrConnection(byparrUrl = DEFAULT_BYPARR_URL): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(byparrUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd: 'sessions.list' }),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, message: `Connected to Byparr (${data.version || 'v1'})` };
    }
    return { ok: false, message: `Byparr returned status ${res.status}` };
  } catch (err: any) {
    return { ok: false, message: `Cannot connect to Byparr at ${byparrUrl}: ${err.message}` };
  }
}

/**
 * Fetch a URL bypassing Cloudflare / bot protection via Byparr or smart browser simulation
 */
export async function bypassFetch(
  targetUrl: string,
  options?: {
    byparrUrl?: string;
    byparrEnabled?: boolean;
    referer?: string;
    timeoutMs?: number;
  }
): Promise<BypassFetchResult> {
  const byparrEnabled = options?.byparrEnabled ?? true;
  const byparrUrl = options?.byparrUrl || DEFAULT_BYPARR_URL;
  const timeoutMs = options?.timeoutMs || 30000;

  // 1. Try Byparr if enabled
  if (byparrEnabled) {
    try {
      const res = await fetch(byparrUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cmd: 'request.get',
          url: targetUrl,
          maxTimeout: timeoutMs,
        }),
        signal: AbortSignal.timeout(timeoutMs + 2000),
      });

      if (res.ok) {
        const data: ByparrResponse = await res.json();
        if (data.status === 'ok' && data.solution) {
          const cookies: Record<string, string> = {};
          if (data.solution.cookies) {
            for (const c of data.solution.cookies) {
              cookies[c.name] = c.value;
              try {
                const domain = new URL(targetUrl).hostname;
                cookieJar.set(domain, Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '));
              } catch {}
            }
          }

          return {
            html: data.solution.response,
            status: data.solution.status,
            cookies,
            userAgent: data.solution.userAgent || BROWSER_UA,
            solvedBy: 'byparr',
          };
        }
      }
    } catch {
      // Byparr unreachable or errored, seamlessly fallback to direct smart fetch
    }
  }

  // 2. Direct Smart Fetch with browser headers and referer spoofing
  try {
    const urlObj = new URL(targetUrl);
    const domain = urlObj.hostname;
    const origin = urlObj.origin;
    const storedCookies = cookieJar.get(domain) || '';

    const headers: Record<string, string> = {
      'User-Agent': BROWSER_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': options?.referer || origin,
      'Origin': origin,
      'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };

    if (storedCookies) {
      headers['Cookie'] = storedCookies;
    }

    const response = await fetch(targetUrl, {
      headers,
      signal: AbortSignal.timeout(15000),
    });

    const html = await response.text();
    return {
      html,
      status: response.status,
      cookies: {},
      userAgent: BROWSER_UA,
      solvedBy: 'direct',
    };
  } catch (err: any) {
    throw new Error(`Failed to fetch ${targetUrl}: ${err.message}`);
  }
}
