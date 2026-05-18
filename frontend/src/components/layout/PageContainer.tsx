import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string; 
}

const PageContainer: React.FC<Props> = ({ children, className = "" }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;