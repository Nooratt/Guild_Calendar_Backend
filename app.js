const https = require('https');
const dotenv = require('dotenv');
const express = require("express");
var bodyParser = require('body-parser');
const qs = require("qs");
var cors = require('cors')

const Event = require('./Event.js');
const guild_ids = require('./guildIds.json');
const corsOptions = {
  origin: '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
dotenv.config();

const PORT = process.env.PORT || 3001;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(cors(corsOptions));

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.get("/ping", (req, res) => {
  res.json({'ping': 'ping'})
});

app.post("/events", (req, res) => {
  var chosenStartOfTimeFrame = req.body.startDateTimeFrame;
  var chosenEndOfTimeFrame = req.body.endDateTimeFrame;
  var guildNames = req.body.guildNames;
  getAllEvents(chosenStartOfTimeFrame, chosenEndOfTimeFrame, guildNames).then(resp => {
    
    var prodeko = [];
    var fk=[];
    
    for (let i of resp) {
      if(Object.keys(i)[0] === 'Prodeko'){
          prodeko = prodeko.concat(Object.values(i)[0]);
               
      };
    }
    for (let i of resp) {
      if(Object.keys(i)[0] === 'FK'){
          fk = fk.concat(Object.values(i)[0]);
               
      };
    }

    var filtered = resp.filter(function(el) { 
      
      return Object.keys(el)[0]!= 'Prodeko'&& Object.keys(el)[0]!='FK'
    }); 
    filtered.push({'Prodeko': prodeko, color: "rgb(176,224,230)"});
    filtered.push({'FK': fk, color: "rgb(211,211,211)"});
   
    res.json({ response: filtered});
  });
});

const calendar = [
  guild_ids['32ea4e78ofvnev8cs33s0qe5ko@group.calendar.google.com'],
  guild_ids['luio3o3teglcol8h8tm7507v38@group.calendar.google.com'],
  guild_ids['s7um8u5sc1icmtltl0h1rjeom4@group.calendar.google.com'],
  guild_ids['4pm04bvppbbsgnv2mcrqs8aoos@group.calendar.google.com'],
  guild_ids['as.tiedottaja@gmail.com'],
  guild_ids['athenekilta@gmail.com'],
  guild_ids['b3fin9sihgp6pcr39rhdjdl4g4hme2p0@import.calendar.google.com'],
  guild_ids['hnv94f61j5odsaevk489pt4asgan9siq@import.calendar.google.com'],
  guild_ids['l7ajd4v1edmeo3r6oh07da555c@group.calendar.google.com'],
  guild_ids['p4r635n487mr7u9cje9n6985e0@group.calendar.google.com'],
  guild_ids['prosessiteekkarit@gmail.com'],
  guild_ids['vuorimieskilta@gmail.com'],
  guild_ids['jgqf5u162heo7vgkgddq90d68s@group.calendar.google.com'],
  guild_ids['ekm75qbnvm91a45rs2q5p2edok@group.calendar.google.com'],
  guild_ids['a440frd2hhop84nhvesq3krijc@group.calendar.google.com'],
  guild_ids['4j6ircv0qosvgfk66588an88n8@group.calendar.google.com'],
  guild_ids['ahe0vjbi6j16p25rcftgfou5eg@group.calendar.google.com'],
  guild_ids['u6eju2k63ond2fs7fqvjbna50c@group.calendar.google.com'],
  guild_ids['ji339ebgiaauv5nk07g41o65q8@group.calendar.google.com']
];

async function getAllEvents ( startDate, endDate, guildNames ) {
  try{
    return new Promise((resolve, reject) => {
   
      var result = [];
      var prodeko = [];
      var FK  = [];

      const tasks = [];
      const urls = getUrls(startDate, endDate, guildNames);

      for (const url of urls) {
          const task = getRequest(url).then(events => {       
            result.push(events);        
          });
          tasks.push(task);
      }

      Promise.all(tasks).then(() => resolve(result));
    })
  } catch(e){
    return e;
  }
}

function getRequest (url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, res => {
      var json = '';
      res.on('data', function(d) {
        json +=d;
      });
      res.on('end', function () {
        if (res.statusCode === 200) {
            try {
              var result = JSON.parse(json);
                var parsedResult = parseObject(result, url.nameOfGuild, url.colorOfGuild);
                resolve(parsedResult);
              } catch (e) {
                console.log('Error parsing JSON!', e);
                reject(e);
            }
        } else {
          console.log('Status:', res.statusCode);
        }        
    });
});

req.on('error', error => {
  console.error(error);
  reject(error);
});

req.end();

});
}

function getUrls (startDate, endDate, guildNames) {
  const params = {
    key: process.env.API_KEY,
    singleEvents: true,
    timeMax: endDate,
    timeMin: startDate
  };

  var options = [];
  for (const i of calendar) {  
    if (guildNames.includes(i.name)) {
      options.push({
        hostname: 'content.googleapis.com',
        path: '/calendar/v3/calendars/' + i.calendarId + '/events?' + qs.stringify(params),
        method: 'GET',
        nameOfGuild : i.name,
        colorOfGuild: i.color
      })
    }
  }
  return options;
}

function parseObject(json, nameOfGuild, colorOfGuild){
  var eventsList = [];
  var obj = new Object;
  const items = json.items;

  if (items.length === 0) {
    obj[nameOfGuild] = [];
  }
  
  for(var i of items){
    if (i.summary) {
      var eventti = new Event(i.summary, i.description,i.location, i.start, i.end, i.organizer.email, colorOfGuild);
      eventsList.push(eventti);
      obj[nameOfGuild] = eventsList;
    }
  };
  return obj;
}

