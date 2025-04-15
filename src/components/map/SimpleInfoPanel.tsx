'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'

interface SimpleInfoPanelProps {
  school: any
  isOpen: boolean
  onClose: () => void
}

export default function SimpleInfoPanel({ school, isOpen, onClose }: SimpleInfoPanelProps) {
  console.log('SimpleInfoPanel rendering with:', { school, isOpen })

  if (!school) {
    console.log('SimpleInfoPanel returning null because school is null')
    return null
  }

  // Get a color for the school type - using blue theme
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'university': return 'bg-blue-600'
      case 'art_academy': return 'bg-blue-500'
      case 'design_school': return 'bg-blue-700'
      case 'music_academy': return 'bg-blue-400'
      case 'film_school': return 'bg-blue-800'
      default: return 'bg-blue-600'
    }
  }

  return (
    <div
      id="info-panel"
      role="dialog"
      aria-labelledby="school-name-heading"
      aria-modal="true"
      className="fixed top-4 right-4 z-[9999] w-96 max-w-sm bg-black/60 backdrop-blur-xl text-gray-100 rounded-xl shadow-[0_0_30px_rgba(41,121,255,0.3)] border border-blue-500/30 overflow-hidden pointer-events-auto"
      style={{
        background: 'linear-gradient(135deg, rgba(18,24,33,0.8) 0%, rgba(41,121,255,0.1) 100%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Decorative elements for artistic effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-300 opacity-80"></div>
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-blue-500/20 blur-xl"></div>
      <div className="absolute -bottom-10 -left-10 w-20 h-20 rounded-full bg-blue-400/20 blur-lg"></div>

      {/* Panel Header with artistic background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-blue-600/20 z-0"></div>
        <div className="flex justify-between items-center p-5 relative z-10">
          <h2
            id="school-name-heading"
            className="text-xl font-bold text-white tracking-tight"
            style={{
              textShadow: '0 0 15px rgba(41,121,255,0.5), 0 0 30px rgba(41,121,255,0.3)'
            }}
          >
            {school.name}
          </h2>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition-colors p-1.5 rounded-full hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Close information panel"
          >
            <XMarkIcon className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        {/* Type badge with glow effect */}
        <div className="px-5 pb-3 relative z-10">
          <span
            className={`inline-block px-3 py-1 text-xs font-medium text-white rounded-full ${getTypeColor(school.type)} shadow-[0_0_10px_rgba(41,121,255,0.5)]`}
            style={{ textShadow: '0 0 5px rgba(255,255,255,0.5)' }}
          >
            {school.type.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Panel Body with artistic layout */}
      <div className="p-5 space-y-5 text-sm relative">
        {/* Decorative line */}
        <div className="absolute left-0 top-0 w-[1px] h-full bg-gradient-to-b from-blue-500/0 via-blue-500/30 to-blue-500/0"></div>

        {/* Location with icon */}
        <div className="flex items-start pl-2 group transition-all duration-300 hover:translate-x-1">
          <div className="relative">
            <div className="absolute -left-2 top-1/2 w-2 h-2 rounded-full bg-blue-400 transform -translate-y-1/2 group-hover:scale-150 transition-all duration-300"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0 group-hover:text-blue-300 transition-colors duration-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-white group-hover:text-blue-200 transition-colors duration-300">{school.city || school.state}</div>
            <div className="text-blue-200/70 text-xs">{school.state}, Germany</div>
          </div>
        </div>

        {/* School description if available */}
        {school.description && (
          <div className="flex items-start pl-2 group transition-all duration-300 hover:translate-x-1">
            <div className="relative">
              <div className="absolute -left-2 top-1/2 w-2 h-2 rounded-full bg-blue-400 transform -translate-y-1/2 group-hover:scale-150 transition-all duration-300"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0 group-hover:text-blue-300 transition-colors duration-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-white group-hover:text-blue-200 transition-colors duration-300 mb-1">About</div>
              <div className="text-blue-200/80 text-xs line-clamp-4">{school.description}</div>
            </div>
          </div>
        )}

        {/* School stats if available */}
        {(school.founded || school.students) && (
          <div className="flex items-start pl-2 group transition-all duration-300 hover:translate-x-1">
            <div className="relative">
              <div className="absolute -left-2 top-1/2 w-2 h-2 rounded-full bg-blue-400 transform -translate-y-1/2 group-hover:scale-150 transition-all duration-300"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0 group-hover:text-blue-300 transition-colors duration-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
              </svg>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {school.founded && (
                <div>
                  <div className="font-medium text-white group-hover:text-blue-200 transition-colors duration-300">Founded</div>
                  <div className="text-blue-200/70 text-xs">{school.founded}</div>
                </div>
              )}
              {school.students && (
                <div>
                  <div className="font-medium text-white group-hover:text-blue-200 transition-colors duration-300">Students</div>
                  <div className="text-blue-200/70 text-xs">{school.students}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Programs section with icon */}
        {school.programTypes && school.programTypes.length > 0 && (
          <div className="flex items-start pl-2 group transition-all duration-300 hover:translate-x-1">
            <div className="relative">
              <div className="absolute -left-2 top-1/2 w-2 h-2 rounded-full bg-blue-400 transform -translate-y-1/2 group-hover:scale-150 transition-all duration-300"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0 group-hover:text-blue-300 transition-colors duration-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-white group-hover:text-blue-200 transition-colors duration-300 mb-3">Programs ({school.programCount})</div>
              <div className="flex flex-wrap gap-2">
                {school.programTypes.slice(0, 6).map((prog: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-900/30 border border-blue-500/20 rounded-md text-xs text-blue-200 hover:bg-blue-800/40 hover:border-blue-400/30 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_8px_rgba(41,121,255,0.3)]"
                    style={{ backdropFilter: 'blur(4px)' }}
                  >
                    {prog}
                  </span>
                ))}
                {school.programTypes.length > 6 && (
                  <span
                    className="px-2 py-1 bg-blue-900/30 border border-blue-500/20 rounded-md text-xs text-blue-200 hover:bg-blue-800/40 hover:border-blue-400/30 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_8px_rgba(41,121,255,0.3)]"
                    style={{ backdropFilter: 'blur(4px)' }}
                  >
                    +{school.programTypes.length - 6} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Detailed program information if available */}
        {school.programs && school.programs.length > 0 && (
          <div className="flex items-start pl-2 group transition-all duration-300 hover:translate-x-1">
            <div className="relative">
              <div className="absolute -left-2 top-1/2 w-2 h-2 rounded-full bg-blue-400 transform -translate-y-1/2 group-hover:scale-150 transition-all duration-300"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0 group-hover:text-blue-300 transition-colors duration-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-white group-hover:text-blue-200 transition-colors duration-300 mb-3">Featured Program</div>
              <div className="space-y-3">
                {school.programs.slice(0, 1).map((prog: any, index: number) => (
                  <div key={index} className="bg-blue-900/20 border border-blue-500/20 rounded-md p-3 hover:bg-blue-800/30 hover:border-blue-400/30 transition-all duration-300 hover:shadow-[0_0_8px_rgba(41,121,255,0.3)]">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-white">{prog.name}</div>
                      <span className="px-2 py-0.5 bg-blue-700/40 rounded text-xs text-blue-200">{prog.degree}</span>
                    </div>
                    {prog.description && (
                      <div className="text-blue-200/80 text-xs mb-2 line-clamp-2">{prog.description}</div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="text-xs text-blue-300">
                        <span className="text-blue-400">Duration:</span> {prog.duration}
                      </div>
                      <div className="text-xs text-blue-300">
                        <span className="text-blue-400">Language:</span> {prog.language}
                      </div>
                    </div>
                    {prog.specializations && prog.specializations.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-blue-400 mb-1">Specializations:</div>
                        <div className="flex flex-wrap gap-1">
                          {prog.specializations.slice(0, 3).map((spec: string, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 bg-blue-900/30 rounded text-xs text-blue-200">{spec}</span>
                          ))}
                          {prog.specializations.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-blue-900/30 rounded text-xs text-blue-200">+{prog.specializations.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {school.programs.length > 1 && (
                  <div className="text-center text-xs text-blue-300 mt-1">
                    +{school.programs.length - 1} more programs available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Website button with artistic styling */}
        {school.website && school.website !== '#' && (
          <div className="pt-4 pl-2 relative">
            <div className="absolute -left-2 top-1/2 w-2 h-2 rounded-full bg-blue-400 transform -translate-y-1/2 group-hover:scale-150 transition-all duration-300"></div>
            <a
              href={school.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${school.name} website (opens in new tab)`}
              className="group inline-flex items-center justify-center w-full gap-2 px-4 py-2.5
                bg-gradient-to-r from-blue-600/80 via-blue-500/80 to-blue-600/80
                hover:from-blue-500/90 hover:via-blue-400/90 hover:to-blue-500/90
                text-white rounded-md text-sm font-medium
                transition-all duration-300
                shadow-[0_4px_15px_rgba(41,121,255,0.2)]
                hover:shadow-[0_6px_20px_rgba(41,121,255,0.4)]
                border border-blue-500/30 hover:border-blue-400/50
                transform hover:-translate-y-0.5 active:translate-y-0
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              <span className="relative z-10">Visit Official Website</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              >
                <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.19a.75.75 0 0 0 .053 1.06Z" clipRule="evenodd" />
              </svg>

              {/* Decorative glow effect */}
              <div className="absolute inset-0 -z-10 bg-blue-500/20 blur-md rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
