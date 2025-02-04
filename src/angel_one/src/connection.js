import { SmartAPI } from 'smartapi-javascript';
import fs from 'fs';
import { config } from 'dotenv';
import tokens from './tokens.json' assert { type: 'json' };
import { scheduleExecution } from './processData.js';

config();

//* .env file
//* API_KEY="your_api_key"
//* CUSTOMER_ID="your_customer_id"

export async function establishConnection(password, totp) {
	let smart_api = new SmartAPI({
		api_key: process.env.API_KEY,
	});

    console.log("API Key", process.env.API_KEY);
    console.log("Customer ID", process.env.CUSTOMER_ID);
    console.log("Password", password);
    console.log("TOTP", totp);

	try {
		const initialData = await smart_api.generateSession(process.env.CUSTOMER_ID, password, totp);
		console.log("Initial Data", initialData);

		if (initialData.status) {
			tokens.jwt_token = initialData.data.jwtToken;
			tokens.refresh_token = initialData.data.refreshToken;
			tokens.feed_token = initialData.data.feedToken;
			fs.writeFileSync('./tokens.json', JSON.stringify(tokens, null, 2));
		}

		const profileData = await smart_api.getProfile();
		console.log("Final Data", profileData);

        scheduleExecution();

		return { code: "success", message: "Logged in successfully" };
	} catch (ex) {
		console.log("Error", ex);
		return { code: "error", message: ex.message || ex };
	}
}
