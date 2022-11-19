const { Statuses } = require('../models')

async function findAvailableStatusId(){
    const availableStatus = await Statuses.findOne({
        where:{status:"Available"}
    })
    return availableStatus.id
}
async function findBookedStatusId(){
    const bookedStatus = await Statuses.findOne({
        where:{status:"Booked"}
    })
    return bookedStatus.id
}

module.exports = {
    findAvailableStatusId:findAvailableStatusId,
    findBookedStatusId:findBookedStatusId
}