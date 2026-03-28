/**
 * Thinking Foundry — Frontend
 *
 * Audio capture via Web Audio API (MediaRecorder + AudioContext)
 * WebSocket communication with backend
 * Real-time transcription display
 * Mobile-first, works on Safari iOS
 */

// ─── State ───

let ws = null;
let mediaStream = null;
let audioContext = null;
let scriptProcessor = null;
let isRecording = false;
let isPaused = false;
let currentPhase = 0;
let reconnectCount = 0;
let connectionStartTime = null;
let timerInterval = null;
let transcript = [];

// ─── Phase metadata ───

const PHASES = {
  0: { name: 'User Stories', desc: 'What do you WANT? Define success, constraints, and acceptance criteria — you are the user of your own product.' },
  1: { name: 'MINE', desc: 'Going deeper. What\'s the REAL problem underneath what you just described? 5 Whys until we hit bedrock.' },
  2: { name: 'SCOUT', desc: 'Exploring the possibility space. Every option on the table — conventional, unconventional, adjacent.' },
  3: { name: 'ASSAY', desc: 'Filtering signal from noise. Which options actually fit YOUR constraints, values, and timeline?' },
  4: { name: 'CRUCIBLE', desc: 'Stress-testing. What breaks? What survives? War-gaming the top paths against reality.' },
  5: { name: 'AUDITOR', desc: 'Quality check. Are we confident? Any blind spots? Logical gaps? Rating our thinking.' },
  6: { name: 'PLAN', desc: 'Concrete answers. Here\'s what you do, here\'s why, here\'s the first step tomorrow morning.' },
  7: { name: 'VERIFY', desc: 'Documenting everything. Full session captured, exported, ready to act on.' }
};

// ─── DOM Elements ───

// Setup screen
const $setupScreen = document.getElementById('setup-screen');
const $sessionScreen = document.getElementById('session-screen');
const $btnBegin = document.getElementById('btn-begin');
const $setupGithub = document.getElementById('setup-github');
const $setupFiles = document.getElementById('setup-files');
const $fileList = document.getElementById('file-list');

// File upload state
let uploadedFileContents = [];

$setupFiles.addEventListener('change', async () => {
  uploadedFileContents = [];
  $fileList.innerHTML = '';
  for (const file of $setupFiles.files) {
    const text = await readFileAsText(file);
    if (text) {
      uploadedFileContents.push({ name: file.name, content: text });
      const tag = document.createElement('div');
      tag.className = 'file-tag';
      tag.textContent = file.name;
      $fileList.appendChild(tag);
    }
  }
});

