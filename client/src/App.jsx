import { useState } from 'react'
import './App.css'
import io from 'socket.io-client';
import PlayBoard from './components/play-board'
import { useEffect } from 'react';

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
			<h1>Splendor</h1>
			<PlayBoard />

			<div>
				<input placeholder="Message..." />
				<button onClick={sendMessage}>Send Message</button>
			</div>
		</>
	)
}

export default App
