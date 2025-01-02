import React from 'react';
import Image from 'next/image';
import { School, Program } from '@/types/school';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';

interface SchoolDetailsProps {
  school: School;
  onClose: () => void;
}

const ProgramCard: React.FC<{ program: Program }> = ({ program }) => (
  <Card className="bg-gray-900 text-white border-none">
    <CardHeader className="p-4 pb-2">
      <div className="flex justify-between items-start">
        <CardTitle className="text-lg font-bold">{program.name}</CardTitle>
        <Badge variant="secondary">{program.degree}</Badge>
      </div>
      <div className="text-sm text-gray-400">Duration: {program.duration}</div>
    </CardHeader>
    <CardContent className="p-4 pt-2 space-y-4">
      {program.description && (
        <p className="text-sm text-gray-300">{program.description}</p>
      )}
      
      {program.specializations && program.specializations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Specializations:</h4>
          <div className="flex flex-wrap gap-1">
            {program.specializations.map((spec, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {spec}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {program.professors && program.professors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Professors:</h4>
          <div className="space-y-1">
            {program.professors.map((prof, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">{prof.name}</span>
                {prof.position && (
                  <span className="text-gray-400"> - {prof.position}</span>
                )}
                {prof.email && (
                  <a 
                    href={`mailto:${prof.email}`}
                    className="block text-blue-400 hover:text-blue-300 text-xs mt-0.5"
                  >
                    {prof.email}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {program.requirements && program.requirements.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Requirements:</h4>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            {program.requirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {program.applicationDeadlines && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Application Deadlines:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {program.applicationDeadlines.winter && (
              <div>
                <div className="font-medium">Winter Semester:</div>
                <div className="text-gray-300">
                  {program.applicationDeadlines.winter.start && (
                    <div>Start: {program.applicationDeadlines.winter.start}</div>
                  )}
                  {program.applicationDeadlines.winter.end && (
                    <div>End: {program.applicationDeadlines.winter.end}</div>
                  )}
                </div>
              </div>
            )}
            {program.applicationDeadlines.summer && (
              <div>
                <div className="font-medium">Summer Semester:</div>
                <div className="text-gray-300">
                  {program.applicationDeadlines.summer.start && (
                    <div>Start: {program.applicationDeadlines.summer.start}</div>
                  )}
                  {program.applicationDeadlines.summer.end && (
                    <div>End: {program.applicationDeadlines.summer.end}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {program.link && (
        <a
          href={program.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-blue-400 hover:text-blue-300 text-sm text-right"
        >
          Program Details →
        </a>
      )}
    </CardContent>
  </Card>
);

export const SchoolDetails: React.FC<SchoolDetailsProps> = ({ school, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm overflow-y-auto z-50"
    >
      <div className="min-h-screen py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors text-sm"
            >
              ← Back to Map
            </motion.button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 rounded-lg overflow-hidden shadow-xl"
          >
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {school.logo && (
                  <div className="w-full sm:w-36 flex-shrink-0">
                    <Image
                      src={`/images/university-logos/${school.logo}`}
                      alt={`${school.name} logo`}
                      width={150}
                      height={75}
                      className="object-contain w-full"
                    />
                  </div>
                )}
                <div className="flex-grow">
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {school.name}
                  </h1>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="secondary">{school.type}</Badge>
                    <Badge variant="outline">{school.state}</Badge>
                    {school.founded && (
                      <Badge variant="outline">Founded: {school.founded}</Badge>
                    )}
                  </div>
                  {school.description && (
                    <p className="text-sm text-gray-300">
                      {school.description}
                    </p>
                  )}
                  {school.website && (
                    <a
                      href={school.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                    >
                      Visit Website →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 space-y-4"
          >
            <h2 className="text-lg font-bold text-white mb-3">Programs</h2>
            <div className="grid grid-cols-1 gap-4">
              {school.programs.map((program, index) => (
                <motion.div
                  key={program.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  <ProgramCard program={program} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}; 