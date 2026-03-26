import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

console.log('Testing Twilio voice call...');
console.log('From:', process.env.TWILIO_PHONE_NUMBER);
console.log('To: +917620593008');

try {
  const call = await client.calls.create({
    url: 'http://localhost:3001/voice',
    to: '+917620593008',
    from: process.env.TWILIO_PHONE_NUMBER
  });
  
  console.log('Call created successfully!');
  console.log('Call SID:', call.sid);
} catch (error) {
  console.error('Error creating call:', error.message);
  console.error('Error code:', error.code);
  console.error('Status:', error.status);
  console.error('Full error:', JSON.stringify(error, null, 2));
}
