import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import NewProject from './pages/NewProject'

function ProjectDashboard() {
  return <div>Project Dashboard</div>
}

function JoinSession() {
  return <div>Join Session</div>
}

function ChatSession() {
  return <div>Chat Session</div>
}

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
