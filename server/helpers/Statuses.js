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
async function findDeletedStatusId(){
    const deletedStatus = await Statuses.findOne({
        where:{status:"Deleted"}
    })
    return deletedStatus.id
}

async function findDisabledStatusId(){
    const disabledStatus = await Statuses.findOne({
        where:{status:"Disabled"}
    })
    return disabledStatus.id
}

module.exports = {
    findAvailableStatusId:findAvailableStatusId,
    findBookedStatusId:findBookedStatusId,
    findDeletedStatusId:findDeletedStatusId,
    findDisabledStatusId
}