import { useUserInfos } from "@/contexts/User/Component";
import { FC } from "react"
import UserProfile from "./UserProfile/UserProfile";
import Auth from "./Auth/Auth";
import PageLoading from "../../../common/PageLoading";

const AuthHandler: FC = () => {
	const userData = useUserInfos();

	// TODO
	// console.log('AuthHandler fetching ' + userData.fetching.fetching);

	return (
		<div className='account'>
			<PageLoading/>
			{userData.logged.logged
			? (
				<UserProfile/>
			) : (
				<Auth />
			)}
		</div>
	);
}

export default AuthHandler