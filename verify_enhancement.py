#!/usr/bin/env python3
"""
Verify Enhanced Dataset Integration in Visualizations
"""

import json
import os

def main():
    print("🔍 Verifying Enhanced Dataset Integration")
    print("=" * 50)
    
    # 1. Check enhanced data
    try:
        with open('src/data/enhanced_german_art_schools.json', 'r') as f:
            data = json.load(f)
        
        unis = data['universities']
        sample_uni = list(unis.values())[0]
        
        print("✅ Enhanced data loaded successfully")
        print(f"   Universities: {len(unis)}")
        print(f"   Sample university fields: {list(sample_uni.keys())}")
        
        # Check for key enhanced fields
        has_ranking = 'ranking' in sample_uni
        has_stats = 'stats' in sample_uni
        has_coords = 'coordinates' in sample_uni
        
        print(f"   Has ranking: {has_ranking}")
        print(f"   Has stats: {has_stats}")
        print(f"   Has coordinates: {has_coords}")
        
    except Exception as e:
        print(f"❌ Failed to load enhanced data: {e}")
        return
    
    # 2. Check store integration
    try:
        with open('src/stores/schoolStore.ts', 'r') as f:
            store = f.read()
        
        # Key indicators of enhancement
        indicators = [
            ('ranking?:', 'ranking field in interface'),
            ('stats?:', 'stats field in interface'),
            ('prestigeScore', 'prestige calculation'),
            ('popularityScore', 'popularity calculation'),
            ('specializationVector', 'specialization vector')
        ]
        
        print("\n📊 Store Enhancement Status:")
        for indicator, desc in indicators:
            status = "✅" if indicator in store else "❌"
            print(f"   {status} {desc}")
            
    except Exception as e:
        print(f"❌ Failed to check store: {e}")
        return
    
    # 3. Check D3 visualization
    try:
        with open('src/components/visualization/D3NetworkGraph.fixed.tsx', 'r') as f:
            d3_viz = f.read()
        
        print("\n🎯 D3 Visualization Enhancements:")
        
        # Enhanced node sizing
        node_factors = ['prestigeFactor', 'studentFactor', 'programFactor']
        for factor in node_factors:
            status = "✅" if factor in d3_viz else "❌"
            print(f"   {status} {factor} in node sizing")
        
        # Enhanced connections
        connection_types = ['rankingSimilarity', 'studentSimilarity', 'selectivitySimilarity']
        for conn in connection_types:
            status = "✅" if conn in d3_viz else "❌"
            print(f"   {status} {conn} in connections")
            
    except Exception as e:
        print(f"❌ Failed to check D3 visualization: {e}")
    
    # 4. Check 3D visualization
    try:
        with open('src/components/map/NetworkGraph.tsx', 'r') as f:
            network_viz = f.read()
        
        print("\n🌐 3D Network Enhancements:")
        
        # Enhanced scaling
        if 'getNodeScale' in network_viz:
            print("   ✅ Enhanced node scaling function")
        else:
            print("   ❌ Basic node scaling")
        
        # Enhanced colors
        if 'prestigeBoost' in network_viz:
            print("   ✅ Prestige-based color enhancement")
        else:
            print("   ❌ Basic color system")
        
        # Enhanced positioning
        if 'coordinates?.lng' in network_viz:
            print("   ✅ Geographical positioning")
        else:
            print("   ❌ Random positioning")
        
        # Enhanced similarity
        similarity_checks = ['rankingDiff', 'rateDiff', 'sharedPrograms']
        found = sum(1 for check in similarity_checks if check in network_viz)
        print(f"   ✅ Similarity metrics: {found}/{len(similarity_checks)}")
            
    except Exception as e:
        print(f"❌ Failed to check 3D visualization: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Verification Complete!")
    
    # Summary
    total_unis = len(unis)
    unis_with_data = sum(1 for uni in unis.values() if uni.get('ranking') and uni.get('stats'))
    coverage = unis_with_data / total_unis * 100
    
    print(f"\n📈 Data Coverage: {coverage:.1f}% of universities have enhanced data")
    
    if coverage >= 90:
        print("🏆 EXCELLENT coverage!")
    elif coverage >= 70:
        print("👍 GOOD coverage!")
    elif coverage >= 50:
        print("👌 DECENT coverage!")
    else:
        print("⚠️  LOW coverage!")

if __name__ == "__main__":
    main()