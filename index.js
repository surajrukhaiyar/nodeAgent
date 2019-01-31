var Client = require('node-rest-client').Client;
uuidv1 = require('uuid/v1');
var sleep = require('sleep');
var client = new Client();
var fs = require('fs');
const os = require('os');
var mailer = require('nodemailer');

var LineByLineReader = require('line-by-line');

var wfApp = {};
var uuid = "8a828eab689810d80168981139880000";
var OldLine = 0;
var retryTime = 0;
var retryTimeOut = 60*30; //3o min

var loggerDir = 'D:/';
var loggerFile = "FusionLogger";
var runtimeLog = os.homedir() + '\\AppData\\Local\\Inventys\\Fusion\\5.5.87.161\\logs\\' + 'Dashboard.log';

//rename Old file and create a new file
fs.rename(loggerDir + loggerFile + '.txt', loggerDir + loggerFile +  new Date().toLocaleDateString() + '.txt', function(err) {
    if ( err ) console.log('ERROR: ' + err);
    console.log("old file renamed to " + loggerDir + loggerFile +  new Date().toLocaleDateString() + '.txt');
});
fs.writeFile(loggerDir + loggerFile + '.txt', '', function(err, data){
    if (err) console.log(err);
    console.log("FusionLogger file created");
    readLine(0, 0);
});

function readLine(SLine, CLine){
    lr = new LineByLineReader('D:\\FusionLogger.txt');
    lr.on('error', function (err) {
        console.log(err);
    });

    lr.on('line', function (line) {
        if(SLine<=CLine){CLine++;
        lr.pause();
        console.log("line reader paused-------------");
        let lineArg = line.split(",");
        if(lineArg[3] == "Start"){ 
            wfApp= {};
            wfApp.dateTime = lineArg[0];
            wfApp.user = lineArg[1];
            wfApp.userSystem = lineArg[2];
            wfApp.pName = lineArg[4];
            wfApp.status = "Started"
            wfApp.transactions = [];
            for(i=5; i<lineArg.length; i++){
            wfApp.transactions.push({"tName": lineArg[i]})
            }
        PostCode(wfApp, "http://localhost:9093/logger/add", "app");
        }

        //Update wf
        if(lineArg[3]!="Start" && lineArg[3]!="Completed"){
            wfTransaction = {}; 
            wfTransaction.tName = lineArg[3];
            wfTransaction.dateTime = lineArg[0];
            wfTransaction.transactionId = uuid;
            wfTransaction.tStatus = lineArg[4];
            wfTransaction.inputData = [];
            for(j=5; j<lineArg.length; j++){
                wfTransaction.inputData.push(
                {
                    "varName": lineArg[j],
                    "varValue": lineArg[++j]
                });
            }
            PostCode(wfTransaction, "http://localhost:9093/logger/updateApp", "wf");
        }

        //Application Completed
        if(lineArg[3] == "Completed"){
            wfApp.processId = uuid;
            wfApp.status = "Completed";
            PostCode(wfApp, "http://localhost:9093/logger/appStatus");
            uuid="";
        } 
    }else{
        CLine++;
    } 
    });

    lr.on('end', function () {
        console.log("current line"+ CLine + "Retry time :"+ retryTime);
        if(CLine === undefined || OldLine == CLine){
            retryTime += 5;
        }else{
            retryTime=0;
        }
        OldLine = CLine;
        sleep.sleep(5);
        if(retryTime> retryTimeOut){
            triggerMail(runtimeLog)
        }else{
            readLine(CLine, 0);
        }
    });
}

function PostCode(post_data, postUrl, elm) {
  var args = {
    data: post_data,
    headers: { "Content-Type": "application/json" }
  };
  client.post(postUrl , args, function (data, response) {
    if(Buffer.isBuffer(data)){
        data = data.toString('utf8');
    }if(elm=="app"){
        uuid = data;
    }
    lr.resume();
    console.log("lr resumed-----------------" + JSON.stringify(data))
    return data;
  }).on('error', function (err) {
    console.log('something went wrong on the request', err.request.options);
  });
}

function triggerMail(runtimeLog){
    var transporter = mailer.createTransport({
    service: 'gmail',
    auth: {
            user: 'tgblindent@gmail.com',
            pass: 'inventys123'
        }
    });
    transporter.sendMail({       
          sender: 'tgblindent@gmail.com',
          to: 'tgblindent@gmail.com',
          subject: 'Fusion error log....',
          html: "<b>" + 'Fusion and Logger stoped PFA log' + "</b>", 
          attachments: [{
              path:runtimeLog
            }]
      }), function(err, success) {
          if (err) {
              console.log("Error in sending mail");
          }if(success){
              console.log("Mail sent")
          }
      }
  }