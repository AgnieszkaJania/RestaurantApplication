function prepareBookingConfirmationMailData(booking){
    const bookingDateTime = booking.startTime.toISOString().split("T");
    const bookingTime =  bookingDateTime[1].replace("Z","");
    const mailData = {
        mailTitle: 'Booking confirmation from Chrupka',
        templatePath: "./template/bookingConfirmation.handlebars",
        bookingDate: bookingDateTime[0],
        bookingTime: bookingTime.substring(0, bookingTime.length - 4)
    }
    return mailData;
}

function prepareBookingCancelConfirmationMailData(booking){
    const bookingDateTime = booking.startTime.toISOString().split("T");
    const bookingTime =  bookingDateTime[1].replace("Z","");
    const mailData = {
        mailTitle: 'Booking cancel confirmation from Chrupka',
        templatePath: "./template/bookingCancelConfirmationUser.handlebars",
        bookingDate: bookingDateTime[0],
        bookingTime: bookingTime.substring(0, bookingTime.length - 4)
    }
    return mailData;
}

function prepareUserRestoreTokenMailData(restoreTokenData, user){
    const mailData = {
        link: `localhost:3001/users/restoreAccount?token=${restoreTokenData.token}&id=${user.id}`,
        mailTitle: 'Restoration code for your account!',
        templatePath: "./template/requestRestoreAccount.handlebars"
    }
    return mailData;
}

function prepareUserResetPasswordTokenMailData(resetPasswordTokenData, user){
    const mailData = {
        link: `localhost:3001/users/resetPasswordFrontend?token=${resetPasswordTokenData.token}&id=${user.id}`,
        mailTitle: 'Password reset link for your account!',
        templatePath: "./template/requestResetPassword.handlebars"
    }
    return mailData;
}
module.exports = {
    prepareBookingConfirmationMailData: prepareBookingConfirmationMailData,
    prepareBookingCancelConfirmationMailData: prepareBookingCancelConfirmationMailData,
    prepareUserRestoreTokenMailData: prepareUserRestoreTokenMailData,
    prepareUserResetPasswordTokenMailData: prepareUserResetPasswordTokenMailData
}