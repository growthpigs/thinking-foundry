# NotebookLM Python Client (teng-lin/notebooklm-py) — Complete Usage Guide

⚠️ **FOR CRUCIBLE RUNS:** See **[CRUCIBLE-INSTRUCTIONS.md](./CRUCIBLE-INSTRUCTIONS.md)** for the definitive SOP on running adversarial debates. This prevents the common mistakes of thin sources, bias, and pre-loaded conclusions.

## Overview

**notebooklm-py** is a Python async client for automating Google NotebookLM using undocumented RPC APIs. It allows you to programmatically:
- Create and manage notebooks
- Upload sources (URLs, files, text)
- Chat with notebook content
- Generate AI artifacts (audio podcasts, debates, reports)
- Share notebooks and manage permissions

**Important:** This uses undocumented Google APIs that can change without notice.

---

## Installation

### 1. Where It's Installed

The library is installed in two places on your system:

```
/Users/rodericandrews/clawd/notebooklm-py/                    # Source repo (development)
/Users/rodericandrews/clawd/.venv/lib/python3.14/site-packages/notebooklm/  # Virtual env
~/.Library/Python/3.9/lib/python/site-packages/notebooklm/     # System Python
```

### 2. Installation Steps

```bash
# Clone the repo (already done)
cd /Users/rodericandrews/clawd/notebooklm-py

# Install in development mode
pip install -e ".[browser]"

# Install Playwright for browser automation
playwright install chromium

# Authenticate to NotebookLM
notebooklm login
# This opens a browser, logs you in, and saves credentials to ~/.notebooklm/storage_state.json
```

### 3. Python Version

- Requires: **Python 3.10+**
- Recommended: **Python 3.11+**

---

## How to Instantiate & Connect

### Basic Setup (Recommended)

```python
from notebooklm import NotebookLMClient

# Method 1: Load from saved authentication (recommended)
async with await NotebookLMClient.from_storage() as client:
    # client is now connected and ready to use
    notebooks = await client.notebooks.list()
```

### Alternative: Direct Authentication

```python
from notebooklm import NotebookLMClient, AuthTokens

# Only use this if you have explicit AuthTokens
auth = AuthTokens(cookies="...", csrf_token="...", session_id="...")
async with NotebookLMClient(auth) as client:
    # Do work
    pass
```

### Authentication Storage Location

```
~/.notebooklm/storage_state.json
```

**Never commit this file!** It contains your Google session tokens.

---

## Core API Overview

The client provides these namespaced APIs:

```python
client.notebooks   # Create, list, delete, rename notebooks
client.sources     # Add, list, delete, rename sources
client.chat        # Ask questions, manage conversations
client.artifacts   # Generate podcasts, reports, videos, etc.
client.research    # Start research sessions, import sources
client.notes       # Create and manage user notes
client.settings    # User settings (output language)
client.sharing     # Share notebooks, manage permissions
```

---

## 1. Creating a Notebook

### Basic Notebook Creation

```python
async with await NotebookLMClient.from_storage() as client:
    # Create a new notebook
    notebook = await client.notebooks.create("My Research Notebook")

    print(f"Notebook ID: {notebook.id}")
    print(f"Title: {notebook.title}")
    print(f"Created: {notebook.created_time}")
```

**Returns:** `Notebook` object with:
- `id` — Unique notebook identifier
- `title` — Display name
- `created_time` — Timestamp
- `num_sources` — Current source count

---

## 2. Uploading Documents/Sources

### Method A: Upload from URL

```python
async with await NotebookLMClient.from_storage() as client:
    notebook = await client.notebooks.create("Research")

    # Add URL source (auto-detects YouTube)
    source = await client.sources.add_url(
        notebook.id,
        "https://en.wikipedia.org/wiki/Artificial_intelligence",
        wait=True  # Wait for processing to complete
    )

    print(f"Source ID: {source.id}")
    print(f"Title: {source.title}")
    print(f"Status: {source.status}")  # READY, PROCESSING, ERROR
```

**YouTube URLs are automatically detected** and handled correctly.

### Method B: Upload from File

```python
# Upload a PDF, Word doc, markdown, or text file
source = await client.sources.add_file(
    notebook.id,
    "/path/to/document.pdf",
    wait=True
)
```

**Supported formats:**
- PDF: `application/pdf`
- Text: `text/plain`
- Markdown: `text/markdown`
- Word: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Method C: Upload Raw Text

