fuz.io
======

Fuz.io is a simple file-transfer / cloud-hosting app in Node.js.  The basic idea is that, well, it's no fun having to wait for a file to upload before your friend starts downloading.  With most other services, you upload your file and then an email is sent, and your friend receives the file.

I wanted something closer to sending files through an instant messaging app - the download should start immediately.  

Fuz.io does this: instant-start browser-to-browser file transfer.

(Side note: this was entirely a learn-node-js project, so don't be surprised if there are corners of the code that are a bit, well, weird)

## How it works

Uploading works something like this:

1. A standard HTML5 file upload is initiated by a user
2. The API server receives the request
  * It immediately broadcasts the availability of a file to connected clients via Redis
  * It immediately begins transfering the file up to amazon S3
3. The API server duplicates the files into two buckets in S3
  1. complete.fuz.io - this is the bucket that contains an entire file.
  2. parts.fuz.io - this bucket contains the file split into 50kb chunks.
4. As each part completes, fuz.io notifies connected clients via Redis.

When a download is initiated, the following happens:

1. The API server checks whether or not the upload has completed.  If it has, then it simply pipes the complete file from complete.fuz.io.  We're done.
2. If the upload has not completed, then the API server begins streaming parts.  It requests the first 50kb part from parts.fuz.io bucket, and sends it out to the client, then appends the second part, and the third, and so on.  

## Demo

You can see a simple demo of fuz.io at (you guess it) https://fuz.io.
I suspect that I'm going to get an amazon alert at some point.  If the demo doesn't work, it's because I took the site down.  (I haven't yet implemented quotas or anything like that).

## Tech Talk

### API/Site
In theory, fuz.io is fairly cleanly designed, with a clear split between the website (the fuz.io subfolder) and the API (the data.fuz.io subfolder).  Both are node.js projects, but the only communication between the two layers happens via Redis (auth and notifications) or via web requests made by the website into the API.

It should be trivial to clean out fuz.io and completely replace it with a new frontend without having to touch data.fuz.io

### Production vs Dev
In production (at least on https://fuz.io), HAProxy sits in front and properly proxies requests to either data.fuz.io or fuz.io, depending on the http request url.  All API requests are made to https://fuz.io/api/*

SSLTunnel sits in front of HAProxy, dealing with SSL termination.

### StreamBrk and StreamFuz
Fuz.io makes use of https://github.com/astalwick/streambrk and https://github.com/astalwick/streamfuz.  

StreamBrk is what is used when an upload is received in order to break the incoming stream into a set of 50kb chunks, to be piped into amazon s3.  

StreamFuz is used to fetch all of those parts, buffer them (so that we don't introduce any slowness on the download), and merge them down into a single stream to be sent down to the client.

### 

## Todo

The biggest things on my list of remaining tasks are:

1. Implement quotas
2. Refactor the workspace system
  * The workspace system is a bit of a terrible idea in the first place, and very limiting.  Basically, every file belongs to a workspace, and a user can have multiple workspaces.  Not folders, that implies subfolders - no, workspaces.  The idea was: you could invite different people to different workspaces.  At the end of the day, though, this basically just made things weird for no good reason.
3. Add a payment system and accounts to the front end
4. Email notifications / etc.
