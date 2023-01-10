const {Status, Cuisine} = require('../models');
const {checkIfStatusesExist} = require('../services/Statuses');
const {checkIfCuisinesExist} = require('../services/Cuisines');

async function seedDatabase(){
    const statusesExist = await checkIfStatusesExist();
    if(!statusesExist){
        await Status.bulkCreate([
            {status: "Available"},
            {status: "Booked"},
            {status: "Disabled"},
            {status: "Deleted"},
        ]);
    }
    const cuisinesExist = await checkIfCuisinesExist();
    if(!cuisinesExist){
        await Cuisine.bulkCreate([
            {cuisineName: "Burgers"},
            {cuisineName:"Italian"},
            {cuisineName:"Polish"},
            {cuisineName:"German"},
            {cuisineName:"Pizza"},
            {cuisineName:"Steak"},
            {cuisineName:"Asian"},
            {cuisineName:"Sushi"},
            {cuisineName:"Korean"},
            {cuisineName:"Fusion"},
            {cuisineName:"France"},
            {cuisineName:"Hungary"},
            {cuisineName:"Ramen"},
            {cuisineName:"Bao"},
        ]);
    }
}

module.exports = {
    seedDatabase:seedDatabase
}