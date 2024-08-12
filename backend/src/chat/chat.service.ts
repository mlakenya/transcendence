import {
	BadRequestException,
	Injectable,
	UnauthorizedException
} from '@nestjs/common';
import { UsersService }  from 'src/users/services/users.service';
import { PrismaService } from 'src/prisma/prisma.servise';
import { ChatDto } from './chat.dto';
import { 
		Chat,
		User,
		Message,
		Prisma,
		ChatToken,
} from '@prisma/client'
import * as bcrypt from 'bcrypt';
import { log } from 'console';
import { IntegerType } from 'typeorm';
import { emitKeypressEvents } from 'readline';

@Injectable()
export class ChatService {
	constructor(
		private prisma: PrismaService,
		private users: UsersService
	) {}

	// CHAT 

	async findChat(chatName: string): Promise<boolean> {
		return !!(await this.prisma.chat.findUnique({ where: { name: chatName }}))
	}

	async createChat(newChat: ChatDto, creatorId: string): Promise<Chat> {
		console.log("--chatCreate request, Chat = ")
		console.log(newChat)
		const saltRounds = 10;
		if (newChat.private == true)
			var hashedPassword = await bcrypt.hash(newChat.password, saltRounds)

		const createdChat = await this.prisma.chat.create({
			data: {
				name: newChat.name,
				private: newChat.private,
				password: newChat.private ? hashedPassword : newChat.password,
				ownerid: newChat.owner,
				group: newChat.group
			}
		})
		// TODO
		if (newChat.group == true) {
			await this.joinChat(createdChat.id, creatorId, newChat.password)
			await this.setUserAdmin(createdChat.id, creatorId, true)
		}
		return (createdChat)
	}

	async createDm(requesterUserId: string, requestedUserId: string,
		requesterNickName: string, requestedNickName: string) {
		//let requestedUserBanList = await this.users.getUserBanList()
		//if requestedUserId in requestedUserBanList {
		//	throw new UnauthorizedException('Selected user banned you, you cannot send him messages.')
		//}
		if ((await this.prisma.friendship.findFirst({
			where: { userId: requestedUserId,
					 friendID: requesterUserId,
			},
			select: {blocked: true},
		})).blocked)
			throw new BadRequestException("Selected user blocked you")
		const newChat : ChatDto = {
			name: '-' + requesterNickName + '-' + requestedNickName + '-',
			private: false,
			owner: requestedNickName,
			group: false
		}
		const createdChat = await this.createChat(newChat, requesterUserId)
		this.joinChat(createdChat.id, requesterUserId, null)
		this.joinChat(createdChat.id, requestedUserId, null)
		return newChat.name
	}

	async getChat(chatId: number) {
		return await this.prisma.chat.findFirst({ where: {id: chatId}});
	}

	async deleteChat(chatId: number) {
		await this.prisma.chatToken.deleteMany({ where: {chatid: chatId}})
		await this.prisma.message.deleteMany({ where: {chatid: chatId} })
		return await this.prisma.chat.delete({ where: {id: chatId}})
	}

	async getPassword(chatId: number) {
		return (await this.prisma.chat.findUnique({
			where: { id: chatId },
			select: { password: true }
		}))
	}

	async joinChat(chatId: number, userId: string, password: string) {
		console.log("=== joinChat, isPrivate= %s", await this.isPrivate(chatId))
		if (await this.prisma.chatToken.findFirst({where: {userid: userId, chatid: chatId}}))
			throw new BadRequestException("User already in chat");

		if ((await this.isPrivate(chatId)).private) {
			console.log('Entering chat with:')
			console.log(password)
			const chatPass = (await this.getPassword(chatId)).password;
			console.log(chatPass);
			if (await bcrypt.compare(password, chatPass)) {
					await this.createChatToken(chatId, userId)
			} else {
				return false;
			}
		} else {
			await this.createChatToken(chatId, userId)
		}

		return true;
	}

	async leaveChat(chatId: number, userId: string) {
		var states = await this.prisma.chatToken.findFirst({where: {userid: userId, chatid: chatId}})
		if (states.banned || states.muted){
			await this.prisma.chatToken.update({
				where: {chatid_userid: {chatid: chatId, userid:userId}},
				data: {inchat: false}
			})
		}
		else
			await this.deleteChatToken(chatId, userId)
	}

	async isPrivate(chatId: number) {
		return (await this.prisma.chat.findFirst({
			where: { id: chatId },
			select: { private: true }
		}))
	}

