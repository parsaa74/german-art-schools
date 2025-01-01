import React from 'react';

interface ClusterOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const ClusterOverlay: React.FC<ClusterOverlayProps> = ({
  isVisible,
  onClose,
  children
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto bg-white rounded-lg shadow-xl m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

export const ClusterContent: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      {children}
    </div>
  );
};

export const SchoolItem: React.FC<{
  name: string;
  programCount: number;
  onClick: () => void;
}> = ({ name, programCount, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <h4 className="font-semibold text-lg">{name}</h4>
      <p className="text-sm text-gray-600">
        {programCount} Program{programCount !== 1 ? 's' : ''} Available
      </p>
    </div>
  );
}; 