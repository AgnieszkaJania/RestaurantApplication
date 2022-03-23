const {sign} = require('jsonwebtoken');

const createToken = (user) =>{
    const accessToken = sign({email: user.email, id: user.id},
        "veryimportantsecretmessage"
    );
    return accessToken;
};

module.exports = {createToken}