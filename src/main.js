import './style.css';
import { stateManager } from './state.js';
import { uiManager } from './ui.js';

// Bootstrap the application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize state from local storage
  stateManager.init();
  
  // Initialize user interface controllers and bindings
  uiManager.init();
});
