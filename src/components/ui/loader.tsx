
import React from 'react';

interface LoaderProps {
  fullScreen?: boolean;
}

const Loader = ({ fullScreen = true }: LoaderProps) => {
  return (
    <div className={`loader ${fullScreen ? 'fixed' : 'absolute'} inset-0 bg-white z-50 flex items-center justify-center`}>
      <div className="loader-inner">
        <div className="circle"></div>
      </div>
    </div>
  );
};

export default Loader;
