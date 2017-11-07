'use strict';
require('dotenv').config();
var IncomingWebhook = require('@slack/client').IncomingWebhook;


exports.initialize = () => {
    if (!process.env.CERTSTALK_SLACK_WEBHOOK_URL) {
        throw Error('Env SLACK_WEBHOOK_URL undefined.');
    }
} 

exports.notify = (matching, domains, issuer, logger) => {
    var slackurl = process.env.CERTSTALK_SLACK_WEBHOOK_URL;
    var webhook = new IncomingWebhook(slackurl);

    var notification = {};

    if (process.env.CERTSTALK_SLACK_CHANNEL) {
        notification.channel = process.env.CERTSTALK_SLACK_CHANNEL;
    }

    if (process.env.CERTSTALK_SLACK_COLOR) {
        notification.color = process.env.CERTSTALK_SLACK_COLOR;
    }
    else {
        notification.color = '#36a64f';
    }

    if (process.env.CERTSTALK_SLACK_EMOJI) {
        notification.icon_emoji = process.env.CERTSTALK_SLACK_EMOJI;
    }
    else {
        notification.icon_emoji = ':ghost:';
    }

    if (process.env.CERTSTALK_SLACK_FOOTER) {
        notification.footer = process.env.CERTSTALK_SLACK_FOOTER;
    }
    else {
        notification.footer = 'CertStalk';
    }

    notification.text = 'Certificate matching keyword ' + matching + ' was registered through ' + issuer + '.';
    notification.fallback = notification.text;
    notification.pretext = 'More information through Google <https://transparencyreport.google.com/https/certificates?cert_search_auth=&cert_search_cert=&cert_search=include_expired:true;include_subdomains:true;domain:' + matching + '&lu=cert_search|Transparency Report>';

    notification.fields = [];
    domains.forEach((domain) => {
        var domobject = {};
        domobject.value = domain;
        domobject.short = true;
        notification.fields.push(domobject);
    });

    //logger.debug(JSON.stringify(notification, null, 2)); //debug
    webhook.send(notification, (err, header, statusCode, body) => {
        if (err) {
            logger.error('Error:', err);
        } else {
            logger.debug('Received', statusCode, 'from Slack with body of', body);
        }
    });
}