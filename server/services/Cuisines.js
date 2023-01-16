const { Cuisine, RestaurantCuisine } = require('../models');

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
    let cuisineRestaurantObjectList = [];
    cuisinesList.forEach(element => {
        let cuisineRestaurantObject = {
            CuisineId: element,
            RestaurantId: restaurantId
        }
        cuisineRestaurantObjectList.push(cuisineRestaurantObject);
    });
    const addedCuisinesToRestaurant = await RestaurantCuisine.bulkCreate(cuisineRestaurantObjectList);
    return addedCuisinesToRestaurant;
}

module.exports = {
    checkIfCuisinesExist:checkIfCuisinesExist,
    getAllCuisines: getAllCuisines,
    getCuisinesAssignedToRestaurant: getCuisinesAssignedToRestaurant,
    addCuisinesToRestaurant: addCuisinesToRestaurant

}