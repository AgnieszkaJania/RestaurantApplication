function getPIN(userId,bookingId){
    const todayDate = new Date();
    const PIN = userId.toString() + bookingId.toString() + todayDate.getFullYear().toString() + todayDate.getMonth().toString()
        + todayDate.getDate().toString() + todayDate.getHours().toString() + todayDate.getMinutes().toString() + todayDate.getSeconds().toString()
    return PIN
}

module.exports = {
    getPIN: getPIN
}