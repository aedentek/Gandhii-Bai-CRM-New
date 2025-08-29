import React from 'react'
import { createRoot } from 'react-dom/client'
import EmergencyApp from './EmergencyApp.tsx'
import './modern.css'
import './styles/global-page-layout.css';
import './styles/global-crm-design.css';

// Emergency build - using simple app without React Router
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EmergencyApp />
  </React.StrictMode>
);
  