import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')!).render(
 <React.StrictMode>
  <App />
 </React.StrictMode>,
);

window.addEventListener('load', () => {
 const preloader = document.getElementById('preloader');
 if (preloader) {
  preloader.classList.add('hidden');
 }
});