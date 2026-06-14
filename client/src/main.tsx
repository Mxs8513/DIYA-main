// Main entry point for the React application

import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx'; // here we render App.
// imported React Router for page navigation
import React from "react";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)