```python
# Upload text directly (useful for concatenated content)
source = await client.sources.add_text(
    notebook.id,
    title="Architecture Doc",
    content="Full markdown text here...",
    wait=True
)
```

### Wait for Source Processing

Sources are often added asynchronously. Use one of these patterns:

```python
# Pattern 1: Wait immediately (blocking)
source = await client.sources.add_url(url, wait=True, wait_timeout=120)

# Pattern 2: Add multiple, then wait in parallel
sources = [
    await client.sources.add_url(nb_id, url1),
    await client.sources.add_url(nb_id, url2),
    await client.sources.add_url(nb_id, url3),
]
ready_sources = await client.sources.wait_for_sources(
    nb_id,
    [s.id for s in sources],
    timeout=120
)

# Pattern 3: Manual polling
source = await client.sources.add_url(nb_id, url)
while True:
    source = await client.sources.get(nb_id, source.id)
    if source.is_ready:
        break
    if source.is_error:
        raise Exception(f"Source failed: {source.status}")
    await asyncio.sleep(2)
```

### List All Sources in Notebook

```python
sources = await client.sources.list(notebook.id)
for source in sources:
    print(f"{source.title}: {source.status}")
```

---

## 3. Running Chats & Conversations

### Simple Question/Answer

```python
async with await NotebookLMClient.from_storage() as client:
    notebook = await client.notebooks.create("Python Research")

    # Add source
    source = await client.sources.add_url(
        notebook.id,
        "https://en.wikipedia.org/wiki/Python_(programming_language)",
        wait=True
    )

    # Ask a question
    result = await client.chat.ask(
        notebook.id,
        "What are the main features of Python?"
    )

    print(f"Q: {result.query}")
    print(f"A: {result.answer}")
    print(f"Conversation ID: {result.conversation_id}")
    print(f"Turn: {result.turn_number}")
```

### Multi-Turn Conversation

```python
# First question
result1 = await client.chat.ask(
    notebook.id,
    "What are the main features of Python?"
)
conv_id = result1.conversation_id

# Follow-up (same conversation, maintains context)
result2 = await client.chat.ask(
    notebook.id,
    "How does it compare to JavaScript?",
    conversation_id=conv_id
)

# Another follow-up
result3 = await client.chat.ask(
    notebook.id,
    "What about for data science?",
    conversation_id=conv_id
)

# Get cached conversation history
turns = client.chat.get_cached_turns(conv_id)
for turn in turns:
    print(f"Turn {turn.turn_number}: {turn.query[:50]}...")
    print(f"  → {turn.answer[:100]}...")
```

### Configuring Chat Behavior

```python
# Method 1: Predefined chat modes
from notebooklm import ChatMode

await client.chat.set_mode(notebook.id, ChatMode.LEARNING_GUIDE)
result = await client.chat.ask(notebook.id, "Explain decorators")

# Method 2: Fine-grained configuration
from notebooklm import ChatGoal, ChatResponseLength

await client.chat.configure(
    notebook.id,
    goal=ChatGoal.CUSTOM,
    response_length=ChatResponseLength.SHORTER,
    custom_prompt="You are an expert Python developer. "
                  "Provide practical code examples. "
                  "Focus on best practices."
)
result = await client.chat.ask(notebook.id, "Best error handling patterns?")
```

### Chat with Specific Sources Only

```python
# Target questions to only certain sources
sources = await client.sources.list(notebook.id)
result = await client.chat.ask(
    notebook.id,
    "Summarize this source",
    source_ids=[sources[0].id]  # Only the first source
)
```

---

## 4. Generating Audio & Artifacts

### Generate Podcast/Audio Overview

```python
async with await NotebookLMClient.from_storage() as client:
    notebook = await client.notebooks.create("Research")

    # Add sources...
    await client.sources.add_url(notebook.id, url1, wait=True)
    await client.sources.add_url(notebook.id, url2, wait=True)

    # Generate audio
    status = await client.artifacts.generate_audio(
        notebook.id,
        instructions="Focus on the key findings and debates"
    )

    print(f"Task ID: {status.task_id}")
    print(f"Status: {status.status}")  # PENDING, PROCESSING, COMPLETED
```

### Generate Audio with Debate Format

```python
from notebooklm import AudioFormat

status = await client.artifacts.generate_audio(
    notebook.id,
    audio_format=AudioFormat.DEBATE,  # Two hosts debate the topic
    instructions="Debate whether this approach violates best practices"
)
```

### Wait for Artifact Completion

