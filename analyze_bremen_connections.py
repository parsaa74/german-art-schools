#!/usr/bin/env python3
"""
Analyze connections for Hochschule für Künste Bremen based on enhanced dataset
"""

import json
import math

def calculate_similarity(bremen, other_uni, other_name):
    """Calculate similarity score between Bremen and another university"""
    
    similarity = 0
    details = []
    
    # 1. Program type similarity (weight: 3.0)
    bremen_programs = set(p.get('name', '') for p in bremen.get('programs', []))
    other_programs = set(p.get('name', '') for p in other_uni.get('programs', []))
    shared_programs = len(bremen_programs.intersection(other_programs))
    if shared_programs > 0:
        similarity += shared_programs * 3.0
        details.append(f"Shared programs: {shared_programs} (score: +{shared_programs * 3.0})")
    
    # 2. Specialization similarity (weight: 2.0)
    bremen_specs = set()
    for program in bremen.get('programs', []):
        bremen_specs.update(program.get('specializations', []))
    
    other_specs = set()
    for program in other_uni.get('programs', []):
        other_specs.update(program.get('specializations', []))
    
    shared_specs = len(bremen_specs.intersection(other_specs))
    if shared_specs > 0:
        similarity += shared_specs * 2.0
        details.append(f"Shared specializations: {shared_specs} (score: +{shared_specs * 2.0})")
    
    # 3. Ranking similarity (weight: 1.5)
    bremen_rank = bremen.get('ranking', {}).get('national')
    other_rank = other_uni.get('ranking', {}).get('national')
    if bremen_rank and other_rank:
        rank_diff = abs(bremen_rank - other_rank)
        if rank_diff <= 20:
            rank_similarity = max(0, 20 - rank_diff) / 20
            similarity += rank_similarity * 1.5
            details.append(f"Ranking similarity: {rank_similarity:.2f} (score: +{rank_similarity * 1.5:.2f})")
    
    # 4. Student body similarity (weight: 1.0)
    bremen_students = bremen.get('stats', {}).get('students')
    other_students = other_uni.get('stats', {}).get('students')
    if bremen_students and other_students:
        student_ratio = min(bremen_students, other_students) / max(bremen_students, other_students)
        if student_ratio > 0.4:
            similarity += student_ratio * 1.0
            details.append(f"Student body similarity: {student_ratio:.2f} (score: +{student_ratio * 1.0:.2f})")
    
    # 5. Selectivity similarity (weight: 1.2)
    bremen_rate = bremen.get('stats', {}).get('acceptance_rate')
    other_rate = other_uni.get('stats', {}).get('acceptance_rate')
    if bremen_rate and other_rate:
        rate_diff = abs(bremen_rate - other_rate)
        if rate_diff <= 0.3:
            selectivity_sim = max(0, 0.3 - rate_diff) / 0.3
            similarity += selectivity_sim * 1.2
            details.append(f"Selectivity similarity: {selectivity_sim:.2f} (score: +{selectivity_sim * 1.2:.2f})")
    
    # 6. Type similarity (weight: 2.0)
    bremen_type = bremen.get('type', '')
    other_type = other_uni.get('type', '')
    if bremen_type == other_type:
        similarity += 2.0
        details.append(f"Same type ({bremen_type}): +2.0")
    
    # 7. Geographic proximity (for 3D positioning)
    bremen_coords = bremen.get('coordinates', {})
    other_coords = other_uni.get('coordinates', {})
    distance = None
    if bremen_coords.get('lat') and other_coords.get('lat'):
        lat1, lng1 = bremen_coords['lat'], bremen_coords['lng']
        lat2, lng2 = other_coords['lat'], other_coords['lng']
        # Simple distance calculation
        distance = math.sqrt((lat2 - lat1)**2 + (lng2 - lng1)**2)
    
    return similarity, details, distance

