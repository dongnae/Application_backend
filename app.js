const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const csv_parse = require("csv-parse/lib/sync");

const path = require('path');
const https = require("https");
const fs = require("fs");

const apiRouter = require('./routes/api');
const option = require("./option");

const app = express();

process.env.TZ = "Asia/Seoul";
global.__registerTime = (new Date(
	"2020-05-28 8:20:0"
)).getTime();
global.__database = null;
global.__student = csv_parse(fs.readFileSync("./grade.csv"), {
	skip_empty_lines: true,
	trim: true
}).slice(1);

let queue = [], running = [];
global.__pushApplicationTask = (groupId, cb) => {
    if (queue[groupId] === undefined) {
        queue[groupId] = [cb];
    }
	else queue[groupId].push(cb);
    
    if (running[groupId] !== true) {
        running[groupId] = true;
        executeGroupTask(groupId);
    }
};

const executeGroupTask = async(groupId) => {
    if (queue[groupId] !== undefined) {
        if (queue[groupId].length > 0) {
            try {
                let ret = await queue[groupId].shift()();
                console.log(groupId, ret, 'app');
                if (ret <= 0) {
                    let tmp = queue[groupId].slice(0);
                    queue[groupId] = [];
                    running[groupId] = false;
                    while (tmp.length > 0) tmp.shift()();
                }else setTimeout(() => executeGroupTask(groupId), 3);
            } catch (e) {
                console.log("app.js queue process");
                console.log(e);
            }
        }
    }
};

//app.use(require("cors")());

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRouter);
app.use((req, res) => {
	res.sendFile(path.join(__dirname, 'public/index.html'))
});

(async () => {
	await MongoClient.connect(option.url, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	}).then(d => global.__database = d.db('groups')).catch(e => {
		console.log("DB Connection Fail");
		console.log(e);
		process.exit(0);
	});

	https.createServer({
		cert: fs.readFileSync('./ssl/cert.pem'),
		ca: fs.readFileSync('./ssl/fullchain.pem'),
		key: fs.readFileSync('./ssl/privkey.pem')
	}, app).listen(443, () => {
		console.log('HTTPS Server started on port 443');
	});
})();
