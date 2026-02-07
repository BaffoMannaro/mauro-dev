import React, { Suspense } from "react";
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './i18n.js';
import './index.css';

ReactDOM.createRoot(document.getElementById("root")).render(
  <Suspense fallback={null}>
    <App />
  </Suspense>
);
