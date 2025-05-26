'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore'
import { motion } from 'framer-motion' // Import motion for potential parent animation

// --- Interfaces ---
// Ensure ProcessedUniversity includes coordinates or adjust access
// REMOVE temporary interface
// interface ProcessedUniversityWithCoords extends ProcessedUniversity {
//     coordinates?: { lat: number | null; lng: number | null };
// }

interface D3Node extends d3.SimulationNodeDatum {
  id: string // Use university name as ID
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
  initialX?: number
  initialY?: number
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node // D3 expects string IDs initially, then resolves to nodes
  target: string | D3Node
  value: number // Strength/importance of the link (e.g., shared program count)
  type: 'program' // Type of connection
}

interface D3NetworkGraphProps {
  width?: number
  height?: number
  className?: string
  // timelineFilter is now handled internally via store
}

// --- Constants ---
const DEFAULT_WIDTH = 800
const DEFAULT_HEIGHT = 600
const NODE_BASE_RADIUS = 4 // Slightly smaller base
const NODE_PROGRAM_SCALE = 0.3 // Scale effect reduced
const NODE_MAX_RADIUS = 10 // Max radius reduced
const HOVER_SCALE = 1.5 // Scale on hover
const SELECT_SCALE = 1.6 // Scale when selected
const LINK_BASE_WIDTH = 0.6
const LINK_VALUE_SCALE = 0.4 // Reduced scale impact
const TRANSITION_DURATION = 250 // Slightly faster transitions
const EASING_FUNCTION = d3.easeCubicInOut // Consistent easing

// --- Base Colors (Align with 3D view if possible) ---
const COLOR_DEFAULT = '#06b6d4' // cyan-500
const COLOR_HOVER = '#ffffff'   // white
const COLOR_SELECTED = '#22d3ee' // cyan-400 (Brighter)
const COLOR_STROKE_DEFAULT = '#5eead4' // teal-300
const COLOR_STROKE_HOVER = '#ffffff' // white
const COLOR_STROKE_SELECTED = '#99f6e4' // teal-200
const COLOR_LABEL = '#e5e7eb' // gray-200
const COLOR_LINK_DEFAULT = '#4b5563' // gray-600
const COLOR_LINK_ACTIVE = '#9ca3af' // gray-400
const COLOR_FILTERED_OUT = '#374151' // gray-700

const OPACITY_NODE_DEFAULT = 0.9
const OPACITY_NODE_DIMMED = 0.25
const OPACITY_NODE_HIDDEN = 0.1
const OPACITY_LABEL_VISIBLE = 1
const OPACITY_LABEL_HIDDEN = 0
const OPACITY_LINK_DEFAULT = 0.15
const OPACITY_LINK_ACTIVE = 0.6
const OPACITY_LINK_HIDDEN = 0.05

// --- Helper Functions ---
const getNodeRadius = (node: D3Node): number => {
  return Math.min(NODE_MAX_RADIUS, NODE_BASE_RADIUS + node.programCount * NODE_PROGRAM_SCALE)
}

// Helper to check if a node matches all active filters
function doesNodeMatchFilters(
    node: D3Node,
    timelineFilter: [number, number] | null,
    stateFilter: string | null,
    programFilter: string | null
): boolean {
    // Timeline Check
    if (timelineFilter) {
        const foundedYear = node.university.founded ? parseInt(node.university.founded) : null;
        if (foundedYear === null || foundedYear < timelineFilter[0] || foundedYear > timelineFilter[1]) {
            return false;
        }
    }
    // State Check
    if (stateFilter && node.state !== stateFilter) {
        return false;
    }
    // Program Check
    if (programFilter && !node.university.programTypes?.some(pt => pt === programFilter)) {
         return false;
    }
    return true; // Matches all active filters or no filters active
}

