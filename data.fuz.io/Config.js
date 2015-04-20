function Config() {
  this.isDev = process.env.DEBUG ? true : false;
  if(this.isDev) {
    this.domain = 'local.fuz.io';
    this.url = 'http://local.fuz.io'
  }
  else {
    this.domain = 'fuz.io';
    this.url = 'https://fuz.io'
  }
  this.port = 3001;
  this.redisHost = process.env['FUZIOREDIS_PORT_6379_TCP_ADDR'] || '127.0.0.1';
  this.mongoHost = process.env['FUZIOMONGO_PORT_27017_TCP_ADDR'] || '127.0.0.1';
  this.mongoDbName = 'fuzio';

  this.blockSize = 50000;


  this.parallelDownloads = 5;
  this.downloadBufferSize = 50000;
  this.uploadBufferSize = 100000;

  this.s3DownloadSockets = 10000;
  this.maxSockets = 30000;

  this.partExpiryHours = 12;
  this.maxPendingUploadParts = 3;

  this.workspaceEditableProperties = {
    title: true
  }
}
module.exports = new Config;
