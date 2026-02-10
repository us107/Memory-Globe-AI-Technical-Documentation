
import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import MemoryGlobe from './components/MemoryGlobe';
import { MemoryImage } from './types';

const App: React.FC = () => {
  const [images, setImages] = useState<MemoryImage[]>([]);
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = (uploadedImages: MemoryImage[]) => {
    setImages(uploadedImages);
    setIsStarted(true);
  };

  return (
    <div className={`w-full bg-black relative ${isStarted ? 'h-screen overflow-hidden' : 'min-h-screen overflow-y-auto'}`}>
      {!isStarted ? (
        <ImageUploader onStart={handleStart} />
      ) : (
        <MemoryGlobe images={images} onBack={() => setIsStarted(false)} />
      )}
    </div>
  );
};

export default App;
