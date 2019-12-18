var mysql = require('../node_modules/mysql');
//admin password
var adminPassword = "81dc9bdb52d04dc20036dbd8313ed055";
//mysql config
var mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hr'
}
//connection to DB
var connection;
//export functions
module.exports = function(){
    this.connectToDB = connectToDB;
    //this.authentication = authentication;
    this.authenticationByPass = authenticationByPass;
    this.adminAuth = adminAuth;
    this.newEmployee = newEmployee;
    this.sickDayRequest = sickDayRequest;
}

connectToDB = function() {
    connection = mysql.createConnection(mysqlConfig);
    connection.connect(function(err){
        //the server is either down or restarting
        if(err) {
            //we introduce a delay before attempting to reconnect
            //to avoid a hot lopp, and to allow our node script to
            //process asynchronous requests in the meantime.
            setTimeout(connectToDB, 2000)
        }
    });
    connection.on('error', function(err) {
        systemMessage('db server: ' + err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST'){
            connectToDB();
        } else {
            throw err;
        }
    })
}

//Display log message in console
systemMessage = function (message){
    console.log('=====================================================');
    console.log(message);
    console.log('=====================================================');
}

//employees authentication
authentication = function (session){
    //find employee
    connection.query('SELECT * FROM employees WHERE username = ? AND password = ? LIMIT 1', [
        session.userData.username, session.userData.password
    ],
    function(err, rows, fields){
        if(!err){
            if(rows.length){
              //if employee is found, save his info to userData
              session.userData.auth = true;
              session.userData.employee_id = rows[0].id;
              session.userData.sickDays = rows[0].sick_days;
              //display welcome message
              session.send("Welcome %s %s! How can I help you ?", rows[0].first_name, rows[0].last_name);
              session.endDialog();
            } else {
                //wrong username and/or password
               session.send("Sorry...I don't find your record, please try again!");
               session.endDialog();
            }
        } else {
            session.send("Error getting data from DB %s", err);
        }
    }
    )
};

//employees authentication
authenticationByPass = function (session){
              session.userData.auth = true;
              session.userData.employee_id = 2;
              session.userData.sickDays = 20;
              //display welcome message
              session.send("Welcome %s %s! How can I help you ?", 'Augustine', 'Okore');
              session.endDialog();
            
    };

adminAuth = function(password){
    if(adminPassword === password){
        return true;
    } else {
        return false;  
    }
};

//create a new employee
newEmployee =  function(session){
    //check if username is not registered yet
    connection.query('SELECT id FROM employees WHERE username = ? LIMIT 1', [
        session.userData.username]),
    function(err, rows, fields){
        if(!err){
            if(rows.length){
               //username is not available
               session.send("Username is already registered")
            } else {
                //create employee object
                var newEmployee = { username: session.userData.new_username, password: session.userData.new_employee_password}
                //save new employee to DB
                connection.query("INSERT INTO employees SET ?", newEmployee, function(err, res) {
                    if(err) {
                        session.send("Error: %s", err);
                    }
                    session.endDialog("New employee ID: %s", res.insertId);
                });        
            }
        } else {
            session.send("Error getting data from DB %s", err)
        }
    }
    
};

//sick Day Request
sickDayRequest =  function(session){
     //check if username is not registered yet
     connection.query('SELECT sick_days FROM employees WHERE username = ? LIMIT 1', [
        session.userData.username]),
    function(err, rows, fields){
        if(!err){
            if(rows.length){
               if(rows[0].sick_days){
                   //update sick days left value
                   var sickDaysLeft = rows[0].sick_days - 1;
                    session.userData.sickDays = sickDaysLeft;
                    //save new value to DB
                    connection.query('UPDATE employees SET sick_days = ? WHERE username = ?',
                    [sickDaysLeft, session.userData.username],
                        function(err, result) {
                           if(err) {
                             console.log("ERROR: " + err); 
                           }
                        });
                        //save sick day to DB
                       saveSickDay(session);
               }else{
                   //if no sick days left
                   session.send("You don't have any sick days available");
               }
            } else {
                //employee is not found
                session.send("Sorry...I didn't find your record. Please try again.")
                session.endDialog();
            }

        } else {            
            session.send("Error getting data from DB %s", err);
        }
    }
};

//save sick day to DB
saveSickDay = function(session){
    //create a new sickday object
    var newSickDay = {emloyee_id: session.userData.enployee_id, sick_day: new Date()};
    //save to DB
    connection.query('INSERT INTO employees_sick_days SET ?', newSickDay, function (err, res){
      if(err){
           console.log("Error: " + err);
      }
      session.send("Sick day saved");
      session.endDialog();
    });
}