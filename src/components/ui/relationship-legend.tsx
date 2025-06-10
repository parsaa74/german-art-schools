import React from 'react';
import { Card } from './card';

interface RelationshipLegendProps {
  isVisible: boolean;
  selectedUniversityName: string;
}

export function RelationshipLegend({ isVisible, selectedUniversityName }: RelationshipLegendProps) {
  if (!isVisible) return null;

  const relationshipColors = [
    { color: '#10B981', label: 'Very Strong' },
    { color: '#84CC16', label: 'Strong' },
    { color: '#F59E0B', label: 'Moderate' },
    { color: '#EF4444', label: 'Weak' },
    { color: '#6B7280', label: 'Minimal' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <Card className="px-4 py-2 bg-black/80 backdrop-blur-sm border-gray-600">
        <div className="text-white">
          <div className="flex items-center space-x-6">
            <span className="text-xs font-medium text-gray-300 whitespace-nowrap">
              Relationships to {selectedUniversityName}:
            </span>
            <div className="flex items-center space-x-4">
              {relationshipColors.map((item, index) => (
                <div key={index} className="flex items-center space-x-1.5">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-200">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}