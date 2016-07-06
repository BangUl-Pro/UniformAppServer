var http = require('http');
var express = require('express');
var app = express();

var server = http.createServer(app).listen(process.env.PORT || 5000);
app.get('/', function(req, res) {
	console.log('실행');
});


var io = require('socket.io').listen(server);
var mongoose = require('mongoose');


// MYSQL
var mySql = require('mysql');
var mySqlConnection = mySql.createConnection(process.env.JAWSDB_URL); 
var pool = mySql.createPool({
	connectionLimit : 100
});

mySqlConnection.connect(function(err) {
	if (err) {
		console.error('error code = 300');
		console.error('MYSQL 연결 에러 = ' + err);
	} else {
		console.log('MYSQL 연결');
	}
});


// gcm
var gcm = require('node-gcm');

var done = false;

var multer = require('multer');
var fs = require('fs');

var gcm_server_key = "AIzaSyDXdoNFtDmY2N-pkSwt2TuS7b2x83MevBw";
var sender = new gcm.Sender(gcm_server_key);

function randomName() {
	var char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var name = "";
	for (var i = 0; i < char.length; i++) {
		var curChar = char[i];
		var randomIndex = Math.floor(Math.random() * char.length);
		char[i] = char[randomIndex];
		char[randomIndex] = curChar;
	}
	
	for (var i = 0; i < 6; i++) {
		name += char.charAt(Math.floor(Math.random() * char.length));
	}
	console.log('randomName = ' + name);
	return name;
};

var multerOption = multer.diskStorage({
	destination : './images/',
	filename : function(req, file, cb) {
		cb(null, randomName() + Date.now());
	}
});

var upload = multer({
	storage : multerOption,
	inMemory : true,
	putSingleFilesInArray : true
}).single('uploaded_file');

//app.use(upload());

//app.use(multer({
//	dest : './images/',
//	rename : function(fieldName, fileName) {
//		return Date.now();
//	},
//	onFileUploadComplete : function(file) {
//		done = true;
//	},
//	inMemory : true,
//	putSingleFilesInArray : true
//}).array('photos', 12));

app.post('/api/photo', function(req, res) {
//	console.log('파일 업로드 시도');
//	if (done) {
//		console.log('파일 업로드 성공 = ' + req.files);
//		res.send("파일 업로드 성공 \n" + req.files);
//	}
	upload(req, res, function(err) {
		if (err) {
			console.error('에러 = ' + err);
			res.writeHead(500);
			res.end('ss');
		} else {
			var parentId = req.headers.parent_id;
			console.log('파일 입력 ');
			console.log('파일 입력 fieldname = ' + req.file.fieldname);
			console.log('파일 입력 originalname = ' + req.file.originalname);
			console.log('파일 입력 encoding = ' + req.file.encoding);
			console.log('파일 입력 destination = ' + req.file.destination);
			console.log('파일 입력 filename = ' + req.file.filename);
			console.log('파일 입력 path = ' + req.file.path);
			console.log('파일 입력 size = ' + req.file.size);
			console.log('파일 입력 parentId = ' + parentId);

			if (req.file.fieldname && req.file.originalname && req.file.encoding &&
				req.file.destination && req.file.filename && req.file.path &&
				req.file.size && parentId) {

				var inputData = {
					'file_id' : req.file.filename,
					'file_parent_id' : parentId
				};
				mySqlConnection.query('INSERT INTO files SET ?', inputData, function(err) {
					if (err) {
						console.log('파일 입력 에러 = ' + err);
						res.writeHead(201);
						res.end('에러');
					} else {
						console.log('파일 입력 성공');
						res.writeHead(200);
						res.end('성공');
					}
				});
			}
			
			
			
//			fs.writeFile('images', req.file, 'utf-8', function(err) {
//				if (err) {
//					console.error('write Error = ' + err);
//				} else {
//					console.log('write 성공');
//					res.writeHead(200);
//					res.end('dd');
//				}
//			});
		}
	});
});

app.get('/imgs/:fileName', function(req, res) {
	fs.readdir('./images', function(err, data) {
		if (err) {
			console.error('get ./images Error = ' + err);
		} else {
			console.log('./images = ' + data);

			fs.readFile('./images/' + req.params.fileName, function(err, fileData) {
				if (err) {
					console.log('error = ' + err);
					res.writeHead(300, {'Content-Type' : 'text/html'});
					res.end('error = ' + err);
				} else { 
					res.writeHead(200, {'Content-type' : 'image/png'});
					res.end(fileData);
				}
			});
		}
	});
});


app.post('/insertSchool', function(req, res) {
	var data = req.headers.schools;
	console.log('data = ' + data);
	var json = encodeURI(data);
//	console.log('json = ' + json);
	
	var jsonData = JSON.parse(data);
	
	var schoolName = decodeURIComponent(jsonData.school_schoolname);
	var address = decodeURIComponent(jsonData.school_address);
	var city = decodeURIComponent(jsonData.school_city);
	var category = decodeURIComponent(jsonData.school_category);
	var gu = decodeURIComponent(jsonData.school_gu);
	
	console.info('학교 DB입력 schoolName = ' + schoolName);
	console.info('학교 DB입력 address = ' + address);
	console.info('학교 DB입력 city = ' + city);
	console.info('학교 DB입력 category = ' + category);
	console.info('학교 DB입력 gu = ' + gu);
	
	if (!schoolName || !address || !city || !category || !gu) {
		console.error('값 누락');
		res.end('값 누락');
		return;
	}
	
	var inputData = {
			'school_schoolname' : schoolName,
			'school_address' : address,
			'school_city' : city,
			'school_category' : category,
			'school_gu' : gu
	};
	mySqlConnection.query('INSERT INTO schools set ?', inputData, function(err) {
		if (err) {
			res.end('실패');
			console.error('학교 DB입력 실패 = ' + err);
		} else {
			res.end('성공');
			console.log('학교 DB입력 성공');
		}
	});
});


//var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}



var MAN = 1;
var WOMAN = 2;

var GUEST = 1;
var STUDENT = 2;
var PARENT = 3;

