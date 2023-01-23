const { Booking, Table, Restaurant, BookingHistory, Status, User} = require('../models');

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

async function createBookingHistory(cancelledBooking){
    const newCancelledBooking = await BookingHistory.create({
        oldPIN: cancelledBooking.oldPIN,
        CancelType: cancelledBooking.CancelType,
        BookingId: cancelledBooking.BookingId,
        UserId: cancelledBooking.UserId
    });
    return newCancelledBooking;
}

async function getCancelledBookingByPIN(PIN){
    const bookingHistory = await BookingHistory.findOne({
        where:{oldPIN:PIN},
        include:[
            {
                model: Booking,
                required:true,
                attributes:['id','startTime','endTime','TableId'],
                include:[
                {
                    model:Table,
                    required:true
                },
                {
                    model:Status,
                    required:true
                }]
            },
            {
                model:User,
                required:true,
                attributes:['id','firstName','lastName','phoneNumber','email']
            }
        ]
    });
    return bookingHistory;
}

async function getCancelledBookingsByBookingId(bookingId){
    const cancelledBookings = await BookingHistory.findAll({
        where:{BookingId:bookingId},
        include:[
            {
                model:Booking,
                attributes:{exclude:['PIN','StatusId','UserId']},
                required:true,
                include:[{
                    model:Table,
                    required:true
                }]
                
            },
            {
                model:User,
                attributes:['id','firstName','lastName','phoneNumber','email'],
                required:true 
            }
        ]
    });
    return cancelledBookings;
}

module.exports = {
    getCancelledBookingsForUser: getCancelledBookingsForUser,
    createBookingHistory: createBookingHistory,
    getCancelledBookingByPIN: getCancelledBookingByPIN,
    getCancelledBookingsByBookingId: getCancelledBookingsByBookingId
    
}