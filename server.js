'use strict';
const CertStreamClient = require('certstream');
var IncomingWebhook = require('@slack/client').IncomingWebhook;

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

const stalkItems = 'gwneåwengweigwi joopajoo cloudflare foobarjneym sillainsit'.split(' ');

// var slackurl = process.env.SLACK_WEBHOOK_URL || '';
// var webhook = new IncomingWebhook(slackurl);

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
            logger.info('Certificate matched keyword', matching + ':', domains.toString(), '(through ' + message.data.chain[0].subject.CN + ')');
            // TODO notifiers
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