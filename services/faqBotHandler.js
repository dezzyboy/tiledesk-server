
const botEvent = require('../event/botEvent');
var Faq = require('../models/faq');
var messageService = require('../services/messageService');
var MessageConstants = require("../models/messageConstants");
var winston = require('../config/winston');
var faqBotSupport = require('../services/faqBotSupport');

class FaqBotHandler {
 
    listen() {

        //modify to async
        botEvent.on('bot.message.received.notify.internal', function(message) {
                           

           var botName = message.request.department.bot.name;
           winston.debug("botName " + botName);

           var botId = message.request.department.bot._id;
           winston.debug("botId " + botId);

           winston.debug("message.text "+ message.text);
         

           var query = { "id_project": message.id_project };

           query.$text = {"$search": message.text};
            
            Faq.find(query,  {score: { $meta: "textScore" } })  
            .sort( { score: { $meta: "textScore" } } ) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score
            .lean().               
             exec(function (err, faqs) {
                winston.debug("faqs", faqs);              

               let sender = 'bot_' + botId;
               winston.debug("sender", sender);          
               

                var answerObj;
                if (faqs && faqs.length>0 && faqs[0].answer) {
                    answerObj = faqs[0];                

                    // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes) {
                    messageService.send(sender, botName, message.recipient, answerObj.answer, 
                        message.id_project, sender).then(function(savedMessage){

                            winston.info("faqbot message sending ", savedMessage.toObject());  
                    });
    
                }
                
              

                faqBotSupport.getBotMessage(answerObj, message.id_project, message.request.department._id, message.language, 1.2).then(function(botAns){
                    winston.info("faqbot message botAns ", botAns);  

                    let attributes = {bot_reponse_template: botAns.template};
                    messageService.send(sender, botName, message.recipient, botAns.text, 
                        message.id_project, sender, attributes).then(function(savedMessage){
                            winston.info("faqbot message botAns " ,savedMessage.toObject());  
                    });

                });
                





             });

            // se messaggio per faqBot
            // sollevo evento e webhook message.create.forbot
            // serco su mongo o servizio gianluca
            // invio messaggio su chat21
         
        });
    }







    
   

    
}

var faqBotHandler = new FaqBotHandler();
module.exports = faqBotHandler;