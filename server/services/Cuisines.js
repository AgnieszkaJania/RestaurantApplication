const { Cuisine } = require('../models');

async function checkIfCuisinesExist(){
    const allCuisines = await Cuisine.findAll();
    return allCuisines.length > 0;
}

module.exports = {
    checkIfCuisinesExist:checkIfCuisinesExist
}