import express from 'express';
import twilio from 'twilio';
import bookingFlowController from '../services/bookingFlowController.js';

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// Session storage for voice calls (maps callSid to sessionId)
const voiceSessionMap = new Map();

// Track retry attempts for each call
const retryAttempts = new Map();

// Handle speech input from caller
router.post('/', async (req, res) => {
  const twiml = new VoiceResponse();
  const userSpeech = req.body.SpeechResult;
  const callSid = req.body.CallSid;
  const from = req.body.From;

  // Extract patient context from query parameters
  const patientName = req.query.patientName || '';
  const userId = req.query.userId || '1';

  console.log(`[GATHER] ${callSid} User (${patientName || 'Anonymous'}) said: ${userSpeech}`);

  if (!userSpeech || userSpeech.trim() === '') {
    // Get current retry count
    const currentAttempts = retryAttempts.get(callSid) || 0;
    
    if (currentAttempts >= 1) {
      // Second attempt - hang up
      twiml.say(
        {
          voice: 'Google.en-IN-Standard-A',
          language: 'en-IN'
        },
        'I understand you may be busy. Thank you for calling MedInsure. Goodbye!'
      );
      twiml.hangup();
    } else {
      // First attempt - ask again
      retryAttempts.set(callSid, currentAttempts + 1);
      twiml.say(
        {
          voice: 'Google.en-IN-Standard-A',
          language: 'en-IN'
        },
        'I didn\'t catch that. Could you please say it again?'
      );

      const gather = twiml.gather({
        input: 'speech',
        action: `/voice/gather?userId=${encodeURIComponent(userId)}&patientName=${encodeURIComponent(patientName)}&callSid=${encodeURIComponent(callSid)}`,
        method: 'POST',
        speechTimeout: 'auto',
        language: 'en-IN'
      });
    }

    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  try {
    let sessionId = voiceSessionMap.get(callSid);
    let response;

    // If no existing session, start a new one and process the user input
    if (!sessionId) {
      console.log(`[GATHER] Starting new booking session for user ${userId}`);
      const startResult = bookingFlowController.startSession(userId, 'call');
      if (!startResult.success) {
        twiml.say(
          {
            voice: 'Google.en-IN-Standard-A',
            language: 'en-IN'
          },
          "I'm sorry, I can only help you with booking your medical appointment. I'm here to assist you with scheduling your mandatory medical check-up through MedInsure."
        );
        twiml.hangup();
        res.type('text/xml');
        res.send(twiml.toString());
        return;
      }
      sessionId = startResult.sessionId;
      voiceSessionMap.set(callSid, sessionId);
      // Reset retry counter for new session
      retryAttempts.delete(callSid);

      // Now process the user's initial input against the new session
      console.log(`[GATHER] Processing initial user input: "${userSpeech}"`);
      response = await bookingFlowController.handleUserInput(sessionId, userSpeech);
    } else {
      // Handle user input in existing session
      // Reset retry counter when user provides speech
      retryAttempts.delete(callSid);
      console.log(`[GATHER] Processing input for existing session: "${userSpeech}"`);
      response = await bookingFlowController.handleUserInput(sessionId, userSpeech);
    }

    if (!response.success) {
      twiml.say(
        {
          voice: 'Google.en-IN-Standard-A',
          language: 'en-IN'
        },
        'Sorry, I didn\'t understand that. Let me ask again. '
      );

      if (response.options && response.options.length > 0) {
        const gather = twiml.gather({
          input: 'speech',
          action: `/voice/gather?userId=${encodeURIComponent(userId)}&patientName=${encodeURIComponent(patientName)}&callSid=${encodeURIComponent(callSid)}`,
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
          response.message
        );
      }
    } else {
      let acknowledgment = '';

      if (response.currentStep === 'time_selection' && !response.message.includes('didn\'t')) {
        acknowledgment = '';
      } else if (response.currentStep === 'center_selection') {
        acknowledgment = '';
      } else if (response.currentStep === 'distance_confirmation') {
        acknowledgment = '';
      }

      twiml.say(
        {
          voice: 'Google.en-IN-Standard-A',
          language: 'en-IN'
        },
        acknowledgment + response.message
      );

      if (response.type === 'confirmation') {
        twiml.say(
          {
            voice: 'Google.en-IN-Standard-A',
            language: 'en-IN'
          },
          'Thank you for using MedInsure. Goodbye!'
        );
        twiml.hangup();
        voiceSessionMap.delete(callSid);
        res.type('text/xml');
        res.send(twiml.toString());
        return;
      }
    }

    if (response.options && response.options.length > 0) {
      const gather = twiml.gather({
        input: 'speech',
        action: `/voice/gather?userId=${encodeURIComponent(userId)}&patientName=${encodeURIComponent(patientName)}&callSid=${encodeURIComponent(callSid)}`,
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
        'Please select an option.'
      );
    }

    // Goodbye if no options (shouldn't reach here due to confirmation check above)
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
      "I'm sorry, I can only help you with booking your medical appointment. I'm here to assist you with scheduling your mandatory medical check-up through MedInsure."
    );

    twiml.hangup();
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

export default router;
