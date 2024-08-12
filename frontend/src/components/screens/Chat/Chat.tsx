import { FC, useEffect, useState } from "react";
import { useUserInfos } from "@/contexts/User/Component";

import "./chat.css"

import ChatManager from "./ChatManagement/ChatManager";
import GoToAuth from "@/components/common/auth/GoToAuth";
import PageLoading from "@/components/common/PageLoading";
import { useRouter } from "next/router";
import axios from "axios";
import OpenChat from "./OpenChat/OpenChat";

const Chat: FC = () => {
	const [selected, setSelected] = useState<string | null>(null);

	const loading = useUserInfos().fetching.fetching;
	const logged = useUserInfos().logged.logged;

	const userData = useUserInfos();
	const router = useRouter();

	useEffect(() => {
		const setChatFormParam = async () => {
			const queryParams = new URLSearchParams(window.location.search);
			const chat = queryParams.get('chat');
			if (chat) {
				var result: boolean = false;

				await axios.get('/api/chat/isChat?chatName=' + chat)
				.then(res => {
					result = res.data;
				});

				if (result)
					setSelected(chat);
			}
		}

		setChatFormParam();
	}, []);

	useEffect(() => {
		if (userData.fetching.fetching === true)
			setTimeout(() => userData.setFetching({fetching: false}), 1000);
	}, [userData.fetching.fetching]);
	

	const selectChat = (chatName: string | null) => {
		setSelected(chatName);
		if (!chatName)
			router.push('/chat');
		else
			router.push('/chat?chat=' + chatName);
	}

	const closeChat = (event: any) => {
		if (event.key === 'Escape') {
			selectChat(null);
		}
	}


	if (loading) {
		return (
			<div className="chats">
				<div style={{height: '39px'}}></div>
				<div className='back'>
					<PageLoading/>
				</div>
			</div>
		);
	}
	
	if (!logged) {
		return (
			<div className="chats">
				<div style={{height: '39px'}}></div>
				<div className='back'>
					<GoToAuth/>
				</div>
			</div>
		)
	}

	return (
		<div className="chats" onKeyDown={closeChat} tabIndex={0}>
			<div style={{height: '39px'}}></div>
			<div className='back'>
				<div className="chats_list">
					<ChatManager callback={selectChat}/>
				</div>

				<div className='separation_line'></div>
				
				<div className='chat'>
					<OpenChat chatName={selected}/>
				</div>
			</div>
		</div>
	);
}

export default Chat