	async changePrivacy(chatId: number){
		await this.prisma.chat.update({
			where: { id: chatId },
			data: { private: !(await this.isPrivate(chatId))}
		})
	}

	///// CHAT TOKEN

	async createChatToken(
	chatId: number,
	userId: string,
	isAdmin: boolean = false,
	isMute: boolean = false,
	isBan: boolean = false) {
		const newToken = await this.prisma.chatToken.create({
			data: {
				chatid: chatId,
				userid: userId,
				admin: isAdmin,
				muted: isMute,
				banned: isBan,
				inchat: true,
			}
		})
	}

	async deleteChatToken(chatId: number, userId: string){
		await this.prisma.chatToken.delete({
			where: { chatid_userid: { userid: userId, chatid: chatId }}
		})
	}


	///// MESSAGES:

	async createMessage(chatId: number, userId: string, line: string) {
		return await this.prisma.message.create({
			data: {
				body: line,
				chatid: chatId,
				userid: userId
			}
		})
	}


	async getChatMessages(chatId: number, userId: string) {
				var blocked_list = 	await this.prisma.friendship.findMany({
				where: {userId: userId, blocked: true},
				select: {friendID: true}
		})
		const blockedUserIds = blocked_list.map(blocked => blocked.friendID);
		return await this.prisma.message.findMany({
			where: {
				chatid: chatId,
				userid: { notIn: blockedUserIds	},
			},
			orderBy: { createdAt: 'asc'},
			select: {
				body: true,
				createdAt: true,
				fromUser: {	select: { username: true } },
			}
		})
	}

	///// GETTERS
	async getUserChatsName(username: string): Promise< {name: string}[] | {name: string} > {
		const userId: string = (await this.users.findOneByName(username)).id;
		
		var chats = await this.prisma.chatToken.findMany({
				where: {
					userid: userId,
					inchat: true
				},
				select: {
					chat: {	select: { name: true } }
				}
			})
		return (chats.map((item) => item.chat))
	}


	async getUserChatsId(userId: string): Promise<{ chatid: number }[] | { chatid: number }> {	
		var chats = await this.prisma.chatToken.findMany({
				where: {
					userid: userId,
					inchat: true
				},
				select: {
					chatid: true
				}
			})
		return (chats)
	}

	async getUserJoinableChats(userId: string) {
		var chats = await this.prisma.chat.findMany({
			where: {
				 NOT: { members: { some: {userid: userId, inchat: true} }},
				 group: true,
			},
			select: {
				name: true, group: true, private: true
			}
		})
		console.log("Get User Joinable chats was called")
		console.log("It returned :\n" + chats)
		return chats
	}

	async isUserInChat(chatId: number, userId: string): Promise<boolean> {
		// ! Here we use userId in shearch. But, upstream we are using username
		// ?
		return !!(await this.prisma.chatToken.findFirst({
			where : { chatid: chatId, userid: userId },
			select: { inchat: true }
		}))
	}

	async getChatUsers(chatId: number) {
		return await this.prisma.chatToken.findMany({
			where : { chatid: chatId },
			select: {
				user: { select: { username: true, profilePic: true, status: true}},
				chat: { select: { ownerid: true }},
				banned: true, admin: true, muted: true}
		})
	}

	// async deleteMessage() {}  -- Not needed, but could be easely implemented | need soma additional work on front

	async isAdmin(chatId: number, userId: string): Promise<boolean> {
		//console.log("=== isAdmin called")
		const key = await this.prisma.chatToken.findFirst({
			where: {
				userid: userId,
				chatid: chatId,
			},
			select: {
				admin: true,
			}
		})
		//console.log("=== isAdmin - key = %s", key)
		if (!key)
			return(false)
		return (key.admin)
	}

	async isOwner(chatId: number, userId: string): Promise<boolean> {
		const key = await this.prisma.chat.findFirst({
			where: {
				id: chatId,
				ownerid: userId,
			}
		})
		return (key != null)
	}

	async isMute(chatId: number, userId: string): Promise<boolean> {
		const key = this.prisma.chatToken.findFirst({
			where: {
				userid: userId,
				chatid: chatId,
			},
			select: {
				muted: true,
			}
		})
		return (!!key)
	}

	async isBan(chatId: number, userId: string): Promise<boolean> {
		const ret = await this.prisma.chatToken.findFirst({
			where : { userid: userId, chatid: chatId },
			select : { banned: true }
		})
		if (ret == null)
			return (false)
		return (ret.banned)
	}


