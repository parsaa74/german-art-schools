'use client' // Required for hooks and event handlers

import React from 'react' // Removed useState as useDisclosure handles it
import D3VisualizationContainer from '@/components/visualization/D3VisualizationContainer';
import NavBar from '@/components/navigation/NavBar'
const Sidebar = NavBar;
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
// Import NextUI Modal components and Button
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Link } from "@nextui-org/react";
// Import icons from react-icons
import { FiHelpCircle, FiGithub } from 'react-icons/fi';

export default function Home() {
  // State hook for the Help Modal visibility
  const {isOpen, onOpen, onOpenChange} = useDisclosure();

  const githubUrl = "https://github.com/parsaa74/german-art-schools";

  // Color Logic Explanation Text Content (assuming no change needed)
  const colorExplanation = (
    <div className="space-y-2 text-sm">
      <p>
        Marker colors are based on simple heuristics:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li><span className="font-semibold text-[#3B82F6]">Default:</span> Blue</li>
        <li><span className="font-semibold text-[#FFFFFF]">Hover:</span> White</li>
        <li><span className="font-semibold text-[#60A5FA]">Selected:</span> Light Blue</li>
      </ul>
       <p>Note: The specific color logic previously discussed (based on type keywords) is currently implemented in the <code className='text-xs bg-neutral-700 px-1 py-0.5 rounded'>SchoolMarker</code> shader implementation which is not active. The colors you see now are based on the interaction state (default, hover, selected).</p>
    </div>
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
          <D3VisualizationContainer />
          <Sidebar />
      <Analytics />
      <SpeedInsights />

      {/* Help Icon Button - Bottom Left */}
      <Button
        isIconOnly // Renders button as a circle for the icon
        aria-label="Color Legend Help"
        onPress={onOpen} // Opens the modal on press
        className="fixed bottom-5 left-5 z-50 bg-black/30 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/50 transition-colors duration-200"
        size="lg" // Makes the button larger (adjust padding/size if needed)
      >
        <FiHelpCircle size={24} />
      </Button>

      {/* GitHub Icon Link - Bottom Right */}
      {/* Use NextUI Link component for better integration/styling */}
      <Button
        as={Link} // Render the button as a link
        href={githubUrl}
        isExternal // Adds rel="noopener noreferrer" and target="_blank"
        isIconOnly
        aria-label="View project on GitHub"
        className="fixed bottom-5 right-5 z-50 bg-black/30 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/50 transition-colors duration-200"
        size="lg" // Match size with help button
      >
        <FiGithub size={24} />
      </Button>

      {/* Help Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur" // Use blur backdrop
        size="md" // Adjusted size
      >
        <ModalContent className="bg-neutral-900/80 backdrop-blur-md text-neutral-200">
          {(onClose: () => void) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-lg font-semibold border-b border-neutral-700/50">Marker Color Legend</ModalHeader>
              <ModalBody className="py-4">
                {colorExplanation}
              </ModalBody>
              <ModalFooter className="border-t border-neutral-700/50">
                <Button color="primary" variant="flat" onPress={onClose} className="text-blue-400">
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </main>
  )
}

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'de' }];
}