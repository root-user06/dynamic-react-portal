
import { FC } from 'react';

interface LoaderProps {
  variant?: string;
}

const Loader: FC<LoaderProps> = ({ variant }) => {
  return (
    <div className="loader">
      <div className="loader-inner">
        <div className="circle"></div>
      </div>
    </div>
  );
};

export default Loader;
