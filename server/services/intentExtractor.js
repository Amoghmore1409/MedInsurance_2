import Groq from 'groq-sdk';

let groq = null;

/**
 * Get or create Groq client (lazy initialization)
 */
function getGroqClient() {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      console.warn('⚠️ GROQ_API_KEY not found. Intent extraction will use fallback mode.');
      return null;
    }
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groq;
}

/**
 * Extract user intent from natural language input using Groq
 * @param {string} userInput - The user's speech/text input
 * @param {string} currentStep - The current booking step
 * @param {object} context - Additional context like available options
 * @returns {Promise<string>} - The extracted intent/option
 */
export async function extractIntent(userInput, currentStep, context = {}) {
  const groqClient = getGroqClient();

  // If no Groq client, return input as-is for fallback processing
  if (!groqClient) {
    console.log(`[Intent Extraction] FALLBACK MODE: Step: ${currentStep}, Input: "${userInput}"`);
    return userInput;
  }

  try {
    let systemPrompt = '';
    let userPrompt = userInput;

    switch (currentStep) {
      case 'entry':
      case 'flow_selection':
        systemPrompt = `You are analyzing user intent for appointment booking choice.
The user must choose between exactly 2 options:
1. Home Visit - a doctor visits their home
2. Diagnostic Center Visit - they visit a medical center

Rules - MUST respond with ONLY one of these:
- "1" if user wants home visit (keywords: home, house, visit me, come home, doctor visit, home checkup)
- "2" if user wants diagnostic center (keywords: center, diagnostic, lab, clinic, go to, visit center)
- "out_of_scope" if user asks completely unrelated questions (like capital of countries, weather, time, president, general knowledge, etc.)

Be very strict - respond with just the number, "out_of_scope", or nothing else.

Examples:
- "I prefer home" → "1"
- "Visit me at home" → "1"
- "Diagnostic center" → "2"
- "I'll go to a center" → "2"
- "Lab visit" → "2"
- "What is the capital of France?" → "out_of_scope"
- "What time is it?" → "out_of_scope"
- "Who is the president?" → "out_of_scope"`;

        userPrompt = `User said: "${userInput}". Do they want option 1 (home visit), option 2 (diagnostic center), or is this out_of_scope? Answer with ONLY "1", "2", or "out_of_scope".`;
        break;

      case 'center_selection':
        systemPrompt = `You are analyzing which diagnostic center the user prefers.

Available options:
1. HealthCare Diagnostic Center - 5 km away
2. City Lab Diagnostics - 2 km away
3. MedPlus Lab - 1.5 km away

Map user intent to the correct number:
- "1" if they want: HealthCare, first, option 1
- "2" if they want: City Lab, second, city, center in middle
- "3" if they want: MedPlus, closest, third, last, near, close
- "out_of_scope" if user asks completely unrelated questions (like capital of countries, weather, time, president, general knowledge, etc.)

MUST respond with ONLY the number or "out_of_scope":
- "1" for HealthCare
- "2" for City Lab
- "3" for MedPlus
- "out_of_scope" for unrelated questions

Examples:
- "The first one" → "1"
- "City lab" → "2"
- "The closest" → "3"
- "MedPlus" → "3"
- "Which is nearest? MedPlus" → "3"
- "What time is it?" → "out_of_scope"
- "Who is the president?" → "out_of_scope"`;

        userPrompt = `User said: "${userInput}". Which center (1, 2, or 3) do they prefer, or is this out_of_scope? Respond with ONLY the number or "out_of_scope".`;
        break;

      case 'time_selection':
        systemPrompt = `You are analyzing which time slot the user prefers.
Available times:
1. 7:00 AM
2. 8:00 AM
3. 9:00 AM

Based on what the user says, determine which slot they want:
- If they mention "7", "seven", "7am", "7 am", "early" → respond with "1"
- If they mention "8", "eight", "8am", "8 am" → respond with "2"
- If they mention "9", "nine", "9am", "9 am", "late", "last" → respond with "3"
- If they mention any other time (like 6 PM, 10 AM, 5 PM, etc.) → respond with "invalid"
- If they ask completely unrelated questions (like capital of countries, weather, president, general knowledge, etc.) → respond with "out_of_scope"

You must extract ONLY the slot number and respond with EXACTLY:
- "1" if they want 7 AM
- "2" if they want 8 AM
- "3" if they want 9 AM
- "invalid" if they mention any time not in the available slots
- "out_of_scope" for unrelated questions
- Nothing else, just the number, "invalid", or "out_of_scope"

Examples:
- "9 am" → "3"
- "I prefer 8" → "2"
- "Seven in the morning" → "1"
- "The last slot please" → "3"
- "Early morning" → "1"
- "8 o'clock" → "2"
- "6 pm" → "invalid"
- "10 am" → "invalid"
- "5 pm" → "invalid"
- "Who is the president?" → "out_of_scope"
- "What is the capital of France?" → "out_of_scope"`;

        userPrompt = `User said: "${userInput}". Which time slot (1, 2, or 3) do they prefer, is it invalid, or out_of_scope? Respond with ONLY the number, "invalid", or "out_of_scope".`;
        break;

      case 'distance_confirmation':
        systemPrompt = `You are analyzing whether the user accepts or rejects the center distance.

The user will say YES (accept the distance) or NO (reject and choose different center).

Map to responses:
- "yes" if they accept: "ok", "fine", "sure", "let's go", "proceed", "that's fine", "alright"
- "no" if they want different: "too far", "pick another", "try different", "no thanks", "change"
- "out_of_scope" if user asks completely unrelated questions (like capital of countries, weather, time, president, general knowledge, etc.)

You MUST respond with ONLY:
- "yes" if they accept the distance
- "no" if they want to choose a different center
- "out_of_scope" for unrelated questions

Examples:
- "That's fine" → "yes"
- "Okay let's go" → "yes"
- "Too far" → "no"
- "Can I pick another?" → "no"
- "It's okay, proceed" → "yes"
- "What is the capital of France?" → "out_of_scope"
- "What time is it?" → "out_of_scope"`;

        userPrompt = `User said: "${userInput}". Do they accept this distance, want to choose a different center, or is this out_of_scope? Answer with ONLY "yes", "no", or "out_of_scope".`;
        break;

      default:
        return userInput; // Return as-is if unknown step
    }

    const response = await groqClient.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 50
    });

    const extractedIntent = response.choices[0].message.content.trim().toLowerCase();
    console.log(`[Intent Extraction] Step: ${currentStep}, Input: "${userInput}", Extracted: "${extractedIntent}"`);

    return extractedIntent;
  } catch (error) {
    console.error('[Intent Extraction Error]:', error.message);
    console.log(`[Intent Extraction] FALLBACK: Returning original input: "${userInput}"`);
    // Fall back to original input if Groq fails
    return userInput;
  }
}

export default { extractIntent };
