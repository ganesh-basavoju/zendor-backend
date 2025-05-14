const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const userRoutes=require("./routes/userRoutes");
const cartRoutes = require('./routes/cartRoutes');
const cors = require('cors');
const woodenFloorRoutes = require('./routes/woodenFloorRoutes');
const wallpaperRoutes = require('./routes/wallpaperRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const app = express();
app.use(express.json());
app.use(cors({
  origin:  "http://localhost:3000", //"https://www.zendorr.com" ||
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

require('dotenv').config();

mongoose.connect("mongodb+srv://basavojuganesh:ganeshbasavoju@ecommerce.zx0m8xj.mongodb.net/?retryWrites=true&w=majority&appName=Ecommerce");

app.use('/api/auth',authRoutes);
app.use("/api/user",userRoutes)
app.use('/api/wooden-floors', woodenFloorRoutes);
app.use('/api/wallpapers', wallpaperRoutes);
app.use('/api/cart', cartRoutes);
app.use("/api/orders",orderRoutes)
app.use("/api/payments",paymentRoutes)



app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost: ${process.env.PORT}`);
});