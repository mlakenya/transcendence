import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.servise';
import { UserDto } from '../dtos/user.dto';
import { User } from '@prisma/client';
import * as speakeasy from 'speakeasy'
import { stat } from 'fs';

export enum UserStatus {
	online = 'online',
	offline = 'offline',
	inGame = 'game'
}

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}	

	async findOne(id: string): Promise<User | null> {
		if (!id || id.length == 0)
			throw new Error('Can find user with empty id!');
		return await this.prisma.user.findUnique({
			where: { id: id },
		});
	}

	async findOneBy42Id(id: string): Promise<User | null> {
		return await this.prisma.user.findFirst({
			where: { fortytwo_id: id },
		});
	}

	async findOneByName(username: string): Promise<User | null> {
		return await this.prisma.user.findFirst({
			where: { username: username },
		});
	}

	async createUser(userDto: UserDto): Promise<User> {
		const secret = speakeasy.generateSecret({ length: 20 });

		console.log("QR code generation string: " + secret.otpauth_url)
		const new_user = await this.prisma.user.create({
			data: {
				username: userDto.username,
				first_name: userDto.first_name,
				last_name: userDto.last_name,
				fortytwo_id: userDto.fortytwo_id.toString(),
				status: userDto.status,
				profilePic: userDto.profilePic,
				googleSecret: secret.ascii,
			},
		});

		return new_user;
	}

	async setStatus(userID: string, status: UserStatus) {
		const user: User | null = await this.findOne(userID);
		if (!user)
			return ;
		if (user.status != status) {
			user.status = status;
			await this.prisma.user.update({
				where: { id: user.id },
				data: user,
			});
		}
	}

	async updateProfilePic(filename: string, user: User) {
		if (user.profilePic == filename)
			return ;
		user.profilePic = filename;
		await this.prisma.user.update({
			where: { id: user.id },
			data: user,
		});
	}

	async disable2FA(user: User) {
		if (user.twoFAEnabled) {
			user.twoFAEnabled = false;
			await this.prisma.user.update({
				where: { id: user.id },
				data: user,
			});
		}
	}

	async enable2FA(user: User) {
		if (!user.twoFAEnabled) {
			user.twoFAEnabled = true;
			await this.prisma.user.update({
				where: { id: user.id },
				data: user,
			});
		}
	}

	async saveGoogleSecret(user: User, secret: any) {
		if (!user.googleSecret) {
			user.googleSecret = secret.ascii;
			await this.prisma.user.update({
				where: { id: user.id },
				data: user,
			});
		}
	}

	async changeNick(user: User, newNick: string) {
		const exist: User | null = await this.findOneByName(newNick);
		if (exist)
			throw new Error('User already exists!');
		
		user.username = newNick;
		await this.prisma.user.update({
			where: { id: user.id },
			data: user,
		});
	}

	async leaderboard() {
		const topUsers = await this.prisma.user.findMany({
			take: 10,
			orderBy: {
			  ranking: 'desc',
			},
			select: {
			  username: true,
			  profilePic: true,
			  ranking: true,
			  winsNumber: true,
			  loosesNumber: true,
			},
		});

		return topUsers;
	}

	async friendList(user: User) {
		const friendships = await this.prisma.friendship.findMany({
			where: { userId: user.id },
			select: { friendID: true },
		  });

		const friendIDs = friendships.map((friendship) => friendship.friendID);

		const friendsData = await this.prisma.user.findMany({
			where: {
			  id: { in: friendIDs },
			},
		});
		
		return friendsData;
	}

	async isFriend(username: string, user: User) {
		const friend: User = await this.findOneByName(username);
		if (!friend)
			return ({error: 'No such user!'});

		const exists = await this.prisma.friendship.findMany({
			where: {
				userId: user.id,
				friendID: friend.id,
			}
		})

		if (exists.length > 0)
			return true;
		else
			return false;
	}

	async addFriend(user: User, friendNick: string) {
		const friend: User = await this.findOneByName(friendNick);
		if (!friend)
			return ({error: 'No such user!'});

		const userToFriend = await this.prisma.friendship.findFirst({
			where: {
				userId: user.id,
				friendID: friend.id,
			}
		})

		const friendToUser = await this.prisma.friendship.findFirst({
			where: {
				userId: friend.id,
				friendID: user.id,
			}
		})

		if (friendToUser && friendToUser.blocked)
			return ({error: friendNick + ' blocked you'})

		if (userToFriend && friendToUser)
			return ({error: 'Already friend!'});

		const relation = await this.prisma.friendship.create({
			data: {
				userId: user.id,
				friendID: friend.id,
			}
		})

		const friendRelation = await this.prisma.friendship.create({
			data: {
				userId: friend.id,
				friendID: user.id,
			}
		})

		if (!relation || !friendRelation)
			return ({error: 'Cannot add friend'});

		return ({success: friendNick + ' is now your frined!'});
	}

	async blockUser(user: User, friendNick: string) {
		const friend = await this.findOneByName(friendNick);
		if (!friend)
			return ({error: 'No such user'});

		var userToFriend = await this.prisma.friendship.findFirst({
			where: {
				userId: user.id,
				friendID: friend.id,
			}
		})

		if (!userToFriend) { // If not friend, create relation
			await this.prisma.friendship.create({
				data: {
					userId: user.id,
					friendID: friend.id,
					blocked: true,
				}
			})
		} else {
			// Block
			userToFriend.blocked = true;
			await this.prisma.friendship.update({
				where: { id: userToFriend.id },
				data: userToFriend,
			});
			const friendToUser = await this.prisma.friendship.findFirst({
				where: {
					userId: friend.id,
					friendID: user.id,
				}
			})
			if (friendToUser) // If already friends, delete from the other side
				await this.prisma.friendship.delete({
					where: { id: friendToUser.id }
			})
		}

		return ({success: 'User blocked'});
	}

	async unblockUser(user: User, friendNick: string) {
		const friend: User = await this.findOneByName(friendNick);
		if (!friend)
			return ({error: 'No such user!'});

		const userToFriend = await this.prisma.friendship.findFirst({
			where: {
				userId: user.id,
				friendID: friend.id,
			}
		})

		if (!userToFriend) // Check that user is banned
			return ({error: 'No such relations found'})

		else { // Delete previous entry
			await this.prisma.friendship.delete({
				where: { id: userToFriend.id },
			});
		}

		return ({success: 'You are friends now'})
	}

	async deleteFriend(user: User, friendNick: string) {
		const friend = await this.findOneByName(friendNick);
		if (!friend)
			return ({error: 'No such user'});

		const friendship = await this.prisma.friendship.findFirst({
			where: {
				userId: user.id,
				friendID: friend.id,
			}
		})

		if (!friendship)
			return ({error: 'You are not friends'});
		
		const friendship2 = await this.prisma.friendship.findFirst({
			where: {
				userId: friend.id,
				friendID: user.id,
			}
		})

		await this.prisma.friendship.deleteMany({
			where: {
				OR: [
					{ id: friendship.id },
					{ id: friendship2.id },
				  ],
			},
		})
	}

	async isBlocked(user: User, friendNick: string) {
		const friend = await this.findOneByName(friendNick);
		if (!friend)
			return ({error: 'No such user'});

		const friendship = await this.prisma.friendship.findFirst({
			where: {
				userId: user.id,
				friendID: friend.id,
			}
		})
		
		if (!friendship)
			return ({error: 'You are not friends'});
		
		return {success: friendship.blocked};
	}
}