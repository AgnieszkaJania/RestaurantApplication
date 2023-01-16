const { User } = require('../models');
const { Op } = require('sequelize');

async function getUserById(id){
    const user = await User.findOne({
        attributes:['id', 'firstName', 'lastName', 'phoneNumber', 'email'],
        where:{id:id}
    });
    return user;
}

async function getUserByEmailOrPhoneNumber(userEmail, userPhoneNumber){
    const user = await User.findOne({
        attributes:{exclude:['userPassword']},
        where:{
            [Op.or]:[
                {email: userEmail},
                {phoneNumber: userPhoneNumber}
            ]
        }
    });
    return user;
}

async function createUser(user){
    const newUser = await User.create({
        firstName: user.firstName,
        lastName: user.lastName,
        userPassword: user.userPassword,
        phoneNumber: user.phoneNumber,
        email: user.email
    });
    return newUser;
}

async function getUserByEmail(userEmail){
    const user = await User.findOne({
        where:{email: userEmail}
    });
    return user;
}

module.exports = {
    getUserById: getUserById,
    getUserByEmailOrPhoneNumber: getUserByEmailOrPhoneNumber,
    createUser: createUser,
    getUserByEmail: getUserByEmail
}