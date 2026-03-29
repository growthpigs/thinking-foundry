#!/usr/bin/env python3
"""
Quick Reference Snippets for notebooklm-py
Copy and adapt these patterns for your use case.
"""

import asyncio
from notebooklm import (
    NotebookLMClient,
    AudioFormat,
    ChatMode,
    ChatGoal,
    ChatResponseLength,
)


# ============================================================================
# SNIPPET 1: Simple Setup & List Notebooks
# ============================================================================

async def list_notebooks_example():
    """Basic: Load client and list existing notebooks."""
    async with await NotebookLMClient.from_storage() as client:
        notebooks = await client.notebooks.list()
        for nb in notebooks:
            print(f"{nb.title} ({nb.id}) — {nb.num_sources} sources")


# ============================================================================
# SNIPPET 2: Create Notebook + Add URL Source
# ============================================================================

async def create_and_add_url():
    """Create a notebook and add a URL source."""
    async with await NotebookLMClient.from_storage() as client:
        # Create notebook
        notebook = await client.notebooks.create("My Research")

        # Add URL (wait for processing)
        source = await client.sources.add_url(
            notebook.id,
            "https://en.wikipedia.org/wiki/Python_(programming_language)",
            wait=True
        )

        print(f"Notebook: {notebook.id}")
        print(f"Source: {source.title} ({source.status})")
        return notebook.id


# ============================================================================
# SNIPPET 3: Upload Multiple Files in Parallel
# ============================================================================

async def upload_multiple_files():
    """Add multiple files efficiently by uploading in parallel."""
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.create("Multi-File Research")

        # Add files without waiting (fire and forget)
        files = [
            "/path/to/doc1.pdf",
            "/path/to/doc2.md",
            "/path/to/doc3.txt"
        ]

        sources = []
        for file_path in files:
            source = await client.sources.add_file(nb.id, file_path)
            sources.append(source)

        # Now wait for all to be ready (in parallel)
        ready_sources = await client.sources.wait_for_sources(
            nb.id,
            [s.id for s in sources],
            timeout=300
        )

        for s in ready_sources:
            print(f"✅ {s.title}")

        return nb.id


# ============================================================================
# SNIPPET 4: Upload Text Sources (Useful for Dynamic Content)
# ============================================================================

async def upload_text_content():
    """Add text content directly (useful for markdown, concatenated docs)."""
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.create("Text Content Research")

        # Upload markdown
        md_content = """
# My Architecture

## Overview
This is a description...

## Key Points
- Point 1
- Point 2
        """

        source = await client.sources.add_text(
            nb.id,
            title="Architecture Markdown",
            content=md_content,
            wait=True
        )

        print(f"Uploaded: {source.title}")
        return nb.id


# ============================================================================
# SNIPPET 5: Simple Chat
# ============================================================================

async def simple_chat():
    """Ask a single question about notebook content."""
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.create("Chat Demo")

        # Add source
        await client.sources.add_url(
            nb.id,
            "https://en.wikipedia.org/wiki/Artificial_intelligence",
            wait=True
        )

        # Ask question
        result = await client.chat.ask(
            nb.id,
            "What is the history of AI?"
        )

        print(f"Question: {result.query}")
        print(f"\nAnswer:\n{result.answer}")

        return nb.id


# ============================================================================
# SNIPPET 6: Multi-Turn Conversation
# ============================================================================

async def multi_turn_chat():
    """Have a multi-turn conversation (follow-ups in same context)."""
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.create("Conversation Demo")

        await client.sources.add_url(
            nb.id,
            "https://en.wikipedia.org/wiki/Machine_learning",
            wait=True
        )

        # Question 1
        r1 = await client.chat.ask(nb.id, "What is machine learning?")
        conv_id = r1.conversation_id

        print(f"Turn 1: {r1.answer[:200]}...\n")

        # Question 2 (follow-up in same conversation)
        r2 = await client.chat.ask(
            nb.id,
            "How does it differ from AI?",
            conversation_id=conv_id
        )

        print(f"Turn 2: {r2.answer[:200]}...\n")

        # Question 3
        r3 = await client.chat.ask(
            nb.id,
            "What are real-world applications?",
            conversation_id=conv_id
        )

        print(f"Turn 3: {r3.answer[:200]}...")

        # Get conversation history
        turns = client.chat.get_cached_turns(conv_id)
        print(f"\nTotal turns in conversation: {len(turns)}")

        return nb.id


