const Sandbox = require('docker-python-sandbox')
const Twit = require('twit')

const T = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY || '',
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET || '',
    access_token: process.env.TWITTER_ACCESS_TOKEN_KEY || '',
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET || ''
});

const twitterStream = T.stream('statuses/filter', { track: '@PythonCodeBot1' })

const poolSize = 1
const pySandbox = new Sandbox({poolSize})

console.log('Starting sandbox...');
pySandbox.initialize(err => {
    if (err) {
        throw new Error(`unable to initialize the sandbox: ${err}`)
    }
    console.log('Sandbox successfuly initialized');
    console.log('Start listening for tweet containing @PythonCodeBot1...');
    twitterStream.on('tweet', tweet => {
        console.log(`Tweet recieved from ${tweet.user.name} : ${tweet.text}`);
        console.log(tweet);

        const code = tweet.text.replace('@PythonCodeBot1', '').trim();
        console.log('code : ', code);
        const timeoutMs = 2 * 1000

        pySandbox.run({code, timeoutMs}, (err, result) => {
            if (err) {
                throw new Error(`unable to run the code in the sandbox: ${err}`)
            }

            console.log('execution result : ', result.combined); // Hello, world!
            setTimeout(() => {
                T.post('statuses/update', {
                    status: `@${tweet.user.screen_name} ${result.combined}`,
                    in_reply_to_status_id: tweet.id,
                    auto_populate_reply_metadata: true
                });
            }, 1000);
        });
    });
});
