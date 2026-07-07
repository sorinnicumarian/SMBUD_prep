import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { DataProvider } from './lib/data'
import { ProfileProvider } from './lib/profiles'
import { App } from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <ProfileProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </ProfileProvider>
    </HashRouter>
  </React.StrictMode>,
)
