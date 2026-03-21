import React, { useState, useEffect, useRef } from 'react';

export const CallMode = ({ selectedPatient }) => {
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected, ended
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [twilioNumber, setTwilioNumber] = useState('');
  const [userPhoneNumber, setUserPhoneNumber] = useState('+919326479441'); // Your number
  const timerRef = useRef(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    // Fetch Twilio number from backend
    fetch(`${backendUrl}/call/number`)
      .then(res => res.json())
      .then(data => {
        if (data.number) {
          setTwilioNumber(data.number);
        }
      })
      .catch(err => {
        console.error('Error fetching Twilio number:', err);
        setTwilioNumber('+1-XXX-XXX-XXXX');
      });
  }, []);

  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCall = async () => {
    if (!selectedPatient) {
      alert('Please select a patient from the dropdown first');
      return;
    }

    // Use the stored phone number
    const phoneNumber = userPhoneNumber;

    if (!phoneNumber) {
      alert('Phone number is required to initiate call');
      return;
    }

    setCallStatus('calling');
    setDuration(0);
    setTranscript([]);

    try {
      const response = await fetch(`${backendUrl}/call/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: phoneNumber,
          patient: {
            name: selectedPatient.name,
            policyId: selectedPatient.policyId,
            plan: selectedPatient.plan
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        // Simulate call connection (in production, this would be handled by Twilio webhooks)
        setTimeout(() => {
          setCallStatus('connected');
          addTranscriptEntry('system', 'Call connected');
          addTranscriptEntry('ai', 'Hello! I am MedInsure AI assistant. How can I help you today?');
        }, 2000);
      } else {
        setCallStatus('idle');
        alert('Failed to initiate call: ' + data.error);
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      setCallStatus('idle');
      alert('Failed to initiate call. Make sure the backend server is running.');
    }
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    addTranscriptEntry('system', 'Call ended');

    setTimeout(() => {
      setCallStatus('idle');
      setDuration(0);
    }, 3000);
  };

  const addTranscriptEntry = (speaker, text) => {
    setTranscript(prev => [
      ...prev,
      {
        speaker,
        text,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Simulate receiving speech from call (in production, this comes from Twilio)
  const simulateIncomingSpeech = () => {
    if (callStatus === 'connected') {
      addTranscriptEntry('user', 'I want to check my claim status');
      setTimeout(() => {
        addTranscriptEntry('ai', 'Sure, I can help you check your claim status. Let me pull up your information.');
      }, 1500);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Phone Call Mode</h2>
        <p className="text-gray-600">Connect with MedInsure AI via phone call</p>
      </div>

      {/* Call Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
        {/* Patient Info Display */}
        {selectedPatient && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <div className="text-sm text-gray-600">Calling as:</div>
            <div className="text-lg font-bold text-gray-800">{selectedPatient.name}</div>
            <div className="text-sm text-gray-600">
              {selectedPatient.policyId} • {selectedPatient.plan}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Phone: {userPhoneNumber}
            </div>
          </div>
        )}

        {!selectedPatient && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <div className="text-sm text-yellow-800">
              ⚠️ Please select a patient from the dropdown above
            </div>
          </div>
        )}

        {/* Twilio Number Display */}
        <div className="mb-8 text-center">
          <div className="text-sm text-gray-600 mb-2">Call our AI assistant at:</div>
          <div className="text-3xl font-bold text-blue-600">{twilioNumber}</div>
          <div className="text-sm text-gray-500 mt-2">
            Or use the button below to receive a call
          </div>
        </div>

        {/* Call Status Indicator */}
        <div className="mb-8">
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center ${
              callStatus === 'connected'
                ? 'bg-green-500 animate-pulse'
                : callStatus === 'calling'
                ? 'bg-blue-500 animate-pulse'
                : callStatus === 'ended'
                ? 'bg-red-500'
                : 'bg-gray-300'
            }`}
          >
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
        </div>

        {/* Call Status Text */}
        <div className="text-center mb-4">
          <div className="text-xl font-semibold text-gray-800">
            {callStatus === 'idle' && 'Ready to Call'}
            {callStatus === 'calling' && 'Calling...'}
            {callStatus === 'connected' && 'Connected'}
            {callStatus === 'ended' && 'Call Ended'}
          </div>
          {callStatus === 'connected' && (
            <div className="text-2xl font-mono text-blue-600 mt-2">
              {formatDuration(duration)}
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="flex space-x-4">
          {callStatus === 'idle' && (
            <button
              onClick={handleCall}
              disabled={!selectedPatient}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="mr-2">📞</span>
              {selectedPatient ? 'Start Call' : 'Select Patient First'}
            </button>
          )}

          {(callStatus === 'calling' || callStatus === 'connected') && (
            <button
              onClick={handleEndCall}
              className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105"
            >
              <span className="mr-2">📞</span>
              End Call
            </button>
          )}

          {/* Test button for simulating speech */}
          {callStatus === 'connected' && (
            <button
              onClick={simulateIncomingSpeech}
              className="px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold shadow-lg transition-all"
            >
              Test Speech
            </button>
          )}
        </div>
      </div>

      {/* Transcript Panel */}
      {transcript.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-6 max-h-64 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Call Transcript</h3>
          <div className="space-y-3">
            {transcript.map((entry, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  entry.speaker === 'user'
                    ? 'bg-blue-50 border border-blue-200'
                    : entry.speaker === 'ai'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-start">
                  <div className="font-semibold text-sm mr-2">
                    {entry.speaker === 'user' ? '👤 You:' : entry.speaker === 'ai' ? '🤖 AI:' : 'ℹ️'}
                  </div>
                  <div className="flex-1 text-sm text-gray-800">{entry.text}</div>
                  <div className="text-xs text-gray-500 ml-2">
                    {new Date(entry.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
