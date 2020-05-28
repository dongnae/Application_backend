const axios = require("axios");
const fs = require("fs");
const csv_parse = require("csv-parse/lib/sync");

const student = csv_parse(fs.readFileSync("../grade.csv"), {
	skip_empty_lines: true,
	trim: true
}).slice(1);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let startDate = Date.now(), p = [];
for (let data of student) {
	p.push(axios.post("https://127.0.0.1/api/application", {
		num: data[0],
		name: data[1],
		group: 0
	}, {
		responseType: "json"
	}).then(res => console.log(data[0] + data[1] + ":", res.data)));
}

Promise.all(p).then(() => {
	console.log(Date.now() - startDate);
})
