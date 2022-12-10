const { Users, Bookings, Statuses,Tables,Restaurants } = require('../models')

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
                required:true
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
                required:true
            }
        ]
    });
    return booking
}

module.exports = {
    findBookingFullDataByBookingId:findBookingFullDataByBookingId,
    findBookingTableStatusByBookingId:findBookingTableStatusByBookingId
}