import { ProcessedUniversity } from '@/stores/schoolStore';
import * as THREE from 'three';

// Weight factors for different relationship types
const RELATIONSHIP_WEIGHTS = {
  type: 0.25,
  location: 0.15,
  ranking: 0.15,
  programs: 0.20,
  prestige: 0.10,
  size: 0.10,
  founded: 0.05
};

// Calculate geographic distance between two universities
function calculateGeographicDistance(uni1: ProcessedUniversity, uni2: ProcessedUniversity): number {
  if (!uni1.location || !uni2.location) return 1;
  
  const [lat1, lng1] = uni1.location;
  const [lat2, lng2] = uni2.location;
  
  // Haversine formula for distance
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate type similarity
function calculateTypeSimilarity(uni1: ProcessedUniversity, uni2: ProcessedUniversity): number {
  if (uni1.type === uni2.type) return 1;
  
  // Create type similarity matrix
  const typeSimilarities: { [key: string]: { [key: string]: number } } = {
    'kunsthochschule': { 'art_academy': 0.9, 'university_of_arts': 0.8, 'academy': 0.7 },
    'art_academy': { 'kunsthochschule': 0.9, 'university_of_arts': 0.8, 'academy': 0.7 },
    'university_of_arts': { 'kunsthochschule': 0.8, 'art_academy': 0.8, 'film_university': 0.6 },
    'design_school': { 'kunsthochschule': 0.6, 'university_of_applied_sciences': 0.5 },
    'film_university': { 'university_of_arts': 0.6, 'media_arts': 0.7 },
    'university_of_applied_sciences': { 'design_school': 0.5, 'university': 0.4 }
  };
  
  return typeSimilarities[uni1.type]?.[uni2.type] || 
         typeSimilarities[uni2.type]?.[uni1.type] || 0.1;
}

// Calculate ranking similarity
function calculateRankingSimilarity(uni1: ProcessedUniversity, uni2: ProcessedUniversity): number {
  if (!uni1.ranking?.national || !uni2.ranking?.national) return 0.5;
  
  const rankDiff = Math.abs(uni1.ranking.national - uni2.ranking.national);
  // Closer rankings = higher similarity
  return Math.max(0, 1 - (rankDiff / 50)); // Normalize to 50 rank difference
}

// Calculate program overlap similarity
function calculateProgramSimilarity(uni1: ProcessedUniversity, uni2: ProcessedUniversity): number {
  if (!uni1.programs || !uni2.programs) return 0.3;
  
  const programs1 = new Set(uni1.programs.map(p => p.name.toLowerCase()));
  const programs2 = new Set(uni2.programs.map(p => p.name.toLowerCase()));
  
  const intersection = new Set([...programs1].filter(x => programs2.has(x)));
  const union = new Set([...programs1, ...programs2]);
  
  // Jaccard similarity
  return intersection.size / union.size;
}

// Calculate specialization overlap
function calculateSpecializationSimilarity(uni1: ProcessedUniversity, uni2: ProcessedUniversity): number {
  if (!uni1.specializationVector || !uni2.specializationVector) return 0.3;
  
  const specs1 = new Set(uni1.specializationVector.map(s => s.toLowerCase()));
  const specs2 = new Set(uni2.specializationVector.map(s => s.toLowerCase()));
  
  const intersection = new Set([...specs1].filter(x => specs2.has(x)));
  const union = new Set([...specs1, ...specs2]);
  
  if (union.size === 0) return 0.3;
  return intersection.size / union.size;
}

// Calculate prestige similarity
function calculatePrestigeSimilarity(uni1: ProcessedUniversity, uni2: ProcessedUniversity): number {
  if (!uni1.prestigeScore || !uni2.prestigeScore) return 0.5;
  
  const prestigeDiff = Math.abs(uni1.prestigeScore - uni2.prestigeScore);
  return Math.max(0, 1 - (prestigeDiff / 100));
}

// Calculate size similarity
function calculateSizeSimilarity(uni1: ProcessedUniversity, uni2: ProcessedUniversity): number {
  if (!uni1.stats?.students || !uni2.stats?.students) return 0.5;
  
  const ratio = Math.min(uni1.stats.students, uni2.stats.students) / 
                Math.max(uni1.stats.students, uni2.stats.students);
  return ratio;
}

// Calculate founding period similarity
function calculateFoundedSimilarity(uni1: ProcessedUniversity, uni2: ProcessedUniversity): number {
  if (!uni1.stats?.founded || !uni2.stats?.founded) return 0.5;
  
  const yearDiff = Math.abs(uni1.stats.founded - uni2.stats.founded);
  // Universities founded within 50 years are considered similar
  return Math.max(0, 1 - (yearDiff / 100));
}

// Main function to calculate overall relationship score
export function calculateUniversityRelationship(uni1: ProcessedUniversity, uni2: ProcessedUniversity): number {
  if (uni1.name === uni2.name) return 0; // Same university
  
  // Calculate individual similarities
  const typeSim = calculateTypeSimilarity(uni1, uni2);
  const geoDistance = calculateGeographicDistance(uni1, uni2);
  const geoSim = Math.max(0, 1 - (geoDistance / 1000)); // Normalize to 1000km max
  const rankingSim = calculateRankingSimilarity(uni1, uni2);
  const programSim = calculateProgramSimilarity(uni1, uni2);
  const specializationSim = calculateSpecializationSimilarity(uni1, uni2);
  const prestigeSim = calculatePrestigeSimilarity(uni1, uni2);
  const sizeSim = calculateSizeSimilarity(uni1, uni2);
  const foundedSim = calculateFoundedSimilarity(uni1, uni2);
  
  // Combine program and specialization similarities
  const combinedProgramSim = (programSim + specializationSim) / 2;
  
  // Calculate weighted relationship score
  const relationshipScore = 
    (typeSim * RELATIONSHIP_WEIGHTS.type) +
    (geoSim * RELATIONSHIP_WEIGHTS.location) +
    (rankingSim * RELATIONSHIP_WEIGHTS.ranking) +
    (combinedProgramSim * RELATIONSHIP_WEIGHTS.programs) +
    (prestigeSim * RELATIONSHIP_WEIGHTS.prestige) +
    (sizeSim * RELATIONSHIP_WEIGHTS.size) +
    (foundedSim * RELATIONSHIP_WEIGHTS.founded);
  
  return Math.min(1, Math.max(0, relationshipScore));
}

// Calculate formation positions for universities around a selected university
export interface FormationPosition {
  university: ProcessedUniversity;
  position: THREE.Vector3;
  relationshipScore: number;
  category: 'very_close' | 'close' | 'related' | 'distant';
}

export function calculateFormationPositions(
  selectedUniversity: ProcessedUniversity,
  allUniversities: ProcessedUniversity[],
  selectedPosition: THREE.Vector3,
  radius: number
): FormationPosition[] {
  // Calculate relationships with the selected university
  const relationships = allUniversities
    .filter(uni => uni.name !== selectedUniversity.name)
    .map(uni => ({
      university: uni,
      relationshipScore: calculateUniversityRelationship(selectedUniversity, uni)
    }))
    .sort((a, b) => b.relationshipScore - a.relationshipScore);
  
  // Categorize relationships
  const formations: FormationPosition[] = [];
  
  relationships.forEach((rel, _index) => {
    const score = rel.relationshipScore;
    let category: FormationPosition['category'];
    let distance: number;
    let angleOffset: number;
    
    // Determine category and positioning parameters
    if (score > 0.7) {
      category = 'very_close';
      distance = radius * 1.5; // Very close orbit
      angleOffset = 0;
    } else if (score > 0.5) {
      category = 'close';
      distance = radius * 2.2; // Close orbit
      angleOffset = Math.PI / 6; // Slight angle offset
    } else if (score > 0.3) {
      category = 'related';
      distance = radius * 3.0; // Medium orbit
      angleOffset = Math.PI / 4;
    } else {
      category = 'distant';
      distance = radius * 4.0; // Far orbit
      angleOffset = Math.PI / 3;
    }
    
    // Calculate position in formation
    const categoryIndex = formations.filter(f => f.category === category).length;
    const totalInCategory = relationships.filter(r => {
      const s = r.relationshipScore;
      return (category === 'very_close' && s > 0.7) ||
             (category === 'close' && s > 0.5 && s <= 0.7) ||
             (category === 'related' && s > 0.3 && s <= 0.5) ||
             (category === 'distant' && s <= 0.3);
    }).length;
    
    // Create a spiral formation within each category
    const angle = (categoryIndex / Math.max(1, totalInCategory)) * Math.PI * 2 + angleOffset;
    const spiralRadius = distance + (categoryIndex * 0.2);
    
    // Calculate position relative to selected university
    const x = selectedPosition.x + Math.cos(angle) * spiralRadius;
    const y = selectedPosition.y + Math.sin(angle) * spiralRadius;
    const z = selectedPosition.z + (Math.sin(categoryIndex * 0.5) * radius * 0.3); // Add some Z variation
    
    formations.push({
      university: rel.university,
      position: new THREE.Vector3(x, y, z),
      relationshipScore: score,
      category
    });
  });
  
  return formations;
}

// Calculate the preferred position for a specific university in the formation
export function getFormationPositionForUniversity(
  university: ProcessedUniversity,
  selectedUniversity: ProcessedUniversity,
  selectedPosition: THREE.Vector3,
  radius: number
): THREE.Vector3 | null {
  if (university.name === selectedUniversity.name) {
    return selectedPosition; // Selected university stays in place
  }
  
  const relationshipScore = calculateUniversityRelationship(selectedUniversity, university);
  
  // Determine distance based on relationship
  let distance: number;
  if (relationshipScore > 0.7) {
    distance = radius * 1.5;
  } else if (relationshipScore > 0.5) {
    distance = radius * 2.2;
  } else if (relationshipScore > 0.3) {
    distance = radius * 3.0;
  } else {
    distance = radius * 4.0;
  }
  
  // Use a simple hash of the university name to create consistent positioning
  const hash = university.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const angle = (hash % 360) * (Math.PI / 180);
  
  const x = selectedPosition.x + Math.cos(angle) * distance;
  const y = selectedPosition.y + Math.sin(angle) * distance;
  const z = selectedPosition.z + (Math.sin(hash * 0.01) * radius * 0.2);
  
  return new THREE.Vector3(x, y, z);
} 