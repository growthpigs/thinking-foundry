# NotebookLM Python Setup & Authentication

## Quick Setup (5 minutes)

### 1. Verify Installation

```bash
# Check if notebooklm-py is installed
python3 -c "import notebooklm; print(notebooklm.__version__)"

# Output: Should show version like "0.0.25" or similar
```

If not installed:

```bash
pip install notebooklm-py
```

### 2. Authenticate

```bash
# Log in to your Google account
notebooklm login

# This will:
# 1. Open a browser
# 2. Ask you to log in to Google
# 3. Navigate to NotebookLM.google.com
# 4. Automatically extract and save your auth tokens
# 5. Save credentials to ~/.notebooklm/storage_state.json
```

### 3. Verify Auth

```bash
# List your notebooks to confirm auth works
notebooklm notebook list

# Output: Lists your existing NotebookLM notebooks
```

---

## Authentication Details

### Where Credentials Are Stored

```
~/.notebooklm/storage_state.json
```

**Contents:** (Do NOT commit this file!)
- Browser cookies
- CSRF token (SNlM0e)
- Session ID (FdrFJe)

### How Credentials Work

The library uses **browser automation** to extract credentials:

1. **Playwright opens Chrome browser** → navigates to NotebookLM.google.com
2. **Extracts session cookies** from browser storage
3. **Saves to `storage_state.json`** (Playwright standard format)
4. **Reuses cookies in API calls** to authenticate future requests

### Authentication Flow

```python
from notebooklm import NotebookLMClient

# Client loads from saved state file
async with await NotebookLMClient.from_storage() as client:
    # Library automatically:
    # 1. Reads ~/.notebooklm/storage_state.json
    # 2. Extracts cookies and tokens
    # 3. Uses them for RPC calls to Google
```

### Token Refresh

The library automatically refreshes expired tokens:

```python
# If a token expires mid-session:
# 1. RPC call gets "Session Expired" error
# 2. refresh_auth() is called automatically
# 3. Hits NotebookLM homepage to get fresh tokens
# 4. Retries the RPC call
# 5. User never sees the error

# No manual intervention needed!
```

---

## Command-Line Interface

### Login

```bash
notebooklm login

# Opens browser, guides you through Google login
# Saves credentials automatically
```

### Logout

```bash
notebooklm logout

# Removes ~/.notebooklm/storage_state.json
# You'll need to login again
```

### List Notebooks

```bash
notebooklm notebook list

# Shows all your notebooks with IDs and source counts
```

### Create Notebook

```bash
notebooklm notebook create "My Research Topic"

# Creates notebook and prints ID
```

### List Sources in Notebook

```bash
notebooklm source list NOTEBOOK_ID

# Shows all sources in the notebook
```

### Add a URL Source

```bash
notebooklm source add NOTEBOOK_ID "https://example.com"

# Adds URL, waits for processing
```

### Chat from CLI

```bash
notebooklm chat NOTEBOOK_ID "What is this about?"

# Asks a question and prints answer
```

---

## Python Usage

### Basic Setup

```python
#!/usr/bin/env python3
import asyncio
from notebooklm import NotebookLMClient

async def main():
    # Load from saved auth
    async with await NotebookLMClient.from_storage() as client:
        # Do work here
        notebooks = await client.notebooks.list()
        for nb in notebooks:
            print(f"{nb.title}")

if __name__ == "__main__":
    asyncio.run(main())
```

### Custom Storage Path

```python
# If you want to use a non-default location
async with await NotebookLMClient.from_storage(
    path="/custom/path/storage_state.json"
) as client:
    # Use client...
    pass
```

### Direct Authentication (Advanced)

```python
from notebooklm import NotebookLMClient, AuthTokens

# If you already have tokens (advanced case)
auth = AuthTokens(
    cookies="your_cookies_here",
    csrf_token="SNlM0e_token",
    session_id="FdrFJe_token"
)

async with NotebookLMClient(auth) as client:
    # Use client...
    pass
```

---

## Troubleshooting Authentication

### Issue: "Session Expired" Error

**Cause:** Your Google session expired

**Fix:** Re-authenticate

```bash
notebooklm logout
notebooklm login
```

Then retry your Python code.

### Issue: "File Not Found: storage_state.json"

**Cause:** You haven't authenticated yet

**Fix:** Run login first

```bash
notebooklm login

# Wait for browser to open and login to complete
```

### Issue: "Browser Extension Not Connected"

**Cause:** Playwright Chrome browser isn't running

