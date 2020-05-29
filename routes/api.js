const express = require('express');
const option = require("../option");
const router = express.Router();

router.post('/admin', async function (req, res) {
	try {
		res.header("Content-Type", "application/json; charset=utf-8");

		let id = req.body.id, pw = req.body.pw;
		if (id !== option.admin.id || pw !== option.admin.pw) {
			res.status(403);
			res.end(JSON.stringify({
				status: 1
			}));
			return;
		}

		let students = {}, groups = {};
		(await __database.collection('student').find({}).toArray()).forEach(v => {
			if (v._id !== undefined) delete v._id;
			students[v.num] = v;

			if (groups[v.groupId] === undefined) groups[v.groupId] = [];
			groups[v.groupId].push(v);
		});

		res.status(200);
		res.end(JSON.stringify({
			status: 0,
			result: {
				groups: (await __database.collection('group').find({}).toArray()).map(v => {
					if (v._id !== undefined) delete v._id;
					if (groups[v.id] !== undefined) v.students = groups[v.id];
					return v;
				}),
				//registerStudent: students,
				unregisterStudent: __student.filter(v => students[v[0]] === undefined)
			}
		}));
	} catch (e) {
		console.log(e)
		res.status(500);
		res.end(JSON.stringify({
			status: 2
		}));
	}
});

router.post('/groups', async function (req, res) {
	try {
		res.header("Content-Type", "application/json; charset=utf-8");
		res.status(200);

		if (__registerTime > Date.now()) {
			res.end(JSON.stringify({
				status: 1,
				message: "신청 기간이 아닙니다.",
				time: __registerTime - Date.now()
			}));
			return;
		}

		res.end(JSON.stringify({
			status: 0,
			result: (await __database.collection('group').find({}).toArray()).map(v => {
				if (v._id !== undefined) delete v._id;
				return v;
			})
		}));
	} catch (e) {
		console.log(e)
		res.status(500);
		res.end(JSON.stringify({
			status: 2
		}));
	}
});

router.post('/application', async function (req, res) {
	try {
		res.header("Content-Type", "application/json; charset=utf-8");

		let num = req.body.num, name = req.body.name, group = req.body.group;
		if (typeof num !== "string" || typeof name !== "string" || !Number.isSafeInteger(group)) {
			res.status(403);
			res.end(JSON.stringify({
				status: 1
			}));
			return;
		}

		if (__registerTime > Date.now()) {
			res.status(200);
			res.end(JSON.stringify({
				status: 2,
				message: "신청 기간이 아닙니다.",
				time: __registerTime - Date.now()
			}));
			return;
		}

		if (!__student.filter(v => v[0] === num && v[1] === name).length) {
			res.status(200);
			res.end(JSON.stringify({
				status: 3,
				message: "이름 또는 학번이 잘못되었습니다.",
				groups: (await __database.collection('group').find({}).toArray()).map(v => {
					if (v._id !== undefined) delete v._id;
					return v;
				})
			}));
			return;
		}

		__pushApplicationTask(group, async () => {
			try {
				let student;
				if ((student = await __database.collection('student').findOne({num: num, name: name})) !== null) {
					res.status(200);
					res.end(JSON.stringify({
						status: 4,
						message: student.groupId === 999 ? "이미 동아리에 신청하였습니다." : "이미 동아리에 신청하였습니다.",
						groups: (await __database.collection('group').find({}).toArray()).map(v => {
							if (v._id !== undefined) delete v._id;
							return v;
						})
					}));
					return 999;
				}

				let selectedGroup = await __database.collection('group').findOne({id: group});
				if (selectedGroup === null) {
					res.status(403);
					res.end(JSON.stringify({
						status: 5
					}));
					return 999;
				}

				if (!selectedGroup.available) {
					res.status(200);
					res.end(JSON.stringify({
						status: 6,
						message: "선택한 동아리의 모집이 마감되었습니다.\n다른 동아리를 선택해주세요.",
						groups: (await __database.collection('group').find({}).toArray()).map(v => {
							if (v._id !== undefined) delete v._id;
							return v;
						})
					}));
					return 0;
				}

				let studentQuery = await __database.collection('student').insertOne({
					num: num,
					name: name,
					groupId: group,
					registerTime: Date.now()
				});
				let groupQuery = await __database.collection('group').updateOne({id: group}, {
					$set: {
						available: selectedGroup.available - 1
					}
				});

				if (studentQuery.insertedCount === 1 && groupQuery.modifiedCount === 1) {
					res.status(200);
					res.end(JSON.stringify({
						status: 0
					}));
                    
                    return selectedGroup.available - 1;
				} else {
					res.status(500);
					res.end(JSON.stringify({
						status: 7
					}));
					return 999;
				}
			} catch (e) {
				console.log(e);
				res.status(500);
				res.end(JSON.stringify({
					status: 8
				}));
                return 999;
			}
		});
	} catch (e) {
		console.log(e)
		res.status(500);
		res.end(JSON.stringify({
			status: 9
		}));
		return 999;
	}
});

router.post((req, res) => {
	res.status(403);
	res.end(JSON.stringify({
		result: 999
	}));
})

router.use((req, res) => {
	res.status(405);
	res.end("<h1>405 Method Not Allowed</h1>")
});

module.exports = router;
