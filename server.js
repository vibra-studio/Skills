const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB Atlas connection URI
const uri = "mongodb+srv://youlovekhaliltlk:FTCiGr3RKyB6RMoy@cluster0.4h2dw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
mongoose.connect(uri, {
    serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
    },
})
.then(() => {
    console.log("Connected to MongoDB Atlas");
})
.catch(err => {
    console.error("MongoDB connection error:", err);
});

const skillSchema = new mongoose.Schema({
    offering: String,
    seeking: String,
    user: String,
    contact: String,
    timestamp: { type: Date, default: Date.now },
});

const Skill = mongoose.model('Skill', skillSchema);

app.use(express.json()); // Middleware to parse JSON
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Set up session middleware
app.use(session({
    secret: 'your_secret_key', // Change this to a secure key
    resave: false,
    saveUninitialized: true,
}));

// Handle incoming socket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for new skill postings
    socket.on('new skill', async (skill) => {
        const newSkill = new Skill(skill);
        await newSkill.save(); // Save to MongoDB
        io.emit('new skill', skill); // Broadcast new skill to all clients
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// API to get all skills
app.get('/skills', async (req, res) => {
    const skills = await Skill.find();
    res.json(skills);
});

// Admin login route
app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === 'your_secure_password') { // Change this to your admin password
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// Delete skill route
app.delete('/skills/:id', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    try {
        await Skill.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

server.listen(3000, () => {
    console.log('Server is running on http://127.0.0.1:3000');
});
