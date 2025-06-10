import json

def test_enhanced_features():
    """Test script demonstrating the enhanced dataset capabilities"""
    
    with open('src/data/enhanced_german_art_schools.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("=== ENHANCED DATASET FEATURE DEMONSTRATION ===\n")
    
    # 1. Employment Outcome Analysis
    print("1. EMPLOYMENT OUTCOME ANALYSIS")
    print("-" * 40)
    employment_rates = []
    for name, inst in data['universities'].items():
        if 'employment_outcomes' in inst:
            rate = inst['employment_outcomes']['employment_rate_1_year']
            employment_rates.append((name, rate))
    
    # Sort by employment rate
    employment_rates.sort(key=lambda x: x[1], reverse=True)
    print("Top 5 institutions by 1-year employment rate:")
    for i, (name, rate) in enumerate(employment_rates[:5]):
        print(f"  {i+1}. {name}: {rate:.1%}")
    
    # 2. Financial Accessibility Analysis
    print("\n2. FINANCIAL ACCESSIBILITY ANALYSIS")
    print("-" * 40)
    living_costs = []
    for name, inst in data['universities'].items():
        if 'financial_data' in inst:
            cost = inst['financial_data']['living_costs_city']
            city = inst.get('city', 'Unknown')
            living_costs.append((city, cost))
    
    # Sort by cost
    living_costs.sort(key=lambda x: x[1])
    print("Most affordable cities for studying (top 5):")
    for i, (city, cost) in enumerate(living_costs[:5]):
        print(f"  {i+1}. {city}: €{cost}/month")
    
    # 3. International Profile Analysis
    print("\n3. INTERNATIONAL PROFILE ANALYSIS")
    print("-" * 40)
    intl_students = []
    for name, inst in data['universities'].items():
        if 'international_profile' in inst:
            percentage = inst['international_profile']['international_students_percentage']
            intl_students.append((name, percentage))
    
    intl_students.sort(key=lambda x: x[1], reverse=True)
    print("Most international institutions (top 5):")
    for i, (name, percentage) in enumerate(intl_students[:5]):
        print(f"  {i+1}. {name}: {percentage:.1%} international students")
    
    # 4. Sustainability Leadership
    print("\n4. SUSTAINABILITY LEADERSHIP")
    print("-" * 40)
    sustainability_scores = []
    for name, inst in data['universities'].items():
        if 'sustainability' in inst:
            renewable = inst['sustainability']['renewable_energy_percentage']
            carbon_target = inst['sustainability']['carbon_neutral_target']
            # Create composite sustainability score
            score = renewable * 0.6 + (2040 - carbon_target) / 20 * 0.4
            sustainability_scores.append((name, score, carbon_target))
    
    sustainability_scores.sort(key=lambda x: x[1], reverse=True)
    print("Sustainability leaders (top 5):")
    for i, (name, score, target) in enumerate(sustainability_scores[:5]):
        print(f"  {i+1}. {name}: Carbon neutral by {target}")
    
    # 5. Research & Innovation Excellence
    print("\n5. RESEARCH & INNOVATION EXCELLENCE")
    print("-" * 40)
    research_scores = []
    for name, inst in data['universities'].items():
        if 'research_innovation' in inst:
            projects = inst['research_innovation']['research_projects_active']
            funding = inst['research_innovation']['research_funding_millions']
            # Create composite research score
            score = projects * 0.3 + funding * 0.7
            research_scores.append((name, score, projects, funding))
    
    research_scores.sort(key=lambda x: x[1], reverse=True)
    print("Research powerhouses (top 5):")
    for i, (name, score, projects, funding) in enumerate(research_scores[:5]):
        print(f"  {i+1}. {name}: {projects} projects, €{funding}M funding")
    
    # 6. Digital Infrastructure Leaders
    print("\n6. DIGITAL INFRASTRUCTURE LEADERS")
    print("-" * 40)
    digital_scores = []
    for name, inst in data['universities'].items():
        if 'digital_infrastructure' in inst:
            labs = inst['digital_infrastructure']['digital_fabrication_labs']
            vr_ar = inst['digital_infrastructure']['vr_ar_facilities']
            budget = inst['digital_infrastructure']['tech_equipment_budget_per_student']
            # Create composite digital score
            score = labs * 10 + vr_ar * 5 + budget * 0.01
            digital_scores.append((name, score, labs, vr_ar, budget))
    
    digital_scores.sort(key=lambda x: x[1], reverse=True)
    print("Digital infrastructure leaders (top 5):")
    for i, (name, score, labs, vr_ar, budget) in enumerate(digital_scores[:5]):
        print(f"  {i+1}. {name}: {labs} fab labs, {vr_ar} VR/AR facilities, €{budget}/student")
    
    # 7. Relationship Network Analysis
    print("\n7. INSTITUTIONAL NETWORK ANALYSIS")
    print("-" * 40)
    collaborations = data.get('relationships', {}).get('academic_collaborations', [])
    print(f"Academic collaboration network: {len(collaborations)} partnerships")
    
    # Count institution appearances in collaborations
    collaboration_counts = {}
    for collab in collaborations:
        inst1, inst2, strength = collab
        collaboration_counts[inst1] = collaboration_counts.get(inst1, 0) + 1
        collaboration_counts[inst2] = collaboration_counts.get(inst2, 0) + 1
    
    # Sort by collaboration count
    sorted_collabs = sorted(collaboration_counts.items(), key=lambda x: x[1], reverse=True)
    print("Most connected institutions:")
    for i, (name, count) in enumerate(sorted_collabs[:5]):
        print(f"  {i+1}. {name}: {count} collaborations")
    
    # 8. Cluster Analysis
    print("\n8. INSTITUTIONAL CLUSTERING")
    print("-" * 40)
    clusters = data.get('similarity_matrix', {}).get('program_overlap', {})
    for cluster_name, institutions in clusters.items():
        print(f"{cluster_name.replace('_', ' ').title()}: {len(institutions)} institutions")
        for inst in institutions[:3]:  # Show first 3
            print(f"  - {inst}")
        if len(institutions) > 3:
            print(f"  ... and {len(institutions) - 3} more")
    
    print("\n=== FEATURE DEMONSTRATION COMPLETE ===")
    print("The enhanced dataset provides comprehensive analytics across all dimensions!")

if __name__ == "__main__":
    test_enhanced_features()