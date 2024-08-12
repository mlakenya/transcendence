import '@/styles/globals.css'
import './game.css'
import { FC, useEffect, useRef } from 'react';
import { useState } from 'react';
import { io, Socket } from "socket.io-client";
import { useUserInfos } from '@/contexts/User/Component';
import GameMenu from './GameMenu';

const PLAYER_SPEED = 7;
// const MIN_PL_POSITION = 0;
// const MAX_PL_POSITION = 83.6;

const MIN_PL_POSITION = -10;
const MAX_PL_POSITION = 73.6;

let socket: Socket;

const Game: FC = () => {
	const username = useUserInfos().userName.userName;
	
	const [ballPos, setBallPos] = useState([449, 274]);
	const [playerPos, setPlayerPos] = useState([275, 275]);
	const [lobbyId, setLobbyId] = useState('');
	const [enemyName, setEnemyName] = useState('');
	const [score, setScore] = useState([0, 0]);
	const players = useRef(['', '']);
	const handleReloadClick = () => {
		window.location.reload();
	};
	// -------------------------------- for lesha - here you will add socket.on()
	useEffect(() => {
		socket = io("http://localhost:9000", {
			transports: ['websocket'],
			withCredentials: true
		});
	
		console.log('Game useEffects');
		socket.on("connect", () => console.log("Connected to WebSocket"));

		socket.on("disconnect", () =>
			console.log("Disconnected from WebSocket")
		);

		socket.on("Finish", () =>
			socket?.disconnect()
		);

		socket.on("enemyName", (data) => {
			setEnemyName(data);
		})

		socket.on("message", (data) => {
			console.log(data);
		});
		
	
		socket.on("ok", (data) => {
			console.log(data);
		});

		socket.on("startGame", (data) => {
			players.current = data;
		});

		socket.on("positions", (data) => {
			const newPositions = JSON.parse(data);
			setBallPos([newPositions["ball"].y, newPositions["ball"].x]);
			setPlayerPos([newPositions["paddles"][players.current[0]].y, newPositions["paddles"][players.current[1]].y])
			setScore([newPositions["paddles"][players.current[0]].score, newPositions["paddles"][players.current[1]].score]);
		});

		socket.emit('joinLobby', username);
	
		return () => {
			console.log('Disconnected from server!');
			socket?.disconnect();
		}
	}, [username]);

	useEffect(() => {
		// Function to fetch the username
		// const fetchUsername = async () => {
		// 	const url = '/api/user/username';
		// 	const response = await fetch(url, {
		// 		method: "GET",
		// 		headers: {
		// 			"content-type": "application/json",
		// 		},
		// 	}).catch((e) => console.log(e));
		// 	if (response?.ok)
		// 		setUsername((await response.json())['username']);
		// };

		// Call the fetchAccessToken function when the component mounts
		//fetchUsername();

		document.addEventListener('keydown', handleKeyPress);

		return () => {
			document.addEventListener('keyup', endKey);
		};
	}, []);

	// Event handler function for keyboard events
	const handleKeyPress = (event: KeyboardEvent) => {
		// Check which key was pressed using event.key
		if (event.key === 'ArrowUp') {
			socket.emit("newPositionUp", username)			
		} else if (event.key === 'ArrowDown') {
			socket.emit("newPositionDown", username)	
		}
	};

	const endKey = (event: KeyboardEvent) => {
		// Check which key was pressed using event.key
		if (event.key === 'ArrowUp') {
			//document.removeEventListener('keydown', handleKeyPress);	
			;		
		} else if (event.key === 'ArrowDown') {
			;
			//document.removeEventListener('keydown', handleKeyPress);	
		}
	};

	return (
		<div className="game">
			{username == players.current[0] ? (
				<div className='player_btns'>
					<div className='btn_player'>{username}</div>
					<div className='btn_player btn_enemy'>{players.current[1]}</div>
				</div>
			) : (
				<div className='player_btns'>
					<div className='btn_player btn_enemy'>{players.current[0]}</div>
					<div className='btn_player'>{username}</div>
				</div>
			)}
			

			<div className='back'>
				<div className='game_separation_line'></div>

				<div className='player' style={{top: (playerPos[0] + 36) + 'px'}}></div>
				<div className='player enemy_player' style={{top: playerPos[1] + 36 + 'px'}}></div>

				<div className='ball' style={{top: ballPos[0] + 'px', left: ballPos[1] + 'px'}}></div>

				<div className='counter'>{score[0]}</div>
				<div className='counter counter_enemy'>{score[1]}</div>

				{(score[0] >= 5 || score[1] >= 5) &&
				(
					<div className='game_over'>
						<div className="win_loose_window" style={{background: '#2E2E2E'}}>
							{score[0] >= 5 && <h1>Player {players.current[0]} win!</h1>}
							{score[1] >= 5 && <h1>Player {players.current[1]} win!</h1>}
							<button className='btn_ok' onClick={handleReloadClick}>OK</button>
						</div>
					</div>
				) 
				}
			</div>
		</div>
	)

};

export default Game