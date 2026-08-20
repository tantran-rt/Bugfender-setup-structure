import nodemailer from 'nodemailer';

const appMail = process.env.NEXT_PUBLIC_APP_MAIL as string;
const appMailPassKey = process.env.NEXT_PUBLIC_APP_MAIL_PASS as string;

const transport = nodemailer.createTransport({
    service: 'gmail',
    // service: 'punch.agency',
    // port: 465,
    // secure: true,
    // auth: {
    //     user: appMail,
    //     pass: appMailPassKey
    // },
    auth: {
        user: appMail,
        pass: appMailPassKey
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// async function createTransport() {
//     // Generate SMTP service account from ethereal.email
//     let account = await nodemailer.createTestAccount();

//     console.log('Verifying obtained credentials...');

//     // NB! Store the account object values somewhere if you want
//     // to re-use the same account for future mail deliveries

//     // Create a SMTP transporter object
//     let transporter = nodemailer.createTransport({
//         host: account.smtp.host,
//         port: account.smtp.port,
//         secure: account.smtp.secure,
//         auth: {
//             user: account.user,
//             pass: account.pass
//         },
//         logger: false,
//         debug: false // include SMTP traffic in the logs
//     },
//         {
//             from: `<${account.user}>`
//         }
//     );

//     try {
//         console.log('Credentials are valid');
//         return transporter
//     } catch (err) {
//         // throws on invalid credentials
//         console.log('Credentials are invalid');
//         throw err;
//     }
// }


async function sendEmail(/*from?: string,*/ to: string, subject: string, html: string): Promise<unknown> {
    // const transport = await createTransport();
    return new Promise((resolve, reject) => {
        transport.sendMail(
            { from: appMail, subject, to, html },
            // { to, subject, html },
            (err, info) => {
                if (err) {
                    console.error('Nodemailer Error:', err)
                    reject(err)
                };
                resolve(info);
            },
        );
    });
};

export default sendEmail;
