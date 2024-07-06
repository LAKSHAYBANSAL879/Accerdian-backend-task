const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const cors = require('cors'); 

const prisma = new PrismaClient();
const app = express();

app.use(cors()); 
app.use(bodyParser.json());

app.post('/referrals', async (req, res) => {
    const { refereeName, refereeEmail, refereePhone, referrerName, referrerEmail, referrerPhone } = req.body;

    if (!refereeName || !refereeEmail || !refereePhone || !referrerName || !referrerEmail || !referrerPhone) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        let referrer = await prisma.referrer.findUnique({ where: { email: referrerEmail } });
        if (!referrer) {
            referrer = await prisma.referrer.create({ data: { name: referrerName, email: referrerEmail, phone: referrerPhone } });
        }

        let referee = await prisma.referee.findUnique({ where: { email: refereeEmail } });
        if (!referee) {
            referee = await prisma.referee.create({ data: { name: refereeName, email: refereeEmail, phone: refereePhone } });
        }

        const newReferral = await prisma.referral.create({
            data: {
                referee: { connect: { id: referee.id } },
                referrer: { connect: { id: referrer.id } }
            }
        });

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'laksh879880@gmail.com',
                pass: 'bunp zodh djmc cacc'
            }
        });

        let mailOptions = {
            from: 'laksh879880@gmail.com',
            to: refereeEmail,
            subject: 'Referral Submission',
            text: `You have been referred by ${referrerName}!`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: 'Failed to send email' });
            }
            console.log('Email sent: ' + info.response);
            res.status(201).json(newReferral);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while saving the referral' });
    }
});

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
