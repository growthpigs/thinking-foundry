# GitHub API Research — Technical Findings

**Research Issue:** [RESEARCH-02](https://github.com/growthpigs/thinking-foundry/issues/5)
**Date Completed:** 2026-03-28
**Status:** Ready for FSD integration

---

## Executive Summary

✅ **Verdict: VIABLE**

GitHub REST API is perfect for The Thinking Foundry. We can create issues programmatically, embed transcripts, and link session chains without hitting rate limits.

**Key Facts:**
- 5,000 API requests/hour (authenticated)
- One session = 1-3 API calls (well within limits)
- Octokit library handles OAuth + API calls
- Cost: Free (GitHub's free tier includes API)
- Supports gists for long transcripts

---

## Detailed Findings

### 1. Issue Creation via API ✅

**Endpoint:** `POST /repos/{owner}/{repo}/issues`

**Basic Example:**
```typescript
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const issue = await octokit.rest.issues.create({
  owner: 'growthpigs',
  repo: 'thinking-foundry-sessions',
  title: 'Session: [Problem Type] — 2026-03-28',
  body: `# Thinking Session Transcript

**Date:** 2026-03-28
**Duration:** 60 minutes
**Confidence:** 8/10

## Problem
[User's initial problem statement]

## Thinking Process
[Full transcript of session]

## Clear Answers
[AI's final recommendations]

## GitHub Gist (Full Transcript)
[Link to gist with complete transcript]
`,
  labels: ['session', 'completed'],
});

console.log(issue.data.html_url); // Share this with user
```

**Payload Limits:**
- Title: 1,000 characters ✅
- Body: 65,536 characters (64KB) ✅ (enough for ~10K words transcript)

**If Transcript Exceeds Body Limit:**
- Create a separate Gist
- Embed gist URL in issue body
- Both issue + gist are linked

---

### 2. Gists for Long Content ✅

**When to Use:**
- Full transcripts (word-for-word, every sentence)
- Audio metadata (timestamps, speaker labels)
- Debug logs (for transparency)

**Example Structure:**
```typescript
// Create gist with full transcript
const gist = await octokit.rest.gists.create({
  files: {
    'transcript.md': {
      content: fullTranscript, // Can be 100KB+
    },
    'session-metadata.json': {
      content: JSON.stringify({
        duration: 3600,
        startTime: '2026-03-28T10:00:00Z',
        phases: {
          'MINE': 600,
          'SCOUT': 1200,
          'ASSAY': 900,
          // ...
        },
      }),
    },
  },
  public: true, // User can share publicly if they want
  description: 'Full transcript from thinking session',
});

// Reference gist in issue
issue.body += `\n\n📄 [Full Transcript (Gist)](${gist.data.html_url})`;
```

**Gist Benefits:**
- Syntax highlighting for code blocks
- Version history (user can see edits)
- Easy to share
- Can be embedded in other documents

---

### 3. Session Linking (Issue References) ✅

**Pattern: Chain Issues Together**

For follow-up sessions, we link to previous issues:

```typescript
// When creating follow-up session
const issue = await octokit.rest.issues.create({
  owner: 'growthpigs',
  repo: 'thinking-foundry-sessions',
  title: 'Session Follow-Up: [Topic] — 2026-04-01',
  body: `# Follow-Up Session

**Previous Session:** [Session: [Topic] — 2026-03-28](https://github.com/growthpigs/thinking-foundry-sessions/issues/42)

This session continues the thinking from the previous session...
`,
});
```

**What This Enables:**
- User sees full journey (Session 1 → 2 → 3 → ...)
- Can reference decisions from previous sessions
- Proves thinking progression over time
- Acts as a portfolio of growth

**GitHub UI Automatically:**
- Shows linked issues
- Creates mention threads
- Makes it easy to navigate

---

### 4. Authentication Options ✅

**Option 1: User OAuth (Recommended for MVP)**

```typescript
// User logs in with their GitHub account
// We get an OAuth token
// We create issues in THEIR repo (or shared repo)

const octokit = new Octokit({ auth: userOAuthToken });

// Issues appear on user's GitHub account
// They feel ownership (it's their data)
// Privacy: issues can be private (not public)
```

**OAuth Flow:**
1. User clicks "Sign in with GitHub"
2. Redirects to `https://github.com/login/oauth/authorize?client_id=...`
3. User grants permissions (create issues, read profile)
4. GitHub redirects back with code
5. We exchange code for access token
6. Token stored securely (encrypted)

**Permissions Needed:**
- `repo` (create issues in user's repos)
- `read:user` (get user's name/email)

**Option 2: Machine Account (Alternative)**

```typescript
// We use a shared bot account
// Issues appear under bot's account
// Simpler, but less personal

const octokit = new Octokit({
  auth: process.env.GITHUB_BOT_TOKEN
});
```

**For MVP:** Use User OAuth (Option 1). More personal, user owns their data.

---

### 5. Rate Limits ✅

**Authenticated Rate Limit: 5,000 requests per hour**

**How Many API Calls per Session?**

| API Call | Count | Rate |
|----------|-------|------|
| Create issue | 1 | ~0.17/session |
| Create gist (if needed) | 1 | ~0.17/session |
| Update issue (add comment) | 2-3 | ~0.3/session |
| Get user info | 1 | ~0.17/session |
| **Total per session** | **5-6** | **~0.8/session** |

**Capacity:**
- 5,000 requests/hour ÷ 6 requests/session = **830 sessions/hour**
- At $500/session, that's $415K/hour in revenue before hitting limits ✅

**No Rate Limit Concerns for MVP (or even 1,000 concurrent users)**

---

### 6. Error Handling & Retries ✅

**Common Errors:**

| Error | Cause | Handling |
|-------|-------|----------|
| 401 Unauthorized | Token expired | Refresh token, retry |
| 403 Forbidden | Insufficient scopes | Request re-auth with new scopes |
| 404 Not Found | Repo doesn't exist | Create repo, retry |
| 422 Validation Failed | Bad issue data | Validate before sending |
| 429 Too Many Requests | Rate limited | Wait 60 sec, retry (shouldn't happen) |

**Retry Strategy:**
```typescript
async function createIssueWithRetry(octokit, params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await octokit.rest.issues.create(params);
    } catch (error) {
      if (error.status === 401) {
        // Token expired, request refresh
        await refreshGitHubToken();
      } else if (error.status === 429) {
        // Rate limited, wait and retry
        await sleep(60000);
      } else {
        throw error; // Don't retry on other errors
      }
    }
  }
}
```

---

## Tech Stack Integration

### Frontend (React)
```typescript
// OAuth login button
<button onClick={() => {
  window.location.href = `https://github.com/login/oauth/authorize?${new URLSearchParams({
    client_id: process.env.REACT_APP_GITHUB_CLIENT_ID,
    redirect_uri: 'https://thinking-foundry.app/auth/github/callback',
    scope: 'repo,read:user',
  })}`;
}}>
  Sign in with GitHub
</button>
```

### Backend (Cloudflare Workers)
```typescript
// Receive OAuth code, exchange for token
export async function handleGitHubCallback(code: string) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const { access_token } = await response.json();
  // Store token securely (encrypted in KV store)
  await env.GITHUB_TOKENS.put(userId, encryptToken(access_token));
}

// Create issue at end of session
export async function exportSessionToGitHub(userId: string, transcript: string) {
  const token = await getGitHubToken(userId);
  const octokit = new Octokit({ auth: token });

  const issue = await octokit.rest.issues.create({
    owner: userId, // User's own repo
    repo: 'thinking-foundry-sessions',
    title: `Session: ${transcript.split('\n')[0]}`,
    body: formatTranscript(transcript),
    labels: ['thinking-session'],
  });

  return issue.data.html_url;
}
```

---

## Data & Privacy

**Where Do Issues Live?**
- User's own GitHub account (if User OAuth)
- Optional: Create shared `thinking-foundry-sessions` repo for portfolio

**Privacy Settings:**
- Issues can be private (only user sees)
- Issues can be public (shareable, shows expertise)
- User controls visibility per session

**Data Retention:**
- GitHub keeps issues forever (unless deleted)
- User can delete issue if they want
- Gists also user-controlled

**GDPR Compliance:**
- User can download their data (GitHub export)
- User can delete their data (delete issues/repo)
- We comply because GitHub owns the data

---

## Validation & Unknowns

### ✅ Validated
- Issue creation is simple (1 API call)
- Rate limits allow 800+ sessions/hour
- OAuth is straightforward
- Gists work for long transcripts
- Issue linking enables session chains

### ⏳ Need to Test
- Actual OAuth flow end-to-end
- Token refresh mechanism
- How long does issue creation take? (latency)
- Can we update issues in real-time during session?

### 🔴 Risks
- GitHub API changes (unlikely, stable for 10+ years)
- OAuth token exposure (encrypt in transit/storage)
- Repo not existing (create it automatically)

**Mitigation:**
- Store tokens encrypted in Cloudflare KV
- Create repo on first session if needed
- Monitor GitHub status page

---

## Comparison: Issue vs Gist vs Discussions

| Feature | Issue | Gist | Discussion |
|---------|-------|------|-----------|
| **For Session Export** | ✅ Primary | 🟡 Secondary (transcript) | ❌ Overkill |
| **Easy to Link** | ✅ Yes | ⚠️ Not really | ✅ Yes |
| **Search** | ✅ Good | ⚠️ Limited | ✅ Good |
| **Comments** | ✅ Yes | ❌ No | ✅ Yes |
| **Public Profile** | ✅ Yes | ⚠️ Awkward | ✅ Better |

**Recommendation:** Use Issues for session structure + Gists for full transcript

---

## Recommendation

✅ **PROCEED with GitHub REST API + Octokit**

This is the right choice because:
1. **Free** (no costs, unlike Notion or other DBs)
2. **Simple** (1-2 API calls per session)
3. **Transparent** (user owns their data)
4. **Scalable** (5K req/hour supports 800+ sessions/hour)
5. **Shareable** (issues are URLs, easy to forward)
6. **Portfolio Effect** (proves thinking process to others)

**Implementation Path:**
1. Set up GitHub OAuth app (5 min)
2. Add OAuth login button (2 hours)
3. Build issue creation code (3 hours)
4. Test end-to-end (2 hours)
5. Deploy to production (1 hour)

**Total:** ~8 hours to production GitHub integration

---

## Sources

- [GitHub REST API Issues Documentation](https://docs.github.com/en/rest/issues/issues)
- [GitHub API Rate Limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [Octokit: GitHub REST API Client](https://github.com/octokit/rest.js)
- [Octokit Authentication Strategies](https://github.com/octokit/authentication-strategies.js)
- [GitHub OAuth Implementation Guide](https://stateful.com/blog/github-oauth)
- [OAuth 2.0 with Node.js](https://www.sohamkamani.com/nodejs/oauth/)

---

**Status:** Ready for FSD (Functional Specification Document)
**Next:** Start RESEARCH-03 (Transcription Pipeline) or wait for remaining research
