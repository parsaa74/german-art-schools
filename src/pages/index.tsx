import { Box, Flex } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';

// Dynamic import of GermanyGlobe component (no SSR)
const GermanyGlobe = dynamic(() => import('@/components/Map/GermanyGlobe'), {
  ssr: false,
  loading: () => <Box>Loading visualization...</Box>
});

export default function Home() {
  return (
    <Flex h="100vh" w="100vw">
      <Sidebar />
      <Box flex={1} bg="#1C1C1E">
        <GermanyGlobe />
      </Box>
    </Flex>
  );
} 