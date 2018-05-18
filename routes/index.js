var express = require('express');
var router = express.Router();
const Sequelize = require('sequelize');

// const sequelize = new Sequelize('database', 'username', 'password', {
//   host: 'localhost',
//   dialect: 'sqlite',
//   operatorsAliases: false,

//   pool: {
//     max: 5,
//     min: 0,
//     acquire: 30000,
//     idle: 10000
//   },

//   // SQLite only
//   storage: 'data.db'
// });


const sequelize = new Sequelize(process.env.MYSQLCONNSTR_DBSTRING, {
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});


sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully with database.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

const Beneficiary = sequelize.define('beneficiary', {
  name: {
    type: Sequelize.STRING
  },
  tokenId: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
});

Beneficiary.sync();


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});

/*
[
	{
		"name":"Shoaib Ahmed",
		"tokenId":"QWERTY123"
	}
]
*/
router.post('/load-data', function (req, res, next) {
  var benData = req.body;
  var responseMessage = {status: false, messsage: ''}
  for (var i in benData) {
    var beneficiary = benData[i];
    beneficiary.tokenId = beneficiary.tokenId.replace(' ', '').toUpperCase()
    Beneficiary.create(beneficiary).then(op => {
      responseMessage.status = true
      responseMessage.messsage = 'data stored'
      res.end(JSON.stringify(responseMessage));
    }).catch(err => {
      console.log(err)
      res.status(406)
      responseMessage.status = false
      responseMessage.messsage = err.name
      res.end(JSON.stringify(responseMessage));
    });
  }
  
});

router.get('/all-data', function (req, res, next) {
  Beneficiary.findAll().then(beneficiaries => {
    res.end(JSON.stringify(beneficiaries));
  });
});

router.put('/update-status', function (req, res, next) {
  var tokenId = req.query.tokenId;
  var responseMessage = {status:false , message: ''}
  Beneficiary.findById(tokenId).then(beneficiary => {
    if (beneficiary == null) {
      res.status(404);
      responseMessage.status = false;
      responseMessage.message = 'Token Not Found'
      res.end(JSON.stringify(responseMessage));
    }
    if (beneficiary.status) {
      res.status(406);
      responseMessage.status = false;
      responseMessage.message = 'Token Already Tagged'
      res.end(JSON.stringify(responseMessage));
    }
    Beneficiary.update({
        status: true
      }, {
        where: {
          'tokenId': tokenId
        }
      })
      .then(() => {
        responseMessage.status = true;
        responseMessage.message = 'Token Updated'
        res.end(JSON.stringify(responseMessage));
      });
  });
});

router.delete('/flush-data', function (req, res, next) {
  Beneficiary.destroy({
    truncate: true
  }).then(() => {
    res.end('Cleared all data')
  });
});

module.exports = router;
