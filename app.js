var builder = require("botbuilder");
var restify =  require("restify");
var crypto = require("crypto");
//Bot modules
var BotSystem = require("./bot_core/system.js");
var BotMenu = require("./bot_core/menu.js");

//=======================================
// Bot Setup
//=======================================
//Setup Restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function(){
   console.log('%s listening...', server.name)
});

//Create chat bot
var connector = new builder.ChatConnector({
   appId: '',
   appPassword: ''
});

var bot = new builder.UniversalBot(connector, {
    storage: new builder.MemoryBotStorage()
});

server.post('/api/messages', connector.listen());

//init bot system module
var system = new BotSystem();
system.connectToDB();

//init bot menu module
var menu = new BotMenu();
menu.init(bot, builder)


//=======================================
// Bot Dialogs
//=======================================

var intents = new builder.IntentDialog();
bot.dialog('/', intents)

//display current version
intents.matches(/^version/i, builder.DialogAction.send('Bot version 1.0.0'))
//default dialog
intents.onDefault(function (session){
   if(session.userData.auth){
      session.beginDialog('/membersMenu');      
   } else {
      session.beginDialog('/guestMenu');
   }
});

bot.dialog('/holidays', [
   function(session){
      session.send("New Year's Day, Jan 1");
      session.send("Good Friday, Apr 14");
      session.send("Idi Fitri, June 04");
      session.send("Thankgiving Day, Oct 09");
      session.send("Chrsitmas Day, Dec 25");

      session.endDialog();
   }
]);


bot.dialog('/logout', [
   function(session){
      session.userData.employee_id  = undefined;
      session.userData.username  = undefined;
      session.userData.password  = undefined;
      session.userData.sickDays  = undefined;
      session.userData.auth  = undefined;
      session.userData.admin  = undefined;

      session.replaceDialog('/login');
   }
]);

bot.dialog('/login', [
   function(session, args, next){
    //ask for username
    if(!session.userData.username){
        builder.Prompts.text(session, "Hi! What's your username?");
      } else {
         next();
      }
   },

   function(session, results, next){
      //save username
      if(!session.userData.username && results.response){
         session.userData.username = results.response;
        }
      //ask for password
        if(!session.userData.password){
         builder.Prompts.text(session, "Enter your password");
         } else {
            next();
         }
     },

     function(session, results, next){
        //save and encrypt password (md5)
        if(!session.userData.password && results.response){
           session.userData.password = crypto.createHash('md5').update(results.response).digest('hex');
        }
        session.send('One Second please...I will check if data provided by you is correct');
        //system.authentication(session);
        system.authenticationByPass(session);
      }
]);


bot.dialog('/new_employee', [
   function(session){
    //check if current employee is an admin
    if(session.userData.admin){
        builder.Prompts.text(session, "Enter new employee username?");
      } else {
        session.replaceDialog('/admin_auth')
      }
   },
   function(session, results, next){
      session.userData.new_username= results.response;
      builder.Prompts.text(session, "Enter new employee password");
   },
   function(session, results){
      //enrypt password
      session.userData.new_employee_password = crypto.createHash('md5').update(results.response).digest('hex'); 
      //save new employee to DB
      system.newEmployee(session);
   }
]);

bot.dialog('/admin_auth', [

   function(session){
      builder.Prompts.text(session, "Enter admin password");
   },
   function (session, results){
      //encrypt password
      var adminPassword = crypto.createHash('md5').update(results.response).digest('hex');
      //admin authentication
      var auth = system.adminAuth(adminPassword);
      if(auth){
         session.userData.admin = true;
         session.replaceDialog('/new_employee');         
      } else {
         session.endDialog ('Sorry, your password is wrong.');
      }
   }
]);


bot.dialog('/sick_day', [
   function(session){
    //build a HeroCard
    var msg = new builder.Message(session)
    .attachmentLayout(builder.AttachmentLayout.list)
    .attachments([
       new builder.HeroCard(session)
       .title("Sick day request")
       .subtitle("Do you want to request a sick day?")
       .images([
          builder.CardImage.create(session,"C:/Dev/microsoft_bot/HR_BOT/images.jpg")
       ])
       .buttons([
          builder.CardAction.postBack(session, "yes", "Yes"),
          builder.CardAction.postBack(session, "no", "No")
       ])
    ]);
    builder.Prompts.choice(session,msg, "yes|no");
   },
   function(session, results, next) {
      if(results.response.entity === "yes"){
         //display how many sick days left
         session.send("I am sorry to hear you are sick today. You have %s sick days available.", session.userData.sickDays);
         //if employee has a sick day
         if(session.userData.sickDays){
            //system.sickDayRequest(session); ....ENABLE TO UPDATE DATABASE WITH SICK DAYS LEFT
         } else {
            session.endDialog();
         }
      } else {
         //if answer is no
         session.send("See you in office!");
         next();
      }
   },
   function(session){
      session.endDialog();
   }
]);