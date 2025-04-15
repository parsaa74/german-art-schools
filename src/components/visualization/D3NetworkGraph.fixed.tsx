'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore'

// --- Interfaces ---
interface D3Node extends d3.SimulationNodeDatum {
  id: string
  name: string
  type: string
  state: string
  programCount: number
  university: ProcessedUniversity // Keep original data reference
  // Simulation properties (D3 adds these)
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null // Fixed position
  fy?: number | null // Fixed position
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node // D3 expects string IDs initially, then resolves to nodes
  target: string | D3Node
  value: number // Strength/importance of the link
  type: 'state' | 'type' // Type of connection
}

interface D3NetworkGraphProps {
  width?: number
  height?: number
  className?: string
}

// --- Constants ---
const DEFAULT_WIDTH = 800
const DEFAULT_HEIGHT = 600
const NODE_BASE_RADIUS = 6
const NODE_PROGRAM_SCALE = 0.5 // How much program count affects radius
const NODE_MAX_RADIUS = 15
const HOVER_SCALE = 1.3 // Slightly smaller hover scale
const SELECT_SCALE = 1.5 // Slightly smaller select scale
const LINK_BASE_WIDTH = 1
const LINK_VALUE_SCALE = 0.8

// --- Helper Functions ---
const getNodeColor = (type: string): string => {
  // More professional/muted palette
  const colors: Record<string, string> = {
    university: '#5c7cfa',    // Muted Blue
    art_academy: '#f5a623',   // Muted Orange/Yellow
    design_school: '#50e3c2',  // Teal/Turquoise
    music_academy: '#e4717a', // Muted Red/Pink
    film_school: '#bd10e0',    // Muted Purple/Magenta
    default: '#9b9b9b'        // Darker Gray
  }
  return colors[type] || colors.default
}

const getNodeRadius = (node: D3Node): number => {
  return Math.min(NODE_MAX_RADIUS, NODE_BASE_RADIUS + node.programCount * NODE_PROGRAM_SCALE)
}

