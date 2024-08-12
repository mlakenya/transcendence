import { LobbyService } from './services/lobby.service';
import { Lobby} from "./gameLobby";
import { v4 as uuidv4 } from 'uuid';
import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

export type AuthenticatedSocket = WebSocket & {
  username: string;
  data: {
	lobby: null | Lobby;
  };

  emit: <T>(ev: null, data: T) => boolean;
};

@WebSocketGateway()
export class GameGateway
  implements OnGatewayConnection
{
	private clients: Set<any> = new Set();
	constructor(private lobbyService: LobbyService) {}
  
	async handleConnection(client: Socket, ...args: any[]): Promise<void> {
		this.clients.add(client);
		console.log('New client connected.' + client.id);

		client.on('disconnect', () => {
			this.clients.delete(client);
			console.log('Client disconnected.');
		});

		client.on('error', (err) => {
			console.error('WebSocket error:', err);
		});
	}

	createLobby(client: Socket, userId: string): void {
    	const lobbyId = uuidv4();
		const newLobby = this.lobbyService.createLobby(lobbyId, userId);
		newLobby.addSocket(client);		
	}

	@SubscribeMessage('joinLobby')
	joinLobby(client: any, userId: string) {
		const lobbys = this.lobbyService.getAllLobbies();
		if(lobbys){
			lobbys.forEach(lobby =>{
				if(lobby.getPlayers()[0] === userId || lobby.getPlayers()[1] === userId)
					return
				if(lobby.getPlayers()[1] === ''){
					lobby.joinLobby(userId);
					lobby.addSocket(client);
					client.emit("enemyName", userId);
					this.lobbyService.startGame(client, lobby)
					return ;
				}
			});
		}
		this.createLobby(client, userId);
		//client.emit("wait oponents");
	}
}