# ============================================================================
# SNIPPET 7: Configure Chat Mode
# ============================================================================

async def configured_chat():
    """Chat with custom configuration (persona, response length)."""
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.create("Configured Chat")

        await client.sources.add_url(
            nb.id,
            "https://en.wikipedia.org/wiki/Python_(programming_language)",
            wait=True
        )

        # Set custom persona
        await client.chat.configure(
            nb.id,
            goal=ChatGoal.CUSTOM,
            response_length=ChatResponseLength.SHORTER,
            custom_prompt=(
                "You are an expert Python developer with 10+ years experience. "
                "Provide concise answers with practical code examples. "
                "Focus on production-ready best practices."
            )
        )

        # Now chat with this configuration
        result = await client.chat.ask(
            nb.id,
            "What are the best practices for error handling?"
        )

        print(f"Answer: {result.answer}")

        return nb.id


# ============================================================================
# SNIPPET 8: Generate Audio (Podcast)
# ============================================================================

async def generate_audio():
    """Generate a podcast audio overview."""
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.create("Audio Demo")

        # Add some sources
        await client.sources.add_url(
            nb.id,
            "https://en.wikipedia.org/wiki/Quantum_computing",
            wait=True
        )

        # Generate audio
        print("Starting audio generation...")
        status = await client.artifacts.generate_audio(
            nb.id,
            instructions="Create a beginner-friendly overview of quantum computing"
        )

        # Wait for completion
        print("Waiting for audio (this takes 10-20 minutes)...")
        final = await client.artifacts.wait_for_completion(
            nb.id,
            status.task_id,
            timeout=1200,
            poll_interval=30
        )

        if final.is_complete:
            # Download the audio
            path = await client.artifacts.download_audio(
                nb.id,
                "./podcast.mp4"
            )
            print(f"✅ Audio saved: {path}")
        else:
            print(f"❌ Generation failed: {final.status}")

        return nb.id


# ============================================================================
# SNIPPET 9: Generate Audio with Debate Format
# ============================================================================

async def generate_debate():
    """Generate a debate between two perspectives."""
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.create("Debate Demo")

        # Upload two different perspectives
        await client.sources.add_text(
            nb.id,
            title="PERSPECTIVE A: Server-Side Rendering",
            content="""
Server-side rendering provides:
- Faster initial load
- Better SEO
- Simpler architecture
- Better for non-JS browsers
            """,
            wait=True
        )

        await client.sources.add_text(
            nb.id,
            title="PERSPECTIVE B: Client-Side Rendering",
            content="""
Client-side rendering provides:
- Better UX/interactivity
- Reduced server load
- Offline capability
- Modern development experience
            """,
            wait=True
        )

        # Generate debate
        print("Generating debate audio...")
        status = await client.artifacts.generate_audio(
            nb.id,
            audio_format=AudioFormat.DEBATE,
            instructions=(
                "Debate the tradeoffs between server-side and client-side rendering. "
                "Discuss when each approach wins. Be technical but accessible."
            )
        )

        # Wait
        final = await client.artifacts.wait_for_completion(
            nb.id,
            status.task_id,
            timeout=1200
        )

        if final.is_complete:
            path = await client.artifacts.download_audio(
                nb.id,
                "./debate.mp4"
            )
            print(f"✅ Debate audio: {path}")

        return nb.id


# ============================================================================
# SNIPPET 10: Crucible Pattern (Formal Adversarial Test)
# ============================================================================

