const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'makanjuolakunle@gmail.com',
        subject: 'Thanks for joining TaskManagr',
        text: `Welcome ${name}, Thanks for joining TaskManagr.\n\nPlease let me know how you get along with the app.\n\n\nCiao 🤗`
    })
}

const sendGoodbyeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'makanjuolakunle@gmail.com',
        subject: 'We Hate To See You Go',
        text: `We Hate To See You Go ${name}, Is there any reason for deleting your TaskManagr account?\nPlease let me know we can do better.\nRegards`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendGoodbyeEmail
}
