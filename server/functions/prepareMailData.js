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

function prepareRestaurantRestoreTokenMailData(restoreTokenData, restaurant){
    const mailData = {
        link: `localhost:3001/restaurants/restoreAccount?token=${restoreTokenData.token}&id=${restaurant.id}`,
        mailTitle: 'Restoration code for your restaurant account!',
        templatePath: "./template/requestRestoreAccountRestaurant.handlebars"
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

function prepareRestaurantResetPasswordTokenMailData(resetPasswordTokenData, restaurant){
    const mailData = {
        link: `localhost:3001/restaurants/resetPasswordFrontend?token=${resetPasswordTokenData.token}&id=${restaurant.id}`,
        mailTitle: 'Password reset link for your restaurant account!',
        templatePath: "./template/requestResetPasswordRestaurant.handlebars"
    }
    return mailData;
}

function prepareBookingCancelByRestaurantConfirmationMailData(booking){
    const bookingDateTime = booking.startTime.toISOString().split("T");
    const bookingTime =  bookingDateTime[1].replace("Z","");
    const mailData = {
        mailTitle: 'Restaurant has cancelled your booking in Chrupka app',
        templatePath: "./template/bookingCancelConfirmationRestaurant.handlebars",
        bookingDate: bookingDateTime[0],
        bookingTime: bookingTime.substring(0, bookingTime.length - 4)
    }
    return mailData;
}

module.exports = {
    prepareBookingConfirmationMailData: prepareBookingConfirmationMailData,
    prepareBookingCancelConfirmationMailData: prepareBookingCancelConfirmationMailData,
    prepareUserRestoreTokenMailData: prepareUserRestoreTokenMailData,
    prepareUserResetPasswordTokenMailData: prepareUserResetPasswordTokenMailData,
    prepareBookingCancelByRestaurantConfirmationMailData: prepareBookingCancelByRestaurantConfirmationMailData,
    prepareRestaurantResetPasswordTokenMailData: prepareRestaurantResetPasswordTokenMailData,
    prepareRestaurantRestoreTokenMailData: prepareRestaurantRestoreTokenMailData
}