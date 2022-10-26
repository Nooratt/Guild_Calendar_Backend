const guilds = require('./guildIds.json');

class Event {

    constructor(title, description, location, start, end, guild, backgroundColor) {
      this.title = title;
      this.description = description;
      this.location = location;
      this.start = this.checkStartDate(start);
      this.end = this.checkEndDate(end);
      this.guild = this.idToGuild(guild);
      this.backgroundColor = backgroundColor;
    };
    
    idToGuild (guildId){
        return guilds[guildId].name; 
    }

    checkStartDate(startDate) {
      if (startDate.dateTime) {
        return startDate.dateTime;
      }
      else {
        return startDate.date;
      }
    }

    checkEndDate(endDate) {
      if (endDate.dateTime) {
        return endDate.dateTime;
      }
      else {
        return endDate.date;
      }
    }
  }

  module.exports = Event;
