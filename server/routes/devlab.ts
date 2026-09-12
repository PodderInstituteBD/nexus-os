import { Router, Response } from 'express';
import crypto from 'crypto';
import { authenticate, AuthenticatedRequest } from '../auth.js';

const router = Router();

function isPrivateIpOrLocalhost(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();

    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      (host.startsWith('172.') && parseInt(host.split('.')[1], 10) >= 16 && parseInt(host.split('.')[1], 10) <= 31) ||
      host === '169.254.169.254' // Cloud metadata IP
    ) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

router.post(['/api-proxy', '/proxy'], authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { url, method, headers, body } = req.body;
  if (!url) {
    res.status(400).json({ error: 'Target URL is required.' });
    return;
  }

  if (isPrivateIpOrLocalhost(url)) {
    res.status(400).json({ error: 'SSRF Protection: Requests to localhost, private IP subnets, or metadata services are forbidden.' });
    return;
  }

  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];
  const reqMethod = (method || 'GET').toUpperCase();
  if (!allowedMethods.includes(reqMethod)) {
    res.status(400).json({ error: `Method ${reqMethod} is not permitted in sandbox proxy.` });
    return;
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'NEXUS-OS-DevLab-Runner/1.0',
      ...(headers || {})
    };

    const fetchOptions: RequestInit = {
      method: reqMethod,
      headers: fetchHeaders,
      signal: controller.signal
    };

    if (['POST', 'PUT', 'PATCH'].includes(reqMethod) && body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeout);
    const durationMs = Date.now() - startTime;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    const contentType = response.headers.get('content-type') || '';
    let responseData: any;
    if (contentType.includes('application/json')) {
      responseData = await response.json().catch(() => null);
    } else {
      responseData = await response.text();
    }

    res.json({
      status: response.status,
      statusText: response.statusText,
      durationMs,
      headers: responseHeaders,
      data: responseData
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    res.status(502).json({
      error: 'Proxy execution failed: ' + err.message,
      durationMs
    });
  }
});

router.post('/hashes', (req, res) => {
  const { input } = req.body;
  if (typeof input !== 'string') {
    res.status(400).json({ error: 'Input text is required.' });
    return;
  }

  const md5 = crypto.createHash('md5').update(input).digest('hex');
  const sha1 = crypto.createHash('sha1').update(input).digest('hex');
  const sha256 = crypto.createHash('sha256').update(input).digest('hex');
  const sha512 = crypto.createHash('sha512').update(input).digest('hex');

  res.json({ md5, sha1, sha256, sha512 });
});

export default router;
