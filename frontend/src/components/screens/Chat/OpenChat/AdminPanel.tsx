import { FC } from "react";
import './adminPanel.css'

const AdminPanel: FC = () => {
	return (
		<div className='admin-panel'>
			<div className="search-panel">
				<input type='text' placeholder="Add/change password" style={{width: "auto"}}/>
				<button style={{width: "auto"}}>Do it</button>
			</div>
			
			<button>Delete password</button>
			{/* <input type='text' id="search-input" placeholder="Add user"/> */}
		</div>
	);
}

export default AdminPanel