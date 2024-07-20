const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.use(express.static('public'));


const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.post('/submit', (req, res) => {
    const form = new formidable.IncomingForm();
    form.uploadDir = uploadDir;
    form.keepExtensions = true;

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('Form parsing error:', err);
            return res.status(500).json({ message: 'Form parsing error' });
        }

        console.log('Fields:', fields);
        console.log('Files:', files);

        const { username, role, email, phone } = fields;
        const resumeFile = files.resume && files.resume[0];
        const resumePath = resumeFile ? resumeFile.filepath : undefined;

        if (!resumePath) {
            console.error('Resume file is missing');
            return res.status(400).json({ message: 'Resume file upload failed' });
        }

        
        const originalFilename = resumeFile.originalFilename;
        const newFilePath = path.join(uploadDir, originalFilename);

        
        fs.renameSync(resumePath, newFilePath);

        const messageBody = `New career application:
        Username: ${username}
        Role: ${role}
        Email: ${email}
        Phone: ${phone}`;

        twilioClient.messages.create({
            from: process.env.TWILIO_SANDBOX_NUMBER, 
            to: process.env.TWILIO_RECIPIANT_NUMBER ,  
            body: messageBody,
            // mediaUrl: `http://localhost:3000/uploads/${path.basename(newFilePath)}` 
        })
        .then(message => {
            console.log('Message sent:', message.sid);
            res.json({ message: 'Your message was sent successfully.' });
        })
        .catch(error => {
            console.error('Error sending message:', error);
            res.status(500).json({ message: 'Failed to send message' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
