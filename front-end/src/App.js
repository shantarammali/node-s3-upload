import React, { useState } from 'react';
import axios from 'axios';

const ImageUpload = () => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('http://localhost:3000/upload', formData);
      console.log('Upload successful:', res.data);
      setImageUrl(res.data.signedUrl);
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="image/*" />
      <button onClick={handleUpload}>Upload</button>
      {imageUrl && <img src={imageUrl} alt="Uploaded" width="300" />}
    </div>
  );
};

export default ImageUpload;
