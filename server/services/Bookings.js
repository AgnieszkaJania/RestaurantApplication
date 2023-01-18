const { User, Booking, Status, Table, Restaurant } = require('../models');
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
            include:[{
                model:Restaurant,
                attributes:['id','restaurantName']
            }]
        }]    
    });
    return bookings;
}
async function getBookingsByRestaurantId(restaurantId){
    const deletedStatusId = await getDeletedStatusId();
    const bookings = await Booking.findAll({
        where:{StatusId:{[Op.ne]:deletedStatusId}},
        include:[
            {
                model: Table,
                required:true,
                where:{
                    RestaurantId:restaurantId
                }
            },
            {
                model: Status,
                required:true
            }
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

async function findBookingDetailsForARestaurant(id, restaurantId){
    const booking = await Bookings.findOne({
        where:{id:id},
        attributes:['id','startTime','endTime'],
        include:[
            {
                model: Tables,
                required:true,
                where:{
                    RestaurantId:restaurantId,
                }
            },
            {
                model:Statuses,
                required:true
            },
            {
                model: Users,
                attributes:{exclude:['userPassword']}
            }
        ]
    });
    return booking
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

module.exports = {
    getBookingTableRestaurantDetailsByBookingId: getBookingTableRestaurantDetailsByBookingId,
    getBookingDetailsByBookingId: getBookingDetailsByBookingId,
    findBookingDetailsForARestaurant: findBookingDetailsForARestaurant,
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
    getBookingTableUserDetailsByBookingId: getBookingTableUserDetailsByBookingId
}