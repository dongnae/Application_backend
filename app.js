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
	"2020-05-26 11:0:0"
)).getTime();
global.__database = null;
global.__student = csv_parse(fs.readFileSync("./grade.csv"), {
	skip_empty_lines: true,
	trim: true
}).slice(1);

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
