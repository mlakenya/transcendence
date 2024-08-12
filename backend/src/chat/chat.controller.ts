import {Body, Controller, Get, Param, Patch, Post, Headers, Query, BadRequestException, UseGuards, Req, UnauthorizedException} from '@nestjs/common';
import { ChatService } from './chat.service';
import { UsersService }  from 'src/users/services/users.service';
import { ChatDto } from './chat.dto';
import { JWTAuthGuard } from 'src/auth/guards/auth-jwt.guard';
import { Request } from 'express'
import { PrismaService } from 'src/prisma/prisma.servise';
// ! DOC:

// Here you will find a large set of controlers:
// They will take their argument from the html query

// In this controlers, @Query and @Param are the most used,
// @Query present a bug, where Integer values are not transformed
// in integer and are passed to <number type> parameters as strings
// A explicit conversion is needed in case you want to use those
// values as <number> downstream

// Some usefull info:
// ? @Query - correspond to ?param='value'
// ? @Param - correspond to a :<param> in the main decorator field:
// ? @Body() - used here direclty work with JSON formated data
// ? @Headers - VLADIMIR PLEASE EXPLAIN :)

// ! USAGE:

// ? If you want to add any new controllers, please write a message to the maintainer at
// ? lakonelson@gmail.com

// ? If you need to change some parameters decorators, please test them, and be aware
// ? of String-Integer conversion (see DOC part)

@UseGuards(JWTAuthGuard)
@Controller('chat')
export class ChatController {
	constructor(private chatService: ChatService,
				private userService: UsersService,
				private prisma: PrismaService) {}

	@Get('/:chatName/users')
	async getChatUsers(@Param('chatName') chatName: string) {
		//console.log("--getChatUsers was called")
		//console.log(chatName)

		try {
			var chatId = await this.chatService.getSafeChatId(chatName)
		} catch {
			throw new BadRequestException("Such chat wasn't found")
		}
	
		return (await this.chatService.getChatUsers(Number(chatId)))
	}

	@Get('/joinableChats')
	async getAllChat(@Query('userName') userName: string) {
		console.log("--getAllChat was called")
		console.log(userName)
		
		try {
			var userId = await this.chatService.getSafeUserId(userName);
		} catch {
			throw new BadRequestException("Such user wasn't found")
		}

		return (await this.chatService.getUserJoinableChats(userId))
	}

	@Get('/isChat')
	async getOneChat(@Query('chatName') chatName: string) {
		//console.log("--getOneChat was called")
		//console.log(chatName)
		
		try {
			await this.chatService.getSafeChatId(chatName);
		} catch {
			return false
		}
		return true
	}

	// Removed by other controller, because i cant send chatID

	// async joinChat(@Query('chat_id') chatName: string,
	// 			   @Query('password') password: string,
	// 			   @Query('user_id') userId: string){
	// 	return (await this.chatService.joinChat(chatId, userId, password))
	// }

	@Get('/joinChat')
	async joinChat(@Headers('chatName') chatName: string,
				   @Headers('userName') userName: string,
				   @Headers('password') password: string) {
		console.log("--joinChat was called")
		console.log('joinChat ' + chatName + ' ' + userName + ' ' + password);

		try {
			var chatId = await this.chatService.getSafeChatId(chatName)
			var userId = await this.chatService.getSafeUserId(userName)
		} catch {
			throw new BadRequestException("Such chat-user combination wasn't found")
		}

		// TODO Handle password connection
		return await this.chatService.joinChat(chatId, userId, password);
	}

	@Get('/leave')
	async leaveChat(@Headers('chatName') chatName: string,
					@Headers('userName') userName: string) {
		console.log("--leaveChat was called")
		console.log('leaveChat ' + chatName + ' ' + userName);

		try {
			var chatId = await this.chatService.getSafeChatId(chatName)
			var userId = await this.chatService.getSafeUserId(userName)
		} catch {
			throw new BadRequestException("Such chat-user combination wasn't found")
		}

		await this.chatService.leaveChat(chatId, userId);
	}

	@Get('/:chat/public')
	async isPrivate(@Param('chat') chatName: string) {
		//console.log("--isPrivate was called")
		//console.log(chatName)

		try {
			var chatId = await this.chatService.getSafeChatId(chatName)
		} catch {
			throw new BadRequestException("Such chat wasn't found")
		}

		return await this.chatService.isPrivate(Number(chatId))
	}

