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

async function createTable(table){
    const newTable = await Table.create({
        tableName: table.tableName,
        quantity: table.quantity,
        RestaurantId: table.RestaurantId
    });
    return newTable;
}

async function getTableById(id){
    const table = await Table.findByPk(id);
    return table;
}

async function getTablesByRestaurantId(restaurantId){
    const tables = await Table.findAll({
        where: {RestaurantId:restaurantId}
    });
    return tables;
}

async function OtherTableWithGivenNameExists(tableName,restaurantId,checkedTableId){
    const table = await Table.findOne({
        where:{
            [Op.and]:[
                {tableName: tableName},
                {RestaurantId: restaurantId},
                {id:{[Op.ne]:checkedTableId}}
            ]
        }
    });
    return table !== null;
}

async function updateTableName(tableName, tableId){
    await Table.update({ 
        tableName:tableName
    },{
        where:{id:tableId}
    });
}

module.exports = {
    getTableByNameAndRestaurantId:getTableByNameAndRestaurantId,
    createTable: createTable,
    getTableById: getTableById,
    getTablesByRestaurantId: getTablesByRestaurantId,
    OtherTableWithGivenNameExists: OtherTableWithGivenNameExists,
    updateTableName: updateTableName
}