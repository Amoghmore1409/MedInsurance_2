import express from 'express';
import twilio from 'twilio';
import bookingFlowController from '../services/bookingFlowController.js';

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// Handle incoming voice calls
router.post('/', (req, res) => {
  const twiml = new VoiceResponse();

  // Extract patient context from query parameters
  const patientName = req.query.patientName || req.body.patientName || '';
  const userId = req.query.userId || req.body.userId || '1'; // Default to user 1 for demo
  const callSid = req.body.CallSid || '';

  console.log(`[VOICE] Incoming call - callSid: ${callSid}, userId: ${userId}, name: ${patientName}`);

  // Greet the caller
  const greeting = patientName
    ? `Welcome back ${patientName}!`
    : 'Welcome to MedInsure AI.';

  twiml.say(
    {
      voice: 'Google.en-IN-Standard-A',
      language: 'en-IN'
    },
    greeting
  );

  // Gather speech input - let gather endpoint handle the booking flow
  const gatherParams = {
    input: 'speech',
    action: `/voice/gather?userId=${encodeURIComponent(userId)}&patientName=${encodeURIComponent(patientName)}&callSid=${encodeURIComponent(callSid)}`,
    method: 'POST',
    speechTimeout: 'auto',
    language: 'en-IN',
    enhanced: true
  };

  const gather = twiml.gather(gatherParams);

  gather.say(
    {
      voice: 'Google.en-IN-Standard-A',
      language: 'en-IN'
    },
    'Please tell me what you need. Say 1 for Home Visit appointment or 2 for Diagnostic Center appointment.'
  );

  // If no input, repeat
  twiml.redirect(`/voice?userId=${encodeURIComponent(userId)}&patientName=${encodeURIComponent(patientName)}`);

  res.type('text/xml');
  res.send(twiml.toString());
});

export default router;
