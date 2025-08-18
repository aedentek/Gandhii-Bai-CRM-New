import React from 'react'
import { createRoot } from 'react-dom/client'
import ModernApp from './ModernApp.tsx'
import './modern.css'
import './styles/global-page-layout.css';
import './styles/global-crm-design.css';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ModernApp />
  </React.StrictMode>
);
  