async def crucible_pattern(domain_name: str, sources_dict: dict):
    """
    Run a formal Crucible test:
    1. Upload sources separately (no concatenation)
    2. Run chat queries (test assumptions)
    3. Generate debate audio (two perspectives clash)
    4. Download and analyze results
    """
    async with await NotebookLMClient.from_storage() as client:
        # 1. Create notebook per domain
        nb = await client.notebooks.create(f"Crucible: {domain_name}")
        print(f"Notebook: {nb.id}\n")

        # 2. Upload sources SEPARATELY (preserve authorship, enable fact-checking)
        print("Uploading sources...")
        source_ids = []
        for title, content in sources_dict.items():
            source = await client.sources.add_text(
                nb.id,
                title=title,
                content=content,
                wait=True
            )
            source_ids.append(source.id)
            print(f"  ✅ {title} ({len(content)} chars)")

        # 3. Run chat queries (Modality 1: Q&A)
        print("\nChat queries (testing assumptions)...")
        questions = [
            "What are the core assumptions?",
            "Where is the evidence weakest?",
            "What could we be missing?",
        ]
        for q in questions:
            r = await client.chat.ask(nb.id, q)
            print(f"  Q: {q}")
            print(f"  A: {r.answer[:150]}...\n")

        # 4. Generate debate (Modality 2: dual voices)
        print("Generating debate audio...")
        status = await client.artifacts.generate_audio(
            nb.id,
            audio_format=AudioFormat.DEBATE,
            instructions=f"Debate the merits and weaknesses of: {domain_name}"
        )

        final = await client.artifacts.wait_for_completion(
            nb.id,
            status.task_id,
            timeout=1200
        )

        if final.is_complete:
            audio_file = f"crucible-{domain_name.replace(' ', '-').lower()}.mp4"
            path = await client.artifacts.download_audio(nb.id, audio_file)
            print(f"  ✅ Audio: {path}")

            return {
                "notebook_id": nb.id,
                "audio_file": path,
                "sources": source_ids,
                "status": "complete"
            }
        else:
            print(f"  ❌ Failed: {final.status}")
            return {"status": "failed"}


# ============================================================================
# SNIPPET 11: Error Handling
# ============================================================================

async def error_handling_example():
    """Demonstrate proper error handling."""
    from notebooklm import (
        SourceTimeoutError,
        SourceProcessingError,
        SourceAddError,
        AuthError,
        NotebookLMError,
    )

    try:
        async with await NotebookLMClient.from_storage() as client:
            nb = await client.notebooks.create("Error Demo")

            # Example: Source timeout
            try:
                source = await client.sources.add_url(
                    nb.id,
                    "https://example.com",
                    wait=True,
                    wait_timeout=30  # 30 seconds
                )
            except SourceTimeoutError as e:
                print(f"⚠️  Source took too long: {e}")
            except SourceProcessingError as e:
                print(f"❌ Source processing failed: {e}")
            except SourceAddError as e:
                print(f"❌ Failed to add source: {e}")

            # Example: Auth failure
            try:
                notebooks = await client.notebooks.list()
            except AuthError:
                print("❌ Authentication failed. Run: notebooklm login")

    except NotebookLMError as e:
        print(f"❌ Unexpected error: {e}")


# ============================================================================
# SNIPPET 12: Cleanup
# ============================================================================

async def cleanup_notebooks():
    """Delete test notebooks."""
    async with await NotebookLMClient.from_storage() as client:
        notebooks = await client.notebooks.list()

        # Delete notebooks matching a pattern
        for nb in notebooks:
            if "Demo" in nb.title or "Test" in nb.title:
                await client.notebooks.delete(nb.id)
                print(f"Deleted: {nb.title}")


# ============================================================================
# Main: Run Examples
# ============================================================================

async def main():
    """Run examples (choose which ones to uncomment)."""

    # Uncomment to run:
    # await list_notebooks_example()
    # nb_id = await create_and_add_url()
    # nb_id = await upload_multiple_files()
    # nb_id = await simple_chat()
    # nb_id = await multi_turn_chat()
    # nb_id = await generate_audio()
    # nb_id = await generate_debate()

    # Full crucible example
    result = await crucible_pattern(
        domain_name="API Design Approach",
        sources_dict={
            "APPROACH A: REST": "REST principles...",
            "APPROACH B: GraphQL": "GraphQL model...",
            "INDUSTRY STANDARDS": "What the market uses...",
        }
    )

    print(f"\nCrucible Result: {result}")


if __name__ == "__main__":
    asyncio.run(main())
