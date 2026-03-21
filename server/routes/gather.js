import express from 'express';
import twilio from 'twilio';
import { handleVoiceChat } from '../services/groqCallService.js';

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// Handle speech input from caller
router.post('/', async (req, res) => {
  const twiml = new VoiceResponse();
  const userSpeech = req.body.SpeechResult;
  const callSid = req.body.CallSid;
  const from = req.body.From;

  // Extract patient context from query parameters
  const patientName = req.query.patientName || '';
  const policyId = req.query.policyId || '';

  console.log(`[${callSid}] User (${patientName || 'Anonymous'}) said: ${userSpeech}`);

  if (!userSpeech || userSpeech.trim() === '') {
    twiml.say(
      {
        voice: 'Google.en-IN-Standard-A',
        language: 'en-IN'
      },
      'I did not catch that. Could you please repeat?'
    );

    const gather = twiml.gather({
      input: 'speech',
      action: `/voice/gather?patientName=${encodeURIComponent(patientName)}&policyId=${encodeURIComponent(policyId)}&callSid=${encodeURIComponent(callSid)}`,
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-IN'
    });

    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  try {
    // Get AI response using Groq with patient context
    const patientContext = {
      patientName: patientName || 'Caller',
      policyId: policyId || 'Unknown',
      from
    };

    const aiResponse = await handleVoiceChat(userSpeech, callSid, patientContext);

    console.log(`[${callSid}] AI response: ${aiResponse.message}`);

    // Speak the AI response
    twiml.say(
      {
        voice: 'Google.en-IN-Standard-A',
        language: 'en-IN'
      },
      aiResponse.message
    );

    // Continue conversation with patient context
    const gather = twiml.gather({
      input: 'speech',
      action: `/voice/gather?patientName=${encodeURIComponent(patientName)}&policyId=${encodeURIComponent(policyId)}&callSid=${encodeURIComponent(callSid)}`,
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-IN',
      enhanced: true
    });

    gather.say(
      {
        voice: 'Google.en-IN-Standard-A',
        language: 'en-IN'
      },
      'Is there anything else I can help you with?'
    );

    // Goodbye if no response
    twiml.say(
      {
        voice: 'Google.en-IN-Standard-A',
        language: 'en-IN'
      },
      'Thank you for calling MedInsure. Have a great day!'
    );

    twiml.hangup();

  } catch (error) {
    console.error('Error processing speech:', error);

    twiml.say(
      {
        voice: 'Google.en-IN-Standard-A',
        language: 'en-IN'
      },
      'I apologize, but I encountered an error. Please try again or contact customer support.'
    );

    twiml.hangup();
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

export default router;
