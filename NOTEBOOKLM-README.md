# NotebookLM Python Library — Quick Navigation

This directory contains complete documentation for using **teng-lin/notebooklm-py** to interact with Google NotebookLM programmatically.

## Files in This Directory

| File | Purpose |
|------|---------|
| **NOTEBOOKLM-GUIDE.md** | Complete API reference — read this first |
| **NOTEBOOKLM-SNIPPETS.py** | Copy/paste code examples for every common task |
| **NOTEBOOKLM-SETUP.md** | Installation, authentication, troubleshooting |
| **NOTEBOOKLM-README.md** | This file — navigation guide |

## Quick Start (5 minutes)

```bash
# 1. Authenticate
notebooklm login

# 2. Create a simple script
cat > test.py << 'SCRIPT'
import asyncio
from notebooklm import NotebookLMClient

async def main():
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.create("Test")
        print(f"Created: {nb.id}")

asyncio.run(main())
SCRIPT

# 3. Run it
python3 test.py
```

## The 4 Most Common Tasks

### 1. Create a Notebook & Add Sources

**See:** `NOTEBOOKLM-GUIDE.md` → "1. Creating a Notebook" + "2. Uploading Documents"

**Also see:** `NOTEBOOKLM-SNIPPETS.py` → Snippets 1-4

```python
async with await NotebookLMClient.from_storage() as client:
    nb = await client.notebooks.create("My Research")
    source = await client.sources.add_url(nb.id, "https://example.com", wait=True)
```

### 2. Ask Questions (Chat)

**See:** `NOTEBOOKLM-GUIDE.md` → "3. Running Chats & Conversations"

**Also see:** `NOTEBOOKLM-SNIPPETS.py` → Snippets 5-7

```python
result = await client.chat.ask(nb.id, "What is this about?")
print(result.answer)
```

### 3. Generate Audio (Podcast)

**See:** `NOTEBOOKLM-GUIDE.md` → "4. Generating Audio & Artifacts"

**Also see:** `NOTEBOOKLM-SNIPPETS.py` → Snippet 8

```python
status = await client.artifacts.generate_audio(nb.id)
final = await client.artifacts.wait_for_completion(nb.id, status.task_id)
```

### 4. Run a Debate (Crucible)

**See:** `NOTEBOOKLM-GUIDE.md` → "5. Real-World: Adversarial Debate Pattern"

**Also see:** `NOTEBOOKLM-SNIPPETS.py` → Snippet 10

```python
await client.artifacts.generate_audio(
    nb.id,
    audio_format=AudioFormat.DEBATE,
    instructions="Debate Approach A vs Approach B"
)
```

## Where It's Installed

- **Source repo:** `/Users/rodericandrews/clawd/notebooklm-py/`
- **Installed package:** `/Users/rodericandrews/clawd/.venv/lib/python3.14/site-packages/notebooklm/`
- **Your auth:** `~/.notebooklm/storage_state.json`

## API Quick Reference

```python
# Notebooks
client.notebooks.list()              # Get all notebooks
client.notebooks.create("Title")     # Create new notebook
client.notebooks.delete(nb_id)       # Delete notebook

# Sources (documents)
client.sources.add_url(nb_id, url, wait=True)
client.sources.add_file(nb_id, "/path/to/file.pdf", wait=True)
client.sources.add_text(nb_id, "Title", "Content", wait=True)
client.sources.list(nb_id)
client.sources.wait_until_ready(nb_id, source_id)
client.sources.wait_for_sources(nb_id, [id1, id2, id3])

# Chat
client.chat.ask(nb_id, "Question?")
client.chat.ask(nb_id, "Follow-up?", conversation_id=conv_id)
client.chat.configure(nb_id, goal=ChatGoal.CUSTOM, ...)
client.chat.set_mode(nb_id, ChatMode.LEARNING_GUIDE)
client.chat.get_cached_turns(conversation_id)

# Artifacts (AI-generated content)
client.artifacts.generate_audio(nb_id, instructions="...")
client.artifacts.generate_video(nb_id)
client.artifacts.generate_report(nb_id)
client.artifacts.generate_quiz(nb_id, quantity=10)
client.artifacts.wait_for_completion(nb_id, task_id)
client.artifacts.download_audio(nb_id, "./podcast.mp4")
```

