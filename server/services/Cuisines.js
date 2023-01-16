const { Cuisine, RestaurantCuisine } = require('../models');
const { Op } = require('sequelize');

async function checkIfCuisinesExist(){
    const allCuisines = await Cuisine.findAll();
    return allCuisines.length > 0;
}

async function getAllCuisines(){
    const allCuisines = await Cuisine.findAll();
    return allCuisines;
}

async function getCuisinesAssignedToRestaurant(restaurantId){
    const cuisinesAssignedToRestaurant = await RestaurantCuisine.findAll({
        where:{RestaurantId: restaurantId}
    });
    return cuisinesAssignedToRestaurant;
}

async function addCuisinesToRestaurant(cuisinesList, restaurantId){
    let cuisineRestaurantObjectArray = [];
    cuisinesList.forEach(element => {
        let cuisineRestaurantObject = {
            CuisineId: element,
            RestaurantId: restaurantId
        }
        cuisineRestaurantObjectArray.push(cuisineRestaurantObject);
    });
    const addedCuisinesToRestaurant = await RestaurantCuisine.bulkCreate(cuisineRestaurantObjectArray);
    return addedCuisinesToRestaurant;
}

async function getCuisinesWithNamesAssignedToRestaurant(restaurantId){
    const cuisinesAssignedToRestaurant = await RestaurantCuisine.findAll({
        where:{RestaurantId: restaurantId},
        include:[{
            model:Cuisine,
            required:true,
        }]
    });
    return cuisinesAssignedToRestaurant;
}

async function deleteCuisinesFromRestaurant(cuisineList, restaurantId){
    const numberOfDeletedItems = await RestaurantCuisine.destroy({
        where:{[Op.and]:[
            {CuisineId: cuisineList},
            {RestaurantId: restaurantId}
        ]}
    });
    return numberOfDeletedItems > 0;
}

module.exports = {
    checkIfCuisinesExist:checkIfCuisinesExist,
    getAllCuisines: getAllCuisines,
    getCuisinesAssignedToRestaurant: getCuisinesAssignedToRestaurant,
    addCuisinesToRestaurant: addCuisinesToRestaurant,
    getCuisinesWithNamesAssignedToRestaurant: getCuisinesWithNamesAssignedToRestaurant,
    deleteCuisinesFromRestaurant: deleteCuisinesFromRestaurant

}