import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { attachAuthInterceptors } from './api/authInterceptor'
import { api } from './api/axiosConfig'

attachAuthInterceptors(api)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
