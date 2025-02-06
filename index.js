import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { establishConnection } from './src/angel_one/src/connection.js';
import fs from 'fs';

const tokens = JSON.parse(fs.readFileSync('./src/angel_one/src/tokens.json', 'utf-8'));

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
}); // Updated to use the ES module syntax

const __dirname = path.resolve(); // Get the current directory

// Middleware
app.use(express.json());
app.use(express.static('public')); // Serve static files from the public directory
app.use('/api/angel-one', express.static(path.join(__dirname, 'src/angel_one/public')));

//? Angel One APIs
// Serve index.html for the angel-login route
app.get('/api/angel-one/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/angel_one/public/index.html'));
});

// Get the password and totp and establish connection
app.post('/api/angel-one/submit', (req, res) => {
    const { password, totp } = req.body;
    const result = establishConnection(password, totp);
    res.json(result);
});

// Get the execution status
app.get('/api/angel-one/is-execution-going-on', (req, res) => {
    const result = tokens.is_execution_going_on;
    res.json(result);
});

// Get the files
app.get('/api/angel-one/files', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/angel_one/public/files.html'));
});

// Get folders ending with _files
app.get('/api/angel-one/get-folders', (req, res) => {
    const folders = fs.readdirSync(path.join(__dirname, 'src/angel_one/src'))
        .filter(file => fs.statSync(path.join(__dirname, 'src/angel_one/src', file)).isDirectory() && file.endsWith('_files'))
        .map(folder => folder.replace(/_files$/, '')); // Trim _files from folder name
    res.json(folders);
});

// Get files in a specific folder
app.get('/api/angel-one/get-files', (req, res) => {
    const folder = req.query.folder;
    const files = fs.readdirSync(path.join(__dirname, 'src/angel_one/src', `${folder}_files`))
        .filter(file => fs.statSync(path.join(__dirname, 'src/angel_one/src', `${folder}_files`, file)).isFile());
    res.json(files);
});

// Download a specific file
app.get('/api/angel-one/download-file', (req, res) => {
    const { folder, file } = req.query;
    const filePath = path.join(__dirname, 'src/angel_one/src', `${folder}_files`, file);
    res.download(filePath); // Send file for download
});

//? Main Application
// Basic route
app.get('/', (req, res) => {
    res.send(`Welcome to the Main Application!`);
});

//? WebSocket Connection
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('message', (message) => {
        console.log('Received message:', message);
        io.emit('message', message);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 5500;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
