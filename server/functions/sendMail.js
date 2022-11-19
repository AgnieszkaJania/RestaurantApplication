const nodemailer = require('nodemailer');

function sendEmail(to,subject,text){
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'kasiajab676@gmail.com',
          pass: 'kyydnhaqhpqrzpvp'
        }
      });
    
    const mailOptions = {
        from: 'kasiajab676@gmail.com',
        to:to,
        subject: subject,
        text: text
    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          throw new Error('Error when sending email. ' + error.message) 
        }
    });
}

module.exports = {
    sendEmail: sendEmail
}
  


