# Program to watch Certstream and notify when something is seen

Cert Stalker is a Node.JS program to watch Certificate Transparency streams through CertStream (https://certstream.calidog.io/) and to log matches (and notify you of any matching certificates, if enabled). It enables you to react to possible phishing attempts against your customers, watch that your Let's Encrypt renewals are processing or to stalk someones subdomains, since somebody thought it was a good idea to show them all through Certificate Transparency streams. Use wildcard certificates.

## Installation & configuration

Clone the repository, install needed modules and set up config to .env.

```
git clone git@github.com:ajmyyra/cert-stalker.git
npm install
```

Only necessary config option that you must have in your .env file is CERTSTALK_KEYWORDS that is used to match certificates. Partial matches are counted as well, so use domain.com like keywords to avoid unnecessary notifications. It's also a good idea to run the program without any configured notifiers for a few moments to make sure that you don't DoS yourself.

## Docker

TODO

## Notification options

Currently there are two notification possibilities available: Slack and email. To get something else, create an issue or send a PR. Notification needs to export two functions: initialize() and notify(matching, certificate, chain, logger). Check current ones in the notifiers.d folder for reference.

### Slack

Slack notifications are done through incoming webhooks. You can create one from your Slack groups app settings.

Only needed setting for Slack is the webhook URL, specified in your .env file as CERTSTALK_SLACK_WEBHOOK_URL. Other settings are for customising your notifications:

* CERTSTALK_SLACK_EMOJI - Add a specific emoji to messages. Default is :ghost:
* CERTSTALK_SLACK_USERNAME - Customer username to messages. Default is Cert Stalker.
* CERTSTALK_SLACK_COLOR - Color of the line before your attachment. Default is #36a64f.
* CERTSTALK_SLACK_FOOTER - Text that goes to the message footer. Default contains programs name and current date/time.
* CERTSTALK_SLACK_FOOTER_ICON - Icon to go before your footer message. Default doesn't exist.

### Email

Email notifications are done with the Nodemailer module. Only needed settings are CERTSTALK_EMAIL_FROM and CERTSTALK_EMAIL_TO.

Email is sent from the server through its sendmail binary at /usr/sbin/sendmail. If you wish to use other server or email service, you can specify a settings object in CERTSTALK_MAILER_SETTINGS. For example, setting for authenticated SMTP through port 587 would look like this:

```
{
    host: 'smtp.yourprovider.email',
    port: 587,
    secure: true,
    auth: {
        user: username,
        pass: password
    }
}
```

And this converted to a setting in .env file would be like this:
```
CERTSTALK_MAILER_SETTINGS = "{ host: 'smtp.yourprovider.email', port: 587, secure: true, auth: { user: username, pass: password } }"
```