'use strict';
require('dotenv').config();
var IncomingWebhook = require('@slack/client').IncomingWebhook;


exports.initialize = () => {
    if (!process.env.CERTSTALK_SLACK_WEBHOOK_URL) {
        throw Error('Env SLACK_WEBHOOK_URL undefined.');
    }
} 

exports.notify = (matching, certificate, chain, logger) => {
    var slackurl = process.env.CERTSTALK_SLACK_WEBHOOK_URL;
    var webhook = new IncomingWebhook(slackurl);

    var domains = certificate.all_domains;
    var notification = {};

    if (process.env.CERTSTALK_SLACK_EMOJI) {
        notification.icon_emoji = process.env.CERTSTALK_SLACK_EMOJI;
    }
    else {
        notification.icon_emoji = ':ghost:';
    }
    if (process.env.CERTSTALK_SLACK_USERNAME) {
        notification.username = process.env.CERTSTALK_SLACK_USERNAME;
    }
    else {
        notification.username = "CertStalker";
    }
    notification.text = 'Certificate matching keyword ' + matching + ' was registered through ' + chain[0].subject.O + '. More information through Google <https://transparencyreport.google.com/https/certificates?cert_search_auth=&cert_search_cert=&cert_search=include_expired:true;include_subdomains:true;domain:' + domains[0] + '&lu=cert_search|Transparency Report>.';

    notification.attachments = [];
    var attachment = {}
    if (process.env.CERTSTALK_SLACK_COLOR) {
        attachment.color = process.env.CERTSTALK_SLACK_COLOR;
    }
    else {
        attachment.color = '#36a64f';
    }
    if (process.env.CERTSTALK_SLACK_FOOTER) {
        attachment.footer = process.env.CERTSTALK_SLACK_FOOTER;
    }
    else {
        attachment.footer = 'CertStalker';
        attachment.ts = new Date.now();
    }
    if (process.env.CERTSTALK_SLACK_FOOTER_ICON) {
        attachment.footer_icon = process.env.CERTSTALK_SLACK_FOOTER_ICON;
    }

    attachment.fallback = notification.text;

    const notBefore = new Date(certificate.not_before * 1000);
    const notAfter = new Date(certificate.not_after * 1000);
    attachment.pretext = 'Certificate is valid from ' + notBefore.toISOString().substring(0, 10) + ' to ' + notAfter.toISOString().substring(0, 10) + '.'; // TODO

    attachment.fields = [];
    domains.forEach((domain) => {
        var domobject = {};
        domobject.value = domain;
        domobject.short = true;
        attachment.fields.push(domobject);
    });

    notification.attachments.push(attachment);

    //logger.debug(JSON.stringify(notification, null, 2)); //debug
    webhook.send(notification, (err, header, statusCode, body) => {
        if (err) {
            logger.error('Error:', err);
        } else {
            logger.debug('Received', statusCode, 'from Slack with body of', body);
        }
    });
}