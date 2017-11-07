'use strict';
const CertStreamClient = require('certstream');

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
    throw Error('Env CERTSTALK_KEYWORDS missing.');
    process.exit();
}

// TODO refactor to notifier array that completes initialize()
var slacknotif = require('./notifiers.d/slack');
try {
    slacknotif.initialize();
}
catch (err) {
    logger.error('Notifier returned error:', err);
    process.exit();
}


const stalkItems = process.env.CERTSTALK_KEYWORDS.split(' ');
var seenCerts = 0;

let certstream = new CertStreamClient((message) => {
    if (message.message_type === 'certificate_update') {
        seenCerts++;
        var found = false;
        var matching = '';
        const domains = message.data.leaf_cert.all_domains;

        stalkItems.forEach((item) => {
            if (domains.some(san => san.includes(item))) {
                found = true;
                matching = item;
            }
        });
        
        if (found) {
            const issuer = message.data.chain[0].subject.CN;
            logger.info('Registered certificate matched keyword', matching + ':', domains.toString(), '(through ' + issuer + ')');
            // TODO all notifiers
            slacknotif.notify(matching, domains, issuer, logger);
        }

        if (seenCerts % 1000 == 0) {
            logger.debug('Seen', seenCerts, 'certificates.');
        }
    }
    else {
        if (message.message_type === 'heartbeat') {
            logger.debug('Received heartbeat message from CertStream with timestamp of', message.timestamp);
        }
        else {
            logger.debug('Unidentified message received: ', message);
        }
    }
});

certstream.connect();