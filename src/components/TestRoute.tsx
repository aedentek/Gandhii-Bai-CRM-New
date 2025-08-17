import React from 'react';
import { useParams } from 'react-router-dom';

const TestRoute: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightgreen', fontSize: '18px' }}>
      <h1>TEST ROUTE WORKING!</h1>
      <p>Test ID: {testId}</p>
      <p>Current URL: {window.location.href}</p>
      <p>If you see this, React Router is working!</p>
    </div>
  );
};

export default TestRoute;
