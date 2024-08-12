import {
  OnGatewayConnection, ConnectedSocket,
  SubscribeMessage, MessageBody,
  WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { BadRequestException, Req, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.servise';
import { Message } from '@prisma/client';
import { ChatLobby } from './ChatLobby';

@WebSocketGateway()
export class ChatGateway
  implements OnGatewayConnection
{
	constructor(
		private chatService: ChatService,
		private prisma: PrismaService
	){}
		
	private clients: Set<Socket> = new Set();
	private chats = new Map<string, ChatLobby>([])

	async handleConnection(socket: Socket): Promise<void> {
		this.clients.add(socket);

		socket.on('disconnect', () => {
			for (let [chatName, chat] of this.chats) {
				const chatSockets: Socket[] = Array.from(chat.clients.values());
				if (chatSockets.find((s) => s == socket)) {
					chat.deleteUser(socket);
					break;
				} 
			}
		});
	}

	// This handler adds all the clients to the map.
	@SubscribeMessage('join')
	async join(@MessageBody() body: {username: string, chatName: string},
			   @ConnectedSocket() socket: Socket) {
		let userChat: ChatLobby = null;
		for (let [chatName, chat] of this.chats) {
			if (chatName == body.chatName) {
				userChat = chat;
				break;
			} 
		}
		if (userChat == null) {
			userChat = new ChatLobby(body.chatName);
			this.chats.set(body.chatName, userChat);
		}

		userChat.addUser(body.username, socket);
		console.log('User ' + body.username + " joins chat " + userChat.name);
	}

	// This function requires a message containing:
	// writerId
	// chatId where the message is written
	// payload - the message itself
	//
	// The function create a message in the db
	// then it'll emit the created message
	@SubscribeMessage('message')
	async handleEvent (@MessageBody() message: {username: string, payload: string}, 
					  @ConnectedSocket() socket: Socket) {
		let userChat: ChatLobby;
		for (let [chatName, chat] of this.chats) {
			if (chat.clients.has(message.username)) {
				userChat = chat;
				break;
			} 
		}
		const userID: string = (await this.prisma.user.findUnique({where: {username: message.username}})).id;
		console.log('User ' + message.username + ' sends a message \"' + message.payload + '\" to the chat ' + userChat.name);

		try {
			var chatId = await this.chatService.getSafeChatId(userChat.name);
		} catch {
			throw new BadRequestException("Such chat wasn't found");
		}

		if (!this.chatService.isUserInChat(chatId, userID))
			throw new UnauthorizedException("User not in chat");

		const mssg: Message = await this.chatService.createMessage(
			chatId,
			userID,
			message.payload);
		
		mssg.userid = message.username;

		userChat.broadcast(mssg);
	}
}