```python
# Start generation
status = await client.artifacts.generate_audio(notebook.id)

# Wait for completion (polls every 10s, timeout 5 min)
final = await client.artifacts.wait_for_completion(
    notebook.id,
    status.task_id,
    timeout=300,
    poll_interval=10
)

if final.is_complete:
    print(f"Done! URL: {final.url}")
else:
    print(f"Status: {final.status}")
    print(f"Error: {final.error}")
```

### Download Audio

```python
# Download the audio file
output_path = await client.artifacts.download_audio(
    notebook.id,
    "./podcast.mp4"  # Save to this path
)
print(f"Downloaded: {output_path}")
```

### Generate Other Artifacts

```python
# Generate video
status = await client.artifacts.generate_video(
    notebook.id,
    instructions="Create an overview video"
)

# Generate report
status = await client.artifacts.generate_report(
    notebook.id,
    report_format=ReportFormat.RESEARCH  # or DOCUMENT_SUMMARY
)

# Generate quiz
status = await client.artifacts.generate_quiz(
    notebook.id,
    quantity=10,
    difficulty=QuizDifficulty.MEDIUM
)

# Generate slide deck
status = await client.artifacts.generate_slides(
    notebook.id,
    format=SlideDeckFormat.PRESENTATION,
    length=SlideDeckLength.MEDIUM
)
```

---

## 5. Real-World: Adversarial Debate Pattern

**Use case:** Run a formal debate between two approaches using NotebookLM's dual-voice audio format.

```python
async def run_debate(domain: str, sources_dict: dict, focus: str):
    """
    Create a Crucible debate: Approach A vs Approach B

    Args:
        domain: Debate title ("Security & RLS", "Authentication Flow", etc.)
        sources_dict: {title: content} pairs to upload separately
        focus: Debate instructions ("Debate whether...")
    """
    async with await NotebookLMClient.from_storage() as client:
        # 1. Create notebook
        notebook = await client.notebooks.create(f"Crucible: {domain}")
        print(f"Notebook: {notebook.id}")

        # 2. Upload sources separately (NO concatenation)
        # Rule: Each source is independent, preserves authorship
        print(f"Uploading {len(sources_dict)} sources...")
        source_ids = []
        for title, content in sources_dict.items():
            source = await client.sources.add_text(
                notebook.id,
                title=title,
                content=content,
                wait=True
            )
            source_ids.append(source.id)
            print(f"  ✅ {title} ({len(content)} chars)")

        # 3. Run chat queries (Modality 1)
        print(f"Running chat queries...")
        questions = [
            "What are the core assumptions?",
            "Where do these approaches differ?",
            "What are the tradeoffs?",
        ]
        for q in questions:
            result = await client.chat.ask(notebook.id, q)
            print(f"  Q: {q[:60]}...")
            print(f"  A: {result.answer[:100]}...\n")

        # 4. Generate audio debate (Modality 2)
        print(f"Generating audio debate...")
        print(f"  Focus: {focus}")
        print(f"  ⏳ This takes 10-20 minutes...")

        status = await client.artifacts.generate_audio(
            notebook.id,
            audio_format=AudioFormat.DEBATE,
            instructions=focus
        )

        # Wait with progress
        final = await client.artifacts.wait_for_completion(
            notebook.id,
            status.task_id,
            timeout=1200,
            poll_interval=30
        )

        if final.is_complete:
            # Download audio
            audio_file = f"debate-{domain.replace(' ', '-')}.mp4"
            path = await client.artifacts.download_audio(
                notebook.id,
                audio_file
            )
            print(f"  ✅ Audio: {path}")

            # Return notebook ID for manual inspection
            return {
                "notebook_id": notebook.id,
                "audio_file": path,
                "sources": source_ids,
                "status": "complete"
            }
        else:
            print(f"  ❌ Failed: {final.status}")
            return {"status": "failed", "error": final.error}

# Usage
result = await run_debate(
    domain="AI Co-Founder Approach",
    sources_dict={
        "APPROACH A — Questions-Only": "Pure listening model...",
        "APPROACH B — Frameworks + Ideas": "Contributor model...",
        "IDEO Design Thinking": "Empathize, ideate, prototype...",
    },
    focus="Which approach leaves the user with higher confidence? "
          "Which is more differentiated in the market?"
)
```

---

## Full End-to-End Example

