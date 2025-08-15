import React, { useState } from 'react';
import EventApplicationForm from './EventApplicationForm';

const EventApplicationTest: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  const testEvent = {
    id: 'test-event-123',
    title: 'Test Event for Band Application',
    starts_at: '2024-12-25T19:00:00Z',
    location: 'Test Venue',
    budget_min: 500,
    budget_max: 1000
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Event Application Test</h1>
      
      {!showForm ? (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Test Band Application</h2>
          <p className="text-gray-600 mb-4">
            This test will show the EventApplicationForm with BandActionSelector.
            You should see options to apply as individual or as a band leader.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Test
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Event Application Form</h2>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
            >
              Close Test
            </button>
          </div>
          <EventApplicationForm
            event={testEvent}
            onSuccess={() => {
              alert('Application submitted successfully!');
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
};

export default EventApplicationTest;
