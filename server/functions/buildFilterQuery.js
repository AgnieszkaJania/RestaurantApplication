const { Op } = require('sequelize');

function buildFilterQuery(filters){
    let query = {}

    if(filters.restaurantName){
        query['$Table.Restaurant.restaurantName$'] = {[Op.substring]:filters.restaurantName}
    }
    if(filters.quantity && filters.quantity.length > 0){
        query['$Table.quantity$'] = {[Op.in] : filters.quantity}
    }
    if(filters.cuisine && filters.cuisine.length > 0){
        query['$Table.Restaurant.RestaurantCuisines.CuisineId$'] = {[Op.in] : filters.cuisine}
    }
    if(filters.defaultDate){
        query['$Booking.startTime$'] = {[Op.gt] : filters.dateToFilter}
    }
    else
    {   
        query['$Booking.startTime$'] = {[Op.gte] : filters.dateToFilter}
    }
    return query; 
}

module.exports = {
    buildFilterQuery: buildFilterQuery
}