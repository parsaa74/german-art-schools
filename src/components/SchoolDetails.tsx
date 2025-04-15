import React from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { School, Program } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';

interface SchoolDetailsProps {
  school: School;
  onClose: () => void;
  dict?: any; // Dictionary for translations
}

const ProgramCard: React.FC<{ program: Program, dict?: any }> = ({ program, dict }) => {
  // Get language from URL if available, default to English
  const params = useParams();
  const lang = params?.lang as string || 'en';

  // Use dictionary if provided, otherwise use default English text
  const t = {
    duration: dict?.schoolDetails?.duration || 'Duration',
    specializations: dict?.schoolDetails?.specializations || 'Specializations',
    professors: dict?.schoolDetails?.professors || 'Professors',
    requirements: dict?.schoolDetails?.requirements || 'Requirements',
    applicationDeadlines: dict?.schoolDetails?.applicationDeadlines || 'Application Deadlines',
    winterSemester: dict?.schoolDetails?.winterSemester || 'Winter Semester',
    summerSemester: dict?.schoolDetails?.summerSemester || 'Summer Semester',
    start: dict?.schoolDetails?.start || 'Start',
    end: dict?.schoolDetails?.end || 'End',
    programDetails: dict?.schoolDetails?.programDetails || 'Program Details',
  };

  return (
  <Card className="bg-gray-900 text-white border-none">
    <CardHeader className="p-4 pb-2">
      <div className="flex justify-between items-start">
        <CardTitle className="text-lg font-bold">{program.name}</CardTitle>
        <Badge variant="secondary">{program.degree}</Badge>
      </div>
      <div className="text-sm text-gray-400">{t.duration}: {program.duration}</div>
    </CardHeader>
    <CardContent className="p-4 pt-2 space-y-4">
      {program.description && (
        <p className="text-sm text-gray-300">{program.description}</p>
      )}

      {program.specializations && program.specializations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{t.specializations}:</h4>
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
          <h4 className="text-sm font-semibold">{t.professors}:</h4>
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
          <h4 className="text-sm font-semibold">{t.requirements}:</h4>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            {program.requirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {program.applicationDeadlines && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{t.applicationDeadlines}:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {program.applicationDeadlines.winter && (
              <div>
                <div className="font-medium">{t.winterSemester}:</div>
                <div className="text-gray-300">
                  {program.applicationDeadlines.winter.start && (
                    <div>{t.start}: {program.applicationDeadlines.winter.start}</div>
                  )}
                  {program.applicationDeadlines.winter.end && (
                    <div>{t.end}: {program.applicationDeadlines.winter.end}</div>
                  )}
                </div>
              </div>
            )}
            {program.applicationDeadlines.summer && (
              <div>
                <div className="font-medium">{t.summerSemester}:</div>
                <div className="text-gray-300">
                  {program.applicationDeadlines.summer.start && (
                    <div>{t.start}: {program.applicationDeadlines.summer.start}</div>
                  )}
                  {program.applicationDeadlines.summer.end && (
                    <div>{t.end}: {program.applicationDeadlines.summer.end}</div>
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
          {t.programDetails} →
        </a>
      )}
    </CardContent>
  </Card>
);}

export const SchoolDetails: React.FC<SchoolDetailsProps> = ({ school, onClose, dict }) => {
  // Get language from URL if available, default to English
  const params = useParams();
  const lang = params?.lang as string || 'en';

  // Use dictionary if provided, otherwise use default English text
  const t = {
    backToMap: dict?.schoolDetails?.backToMap || 'Back to Map',
    founded: dict?.schoolDetails?.founded || 'Founded',
    visitWebsite: dict?.schoolDetails?.website || 'Visit Website',
    programs: dict?.schoolDetails?.programs || 'Programs'
  };
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
              ← {t.backToMap}
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
                      <Badge variant="outline">{t.founded}: {school.founded}</Badge>
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
                      {t.visitWebsite} →
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
            <h2 className="text-lg font-bold text-white mb-3">{t.programs}</h2>
            <div className="grid grid-cols-1 gap-4">
              {school.programs.map((program, index) => (
                <motion.div
                  key={program.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  <ProgramCard program={program} dict={dict} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};