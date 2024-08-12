import { Injectable } from '@nestjs/common';
import { Lobby } from "../gameLobby";
import { Socket } from 'socket.io';


const PADDLE_WIDTH = 8;
const PADDLE_HEIGHT = 90;
const BALL_RADIUS = 20;
const UPDATE_INTERVAL = 8;

let loopCounter = 0;

@Injectable()
export class LobbyService {
	private lobbies: Map<string, Lobby> = new Map();

	constructor() {}

	createLobby(lobbyId: string, ownerId: string): Lobby {
		const lobby = new Lobby(lobbyId, ownerId);
		this.lobbies.set(lobbyId, lobby);
		return lobby;
	}

	getLobby(lobbyId: string): Lobby {
		return this.lobbies.get(lobbyId);
	}

	getAllLobbies(): Lobby[] {
		return Array.from(this.lobbies.values());
	}

	removeLobby(lobbyId: string) {
		this.lobbies.delete(lobbyId);
	}

	async startGame(client: any, lobby: Lobby) {
		const players = lobby.getPlayers();
		const socketsClients = lobby.getSockets();
		if (!lobby) {
			throw new Error("lobbyId");
		}

		const gameState: GameState = {
			ball: {
			x: 449, 
			y: 274, 
			speedX: 5, 
			speedY: 5,
			},
			paddles: {},
		};
		 
		gameState.paddles[players[0]] = {
			y: 275,
			x: 0,
			score: 0,
		};
	
		gameState.paddles[players[1]] = {
			y: 275,
			x: 892,
			score: 0,
		};

		socketsClients[0].emit("startGame", players);
		socketsClients[1].emit("startGame", players);
		
		socketsClients[0].on("newPositionUp", (userId) => {
			const yPos = gameState.paddles[userId].y - 12;
			const xPos = gameState.paddles[userId].x;
			const newY = Math.max(yPos - 12, 0);
			gameState.paddles[userId] = {...gameState.paddles[userId], x: xPos, y: newY}
		});

		socketsClients[0].on("newPositionDown", (userId) => {
			const yPos = gameState.paddles[userId].y + 12;
			const xPos = gameState.paddles[userId].x;
			const newY = Math.min(yPos + 12, 550 - PADDLE_HEIGHT);
			gameState.paddles[userId] = {...gameState.paddles[userId], x: xPos, y: newY}
		});

		socketsClients[1].on("newPositionUp", (userId) => {
			const yPos = gameState.paddles[userId].y - 12;
			const xPos = gameState.paddles[userId].x;
			const newY = Math.max(yPos - 12, 0);
			gameState.paddles[userId] = {...gameState.paddles[userId], x: xPos, y: newY}
		});

		socketsClients[1].on("newPositionDown", (userId) => {
			const yPos = gameState.paddles[userId].y + 12;
			const xPos = gameState.paddles[userId].x;
			const newY = Math.min(yPos + 12, 550 - PADDLE_HEIGHT);
			gameState.paddles[userId] = {...gameState.paddles[userId], x: xPos, y: newY}
		});
		const gameLoop = () => {
			gameState.ball.x += gameState.ball.speedX;
			gameState.ball.y += gameState.ball.speedY;
			loopCounter++;
			Object.entries(gameState.paddles).forEach(([playerId, paddle]) => {
				if (
					gameState.ball.x + BALL_RADIUS >= paddle.x &&
					gameState.ball.x <= paddle.x + PADDLE_WIDTH &&
					gameState.ball.y >= paddle.y &&
					gameState.ball.y - BALL_RADIUS <= paddle.y + PADDLE_HEIGHT 
				) {
					gameState.ball.speedX = -gameState.ball.speedX;
				}
			});
			
			// if (loopCounter % UPDATE_INTERVAL === 0) {
			// 	gameState.paddles["Vladimir"].y = gameState.ball.y;
			// 	gameState.paddles["Vladimir"].y = Math.max(0, Math.min(550 - PADDLE_HEIGHT, gameState.paddles["Vladimir"].y));
			// 	client.emit('positions', JSON.stringify(gameState));
			// }
			
			if (gameState.ball.x + BALL_RADIUS >= 900 ) {
				gameState.ball.x = 449;
				gameState.ball.y = 274;
				gameState.paddles[players[0]].score++;
				socketsClients[0].emit('positions', JSON.stringify(gameState));
				socketsClients[1].emit('positions', JSON.stringify(gameState));
				if (gameState.paddles[players[0]].score === 5){
					socketsClients[0].emit("Finish");
					socketsClients[1].emit("Finish");
					lobby.deliteSocket(socketsClients[0]);
					lobby.deliteSocket(socketsClients[1]);
					lobby.leaveLobby(this);
					clearInterval(gameLoopInterval);
				}
					
			}

			if(gameState.ball.x <= 0){
				gameState.ball.x = 449;
				gameState.ball.y = 274;
				gameState.paddles[players[1]].score++;
				socketsClients[0].emit('positions', JSON.stringify(gameState));
				socketsClients[1].emit('positions', JSON.stringify(gameState));
				if (gameState.paddles[players[1]].score === 5){
					socketsClients[0].emit("Finish");
					socketsClients[1].emit("Finish");
					lobby.deliteSocket(socketsClients[0]);
					lobby.deliteSocket(socketsClients[1]);
					lobby.leaveLobby(this);
					clearInterval(gameLoopInterval);
				}
					
			}
		
			if (gameState.ball.y <= 0) {
				gameState.ball.speedY = -gameState.ball.speedY;
			}
			
			if (gameState.ball.y + BALL_RADIUS >= 550) {
				gameState.ball.speedY = -gameState.ball.speedY;
				
			}
			socketsClients[0].emit('positions', JSON.stringify(gameState));
			socketsClients[1].emit('positions', JSON.stringify(gameState));

		};
		
			const gameLoopInterval = setInterval(gameLoop, 1000 / 60);
					
	}
}

interface GameState {
	ball: {
		x: number;
		y: number;
		speedX: number;
		speedY: number;
	};
	paddles: {
		[playerId: string]: {
			y: number;
			x: number;
			score: number;
		};
	};
}