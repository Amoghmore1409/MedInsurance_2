import React from 'react';

export const ModeToggle = ({ mode, onModeChange }) => {
  const modes = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'voice', label: 'Voice', icon: '🎤' },
    { id: 'call', label: 'Call', icon: '📞' }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
      <div className="flex space-x-2">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              mode === m.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-2">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
};
