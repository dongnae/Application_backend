const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const csv_parse = require("csv-parse/lib/sync");

const path = require('path');
const fs = require("fs");

const apiRouter = require('./routes/api');
const option = require("./option");

const app = express();

global.__database = null;
global.__student = csv_parse(fs.readFileSync("./grade.csv"), {
	skip_empty_lines: true,
	trim: true
});

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRouter);
app.use((req, res) => {
	res.sendFile(path.join(__dirname, 'public/index.html'))
});

(async () => {
	await MongoClient.connect(option.url, {useNewUrlParser: true, useUnifiedTopology: true}).then(d => global.__database = d.db('groups')).catch(e => {
		console.log("DB Connection Fail");
		console.log(e);
		process.exit(0);
	});

	app.listen(80, () => {
		console.log('Server started on port 80');
	});
})();
