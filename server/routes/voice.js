import express from 'express';
import twilio from 'twilio';

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// Handle incoming voice calls
router.post('/', (req, res) => {
  const twiml = new VoiceResponse();

  // Extract patient context from query parameters
  const patientName = req.query.patientName || req.body.patientName || '';
  const policyId = req.query.policyId || req.body.policyId || '';
  const callSid = req.body.CallSid || '';

  // Greet the caller
  const greeting = patientName
    ? `Welcome back ${patientName}! I am your MedInsure AI health insurance assistant.`
    : 'Welcome to MedInsure AI. I am your health insurance assistant.';

  twiml.say(
    {
      voice: 'Google.en-IN-Standard-A',
      language: 'en-IN'
    },
    greeting
  );

  // Gather speech input with patient context in params
  const gatherParams = {
    input: 'speech',
    action: `/voice/gather?patientName=${encodeURIComponent(patientName)}&policyId=${encodeURIComponent(policyId)}&callSid=${encodeURIComponent(callSid)}`,
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
    'Please tell me what you need help with.'
  );

  // If no input, repeat
  twiml.redirect(`/voice?patientName=${encodeURIComponent(patientName)}&policyId=${encodeURIComponent(policyId)}`);

  res.type('text/xml');
  res.send(twiml.toString());
});

export default router;
