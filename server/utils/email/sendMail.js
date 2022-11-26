const nodemailer = require('nodemailer');
const handlebars = require('handlebars')
const fs = require('fs')
const path = require('path')

function sendEmail(to,subject,payload,template){
    try {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'kasiajab676@gmail.com',
          pass: 'kyydnhaqhpqrzpvp'
        }
      });
    const source = fs.readFileSync(path.join(__dirname,template),"utf-8")
    const compiledTemplate = handlebars.compile(source)
    const mailOptions = {
        from: 'kasiajab676@gmail.com',
        to:to,
        subject: subject,
        html: compiledTemplate(payload)
    };
    transporter.sendMail(mailOptions)
    } catch (error) {
      throw new Error('Error when sending email. ' + error.message)
    }
}

module.exports = {
    sendEmail: sendEmail
}
  


