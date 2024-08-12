import axios from 'axios';

export interface UserData {
	id:				string,
    username: 		string,
    first_name: 	string | null,
    last_name: 		string | null,
	status: 		string,
	profilePic: 	string,
	twoFAEnabled: 	boolean,
	ranking:		number,
	winsNumber:		number,
	loosesNumber:	number,
}

const fetchUserData = async (): Promise<UserData | null> => {
	console.log('fetching user data');
	const url = '/api/auth/refreshJwt';
	const res = await axios.get(url, {})
		.then(response => {
			if (response.data['res'] != 'Success')
				return false;
			console.log('Jwt token has been refreshed');
			return true;
		})
		.catch(error => {
			console.log(error);
			return false;
		});
	
	if (!res)
		return null;
	

	const data: UserData | null = await axios.get('/api/user/userData')
		.then (response => {
			const data = response.data;
			return data;
		})
		.catch( error => {
			console.log(error);
			return null;
		});

	if (!data)
		return null;

	data.profilePic = '/api/user/profile-pictures/' + data.profilePic;
	return data;
};

export default fetchUserData;