	@Get('/user/:login')
	async getUserChatsName(@Param('login') login: string) {
		//console.log("--getUserChatsName was called")
		//console.log("login = " + login)
		
		try {
			let userId = await this.chatService.getSafeUserId(login)
		} catch {
			throw new BadRequestException("Such user wasn't found")
		}

		return (await this.chatService.getUserChatsName(login))
	}

	@Get('/:chat/messages')
	async getMessageHistory(@Param('chat') chat: string,
							@Req() req: Request) {
		//console.log("--getMessageHistory was called")
		//console.log(chat)

		try {
			var userId = req['user'].id;
			var chatId = await this.chatService.getSafeChatId(chat)
		} catch {
			throw new BadRequestException("Such chat wasn't found")
		}

		return (await this.chatService.getChatMessages(chatId, userId));
	}

	@Get('isUserInChat/:chat')
	async isUserInChat(@Param('chat') chatName: string,
					   @Query('user') userName: string) {
		//console.log("--isUserInChat was called");
		//console.log("Chat: " + chatName + "userName: " + userName);

		try {
			var chatId = await this.chatService.getSafeChatId(chatName)
			var userId = await this.chatService.getSafeUserId(userName)
		} catch {
			throw new BadRequestException("Such chat wasn't found")
		}

		return (await this.chatService.isUserInChat(chatId, userId));
	}

	@Get('/:chat/bans')
	async banList(@Param('chat') chatName: string) {
		console.log("--banList was called")

		try {
			var chatId = await this.chatService.getSafeChatId(chatName)
		} catch {
			throw new BadRequestException("Such chat wasn't found")
		}

		return (await this.chatService.getBanList(Number(chatId)))
	}

	@Get('/:chat/mutes')
	async muteList(@Param('chat') chatName: string) {
		console.log("--muteList was called")

		try {
			var chatId = await this.chatService.getSafeChatId(chatName)
		} catch {
			throw new BadRequestException("Such chat wasn't found")
		}

		return (await this.chatService.getMuttedList(Number(chatId)))
	}

	@Get('/:chat/isAdmin')
	async isAdmin(@Query('user') username: string,
					@Param('chat') chatName: string) {
		//console.log('--isAdmin was called');
		//console.log('Username: ' + username + ' chat: ' + chatName);

		try {
			var chatId = await this.chatService.getSafeChatId(chatName)
			var userId = await this.chatService.getSafeUserId(username)
		} catch {
			throw new BadRequestException("Such chat, or users doens't exist")
		}
		if (!(this.isUserInChat(chatName, username)))
			throw new BadRequestException("You are not member of this chat.")

		return (this.chatService.isAdmin(chatId, userId));
	}

	@Get('/:chat/admins')
	async adminList(@Param('chat') chatName: string) {
		console.log("--adminList was called")

		try {
			var chatId = await this.chatService.getSafeChatId(chatName)
		} catch {
			throw new BadRequestException("Such chat wasn't found")
		}

		return (await this.chatService.getAdminList(Number(chatId)))
	}

	// EXAMPLE:
	// localhost:9000/chat/createDm?requesterNickName='current_user?requestedNickName='wanted_user'
	// it will return a string containing the new created Chat entity name
	// '-current_user-wanted_user-'
	@Post('createDm')
	async creatDm(
		@Query('requesterNickName') requesterNickName: string,
		@Query('requestedNickName') requestedNickName: string) {
			try {
				var userOneId = await this.chatService.getSafeUserId(requesterNickName)
				var userTwoId = await this.chatService.getSafeUserId(requestedNickName)
			} catch {
				throw new BadRequestException("One (or both) of requested users doesn't exists")
			}
			return this.chatService.createDm(userOneId, userTwoId, requesterNickName, requestedNickName)
		}

	@Post('create')
	async createChat(@Body() newChat: ChatDto) {
		console.log("--createChat was called")
		console.log(newChat)
		// TODO : add ownerid verifications
		if (!newChat.name || !newChat.owner)
				throw new BadRequestException('Missing fields for create Chat')
		if (newChat.private && newChat.password == null)
			throw new BadRequestException('If private chat, a password must be specified')
		if (newChat.name.includes('-'))
			throw new BadRequestException("'-' character is forbided in group names")
		if (await this.chatService.findChat(newChat.name))
			throw new UnauthorizedException('A channel with this name already exist')
		if (newChat.name.search("/[^a-zA-Z0-9_]/") != -1)
			throw new BadRequestException("Only numbers, letter and underscore allowed for chat Name")
		if (newChat.private == true && (newChat.password == null || newChat.password == ""))
			throw new BadRequestException("A private chat MUST contain a password")
		
		try {
			const ownerId = await this.chatService.getSafeUserId(newChat.owner)
			return await this.chatService.createChat(newChat, ownerId)
		} catch (ex) {
			return {error: ex.message}
		}
	}

