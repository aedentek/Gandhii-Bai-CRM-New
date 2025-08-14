import React from 'react'
import { createRoot } from 'react-dom/client'
import ModernApp from './ModernApp.tsx'
import './modern.css'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ModernApp />
  </React.StrictMode>
);