// --- Component ---
export default function D3NetworkGraph({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  className = ''
}: D3NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null)
  const { processedUniversities, selectedUniversity, setSelectedUniversity } = useSchoolStore()

  const [nodes, setNodes] = useState<D3Node[]>([])
  const [links, setLinks] = useState<D3Link[]>([])

  // --- Data Processing --- Create nodes and links from store data
  useEffect(() => {
    if (!processedUniversities || processedUniversities.length === 0) {
      setNodes([])
      setLinks([])
      return
    }

    const newNodes: D3Node[] = processedUniversities.map(uni => ({
      id: uni.name, // Use name as unique ID
      name: uni.name,
      type: uni.type,
      state: uni.state,
      programCount: uni.programTypes?.length || 0,
      university: uni,
    }))

    const nodeMap = new Map(newNodes.map(n => [n.id, n]))

    const newLinks: D3Link[] = [] // Use a Set to avoid duplicate links
    const linkSet = new Set<string>()

    // Add links based on State
    const stateGroups: Record<string, string[]> = {}
    processedUniversities.forEach(uni => {
      if (!stateGroups[uni.state]) stateGroups[uni.state] = []
      stateGroups[uni.state].push(uni.name)
    })

    Object.values(stateGroups).forEach(group => {
      if (group.length > 1) {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const sourceId = group[i]
            const targetId = group[j]
            const linkKey = [sourceId, targetId].sort().join('--')
            if (!linkSet.has(linkKey)) {
                newLinks.push({ source: sourceId, target: targetId, value: 1.0, type: 'state' })
                linkSet.add(linkKey)
            }
          }
        }
      }
    })

    // Add links based on Type (weaker links)
    const typeGroups: Record<string, string[]> = {}
    processedUniversities.forEach(uni => {
      if (!typeGroups[uni.type]) typeGroups[uni.type] = []
      typeGroups[uni.type].push(uni.name)
    })

    Object.values(typeGroups).forEach(group => {
        if (group.length > 1) {
          for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
              const sourceId = group[i]
              const targetId = group[j]
              const linkKey = [sourceId, targetId].sort().join('--')
              if (!linkSet.has(linkKey)) {
                  newLinks.push({ source: sourceId, target: targetId, value: 0.5, type: 'type' })
                  linkSet.add(linkKey)
              }
            }
          }
        }
      })

    setNodes(newNodes)
    setLinks(newLinks)

  }, [processedUniversities])

  // --- D3 Simulation and Rendering Effect ---
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // Clear previous SVG content

    // Define gradients
    const defs = svg.append('defs');

    // Create a reusable radial gradient
    const radialGradient = defs.append('radialGradient')
        .attr('id', 'node-gradient')
        .attr('cx', '30%') // Offset center for a slight highlight effect
        .attr('cy', '30%')
        .attr('r', '70%'); // Radius of the gradient

    radialGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#ffffff') // Lighter center (keep this for highlight)
        .attr('stop-opacity', 0.7);

    radialGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'currentColor') // Use the node's base color for the outer part
        .attr('stop-opacity', 1);


    const g = svg.append('g').attr('class', 'graph-content');

    // --- Tooltip Setup (Simple Example) ---
    const tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '5px 10px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    // --- Simulation Setup ---
    simulationRef.current = d3.forceSimulation<D3Node>(nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(links)
        .id(d => d.id)
        .distance(l => 80 / l.value) // Shorter distance for stronger links
        .strength(l => 0.1 * l.value))
      .force('charge', d3.forceManyBody().strength(-150).distanceMax(width / 4)) // Adjusted charge
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.1))
      .force('collision', d3.forceCollide<D3Node>().radius(d => getNodeRadius(d) * 1.5 + 3).strength(0.8))
      .alphaTarget(0)
      .alphaDecay(0.03) // Slightly faster decay

    // --- Element Selection and Data Binding (using .join) ---
    const link = g.append('g')
      .attr('class', 'links')
      // Set a default stroke for the group (lighter for dark background)
      .attr('stroke', '#555') // Darker gray for links on dark bg
      .attr('stroke-opacity', 0.4)
      .selectAll<SVGLineElement, D3Link>('line')
      .data(links) // Specify element and datum type
      .join('line')
      // Apply type-specific stroke and opacity to the individual lines (adjust for dark bg)
      .attr('stroke', (d: D3Link) => d.type === 'state' ? '#777' : '#555') // Lighter grays
      .attr('stroke-opacity', (d: D3Link) => d.type === 'state' ? 0.6 : 0.4) // Slightly more opaque
      .attr('stroke-width', (d: D3Link) => Math.max(0.5, LINK_BASE_WIDTH + d.value * LINK_VALUE_SCALE))
      .attr('data-type', (d: D3Link) => d.type)

    const nodeGroup = g.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, D3Node>('g.node-container') // Specify element and datum type
      .data(nodes, (d: D3Node): string => d.id) // Explicitly type 'd' and return type for key function
      .join('g')
        .attr('class', 'node-container')
        .style('cursor', 'pointer')
        .call(drag(simulationRef.current!) as any) // Add non-null assertion for simulationRef.current and keep 'as any'

    // Add circle to the container group
    nodeGroup.append('circle')
        .attr('class', 'node-circle')
        .attr('r', d => getNodeRadius(d)) // Type is inferred correctly here now
        // Apply the gradient, using CSS variable for the outer color
        .attr('fill', 'url(#node-gradient)')
        .style('color', d => getNodeColor(d.type)) // Set CSS 'color' for the gradient's 'currentColor'
        .attr('stroke', '#1a1a1a') // Darker stroke for nodes on dark bg
        .attr('stroke-width', 1.5)

    // Add label to the container group
    nodeGroup.append('text')
        .attr('class', 'node-label')
        .text(d => d.name)
        .attr('x', 0) // Center horizontally initially
        .attr('y', d => getNodeRadius(d) + 12) // Position below the node
        .attr('dy', '0.35em') // Vertical alignment adjustment
        .attr('text-anchor', 'middle') // Center text horizontally
        .attr('font-family', 'Inter, sans-serif') // Use a clean font
        .attr('font-size', '9px')
        .attr('fill', '#ccc') // Light gray color for labels on dark bg
        .style('pointer-events', 'none') // Labels should not block interaction
        .style('opacity', 0.7); // Slightly transparent

    // --- Simulation Tick Handler ---
    simulationRef.current.on('tick', () => {
      link
        .attr('x1', d => (d.source as D3Node).x ?? 0)
        .attr('y1', d => (d.source as D3Node).y ?? 0)
        .attr('x2', d => (d.target as D3Node).x ?? 0)
        .attr('y2', d => (d.target as D3Node).y ?? 0)

      nodeGroup
        .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`) // Type is inferred correctly here now
    })

    // --- Interaction Handlers ---
    nodeGroup
      .on('click', (event, d) => {
        event.stopPropagation();
        // Toggle selection in the store
        setSelectedUniversity(selectedUniversity?.name === d.id ? null : d.university);
      })
      .on('mouseover', (event, d) => {
        // Show tooltip
        tooltip.style('visibility', 'visible').text(d.name)

        // Highlight node and neighbors
        nodeGroup.style('opacity', (n: D3Node) => isConnected(d, n) ? 1 : 0.3);
        nodeGroup.filter((n: D3Node) => n.id === d.id)
            .raise() // Bring hovered node to front
            .select('circle.node-circle')
            .transition().duration(100) // Faster transition
            .attr('r', getNodeRadius(d) * HOVER_SCALE)
            .attr('stroke-width', 2); // Slightly thicker stroke on hover

        // Adjust hover opacity and color
        // Make connected links slightly more opaque on hover
        link.style('stroke-opacity', (l: D3Link) => isLinkConnected(d, l) ? (l.type === 'state' ? 0.7 : 0.5) : 0.1);
        link.filter((l: D3Link) => isLinkConnected(d, l))
            .attr('stroke', '#87CEFA') // LightSkyBlue highlight for dark bg
            .attr('stroke-width', (l: D3Link) => Math.max(1, (LINK_BASE_WIDTH + l.value * LINK_VALUE_SCALE) * 1.2));

        // Make hovered label fully opaque
        nodeGroup.filter((n: D3Node) => n.id === d.id)
            .select('text.node-label')
            .style('opacity', 1.0);
      })
      .on('mousemove', (event) => {
          // Move tooltip
          tooltip.style('top', (event.pageY - 10) + 'px')
                 .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', () => {
        // Hide tooltip
        tooltip.style('visibility', 'hidden')

        // Restore default appearance
        nodeGroup.style('opacity', 1)
            .select('circle.node-circle')
            .transition().duration(100) // Faster transition
            .attr('r', (n: D3Node) => getNodeRadius(n))
            .attr('stroke-width', 1.5);

        // Restore default link appearance based on type
        link.style('stroke-opacity', (l: D3Link) => l.type === 'state' ? 0.6 : 0.4)
            .attr('stroke', (l: D3Link) => l.type === 'state' ? '#777' : '#555')
            .attr('stroke-width', (l: D3Link) => Math.max(0.5, LINK_BASE_WIDTH + l.value * LINK_VALUE_SCALE));

        // Restore label opacity and color
        nodeGroup.select('text.node-label')
            .attr('fill', '#ccc') // Ensure label color is reset
            .style('opacity', 0.7);

        // Re-apply selection styling if a node is selected
        updateSelectionStyle();
      });

    // --- Zoom Setup ---
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5]) // Zoom limits
      .on('zoom', (event) => {
        g.attr('transform', event.transform); // Apply zoom transform to the main group
      });

    svg.call(zoom);

    // Initial zoom transform (optional)
    // svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8))

    // --- Helper Functions for Interactions ---
    const linkedByIndex = new Map<string, boolean>()
    links.forEach(l => {
      const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
      const targetId = typeof l.target === 'string' ? l.target : l.target.id;
      linkedByIndex.set(`${sourceId},${targetId}`, true)
    })

    function isConnected(a: D3Node, b: D3Node): boolean {
      return a.id === b.id || linkedByIndex.has(`${a.id},${b.id}`) || linkedByIndex.has(`${b.id},${a.id}`)
    }

    function isLinkConnected(node: D3Node, link: D3Link): boolean {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        return sourceId === node.id || targetId === node.id;
    }

    // --- Drag Handling ---
    function drag(simulation: d3.Simulation<D3Node, D3Link>) {
      function dragstarted(event: d3.D3DragEvent<SVGGElement, D3Node, unknown>, d: D3Node) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: d3.D3DragEvent<SVGGElement, D3Node, unknown>, d: D3Node) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGGElement, D3Node, unknown>, d: D3Node) {
        if (!event.active) simulation.alphaTarget(0);
        // Keep node fixed after drag until clicked again?
        // Set d.fx = null; d.fy = null; to release after drag.
      }

      return d3.drag<SVGGElement, D3Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    // --- Update Selection Styling --- Separate function for clarity
    function updateSelectionStyle() {
        nodeGroup.each(function (n: D3Node) { // Add type to n
            const isSelected = selectedUniversity?.name === n.id;
            const circle = d3.select(this).select('circle.node-circle');
            const label = d3.select(this).select('text.node-label');

            circle.transition().duration(100) // Faster transition
              .attr('r', isSelected ? getNodeRadius(n) * SELECT_SCALE : getNodeRadius(n))
              .attr('stroke-width', isSelected ? 2.5 : 1.5) // Slightly thicker selected stroke
              .attr('stroke', isSelected ? '#87CEFA' : '#1a1a1a'); // LightSkyBlue selected stroke

            label.transition().duration(100)
                 .style('opacity', isSelected ? 1.0 : 0.7)
                 .attr('fill', isSelected ? '#fff' : '#ccc') // Make selected label white
                 .attr('font-weight', isSelected ? 'bold' : 'normal'); // Bold selected label
        });
        nodeGroup.filter((n: D3Node) => selectedUniversity?.name === n.id).raise();
        link.style('stroke-opacity', (l: D3Link) => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            const isSelectedLink = selectedUniversity && (sourceId === selectedUniversity.name || targetId === selectedUniversity.name);
            return isSelectedLink ? 0.8 : (l.type === 'state' ? 0.6 : 0.4); // Use default opacity based on type
        })
        // Restore selected link appearance
        .attr('stroke', (l: D3Link) => { // Add type to l
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            const isSelectedLink = selectedUniversity && (sourceId === selectedUniversity.name || targetId === selectedUniversity.name);
            return isSelectedLink ? '#87CEFA' : (l.type === 'state' ? '#777' : '#555'); // LightSkyBlue highlight or default type color
        });
    }

    // Initial application of selection style
    updateSelectionStyle();

    // --- Cleanup ---
    return () => {
      simulationRef.current?.stop();
      tooltip.remove(); // Remove tooltip when component unmounts
    }

  }, [nodes, links, width, height, selectedUniversity, setSelectedUniversity]) // Dependencies

  return (
    <div className={`d3-network-graph-container ${className}`}>
      {/* Apply dark background color here */}
      <svg ref={svgRef} width={width} height={height} style={{ backgroundColor: '#18212B' }} />
    </div>
  )
}
