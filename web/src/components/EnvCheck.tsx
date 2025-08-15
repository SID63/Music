import React from 'react';

const EnvCheck: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-bold text-yellow-800 mb-2">Environment Variables Check</h3>
      <div className="space-y-1 text-sm">
        <div>
          <strong>VITE_SUPABASE_URL:</strong> {supabaseUrl ? '✅ Set' : '❌ Missing'}
        </div>
        <div>
          <strong>VITE_SUPABASE_ANON_KEY:</strong> {supabaseKey ? '✅ Set' : '❌ Missing'}
        </div>
        {supabaseUrl && (
          <div className="text-xs text-gray-600 mt-2">
            URL: {supabaseUrl.substring(0, 30)}...
          </div>
        )}
        {supabaseKey && (
          <div className="text-xs text-gray-600">
            Key: {supabaseKey.substring(0, 20)}...
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvCheck;
