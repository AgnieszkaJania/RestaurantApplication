const crypto = require('crypto');
const bcrypt = require('bcrypt');
const {addHours} = require('../functions/addHours');

async function createRestoreToken(){
    const restoreToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(restoreToken, 10);
    const restoreTokenExpirationDate = addHours(new Date(),1);
    const restoreTokenData = {
        token: restoreToken,
        tokenHashed: hash,
        expirationDate: restoreTokenExpirationDate
    }
    return restoreTokenData;
}

module.exports = {
    createRestoreToken: createRestoreToken
}

