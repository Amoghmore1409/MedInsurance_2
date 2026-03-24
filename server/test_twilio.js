import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

console.log('Testing Twilio connection...');
console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID?.substring(0, 5) + '...');

try {
  const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
  console.log('Account fetched successfully');
  console.log('Account Status:', account.status);
  console.log('Account Type:', account.type);
} catch (error) {
  console.error('Error fetching account:', error.message);
  console.error('Error code:', error.code);
}
