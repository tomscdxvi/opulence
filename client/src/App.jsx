import { useState } from 'react'
import './App.css'
import io from 'socket.io-client';
import PlayBoard from './components/play-board'
import { useEffect } from 'react';
import PlayerHand from './components/player-hand';

const socket = io.connect("http://localhost:5001");

function App() {
	const [count, setCount] = useState(0);

	const [room, setRoom] = useState("");

	const joinRoom = () => {
		if(room != "") {
			socket.emit("join_room", room);
		}
	}

	const sendMessage = () => {
		socket.emit("send_message", { message: "Hello" });
	}

	useEffect(() => {
		socket.on("receive_message", (data) => {
			alert(data.message);
		})
	}, [socket]);

	return (
		<>
			<div style={{
				position: 'relative',
				width: '100vw',
				height: '100vh',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: '#e0e0e0',
				boxSizing: 'border-box', // ✅ important
				overflow: 'hidden',      // ✅ also helps
			}}>
				<PlayerHand player={1} side="bottom" />
				<PlayerHand player={2} side="top" />
				<PlayerHand player={3} side="left" />
				<PlayerHand player={4} side="right" />

				{/* Game board in center */}
				<PlayBoard />
			</div>
		</>
	)
}

export default App
