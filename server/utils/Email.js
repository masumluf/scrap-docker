const nodemailer=require('nodemailer');

const dotenv = require("dotenv");

// get config vars
dotenv.config();


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD
    }
});


exports.sendEmail= async (email,subject,message)=>{


    try{
        const mailOptions = {
            from: process.env.EMAIL_FROM, // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
            html: message// plain text body
        };
        let result=await transporter.sendMail(mailOptions);
        if (result){
            //console.log(result)
            return true
        }
    }catch (e) {
        console.log(e)
        return false
    }




    // transporter.sendMail(mailOptions, function (err, info) {
    //     if(err)
    //         return false
    //     else
    //         return true
    // });

}