import { WebSocketV2 } from "smartapi-javascript";
import { config } from "dotenv";
import fs from 'fs';
const tokens = JSON.parse(fs.readFileSync('./src/angel_one/src/tokens.json', 'utf-8'));

config();

// Create directories if they don't exist
const niftyDir = './src/angel_one/src/nifty_files';
const sbinDir = './src/angel_one/src/sbin_files';

if (!fs.existsSync(niftyDir)) {
    fs.mkdirSync(niftyDir);
}

if (!fs.existsSync(sbinDir)) {
    fs.mkdirSync(sbinDir);
}

export function scheduleExecution() {
    // Get the current time in IST
    const now = new Date();
    const nowIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    // Set target time in IST
    const targetTime = new Date(nowIST);
    targetTime.setHours(9, 15, 0, 0);

    if (nowIST >= targetTime) {
        fetchData();
    } else {
        let executionTime = millisecondsTillGivenTime("09:15");
        setTimeout(fetchData, executionTime);
    }
}


function fetchData() {
    console.log("Reached Fetching Data", tokens.is_execution_going_on);
    if (tokens.is_execution_going_on) {
        console.log("Execution is already running.");
        return; // Exit if execution is already running

    }

    tokens.is_execution_going_on = true; // Set execution status to true
    try {
        fs.writeFileSync('./src/angel_one/src/tokens.json', JSON.stringify(tokens, null, 2)); // Update tokens.json
        const tokensTemp = JSON.parse(fs.readFileSync('./src/angel_one/src/tokens.json', 'utf-8'));
        console.log("Updated Tokens", tokensTemp);
    } catch (error) {
        console.error("Error writing tokens.json:", error);
    }

    let web_socket = new WebSocketV2({
        jwttoken: tokens.jwt_token,
        apikey: process.env.API_KEY,
        clientcode: process.env.CUSTOMER_ID,
        feedtype: tokens.feed_token,
    });

    web_socket.connect().then((res) => {
        let json_req = {
            correlationID: "797",
            action: 1,
            mode: 2,
            exchangeType: 1,
            tokens: ["3045", "26000"],
        };

        web_socket.fetchData(json_req);

        // Schedule WebSocket closure
        const closeTime = millisecondsTillGivenTime("15:30");
        setTimeout(() => {
            web_socket.close();
            tokens.is_execution_going_on = false; // Reset execution status on close
            fs.writeFileSync('./src/angel_one/src/tokens.json', JSON.stringify(tokens, null, 2)); // Update tokens.json
        }, closeTime);

        // Handle incoming data
        web_socket.on("tick", receiveTick);

        // Handle errors
        web_socket.on("error", (error) => {
            console.error("WebSocket error:", error);
        });

        // Handle WebSocket closure
        web_socket.on("close", () => {
            console.log("WebSocket closed");
        });

    }).catch((error) => {
        console.error("WebSocket connection error:", error);
    });
}

function receiveTick(data) {
    const last_traded_price = data.last_traded_price / 100;
    const last_traded_quantity = data.last_traded_quantity;
    const volume_traded = data.vol_traded;
    const open = data.open_price_day / 100;
    const high = data.high_price_day / 100;
    const low = data.low_price_day / 100;
    const close = data.close_price / 100;
    let time = new Date(Number(data.exchange_timestamp));
    time = isNaN(time.getTime()) ? "" : formatDate(time);

    let line = `${last_traded_price},${time},${last_traded_quantity},${volume_traded},${open},${close},${high},${low}\n`;

    let date = new Date();
    let formattedDate = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');

    if (data.token === '"26000"') {
        let file_name = `${niftyDir}/NIFTY${formattedDate}.txt`;
        fs.appendFile(file_name, line, (err) => {
            if (err) throw err;
        });
    } else if (!isNaN(last_traded_price) && time !== "") {
        let file_name = `${sbinDir}/SBIN${formattedDate}.txt`;
        fs.appendFile(file_name, line, (err) => {
            if (err) throw err;
        });
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-based
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function millisecondsTillGivenTime(timeStr) {
    const now = new Date();
    const nowIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    let [hours, minutes] = timeStr.split(':').map(Number);

    const targetTime = new Date(nowIST);
    targetTime.setHours(hours, minutes, 0, 0);

    const millisecondsDifference = targetTime - nowIST;

    return millisecondsDifference > 0 ? millisecondsDifference : 0;
}
