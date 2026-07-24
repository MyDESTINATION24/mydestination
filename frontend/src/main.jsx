import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Safely monkeypatch Node.prototype.removeChild and insertBefore to prevent GSAP/React DOM conflicts
if (typeof window !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode === this) {
      try {
        return originalRemoveChild.call(this, child);
      } catch (e) {
        console.warn('Safely ignored removeChild error:', e);
      }
    }
    return child;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      try {
        return originalInsertBefore.call(this, newNode, null);
      } catch (e) {
        console.warn('Safely handled insertBefore error:', e);
      }
    }
    try {
      return originalInsertBefore.call(this, newNode, referenceNode);
    } catch (e) {
      return originalInsertBefore.call(this, newNode, null);
    }
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
