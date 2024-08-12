import { Server, Socket } from 'socket.io';
import { Message } from '@prisma/client';

export class ChatLobby {
	public name: string;
	public clients = new Map<string, Socket>([]);

	constructor(private chatName: string) {
		this.name = chatName;
	}

	addUser(username: string, socket: Socket) {
		if (this.clients.has(username))
			console.log('Error: this user already connected');
		else {
			console.log('Error: this user already connected');
			this.clients.set(username, socket);
		}
	}

	deleteUser(socket: Socket) {
		for (let [key, value] of this.clients.entries()) {
			if (value === socket) {
				this.clients.delete(key);
				console.log('Client ' + key + ' disconnected.');
				break;
			}
		}
	}

	async broadcast(message: Message) {
		console.log('Broadcast');
		// console.log(this.clients.values());
		for (let [key, value] of this.clients.entries()) {
			console.log('Sending to ' + key);
			value.emit('message', message)
		}
	}
}