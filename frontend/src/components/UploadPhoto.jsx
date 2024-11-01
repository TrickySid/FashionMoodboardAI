import React, { useState } from "react";
import axios from "axios";

function UploadPhoto() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const { data } = await axios.post("/api/analyze", formData);
    console.log(data.labels); // log labels for now
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload and Analyze</button>
    </div>
  );
}

export default UploadPhoto;
