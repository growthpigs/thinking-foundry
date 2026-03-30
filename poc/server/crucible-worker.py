#!/usr/bin/env python3
"""
NotebookLM Crucible Audio Generator — teng-lin/notebooklm-py

Called by Node.js via subprocess.
Reads session data from stdin (JSON), outputs result to stdout (JSON).

Usage: echo '{"session_id":"...","session_name":"...","sources":[...]}' | python3 crucible-worker.py

Requires:
  - pip install notebooklm-py (teng-lin/notebooklm-py)
  - ~/.notebooklm/storage_state.json (from: notebooklm login)
"""

import sys
import json
import asyncio
import os
import tempfile

try:
    from notebooklm import NotebookLMClient, AudioFormat
except ImportError:
    json.dump({
        "status": "failed",
        "error": "notebooklm-py not installed. Run: pip install notebooklm-py"
    }, sys.stdout)
    sys.exit(1)


async def generate(data):
    session_id = data["session_id"]
    session_name = data["session_name"]
    sources = data["sources"]  # [{phase, phase_name, text}]
    output_dir = data.get("output_dir", tempfile.gettempdir())

    # Check auth exists
    auth_path = os.path.expanduser("~/.notebooklm/storage_state.json")
    if not os.path.exists(auth_path):
        return {
            "status": "failed",
            "error": "NotebookLM auth missing. Run: notebooklm login"
        }

    async with await NotebookLMClient.from_storage() as client:
        # 1. Create notebook
        notebook = await client.notebooks.create(f"Crucible: {session_name}")
        print(f"[CRUCIBLE] Notebook created: {notebook.id}", file=sys.stderr)

        # 2. Upload each phase summary as a separate source
        for source in sources:
            await client.sources.add_text(
                notebook.id,
                title=f"Phase {source['phase']}: {source['phase_name']}",
                content=source["text"],
                wait=True
            )
            print(f"[CRUCIBLE] Source added: Phase {source['phase']}", file=sys.stderr)

        # 3. Generate audio debate
        print("[CRUCIBLE] Generating audio debate...", file=sys.stderr)
        status = await client.artifacts.generate_audio(
            notebook.id,
            audio_format=AudioFormat.DEBATE,
            instructions=(
                f"Create a debate about the thinking session '{session_name}'. "
                "Two hosts should discuss the key findings, challenge assumptions, "
                "and evaluate whether the conclusions are sound. "
                "Focus on what was decided, what was uncertain, and what the user "
                "should watch out for."
            )
        )

        # 4. Wait for completion (up to 10 minutes)
        final = await client.artifacts.wait_for_completion(
            notebook.id,
            status.task_id,
            timeout=600,
            poll_interval=15
        )

        if not final.is_complete:
            return {
                "status": "failed",
                "error": f"Audio generation failed: {final.status}",
                "notebook_id": notebook.id
            }

        # 5. Download the MP4 audio file
        output_path = os.path.join(output_dir, f"crucible-{session_id}.mp4")
        await client.artifacts.download_audio(notebook.id, output_path)
        print(f"[CRUCIBLE] Audio downloaded: {output_path}", file=sys.stderr)

        return {
            "status": "success",
            "audio_path": output_path,
            "notebook_id": notebook.id
        }


if __name__ == "__main__":
    data = json.load(sys.stdin)
    result = asyncio.run(generate(data))
    json.dump(result, sys.stdout)