	async getAdminList(chatId: number): Promise<{user: {username: string;}}[]> {
		const user = await this.prisma.chatToken.findMany({
			where: { chatid: chatId, admin: true },
			select: { user: { select: { username: true }} }
		})
		return user;
	}

	async getMuttedList(chatId: number): Promise<{user: {username: string;}}[]> {
		const user = await this.prisma.chatToken.findMany({
			where: { chatid: chatId, muted: true },
			select: { user: { select: { username: true }} }
		})
		return user;
	}

	async getBanList(chatId: number): Promise<{user: {username: string;}}[]> {
		const user = await this.prisma.chatToken.findMany({
			where: { chatid: chatId, banned: true },
			select: { user: { select: { username: true }} }
		})
		return user;
	}

	async getUserList(chatId: number): Promise<{user: {username: string;}}[]> {
		console.log(typeof chatId)
		let chatid: number = chatId as number
		console.log(typeof chatid)
		const user = await this.prisma.chatToken.findMany({
		where: { chatid: <number>chatid, banned: false },
		select: { user: { select: { username: true }} }
	})
	return user;
}

	async kickUser(chatId: number, userId: string) {
		await this.leaveChat(chatId, userId)
		return "User succesfully kicked"
	}

/////////////////////////////////////////////////////////////
//	THESE FUNCTIONS SET THE SPECIFIED FIELD IF key==true,  // 
//  THEY UNSET THE SPECIFIED FIELD IF key==false           //
/////////////////////////////////////////////////////////////

	async setUserAdmin(chatId: number, userId: string, key: boolean) {
		const old = this.prisma.chatToken.findFirst({
			where: {
				userid: userId,
				chatid: chatId,
			},
			select: { admin: true ,user: true }
		})
		if ((await old).admin != key) {
			var res = await this.prisma.chatToken.update({
				where: {
					chatid_userid: { userid: userId, chatid: chatId }
				},
				data: {
					admin: key
				}
			})
		}
		return "User was " + (key == true ? "upgraded" : "downgraded")
	}

	async setUserMute(chatId: number, userId: string, key: boolean) {
		const old = this.prisma.chatToken.findFirst({
			where: {
				userid: userId,
				chatid: chatId,
			},
			select: { muted: true }
		})
		if ((await old).muted != key) {
			var res = await this.prisma.chatToken.update({
				where: {
					chatid_userid: { userid: userId, chatid: chatId }
				},
				data: {
					muted: key
				}
			})
		}
		return "User was " + (key == true ? "mutted" : "un mutted")
	}

	async banUser(chatId: number, userId: string, banned: boolean) {
		if (!!(await this.prisma.chat.findFirst({
			where: { ownerid: userId, id: chatId }
		})))
			throw new UnauthorizedException("It's impossible to ban the chat owner.")
		if (await this.isUserInChat(chatId, userId)){
			await this.prisma.chatToken.update({
				where: {
					chatid_userid: { userid: userId, chatid: chatId }
				},
				data: {
					banned: banned,
					inchat: false
				}
			})
		}
		else {
			throw new BadRequestException("Requested user doen't belong to this chat")
		}
		return "User was banned"
	}

	async unBanUser(chatId: number, userId: string) {
		await this.prisma.chatToken.update({
			where: { 
				chatid_userid: { userid: userId, chatid: chatId}
			},
			data: {
				banned: false
			}
		})
		return "User was un banned"
	}

	async getSafeChatId(chatName: string): Promise<number> {
		let result: number;
		try {
			result = (await this.prisma.chat.findUniqueOrThrow({
			where: {name: chatName},
			select: {id: true}
			})).id
		} catch (e) {
			console.log("getSafeChatId failed, didn't found requested CHAT")
			throw (e)
		}
		return result
	}

	async getSafeUserId(userName: string): Promise<string> {
		//console.log("--getSageUserId called, with param, userName: %s",userName)
		let result: string;
		try {
			result = (await this.prisma.user.findUniqueOrThrow({
				where: {username: userName},
				select: {id: true}
			})).id
		} catch (e) {
			console.log("getSafeUserId failed, didn't found requested USER -%s-", userName)
			throw (e)
		}
		return result
	}



	// Test methods from Vova(delete on release).
	async allChatsTest() {
		return await this.prisma.chat.findMany();
	}

	async allChatTokensTest() {
		return await this.prisma.chatToken.findMany();
	}
}