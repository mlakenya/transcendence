import { FC, useEffect, useState } from "react";
import axios from "axios";
import './userProfile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { useDropzone } from 'react-dropzone';
import Enable2FA from "./Enable2FA";
import { useUserInfos } from "@/contexts/User/Component";

const UserProfile: FC = () => {
	const [qrCode, setQrCode] = useState('');
	const [twoFACheck, setTwoFACheck] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [nickChange, setNickChange] = useState(false);
	const [newNick, setNewNick] = useState('');
	const [error, setError] = useState('');

	const userData = useUserInfos();userData.ranking

	// ----------------- DROPDOWN -----------------

	const toggleDropdown = (e: any) => {
		e.stopPropagation()
		setIsDropdownOpen(!isDropdownOpen);
	};

	const hideDropdown = () => {
		setIsDropdownOpen(false);
	};

	// ----------------- NICK CHANGE BUTTON -----------------
		
	const handleChangeNick = (event: any) => {
		setNewNick(event.target.value);
	}

	const updateNickname = async () => {
		if (newNick.length < 5) {
			setError('Too short!')
			return ;
		}

		console.log('trying to change nick')
		await axios.post('/api/user/changeNick', {newNick: newNick})
			.then(async (response) => {
				const data = response.data;
				if (data['answer'] === 'success') {
					setNickChange(false);
					userData?.setUserName({userName: newNick});
				} else {
					setError('this nick is already taken!')
				}
			});
	}

	// ------------- 2FA BUTTON -----------------

	const disable2FA = async () => {
		await axios.get('/api/user/disable2FA');
		userData?.setDoubleAuth({doubleAuth: false});
	}

	const enable2FA = async () => {
		const res = await axios.get('/api/auth/qrCodeGoogle');
		setQrCode(res.data['code']);
		setTwoFACheck(true);
		userData?.setDoubleAuth({doubleAuth: true});
	}

	// ------------- AVATAR CHANGE BUTTON -------------

	const onDrop = async (acceptedFiles: any) => {
		const file = acceptedFiles[0];
		// Basic image validation
		if (!file || !file.type.startsWith('image/') || file.size > MAX_FILE_SIZE) {
			alert('Invalid file. Please upload a valid image.');
			return;
		}

		const formData = new FormData();
		formData.append('image', file);
		
		await fetch('/api/user/upload', {
			method: 'POST',
			body: formData,
		}).then(response => {
			if (!response.ok)
				throw new Error();

			const newAvatar = URL.createObjectURL(acceptedFiles[0]);
			userData?.setImage({image: newAvatar});
			console.log('File uploaded successfully!');
		}).catch(error => {
			console.log("Error while uploading file");
		});
	};
	
	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

	const {getRootProps, getInputProps, isDragActive} = useDropzone({
		onDrop,
		accept: {
			'image/jpeg': [],
			'image/png': []
		  },
		maxSize: MAX_FILE_SIZE,
	  });

	// ----------------- LOGOUT BUTTON -----------------

	const logout = async () => {
		await axios.get('/api/auth/logout');
		userData.setLogged({logged: false});

		// Immitation of loading(it loads too fast).
		userData.setFetching({fetching: true});
		await new Promise(r => setTimeout(r, 1000));
		userData.setFetching({fetching: false});
	}

	// If user wants to enable 2FA.
	if (twoFACheck) {
		return <Enable2FA qrCode={qrCode} userID={userData.userId.userId}/>;
	}

	return (
		<div className="profile_and_history_games" onClick={hideDropdown}>
			<div className="profilePage">
				{/* ======================= Icons ======================= */}
				<div className="icon dots" onClick={toggleDropdown}><FontAwesomeIcon icon={faEllipsisV} className="i" /></div>
				<div className="dropdown">
					{isDropdownOpen && (
						<div className="dropdown-menu">
							<div className="dropdown-item" onClick={(e) => setNickChange(true)}>Change nickname</div>
							{userData.doubleAuth.doubleAuth ? (
								<div className="dropdown-item" onClick={disable2FA}>Disable 2FA</div>
							) : (
								<div className="dropdown-item" onClick={enable2FA}>Enable 2FA</div>
							)}
							<div {...getRootProps()} className="dropdown-item dropzone">
								<input {...getInputProps()} />
								<span>Change avatar</span>
							</div>
							<div className="dropdown-item" onClick={logout}>Logout</div>
						</div>
					)}
				</div>

				{/* ======================= Profile image and information ======================= */}

				<div className="img-area">
					<div className="inner-area">
						<img src={userData.image.image} alt=""></img>
					</div>
				</div>
				<div className="profile_info">

					{/* --------- Nickname --------- */}
					{nickChange ? (
						<div className="nickname-change">
							<div className="nickname-change-body">
								<input type="text" value={newNick} placeholder="new nickname" onChange={handleChangeNick}></input>
								<button onClick={updateNickname}>OK!</button>
							</div>
							<span className='invalid-feedback' style={{color: 'red'}}>{error}</span>
						</div>
					):(
						<div className="username">{userData.userName.userName}</div>
					)}

					<div className="fullName">({userData.firstName.firstName} {userData.lastName.lastName})</div>
					<div className="status" style={{color: 'rgb(145, 238, 122)', fontSize: '10px'}}>online</div>
					<div style={{fontSize: '10px'}}>wins: <div className='win'>{userData.wins.wins}</div> loose: <div className='loose'>{userData.wins.wins}</div></div>
					<div style={{fontSize: '10px'}}>rank {userData.ranking.ranking}</div>
				</div>
			</div>
			{/* ======================= Games history ======================= */}
			{/* <div className="games_history">
				<ul>
					<li>
						<div className='username'>your_username</div>
						<div className="result">
							<div className="win_or_loose">win</div>
							<div className="result_count">5:4</div>
							<div className="type">type</div>
						</div>
						<div className='username'>enemy_username</div>
					</li>
				</ul>
			</div> */}
		</div>
	);
}

export default UserProfile
