function prepareBookingConfirmationMailData(booking){
    const bookingDateTime = booking.startTime.toISOString().split("T");
    const bookingTime =  bookingDateTime[1].replace("Z","");
    const mailData = {
        mailTitle: 'Booking confirmation from Chrupka',
        templatePath: "./template/bookingConfirmation.handlebars",
        bookingDate: bookingDateTime[0],
        bookingTime: bookingTime.substring(0, bookingTime.length - 4)
    }
    return mailData
}

module.exports = {
    prepareBookingConfirmationMailData: prepareBookingConfirmationMailData
}