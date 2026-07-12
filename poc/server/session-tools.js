/**
 * Session control tools — structured signaling between the AI and the server.
 *
 * The model talks to the HUMAN in audio, but signals the MACHINE through
 * function calls. Previously phase transitions and intent mode were detected
 * by regex over voice transcripts ("let's move to phase 2", "[MODE:commit]"),
 * which is lossy: transcription mangles tags and phrasing varies. Tool calls
 * are exact, and the tool RESPONSE feeds back into the conversation — so a
 * blocked transition ("confidence 5 < required 8") is something the AI hears
 * and acts on, closing the loop on the confidence gate.
 *
 * The regex path in phase-transition.js remains as a fallback for models
 * that narrate instead of calling tools.
 */

const SESSION_CONTROL_DECLARATIONS = [
  {
    name: 'advance_phase',
    description:
      'Advance the session to the next phase (or jump to a specific phase) when you judge the current phase complete. ' +
      'This is a silent control signal — never announce the tool call aloud. ' +
      'If the response says "blocked", your confidence is below the required threshold: keep working the current phase, then retry.',
    parameters: {
      type: 'OBJECT',
      properties: {
        to_phase: {
          type: 'INTEGER',
          description: 'Target phase number 0-7 (0=User Stories, 1=MINE, 2=SCOUT, 3=ASSAY, 4=CRUCIBLE, 5=AUDITOR, 6=PLAN, 7=VERIFY)',
        },
        confidence: {
          type: 'INTEGER',
          description: 'Your confidence 1-10 that the current phase achieved its goal. Be honest — low confidence blocks the transition, which is the system working as designed.',
        },
        carry_forward: {
          type: 'STRING',
          description: '3-5 sentence summary of this phase\'s findings, written for your future self in the next phase: root cause, key constraints, decisions made, open questions.',
        },
        reason: {
          type: 'STRING',
          description: 'One sentence: why this phase is complete.',
        },
      },
      required: ['to_phase', 'confidence', 'carry_forward'],
    },
  },
  {
    name: 'set_intent_mode',
    description:
      'Declare the user\'s intent mode once you detect it (within the first 2-3 exchanges). ' +
      'Silent control signal — confirm the mode to the user in speech, but never mention the tool. ' +
      'Adjusts the confidence threshold for phase transitions: explore=5, research=6, commit=8.',
    parameters: {
      type: 'OBJECT',
      properties: {
        mode: {
          type: 'STRING',
          description: 'One of: explore (just thinking, wide and light), research (structured analysis), commit (a real decision with a deadline).',
        },
      },
      required: ['mode'],
    },
  },
];

const SESSION_CONTROL_TOOL_NAMES = new Set(SESSION_CONTROL_DECLARATIONS.map((d) => d.name));

module.exports = { SESSION_CONTROL_DECLARATIONS, SESSION_CONTROL_TOOL_NAMES };
