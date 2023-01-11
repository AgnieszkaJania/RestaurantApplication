const { Restaurant } = require('../models')
const { Op } = require('sequelize');

async function getRestaurantByNameOrEmail(restaurantName,restaurantEmail){
    const restaurant = await Restaurant.findOne({
        where:{[Op.or]:[
            {restaurantEmail: restaurantEmail},
            {restaurantName:restaurantName}
        ]}
    });
    return restaurant;
}

async function getRestaurantByEmail(restaurantEmail){
    const restaurant = await Restaurant.findOne({
        where:{restaurantEmail:restaurantEmail}
    });
    return restaurant;
}

async function createRestaurant(restaurant){
    const newRestaurant = await Restaurant.create({
        restaurantName: restaurant.restaurantName,
        ownerFirstName: restaurant.ownerFirstName, 
        ownerLastName: restaurant.ownerLastName,
        ownerPassword: restaurant.ownerPassword,
        street: restaurant.street,
        propertyNumber: restaurant.propertyNumber,
        flatNumber: restaurant.flatNumber ? restaurant.flatNumber : null,
        postalCode: restaurant.postalCode.replace("-",""),
        city:restaurant.city,
        restaurantPhoneNumber: restaurant.restaurantPhoneNumber,
        restaurantEmail: restaurant.restaurantEmail,
        facebookLink: restaurant.facebookLink ? restaurant.facebookLink : null, 
        instagramLink: restaurant.instagramLink ? restaurant.instagramLink : null
    });
    return newRestaurant;
}

module.exports = {
    getRestaurantByNameOrEmail:getRestaurantByNameOrEmail,
    getRestaurantByEmail:getRestaurantByEmail,
    createRestaurant: createRestaurant
}