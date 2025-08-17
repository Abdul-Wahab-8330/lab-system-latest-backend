const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv')
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');
const testRoutes = require('./routes/testRoutes');
const labInfoRoutes = require("./routes/labInfoRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const resultRoutes = require("./routes/patientResultsRoutes");



dotenv.config()

const app = express();
const PORT = process.env.PORT || 5000

app.use(cors());
app.use(express.json());



app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use("/api/lab-info", labInfoRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/results", resultRoutes)



mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB connected Successfully');
}).catch(err => {
  console.log('MongoDB connection error:', err);
});



app.get('/', (req, res) => {
  res.send('Backend is running');
});


app.listen(PORT, '0.0.0.0' , () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
