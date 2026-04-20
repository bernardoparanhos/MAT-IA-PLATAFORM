import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificacoesProvider } from './context/NotificacoesContext.jsx'
import { NotificacoesAlunoProvider } from './context/NotificacoesAlunoContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificacoesProvider>
          <NotificacoesAlunoProvider>
            <App />
          </NotificacoesAlunoProvider>
        </NotificacoesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)