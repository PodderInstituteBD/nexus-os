import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../auth.js';

const router = Router();

interface CacheEntry {
  data: any;
  cachedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

function getGithubHeaders(customToken?: string) {
  const token = customToken || process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'NEXUS-OS-Gateway'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

router.get('/rate-limit', async (req, res): Promise<void> => {
  try {
    const customToken = req.headers['x-github-token'] as string | undefined;
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: getGithubHeaders(customToken)
    });
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to query GitHub rate limits: ' + err.message });
  }
});

router.get('/repo', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  let owner = req.query.owner as string | undefined;
  let repo = req.query.repo as string | undefined;

  if (!owner && repo) {
    const cleanRepo = repo.replace(/https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').trim();
    const parts = cleanRepo.split('/');
    if (parts.length >= 2) {
      owner = parts[0];
      repo = parts[1];
    }
  }

  if (!owner || !repo) {
    res.status(400).json({ error: 'Missing repository parameters. Provide "owner" and "repo" or "repo=owner/repo"' });
    return;
  }

  const cacheKey = `repo:${owner}/${repo}`;
  const customToken = req.headers['x-github-token'] as string | undefined;

  if (!customToken && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      res.json({ ...cached.data, _cached: true });
      return;
    }
  }

  const headers = getGithubHeaders(customToken);

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    
    if (repoRes.status === 404) {
      res.status(404).json({ error: `Repository "${owner}/${repo}" was not found or is private.` });
      return;
    }

    if (repoRes.status === 403) {
      const remaining = repoRes.headers.get('x-ratelimit-remaining');
      const reset = repoRes.headers.get('x-ratelimit-reset');
      res.status(429).json({
        error: 'GitHub API rate limit exceeded.',
        rateLimitRemaining: remaining,
        rateLimitReset: reset ? new Date(Number(reset) * 1000).toISOString() : null,
        hint: 'Configure a GITHUB_TOKEN in your environment or provide a personal access token for 5,000 req/hr.'
      });
      return;
    }

    if (!repoRes.ok) {
      res.status(repoRes.status).json({ error: `GitHub API returned HTTP ${repoRes.status}` });
      return;
    }

    const repoData = await repoRes.json();

    // Concurrently fetch commits, PRs, and issues
    const [commitsRes, prsRes, issuesRes, contributorsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`, { headers }).catch(() => null),
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=6`, { headers }).catch(() => null),
      fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=6`, { headers }).catch(() => null),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=8`, { headers }).catch(() => null)
    ]);

    const commits = commitsRes && commitsRes.ok ? await commitsRes.json() : [];
    const pulls = prsRes && prsRes.ok ? await prsRes.json() : [];
    const issuesRaw = issuesRes && issuesRes.ok ? await issuesRes.json() : [];
    // GitHub issues API includes pull requests; filter them out
    const issues = Array.isArray(issuesRaw) ? issuesRaw.filter((i: any) => !i.pull_request) : [];
    const contributors = contributorsRes && contributorsRes.ok ? await contributorsRes.json() : [];

    const result = {
      repository: {
        id: repoData.id,
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        htmlUrl: repoData.html_url,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssuesCount: repoData.open_issues_count,
        watchersCount: repoData.watchers_count,
        language: repoData.language,
        license: repoData.license?.name,
        defaultBranch: repoData.default_branch,
        updatedAt: repoData.updated_at,
        pushedAt: repoData.pushed_at
      },
      recentCommits: Array.isArray(commits) ? commits.map((c: any) => ({
        sha: c.sha.substring(0, 7),
        fullSha: c.sha,
        message: c.commit.message.split('\n')[0],
        author: c.commit.author.name,
        avatarUrl: c.author?.avatar_url,
        date: c.commit.author.date,
        url: c.html_url
      })) : [],
      openPullRequests: Array.isArray(pulls) ? pulls.map((p: any) => ({
        number: p.number,
        title: p.title,
        user: p.user.login,
        avatarUrl: p.user.avatar_url,
        createdAt: p.created_at,
        url: p.html_url
      })) : [],
      openIssues: issues.slice(0, 6).map((i: any) => ({
        number: i.number,
        title: i.title,
        user: i.user.login,
        avatarUrl: i.user.avatar_url,
        createdAt: i.created_at,
        commentsCount: i.comments,
        url: i.html_url
      })),
      contributors: Array.isArray(contributors) ? contributors.map((ct: any) => ({
        login: ct.login,
        avatarUrl: ct.avatar_url,
        contributions: ct.contributions,
        url: ct.html_url
      })) : []
    };

    cache.set(cacheKey, { data: result, cachedAt: Date.now() });
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to contact GitHub API: ' + err.message });
  }
});

export default router;