// --- Component ---
export default function D3NetworkGraph({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  className = '',
}: Omit<D3NetworkGraphProps, 'timelineFilter'>) { // Remove timelineFilter from props
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null)
  const nodeMapRef = useRef(new Map<string, D3Node>());
  const linkGroupRef = useRef<SVGGElement | null>(null); // Ref for link group
  const nodeGroupRef = useRef<SVGGElement | null>(null); // Ref for node group

  // --- Zustand Store ---
  const {
    processedUniversities,
    selectedUniversity,
    setSelectedUniversity,
    hoverUniversityName, // Get hover state from store
    setHoverUniversityName, // Set hover state in store
    timelineFilter,
    activeStateFilter,
    activeProgramFilter,
  } = useSchoolStore(state => ({
    processedUniversities: state.processedUniversities,
    selectedUniversity: state.selectedUniversity,
    setSelectedUniversity: state.setSelectedUniversity,
    hoverUniversityName: state.hoverUniversityName, // Subscribe to hover changes
    setHoverUniversityName: state.setHoverUniversityName,
    timelineFilter: state.timelineFilter,
    activeStateFilter: state.activeStateFilter,
    activeProgramFilter: state.activeProgramFilter,
  }));

  const [nodes, setNodes] = useState<D3Node[]>([])
  const [links, setLinks] = useState<D3Link[]>([]) // State for dynamic links
  const [neighborMap, setNeighborMap] = useState<Map<string, Set<string>>>(new Map()); // Store neighbors based on current links

  // --- Data Processing --- Create nodes
  useEffect(() => {
    if (!processedUniversities || processedUniversities.length === 0) {
      setNodes([])
      nodeMapRef.current.clear()
      return
    }

    const newNodes: D3Node[] = (processedUniversities as ProcessedUniversity[])
      .filter(uni => uni.programTypes && uni.programTypes.length > 0 && uni.coordinates?.lat)
      .map(uni => {
         const initX = Math.random() * (width * 0.8) + width * 0.1
         const initY = Math.random() * (height * 0.8) + height * 0.1
         const node: D3Node = {
            id: uni.name,
            name: uni.name,
            type: uni.type || 'university',
            state: uni.state || 'Unknown',
            programCount: uni.programTypes?.length || 0,
            university: uni,
            x: initX,
            y: initY,
            initialX: initX,
            initialY: initY,
          };
          // Log initial state
          console.log(`[D3 Init] Node: ${node.id}, Radius: ${getNodeRadius(node)}, X: ${node.x?.toFixed(2)}, Y: ${node.y?.toFixed(2)}`);
          return node;
      });

    setNodes(newNodes)
    nodeMapRef.current = new Map(newNodes.map(n => [n.id, n]));

    console.log(`[D3 Graph] Processed ${newNodes.length} nodes from store.`);

  }, [processedUniversities, width, height])

  // --- D3 Simulation and Rendering Effect --- Initial Setup
  useEffect(() => {
    if (!svgRef.current || !nodes || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    const currentWidth = width;
    const currentHeight = height;

    // Initialize or Update Simulation
    if (!simulationRef.current) {
        simulationRef.current = d3.forceSimulation<D3Node>()
            // .force('charge', d3.forceManyBody().strength(-120).distanceMax(currentWidth / 4)) // Temporarily disable charge
            .force('x', d3.forceX(currentWidth / 2).strength(0.02)) // Weak centering force X
            .force('y', d3.forceY(currentHeight / 2).strength(0.02)) // Weak centering force Y
            .force('center', d3.forceCenter(currentWidth / 2, currentHeight / 2).strength(0.04))
            .force('collision', d3.forceCollide<D3Node>().radius(d => {
                 const radius = getNodeRadius(d) + 6;
                 if (radius <= 0) {
                     console.warn(`[D3 Collision] Node ${d.id} has non-positive collision radius: ${radius}`);
                     return 1; // Return a minimum positive value to prevent NaN
                 }
                 return radius;
            }).strength(0.7))
            .alphaTarget(0.05)
            .alphaDecay(0.02);

        simulationRef.current.on('tick', () => {
            // Update node positions
            if (nodeGroupRef.current) {
                d3.select(nodeGroupRef.current).selectAll<SVGGElement, D3Node>('g.node-container')
                    .attr('transform', d => `translate(${d.initialX},${d.initialY})`); // Fix to initial coords
            }
            // Link positions remain static for now (not rendering dynamic links)
        });
    }

    // Update simulation nodes and reheat
    simulationRef.current.nodes(nodes).alpha(0.3).restart();

    // --- Setup SVG Structure (if not already present) ---
    let g = svg.select<SVGGElement>('g.graph-content');
    if (g.empty()) {
        g = svg.append('g').attr('class', 'graph-content');

        // --- Define SVG Filters ---
        const defs = svg.append('defs');
        const filter = defs.append('filter')
            .attr('id', 'glow')
            .attr('x', '-50%').attr('y', '-50%')
            .attr('width', '200%').attr('height', '200%');
        filter.append('feGaussianBlur')
            .attr('stdDeviation', '3.5') // Slightly smaller blur
            .attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Create dedicated groups if they don't exist
        linkGroupRef.current = g.append('g')
            .attr('class', 'links')
            .attr('stroke', COLOR_LINK_DEFAULT)
            .attr('stroke-opacity', OPACITY_LINK_DEFAULT)
            .attr('stroke-linecap', 'round')
            .node();

        nodeGroupRef.current = g.append('g')
            .attr('class', 'nodes')
            .node();

         // --- Click Handling ---
         svg.on('click', (event) => {
             if (event.target === svg.node() || event.target === g.node()) {
                 setSelectedUniversity(null);
             }
           });
    }

    // --- Drag Handling --- (Defined inside useEffect to capture simulation)
    const drag = (simulation: d3.Simulation<D3Node, D3Link>) => {
      function dragstarted(this: SVGGElement, event: d3.D3DragEvent<SVGGElement, D3Node, unknown>, d: D3Node) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        d3.select(this).raise(); // Bring dragged node to front
      }
      function dragged(event: d3.D3DragEvent<SVGGElement, D3Node, unknown>, d: D3Node) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event: d3.D3DragEvent<SVGGElement, D3Node, unknown>, d: D3Node) {
        if (!event.active) simulation.alphaTarget(0);
        // Keep node fixed after drag - comment out if you want it to drift
        // d.fx = event.x;
        // d.fy = event.y;
        // Release node after drag:
        d.fx = null;
        d.fy = null;
      }
      return d3.drag<SVGGElement, D3Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    // --- Node Element Selection and Data Binding ---
    const nodeSelection = d3.select(nodeGroupRef.current!)
      .selectAll<SVGGElement, D3Node>('g.node-container')
      .data(nodes, (d: D3Node): string => d.id);

    // Enter: Create new node groups
    const nodeEnter = nodeSelection.enter().append('g')
        .attr('class', 'node-container')
        .style('cursor', 'pointer')
        .attr('opacity', 0) // Start transparent for fade-in
        .call(drag(simulationRef.current!) as any);

    nodeEnter.append('circle')
        .attr('class', 'node-circle')
        .attr('r', d => getNodeRadius(d))
        .attr('fill', COLOR_DEFAULT)
        .attr('stroke', COLOR_STROKE_DEFAULT)
        .attr('stroke-width', 1.5);

    nodeEnter.append('text')
        .attr('class', 'node-label')
        .text(d => d.name) // Use truncated name later if needed
        .attr('x', 0)
        .attr('y', d => getNodeRadius(d) + 5) // Position below circle
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Inter, sans-serif')
        .attr('font-size', '8px') // Even smaller font size
        .attr('fill', COLOR_LABEL)
        .style('pointer-events', 'none')
        .attr('opacity', OPACITY_LABEL_HIDDEN); // Initially hidden

    // Merge Enter and Update selections
    const nodeUpdate = nodeEnter.merge(nodeSelection);

    // Apply fade-in transition to newly entered nodes
    nodeEnter.transition('enterFade')
        .duration(TRANSITION_DURATION * 1.5)
        .delay((_d, i) => i * 5)
        .attr('opacity', OPACITY_NODE_DEFAULT);

    // Update existing nodes (e.g., if radius calculation changes)
    nodeUpdate.select('circle.node-circle')
        .transition('radiusUpdate').duration(TRANSITION_DURATION).ease(EASING_FUNCTION)
        .attr('r', d => getNodeRadius(d));

    // Exit: Remove old nodes
    nodeSelection.exit()
        .transition('exitFade').duration(TRANSITION_DURATION).ease(EASING_FUNCTION)
        .attr('opacity', 0)
        .remove();

    // --- Interaction Handlers (Applied to the merged selection) ---
    nodeUpdate
      .on('click', (event, d) => {
        event.stopPropagation(); // Prevent background click triggering deselect
        const currentlySelected = selectedUniversity?.name === d.id;
        setSelectedUniversity(currentlySelected ? null : d.university);
      })
      .on('mouseover', function(this: SVGGElement, event: MouseEvent, d: D3Node) {
          setHoverUniversityName(d.id);
          // Raising is handled in the style update effect based on hover/select
      })
      .on('mouseout', function(this: SVGGElement, event: MouseEvent, d: D3Node) {
          if (useSchoolStore.getState().hoverUniversityName === d.id) {
              setHoverUniversityName(null);
          }
      });

    // Cleanup simulation on component unmount
    return () => {
      simulationRef.current?.stop();
    }

  }, [nodes, width, height, setSelectedUniversity, setHoverUniversityName]) // Dependencies for initial setup & node binding


  // --- Effect for Calculating and Updating Dynamic Links & Neighbors ---
  useEffect(() => {
    const selectedNodeId = selectedUniversity?.name;
    const selectedNodeData = selectedNodeId ? nodeMapRef.current.get(selectedNodeId) : null;

    // Function to Calculate Shared Program Links for the selected node
    const calculateLinks = (selectedNode: D3Node | null | undefined): D3Link[] => {
        if (!selectedNode?.university?.programTypes) return [];

        const newLinks: D3Link[] = [];
        const selectedPrograms = new Set(selectedNode.university.programTypes);

        nodes.forEach(targetNode => {
            if (!targetNode || targetNode.id === selectedNode.id || !targetNode.university?.programTypes) return;

            // Check if target node matches filters before creating link
            if (!doesNodeMatchFilters(targetNode, timelineFilter, activeStateFilter, activeProgramFilter)) {
              return;
            }

            let sharedCount = 0;
            targetNode.university.programTypes.forEach(program => {
                if (selectedPrograms.has(program)) {
                    sharedCount++;
                }
            });

            if (sharedCount > 0) {
                newLinks.push({
                    source: selectedNode.id,
                    target: targetNode.id,
                    value: sharedCount,
                    type: 'program'
                });
            }
        });
        return newLinks;
    }

    const newDynamicLinks = calculateLinks(selectedNodeData);
    setLinks(newDynamicLinks); // Update link state

    // Update neighbor map based on the new links
    const newNeighborMap = new Map<string, Set<string>>();
    newDynamicLinks.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        if (!newNeighborMap.has(sourceId)) newNeighborMap.set(sourceId, new Set());
        if (!newNeighborMap.has(targetId)) newNeighborMap.set(targetId, new Set());
        newNeighborMap.get(sourceId)?.add(targetId);
        newNeighborMap.get(targetId)?.add(sourceId);
    });
    setNeighborMap(newNeighborMap);

  }, [selectedUniversity, nodes, timelineFilter, activeStateFilter, activeProgramFilter]);


  // --- Effect for Handling Selection, Hover, Filter Updates, and Link Drawing ---
  useEffect(() => {
    if (!nodeGroupRef.current || !linkGroupRef.current || !svgRef.current) return;

    const selectedNodeId = selectedUniversity?.name;
    const hoveredNodeId = hoverUniversityName;
    const neighborsOfSelected = selectedNodeId ? neighborMap.get(selectedNodeId) : null;
    const neighborsOfHovered = hoveredNodeId ? neighborMap.get(hoveredNodeId) : null; // Get neighbors if hovered

    // Select node and link groups
    const nodeGroupSelection = d3.select(nodeGroupRef.current);
    const linkGroupSelection = d3.select(linkGroupRef.current);
    if (!nodeGroupSelection.node() || !linkGroupSelection.node()) return;

    const nodeContainers = nodeGroupSelection.selectAll<SVGGElement, D3Node>('g.node-container');

    // Update Node Styles based on selection, hover, and filters
    nodeContainers.each(function (d: D3Node) {
        const nodeElement = d3.select(this);
        const circle = nodeElement.select<SVGCircleElement>('circle.node-circle');
        const label = nodeElement.select<SVGTextElement>('text.node-label');

        const isSelected = d.id === selectedNodeId;
        const isHovered = d.id === hoveredNodeId;
        const matchesFilters = doesNodeMatchFilters(d, timelineFilter, activeStateFilter, activeProgramFilter);
        const isNeighborOfSelected = !!(selectedNodeId && neighborsOfSelected?.has(d.id));
        const isNeighborOfHovered = !!(hoveredNodeId && neighborsOfHovered?.has(d.id)); // Check if neighbor of hovered

        // Determine target styles
        let targetNodeOpacity = OPACITY_NODE_DEFAULT;
        let targetLabelOpacity = OPACITY_LABEL_HIDDEN;
        let targetScale = 1.0;
        let targetFilter = null;
        let targetFill = COLOR_DEFAULT;
        let targetStroke = COLOR_STROKE_DEFAULT;
        let targetStrokeWidth = 1.5;

        if (!matchesFilters) {
            targetNodeOpacity = OPACITY_NODE_HIDDEN;
            targetFill = COLOR_FILTERED_OUT;
            targetStroke = COLOR_FILTERED_OUT;
        } else if (selectedNodeId) { // Something is selected
            if (isSelected) {
                targetNodeOpacity = 1.0;
                targetScale = SELECT_SCALE;
                targetLabelOpacity = OPACITY_LABEL_VISIBLE;
                targetFilter = 'url(#glow)';
                targetFill = COLOR_SELECTED;
                targetStroke = COLOR_STROKE_SELECTED;
                targetStrokeWidth = 2.5;
                nodeElement.raise();
            } else if (isNeighborOfSelected) {
                targetNodeOpacity = OPACITY_NODE_DEFAULT; // Keep neighbors visible
            } else {
                targetNodeOpacity = OPACITY_NODE_DIMMED; // Dim non-neighbors
            }
        } else if (hoveredNodeId) { // Nothing selected, but something is hovered
            if (isHovered) {
                targetNodeOpacity = 1.0;
                targetScale = HOVER_SCALE;
                targetLabelOpacity = OPACITY_LABEL_VISIBLE;
                targetFilter = 'url(#glow)';
                targetFill = COLOR_HOVER;
                targetStroke = COLOR_STROKE_HOVER;
                targetStrokeWidth = 2;
                nodeElement.raise();
            } else if (isNeighborOfHovered) {
                targetNodeOpacity = OPACITY_NODE_DEFAULT; // Keep neighbors visible
            } else {
                targetNodeOpacity = OPACITY_NODE_DIMMED; // Dim non-neighbors slightly
            }
        }
        // else: No selection, no hover - use default opacity/style (already set)

        // Apply transitions
        nodeElement.transition('nodeStyle').duration(TRANSITION_DURATION).ease(EASING_FUNCTION)
            .style('opacity', targetNodeOpacity);

        circle.transition('circleStyle').duration(TRANSITION_DURATION).ease(EASING_FUNCTION)
            .attr('transform', `scale(${targetScale})`)
            .attr('filter', targetFilter)
            .attr('fill', targetFill)
            .attr('stroke', targetStroke)
            .attr('stroke-width', targetStrokeWidth);

        label.transition('labelStyle').duration(TRANSITION_DURATION).ease(EASING_FUNCTION)
            .attr('opacity', targetLabelOpacity);
    });

    // --- Update Link Drawing and Styles ---
    const linkSelection = linkGroupSelection
        .selectAll<SVGLineElement, D3Link>('line.link') // Add .link class
        .data(links, d => `${d.source as string}-${d.target as string}`); // Use link state

    // Exit old links
    linkSelection.exit()
        .transition('linkExit').duration(TRANSITION_DURATION).ease(EASING_FUNCTION)
        .attr('stroke-opacity', 0)
        .remove();

    // Enter new links
    const linkEnter = linkSelection.enter().append('line')
        .attr('class', 'link') // Add class
        .attr('stroke-width', d => Math.min(2.5, LINK_BASE_WIDTH + d.value * LINK_VALUE_SCALE))
        .attr('stroke', COLOR_LINK_ACTIVE) // Start with active color during transition
        .attr('stroke-opacity', 0) // Start transparent
        .attr('x1', d => (typeof d.source === 'string' ? nodeMapRef.current.get(d.source) : d.source as D3Node)?.initialX ?? 0)
        .attr('y1', d => (typeof d.source === 'string' ? nodeMapRef.current.get(d.source) : d.source as D3Node)?.initialY ?? 0)
        .attr('x2', d => (typeof d.target === 'string' ? nodeMapRef.current.get(d.target) : d.target as D3Node)?.initialX ?? 0)
        .attr('y2', d => (typeof d.target === 'string' ? nodeMapRef.current.get(d.target) : d.target as D3Node)?.initialY ?? 0);

    // Update + Enter links (style update)
    linkEnter.merge(linkSelection)
        .transition('linkStyle').duration(TRANSITION_DURATION).ease(EASING_FUNCTION)
        .attr('stroke', COLOR_LINK_ACTIVE)
        .attr('stroke-opacity', OPACITY_LINK_ACTIVE); // Fade in/update active links
        // Default/dimmed link styles are handled by the base group attributes
        // We only explicitly style the *active* links when a node is selected


  }, [
      selectedUniversity,
      hoverUniversityName,
      timelineFilter,
      activeStateFilter,
      activeProgramFilter,
      nodes, // Re-run if nodes change (for filter checks mainly)
      links, // Re-run when links state changes
      neighborMap // Re-run when neighbor map changes
    ]);


  return (
    <div
      className={`d3-network-graph-container ${className} w-full h-full overflow-hidden relative`}
      style={{ background: 'transparent' }} // Force transparent background
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMin meet"
        style={{ isolation: 'isolate', background: 'transparent' }} // Also force SVG background transparent
      />
    </div>
  )
}