def main():
    print("🔍 Analyzing connections for Hochschule für Künste Bremen")
    print("=" * 60)
    
    # Load data
    with open('src/data/enhanced_german_art_schools.json', 'r') as f:
        data = json.load(f)
    
    universities = data['universities']
    bremen = universities['Hochschule für Künste Bremen']
    
    print("📊 Bremen University Profile:")
    print(f"   Type: {bremen.get('type')}")
    print(f"   National Ranking: {bremen.get('ranking', {}).get('national')}")
    print(f"   Students: {bremen.get('stats', {}).get('students')}")
    print(f"   Acceptance Rate: {bremen.get('stats', {}).get('acceptance_rate')}")
    print(f"   Programs: {len(bremen.get('programs', []))}")
    print(f"   Founded: {bremen.get('stats', {}).get('founded')}")
    print(f"   State: {bremen.get('state')}")
    print(f"   NC-frei: {bremen.get('ncFrei')}")
    
    # Bremen's specializations
    bremen_specs = set()
    for program in bremen.get('programs', []):
        bremen_specs.update(program.get('specializations', []))
    print(f"   Key Specializations: {', '.join(list(bremen_specs)[:8])}")
    
    print("\n🔗 Top Connected Universities (D3 Mode):")
    print("-" * 50)
    
    # Calculate similarities
    connections = []
    for name, uni in universities.items():
        if name != 'Hochschule für Künste Bremen':
            similarity, details, distance = calculate_similarity(bremen, uni, name)
            if similarity > 1.0:  # Only consider meaningful connections
                connections.append({
                    'name': name,
                    'similarity': similarity,
                    'details': details,
                    'distance': distance,
                    'ranking': uni.get('ranking', {}).get('national'),
                    'type': uni.get('type'),
                    'students': uni.get('stats', {}).get('students'),
                    'state': uni.get('state')
                })
    
    # Sort by similarity
    connections.sort(key=lambda x: x['similarity'], reverse=True)
    
    # Show top connections
    for i, conn in enumerate(connections[:15], 1):
        print(f"{i:2d}. {conn['name']}")
        print(f"    Similarity Score: {conn['similarity']:.1f}")
        print(f"    Type: {conn['type']} | Ranking: {conn['ranking']} | Students: {conn['students']}")
        print(f"    State: {conn['state']}")
        for detail in conn['details'][:3]:  # Show top 3 similarity factors
            print(f"    • {detail}")
        print()
    
    print("\n🌍 Geographic Clusters (3D Mode):")
    print("-" * 40)
    
    # Sort by geographic distance for 3D positioning
    geographic_neighbors = [c for c in connections if c['distance'] is not None]
    geographic_neighbors.sort(key=lambda x: x['distance'])
    
    print("Universities that should appear closer in 3D space:")
    for i, conn in enumerate(geographic_neighbors[:10], 1):
        print(f"{i:2d}. {conn['name']} (Distance: {conn['distance']:.2f}°)")
        print(f"    State: {conn['state']} | Type: {conn['type']}")
    
    print("\n📈 Specialized Clusters:")
    print("-" * 25)
    
    # Group by specialization overlap
    media_unis = [c for c in connections if any('Media' in d or 'Digital' in d or 'Interactive' in d for d in c['details'])]
    design_unis = [c for c in connections if any('Design' in d for d in c['details'])]
    arts_unis = [c for c in connections if any('Art' in d or 'Fine' in d for d in c['details'])]
    
    print(f"🎨 Digital Media Cluster: {len(media_unis)} universities")
    for uni in media_unis[:5]:
        print(f"   • {uni['name']} (Score: {uni['similarity']:.1f})")
    
    print(f"\n🎭 Design Cluster: {len(design_unis)} universities")
    for uni in design_unis[:5]:
        print(f"   • {uni['name']} (Score: {uni['similarity']:.1f})")
    
    print(f"\n🖼️  Fine Arts Cluster: {len(arts_unis)} universities")
    for uni in arts_unis[:5]:
        print(f"   • {uni['name']} (Score: {uni['similarity']:.1f})")

if __name__ == "__main__":
    main() 