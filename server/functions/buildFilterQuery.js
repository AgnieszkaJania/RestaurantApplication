const { getAvailableStatusId } = require('../services/Statuses');
const { Op } = require('sequelize');

function buildFilterQuery(filters){
    let query = {}
    // query.restaurant = {}
    // query.booking = {}
    // query.table = {}
    // query.cuisine = {}
    // query.restaurant.where = {}
    // query.booking.where = {}
    // query.table.where = {}
    // query.cuisine.where= {}

    if(filters.restaurantName){
        query['$Table.Restaurant.restaurantName$'] = {[Op.substring]:filters.restaurantName}
        //query.restaurant.where.restaurantName = {[Op.substring]:filters.restaurantName}
    }
    if(filters.quantity && filters.quantity.length > 0){
        query['$Table.quantity$'] = {[Op.in] : filters.quantity}
        // query.table.where.quantity = {[Op.in] : filters.quantity}
    }
    if(filters.cuisine && filters.cuisine.length > 0){
        query['$Table.Restaurant.RestaurantCuisines.CuisineId$'] = {[Op.in] : filters.cuisine}
        //query.cuisine.where.CuisineId = {[Op.in] : filters.cuisine}
    }
    if(filters.defaultDate){
        query['$Booking.startTime$'] = {[Op.gt] : filters.dateToFilter}
        //query.booking.where.startTime = {[Op.gt] : filters.dateToFilter}
    }
    else
    {   
        query['$Booking.startTime$'] = {[Op.gte] : filters.dateToFilter}
        //query.booking.where.startTime = {[Op.gte] : filters.dateToFilter}
    }
    return query;
    
}

module.exports = {
    buildFilterQuery: buildFilterQuery
}