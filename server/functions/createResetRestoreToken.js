const crypto = require('crypto');
const bcrypt = require('bcrypt');
const {addHours} = require('./addHours');

async function createResetRestoreToken(){
    const token = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(token, 10);
    const tokenExpirationDate = addHours(new Date(),1);
    const tokenData = {
        token: token,
        tokenHashed: hash,
        expirationDate: tokenExpirationDate
    }
    return tokenData;
}

module.exports = {
    createResetRestoreToken: createResetRestoreToken
}
