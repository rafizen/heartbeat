const isPortReachable = require('is-port-reachable');
const express = require('express');
const redis_connection = require('redis');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const redis = redis_connection.createClient({
    port      : process.env.REDIS_PORT,               // replace with your port
    host      : process.env.REDIS_HOST,        // replace with your hostanme or IP address
    password  : process.env.REDIS_PASSWORD,    // replace with your password
});

const port = process.env.PORT;

const app = express();
app.listen(port, () => {
    console.log(`Server running at ${port} ...`)
});

var redis_health = true;
redis.on('connect', function() {
    redis_health = true;
    console.log('Redis client connected');
});
redis.on('error', function (err) {
    redis_health = false;
    console.log('Something went wrong (Redis) ' + err);
});

setInterval(heartbeat,10000); // 10 Detik

var logger = fs.createWriteStream('log.txt', {
    flags: 'a' // 'a' means appending (old data will be preserved)
});

function heartbeat(){
    (async () => {
        const dukcapil_health = await isPortReachable(8000, {host: '127.0.0.1'});
        const data = {
            Datetime : new Date(),
            dukcapil_host : dukcapil_health,
            redis_host : redis_health
        }
        redis.set('dukcapil_heartbeat', 
            JSON.stringify(data), function(err, reply) {
                console.log(reply);
        });

        /**
         * Log Unreachable Connection
         */
        var message = "";

        if(dukcapil_health == false){
            message = new Date() + " | " + "Dukcapil" + " | " + dukcapil_health + "\r\n";
            logger.write(message);
        }
        if(redis_health == false){
            message = new Date() + " | " + "Redis" + " | " + redis_health + "\r\n";
            logger.write(message);
        }
        console.log('Datetime ' + new Date());
        console.log('Redis Health ' + redis_health);
        console.log("Dukcapil Health " + dukcapil_health);
    })();
}
