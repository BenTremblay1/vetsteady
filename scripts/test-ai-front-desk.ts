/**
 * AI Front Desk — Test Scenarios
 *
 * Tests the intent classifier (classifyInboundSms) directly with 8 scenarios.
 * Does NOT send real SMS or hit the database.
 *
 * Run with: npx tsx scripts/test-ai-front-desk.ts
 *
 * Requires: ANTHROPIC_API_KEY in .env.local
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { classifyInboundSms, FrontDeskIntent } from '../src/lib/ai/front-desk';

const BASE_CONTEXT = {
  clientFirstName: 'Sarah',
  petName: 'Mochi',
  appointmentType: 'Annual Wellness Exam',
  appointmentDate: 'Tuesday, April 8',
  appointmentTime: '10:30 AM',
  practiceName: 'Happy Paws Veterinary',
};

interface TestCase {
  name: string;
  message: string;
  expectedIntent: FrontDeskIntent;
}

const TEST_CASES: TestCase[] = [
  {
    name: '1. Explicit CONFIRM keyword',
    message: 'CONFIRM',
    expectedIntent: 'confirm',
  },
  {
    name: '2. Natural confirm ("yes, we will be there")',
    message: "Yes, we'll be there! See you Tuesday.",
    expectedIntent: 'confirm',
  },
  {
    name: '3. Explicit CANCEL keyword',
    message: 'CANCEL',
    expectedIntent: 'cancel',
  },
  {
    name: '4. Natural cancel ("something came up")',
    message: "Hi, something came up and we need to cancel Mochi's appointment this Tuesday.",
    expectedIntent: 'cancel',
  },
  {
    name: '5. Reschedule request ("can we move it")',
    message: "Can we move the appointment to next week? Tuesday doesn't work anymore.",
    expectedIntent: 'reschedule',
  },
  {
    name: '6. Running late ("on my way but stuck in traffic")',
    message: "On my way but stuck in traffic — going to be about 15 minutes late, sorry!",
    expectedIntent: 'late',
  },
  {
    name: '7. Question ("what to bring")',
    message: "Do I need to bring anything special for the wellness exam? Any paperwork?",
    expectedIntent: 'question',
  },
  {
    name: '8. Ambiguous / escalate ("random message")',
    message: "Okay but what about the thing we discussed last time about the food?",
    expectedIntent: 'escalate',
  },
];

const PASS = '\x1b[32m✅ PASS\x1b[0m';
const FAIL = '\x1b[31m❌ FAIL\x1b[0m';
const WARN = '\x1b[33m⚠️  SOFT\x1b[0m';

// Intents where a mismatch is "soft" (close-enough acceptable)
const SOFT_PAIRS: [FrontDeskIntent, FrontDeskIntent][] = [
  ['question', 'escalate'],
  ['escalate', 'question'],
];

function isSoftMatch(expected: FrontDeskIntent, actual: FrontDeskIntent): boolean {
  return SOFT_PAIRS.some(([a, b]) => a === expected && b === actual);
}

async function runTests() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('\x1b[31mERROR: ANTHROPIC_API_KEY not set in .env.local\x1b[0m');
    process.exit(1);
  }

  console.log('\n\x1b[1m=== AI Front Desk — Intent Classification Tests ===\x1b[0m\n');
  console.log(`Model: claude-haiku-4-5-20251001`);
  console.log(`Context: ${BASE_CONTEXT.clientFirstName}'s pet ${BASE_CONTEXT.petName} @ ${BASE_CONTEXT.practiceName}`);
  console.log(`Appointment: ${BASE_CONTEXT.appointmentDate} at ${BASE_CONTEXT.appointmentTime}\n`);
  console.log('─'.repeat(70));

  let passed = 0;
  let soft = 0;
  let failed = 0;

  for (const tc of TEST_CASES) {
    process.stdout.write(`${tc.name}\n  Message: "${tc.message}"\n  `);

    try {
      const result = await classifyInboundSms({ ...BASE_CONTEXT, messageText: tc.message });

      const exact = result.intent === tc.expectedIntent;
      const soft_ = !exact && isSoftMatch(tc.expectedIntent, result.intent);

      if (exact) {
        passed++;
        console.log(`${PASS}  intent=${result.intent}`);
      } else if (soft_) {
        soft++;
        console.log(`${WARN}  intent=${result.intent} (expected ${tc.expectedIntent} — close enough)`);
      } else {
        failed++;
        console.log(`${FAIL}  intent=${result.intent} (expected ${tc.expectedIntent})`);
      }

      console.log(`  Reply: "${result.reply}"\n`);
    } catch (err: any) {
      failed++;
      console.log(`${FAIL}  ERROR: ${err?.message}\n`);
    }
  }

  console.log('─'.repeat(70));
  console.log(`\nResults: ${passed} passed, ${soft} soft-match, ${failed} failed (out of ${TEST_CASES.length} tests)\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
