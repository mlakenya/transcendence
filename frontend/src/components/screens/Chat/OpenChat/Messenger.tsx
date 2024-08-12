import axios from 'axios';
import React, { useState, useEffect, useRef, FC } from 'react';
import './messenger.css'
import { useUserInfos } from '@/contexts/User/Component';
import { io, Socket } from "socket.io-client";
import { useRouter } from 'next/router';
import { UserData } from '@/contexts/User/FetchUserData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

interface MessengerProps {
	chatName: string | null;
	isPrivate: boolean;
	inChat: boolean;
}

interface Message {
	body: string,
	fromUser: {
		username: string;
	};
}

interface SendMessage {
	username: string;
	payload: string;
}

export interface ChatUser {
	user: UserData;
	banned: boolean;
	admin: boolean;
	muted: boolean;
}

let socket: Socket;

const Messenger: FC<MessengerProps> = ({chatName, isPrivate, inChat}) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [chatPassword, setChatPassword] = useState('');
	const [openChatPass, setOpenChatPass] = useState<boolean>(false);
	const [passError, setPassError] = useState('');

	const userId: string = useUserInfos().userId.userId;
	const username: string = useUserInfos().userName.userName;
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const router = useRouter();


	useEffect(() => {
		const fetchMessages = async () => {
			await axios.get('/api/chat/' + chatName + '/messages', {params: {user: username}})
			.then(res => {
				setMessages(res.data);
				setTimeout(scrollToBottom, 10);
			});
		}

		const createSocket = async () => {
			console.log('socket created');
			socket = io("http://localhost:9000", { // ! Нужно будет использовать переменую с аддресщь
				transports: ['websocket'],		   // ! cайта
				withCredentials: true,
			});

			socket.emit("join", {username: username, chatName: chatName})

			socket.on("message", (data) => {
				const mssg: Message = {
					body: data['body'],
					fromUser: {
						username: data['userid']
					}};
				
				console.log('new message recived');
				setMessages(prev => [...prev, mssg]);

				setTimeout(scrollToBottom, 10);
			});
		}

		const fetching = async () => {
			if (chatName) {
				fetchMessages();

				if (inChat)
					createSocket();
			}
		}

		fetching();

		return (() => {
			if (socket) {
				socket.close();
			}
		});
	}, [chatName])


	const scrollToBottom = () => {
		console.log('scrolling messages');
		if (scrollContainerRef.current) {
			const scrollContainer = scrollContainerRef.current;
			scrollContainer.scrollTop = scrollContainer.scrollHeight;
		}
	};

	const sendMessage = () => {
		if (newMessage.length > 0) {
			const mess: SendMessage = {payload: newMessage, username: username};
			if (socket)
				socket.emit('message', mess);
			setNewMessage('');
		}
	}

	const joinChatWithPass = async () => {
		await axios.get('api/chat/joinChat', {headers: {chatName: chatName, userName: username, password: chatPassword}})
		.then((res) => {
			console.log('Join chat result')
			console.log(res.data);
			if (res.data)
				window.location.reload();
			else
				setPassError('Wrong password!')
		})
		.catch((error) => {
			console.log(error);
		})
	}

	const joinChat = async () => {
		if (isPrivate) {
			setOpenChatPass(true);
			return;
		}

		await axios.get('api/chat/joinChat', {headers: {chatName: chatName, userName: username}})
		.then((res) => {
			window.location.reload();
		})
		.catch((error) => {
			console.log(error);
		})
	}

	const pressKey = (event: any) => {
		if (event.key == 'Enter')
			sendMessage();
	}

	const pressKeyPass = (event: any) => {
		if (event.key == 'Enter')
			joinChatWithPass();
	}

	const goToFriend = (userName: string) => {
		router.push('/friends?username=' + userName);
	}


	return (
		<>		
		<div className='windows_with_messages' ref={scrollContainerRef} style={!messages ? {opacity: '0'} : {opacity: '1'}}>
			{/* List of messages */}
			{/* If user is not in channel and this channel is private - hide messages */}
			<ul style={isPrivate && !inChat ? {display: 'none'} : {}}>
				{/*
				*  Iterating throught an array of messages 
				*/}
				{messages.map((entry: Message, index) => (
				<li key={index}>
					<div className='message'
						style={entry.fromUser.username == username 
						? {marginLeft: 'auto'} 
						: {marginRight: 'left'}}>

						{/* Message sender name */}
						<div className='sender-name'
						style={entry.fromUser.username == username
						? {display: 'none'} 
						: {textAlign: 'left'}}>
							<span onClick={(e) => goToFriend(entry.fromUser.username)}>
								{entry.fromUser.username}
							</span>
						</div>

						{/* Message text */}
						<span>
							{entry.body}
						</span>
					</div>
				</li>
				))}
			</ul>
		</div>
		
		{/* Chat footer */}
		{inChat
		? (
			<div className="new-message-panel">
				<input type='text'
						id="message-input"
						placeholder="New message"
						value={newMessage}
						onChange={e => setNewMessage(e.target.value)}
						onKeyDown={pressKey}>
				</input>
				<button className='send-button' onClick={sendMessage}>Send</button>
			</div>
		) : (
			<div className="join-chat-pannel">
				<button className='join-button' onClick={joinChat}>Join this chat</button>
			</div>
		)}

		{openChatPass && (
		<div className='join-private'>
			<h2 style={{marginBottom: '30px'}}>Enter password</h2>
			<input id='pass-input'
				   value={chatPassword}  
				   type='password'
				   onChange={e => setChatPassword(e.target.value)}
				   onKeyDown={pressKeyPass}>
			</input>
			<div className="icon_dots_chat" onClick={e => {setOpenChatPass(false)}}>
				<FontAwesomeIcon icon={faXmark} className="i"/>
			</div>
			<span className='invalid-feedback'>{passError}</span>
		</div>
		)}
		</>
	);
};

export default Messenger;