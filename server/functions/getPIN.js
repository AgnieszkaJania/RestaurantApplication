function getPIN(userId,bookingId){
    const d = new Date();
    let PIN = userId.toString() + bookingId.toString() + d.getFullYear().toString() + d.getMonth().toString()
        + d.getDate().toString() + d.getHours().toString() + d.getMinutes().toString() + d.getSeconds().toString()
        console.log(PIN)
    return PIN
}

module.exports = {
    getPIN: getPIN
}