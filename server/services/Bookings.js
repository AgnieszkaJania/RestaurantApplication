const { Users, Bookings, Statuses,Tables,Restaurants } = require('../models')
const { Op } = require("sequelize");

async function findBookingFullDataByBookingId(id){
    const booking = await Bookings.findOne({
        where:{id:id},
        include:[
            {
                model:Tables,
                required:true,
                include:[{
                    model:Restaurants,
                    required:true
                }]
            },
            {
                model: Statuses,
                required:true,
                where:{status:{[Op.ne]:"Deleted"}}
            }
        ]
    });
    return booking
}

async function findBookingTableStatusByBookingId(id){
    const booking = await Bookings.findOne({
        where:{id:id},
        include:[
            {
                model: Tables,
                required:true
            },
            {
                model: Statuses,
                required:true,
                where:{status:{[Op.ne]:"Deleted"}}
            }
        ]
    });
    return booking
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
    findBookingFullDataByBookingId:findBookingFullDataByBookingId,
    findBookingTableStatusByBookingId:findBookingTableStatusByBookingId,
    findBookingDetailsForARestaurant:findBookingDetailsForARestaurant,
    checkIfBookingDeleted:checkIfBookingDeleted
}