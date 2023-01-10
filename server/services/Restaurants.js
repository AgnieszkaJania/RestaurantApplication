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

module.exports = {
    getRestaurantByNameOrEmail:getRestaurantByNameOrEmail,
    getRestaurantByEmail:getRestaurantByEmail
}