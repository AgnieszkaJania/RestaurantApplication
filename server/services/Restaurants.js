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

async function addRestaurantResetPasswordToken(restaurant, tokenData){
    const restaurantWithToken = await restaurant.update({
        resetPasswordToken: tokenData.tokenHashed,
        resetPasswordTokenExpirationDate: tokenData.expirationDate
    });
    return restaurantWithToken;
}

async function addRestaurantRestoreToken(restaurant, tokenData){
    const restaurantWithToken = await restaurant.update({
        restoreToken: tokenData.tokenHashed,
        restoreTokenExpirationDate: tokenData.expirationDate 
    });
    return restaurantWithToken;
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

async function getRestaurantById(restaurantId){
    const restaurant = await Restaurant.findOne({
        attributes:{exclude:['ownerPassword','restoreToken','restoreTokenExpirationDate','resetPasswordToken','resetPasswordTokenExpirationDate']},
        where:{id:restaurantId}
    });
    return restaurant;
}

async function getRestaurantProfileInfoById(restaurantId){
    const restaurant = await Restaurant.findOne({
        attributes:{exclude:['ownerFirstName','ownerLastName','ownerPassword','restoreToken','restoreTokenExpirationDate','resetPasswordToken','resetPasswordTokenExpirationDate']},
        where:{id:restaurantId}
    });
    return restaurant;  
}

async function getRestaurantDetailsByRestaurantId(restaurantId){
    const restaurant = await Restaurant.findByPk(restaurantId);
    return restaurant;
}

async function OtherRestaurantWithGivenNameEmail(restaurantName, restaurantEmail, checkedRestaurantId){
    const restaurant = await Restaurant.findOne({
        where:{
            [Op.and]:[
                {id:{[Op.ne]:checkedRestaurantId}},
                {[Op.or]:[
                    {restaurantName:restaurantName},
                    {restaurantEmail:restaurantEmail}
                ]}
            ]
        }
    }); 
    return restaurant;
}

async function updateRestaurant(restaurant, newData){
    const updatedRestaurant = await restaurant.update({
        restaurantName: newData.restaurantName,
        ownerFirstName: newData.ownerFirstName,
        ownerLastName: newData.ownerLastName,
        street: newData.street,
        propertyNumber: newData.propertyNumber,
        flatNumber: newData.flatNumber ? newData.flatNumber : null,
        postalCode: newData.postalCode.replace("-",""), 
        restaurantPhoneNumber: newData.restaurantPhoneNumber,
        restaurantEmail: newData.restaurantEmail,
        facebookLink: newData.facebookLink ? newData.facebookLink : null,
        instagramLink: newData.instagramLink ? newData.instagramLink : null
    });
    return updatedRestaurant;
}

async function changeRestaurantPassword(restaurant, hashedPassword){
    const updatedRestaurant = await restaurant.update({
        ownerPassword:hashedPassword
    });
    return updatedRestaurant;
}

async function resetRestaurantPassword(restaurant, hashedPassword){
    await restaurant.update({
        ownerPassword:hashedPassword,
        resetPasswordToken:null,
        resetPasswordTokenExpirationDate:null
    });
}

async function deactivateRestaurant(restaurant){
    const updatedRestaurant = await restaurant.update({
        is_active:false
    });
    return updatedRestaurant;
}

async function restoreRestaurant(restaurant){
    await restaurant.update({
        is_active:true,
        restoreToken:null,
        restoreTokenExpirationDate:null
    });
}

module.exports = {
    getRestaurantByNameOrEmail:getRestaurantByNameOrEmail,
    getRestaurantByEmail:getRestaurantByEmail,
    createRestaurant: createRestaurant,
    getRestaurantById: getRestaurantById,
    OtherRestaurantWithGivenNameEmail: OtherRestaurantWithGivenNameEmail,
    updateRestaurant: updateRestaurant,
    getRestaurantDetailsByRestaurantId: getRestaurantDetailsByRestaurantId,
    changeRestaurantPassword: changeRestaurantPassword,
    getRestaurantProfileInfoById: getRestaurantProfileInfoById,
    addRestaurantResetPasswordToken: addRestaurantResetPasswordToken,
    resetRestaurantPassword: resetRestaurantPassword,
    deactivateRestaurant: deactivateRestaurant,
    addRestaurantRestoreToken: addRestaurantRestoreToken,
    restoreRestaurant: restoreRestaurant
    
}