'use strict';
require('dotenv').config();
const os = require('os');
const nodemailer = require('nodemailer');
var mailer;

exports.initialize = () => {
    return new Promise((resolve, reject) => {
        if (process.env.CERTSTALK_EMAIL_FROM && process.env.CERTSTALK_EMAIL_TO) {
            if (process.env.CERTSTALK_MAILER_SETTINGS) {
                try {
                    const mailsettings = JSON.parse(process.env.CERTSTALK_MAILER_SETTINGS);
                    mailer = nodemailer.createTransport(mailsettings);
                }
                catch (err) {
                    reject('Error converting CERTSTALK_MAILER_SETTINGS variable to object: ' + err);
                }
            }
            else {
                mailer = nodemailer.createTransport({
                    sendmail: true,
                    newline: 'unix',
                    path: '/usr/sbin/sendmail'
                });
            }
            
            resolve();
        }
        else {
            reject('Environment variables CERTSTALK_EMAIL_FROM or CERTSTALK_EMAIL_TO missing.');
        }
    });
}

exports.notify = (matching, certificate, chain, logger) => {
    const notBefore = new Date(certificate.not_before * 1000);
    const notAfter = new Date(certificate.not_after * 1000);

    const mailsubject = 'Certificate matching ' + matching + ' was registered through ' + chain[0].subject.O;
    var mailtext = 'A certificate matching defined keyword ' + matching + ' was just registered through ' + chain[0].subject.O + '.\n\n';
    mailtext += 'Certificate is valid from ' + notBefore.toISOString().substring(0, 10) + ' to ' + notAfter.toISOString().substring(0, 10) + '.\n\n';
    mailtext += 'More information about the registered certificate can be found through crt.sh at https://crt.sh/?q=' + certificate.all_domains[0];
    mailtext += '\n\nCertificate was issued for the following domains:\n\n';
    
    var domains = certificate.all_domains.forEach((domain) => {
        mailtext += domain + '\n';
    });

    mailtext += '\nBest regards,\nCert Stalker program running at ' + os.hostname;

    const mailOptions = {
        from: process.env.CERTSTALK_EMAIL_FROM,
        to: process.env.CERTSTALK_EMAIL_TO,
        subject: mailsubject,
        text: mailtext,
        html: mailtext
    }

    mailer.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error('Error when sending mail:', error);
        }
        else {
            logger.info('Email notice sent to', process.env.CERTSTALK_EMAIL_TO, 'with id', info.messageId);
        }
    });
}