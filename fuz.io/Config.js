function Config() {
  this.isDev = process.env.DEBUG ? true : false;
  if(this.isDev) {
    this.domain = 'local.fuz.io';
    this.url = 'http://local.fuz.io'
    this.port = 80;
  }
  else {
    this.domain = 'fuz.io';
    this.url = 'https://fuz.io'
    this.port = 3000;
  }
  
  this.dataServerPort = 3001;
  this.redisHost = process.env['FUZIOREDIS_PORT_6379_TCP_ADDR'] || '127.0.0.1';
  this.mongoHost = process.env['FUZIOMONGO_PORT_27017_TCP_ADDR'] || '127.0.0.1';
  this.mongoDbName = 'fuzio';
}
module.exports = new Config;
