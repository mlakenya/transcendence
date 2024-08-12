import {LobbyService} from "./services/lobby.service";
import { Socket } from 'socket.io';

export class Lobby {
    private players: [string, string] = ['', ''];
    private sockets: Set<Socket> = new Set();

    constructor(private lobbyId: string, private ownerId: string) {
        console.log(ownerId);
        this.players[0] = ownerId;
    }

    joinLobby(userId: string) {
        if (userId !== this.ownerId) {
           this.players[1] = userId;
        }
    }

    deliteSocket(socket: Socket){
        this.sockets.delete(socket);
    }

    addSocket(socket: Socket) {
        this.sockets.add(socket);
    }

    getSockets(): Socket[] | undefined {
        return Array.from(this.sockets.values());
    }

    getPlayers(): [string, string] {
        return this.players;
    }

    leaveLobby(lobbyService: LobbyService) {
        lobbyService.removeLobby(this.lobbyId);
       
    }
}