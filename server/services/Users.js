const { User } = require('../models');
const { Op } = require('sequelize');

async function getUserById(id){
    const user = await User.findOne({
        attributes:['id', 'firstName', 'lastName', 'phoneNumber', 'email'],
        where:{id:id}
    });
    return user;
}

async function getUserDetailsByUserId(userId){
    const user = await User.findByPk(userId);
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

async function OtherUserWithGivenEmailPhoneNumber(email, phoneNumber, checkedUserId){
    const user = await User.findOne({
        where:{
            [Op.and]:[
                {id:{[Op.ne]:checkedUserId}},
                {[Op.or]:[
                    {email:email},
                    {phoneNumber:phoneNumber}
                ]}
            ]
        }
    });
    return user;
}

async function updateUser(user, newData){
    const updatedUser = await user.update({ 
        firstName: newData.firstName,
        lastName: newData.lastName,
        phoneNumber: newData.phoneNumber,
        email: newData.email
    });
    return updatedUser;
}

async function addUserRestoreToken(user, tokenData){
    const userWithToken = await user.update({
        restoreToken: tokenData.tokenHashed,
        restoreTokenExpirationDate: tokenData.expirationDate 
    });
    return userWithToken;
}

async function restoreUser(user){
    await user.update({
        is_active:true,
        restoreToken:null,
        restoreTokenExpirationDate:null
    });
}

module.exports = {
    getUserById: getUserById,
    getUserByEmailOrPhoneNumber: getUserByEmailOrPhoneNumber,
    createUser: createUser,
    getUserByEmail: getUserByEmail,
    OtherUserWithGivenEmailPhoneNumber: OtherUserWithGivenEmailPhoneNumber,
    updateUser: updateUser,
    addUserRestoreToken: addUserRestoreToken,
    getUserDetailsByUserId: getUserDetailsByUserId,
    restoreUser: restoreUser
}