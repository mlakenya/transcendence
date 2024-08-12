import { FC } from "react";
import { ChatUser } from "./Messenger";
import axios from "axios";

interface ChatAdminDropdownProps {
	goToProfile: Function;
	entry: ChatUser;
	chatName: string | null;
	refresh: React.Dispatch<React.SetStateAction<number>>;
}

enum UserStatusChange {
	ban = 'ban',
	unban = 'unban',
	mute = 'mute',
	unmute = 'unmute',
	setadmin = 'setadmin',
	unsetadmin = 'unsetadmin'
}

const ChatAdminDropdown: FC<ChatAdminDropdownProps> = ({goToProfile, entry, chatName, refresh}) => {
	const changeRights = async (username: string, newStatus: UserStatusChange) => {
		await axios.patch('api/chat/' + chatName + '/changeRights/' + username + '?newStatus=' + newStatus)
		.then(res => {
			refresh((r) => r + 1);
		})
		.catch(err => {
			console.log(err);
		})
	}

	return (
		<div className="dropdown_menu_chat">
			<div className="item" onClick={e => goToProfile(entry.user.username)}>profile</div>
			<div className="item">invite to game</div>
			{!entry.admin ?
			(<div className="item"
					onClick={e => changeRights(entry.user.username, UserStatusChange.setadmin)}>
				set as administrator
			</div>
			) : (
			<div className="item"
					onClick={e => changeRights(entry.user.username, UserStatusChange.unsetadmin)}>
				delete from administrators
			</div>
			)}
			<div className="item">kick</div>
			{!entry.banned ? (
			<div className="item"
					onClick={e => changeRights(entry.user.username, UserStatusChange.ban)}>
				ban
			</div>
			) : (
				<div className="item"
				onClick={e => changeRights(entry.user.username, UserStatusChange.unban)}>
				unban
			</div>
			)}
			
			{!entry.muted ? (
			<div className="item"
					onClick={e => changeRights(entry.user.username, UserStatusChange.mute)}>
				mute
			</div>
			) : (
				<div className="item"
				onClick={e => changeRights(entry.user.username, UserStatusChange.unmute)}>
				unmute
			</div>
			)}
		</div>
	);
}

export default ChatAdminDropdown