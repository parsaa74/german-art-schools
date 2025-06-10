#!/usr/bin/env python3
"""
Test script to verify 3D clustering enhancement based on similarity metrics
"""

import json

def test_bremen_connections():
    """Test which universities should cluster around Bremen in 3D mode"""
    
    print("🧪 Testing Enhanced 3D Clustering for Bremen")
    print("=" * 60)
    
    # Load enhanced data
    with open('src/data/enhanced_german_art_schools.json', 'r') as f:
        data = json.load(f)
    
    unis = data['universities']
    bremen = unis.get('Hochschule für Künste Bremen')
    
    if not bremen:
        print("❌ Bremen not found in dataset")
        return
    
    print(f"✅ Found Bremen: {bremen['city']}, {bremen['state']}")
    print(f"   - Type: {bremen['type']}")
    print(f"   - Ranking: {bremen['ranking']['national']}")
    print(f"   - Students: {bremen['stats']['students']}")
    print(f"   - Acceptance Rate: {bremen['stats']['acceptance_rate']}")
    print()
    
    # Calculate similarities for 3D clustering
    similarities = []
    
    for name, uni in unis.items():
        if name == 'Hochschule für Künste Bremen':
            continue
            
        similarity = 0
        details = []
        
        # 1. Type similarity (weight: 2.0)
        if bremen['type'] == uni['type']:
            similarity += 2.0
            details.append("Same type (+2.0)")
        
        # 2. Program overlap (weight: 3.0)
        bremen_programs = set(p.get('name', '') for p in bremen.get('programs', []))
        uni_programs = set(p.get('name', '') for p in uni.get('programs', []))
        shared = len(bremen_programs.intersection(uni_programs))
        if shared > 0:
            similarity += shared * 3.0
            details.append(f"Shared programs: {shared} (+{shared * 3.0})")
        
        # 3. Specialization overlap (weight: 4.0)
        bremen_spec = []
        for p in bremen.get('programs', []):
            bremen_spec.extend(p.get('specializations', []))
        
        uni_spec = []
        for p in uni.get('programs', []):
            uni_spec.extend(p.get('specializations', []))
        
        shared_spec = len(set(bremen_spec).intersection(set(uni_spec)))
        if shared_spec > 0:
            similarity += shared_spec * 4.0
            details.append(f"Shared specializations: {shared_spec} (+{shared_spec * 4.0})")
        
        # 4. Ranking proximity (weight: 1.5)
        if bremen['ranking'].get('national') and uni['ranking'].get('national'):
            rank_diff = abs(bremen['ranking']['national'] - uni['ranking']['national'])
            if rank_diff <= 10:
                rank_bonus = (10 - rank_diff) * 0.15
                similarity += rank_bonus
                details.append(f"Ranking proximity: {rank_diff} (+{rank_bonus:.2f})")
        
        # 5. Stats similarity (weight: 1.0)
        if bremen['stats'].get('students') and uni['stats'].get('students'):
            student_ratio = min(bremen['stats']['students'], uni['stats']['students']) / max(bremen['stats']['students'], uni['stats']['students'])
            if student_ratio > 0.5:
                similarity += student_ratio
                details.append(f"Student count similarity: {student_ratio:.2f} (+{student_ratio:.2f})")
        
        # 6. Acceptance rate similarity (weight: 1.0)
        if bremen['stats'].get('acceptance_rate') and uni['stats'].get('acceptance_rate'):
            rate_diff = abs(bremen['stats']['acceptance_rate'] - uni['stats']['acceptance_rate'])
            if rate_diff < 0.2:
                rate_bonus = (0.2 - rate_diff) * 5.0
                similarity += rate_bonus
                details.append(f"Acceptance rate similarity: {rate_diff:.3f} (+{rate_bonus:.2f})")
        
        # 7. Geographic proximity (weight: 1.0)
        if (bremen['coordinates'].get('lat') and uni['coordinates'].get('lat') and
            bremen['coordinates'].get('lng') and uni['coordinates'].get('lng')):
            lat_diff = abs(bremen['coordinates']['lat'] - uni['coordinates']['lat'])
            lng_diff = abs(bremen['coordinates']['lng'] - uni['coordinates']['lng'])
            distance = (lat_diff ** 2 + lng_diff ** 2) ** 0.5
            if distance < 5:
                geo_bonus = (5 - distance) * 0.2
                similarity += geo_bonus
                details.append(f"Geographic proximity: {distance:.2f} (+{geo_bonus:.2f})")
        
        if similarity >= 3.0:  # Minimum threshold for 3D clustering
            similarities.append({
                'name': name,
                'similarity': similarity,
                'details': details,
                'type': uni['type'],
                'city': uni['city']
            })
    
    # Sort by similarity
    similarities.sort(key=lambda x: x['similarity'], reverse=True)
    
    print("🎯 Universities that should be CLOSE to Bremen in 3D mode:")
    print("   (These should form a cluster around Bremen)")
    print()
    
    for i, sim in enumerate(similarities[:8]):
        print(f"{i+1:2d}. {sim['name']}")
        print(f"    Similarity: {sim['similarity']:.1f} | {sim['type']} | {sim['city']}")
        print(f"    Reasons: {', '.join(sim['details'])}")
        print()
    
    print(f"📊 Total universities that should cluster: {len(similarities)}")
    print(f"📏 Similarity range: {similarities[-1]['similarity']:.1f} to {similarities[0]['similarity']:.1f}")
    
    return similarities

if __name__ == "__main__":
    test_bremen_connections() 