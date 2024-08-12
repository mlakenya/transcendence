import { FC, useEffect, useState } from "react";
import Messenger, { ChatUser } from "./Messenger";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV, faXmark } from "@fortawesome/free-solid-svg-icons";
import ChatDetails from "./ChatDetails";
import axios from "axios";
import './openChat.css'
import { useUserInfos } from "@/contexts/User/Component";

interface OpenChatProps {
	chatName: string | null;
}

const OpenChat: FC<OpenChatProps> = ({chatName}) => {
	const [isOpen_chatMore, setIsOpen_chatMore] = useState(false);
	const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
	const [isAdmin, setIsAdmin] = useState<boolean>(false);
	const [isPrivate, setIsPrivate] = useState<boolean>(false);
	const [inChat, setInChat] = useState(false);

	const userData = useUserInfos();

	useEffect(() => {
		const fetchChatUsers = async () => {
			await axios.get('/api/chat/' + chatName + '/users')
			.then(res => {
				setChatUsers(res.data);
				console.log(res.data)
			})
			.catch(err => {console.log(err);});
		}

		const fetchIsAdmin = async () => {
			await axios.get('/api/chat/' + chatName + '/isAdmin?user=' + userData.userName.userName)
			.then(res => {
				setIsAdmin(res.data);
			})
			.catch(err => {
				console.log(err);
			});
		}

		const fetchPrivateChat = async () => {
			await axios.get('/api/chat/' + chatName + '/public')
			.then(res => {
				console.log("===========Private==================")
				setIsPrivate(res.data.private);
				console.log("====================================")
			})
			.catch(err => {
				console.log("===========Private_ERROR============")
				console.log(err);
				console.log("====================================")
			});
		}

		const fetchInChat = async () => {
			await axios.get('/api/chat/isUserInChat/' + chatName, {params: {user: userData.userName.userName}})
			.then(res => {
				console.log('UserInChat: ' + res.data);
				setInChat(res.data);
			});
		}

		if (chatName) {
			fetchChatUsers();
			fetchIsAdmin();
			fetchInChat();

			fetchPrivateChat();
		}

		setIsOpen_chatMore(false);
	}, [chatName]);

	const handleOpenClick_chatMore = () => {
		setIsOpen_chatMore(!isOpen_chatMore);
	};

	return (
		<div className='open-chat' style={chatName ? {} : {display: 'none'}}>
			{/* Chat header */}
			<div className='info'>
				<h3>{chatName}</h3>
			</div>
			
			<div className="icon_dots_chat" onClick={handleOpenClick_chatMore} style={isPrivate && !inChat ? {display: 'none'} : {}}>
				<FontAwesomeIcon icon={isOpen_chatMore ? faXmark : faEllipsisV} className="i"/>
			</div>
			{isOpen_chatMore && 
				(<ChatDetails users={chatUsers} chatName={chatName} isAdmin={isAdmin}/>)
			}

			<Messenger chatName={chatName} isPrivate={isPrivate} inChat={inChat}/>
		</div>
	);
}

export default OpenChat