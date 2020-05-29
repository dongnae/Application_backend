const MongoClient = require('mongodb').MongoClient;
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: './result.csv',
    header: [
        {id: 'num', title: '학번'},
        {id: 'name', title: '이름'},
	{id: 'group', title: '동아리'}
    ]
});
const fs = require("fs");
const csv_parse = require("csv-parse/lib/sync");
global.__student = csv_parse(fs.readFileSync("../grade.csv"), {
        skip_empty_lines: true,
        trim: true
}).slice(1);
const option = require("../option");

const readline = require("readline").createInterface({
	input: process.stdin,
	output: process.stdout
});

const remove = true;
new Promise(async (r) => await MongoClient.connect(option.url, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(d => global.__database = d.db('groups')).catch(e => {
	console.log("DB Connection Fail");
	console.log(e);
	process.exit(0);
}).finally(() => r())).then(async () => {
	let records = [], groups = {}, students = {};

	(await __database.collection('student').find({}).toArray()).forEach(v => students[v.num] = `${v.groupId}`);
	console.log(students);
	
	(await __database.collection('group').find({}).toArray()).forEach(v => {
		groups[v.id] = v.name;
	});
	console.log(groups);

	for (let data of __student) {
		let name = data[1], num = data[0];
		console.log(students[num], num)
		records.push({num: num, name: name, group: groups[students[num]]});
	}
	
	await csvWriter.writeRecords(records)
	
	console.log('Success!');
	process.exit(0);
});