## Common Patterns

### Pattern: Batch Upload + Wait

```python
# Add multiple sources, then wait for all
sources = [
    await client.sources.add_url(nb_id, url) for url in url_list
]
ready = await client.sources.wait_for_sources(
    nb_id, [s.id for s in sources]
)
```

### Pattern: Multi-Turn Chat

```python
r1 = await client.chat.ask(nb_id, "Q1?")
conv_id = r1.conversation_id

r2 = await client.chat.ask(nb_id, "Follow-up?", conversation_id=conv_id)
r3 = await client.chat.ask(nb_id, "Another?", conversation_id=conv_id)
```

### Pattern: Long-Running Task

```python
status = await client.artifacts.generate_audio(nb_id)
final = await client.artifacts.wait_for_completion(
    nb_id,
    status.task_id,
    timeout=1200,
    poll_interval=30
)
```

### Pattern: Error Handling

```python
from notebooklm import SourceTimeoutError, SourceProcessingError

try:
    source = await client.sources.add_url(nb_id, url, wait=True)
except SourceTimeoutError:
    print("Source took too long")
except SourceProcessingError:
    print("Source processing failed")
```

## For Thinking Foundry Crucible Tests

**Phase 4 (CRUCIBLE)** uses NotebookLM for adversarial testing:

1. **Upload sources separately** (preserves each viewpoint)
   ```python
   await client.sources.add_text(nb_id, "APPROACH A", content_a, wait=True)
   await client.sources.add_text(nb_id, "APPROACH B", content_b, wait=True)
   ```

2. **Run chat queries** (test each assumption)
   ```python
   r = await client.chat.ask(nb_id, "What could break here?")
   ```

3. **Generate debate audio** (dual voices)
   ```python
   status = await client.artifacts.generate_audio(
       nb_id,
       audio_format=AudioFormat.DEBATE,
       instructions="Debate which approach wins"
   )
   ```

4. **Download + analyze results**
   ```python
   path = await client.artifacts.download_audio(nb_id, "./debate.mp4")
   ```

See: `/Users/rodericandrews/_PAI/operations/the-foundry/bin/crucible.py` for full example.

## Troubleshooting

| Issue | See |
|-------|-----|
| "Session Expired" | NOTEBOOKLM-SETUP.md → Troubleshooting |
| Can't import notebooklm | NOTEBOOKLM-SETUP.md → Verify Installation |
| Source processing timeout | NOTEBOOKLM-GUIDE.md → Wait for Source Processing |
| Audio generation failed | NOTEBOOKLM-GUIDE.md → Generate Audio |
| Need custom configuration | NOTEBOOKLM-GUIDE.md → Configuring Chat Behavior |

## Real-World Examples

**In this repo:**
- `NOTEBOOKLM-SNIPPETS.py` — 12 working examples
- `/Users/rodericandrews/_PAI/operations/the-foundry/bin/crucible.py` — Full Crucible executor
- `/Users/rodericandrews/clawd/notebooklm-py/docs/examples/` — Official examples (quickstart, chat, research, etc.)

## Links

- **Source:** `https://github.com/teng-lin/notebooklm-py`
- **Package:** `/Users/rodericandrews/clawd/notebooklm-py/`
- **Docs:** `/Users/rodericandrews/clawd/notebooklm-py/docs/`
- **Tests:** `/Users/rodericandrews/clawd/notebooklm-py/tests/`

## Next Steps

1. **Read NOTEBOOKLM-SETUP.md** — Set up authentication
2. **Read NOTEBOOKLM-GUIDE.md** — Learn the full API
3. **Copy from NOTEBOOKLM-SNIPPETS.py** — Start coding
4. **Check Thinking Foundry Crucible** — See it in action for Phase 4 testing

---

**Last Updated:** 2026-03-29
**Library Version:** 0.0.25+
**Python:** 3.10+
