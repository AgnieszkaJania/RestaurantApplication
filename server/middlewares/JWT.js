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

const createRestoreToken = (user) =>{
    const restoreToken = sign({email: user.email},"restore");
    return restoreToken;
}
module.exports = {createToken, createRestaurantToken,createRestoreToken}