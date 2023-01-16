const { Booking, Table, Restaurant, BookingHistory } = require('../models');

async function getCancelledBookingsForUser(userId){
    const cancelledBookingsForUser = await BookingHistory.findAll({
        where:{UserId: userId},
        include:[{
            model:Booking,
            attributes: {exclude:['PIN']},
            required:true,
            include:[{
                model:Table,
                attributes: {exclude: ['tableName']},
                required:true,
                include:[{
                    model:Restaurant,
                    attributes:['id','restaurantName','street','propertyNumber', 'flatNumber','postalCode','city'],
                    required:true
                }]
            }]
        }]
    });
    return cancelledBookingsForUser;
}

module.exports = {
    getCancelledBookingsForUser: getCancelledBookingsForUser
}