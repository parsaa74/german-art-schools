'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { motion } from 'framer-motion'
import { germanArtMovements, ArtMovement } from '@/utils/artMovements' // Import ArtMovement type if available, or define inline
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore' // Import ProcessedUniversity

// Removed local ArtMovement interface definition as it's imported now

interface D3TimelineProps {
  width: number
  height: number
  onTimelineFilter?: (years: [number, number] | null) => void
}

export default function D3Timeline({ width, height, onTimelineFilter }: D3TimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { processedUniversities } = useSchoolStore()
  const [isVisible, setIsVisible] = useState(false)
  const [activeRange, setActiveRange] = useState<[number, number] | null>(null)
  
  // Extract founding years from universities
  const foundingYears = processedUniversities
    .map(uni => uni.founded ? parseInt(uni.founded) : null)
    .filter(year => year !== null) as number[]
  
  // Add Bauhaus-inspired color scale
  const bauhausColors = ["#D40000", "#F0C808", "#004699", "#00A36C", "#FFFFFF", "#000000"]
  const colorScale = d3.scaleOrdinal<string, string>(bauhausColors)
  
  // Set up timeline data
  useEffect(() => {
    // == DEBUG TIMELINE: Log entry and foundingYears length ==
    console.log(`D3Timeline DEBUG: useEffect entered. foundingYears.length: ${foundingYears.length}`);

    if (!svgRef.current || foundingYears.length === 0) {
      // == DEBUG TIMELINE: Log if exiting early ==
      console.warn('D3Timeline DEBUG: Exiting useEffect early (no SVG ref or no founding years).');
      return;
    }

    // == DEBUG TIMELINE: Log after check, confirming rendering logic is reached ==
    console.log('D3Timeline DEBUG: Proceeding with timeline rendering logic...');

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // Clear previous content
    
    const margin = { top: 20, right: 30, bottom: 30, left: 40 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    
    // Create a group for the timeline
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    // Set up scales
    const minYear = Math.min(...foundingYears, ...germanArtMovements.map(m => m.startYear))
    const maxYear = Math.max(...foundingYears, ...germanArtMovements.map(m => m.endYear))
    const xScale = d3.scaleLinear()
      .domain([minYear - 10, maxYear + 10])
      .range([0, innerWidth])
    
    // Add x-axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => `${d}`)
      .ticks(10)
    
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
        .attr('fill', '#A7CBFF')
        .attr('font-size', '10px')
        .style('font-family', 'Inter, sans-serif')

    // Apply fade-in to axis
    g.select('.x-axis')
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay(200)
      .attr('opacity', 1);

    // Add art movement periods
    const movementHeight = innerHeight * 0.6;
    
    const movementGroup = g.append('g').attr('class', 'art-movements');

    movementGroup.selectAll('.movement-rect')
      .data(germanArtMovements)
      .enter()
      .append('rect')
        .attr('class', 'movement-rect')
        .attr('x', d => xScale(d.startYear))
        .attr('y', 0)
        .attr('width', d => xScale(d.endYear) - xScale(d.startYear))
        .attr('height', movementHeight)
        .attr('fill', d => colorScale(d.name))
        .attr('rx', 4)
        .attr('ry', 4)
        // Initial state for animation
        .attr('opacity', 0)
        .attr('stroke', 'none')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          const isActive = activeRange && activeRange[0] === d.startYear && activeRange[1] === d.endYear;
          if (!isActive) { // Only transition if not already active
            d3.select(this)
              .transition().duration(250).ease(d3.easeCubicInOut) // Smoother transition
              .attr('opacity', 0.6) // Increase opacity on hover
              .attr('stroke', 'rgba(255, 255, 255, 0.5)');
          }
        })
        .on('mouseout', function(event, d) {
          const isActive = activeRange && activeRange[0] === d.startYear && activeRange[1] === d.endYear;
          if (!isActive) { // Only transition back if not active
            d3.select(this)
              .transition().duration(250).ease(d3.easeCubicInOut) // Smoother transition
              .attr('opacity', 0.4) // Return to base opacity
              .attr('stroke', 'none');
          }
        })
        .on('click', function(event, d) {
          const newRange: [number, number] = [d.startYear, d.endYear];
          if (activeRange &&
              activeRange[0] === newRange[0] &&
              activeRange[1] === newRange[1]) {
            // If clicking the same range, clear the filter
            setActiveRange(null)
            if (onTimelineFilter) onTimelineFilter(null)
          } else {
            // Set new filter range
            setActiveRange(newRange);
            if (onTimelineFilter) onTimelineFilter(newRange);
          }
        });

    // Apply active state styling initially and on change with smoother transition
    const updateActiveStyle = () => {
      movementGroup.selectAll<SVGRectElement, ArtMovement>('.movement-rect') // Type selection data
        .transition().duration(300).ease(d3.easeCubicInOut) // Smoother transition
        .attr('opacity', (d: ArtMovement) => (activeRange && activeRange[0] === d.startYear && activeRange[1] === d.endYear) ? 0.7 : 0.4)
        .attr('stroke', (d: ArtMovement) => (activeRange && activeRange[0] === d.startYear && activeRange[1] === d.endYear) ? 'rgba(255, 255, 255, 0.8)' : 'none');
    };
    updateActiveStyle(); // Initial application

    // Add movement labels
    movementGroup.selectAll('.movement-label')
      .data(germanArtMovements)
      .enter()
      .append('text')
        .attr('class', 'movement-label')
        .attr('x', d => xScale(d.startYear) + (xScale(d.endYear) - xScale(d.startYear)) / 2)
        .attr('y', movementHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#E0E0E0')
        .attr('font-size', '9px')
        .attr('font-weight', '500')
        .style('font-family', 'Inter, sans-serif')
        .attr('pointer-events', 'none')
        .text(d => d.name)
        // Initial state for animation
        .attr('opacity', 0);

    // Apply fade-in animation to movements and labels
    movementGroup.selectAll<SVGRectElement, ArtMovement>('.movement-rect') // Type selection data
      .transition()
      .duration(500)
      .delay((d: ArtMovement, i: number) => 300 + i * 50) // Staggered delay after axis
      .attr('opacity', (d: ArtMovement) => (activeRange && activeRange[0] === d.startYear && activeRange[1] === d.endYear) ? 0.7 : 0.4); // Use updated opacity

    movementGroup.selectAll<SVGTextElement, ArtMovement>('.movement-label') // Type selection data
      .transition()
      .duration(500)
      .delay((d: ArtMovement, i: number) => 350 + i * 50) // Staggered delay
      .attr('opacity', 1);


    // Add school founding year points
    const pointsGroup = g.append('g').attr('class', 'founding-points');

    pointsGroup.selectAll('.founding-point')
      .data(processedUniversities.filter(uni => uni.founded))
      .enter()
      .append('circle')
      .attr('class', 'founding-point')
      .attr('cx', d => xScale(parseInt(d.founded!)))
      .attr('cy', innerHeight - 10)
      .attr('r', 3.5)
      // Use updated color scale for points
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', 'rgba(255, 255, 255, 0.5)') // Softer stroke
      .attr('stroke-width', 0.5)
      // Initial state for animation
      .attr('opacity', 0)
      .attr('transform', `translate(0, 10)`); // Start slightly lower

    // Apply fade-in and move-up animation to points with smoother easing
    pointsGroup.selectAll<SVGCircleElement, ProcessedUniversity>('.founding-point') // Type selection data
      .transition()
      .duration(700) // Slightly longer duration
      .delay((d: ProcessedUniversity, i: number) => 500 + Math.random() * 350) // Slightly adjusted delay
      .ease(d3.easeCubicOut) // Smoother easing
      .attr('opacity', 0.7) // Slightly transparent
      .attr('transform', 'translate(0, 0)');

    console.log('D3Timeline foundingYears:', foundingYears);
    console.log('D3Timeline germanArtMovements:', germanArtMovements);
    if (foundingYears.length === 0) {
        console.warn('D3Timeline: No founding years found, timeline may not render.');
    }

  }, [width, height, processedUniversities, foundingYears, activeRange, onTimelineFilter]) // Added updateActiveStyle dependency implicitly via activeRange

  // Helper function to get node color (uses Bauhaus scale)
  const getNodeColor = (uni: ProcessedUniversity, opacity = 1): string => {
    const baseColor = colorScale(uni.id)
    const rgb = hexToRgb(baseColor)
    return `rgba(${rgb}, ${opacity})`
  }

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex: string): string => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };
  
  // Show the timeline after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <motion.div
      className="timeline-container font-inter mt-6 p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-blue-500/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : 20
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-white">
          German Art Movements Timeline
        </h3>
        {activeRange && (
          <button
            className="text-xs text-blue-300 hover:text-blue-200 transition-colors"
            onClick={() => {
              setActiveRange(null)
              if (onTimelineFilter) onTimelineFilter(null)
            }}
          >
            Clear Filter
          </button>
        )}
      </div>
      
      <div className="text-xs text-blue-200/70 mb-2">
        Click on an art movement to filter schools
      </div>
      
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="timeline-svg"
      />
    </motion.div>
  )
}
