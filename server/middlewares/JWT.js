const {sign} = require('jsonwebtoken');

const createToken = (user) =>{
    const accessToken = sign({email: user.email, id: user.id},
        "veryimportantsecretmessage"
    );
    return accessToken;
};

const createRestaurantToken = (restaurant) =>{
    const accessToken = sign({restaurantEmail: restaurant.restaurantEmail, id: restaurant.id},
        "veryimportantsecretmessageforrestaurant"
    );
    return accessToken;
};

module.exports = {createToken, createRestaurantToken}