async function readFileAsText(file) {
  return new Promise((resolve) => {
    if (file.name.endsWith('.pdf')) {
      // PDF: read as base64, server will handle extraction (or skip for now)
      resolve(`[PDF: ${file.name} — ${(file.size / 1024).toFixed(0)}KB]`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

// Session screen
const $status = document.getElementById('connection-status');
const $transcript = document.getElementById('transcript');
const $phaseName = document.getElementById('phase-name');
const $phaseDesc = document.getElementById('phase-desc');
const $debugPanel = document.getElementById('debug-panel');
const $connTimer = document.getElementById('connection-timer');
const $reconnCount = document.getElementById('reconnect-count');
const $btnStop = document.getElementById('btn-stop');
const $btnNextPhase = document.getElementById('btn-next-phase');
const $btnPause = document.getElementById('btn-pause');
const $pauseLabel = document.getElementById('pause-label');
const $btnExport = document.getElementById('btn-export');
const $btnDebug = document.getElementById('btn-debug');
const $exportModal = document.getElementById('export-modal');
const $exportStatus = document.getElementById('export-status');

/**
 * Collect setup config. All frameworks always loaded.
 */
function getSetupConfig() {
  return {
    github: $setupGithub.value.trim() || null,
    documents: uploadedFileContents,
    frameworks: ['stoicism', 'ideo', 'mckinsey', 'yc', 'lean', 'hormozi', 'nate-b-jones', 'indydev-dan']
  };
}

// ─── Audio Context Setup ───

/**
 * Initialize audio capture.
 * Uses ScriptProcessorNode to get raw PCM data (16-bit, 16kHz).
 * MediaRecorder doesn't give us raw PCM reliably across browsers,
 * so we use AudioContext + ScriptProcessor for the POC.
 */
async function startAudioCapture() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    // Create AudioContext at 16kHz if possible (Safari may not support)
    const sampleRate = 16000;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
    } catch {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.warn('[AUDIO] Could not set sample rate to 16kHz, using default:', audioContext.sampleRate);
    }

    const source = audioContext.createMediaStreamSource(mediaStream);

    // ScriptProcessor for raw PCM access
    // Buffer size 4096 at 16kHz = ~256ms chunks
    scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

    scriptProcessor.onaudioprocess = (event) => {
      if (!isRecording || isPaused || !ws || ws.readyState !== WebSocket.OPEN) return;

      const float32 = event.inputBuffer.getChannelData(0);

      // Convert float32 [-1, 1] to int16 PCM
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Resample if audioContext sample rate differs from 16kHz
      let pcmData;
      if (audioContext.sampleRate !== 16000) {
        pcmData = resample(int16, audioContext.sampleRate, 16000);
      } else {
        pcmData = int16;
      }

      // Send as base64 to match backend expectations
      const base64 = arrayBufferToBase64(pcmData.buffer);
      ws.send(JSON.stringify({ type: 'audio', data: base64 }));
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    isRecording = true;
    console.log('[AUDIO] Capture started at', audioContext.sampleRate, 'Hz');

  } catch (err) {
    console.error('[AUDIO] Failed to start capture:', err);
    addSystemMessage('Microphone access denied. Please allow microphone permissions.');
    throw err;
  }
}

function stopAudioCapture() {
  isRecording = false;
  if (scriptProcessor) {
    scriptProcessor.disconnect();
    scriptProcessor = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }
  console.log('[AUDIO] Capture stopped');
}

/**
 * Simple linear resampling from srcRate to dstRate
 */
function resample(int16Array, srcRate, dstRate) {
  if (srcRate === dstRate) return int16Array;
  const ratio = srcRate / dstRate;
  const newLength = Math.round(int16Array.length / ratio);
  const result = new Int16Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const low = Math.floor(srcIndex);
    const high = Math.min(low + 1, int16Array.length - 1);
    const frac = srcIndex - low;
    result[i] = Math.round(int16Array[low] * (1 - frac) + int16Array[high] * frac);
  }
  return result;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ─── Audio Playback ───

let playbackQueue = [];
let isPlaying = false;

/**
 * Play received audio from Gemini (24kHz PCM, base64 encoded)
 */
function playAudio(base64Data) {
  // When paused, discard incoming audio
  if (isPaused) return;
  playbackQueue.push(base64Data);
  if (!isPlaying) {
    processPlaybackQueue();
  }
}

async function processPlaybackQueue() {
  if (playbackQueue.length === 0) {
    isPlaying = false;
    return;
  }

  isPlaying = true;
  const base64 = playbackQueue.shift();

  try {
    // Decode base64 to PCM
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Convert int16 PCM to float32 for Web Audio
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    // Create audio buffer at 24kHz (Gemini output rate)
    const playCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = playCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = playCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(playCtx.destination);
    source.onended = () => {
      playCtx.close();
      processPlaybackQueue();
    };
    source.start(0);

  } catch (err) {
    console.error('[PLAYBACK] Error:', err);
    processPlaybackQueue();
  }
}

// ─── WebSocket ───

function connectWebSocket(setupConfig) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}`;

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('[WS] Connected to server');
    // Send session-setup with context sources + selected frameworks
    ws.send(JSON.stringify({
      type: 'session-setup',
      github: setupConfig.github,
      drive: setupConfig.drive,
      frameworks: setupConfig.frameworks
    }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    switch (msg.type) {
      case 'transcript':
        addTranscriptMessage(msg.role, msg.text);
        break;

      case 'audio':
        playAudio(msg.data);
        break;

      case 'status':
        updateStatus(msg.state);
        if (msg.phase !== undefined) {
          setPhase(msg.phase);
        }
        break;

      case 'phase':
        setPhase(msg.phase);
        break;

      case 'error':
        addSystemMessage('Error: ' + msg.message);
        break;

      default:
        console.log('[WS] Unknown message:', msg);
    }
  };

  ws.onclose = () => {
    console.log('[WS] Disconnected');
    updateStatus('disconnected');
  };

  ws.onerror = (err) => {
    console.error('[WS] Error:', err);
  };
}

// ─── UI Updates ───

function updateStatus(state) {
  $status.className = 'status ' + state;
  $status.textContent = state === 'connected' ? 'Connected'
    : state === 'reconnecting' ? 'Reconnecting...'
    : state === 'disconnected' ? 'Disconnected'
    : state === 'stopped' ? 'Stopped'
    : state;

  if (state === 'connected') {
    connectionStartTime = Date.now();
    startTimer();
  }

  if (state === 'reconnecting') {
    reconnectCount++;
    $reconnCount.textContent = `Reconnections: ${reconnectCount}`;
  }
}

function setPhase(phase) {
  currentPhase = phase;
  const info = PHASES[phase];

  $phaseName.textContent = `Phase ${phase}: ${info.name}`;
  $phaseDesc.textContent = info.desc;

  // Update phase buttons
  document.querySelectorAll('.phase-btn').forEach(btn => {
    const p = parseInt(btn.dataset.phase);
    btn.classList.toggle('active', p === phase);
    if (p < phase) btn.classList.add('visited');
  });

  addSystemMessage(`Entering Phase ${phase}: ${info.name} — ${info.desc}`);
}

function addTranscriptMessage(role, text) {
  transcript.push({ role, text, timestamp: new Date().toISOString() });

  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = `<div class="role">${role === 'user' ? 'You' : 'Foundry'}</div>${escapeHtml(text)}`;
  $transcript.appendChild(div);
  $transcript.scrollTop = $transcript.scrollHeight;
}

function addSystemMessage(text) {
  const div = document.createElement('div');
  div.className = 'system-msg';
  div.textContent = text;
  $transcript.appendChild(div);
  $transcript.scrollTop = $transcript.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Timer ───

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!connectionStartTime) return;
    const elapsed = Math.floor((Date.now() - connectionStartTime) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    $connTimer.textContent = `${mins}:${secs}`;

    // Warn at 13 minutes
    if (elapsed >= 780 && elapsed < 782) {
      $connTimer.style.color = '#f97316';
    }
    // Alert at 14 minutes
    if (elapsed >= 840 && elapsed < 842) {
      $connTimer.style.color = '#ef4444';
    }
  }, 1000);
}

// ─── Event Handlers ───

// Begin session: transition from setup screen to session screen
$btnBegin.addEventListener('click', async () => {
  const config = getSetupConfig();

  // Disable button to prevent double-clicks
  $btnBegin.disabled = true;
  $btnBegin.textContent = 'Connecting...';

  try {
    await startAudioCapture();

    // Transition screens
    $setupScreen.classList.add('hidden');
    $sessionScreen.classList.remove('hidden');

    connectWebSocket(config);
    addSystemMessage('Session started. Loading context and connecting...');
  } catch (err) {
    addSystemMessage('Failed to start: ' + err.message);
    $btnBegin.disabled = false;
    $btnBegin.textContent = 'Start Session';
  }
});

$btnStop.addEventListener('click', () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'stop' }));
    ws.close();
  }
  stopAudioCapture();
  clearInterval(timerInterval);
  isPaused = false;

  // Return to setup screen
  $sessionScreen.classList.add('hidden');
  $setupScreen.classList.remove('hidden');
  $btnBegin.disabled = false;
  $btnBegin.textContent = 'Start Session';

  $btnPause.classList.remove('paused');
  $pauseLabel.textContent = 'Pause';
});

$btnPause.addEventListener('click', () => {
  isPaused = !isPaused;

  if (isPaused) {
    $btnPause.classList.add('paused');
    $pauseLabel.textContent = 'Resume';
    // Clear any queued audio playback
    playbackQueue = [];
    addSystemMessage('Session paused. Audio muted.');
  } else {
    $btnPause.classList.remove('paused');
    $pauseLabel.textContent = 'Pause';
    addSystemMessage('Session resumed.');
  }
});

$btnNextPhase.addEventListener('click', () => {
  if (currentPhase >= 7) return;
  const next = currentPhase + 1;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'phase', phase: next }));
  }
});

// Phase button clicks
document.querySelectorAll('.phase-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const phase = parseInt(btn.dataset.phase);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'phase', phase }));
    }
  });
});

// Debug toggle
$btnDebug.addEventListener('click', () => {
  $debugPanel.classList.toggle('hidden');
});

// ─── Export ───

$btnExport.addEventListener('click', () => {
  $exportModal.classList.remove('hidden');
});

document.getElementById('btn-export-cancel').addEventListener('click', () => {
  $exportModal.classList.add('hidden');
});

document.getElementById('btn-export-github').addEventListener('click', async () => {
  const name = document.getElementById('export-name').value || 'Thinking Session';
  $exportStatus.textContent = 'Exporting to GitHub...';

  try {
    const fullTranscript = transcript.map(t => {
      const role = t.role === 'user' ? 'User' : 'Foundry';
      return `**${role}**: ${t.text}`;
    }).join('\n\n');

    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionName: name,
        transcript: fullTranscript,
        phases: Array.from(new Set(transcript.map(() => currentPhase)))
      })
    });

    const data = await res.json();
    if (data.ok) {
      $exportStatus.innerHTML = `Exported! <a href="${data.issueUrl}" target="_blank" style="color: var(--accent)">View Issue</a>`;
    } else {
      $exportStatus.textContent = 'Error: ' + data.error;
    }
  } catch (err) {
    $exportStatus.textContent = 'Error: ' + err.message;
  }
});

document.getElementById('btn-export-drive').addEventListener('click', async () => {
  const name = document.getElementById('export-name').value || 'Thinking Session';
  const email = document.getElementById('export-email').value;
  $exportStatus.textContent = 'Creating Drive folder...';

  try {
    const res = await fetch('/api/drive/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionName: name,
        userEmail: email,
        phaseOutputs: {}
      })
    });

    const data = await res.json();
    if (data.ok) {
      $exportStatus.innerHTML = `Folder created! <a href="${data.folderUrl}" target="_blank" style="color: var(--accent)">Open in Drive</a>`;
    } else {
      $exportStatus.textContent = 'Error: ' + data.error;
    }
  } catch (err) {
    $exportStatus.textContent = 'Error: ' + err.message;
  }
});
