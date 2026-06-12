import { Routes, Route, Outlet } from 'react-router-dom'
import AppShell from './components/AppShell'
import Home from './pages/Home'
import NewProject from './pages/NewProject'
import ProjectDashboard from './pages/ProjectDashboard'
import JoinSession from './pages/JoinSession'
import ChatSession from './pages/ChatSession'

export default function App() {
  return (
    <Routes>
      {/* Chromed routes share the Maersk Navbar + app-shell container. */}
      <Route element={<AppShell><Outlet /></AppShell>}>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewProject />} />
        <Route path="/projects/:id" element={<ProjectDashboard />} />
      </Route>
      {/* Full-bleed routes render their own standalone layout. */}
      <Route path="/join/:shareToken" element={<JoinSession />} />
      <Route path="/session/:sessionId" element={<ChatSession />} />
    </Routes>
  )
}
