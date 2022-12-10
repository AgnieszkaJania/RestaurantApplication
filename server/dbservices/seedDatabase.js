const {Statuses, Cuisines} = require('../models')

async function seedDatabase(){
    await Statuses.bulkCreate([
        {status: "Available"},
        {status: "Booked"},
        {status: "Disabled"},
        {status: "Deleted"},
    ],{ignoreDuplicates: true});
    await Cuisines.bulkCreate([
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
    ],{ignoreDuplicates:true});
}

module.exports = {
    seedDatabase:seedDatabase
}