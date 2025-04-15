import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Program } from '@/types';

interface ProgramDetailsProps {
  program: Program;
}

export const ProgramDetails: React.FC<ProgramDetailsProps> = ({ program }) => {
  return (
    <Card className="w-96 bg-white/90 backdrop-blur-sm">
      <CardHeader className="p-4">
        <CardTitle className="text-lg font-bold">{program.name}</CardTitle>
        <p className="text-sm text-gray-600">{program.degree}</p>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold">Application Deadlines</h3>
          {program.applicationDeadlines.winter && (
            <p>Winter Semester: {program.applicationDeadlines.winter.start} - {program.applicationDeadlines.winter.end}</p>
          )}
          {program.applicationDeadlines.summer && (
            <p>Summer Semester: {program.applicationDeadlines.summer.start} - {program.applicationDeadlines.summer.end}</p>
          )}
        </div>
        
        <div>
          <h3 className="font-semibold">Professors</h3>
          <ul className="list-disc pl-4">
            {program.professors.map((professor, index) => (
              <li key={index}>
                {professor.name} - <a href={`mailto:${professor.email}`} className="text-blue-600 hover:underline">{professor.email}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold">Program Details</h3>
          <p>Duration: {program.duration}</p>
          <p>Language: {program.language}</p>
          <p>Tuition: {program.tuitionFees}</p>
        </div>

        <div>
          <h3 className="font-semibold">Description</h3>
          <p className="text-sm">{program.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}; 