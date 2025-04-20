const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const userRoutes=require("./routes/userRoutes");
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());
require('dotenv').config();

mongoose.connect('mongodb+srv://basavojuganesh:ganeshbasavoju@ecommerce.6lenmys.mongodb.net/?retryWrites=true&w=majority&appName=Ecommerce');

app.use('/api/auth',authRoutes);
app.use("/api/user",userRoutes)

const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});