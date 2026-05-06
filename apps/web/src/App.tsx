import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import NewProject from './pages/NewProject'
import ProjectDashboard from './pages/ProjectDashboard'
import JoinSession from './pages/JoinSession'
import ChatSession from './pages/ChatSession'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/new" element={<NewProject />} />
      <Route path="/projects/:id" element={<ProjectDashboard />} />
      <Route path="/join/:shareToken" element={<JoinSession />} />
      <Route path="/session/:sessionId" element={<ChatSession />} />
    </Routes>
  )
}
