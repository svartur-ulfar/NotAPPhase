require("dotenv").config();
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

// upload images to AWS S3

function uploadFile(file) {
  const fileStream = fs.createReadStream("public/images/upload_compressed/" + file.filename);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename,
  };

  return s3.upload(uploadParams).promise();
}
exports.uploadFile = uploadFile;

function uploadFileProfile(file) {
  const fileStreamProfile = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStreamProfile,
    Key: file.filename,
  };

  return s3.upload(uploadParams).promise();
}
exports.uploadFileProfile = uploadFileProfile;




// "public/images/upload_compressed/" + file.filename