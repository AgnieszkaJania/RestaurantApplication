const { Users } = require('../models')

async function findUserByUserId(id){
    const user = await Users.findOne({
        where:{id:id}
    })
    return user
}

module.exports = {
    findUserByUserId:findUserByUserId
}