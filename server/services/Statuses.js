const { Status } = require('../models');

async function getAvailableStatusId(){
    const availableStatus = await Status.findOne({
        where:{status:"Available"}
    });
    return availableStatus.id;
}
async function getBookedStatusId(){
    const bookedStatus = await Status.findOne({
        where:{status:"Booked"}
    });
    return bookedStatus.id;
}
async function getDeletedStatusId(){
    const deletedStatus = await Status.findOne({
        where:{status:"Deleted"}
    });
    return deletedStatus.id;
}

async function getDisabledStatusId(){
    const disabledStatus = await Status.findOne({
        where:{status:"Disabled"}
    });
    return disabledStatus.id;
}

async function checkIfStatusesExist(){
    const allStatuses = await Status.findAll();
    return allStatuses.length > 0;
}

async function getDefaultStatusId(){
    const defaultStatus = await Status.findOne({
        where:{status:"Available"}
    });
    return defaultStatus.id;
}

module.exports = {
    getAvailableStatusId:getAvailableStatusId,
    getBookedStatusId:getBookedStatusId,
    getDeletedStatusId:getDeletedStatusId,
    getDisabledStatusId: getDisabledStatusId,
    checkIfStatusesExist: checkIfStatusesExist,
    getDefaultStatusId: getDefaultStatusId
}