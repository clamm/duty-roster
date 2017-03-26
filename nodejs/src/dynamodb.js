var AWS = require('aws-sdk');
AWS.config.update({
    region: 'eu-west-1'
});

var docClient = new AWS.DynamoDB.DocumentClient();


exports.createItem = function (params, callback) {
    // var params = {
    //   'TableName': MyLambdaFunction.TABLE_NAME,
    //   'Item': {
    //     'people': ['Raid', 'Dmytry'],
    //     'userId': userId
    //   }
    // };

    docClient.put(params, function (err) {
        if (err) {
            console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            // console.log('Added item');
            callback();
        }
    });
};

exports.readItem = function (params, callback) {
    // var params = {
    //  TableName: 'yesno',
    //  Key:{ 'id': '0'  }
    // };

    docClient.get(params, function (err, data) {
        if (err) {
            console.error('Unable to read item. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            console.log('GetItem succeeded:', JSON.stringify(data, null, 2));
            callback(data.Item);
        }
    });
};

exports.deleteItem = function (params, callback) {
    // var params = {
    //  'TableName': 'table name',
    //  'Key': {'keyName': keyValue}
    // };

    // for (var key in params['Key']) {
    //   var keyValue = params['Key'][key];
    // }
    // console.log('Delete item with key ' + keyValue + ' from table ' + params['TableName']);
    docClient.delete(params, function (err) {
        if (err) {
            console.error('Unable to delete item. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            // console.log('DeleteItem succeeded.');
            callback();
        }
    });
};
