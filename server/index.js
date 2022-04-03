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

const uploadRouter = require('./routes/upload')
app.use("/upload", uploadRouter);



db.sequelize.sync().then(()=>{
    console.log("Database synchronized !");
});
app.listen(3001, () => {
    console.log("Server running on port 3001");
});


