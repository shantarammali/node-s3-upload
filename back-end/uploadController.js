// const dotenv = require('dotenv');
// dotenv.config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const Upload = require('./Models/UploadSchema'); // Assuming you have a model file for the image schema
const connectDB  = require('./db'); // Assuming you have a db.js file for MongoDB connection
// Initialize MongoDB connection
connectDB(); // Connect to MongoDB if needed

const app = express();

// Enable CORS
app.use(cors());


console.log('MONGO_URI S1:', process.env.MONGO_CONNECTION_URL);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY);
console.log('AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME);
const PORT = 3000;

// Configure AWS
// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });


// Multer Storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload Route
app.post('/upload', upload.single('image'), async (req, res) => {
  const file = req.file;
  const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
    ResponseContentType: file.mimetype || 'image/jpeg',
    signatureVersion: 'v4'
  });
  const fileName = `${uuidv4()}${path.extname(file.originalname)}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    //ACL: 'public-read',
  };

  console.log('Uploading to S3:', params);
  try {
    const data = await s3.upload(params).promise();

    // Generate signed URL
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Expires: 60 * 60, // 1 hour
    });

    const newImage = new Upload({ imageUrl: signedUrl });
    await newImage.save();

    console.log('Image uploaded successfully:', newImage);
    res.json({
      message: 'Image uploaded successfully',
      signedUrl: signedUrl,
      fileName: fileName
    });
  } catch (err) {
   // console.error('Error uploading to S3:', err);
    res.status(500).json({ error: 'Failed to upload image s3==' + err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/* Start RUN front end code */
const fs = require('fs');

const frontendPath = path.join(__dirname, '../frontend/index.html');

if (fs.existsSync(frontendPath)) {
  app.use(express.static(path.join(__dirname, '../frontend')));
  app.get('/*', (req, res) => {
    res.sendFile(frontendPath);
  });
} else {
  console.warn('Frontend build not found. Skipping frontend routes.');
}

/* END RUN front end code */
