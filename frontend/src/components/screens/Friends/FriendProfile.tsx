import { FC, useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { UserData } from "@/contexts/User/FetchUserData";
import './friendProfile.css'
import axios from "axios";
import { useRouter } from "next/router";

interface FriendProfileProps {
	friendData: UserData | null;
	callback: Function;
}

const FriendProfile: FC<FriendProfileProps> = ({friendData, callback}) => {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isBlocked, setIsBlocked] = useState(false);
	const [isFriend, setIsFriend] = useState<boolean>(true);

	const router = useRouter();

	useEffect(() => {
		const queryParams = new URLSearchParams(window.location.search);
		const username = queryParams.get('username');
		if (username) {
			callback(username);
			handleIsFriend(username);
		}
	}, []);

	useEffect(() => {
		const checkBlocked = async () => {
			if (friendData)
				await axios.get('/api/user/isBlocked', {headers: {friendNick: friendData?.username}})
				.then(res => {
					if (!res.data) {
						console.log('Error');
					}
					if (res.data['success']) {
						setIsBlocked(true)
					} else {
						setIsBlocked(false);
					}
				})
		};

		checkBlocked();
	}, [friendData]);

	const handleIsFriend = async (username: string) => {
		await axios.get('/api/user/isFriend/' + username)
		.then(res => {
			setIsFriend(res.data);
		})
		.catch(error => {
			console.log(error);
		})
	}

	const addFriend = async () => {
		await axios.get('/api/user/addFriend', {headers: {friendNick: friendData?.username}})
		.then(res => {
			callback(friendData?.username);
			setIsFriend(true);
		})
		.catch(error => {
			console.log(error);
		})
	}

	// ----------------- DROPDOWN -----------------

	const toggleDropdown = (e: any) => {
		e.stopPropagation()
		setIsDropdownOpen(!isDropdownOpen);
	};

	const hideDropdown = () => {
		setIsDropdownOpen(false);
	};

	const blockUser = async () => {
		await axios.get('/api/user/blockUser', {headers: {friendNick: friendData?.username}})
		.then(res => {
			console.log('User blocked');
		})
	}

	const deleteFriend = async () => {
		await axios.get('/api/user/deleteFriend', {headers: {friendNick: friendData?.username}})
		.then(res => {
			callback(friendData?.username);
			setIsFriend(false);
			console.log('User deleted');
		})
	}

	const sendMesssage = async () => {
		// TODO open or create this chat.
		router.push('/chat');
	}

	if (isBlocked) {
		return (
			<div className="friendProfilePage" onClick={hideDropdown}>
				<div>
					This user is blocked
				</div>
				<button className="btn">unblock</button>
			</div>
		)
	}

	return (
		<div className="friendProfilePage" onClick={hideDropdown}>
			<div className='openEffect' style={!!friendData ? {opacity: '1'} : {opacity: '0'}}>
				<div className="img-area">
					<div className="inner-area">
						<img src={friendData ? '/api/user/profile-pictures/' + friendData.profilePic: ''} alt=""></img>
					</div>
				</div>
				{isFriend ? (
					<div className="icon dots" onClick={toggleDropdown}><FontAwesomeIcon icon={faEllipsisV} className="i" /></div>
				) : (
					<div className="icon dots" onClick={addFriend}><FontAwesomeIcon icon={faUserPlus} className="i" title="Add friend"/></div>
				)}
				<div className="dropdown">
					{isDropdownOpen && (
						<div className="dropdown-menu">
							<div className="dropdown-item" onClick={sendMesssage}>Send message</div>
							<div className="dropdown-item" onClick={blockUser}>Block user</div>
							<div className="dropdown-item" onClick={deleteFriend}>Delete from friends</div>
						</div>
					)}
				</div>
				<div style={{fontSize: '12px'}}>wins: <div className='win'>{friendData?.winsNumber}</div> looses: <div className='loose'>{friendData?.loosesNumber}</div></div>
				<div className="username">{friendData?.username}</div>
				
				<div className="fullName">{friendData?.first_name} {friendData?.last_name}</div>

				<h5>Rank: {friendData?.ranking}</h5>
			</div>
		</div>
	);
}

export default FriendProfile
