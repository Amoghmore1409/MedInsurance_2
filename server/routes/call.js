import express from 'express';
import twilio from 'twilio';

const router = express.Router();

// Twilio client (configured with credentials from env)
let twilioClient = null;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
} catch (error) {
  console.error('Error initializing Twilio client:', error);
}

// Get Twilio phone number
router.get('/number', (req, res) => {
  const number = process.env.TWILIO_PHONE_NUMBER || '+1-XXX-XXX-XXXX';
  res.json({ number });
});

// Initiate outbound call
router.post('/initiate', async (req, res) => {
  const { to, patient } = req.body;

  if (!twilioClient) {
    return res.status(503).json({
      success: false,
      error: 'Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env'
    });
  }

  if (!to) {
    return res.status(400).json({
      success: false,
      error: 'Phone number is required'
    });
  }

  try {
    const call = await twilioClient.calls.create({
      url: `${process.env.SERVER_URL || 'http://localhost:3001'}/voice?patientName=${encodeURIComponent(patient?.name || '')}&policyId=${encodeURIComponent(patient?.policyId || '')}`,
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    res.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      patient: patient
    });

  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get call status
router.get('/status/:callSid', async (req, res) => {
  const { callSid } = req.params;

  if (!twilioClient) {
    return res.status(503).json({
      success: false,
      error: 'Twilio is not configured'
    });
  }

  try {
    const call = await twilioClient.calls(callSid).fetch();

    res.json({
      success: true,
      status: call.status,
      duration: call.duration,
      direction: call.direction
    });

  } catch (error) {
    console.error('Error fetching call status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
