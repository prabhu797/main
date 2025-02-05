import { SmartAPI } from 'smartapi-javascript';
import fs from 'fs';
import { config } from 'dotenv';
const tokens = JSON.parse(fs.readFileSync('./src/angel_one/src/tokens.json', 'utf-8'));
import { scheduleExecution } from './processData.js';

config();

//* .env file
//* API_KEY="your_api_key"
//* CUSTOMER_ID="your_customer_id"

export async function establishConnection(password, totp) {
	let smart_api = new SmartAPI({
		api_key: process.env.API_KEY,
	});

	try {
		const initialData = await smart_api.generateSession(process.env.CUSTOMER_ID, password, totp);

		if (initialData.status) {
			tokens.jwt_token = initialData.data.jwtToken;
			tokens.refresh_token = initialData.data.refreshToken;
			tokens.feed_token = initialData.data.feedToken;
			fs.writeFileSync('./src/angel_one/src/tokens.json', JSON.stringify(tokens, null, 2));
		}

		const profileData = await smart_api.getProfile();

        scheduleExecution();

		return { code: "success", message: "Logged in successfully" };
	} catch (ex) {
		console.log("Error", ex);
		return { code: "error", message: ex.message || ex };
	}
}
