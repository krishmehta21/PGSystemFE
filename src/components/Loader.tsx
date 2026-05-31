import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  inline?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', label, inline }) => {
  const sizeMap = {
    sm: '24px',
    md: '40px',
    lg: '56px'
  };

  if (inline) {
    return <div className="custom-loader" style={{ width: sizeMap[size] }} />;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full py-8">
      <div 
        className="custom-loader" 
        style={{ width: sizeMap[size] }}
      />
      {label && <p className="text-xs font-semibold text-black/40 mt-1">{label}</p>}
    </div>
  );
};

export default Loader;
