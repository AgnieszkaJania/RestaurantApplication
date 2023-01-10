const { Table } = require('../models');
const { Op } = require('sequelize');

async function getTableByNameAndRestaurantId(tableName, restaurantId){
    const table = await Table.findOne({
        where:{
            [Op.and]:[
                {tableName: tableName},
                {RestaurantId: restaurantId}
            ]
        }
    });
    return table;
}

module.exports = {
    getTableByNameAndRestaurantId:getTableByNameAndRestaurantId
}