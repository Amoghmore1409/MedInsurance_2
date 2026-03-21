import React, { useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';

export const VoiceInput = ({ onTranscriptComplete, onSpeakResponse, disabled }) => {
  const {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    resetTranscript,
    fullTranscript
  } = useSpeech();

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handleSendTranscript = () => {
    if (transcript.trim()) {
      onTranscriptComplete(transcript.trim());
      resetTranscript();
    }
  };

  // Auto-send when user stops speaking
  useEffect(() => {
    let timeout;
    if (transcript && !isListening) {
      timeout = setTimeout(() => {
        handleSendTranscript();
      }, 1000);
    }
    return () => clearTimeout(timeout);
  }, [transcript, isListening]);

  // Expose speak function to parent
  useEffect(() => {
    if (onSpeakResponse) {
      onSpeakResponse(speak);
    }
  }, [speak, onSpeakResponse]);

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Transcript Display */}
      {(transcript || interimTranscript) && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Transcript:</div>
          <div className="text-gray-900">
            {transcript}
            <span className="text-gray-400 italic">{interimTranscript}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center space-x-3">
        {/* Microphone Button */}
        <button
          onClick={handleToggleListening}
          disabled={disabled || isSpeaking}
          className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700'
          } disabled:bg-gray-300 disabled:cursor-not-allowed`}
        >
          {isListening ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <rect x="6" y="6" width="8" height="8" rx="1" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
              <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
            </svg>
          )}
        </button>

        {/* Status Text */}
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700">
            {isSpeaking ? (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                AI is speaking...
              </span>
            ) : isListening ? (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                Listening...
              </span>
            ) : (
              <span className="text-gray-500">
                {disabled ? 'Select a patient to start' : 'Click microphone to speak'}
              </span>
            )}
          </div>
          {fullTranscript && (
            <div className="text-xs text-gray-500 mt-1">
              {fullTranscript.length} characters captured
            </div>
          )}
        </div>

        {/* Stop Speaking Button */}
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all font-medium"
          >
            Stop
          </button>
        )}

        {/* Send Transcript Button */}
        {transcript && !isListening && (
          <button
            onClick={handleSendTranscript}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all font-medium"
          >
            Send
          </button>
        )}
      </div>

      {/* Voice Animation */}
      {isListening && (
        <div className="flex justify-center items-center space-x-1 mt-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-blue-500 rounded-full animate-soundWave"
              style={{
                height: '20px',
                animationDelay: `${i * 0.1}s`
              }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};
