import React, { useState, FC, useEffect } from 'react';
import './chatDetails.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { UserData } from '@/contexts/User/FetchUserData';
import { UserStatus } from '../../Friends/FrindList';
import { useRouter } from 'next/router';
import { useUserInfos } from '@/contexts/User/Component';
import AdminPanel from './AdminPanel';
import axios from 'axios';
import { ChatUser } from './Messenger';
import ChatAdminDropdown from './ChatAdminDropdown';

interface ChatDetailsProps {
	users: ChatUser[];
	chatName: string | null;
	isAdmin: boolean;
}

const ChatDetails: FC<ChatDetailsProps> = ({users, chatName, isAdmin}) => {

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [dropdownIndx, setDropdownIndx] = useState(0);
	const [refresh, setRefresh] = useState(0);

	const userData = useUserInfos();
	const router = useRouter();


	// ----------------- DROPDOWN -----------------

	const toggleDropdown = (e: any) => {
		e.stopPropagation()
		setIsDropdownOpen(!isDropdownOpen);
	};

	const hideDropdown = () => {
		setIsDropdownOpen(false);
	};

	const goToProfile = (username: string) => {
		if (username === userData.userName.userName)
			router.push('/profile');
		else
			router.push('/friends?username=' + username);
	}

	const leaveChat = async () => {
		await axios.get('api/chat/leave', {headers: {chatName: chatName, userName: userData.userName.userName}})
		.then(res => {
			window.location.reload();
		})
		.catch(error => {
			console.log(error);
		})
	}


	return (
		<div className='chat_details' onClick={hideDropdown}>
			{isAdmin && <AdminPanel/>}

			<div className='chat-users-list'>
				{users.length > 0 && (
				<ul>
				{users.map((entry: ChatUser, index) => (
					<li key={index}>
						<div className="img-area">
							<div className="inner-area">
								<img src={'api/user/profile-pictures/' + entry.user.profilePic} />
								<div className='status' style={{backgroundColor: UserStatus[entry.user.status as keyof typeof UserStatus]}}></div>
							</div>
						</div>

						<div className='chat-info'>
							<div className='username'>{entry.user.username}</div>
						</div>
						
						{entry.user.username != userData.userName.userName &&
						<div className="icon_dots_chat" onClick={(e) => {toggleDropdown(e);setDropdownIndx(index)}}>
							<FontAwesomeIcon icon={faEllipsisV} className="i" />
						</div>
						}
						<div className="dropdown_chat">
							{(isDropdownOpen && dropdownIndx == index && isAdmin) &&
								(<ChatAdminDropdown goToProfile={goToProfile} entry={entry} chatName={chatName} refresh={setRefresh}/>)}
							{(isDropdownOpen && dropdownIndx == index && !isAdmin) &&(
								<div className="dropdown_menu_chat">
									<div className="item" onClick={e => goToProfile(entry.user.username)}>profile</div>
									<div className="item">invite to game</div>
								</div>
							)}
						</div>
					</li>
				))}	
				</ul>
				)}
				
			</div>
			<div className='leave-chat'>
				<button onClick={leaveChat}>Leave this chat</button>
			</div>
		</div>
	);
};

export default ChatDetails;