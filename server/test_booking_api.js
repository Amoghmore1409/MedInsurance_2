/**
 * Test script for Appointment Booking API
 * Tests the complete flow for both home visit and diagnostic center
 */

async function testBookingAPI() {
  const API_BASE = 'http://localhost:3003/api/booking';

  console.log('🧪 Starting Appointment Booking API Tests\n');

  // Test 1: Start session for user 1
  console.log('Test 1: Start booking session for Amit (User 1)');
  try {
    const response = await fetch(`${API_BASE}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1, channelType: 'chat' })
    });
    const data = await response.json();
    console.log('✅ Response:', data);

    if (!data.success) {
      console.error('❌ Failed to start session');
      return;
    }

    const sessionId = data.sessionId;
    console.log(`\n📋 Session ID: ${sessionId}`);
    console.log(`📋 Current Step: ${data.currentStep}`);
    console.log(`📋 Message: ${data.message}\n`);

    // Test 2: Select Home Visit (option 1)
    console.log('Test 2: Select Home Visit (input: 1)');
    let response2 = await fetch(`${API_BASE}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userInput: '1' })
    });
    let data2 = await response2.json();
    console.log('✅ Response:', data2);
    console.log(`📋 Current Step: ${data2.currentStep}`);
    console.log(`📋 Message: ${data2.message}\n`);

    // Test 3: Try unavailable slot (7:00 AM)
    console.log('Test 3: Select unavailable slot - 7:00 AM (input: 1)');
    let response3 = await fetch(`${API_BASE}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userInput: '1' })
    });
    let data3 = await response3.json();
    console.log('✅ Response:', data3);
    console.log(`📋 Current Step: ${data3.currentStep}`);
    console.log(`📋 Message: ${data3.message}\n`);

    // Test 4: Select available slot (8:00 AM)
    console.log('Test 4: Select available slot - 8:00 AM (input: 2)');
    let response4 = await fetch(`${API_BASE}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userInput: '2' })
    });
    let data4 = await response4.json();
    console.log('✅ Response:', data4);
    console.log(`📋 Current Step: ${data4.currentStep}`);
    console.log(`📋 Message: ${data4.message}\n`);

    // Test 5: Test Diagnostic Center flow with new session
    console.log('\n🔄 Testing Diagnostic Center Flow\n');
    console.log('Test 5: Start new booking session for Neha (User 2)');
    const response5 = await fetch(`${API_BASE}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 2, channelType: 'chat' })
    });
    const data5 = await response5.json();
    console.log('✅ Response:', data5);
    const sessionId2 = data5.sessionId;
    console.log(`\n📋 Session ID: ${sessionId2}\n`);

    // Test 6: Select Diagnostic Center (option 2)
    console.log('Test 6: Select Diagnostic Center (input: 2)');
    let response6 = await fetch(`${API_BASE}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId2, userInput: '2' })
    });
    let data6 = await response6.json();
    console.log('✅ Response:', data6);
    console.log(`📋 Current Step: ${data6.currentStep}`);
    console.log(`📋 Message: ${data6.message}\n`);

    // Test 7: Select HealthCare Diagnostic Center (far center)
    console.log('Test 7: Select HealthCare Diagnostic Center - Center 1 (input: 1)');
    let response7 = await fetch(`${API_BASE}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId2, userInput: '1' })
    });
    let data7 = await response7.json();
    console.log('✅ Response:', data7);
    console.log(`📋 Current Step: ${data7.currentStep}`);
    console.log(`📋 Message: ${data7.message}\n`);

    // Test 8: Confirm distance (Yes)
    console.log('Test 8: Confirm distance warning - Yes (input: yes)');
    let response8 = await fetch(`${API_BASE}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId2, userInput: 'yes' })
    });
    let data8 = await response8.json();
    console.log('✅ Response:', data8);
    console.log(`📋 Current Step: ${data8.currentStep}`);
    console.log(`📋 Message: ${data8.message}\n`);

    // Test 9: Select time (9:00 AM)
    console.log('Test 9: Select time - 9:00 AM (input: 3)');
    let response9 = await fetch(`${API_BASE}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId2, userInput: '3' })
    });
    let data9 = await response9.json();
    console.log('✅ Response:', data9);
    console.log(`📋 Current Step: ${data9.currentStep}`);
    console.log(`📋 Message: ${data9.message}\n`);

    if (data9.type === 'confirmation') {
      console.log('✅ BOOKING CONFIRMED!');
      console.log('📋 Booking Details:', data9.bookingDetails);
    }

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run tests if this is Node.js environment
if (typeof window === 'undefined') {
  testBookingAPI();
} else {
  console.log('Tests can be run from the browser console or with Node.js');
  window.testBookingAPI = testBookingAPI;
}
