import './gameMenu.css'
import { FC, useEffect, useState } from 'react';
import Game from './Game';
import { useUserInfos } from '@/contexts/User/Component';
import GoToAuth from '@/components/common/auth/GoToAuth';
import FriendList from '../Friends/FrindList';
import PageLoading from '../../common/PageLoading';
import GameLoad from './GameLoad';

const GameMenu: FC = () => {
	const loading = useUserInfos().fetching.fetching;
	const logged = useUserInfos().logged.logged;
	const [gameStart, setGameStart] = useState(false);

	const userData = useUserInfos();

	useEffect(() => {
		if (userData.fetching.fetching === true)
			setTimeout(() => userData.setFetching({fetching: false}), 1000);
	}, [userData.fetching.fetching]);

	const startGame = () => {
		setGameStart(true);
	}

	if (loading) {
		return (
			<div className="game">
				<div style={{height: '39px'}}></div>
				<div className='back'>
					<PageLoading/>
				</div>
			</div>
		);
	}

	if (!logged) {
		return (
			<div className="game">
				<div style={{height: '39px'}}></div>
				<div className='back'>
					<GoToAuth/>
				</div>
			</div>
		)
	}

	// TODO this scope of code is too BIG, need to split on components.
	if (!gameStart) {
		return (
			<div className='game'>

				<div style={{height: '39px'}}></div>

				<div className='back'>

					{/* <div className='left_part'>
						<h1>Your invite</h1>

						<div className='players_list'>
							<ul>
								<li>
									<div className="img-area">
										<div className="inner-area">
											<img src={''} />
												<div className='status' style={{backgroundColor: 'rgb(139, 139, 139)'}}></div>
										</div>
									</div>
									<div className='username'>username</div>
									<div className='player_info'>
										<p className='score'>score: 0</p>
										<div><div className='win'>45</div> <div className='loose'>15</div></div>
									</div>
								</li>
							</ul>
						</div>


					</div>

					<div className='separation_line'></div> */}

					<div className='right_part'>
						<h1>Choose player</h1>
						<button className='btn_random_player' onClick={startGame}>PLAY WITH RANDOM PLAYER</button>

						<div className='players_list'>
							<FriendList callback={startGame} update={0}/>
						</div>


					</div>

					
				</div>

			</div>
		)
	}
	
	
	return (
		<GameLoad />
	);
};

export default GameMenu