	@Get('isChat')
	async isChatExist(@Query('chatName') chatName: string) {
		console.log("--isChatExist was called")
		console.log(chatName)

		try {
			var chatId = await this.chatService.getSafeChatId(chatName)
		} catch {
			throw new BadRequestException("Such chat wasn't found")
		}

		return await this.chatService.findChat(chatName)
	}

	@Patch('/:chat/privacy')
	async changePrivacy(@Param('chat') chatName: string) {
		console.log("--changePrivacywas called")
		console.log(chatName)

		try {
			var chatId = await this.chatService.getSafeChatId(chatName)
		} catch {
			throw new BadRequestException("Such chat wasn't found")
		}

		return await this.chatService.changePrivacy(chatId)
	}


	@Patch('/:chatName/kick/:toUser')
	async kickUser(@Param('chatName') chatName: string,
				   @Param('toUser') toUser: string,
				   @Req() req: Request){
		const fromUser = req['user'].username
		try {
			var chatId = await this.chatService.getSafeChatId(chatName)
			var toUserId = await this.chatService.getSafeUserId(toUser)
			var fromUserId = await this.chatService.getSafeUserId(fromUser)
		} catch {
			throw new BadRequestException("Such chat, or users doens't exist")
		}
		if(await this.chatService.isAdmin(Number(chatId), fromUserId) == false)
			throw new UnauthorizedException('User has to be an administrator!');
		if (await this.chatService.isOwner(chatId, toUserId))
			return "Don't Be a Menace to South Central While Drinking Your Juice in the Hood"
		var ret = await this.chatService.kickUser(chatId, toUserId)
	}

	@Patch('/:chatName/changeRights/:toUser')
	async changeUserStatus(@Param('chatName') chatName: string,
						   @Query('newStatus') newStatus: string,
						   @Param('toUser') toUser: string,
						   @Req() req: Request) {
		const fromUser = req['user'].username;

		console.log("changeUserStatus was called")
		console.log("chatName = " + chatName)
		console.log("newStatus = " + newStatus)
		console.log("fromUser = " + fromUser)
		console.log("toUser = " + toUser)
		console.log("Action to made is = " + newStatus)



		try {
			var chatId = await this.chatService.getSafeChatId(chatName)
			var toUserId = await this.chatService.getSafeUserId(toUser)
			var fromUserId = await this.chatService.getSafeUserId(fromUser)
		} catch {
			throw new BadRequestException("Such chat, or users doens't exist")
		}
		if (await this.chatService.isOwner(chatId, toUserId))
			return "Don't Be a Menace to South Central While Drinking Your Juice in the Hood"
		var ret
		if(await this.chatService.isAdmin(Number(chatId), fromUserId)){
			switch (newStatus){
				case 'ban':
					ret = await this.chatService.banUser(Number(chatId), toUserId, true);
					break;
				case 'unban':
					ret = await this.chatService.banUser(Number(chatId), toUserId, false);
					break;
				case 'mute':
					ret = await this.chatService.setUserMute(Number(chatId), toUserId, true);
					break;
				case 'unmute':
					ret = await this.chatService.setUserMute(Number(chatId), toUserId, false);
					break;
				case 'setadmin':
					ret = await this.chatService.setUserAdmin(Number(chatId), toUserId, true);
					break;
				case 'unsetadmin':
					ret = await this.chatService.setUserAdmin(Number(chatId), toUserId, false);
					break;
			}
		} else {
			throw new UnauthorizedException('User has to be an administrator!');
		}
		return ret;
	}

	@Get('allChatsTest')
	async allChatsTest() {
		console.log("--allChatsTest was called")
		console.log("LOL")

		return await this.chatService.allChatsTest();
	}
	@Get('allChatTokensTest')
	async allChatTokensTest() {
		console.log("--allChatTokensTest was called")
		console.log("42")

		return await this.chatService.allChatTokensTest();
	}
	// '-' is forbided in group names

	// check that User that uses setUserAdmin | setUserMute | banUser 
	// is an actual administrator, must be done here using 
	// this.chatService.isAdmin(userId)
}
