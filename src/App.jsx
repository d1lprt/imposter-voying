import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import CreateRoom from './pages/CreateRoom.jsx'
import JoinRoom from './pages/JoinRoom.jsx'
import Room from './pages/Room.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<CreateRoom />} />
      <Route path="/join" element={<JoinRoom />} />
      <Route path="/room/:code" element={<Room />} />
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