function signIn (socket, data) {
	// 회원가입
	var user_id = data.user_id;
	var realName = data.realName;
	var sex = data.sex;
	var userType = data.userType;
	var phone = data.phone;
	var school_id = data.school_id;
	var kakao_id = data.kakao_id;
	var kakao_nickname = data.kakao_nickname;
	var kakao_thumbnail_image = data.kakao_thumbnail_image;
	var kakao_profile_image = data.kakao_profile_image;
	
	console.log('회원가입 ');
	console.info('회원가입 user_id = ' + user_id);
	console.info('회원가입 realName = ' + realName);
	console.info('회원가입 sex = ' + sex);
	console.info('회원가입 userType = ' + userType);
	console.info('회원가입 phone = ' + phone);
	console.info('회원가입 school_id = ' + school_id);
	console.info('회원가입 kakao_id = ' + kakao_id);
	console.info('회원가입 kakao_nickname = ' + kakao_nickname);
	console.info('회원가입 kakao_thumbnail_image = ' + kakao_thumbnail_image);
	console.info('회원가입 kakao_profile_image = ' + kakao_profile_image);
	
	if (!user_id) {
		// 값 누락
		socket.emit('signUp', {
			'code' : 411,
			'userType' : userType
		});
	} else {
		if (realName && sex && userType && phone && school_id) {
			// 정식 회원
			var inputData = {
				'user_real_name' : realName,
				'user_sex' : sex,
				'user_user_type' : userType,
				'user_phone' : phone,
				'user_school_id' : school_id,
				'user_has_extra_profile' : true
			};
			
			var queryData = {
					'user_id' : user_id
			};
			
			mySqlConnection.query('UPDATE users set ? WHERE ?', [inputData, queryData], function(err, userResult) {
				if (err) {
					console.error('회원가입 DB Update 에러 = ' + err);
					socket.emit('signUp', {
						'code' : 412,
						'userType' : userType
					});
				} else {
					mySqlConnection.query('SELECT * FROM users WHERE user_id = "' + user_id + '"', function(err, result) {
						if (err) {
							console.log('회원가입 DB 에러 = ' + err);
							socket.emit('signUp', {
								'code' : 413
							});
						} else {
							console.log('회원가입 성공 = ' + JSON.stringify(result[0]));
							socket.emit('signUp', {
								'code' : 200,
								'userType' : userType,
								'user' : result[0]
							});
						}
					});
				}
			});
		} else if (kakao_id || kakao_nickname || kakao_profile_image || kakao_thumbnail_image) {
			// 카카오 
			console.log('카카오 회원가입');
			var inputData = {
				'user_id' : user_id,
				'user_user_type' : userType,
				'kakao_id' : kakao_id,
				'kakao_nickname' : kakao_nickname,
				'kakao_thumbnail_image' : kakao_thumbnail_image,
				'kakao_profile_image' : kakao_profile_image
			};
			
			mySqlConnection.query('INSERT INTO users set ?', inputData, function(err, result) {
				if (err) {
					console.error('회원가입 DB Insert 에러 = ' + err);
					socket.emit('signUp', {
						'code' : 412,
						'userType' : userType
					});
				} else {
					mySqlConnection.query('SELECT * FROM users WHERE user_id = "' + user_id + '"', function(err, userResult) {
						if (err) {
							console.info('회원가입 쿼리에러 = ' + err);
							socket.emit('signUp', {
								'code' : 413,
								'userType' : userType
							});
						} else {
							console.info('userResut = ' + JSON.stringify(userResult[0]));
							socket.emit('signInKakao', {
								'code' : 200,
								'userType' : userType,
								'user' : userResult[0]
							});
						}
					});
				}
			});
				
		} else {
			// 게스트
			console.log('게스트 가입');
			var date = Date.now();
			var inputData = {
				'user_id' : user_id,
				'user_user_type' : userType
			};
			
			mySqlConnection.query('INSERT INTO users set ?', inputData, function(err, result) {
				if (err) {
					console.error('회원가입 DB Insert 에러 = ' + err);
					socket.emit('signUp', {
						'code' : 412,
						'userType' : 1
					});
				} else {
					mySqlConnection.query('SELECT * FROM users WHERE user_id = "' + user_id + '";', function(err, userResult) {
						if (err) {
							console.info('회원가입 쿼리에러 = ' + err);
							socket.emit('signUp', {
								'code' : 413,
								'userType' : userType
							});
						} else {
							console.info('userResut = ' + JSON.stringify(userResult[0]));
							socket.emit('signUp', {
								'code' : 200,
								'userType' : userType,
								'user' : userResult[0]
							});
						}
					});
				}
			});
		}
	}
};

