const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

const userRoutes = require('./routes/userRoutes');
const testRoutes = require('./routes/testRoutes');
const labInfoRoutes = require("./routes/labInfoRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const resultRoutes = require("./routes/patientResultsRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const systemSettingsRoutes = require('./routes/systemSettingsRoutes');
const publicReportRoutes = require('./routes/publicReportRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const doctorShareRoutes = require('./routes/doctorShareRoutes');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io with CORS
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins (production-ready)
        methods: ["GET", "POST", "PATCH", "DELETE"]
    }
});

// Socket connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io globally accessible
global.io = io;

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use("/api/lab-info", labInfoRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use('/api/system/filters', systemSettingsRoutes);
app.use('/api/public', publicReportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/doctor-share', doctorShareRoutes);



mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB connected Successfully');
}).catch(err => {
  console.log('MongoDB connection error:', err);
});

app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Use server.listen instead of app.listen
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});