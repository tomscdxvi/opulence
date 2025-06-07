import { useState } from 'react'
import './App.css'
import PlayBoard from './components/play-board'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Splendor</h1>
      <PlayBoard />
    </>
  )
}

export default App