io.on('connection', function(socket) {
	socket.on('setDeviceId', function(data) {
		var id = data.id;
		var deviceId = data.deviceId;

		console.log('setDeviceId');
		console.log('setDeviceId id = ' + id);
		console.log('setDeviceId deviceId = ' + deviceId);

		if (!id) {
			console.log('setDeviceId 데이터 누락.');
			socket.emit('setDeviceId', {
				'code' : 999
			});
		} else {
			var inputData = {
				'user_device_id' : deviceId
			};

			mySqlConnection.query('UPDATE users SET ? WHERE user_id = "' + id + '"', inputData, function(err) {
				if (err) {
					console.log('setDeviceId 에러 : ' + err);
					socket.emit('setDeviceId', {
						'code' : 998
					});
				} else {
					console.log('setDeviceId 성공.');
					socket.emit('setDeviceId', {
						'code' : 200
					});
				}
			});
		}
	});

	socket.on('addDeviceId', function(data) {
		mySqlConnection.query('ALTER TABLE users ADD COLUMN user_device_id VARCHAR(100);', function(err) {
			if (err) {
				console.log("device id 컬럼 추가 실패.");
			} else {
				console.log('device id 컬럼 추가 성공.');
			}
		});
	});

	// test
	socket.on('createSchool', function(data) {
		// 학교 db 생성
		mySqlConnection.query('create table if not exists schools (school_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, school_schoolname TEXT, school_address TEXT, school_city TEXT, school_category TEXT, school_gu TEXT, school_point INT NOT NULL);', function(err, result) {
			if (err) {
				console.error('school db 생성 에러 = ' + err);
			} else {
				console.log('school db 생성');
			}
		});
	});
	
	socket.on('createUser', function(data) {
		// 유저 db 생성
		mySqlConnection.query('create table if not exists users (user_id VARCHAR(100) NOT NULL, user_name TEXT, user_has_extra_profile BOOLEAN NOT NULL, user_phone TEXT, user_picture TEXT, user_real_name TEXT, user_school_id INT, user_sex INT, user_user_type INT, user_token TEXT, user_device_id VARCHAR(100), kakao_thumbnail_image TEXT, kakao_profile_image TEXT, kakao_nickname TEXT, kakao_id INT, PRIMARY KEY (user_id));', function(err, result) {
			if (err) {
				console.error('user db 생성 에러 = ' + err);
			} else {
				console.log('user db 생성');
			}
		});
	});
	
	
	socket.on('insertUser', function(data) {
		var inputData = {
				user_id : 70941410
			};
			
			mySqlConnection.query('INSERT INTO users set ?', inputData, function(err) {
				if (err) {
					console.error('error = ' + err);
				} else {
					console.log('insert user 성공 = ' + inputData.id);
				}
			});
	});
	
	
	socket.on('createKakao', function(data) {
		// 카카오 db 생성
		mySqlConnection.query('create table if not exists kakaos (id INT, user_id TEXT, token TEXT, nickname TEXT, profileImage TEXT, thumbnail_image TEXT, PRIMARY KEY (user_id, token));', function(err, result) {
			if (err) {
				console.error('kakao db 생성 에러 = ' + err);
			} else {
				console.log('kakao db 생성');
			}
		});
	});
	
	
	socket.on('createTimeline', function(data) {
		mySqlConnection.query('CREATE TABLE IF NOT EXISTS timelines (timeline_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, timeline_user_id TEXT, timeline_school_id INT, timeline_content TEXT, timeline_created BIGINT);', function(err) {
			if (err) {
				console.log('타임라인 테이블 생성 에러');
				console.error(err);
			} else {
				console.log('타임라인 테이블 생성 성공');
			}
		});
	});
	
	
	socket.on('createLike', function(data) {
		mySqlConnection.query('CREATE TABLE IF NOT EXISTS likes (like_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, like_timeline_id INT, like_user_id TEXT);', function(err) {
			if (err) {
				console.error('좋아요 테이블 생성 에러 = ' + err);
			} else {
				console.log('좋아요 테이블 생성 성공');
			}
		});
	});
	
	
	socket.on('createFile', function(data) {
		mySqlConnection.query('CREATE TABLE IF NOT EXISTS files (file_id VARCHAR(100) PRIMARY KEY, file_parent_id TEXT);', function (err) {
			if (err) {
				console.error('파일 테이블 생성 에러 = ' + err);
			} else {
				console.log('파일 테이블 생성 성공');
			}
		});
	});
	
	
	socket.on('createComment', function(data) {
		mySqlConnection.query('CREATE TABLE IF NOT EXISTS comments (comment_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, comment_timeline_item_id TEXT, comment_user_id TEXT, comment_created BIGINT, comment_content TEXT);', function(err) {
			if (err) {
				console.error('댓글 테이블 생성 에러 = ' + err);
			} else {
				console.log('댓글 테이블 생성 성공');
			}
		})
	});
	
	
	socket.on('createProduct', function(data) {
		mySqlConnection.query('CREATE TABLE IF NOT EXISTS products (product_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, product_user_id TEXT, product_name TEXT, product_created BIGINT, product_school_id INT, product_category INT, product_size INT, product_condition INT, product_sex INT, product_content TEXT);', function(err) {
			if (err) {
				console.error('제품 테이블 생성 에러 = ' + err);
			} else {
				console.log('제품 테이블 생성 성공');
			}
		});
	});
	
	socket.on('createTransaction', function(data) {
		mySqlConnection.query('CREATE TABLE IF NOT EXISTS transactions (transaction_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, transaction_receiver_id TEXT, transaction_donator_id TEXT, transaction_status INT, transaction_product_id TEXT, transaction_product_name TEXT, transaction_modified BIGINT);', function(err) {
			if (err) {
				console.error('트랜잭션 테이블 생성 에러 = ' + err);
			} else {
				console.log('트랜잭션 테이블 생성 성공');
			}
		});
	});

	socket.on('createToken', function(data) {
		mySqlConnection.query('ALTER TABLE users ADD COLUMN user_token TEXT;', function(err) {
			if (err) {
				console.log("token 컬럼 추가 실패. = " + err);
			} else {
				console.log('token 컬럼 추가 성공.');
			}
		});
	});
	
	
	socket.on('dropTransaction', function(data) {
		mySqlConnection.query('DELETE FROM transactions', function(err) {
			if (err) {
				console.error('트랜잭션 테이블 값 삭제 에러 = ' + err);
			} else {
				console.log('트랜잭션 테이블 값 삭제 완료');
			}
		});
		
		mySqlConnection.query('DROP TABLE transactions', function(err) {
			if (err) {
				console.error('트랜잭션 테이블 삭제 에러 = ' + err);
			} else {
				console.log('트랜잭션 테이블 삭제 성공');
			}
		});
	});
	
	
	socket.on('dropProduct', function(data) {
		mySqlConnection.query('DELETE FROM products', function(err) {
			if (err) {
				console.error('제품 테이블 값 삭제 에러 = ' + err);
			} else {
				console.log('제품 테이블 값 삭제 완료');
			}
		});
		
		mySqlConnection.query('DROP TABLE products', function(err) {
			if (err) {
				console.error('제품 테이블 삭제 에러 = ' + err);
			} else {
				console.log('제품 테이블 삭제 성공');
			}
		});
	});
	
	
	socket.on('dropComment', function(data) {
		mySqlConnection.query('DROP TABLE comments', function(err) {
			if (err) {
				console.error('댓글 테이블 삭제 에러 = ' + err);
			} else {
				console.log('댓글 테이블 삭제 성공');
			}
		});
	});
	
	
	socket.on('dropFile', function(data) {
		mySqlConnection.query('DROP TABLE files', function(err) {
			if (err) {
				console.error('파일 테이블 삭제 에러 = ' + err);
			} else {
				console.log('파일 테이블 삭제 성공');
			}
		});
	});
	
	
	socket.on('dropLike', function(data) {
		mySqlConnection.query('DROP TABLE likes', function(err) {
			if (err) {
				console.error('좋아요 테이블 삭제 = ' + err);
			} else {
				console.log('좋아요 테이블 삭제 성공');
			}
		});
	});
	
	
	socket.on('dropTimeline' ,function(data) {
		mySqlConnection.query('DROP TABLE timelines', function(err) {
			if (err) {
				console.log('타임라인 테이블 삭제 에러');
				console.error(err);
			} else {
				console.log('타임라인 테이블 삭제 성공');
			}
		});
	});
	
	
	socket.on('dropSchool', function(data) {
		// 학교 db 제거
		mySqlConnection.query('delete from schools', function(err, reulst) {
			if (err) {
				console.error('school db 제거 에러 = ' + err);
			} else {
				console.log('school db 제거');
			}
		});
		
		mySqlConnection.query('drop table schools', function(err, result) {
			if (err) {
				console.error('school db 제거 에러 = ' + err);
			} else {
				console.log('school db 제거');
			}
		});
	});
	
	
	socket.on('dropUser', function(data) {
		// 학교 db 제거
		mySqlConnection.query('drop table users', function(err, result) {
			if (err) {
				console.error('user db 제거 에러 = ' + err);
			} else {
				console.log('user db 제거');
			}
		});
	});
	
	
	socket.on('selectSchool', function(data) {
		// schools db 읽기 
		mySqlConnection.query('select * from schools', function(err, result) {
			if (err) {
				console.error('schools db select 에러 = ' + err);
			} else {
				console.log(rows);
			}
		});
	});
	
	socket.on('connect', function(data) {
		// 연결
		
	});
	
	
	socket.on('signUp', function(data) {
		signIn(socket, data);
	});
	
	
	socket.on('signIn', function(data) {
		// 로그인
		var user_id = data.user_id;
		
		console.log('로그인');
		console.info('user_id = ' + user_id);
		
		if (!user_id) {
			// 값 누락
			console.error('값 누락');
			socket.emit('signIn', {
				'code' : 420
			});
		} else {
			mySqlConnection.query('select * from users WHERE user_id = "' + user_id + '";', function(err, userResult) {
				if (err) {
					console.error('회원정보 로드 에러 = ' + err);
					socket.emit('signIn', {
						'code' : 421
					});
				} else {
					console.info('로그인 userResult = ' + JSON.stringify(userResult[0]));
					socket.emit('signIn', {
						'code' : 200,
						'user' : userResult[0]
					});
				}
			});
		}
	});

	socket.on('setToken', function(data) {
		var id = data.id;
		var token = data.token;

		console.log('setToken');
		console.log('setToken id = ' + id);
		console.log('setToken token = ' + token);

		if (!id) {
			console.log('setToken 데이터 누락.');
			socket.emit('setToken', {
				'code' : 999
			});
		} else {
			var inputData = {
				'user_token' : token
			};

			mySqlConnection.query('UPDATE users SET ? WHERE user_id = "' + id + '"', inputData, function(err) {
				if (err) {
					console.log('setToken 에러 : ' + err);
					socket.emit('setToken', {
						'code' : 998
					});
				} else {
					console.log('setToken 성공.');
					socket.emit('setToken', {
						'code' : 200
					});
				}
			});
		}
	});

	socket.on('sendGcm', function(data) {
		var id = data.id;
		var msg = data.msg;

		console.log('sendGcm');
		console.log('sendGcm id = ' + id);
		console.log('sendGcm msg = ' + msg);

		if (!id) {
			console.log('sendGcm 데이터 누락.');
			socket.emit('sendGcm', {
				'code' : 999
			});
		} else {
			mySqlConnection.query('SELECT user_token FROM users WHERE user_id = "' + id + '"', function(err, result) {
				if (err) {
					console.log('sendGcm 에러 : ' + err);
					socket.emit('sendGcm', {
						'code' : 998
					});
				} else {
					console.log('result = ' + result[0].user_token);
					
					var message = new gcm.Message({
					    collapseKey: 'uniform',
					    delayWhileIdle: true,
					    timeToLive: 3,
					    data: {
					        title: 'uniform',
					        message: msg,
					    }
					});

					var registrationIds =[];
					registrationIds.push(result[0].user_token);
					sender.send(message, registrationIds, 4, function(err, result) {
						if (err) {
							console.log('gcm error = ' + err);
						} else {
							console.log('gcm = ' + JSON.stringify(result));
						}
					});
				}
			});
		}
	});
	
	socket.on('getSchoolRanking', function(data) {
		var from = data;
		
		// 학교 랭킹 요청
		console.log('학교랭킹 요청');
		mySqlConnection.query('select * from schools ORDER BY school_point DESC', function(err, result) {
			if (err) {
				console.error('학교랭킹 요청 에러 = ' + err);
				socket.emit('getSchoolRanking', {
					'code' : 430
				});
			} else {
				console.info('학교 랭킹 요청 성공');
				socket.emit('getSchoolRanking', {
					'code' : 200,
					'school' : result
				});
			}
		});
	});
	
	
	socket.on('insertSchool', function(data) {
		console.log('학교 DB입력');
		console.info('data = ' + data);
		for(var i = 0; i < data.length; i++) {
			var json = data[i];
//			console.info('json = ' + json);
			var schoolName = json.schoolname;
			var address = json.address;
			var city = json.city;
			var category = json.category;
			var gu = json.gu;
			
			console.info('학교 DB입력 schoolName = ' + schoolName);
			console.info('학교 DB입력 address = ' + address);
			console.info('학교 DB입력 city = ' + city);
			console.info('학교 DB입력 category = ' + category);
			console.info('학교 DB입력 gu = ' + gu);
			
			if (!id || !schoolName || !address || !city || !category || !gu) {
				console.error('값 누락');
				return;
			}
			
			var inputData = {
					'school_schoolname' : schoolName,
					'school_address' : address,
					'school_city' : city,
					'school_category' : category,
					'school_gu' : gu
			};
			mySqlConnection.query('INSERT INTO schools set ?', inputData, function(err) {
				if (err) {
					console.error(err);
				} else {
					console.log('성공');
				}
			});
		}
		
	});
	
	socket.on('getSchool', function(data) {
		// 학교 정보 요청
		mySqlConnection.query('select * from schools', function(err, result) {
			if (err) {
				console.error('error code = 400');
				console.error('학교 정보 요청 DB 에러 = ' + err);
				socket.emit('getSchool', {
					'code' : 400
				});
			} else {
				if (result) {
					socket.emit('getSchool', {
						'code' : 200,
						'school' : result 
					});
				} else {
					console.log('학교 정보 없음');
					socket.emit('getSchool', {
						'code' : 401
					});
				}
			}
		});
	});
	
	
	socket.on('searchProduct', function(data) {
		// 제품 검색
		var school_id = data.school_id;
		var sex = data.sex;
		var category = data.category;
		var size = data.size;
		var position = data.position;
		
		console.log('제품 검색 ');
		console.info('제품 검색 school_id = ' + school_id);
		console.info('제품 검색 sex = ' + sex);
		console.info('제품 검색 category = ' + category);
		console.info('제품 검색 size = ' + size);
		console.info('제품 검색 position = ' + position);
		
		if (!school_id || !sex || !category || !size || !position) {
			// 값 누락
			console.error('제품 검색 값 누락');
			socket.emit('searchProduct', {
				'code' : 440
			});
		} else {
			console.log('제품 검색 한다');
			if (size == -1 && category == -1) {
				mySqlConnection.query('SELECT * FROM files RIGHT OUTER JOIN (SELECT * FROM products JOIN transactions ON products.product_school_id = ' + school_id + ' AND products.product_sex = ' + sex + ' AND products.product_id = transactions.transaction_product_id LIMIT 10 OFFSET ' + (position - 1) * 10 + ')' +
						'as products ON products.product_id = files.file_parent_id ORDER BY products.product_id;', function(err, productResult) {
					console.log('사이즈 전부, 카테고리 전부 검색');
					if (err) {
						console.error('제품 검색 에러 = ' + err);
						socket.emit('searchProduct', {
							'code' : 441
						});
					} else {
						console.log('제품 검색 성공 = ' + JSON.stringify(productResult));
						socket.emit('searchProduct', {
							'code' : 200,
							'product' : productResult
						});
					}
				});
			} else if (size == -1) {
				mySqlConnection.query('SELECT * FROM files RIGHT OUTER JOIN (SELECT * FROM products JOIN transactions ON products.product_school_id = ' + school_id + ' AND products.product_sex = ' + sex + ' AND products.product_id = transactions.transaction_product_id AND products.product_category = ' + category + ' LIMIT 10 OFFSET ' + (position - 1) * 10 + ')' +
						'as products ON products.product_id = files.file_parent_id;', function(err, productResult) {
					console.log('사이즈 전부 검색');
					if (err) {
						console.error('제품 검색 에러 = ' + err);
						socket.emit('searchProduct', {
							'code' : 441
						});
					} else {
						console.log('제품 검색 성공');
						socket.emit('searchProduct', {
							'code' : 200,
							'product' : productResult
						});
					}
				});
			} else if (category == -1) {
				mySqlConnection.query('SELECT * FROM files RIGHT OUTER JOIN ' +
				'(SELECT * FROM products JOIN transactions ON products.product_school_id = ' + school_id +
				' AND products.product_sex = ' + sex +
				' AND products.product_id = transactions.transaction_product_id' +
				' AND products.product_size = ' + size +
				' LIMIT 10 OFFSET ' + (position - 1) * 10 + ')' +
				'as products ON products.product_id = files.file_parent_id;', function(err, productResult) {
					console.log('카테고리 전부 검색');
					if (err) {
						console.error('제품 검색 에러 = ' + err);
						socket.emit('searchProduct', {
							'code' : 441
						});
					} else {
						console.log('제품 검색 성공');
						socket.emit('searchProduct', {
							'code' : 200,
							'product' : productResult
						});
					}
				});
			} else {
				console.log('제품 검색 ㅇㅇ');
				mySqlConnection.query('SELECT * FROM files RIGHT OUTER JOIN (SELECT * FROM products JOIN transactions ON products.product_school_id = ' + school_id + ' AND products.product_sex = ' + sex + 
						' AND products.product_id = transactions.transaction_product_id AND products.product_size = ' + size + ' AND products.product_category = ' + category + ' LIMIT 10 OFFSET ' + (position - 1) * 10 + ')' +
						'as products ON products.product_id = files.file_parent_id;', function(err, productResult) {
					if (err) {
						console.error('제품 검색 에러 = ' + err);
						socket.emit('searchProduct', {
							'code' : 441
						});
					} else {
						console.log('제품 검색 성공');
						socket.emit('searchProduct', {
							'code' : 200,
							'product' : productResult
						});
					}
				});
			}
		}
	});
	
	
	socket.on('updateUserProfile', function(data) {
		// 유저 프로필 업데이트
		var id = data.id;
		var phone = data.phone;
		var schoolId = data.schoolId;
		
		console.log('유저 프로필 업데이트 ');
		console.info('유저 프로필 업데이트 id = ' + id);
		console.info('유저 프로필 업데이트 phone = ' + phone);
		console.info('유저 프로필 업데이트 schoolId = ' + schoolId);
		
		if (!id || !phone || !schoolId) {
			console.error('유저 프로필 업데이트 데이터 누락');
			socket.emit('updateUserProfile', {
				'code' : 460
			});
		} else {
			var userData = {
				'user_phone' : phone,
				'user_school_id' : schoolId
			};
			
			mySqlConnection.query('UPDATE users SET ? WHERE user_id = "' + id + '"', userData, function(err) {
				if (err) {
					console.log('유저 프로필 업데이트 에러 = ' + err);
					socket.emit('updateUserProfile', {
						'code' : 461
					});
				} else {
					mySqlConnection.query('SELECT * FROM users WHERE user_id = "' + id + '"', function(err, result) {
						if (err) {
							console.log('유저 프로필 업데이트 에러 = ' + err);
							socket.emit('updateUserProfile', {
								'code' : 462
							});
						} else {
							console.log('유저 프로필 업데이트 성공 = ' + JSON.stringify(result));
							socket.emit('updateUserProfile', {
								'code' : 200,
								'user' : result[0]
							});
						}
					});
				}
			});
		}
	});
	

	socket.on('getProduct', function(data) {
		// 제품 검색
		var school_id = data.product_school_id;
		var category = data.product_category;
		var created = data.product_created;
		
		console.log('getProduct ');
		console.info('getProduct school_id = ' + school_id);
		console.info('getProduct category = ' + category);
		console.info('getProduct created = ' + created);
		
		if (!school_id || !category  || !created) {
			// 값 누락
			console.error('getProduct 값 누락');
			socket.emit('getProduct', {
				'code' : 800
			});
		} else {
			console.log('getProduct 한다');


			mySqlConnection.query('SELECT * FROM files RIGHT OUTER JOIN (SELECT * FROM products JOIN transactions ON products.product_school_id = ' + school_id +
				' AND products.product_id = transactions.transaction_product_id' + 
				' AND products.product_category = ' + category +
				' AND products.product_created >= ' + created + ')' +
				' as products ON products.product_id = files.file_parent_id;', function(err, productResult) {
					if (err) {
						console.error('getProduct 에러 = ' + err);
						socket.emit('getProduct', {
							'code' : 801
						});
					} else {
						console.log('getProduct 성공 ' + JSON.stringify(productResult));
						socket.emit('getProduct', {
							'code' : 200,
							'product' : productResult
						});
					}
				});
		}
	});

	
	socket.on('insertTimeline', function(data) {
		var school_id = data.school_id;
		var timelineContent = data.timelineContent;
		var user_id = data.user_id;
		var date = new Date();
		var files = data.file;
		
		console.log('타임라인 글 쓰기');
		console.info('school_id = ' + school_id);
		console.info('user_id = ' + user_id);
		console.info('timelineContent = ' + timelineContent);
		console.info('date = ' + date.getTime());
		console.info('files = ' + files);
		
		if (!school_id || !timelineContent || !user_id) {
			// 값 누락
			console.error('값 누락');
			socket.emit('insertTimeline', {
				'code' : 470
			});
		} else {
			var inputData = {
				'timeline_user_id' : user_id,
				'timeline_school_id' : school_id,
				'timeline_content' : timelineContent,
				'timeline_created' : date.getTime()
			};
			mySqlConnection.query('INSERT INTO timelines set ?', inputData, function(err) {
				if (err) {
					console.error('타임라인 삽입' + err);
					socket.emit('insertTimeline', {
						'code' : 471
					});
				} else {
					console.log('타임라인 글 쓰기 성공');
					mySqlConnection.query('SELECT * FROM timelines JOIN users ON timelines.timeline_user_id = "' + user_id + '" AND timelines.timeline_school_id = ' + school_id + ' AND timelines.timeline_content = "' + timelineContent + '"' + ' AND timelines.timeline_user_id = users.user_id LIMIT 1;', function(err, timelineResult) {
						if (err) {
							console.error('타임라인 결과값 확인 에러 = ' + err);
							socket.emit('insertTimeline', {
								'code' : 472
							});
						} else {
							console.log('timelineResult = ' + timelineResult[0]);
							socket.emit('insertTimeline', {
								'code' : 200,
								'timeline' : timelineResult[0]
							});
						}
					});
				}
			});
		}
	});
	//mysql.escape
	
	
	socket.on('signInKakao', function(data) {
		var id = data.id;
		var nickName = data.nickName;
		var profileImage = data.profileImage;
		var thumbnailImage = data.thumbnailImage;
		
		console.log('카카오 로그인 ');
		console.info('카카오 로그인 id = ' + id);
		console.info('카카오 로그인 nickName = ' + nickName);
		console.info('카카오 로그인 profileImage = ' + profileImage);
		console.info('카카오 로그인 thumbnailImage = ' + thumbnailImage);
		
		// if (!id || !nickName) {
		if (!id) {	
			console.error('카카오 로그인 데이터 누락');
			socket.emit('signInKakao', {
				'code' : 480
			});
		} else {
			mySqlConnection.query('SELECT * FROM users WHERE user_id = "' + id + '" LIMIT 1;', function(err, userResult) {
				if (err) {
					console.error('DB 쿼리 에러 = ' + err);
					socket.emit('signInKakao', {
						'code' : 481
					});
				} else {
					console.log('카카오 로그인 userResult = ' + JSON.stringify(userResult[0]));
					
					if (!userResult[0]) {
						// 유저 정보 없음
						console.error('유저 정보 없음');
						var signInData = {
								'user_id' : id,
								'userType' : 1,
								'kakao_id' : id,
								'kakao_nickName' : nickName,
								'kakao_profile_image' : profileImage,
								'kakao_thumbnail_image' : thumbnailImage
						};
						
						signIn(socket, signInData);
					} else {
						console.log('성공');
						socket.emit('signInKakao', {
							'code' : 200,
							'user' : userResult[0]
						});
					}
				}
			});
		}
	});
	
	socket.on('updateSchool', function(data) {
		mySqlConnection.query('UPDATE schools SET school_point = 0', function(err) {
			if (err) {
				console.log('스쿨업데이트 에러 = ' + err);
			} else {
				console.log('스쿨업데이트 성공');
			}
		});
	});
	
	
	socket.on('getAllTimeline', function(data) {
		var school_id = data.school_id;
		var userId = data.user_id;
		
		console.log('타임라인 모두 받아오기');
		console.info('school_id = ' + school_id);
		console.info('userId = ' + userId);
		
		if (!school_id || !userId) {
			console.error('데이터 누락');
			socket.emit('getAllTimeline', {
				'code' : 500
			});
		} else {
			mySqlConnection.query('SELECT * FROM timelines JOIN users ON timelines.timeline_user_id = users.user_id AND timelines.timeline_school_id = ' + school_id
					+ ' LEFT JOIN likes ON timelines.timeline_id = likes.like_timeline_id AND likes.like_user_id = "' + userId
					+ '" LEFT JOIN files ON files.file_parent_id = timelines.timeline_id ORDER BY timelines.timeline_id', function(err, timelineResult) {
				if (err) {
					console.error('타임라인 모두 받아오기 에러 = ' + err);
					socket.emit('getAllTimeline', {
						'code' : 501
					});
				} else {
					console.log('timelineResult = ' + timelineResult);
					socket.emit('getAllTimeline', {
						'code' : 200,
						'timeline' : timelineResult
					});
				}
			});
		}
	});
	
	
	socket.on('getMyTimeline', function(data) {
		var userId = data.user_id;
		var schoolId = data.school_id;
		
		console.log('내가 쓴 타임라인 요청');
		console.info('userId = ' + userId);
		console.info('schoolId = ' + schoolId);
		
		if (!userId || !schoolId) {
			console.error('데이터 누락');
			socket.emit('getMyTimeline', {
				'code' : 510
			});
		} else {
			mySqlConnection.query('SELECT * FROM timelines INNER JOIN users ON timelines.timeline_user_id = "' + userId + '" AND timelines.timeline_school_id = ' + schoolId + ' AND timelines.timeline_user_id = users.user_id'
					+ ' LEFT JOIN likes ON timelines.timeline_id = likes.like_timeline_id AND likes.like_user_id = "' + userId
					+ '" LEFT JOIN files ON files.file_parent_id = timelines.timeline_id ORDER BY timelines.timeline_id', function(err, timelineResult) {
				if (err) {
					console.error('내가 쓴 타임라인 요청 에러 = ' + err);
					socket.emit('getMyTimeline', {
						'code' : 511
					});
				} else {
					console.log('내가 쓴 타임라인 요청 성공 ' + JSON.stringify(timelineResult));
					socket.emit('getMyTimeline', {
						'code' : 200,
						'timeline' : timelineResult
					});
				}
			});
		}
	});
	
	
	socket.on('getTimelineComment', function(data) {
		var id = data.id;
		
		console.log('타임라인 댓글 요청');
		console.info('id = ' + id);
		
		if (!id) {
			console.error('데이터 누락');
			socket.emit('getTimelineComment', {
				'code' : 520
			});
		} else {
			mySqlConnection.query('SELECT * FROM comments JOIN users ON comments.comment_timeline_item_id = ' + id + ' AND comments.comment_user_id = users.user_id', function(err, commentResult) {
				if (err) {
					console.error('댓글 요청 에러 = ' + err);
					socket.emit('getTimelineComment', {
						'code' : 521
					});
				} else {
					console.log('댓글 요청 성공');
					socket.emit('getTimelineComment', {
						'code': 200,
						'timelineComment' : commentResult
					});
				}
			});
		}
	});
	
	
	socket.on('insertTimelineComment', function(data) {
		var timelineId = data.timelineItemId;
		var content = data.commentContent;
		var userId = data.user_id;
		var time = new Date();
		
		console.log('타임라인에 댓글달기 ');
		console.log('타임라인에 댓글달기 timelineId = ' + timelineId);
		console.log('타임라인에 댓글달기 content = ' + content);
		console.log('타임라인에 댓글달기 time = ' + time.getTime());
		console.log('타임라인에 댓글달기 userId = ' + userId);
		
		if (!timelineId || !content || !userId) {
			console.error('타임라인에 댓글달기 데이터 누락');
			socket.emit('insertTimelineComment', {
				'code' : 530
			});
		} else {
			var inputData = {
				'comment_timeline_item_id' : timelineId,
				'comment_content' : content,
				'comment_created' : time.getTime(),
				'comment_user_id' : userId
			};
			
			mySqlConnection.query('INSERT INTO comments set ?', inputData, function(err) {
				if (err) {
					console.error('타임라인에 댓글달기 에러 = ' + err);
					socket.emit('insertTimelineComment', {
						'code' : 531
					});
				} else {
					console.log('타임라인에 댓글달기 성공');
					socket.emit('insertTimelineComment', {
						'code' : 200
					});
				}
			});
		}
	});
	

	socket.on('deleteTimeline', function(data) {
		var timelineId = data.timelineItemId;
		var userId = data.user_id;
		
		console.log('타임라인 지우기');
		console.info('timelineId = ' + timelineId);
		console.info('userId = ' + userId);
		
		if (!timelineId || !userId) {
			console.error('데이터 누락');
			socket.emit('deleteTimeline', {
				'code': 540
			});
		} else {
			mySqlConnection.query('DELETE FROM timelines WHERE timeline_user_id = "' + userId + '" AND timeline_id = ' + timelineId + ';', function(err) {
				if (err) {
					console.error('타임라인 지우기 에러 = ' + err);
					socket.emit('deleteTimeline', {
						'code' : 541
					});
				} else {
					mySqlConnection.query('DELETE FROM comments WHERE comment_timeline_item_id = ' + timelineId, function(err) {
						if (err) {
							console.error('타임라인 지우기 에러 = ' + err);
							socket.emit('deleteTimeline', {
								'code' : 542
							});
						} else {
							console.log('타임라인 지우기 성공');
							socket.emit('deleteTimeline', {
								'code' : 200
							});
						}
					});
				}
			});
		}
	});
	
	
	socket.on('updateTimeline', function(data) {
		var timelineData = data.timelineEntity;
		var id = timelineData.id;
		var userId = timelineData.user_id;
		var content = timelineData.contents;
		var schoolId = timelineData.school_id;
		
		console.log('타임라인 업데이트');
		console.info('id = ' + id);
		console.info('userId = ' + userId);
		console.info('content = ' + content);
		console.info('schoolId = ' + schoolId);
		
		if (!id || !userId || !content || !schoolId) {
			console.error('데이터 누락');
			socket.emit('updateTimeline', {
				'code' : 550
			});
		} else {
			var updateData = {
				'timeline_content' : content
			};
			mySqlConnection.query('UPDATE timelines SET ? WHERE timeline_id = ' + id + ' AND timeline_user_id = "' + userId + '"', updateData, function(err) {
				if (err) {
					console.error('타임라인 업데이트 에러 = ' + err);
					socket.emit('updateTimeline', {
						'code' : 551
					});
				} else {
					console.log('타임라인 업데이트 성공');
					mySqlConnection.query('SELECT * FROM timelines JOIN users ON timelines.timeline_user_id = "' + userId + '" AND timelines.timeline_school_id = ' + schoolId + ' AND timelines.timeline_content = "' + content + '"' + ' AND timelines.timeline_user_id = users.user_id LIMIT 1;', function(err, timelineResult) {
						if (err) {
							console.error('타임라인 결과값 확인 에러 = ' + err);
							socket.emit('updateTimeline', {
								'code' : 552
							});
						} else {
							console.log('timelineResult = ' + JSON.stringify(timelineResult[0]));
							socket.emit('updateTimeline', {
								'code' : 200,
								'timeline' : timelineResult[0]
							});
						}
					});
				}
			});
		}
	});
	
	
	socket.on('insertLike', function(data) {
		var timelineItemId = data.timelineItemId;
		var userId = data.user_id;
		
		console.log('좋아요 입력');
		console.info('timelineItemId = ' + timelineItemId);
		console.info('userId = ' + userId);
		
		if (!timelineItemId || !userId) {
			console.error('데이터 누락');
			socket.emit('insertLike', {
				'code' : 560
			});
		} else {
			var inputData = {
				'like_timeline_id' : timelineItemId,
				'like_user_id' : userId
			}
			mySqlConnection.query('INSERT INTO likes SET ?', inputData, function(err) {
				if (err) {
					console.error('좋아요 입력 에러 = ' + err);
					socket.emit('insertLike', {
						'code' : 561
					});
				} else {
					console.log('좋아요 입력 성공');
					mySqlConnection.query('SELECT * FROM likes WHERE like_timeline_id = ' + timelineItemId + ' AND like_user_id = "' + userId + '" LIMIT 1;', function(err, likeResult) {
						if (err) {
							console.error('좋아요 입력 쿼리 에러 = ' + err);
							socket.emit('insertLike', {
								'code' : 562
							});
						} else {
							console.info('likeResult = ' + likeResult[0]);
							socket.emit('insertLike', {
								'code' : 200,
								'like' : likeResult[0]
							});
						}
					});
				}
			});
		}
	});
	
	
	socket.on('deleteLike', function(data) {
		var id = data.id;
		var timelineId = data.timeline_id;
		var userId = data.user_id;
		
		console.log('좋아요 지우기');
		console.info('id = ' + id);
		console.info('timelineId = ' + timelineId);
		console.info('userId = ' + userId);
		
		if (!id || !timelineId || !userId) {
			console.error('데이터 누락');
			socket.emit('deleteLike', {
				'code' : 570
			});
		} else {
			mySqlConnection.query('DELETE FROM likes WHERE like_id = ' + id + ' AND like_timeline_id = ' + timelineId + ' AND like_user_id = "' + userId + '"', function(err) {
				if (err) {
					console.error('좋아요 지우기 에러 = ' + err);
					socket.emit('deleteLike', {
						'code' : 571
					});
				} else {
					console.log('좋아요 지우기 성공');
					socket.emit('deleteLike', {
						'code' : 200
					});
				}
			});
		}
	});
	
	
	socket.on('deleteComment', function(data) {
		var id = data.id;
		var timelineItemId = data.timelineItemId;
		var userId = data.user_id;
		
		console.log('댓글 지우기');
		console.info('id = ' + id);
		console.info('timelineItemId = ' + timelineItemId);
		console.info('userId = ' + userId);
		
		if (!id || !timelineItemId || !userId) {
			console.error('데이터 누락');
			socket.emit('deleteComment', {
				'code' : 580
			});
		} else {
			mySqlConnection.query('DELETE FROM comments WHERE comment_id = ' + id + ' AND comment_timeline_item_id = ' + timelineItemId + ' AND comment_user_id = "' + userId + '"', function(err) {
				if (err) {
					console.error('댓글 지우기 에러 = ' + err);
					socket.emit('deleteComment', {
						'code' : 581
					});
				} else {
					console.log('댓글 지우기 성공');
					socket.emit('deleteComment', {
						'code' : 200
					});
				}
			});
		}
	});
	
	socket.on('insertProduct', function(data) {
		var user_id = data.user_id;
		var product_name = data.product_name;
		var content = data.contents;
		var created = data.created;
		var condition = data.condition;
		var school_id = data.school_id;
		var sex = data.sex;
		var size = data.size;
		var category = data.category;
		
		console.log('제품 입력 ');
		console.log('제품 입력 user_id = ' + user_id);
		console.log('제품 입력 product_name = ' + product_name);
		console.log('제품 입력 content = ' + content);
		console.log('제품 입력 created = ' + created);
		console.log('제품 입력 condition = ' + condition);
		console.log('제품 입력 school_id = ' + school_id);
		console.log('제품 입력 sex = ' + sex);
		console.log('제품 입력 size = ' + size);
		console.log('제품 입력 category = ' + category);
		
		if (!user_id || !product_name || !created || !condition || !school_id || !sex || !size || !category) {
			console.error('제품 입력 데이터 누락');
			socket.emit('insertProduct', {
				'code' : 590
			});
		} else {
			var productInputData = {
				'product_category' : category,
				'product_sex' : sex,
				'product_condition' : condition,
				'product_created' : created,
				'product_content' : content,
				'product_name' : product_name,
				'product_user_id' : user_id,
				'product_school_id' : school_id,
				'product_size' : size
			}
			
			
			mySqlConnection.query('INSERT INTO products SET ?', productInputData, function(err) {
				if (err) {
					console.error('제품 입력 에러 = ' + err);
					socket.emit('insertProduct', {
						'code' : 591
					});
					return;
				} else {
					mySqlConnection.query('SELECT * FROM products WHERE product_user_id = "' + user_id + '" AND product_created = ' + created + ' AND product_school_id = ' + school_id + ';', function(err, result) {
						if (err) {
							console.error('제품 입력 쿼리 에러 ' + err);
							socket.emit('insertProduct', {
								'code' : 592
							});
						} else {
							mySqlConnection.query('UPDATE schools set school_point = (school_point + 10) WHERE school_id = ' + school_id, function(err) {
								if (err) {
									console.error('제품 입력 후 쿼리 에러 ' + err);
									socket.emit('insertProduct', {
										'code' : 593
									});
								} else {
									console.log('제품 입력 성공');
									socket.emit('insertProduct', {
										'code' : 200,
										'product' : result[0]
									});
								}
							});
						}
					});
				}
			});
		}
	});
	
	
	
	socket.on('getMyProduct', function(data) {
		var donatorId = data.transaction_donator_id;
		var receiverId = data.transaction_receiver_id;
		
		console.log('내 제품 받아오기');
		console.info('donatorId = ' + donatorId);
		console.info('receiverId = ' + receiverId);
		
		if (!donatorId || !receiverId) {
			console.error('데이터 누락');
			socket.emit('getMyProduct', {
				'code': 600
			});
		} else {
			mySqlConnection.query('SELECT * FROM files RIGHT OUTER JOIN (SELECT * FROM products JOIN transactions ON (products.product_id = transactions.transaction_product_id) AND (transactions.transaction_receiver_id = ' + receiverId + ' OR transactions.transaction_donator_id = ' + donatorId + '))' +
					'as products ON products.product_id = files.file_parent_id ORDER BY products.product_id;', function(err, productResult) {
				if (err) {
					console.error('내 제품 요청 에러 = ' + err);
					socket.emit('getMyProduct', {
						'code' : 601
					});
				} else {
					console.log('내 제품 결과 = ' + JSON.stringify(productResult));
					console.log('내 제품 요청 성공');
					socket.emit('getMyProduct', {
						'code' : 200,
						'product' : productResult
					});
				}
			});
		}
	});
	
	
	
	// productEntity{school_id, sex, category, size ,condition, user_id, contents, created}
	// transactionEntity {status}
	// uri [imageUri]
	socket.on('updateProduct', function(data) {
		// 제품 등록
		var productData = data.productEntity;
		var user_id = productData.user_id;
		var product_name = productData.product_name;
		var content = productData.contents;
		var created = productData.created;
		var condition = productData.condition;
		var school_id = productData.school_id;
		var sex = productData.sex;
		var size = productData.size;
		var category = productData.category;
		
		var isDeleteFile = data.isDeleteFile;
		
		
		console.log('제품 업데이트 ');
		console.log('제품 업데이트 user_id = ' + user_id);
		console.log('제품 업데이트 product_name = ' + product_name);
		console.log('제품 업데이트 content = ' + content);
		console.log('제품 업데이트 created = ' + created);
		console.log('제품 업데이트 condition = ' + condition);
		console.log('제품 업데이트 school_id = ' + school_id);
		console.log('제품 업데이트 sex = ' + sex);
		console.log('제품 업데이트 size = ' + size);
		console.log('제품 업데이트 category = ' + category);
		
		if (!user_id || !product_name || !content || !created || !condition || !school_id || !sex || !size || !category) {
			console.error('제품 업데이트 데이터 누락');
			socket.emit('updateProduct', {
				'code' : 610
			});
		} else {
			var productInputData = {
				'product_category' : category,
				'product_sex' : sex,
				'product_condition' : condition,
				'product_created' : created,
				'product_content' : content,
				'product_name' : product_name,
				'product_user_id' : user_id,
				'product_school_id' : school_id,
				'product_size' : size
			};
			
			
			mySqlConnection.query('UPDATE products set ? WHERE product_name = "' + product_name + '" AND product_user_id = "' + user_id + '" AND product_school_id = ' + school_id, productInputData, function(err) {
				if (err) {
					console.error('제품 업데이트 에러 = ' + err);
					socket.emit('updateProduct', {
						'code' : 611
					});
				} else {
					mySqlConnection.query('SELECT * FROM products WHERE product_name = "' + product_name + '" AND product_user_id = "' + user_id + '" AND product_school_id = ' + school_id, function(err, productResult) {
						if (err) {
							console.error('제품 업데이트 에러 = ' + err);
							socket.emit('updateProduct', {
								'code' : 612
							});
						} else {
							console.log('productResult = ' + JSON.stringify(productResult));
							
							if (isDeleteFile) {
								mySqlConnection.query('DELETE FROM files WHERE file_parent_id = ' + productResult[0].product_id, function(err) {
									if (err) {
										console.error('제품 업데이트 에러 = ' + err);
										socket.emit('updateProduct', {
											'code' : 613
										});
									} else {
										console.log('제품 업데이트 성공');
										socket.emit('updateProduct', {
											'code' : 200,
											'product' : productResult[0]
										});
									}
								});
							} else {
								console.log('제품 업데이트 성공');
								socket.emit('updateProduct', {
									'code' : 200,
									'product' : productResult[0]
								});
							}
						}
					});
				}
			});
		}
	});
	
	
	socket.on('updateTransactionStatus', function(data) {
		var status = data.status;
		var transactionJson = data.transaction;
		var productId = transactionJson.product_id;
		var receiverId = transactionJson.receiver_id;
		
		console.log('트랜잭션 상태 업데이트');
		console.info('status = ' + status);
		console.info('transactionJson = ' + transactionJson);
		console.info('productId = ' + productId);
		console.info('receiverId = ' + receiverId);
		
		if (!status || !transactionJson || !productId || !receiverId) {
			console.error('데이터 누락');
			socket.emit('updateTransactionStatus', {
				'code' : 620
			});
		} else {
			var inputData = {
				'transaction_status' : status,
				'transaction_receiver_id' : receiverId
			};
			
			mySqlConnection.query('UPDATE transactions SET ? WHERE transaction_product_id = ' + productId, inputData, function(err) {
				if (err) {
					console.error('트랜잭션 DB 업데이트 에러 = ' + err);
					socket.emit('updateTransactionStatus', {
						'code' : 621
					});
				} else {
					mySqlConnection.query('SELECT * FROM transactions WHERE transaction_product_id = ' + productId, function(err, transactionResult) {
						if (err) {
							console.error('트랜잭션 DB 쿼리 에러 = ' + err);
							socket.emit('updateTransactionStatus', {
								'code' : 622
							});
						} else {
							console.log('트랜잭션 상태 업데이트 성공');
							socket.emit('updateTransactionStatus', {
								'code' : 200,
								'transaction' : transactionResult[0]
							});
						}
					});
				}
			});
		}
	});
	
	
	
	socket.on('deleteFile', function(data) {
		var files = data.files;
		console.log('파일 지우기');
		if (!files) { 
			console.error('데이터누락');
			socket.emit('delteFile', {
				'code' : 630
			});
		} else {
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				var file_id = file.file_id;
				console.info('file_id = ' + file_id);
				
				if (!file_id) {
					console.error('데이터 누락');
					socket.emit('deleteFile', {
						'code' : 630
					});
				} else {
					fs.unlink('./images/' + file_id, function(err) {
						if (err) {
							console.error('파일 지우기 실패 = ' + err);
							socket.emit('deleteFile', {
								'code' : 630
							});
						}
						mySqlConnection.query('DELETE FROM files WHERE file_id = ' + file_id, function(err) {
							if (err) {
								console.error('파일 DB 지우기 실패 = ' + err);
								socket.emit('deleteFile', {
									'code' : 631
								});
							} else {
								console.log('파일 지우기 성공');
								socket.emit('deleteFile', {
									'code' : 200
								});
							}
						});
					});
				}
			}
		}
	});
	
	
	socket.on('insertTransaction', function(data) {
		var status = data.status;
		var donator_id = data.donator_id;
		var receiver_id = data.receiver_id;
		var product_id = data.product_id;
		var product_name = data.product_name;
		
		console.log('트랜잭션 입력');
		console.info('트랜잭션 입력 status = ' + status);
		console.info('트랜잭션 입력 donator_id = ' + donator_id);
		console.info('트랜잭션 입력 receiver_id = ' + receiver_id);
		console.info('트랜잭션 입력 product_id = ' + product_id);
		console.info('트랜잭션 입력 product_name = ' + product_name);
		
		if (!status || !donator_id || !product_id || !product_name) {
			console.error('트랜잭션 입력 데이터 누락');
		} else {
			var transactionInputData = {
					'transaction_status' : status,
					'transaction_donator_id' : donator_id,
					'transaction_receiver_id' : receiver_id,
					'transaction_product_id' : product_id,
					'transaction_product_name' : product_name,
					'transaction_modified' : Date.now()
				};
				
			mySqlConnection.query('INSERT INTO transactions SET ?', transactionInputData, function(err) {
				if (err) {
					console.error('트랜잭션 입력 에러 = ' + err);
				} else {
					console.log('트랜잭션 입력 성공');
				}
			});
		}
	});
	
	
	socket.on('deleteProduct', function(data) {
		var productId = data.productId;
		
		console.log('제품 삭제');
		console.info('productId = ' + productId);
		
		if (!productId) {
			console.error('데이터 누락');
			socket.emit('deleteProduct', {
				'code' : 650
			});
		} else {
			mySqlConnection.query('DELETE products, transactions FROM products, transactions WHERE products.product_id = ' + productId + ' AND products.product_id = transactions.transaction_product_id', function(err) {
				if (err) {
					console.error('제품 삭제 에러 = ' + err);
					socket.emit('deleteProduct', {
						'code' : 651
					});
				} else {
					console.log('제품 삭제 성공');
					socket.emit('deleteProduct', {
						'code' : 200
					});
				}
			});
		}
	});
	
	
	socket.on('deleteUser', function(data) {
		var userId = data.user_id;
		
		console.log('회원 탈퇴');
		console.log('회원 탈퇴 userId = ' + userId);
		
		if (!userId) {
			console.log('유저 회원 탈퇴 데이터 누락');
			socket.emit('deleteUser', {
				'code' : 660
			});
		} else {
			mySqlConnection.beginTransaction(function(err) {
				if (err) {
					console.log('회원 탈퇴 에러 = ' + err);
					socket.emit('deleteUser', {
						'code' : 667
					});
					mySqlConnection.rollback();
				} else {
					mySqlConnection.query('DELETE FROM users WHERE user_id = "' + userId + '"', function(err) {
						if (err) {
							console.log('회원 탈퇴 에러 = ' + err);
							socket.emit('deleteUser', {
								'code' : 661
							});
							mySqlConnection.rollback();
						} else {
							mySqlConnection.query('DELETE FROM transactions WHERE transaction_donator_id = "' + userId + '"', function(err) {
								if (err) {
									console.log('회원 탈퇴 에러 = ' + err);
									socket.emit('deleteUser', {
										'code' : 662
									});
									mySqlConnection.rollback();
								} else {
									mySqlConnection.query('DELETE FROM timelines WHERE timeline_user_id = "' + userId + '"', function(err) {
										if (err) {
											console.log('회원 탈퇴 에러 = ' + err);
											socket.emit('deleteUser', {
												'code' : 663
											});
											mySqlConnection.rollback();
										} else {
											mySqlConnection.query('DELETE FROM products WHERE product_user_id = "' + userId + '"', function(err) {
												if (err) {
													console.log('회원 탈퇴 에러 = ' + err);
													socket.emit('deleteUser', {
														'code' : 664
													});
													mySqlConnection.rollback();
												} else {
													mySqlConnection.query('DELETE FROM comments WHERE comment_user_id = "' + userId + '"', function(err) {
														if (err) {
															console.log('회원 탈퇴 에러 = ' + err);
															socket.emit('deleteUser', {
																'code' : 665
															});
															mySqlConnection.rollback();
														} else {
															mySqlConnection.query('DELETE FROM likes WHERE like_user_id = "' + userId + '"', function(err) {
																if (err) {
																	console.log('회원 탈퇴 에러 = ' + err);
																	socket.emit('deleteUser', {
																		'code' : 666
																	});
																	mySqlConnection.rollback();
																} else {
																	console.log('회원 탈퇴 성공');
																	socket.emit('deleteUser', {
																		'code' : 200
																	});
																	mySqlConnection.commit(function(err) {
																		if (err){
																			console.log('회원 탈퇴 에러 = ' + err);
																			socket.emit('deleteUser', {
																				'code' : 667
																			});
																			mySqlConnection.rollback();
																		}
																	});
																}
															});
														}
													});
												}
											});
										}
									});
								}
							});
						}
					});
				}
			});
		}
	});
});