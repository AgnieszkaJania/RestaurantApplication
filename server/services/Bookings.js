const { User, Booking, Status, Table, Restaurant, RestaurantCuisine } = require('../models');
const { getDeletedStatusId, getDefaultStatusId, getBookedStatusId, getDisabledStatusId, getAvailableStatusId } = require('./Statuses');
const { getPIN } = require('../functions/getPIN');
const { Op } = require('sequelize');

async function getBookingsByTableId(tableId){
    const deletedStatusId = await getDeletedStatusId();
    const bookingsForATable = await Booking.findAll({
        where:{
            [Op.and]:[
                {TableId:tableId},
                {StatusId: {[Op.ne]: deletedStatusId}},
            ]
        }
    }); 
    return bookingsForATable;       
}

async function createBookingTime(bookingTime){
    const defaultStatusId = await getDefaultStatusId();
    const newBookingTime = await Booking.create({
        startTime: bookingTime.startTime,
        endTime: bookingTime.endTime,
        TableId: bookingTime.TableId,
        StatusId: defaultStatusId
    });
    return newBookingTime;
}

async function getBookingsDetailsByTableId(tableId){
    const deletedStatusId = await getDeletedStatusId();
    const bookingsDetails = await Booking.findAll({
        where: {
            [Op.and]:[
                {TableId: tableId},
                {StatusId: {[Op.ne]: deletedStatusId}}
            ]
        },
        include:[
            {
                model: Table,
                required: true
            }
        ],
        order:[
            ['startTime','ASC']
        ]  
    });
    return bookingsDetails;
}

async function deleteBookingTime(booking){
    const deletedStatusId = await getDeletedStatusId();
    const updatedBooking = await booking.update({ 
        StatusId: deletedStatusId
    });
    return updatedBooking;
}

async function reserveBookingTime(booking, userId){
    const bookedStatusId = await getBookedStatusId();
    const PIN = getPIN(userId, booking.id);
    const reservedBooking = await booking.update({ 
        StatusId: bookedStatusId,
        UserId: userId,
        PIN: PIN
    });
    return reservedBooking;
}

async function getBookingTableRestaurantDetailsByBookingId(bookingId){
    const deletedStatusId = await getDeletedStatusId();
    const booking = await Booking.findOne({
        where:{[Op.and]:[
            {id:bookingId},
            {StatusId:{[Op.ne]:deletedStatusId}}
        ]},
        include:[
            {
                model:Table,
                required:true,
                include:[{
                    model:Restaurant,
                    required:true
                }]
            }
        ]
    });
    return booking;
}

async function getBookingDetailsByBookingId(bookingId){
    const deletedStatusId = await getDeletedStatusId();
    const booking = await Booking.findOne({
        where:{[Op.and]:[
            {id:bookingId},
            {StatusId:{[Op.ne]:deletedStatusId}}
        ]},
        include:[
            {
                model: Table,
                required:true
            }
        ]
    });
    return booking;
}

async function disableBookingTime(booking){
    const disabledStatusId = await getDisabledStatusId();
    const disabledBooking = await booking.update({
        StatusId: disabledStatusId
    });
    return disabledBooking;
}

async function enableBookingTime(booking){
    const availableStatusId = await getAvailableStatusId();
    const enabledBooking = await booking.update({
        StatusId: availableStatusId
    });
    return enabledBooking;
}

async function getBookingsByUserId(userId){
    const bookedStatusId = await getBookedStatusId();
    const bookings = await Booking.findAll({
        where:{
            [Op.and]:[
                {UserId:userId},
                {StatusId:bookedStatusId}
            ]
        },
        include:[{
            model:Table,
            required: true,
            include:[{
                model:Restaurant,
                required: true,
                attributes:['id','restaurantName']
            }]
        }],
        order:[
            ['startTime','ASC']
        ]   
    });
    return bookings;
}
async function getBookingsByRestaurantId(restaurantId){
    const deletedStatusId = await getDeletedStatusId();
    const bookings = await Booking.findAll({
        where:{[Op.and]:[
            {'$Table.RestaurantId$':restaurantId},
            {StatusId:{[Op.ne]:deletedStatusId}}
        ]},
        include:[
            {
                model: Table,
                required:true,
            },
            {
                model: Status,
                required:true
            }
        ],
        order:[
            ['startTime','ASC']
        ]
    });
    return bookings;
}

async function getBookingTableUserDetailsByBookingId(bookingId){
    const deletedStatusId = await getDeletedStatusId();
    const booking = await Booking.findOne({
        where:{
            [Op.and]:[
                {id:bookingId},
                {StatusId:{[Op.ne]:deletedStatusId}}
            ]
        },
        include:[
            {
                model: Table,
                required:true
            },
            {
                model: Status,
                required: true
            },
            {
                model: User,
                attributes:['id','firstName','lastName','phoneNumber','email']
            }
        ]
    });
    return booking;
}

async function getBookingTableRestaurantByBookingIdUserId(bookingId, userId){
    const bookedStatusId = await getBookedStatusId();
    const booking = await Booking.findOne({
        where:{[Op.and]:[
            {id:bookingId},
            {UserId:userId},
            {StatusId:bookedStatusId}
        ]},
        include:[
            {
                model: Table,
                include:[{
                    model:Restaurant,  
                    attributes:['id','restaurantName','street','propertyNumber',
                    'flatNumber','postalCode','city','restaurantPhoneNumber',
                    'restaurantEmail', 'facebookLink', 'instagramLink']
                }]
            }
        ]
    });
    return booking;
}

