import React, { useEffect, useState } from "react";
import axios from "axios";

function Moodboard() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data } = await axios.get("/api/user/photos");
      setPhotos(data.photos);
    };
    fetchPhotos();
  }, []);

  return (
    <div>
      <h1>Your Moodboard</h1>
      <div>
        {photos.map((photo) => (
          <img key={photo.id} src={photo.url} alt="user mood" />
        ))}
      </div>
    </div>
  );
}

export default Moodboard;