**Fix:** Install Playwright

```bash
pip install "notebooklm-py[browser]"
playwright install chromium
```

Then retry login.

### Issue: Can't Open Browser During Login

**Cause:** Running on headless server (no display)

**Status:** This library requires a graphical browser for authentication. Options:

1. **Authenticate on your local machine**, then copy `~/.notebooklm/` to server
2. **Use X11 forwarding** if available (SSH -X)
3. **Use manual token extraction** (advanced — not recommended)

### Issue: Two-Factor Authentication

**Cause:** Your Google account has 2FA enabled

**Flow:**
1. `notebooklm login` opens browser
2. You see Google login
3. Enter your password
4. Google sends 2FA code to your phone
5. Enter the code in browser
6. Login completes, credentials saved

No special action needed — browser handles it automatically.

---

## Security Best Practices

### DO

- ✅ **Keep `storage_state.json` private** — It's like your password
- ✅ **Use your own Google account** — Don't share credentials
- ✅ **.gitignore the file** — Never commit to version control
- ✅ **Re-authenticate regularly** — Especially if you change Google password

### DON'T

- ❌ **Share `storage_state.json` with others** — They get full access
- ❌ **Commit to public repo** — Anyone can use your account
- ❌ **Hard-code tokens in scripts** — Load from file or environment
- ❌ **Use someone else's storage file** — Always authenticate yourself

### Recommended: Environment-Aware Setup

```python
import os
from pathlib import Path

# Load credentials from environment or default location
storage_path = os.getenv("NOTEBOOKLM_STORAGE")
if not storage_path:
    storage_path = Path.home() / ".notebooklm" / "storage_state.json"

async with await NotebookLMClient.from_storage(storage_path) as client:
    # Use client...
    pass
```

---

## Deployment / Production Use

### Local Development

```bash
# On your machine
notebooklm login
# Credentials saved locally
python my_script.py
```

### Remote Deployment (e.g., Render, Lambda)

**Option 1: Copy credentials to server**

```bash
# Copy from local machine
scp ~/.notebooklm/storage_state.json user@server:/home/user/.notebooklm/

# Then script can use:
async with await NotebookLMClient.from_storage() as client:
    # Works on server
```

**Option 2: Environment variable**

```bash
# Encode credentials as base64
cat ~/.notebooklm/storage_state.json | base64

# Set environment on server
export NOTEBOOKLM_CREDENTIALS="<base64-encoded-json>"

# In script:
import os
import json
import base64
from notebooklm import AuthTokens

creds_b64 = os.getenv("NOTEBOOKLM_CREDENTIALS")
if creds_b64:
    creds_json = base64.b64decode(creds_b64).decode()
    creds = json.loads(creds_json)
    auth = AuthTokens(
        cookies=creds["cookies"],
        csrf_token=creds["csrf_token"],
        session_id=creds["session_id"]
    )
    async with NotebookLMClient(auth) as client:
        # Use client...
```

---

## Checking Your Setup

### Verify Python Version

```bash
python3 --version

# Should be 3.10 or newer
```

### Verify Installation

```bash
pip list | grep notebooklm

# Should show: notebooklm-py  0.0.25 (or latest version)
```

### Verify Authentication

```bash
python3 -c "
import asyncio
from notebooklm import NotebookLMClient

async def test():
    async with await NotebookLMClient.from_storage() as client:
        nbs = await client.notebooks.list()
        print(f'✅ Connected! You have {len(nbs)} notebooks.')

asyncio.run(test())
"

# Output: ✅ Connected! You have X notebooks.
```

### Verify Browser Dependencies

```bash
python3 -c "
from playwright.async_api import async_playwright

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        print('✅ Playwright works!')
        await browser.close()

import asyncio
asyncio.run(test())
"
```

---

## Next Steps

- **Read:** `NOTEBOOKLM-GUIDE.md` — Full API documentation
- **Code:** `NOTEBOOKLM-SNIPPETS.py` — Copy/paste examples
- **Test:** Run a simple script to verify everything works
- **Build:** Implement your Crucible tests in Python

---

## Updating the Library

```bash
# Check for updates
pip list --outdated | grep notebooklm

# Update to latest
pip install --upgrade notebooklm-py

# Or install specific version
pip install notebooklm-py==0.0.25
```

---

## Questions?

- **Docs:** `~/.notebooklm-py/docs/`
- **Issues:** `https://github.com/teng-lin/notebooklm-py/issues`
- **Examples:** `~/.notebooklm-py/docs/examples/`