async function getBookingTableUserByBookingIdRestaurantId(bookingId, restaurantId){
    const deletedStatusId = await getDeletedStatusId();
    const booking = await Booking.findOne({
        where:{[Op.and]:[
            {id:bookingId},
            {'$Table.RestaurantId$':restaurantId},
            {StatusId:{[Op.ne]:deletedStatusId}}
        ]},
        include:[
            {
                model: Table,
                required:true
            },
            {
                model:User,
                attributes:['id','firstName','lastName','phoneNumber','email']
            }
        ]
    });
    return booking;
}

async function getBookingsByQuery(query){
    const availableStatusId = await getAvailableStatusId();
    query['$Booking.StatusId$'] = availableStatusId;
    const bookings = await Booking.findAll({
        where:query,
        include:[
            {
                model:Table,
                required:true,
                include:[{
                    model:Restaurant,
                    required: true, 
                    attributes:['id','restaurantName','street','propertyNumber',
                    'flatNumber','postalCode','city','restaurantPhoneNumber',
                    'restaurantEmail', 'facebookLink', 'instagramLink'],
                    include:[{
                        model:RestaurantCuisine,
                        required: false,
                        
                    }]
                }]
            }
        ],
        order:[
            ['startTime','ASC']
        ]
    });
    return bookings;
}

async function cancelBookingTime(booking){
    const availableStatusId = await getAvailableStatusId();
    const cancelledBooking = await booking.update({
        StatusId:availableStatusId,
        UserId: null,
        PIN: null
    });
    return cancelledBooking;   
}

async function getFutureOngoingBookingByUserId(userId){
    const bookedStatusId = await getBookedStatusId();
    const currentDate = new Date();
    const booking = await Booking.findOne({
        where:{
            [Op.and]:[
                {UserId:userId},
                {StatusId:bookedStatusId},
                {endTime:{[Op.gte]:currentDate}}
            ]
        }
    });
    return booking;
}

async function getFutureOngoingBookingByRestaurantId(restaurantId){
    const deletedStatusId = await getDeletedStatusId();
    const currentDate = new Date();
    const booking = await Booking.findOne({
        where:{
            [Op.and]:[
                {'$Table.RestaurantId$':restaurantId},
                {StatusId:{[Op.ne]:deletedStatusId}},
                {endTime:{[Op.gte]:currentDate}}
            ]
        },
        include:{
            model:Table,
            required:true
        }
    });
    return booking;
}

async function checkIfBookingDeleted(id){
    const booking = await Bookings.findOne({
        where:{id:id},
        include:[
            {
                model:Statuses,
                required:true
            }
        ]
        
    })
    if(booking.Status.status == "Deleted"){
        return true
    }
    return false
}

async function getBookingByPIN(PIN){
    const booking = await Booking.findOne({
        where:{PIN:PIN},
        include:[
            {
                model:Table,
                required:true,
            },
            {
                model:User,
                required:true,
                attributes:['id','firstName','lastName','phoneNumber','email']
            }
        ]
    });
    return booking;
}

async function getAvailableBookingsByRestaurantId(restaurantId){
    const availableStatusId = await getAvailableStatusId();
    const currentDate = new Date();
    const bookings = await Booking.findAll({
        where:{[Op.and]:[
            {StatusId: availableStatusId},
            {'$Table.RestaurantId$':restaurantId},
            {startTime:{[Op.gt]:currentDate}}
        ]},
        include:[
            {
                model: Table,
                required:true
            }
        ],
        order:[
            ['startTime','ASC']
        ]
    });
    return bookings;
}

module.exports = {
    getBookingTableRestaurantDetailsByBookingId: getBookingTableRestaurantDetailsByBookingId,
    getBookingDetailsByBookingId: getBookingDetailsByBookingId,
    checkIfBookingDeleted: checkIfBookingDeleted,
    getBookingsByTableId: getBookingsByTableId,
    createBookingTime: createBookingTime,
    getBookingsDetailsByTableId: getBookingsDetailsByTableId,
    deleteBookingTime: deleteBookingTime,
    reserveBookingTime: reserveBookingTime,
    disableBookingTime: disableBookingTime,
    enableBookingTime: enableBookingTime,
    getBookingsByUserId: getBookingsByUserId,
    getBookingsByRestaurantId: getBookingsByRestaurantId,
    getBookingTableUserDetailsByBookingId: getBookingTableUserDetailsByBookingId,
    getBookingTableRestaurantByBookingIdUserId: getBookingTableRestaurantByBookingIdUserId,
    getBookingsByQuery: getBookingsByQuery,
    cancelBookingTime: cancelBookingTime,
    getFutureOngoingBookingByUserId: getFutureOngoingBookingByUserId,
    getBookingByPIN: getBookingByPIN,
    getAvailableBookingsByRestaurantId: getAvailableBookingsByRestaurantId,
    getBookingTableUserByBookingIdRestaurantId: getBookingTableUserByBookingIdRestaurantId,
    getFutureOngoingBookingByRestaurantId: getFutureOngoingBookingByRestaurantId
}