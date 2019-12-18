module.exports = function() {
    this.init = init;
}

init =  function(bot, builder){
   //menu for not authorized members
   bot.dialog('/guestMenu', [
       function(session) {
           builder.Prompts.choice(session, 'Choose an option:', 'Login|Display holidays|Quit');
       },

       function (session, results){
          switch (results.response.index){
              case 0:
                session.beginDialog('/logout');
                break;
              case 1:
                session.beginDialog('/holidays');
                break;
              default:
                session.endDialog();
                break;     
          } 
       },

       function(session){
           //Reload menu
           if(session.userData.auth){
               session.replaceDialog('/membersMenu')
           } else {
            session.replaceDialog('/guestMenu') 
           }
       }
   ]);

   //Member's menu
   bot.dialog('/membersMenu', [
       function(session){
        builder.Prompts.choice(session, 'Choose an option:', 'New employee|Sick day|Logout|Quit');
       },

       function (session, results){
        switch (results.response.index){
            case 0:
              session.beginDialog('/new_employee');
              break;
            case 1:
              session.beginDialog('/sick_day');
              break;
            case 2:
              session.beginDialog('/logout');
              break;
            default:
              session.endDialog();
              break;     
        } 
     },

        function(session){
            //Reload menu
            if(session.userData.auth){
                session.replaceDialog('/membersMenu')
            } else {
            session.replaceDialog('/guestMenu') 
            }
        }
   ]);
}