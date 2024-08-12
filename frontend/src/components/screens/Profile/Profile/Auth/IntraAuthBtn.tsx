import { FC, useContext, useEffect, useState } from "react"
import Image from "next/image";
import '@/styles/auth/intraAuthBtn.css'
import { useRouter } from "next/router";
import axios from "axios";
import { useUserInfos } from "@/contexts/User/Component";

interface IntraAuthBtnProps {
	goTo2FA: Function;
}

const IntraAuthBtn: FC<IntraAuthBtnProps> = (props) => {
	const router = useRouter();
	const userData = useUserInfos();

	useEffect(() => {
		// Function to fetch access token.
		const fetchJWTToken = async () => {
			// Check that 'code' is presented in the query string.
			const queryParams = new URLSearchParams(window.location.search);
			const code = queryParams.get('code');
			
			if (code) {
				// Deleting 'code' from query.
				queryParams.delete('code');
				const {pathname, query } = router;
				router.replace(
					{pathname, query: queryParams.toString()}, undefined, { shallow: true }
				)

				// Making request to get user data from back.
				const url = '/api/auth/loginIntra';
				const headers = {
					'Content-Type': 'application/json',
					Code: code,
				};
				await axios.post(url, {}, { headers })
				.then(async (response) => {
					// If 2fa is enabled, call callback to go to 2fa menu.
					if (response.data['need2FA']) {
						console.log('go to 2fa');
						userData.setFetching({fetching: false});
						props.goTo2FA(response.data['userID']);
					}
					else {
						console.log('login intra');
						userData.fetchData(prev => (prev + 1));
					}
				})
				.catch(error => {
					console.log(error);
				});
			}
		};
	
		fetchJWTToken();
	  }, []);
  

	return (
		<div className="intra_btn">
			<a href='/api/auth/loginIntraCode' className='login'>
				<span>LOGIN WITH</span>
				<Image 
					src="/intra_logo.svg"
					width={30}
					height={30}
					alt="Intra logo" />
			</a>
		</div>
	);
}

export default IntraAuthBtn