const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();

app.use(express.json());
app.use(cookieParser());

const db = require('./models');

// Routers
const userRouter = require('./routes/Users');
app.use("/users", userRouter);

const restaurantRouter = require('./routes/Restaurants')
app.use("/restaurants", restaurantRouter);

const uploadRouter = require('./routes/upload');
app.use("/upload", uploadRouter);

const tableRouter = require('./routes/Tables');
app.use("/tables", tableRouter);

const bookingRouter = require('./routes/Bookings');
app.use("/bookings", bookingRouter);

const {Statuses} = require('./models');



db.sequelize.sync().then(()=>{
   Statuses.bulkCreate([
       {status: "Available"},
       {status: "Booked"},
       {status: "Disabled"},
   ],{ignoreDuplicates: true}).then(()=> console.log("Database synchronized and seeded!"))
});


app.listen(3001, () => {
    console.log("Server running on port 3001");
});