```python
#!/usr/bin/env python3
import asyncio
from notebooklm import NotebookLMClient, AudioFormat

async def main():
    print("=== NotebookLM Quickstart ===\n")

    async with await NotebookLMClient.from_storage() as client:
        # 1. Create notebook
        print("1. Creating notebook...")
        nb = await client.notebooks.create("Quickstart Demo")
        print(f"   ID: {nb.id}\n")

        # 2. Add sources
        print("2. Adding sources...")
        urls = [
            "https://en.wikipedia.org/wiki/Artificial_intelligence",
            "https://en.wikipedia.org/wiki/Machine_learning"
        ]
        for url in urls:
            source = await client.sources.add_url(nb.id, url, wait=True)
            print(f"   ✅ {source.title}")

        # 3. Chat
        print("\n3. Asking questions...")
        result = await client.chat.ask(
            nb.id,
            "What are the main differences between AI and machine learning?"
        )
        print(f"   Q: {result.query}")
        print(f"   A: {result.answer[:300]}...\n")

        # 4. Generate audio
        print("4. Generating audio podcast...")
        status = await client.artifacts.generate_audio(
            nb.id,
            instructions="Create a clear overview suitable for beginners"
        )

        final = await client.artifacts.wait_for_completion(
            nb.id,
            status.task_id,
            timeout=300,
            poll_interval=10
        )

        if final.is_complete:
            path = await client.artifacts.download_audio(
                nb.id,
                "./podcast.mp4"
            )
            print(f"   ✅ Saved: {path}\n")

        # 5. Cleanup
        print("5. Cleaning up...")
        await client.notebooks.delete(nb.id)
        print("   ✅ Deleted notebook")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Exception Handling

```python
from notebooklm import (
    NotebookLMError,
    SourceAddError,
    SourceTimeoutError,
    SourceProcessingError,
    ChatError,
    ArtifactNotReadyError,
    AuthError,
)

async with await NotebookLMClient.from_storage() as client:
    try:
        source = await client.sources.add_url(nb_id, url, wait=True)
    except SourceTimeoutError as e:
        print(f"Source processing timed out: {e}")
    except SourceProcessingError as e:
        print(f"Source processing failed: {e}")
    except SourceAddError as e:
        print(f"Failed to add source: {e}")
    except AuthError:
        print("Authentication failed. Run: notebooklm login")
    except NotebookLMError as e:
        print(f"Unexpected error: {e}")
```

---

## Key Patterns

### Pattern 1: Batch Upload Sources (Parallel)

```python
# Add multiple sources quickly, then wait for all
sources = []
for url in url_list:
    source = await client.sources.add_url(nb_id, url)  # Don't wait
    sources.append(source)

# Wait for all in parallel
ready = await client.sources.wait_for_sources(
    nb_id,
    [s.id for s in sources]
)
```

### Pattern 2: Long-Running Task with Progress

```python
status = await client.artifacts.generate_audio(nb_id)

while True:
    current = await client.artifacts.get_status(nb_id, status.task_id)
    print(f"Status: {current.status}")

    if current.is_complete:
        print(f"Done! URL: {current.url}")
        break

    if current.is_error:
        print(f"Error: {current.error}")
        break

    await asyncio.sleep(10)
```

### Pattern 3: Clean Resource Cleanup

```python
try:
    async with await NotebookLMClient.from_storage() as client:
        # All work here
        pass
finally:
    # Context manager __aexit__ is automatically called
    # No need for manual cleanup
    pass
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `AuthError: "Session Expired"` | Run `notebooklm login` to refresh credentials |
| `SourceTimeoutError` | Increase timeout: `wait_timeout=300` (5 min) |
| `NotFound: "Notebook not found"` | Verify notebook ID exists: `await client.notebooks.list()` |
| "Audio generation failed" | Check that sources are READY before generating |
| Token refresh issues | Use automatic refresh: client handles this internally |

---

## Links

- **Repository:** `/Users/rodericandrews/clawd/notebooklm-py/`
- **Examples:** `/Users/rodericandrews/clawd/notebooklm-py/docs/examples/`
- **Tests:** `/Users/rodericandrews/clawd/notebooklm-py/tests/`
- **Docs:** `/Users/rodericandrews/clawd/notebooklm-py/docs/`

---

## In Thinking Foundry Context

**Use case:** Phase 4 (CRUCIBLE) — Stress-test assumptions using adversarial debate

```python
# Upload your architecture docs + opposing viewpoints
# Run chat for Modality 1 (questions)
# Generate debate audio for Modality 2 (voices)
# Result: Dual-modality validation report
```

See: `/Users/rodericandrews/_PAI/projects/work/thinking-foundry/.foundry/04-crucible.md`
