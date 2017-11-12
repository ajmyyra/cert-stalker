'use strict';
const CertStreamClient = require('certstream');
const fs = require('fs');

require('dotenv').config();

const tsFormat = () => (new Date()).toLocaleTimeString();
const winston = require('winston');
const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            timestamp: tsFormat,
            colorize: true,
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        })
    ]
});

if (!process.env.CERTSTALK_KEYWORDS) {
    throw Error('Environment variable CERTSTALK_KEYWORDS missing.');
    process.exit();
}

var notifiers = [];
fs.readdirSync(__dirname + '/notifiers.d').filter((file) => {
    return file.indexOf('.') !== 0 && file.slice(-3) === '.js';
}).forEach((file) => {
    const notifier = require(__dirname + '/notifiers.d/' + file);
    notifier.initialize()
    .then(() => {
        notifiers.push(notifier);
        logger.info('Notifier', file, 'added.');
    })
    .catch((err) => {
        logger.info('Did not add notifier', file + ':', err);
    });
});

const stalkItems = process.env.CERTSTALK_KEYWORDS.split(' ');
var seenCerts = 0;

let certstream = new CertStreamClient((message) => {
    if (message.message_type === 'certificate_update') {
        seenCerts++;
        var found = false;
        var matching = '';
        const chain = message.data.chain;
        const certificate = message.data.leaf_cert;
        const domains = certificate.all_domains;

        stalkItems.forEach((item) => {
            if (domains.some(san => san.includes(item))) {
                found = true;
                matching = item;
            }
        });
        
        if (found) {
            logger.info('Registered certificate matched keyword', matching + ':', domains.toString(), '(through ' + chain[0].subject.CN + ')');
            notifiers.forEach((notifier) => {
                notifier.notify(matching, certificate, chain, logger);
            })
        }

        if (seenCerts % 1000 == 0) {
            logger.debug('Seen', seenCerts, 'certificates.');
        }
    }
    else {
        if (message.message_type === 'heartbeat') {
            logger.debug('Received a heartbeat message from CertStream with timestamp of', message.timestamp);
        }
        else {
            logger.debug('Unidentified message received: ', message);
        }
    }
});

certstream.connect();