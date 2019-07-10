const path = require('path');
const sharp = require('sharp');
const sizeOf = require('image-size');
const fs = require('fs');
const zipper = require('adm-zip');
const _ = require('underscore');

exports.uploadFile = uploadFile;
exports.listFiles = listFiles;
exports.downloadAll = downloadFiles;

const zip = new zipper();
let createZip = false;
initZipFile();

function initZipFile(){
  const dirents = fs.readdirSync(path.join(__dirname + '/files/'), { withFileTypes: true });
  const currentFiles = dirents
      .filter(dirent => !dirent.isDirectory())
      .map(dirent => dirent.name);
  currentFiles.forEach((fl)=>{
    zip.addLocalFile(path.join(__dirname + '/files/' + fl));
  });
  createZipFile();

  setInterval(()=>{
    if (createZip){
      createZipFile();
    }
  }, 10000);
}

function uploadFile(req, res){
    if (!req.body) { return res.sendStatus(400); }
  
    if (!req.files)
      return res.status(400).send('No files were uploaded.');
  
    if (!req.files.inputFiles)
      return res.status(400).send('No files were uploaded.');
   
    let inputFiles = req.files.inputFiles;

    if(!inputFiles.hasOwnProperty('length')){
        inputFiles = [inputFiles];
    }

    inputFiles.forEach((file) => {
        let originalFilePath = path.join(__dirname + '/files/' + file.name);
        let thumbnailFilePath = path.join(__dirname + '/files/thumbnails/' + file.name);
        file.mv(originalFilePath, err=> {
            if (err){
              return res.status(500).send(err);
            } else {
              let dimensions = sizeOf(originalFilePath);
              while (dimensions.width > 200 && dimensions.height > 200){
                dimensions.width = Math.round(dimensions.width / 2);
                dimensions.height = Math.round(dimensions.height / 2);
              }

              sharp(originalFilePath)
                .resize(dimensions.width, dimensions.height)
                .toFile(thumbnailFilePath, (err) => {
                  zip.addLocalFile(originalFilePath);
                  createZip = true;

                  res.status(200).send(file.name);
                });
            }
        });
    });
}

function listFiles(req, res){
  const limitPerRequest = 10;
  const start = req.body.start * limitPerRequest;

  fs.readdir(path.join(__dirname + '/files/thumbnails/'), function(err, items) {
    let returnItems = items.slice(start, start + limitPerRequest);
    res.status(200).send(returnItems.join("|"));
  });
}

function downloadFiles(req, res){
  let dir = path.join(`${__dirname}/files/zipped`);
  let files = fs.readdirSync(dir);

  let mostRecent = _.max(files, function (f) {
      var fullpath = path.join(dir, f);
      return fs.statSync(fullpath).ctime;
  });

  res.status(200).send(mostRecent);
}

function createZipFile(){
  let filename = path.join(`${__dirname}/files/zipped/svalbard_${new Date().getTime()}.zip`);
  zip.writeZip(filename);
  createZip = false;
}