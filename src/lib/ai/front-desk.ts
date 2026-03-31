/**
 * AI Front Desk — Intent Classification
 *
 * Uses Claude Haiku to classify inbound SMS messages from clients
 * and generate warm, on-brand replies.
 *
 * Intents:
 *   confirm     — client confirms they'll be there
 *   cancel      — client wants to cancel
 *   reschedule  — client wants a different time/date
 *   late        — client says they're running late
 *   question    — client has a question about the visit
 *   escalate    — unclear or needs human attention
 */

import Anthropic from '@anthropic-ai/sdk';

// Lazy init so the key is read at call time, not module load time
let _anthropic: Anthropic | null = null;
function getClient() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

export type FrontDeskIntent =
  | 'confirm'
  | 'cancel'
  | 'reschedule'
  | 'late'
  | 'question'
  | 'escalate';

export interface FrontDeskResult {
  intent: FrontDeskIntent;
  reply: string;
}

export interface FrontDeskContext {
  messageText: string;
  clientFirstName: string;
  petName: string;
  appointmentType: string;
  appointmentDate: string; // human-readable e.g. "Tuesday, April 1"
  appointmentTime: string; // human-readable e.g. "10:00 AM"
  practiceName: string;
}

export async function classifyInboundSms(ctx: FrontDeskContext): Promise<FrontDeskResult> {
  const systemPrompt = `You are the AI front desk for ${ctx.practiceName}, a veterinary clinic.
A client has texted in reply to an appointment reminder.

Upcoming appointment:
- Pet: ${ctx.petName}
- Type: ${ctx.appointmentType}
- Date: ${ctx.appointmentDate}
- Time: ${ctx.appointmentTime}

Your job: classify the client's intent and write a brief, warm SMS reply.
Keep replies under 160 characters when possible. Be friendly and professional.

Return JSON only — no markdown, no explanation:
{"intent":"confirm"|"cancel"|"reschedule"|"late"|"question"|"escalate","reply":"<your reply>"}

Intent definitions:
- confirm: client confirms they'll be there (e.g. "yes", "we'll be there", "confirmed", "thumbs up")
- cancel: client wants to cancel the appointment
- reschedule: client wants a different time, date, or day
- late: client says they're running late or delayed
- question: client has a question about the visit (what to bring, parking, prep, etc.)
- escalate: unclear intent, complaint, or needs a human to respond`;

  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Client ${ctx.clientFirstName} texts: "${ctx.messageText}"`,
    }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    console.error('[front-desk] AI returned no JSON:', raw);
    return { intent: 'escalate', reply: "We'll have our team follow up with you shortly." };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      intent: (parsed.intent as FrontDeskIntent) ?? 'escalate',
      reply: parsed.reply ?? "We'll have our team follow up with you shortly.",
    };
  } catch {
    return { intent: 'escalate', reply: "We'll have our team follow up with you shortly." };
  }
}
