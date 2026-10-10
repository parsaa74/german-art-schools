'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  forceSimulation,
  forceX,
  forceY,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import {
  select,
  zoom,
  drag,
  color as d3color,
  easeCubicInOut,
  type D3DragEvent,
} from 'd3'
import { shallow } from 'zustand/shallow'
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore'
import { Filters, filtersFromState, passesFilters } from '@/lib/glass/filter'
import { typeColor, KIN_COLOR, TIER_OPACITY } from '@/lib/taxonomy'
// --- Interfaces ---
// Ensure ProcessedUniversity includes coordinates or adjust access
// REMOVE temporary interface
// interface ProcessedUniversityWithCoords extends ProcessedUniversity {
//     coordinates?: { lat: number | null; lng: number | null };
// }

interface D3Node extends SimulationNodeDatum {
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

interface D3Link extends SimulationLinkDatum<D3Node> {
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
const EASING_FUNCTION = easeCubicInOut // Consistent easing

// --- Base Colors (Align with 3D view if possible) ---
const COLOR_HOVER = '#ffffff'   // white
const COLOR_SELECTED = '#22d3ee' // cyan-400 (Brighter)
const COLOR_STROKE_DEFAULT = '#5eead4' // teal-300
const COLOR_STROKE_HOVER = '#ffffff' // white
const COLOR_STROKE_SELECTED = '#99f6e4' // teal-200
const COLOR_LABEL = '#e5e7eb' // gray-200
const COLOR_LINK_DEFAULT = '#4b5563' // gray-600
const COLOR_FILTERED_OUT = '#374151' // gray-700

const OPACITY_NODE_DEFAULT = 0.9
const OPACITY_NODE_DIMMED = 0.25
const OPACITY_NODE_HIDDEN = 0.1
const OPACITY_LABEL_VISIBLE = 1
const OPACITY_LABEL_HIDDEN = 0
const OPACITY_LINK_DEFAULT = 0.15
const OPACITY_LINK_ACTIVE = 0.6
const OPACITY_LINK_HIDDEN = 0.05

// Type colours — the same palette as the glass wall and the help modal
const getTypeColor = (node: D3Node): string => typeColor(node.type)
const getTypeStrokeColor = (node: D3Node): string => d3color(typeColor(node.type))?.brighter(1).formatHex() ?? COLOR_STROKE_DEFAULT

// --- Helper Functions ---
const getNodeRadius = (node: D3Node): number => {
  // Use a combination of prestige score, student count, and program count for node size
  const baseRadius = NODE_BASE_RADIUS;
  
  // Factor in prestige (ranking) - higher prestige = larger node
  const prestigeFactor = node.university.prestigeScore ? 
    (node.university.prestigeScore / 100) * 2 : 1;
  
  // Factor in student count - more students = larger node (with diminishing returns)
  const studentFactor = node.university.stats?.students ? 
    Math.sqrt(node.university.stats.students / 1000) + 1 : 1;
  
  // Factor in program diversity
  const programFactor = 1 + (node.programCount * NODE_PROGRAM_SCALE);
  
  // Combine factors with different weights
  const combinedRadius = baseRadius * (
    prestigeFactor * 0.4 + 
    studentFactor * 0.3 + 
    programFactor * 0.3
  );
  
  return Math.min(NODE_MAX_RADIUS, Math.max(NODE_BASE_RADIUS, combinedRadius));
}

// Same predicate as the glass wall (src/lib/glass/filter.ts)
const doesNodeMatchFilters = (node: D3Node, filters: Filters): boolean => passesFilters(node.university, filters)

// --- Component ---
export default function D3NetworkGraph({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  className = '',
}: Omit<D3NetworkGraphProps, 'timelineFilter'>) { // Remove timelineFilter from props
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<Simulation<D3Node, D3Link> | null>(null)
  const nodeMapRef = useRef(new Map<string, D3Node>());
  const linkGroupRef = useRef<SVGGElement | null>(null); // Ref for link group
  const nodeGroupRef = useRef<SVGGElement | null>(null); // Ref for node group
  const graphContentRef = useRef<SVGGElement | null>(null); // Ref for graph-content group
  const zoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Zustand Store ---
  const {
    processedUniversities,
    selectedUniversity,
    setSelectedUniversity,
    hoverUniversityName, // Get hover state from store
    setHoverUniversityName, // Set hover state in store
    schoolRelations,
    universityById,
  } = useSchoolStore(state => ({
    processedUniversities: state.processedUniversities,
    selectedUniversity: state.selectedUniversity,
    setSelectedUniversity: state.setSelectedUniversity,
    hoverUniversityName: state.hoverUniversityName, // Subscribe to hover changes
    setHoverUniversityName: state.setHoverUniversityName,
    schoolRelations: state.schoolRelations,
    universityById: state.universityById,
  }), shallow);
  const filters = useSchoolStore((state) => filtersFromState(state), shallow);
  const filterKey = JSON.stringify(filters);

  const [nodes, setNodes] = useState<D3Node[]>([])
  const [links, setLinks] = useState<D3Link[]>([]) // State for dynamic links
  const [neighborMap, setNeighborMap] = useState<Map<string, Set<string>>>(new Map()); // Store neighbors based on current links
  const [zoomScale, setZoomScale] = useState(1); // Track zoom scale

  // --- Data Processing --- Create nodes
  useEffect(() => {
    if (!processedUniversities || processedUniversities.length === 0) {
      setNodes([])
      nodeMapRef.current.clear()
      return
    }

    // Compute data-driven geographic bounds for accurate projection
    const geoFiltered = (processedUniversities as ProcessedUniversity[])
      .filter(uni => uni.programTypes && uni.programTypes.length > 0 && uni.coordinates?.lat && uni.coordinates?.lng)
    const allLats = geoFiltered.map(u => u.coordinates!.lat as number)
    const allLngs = geoFiltered.map(u => u.coordinates!.lng as number)
    const minLat = Math.min(...allLats), maxLat = Math.max(...allLats)
    const minLng = Math.min(...allLngs), maxLng = Math.max(...allLngs)
    // Longitude correction: 1° lng ≠ 1° lat; at mean lat, scale by cos(lat)
    const meanLat = (minLat + maxLat) / 2
    const lngCorrection = Math.cos(meanLat * Math.PI / 180)
    // Add 10% padding to bounds
    const latPad = (maxLat - minLat) * 0.1
    const lngPad = (maxLng - minLng) * 0.1
    const paddedMaxLat = maxLat + latPad
    const paddedMinLng = minLng - lngPad
    const lngRange = (maxLng - minLng + 2 * lngPad) * lngCorrection
    const latRange = maxLat - minLat + 2 * latPad
    // Uniform scale to preserve geographic shape, centered in SVG
    const svgPad = width * 0.08
    const availW = width - 2 * svgPad, availH = height - 2 * svgPad
    const geoScale = Math.min(availW / lngRange, availH / latRange)
    const mapW = lngRange * geoScale, mapH = latRange * geoScale
    const ox = svgPad + (availW - mapW) / 2
    const oy = svgPad + (availH - mapH) / 2

    const newNodes: D3Node[] = geoFiltered
      .map(uni => {
         const initX = uni.coordinates?.lng
           ? ox + (uni.coordinates.lng - paddedMinLng) * lngCorrection * geoScale
           : Math.random() * (width * 0.8) + width * 0.1
         const initY = uni.coordinates?.lat
           ? oy + (paddedMaxLat - uni.coordinates.lat) * geoScale
           : Math.random() * (height * 0.8) + height * 0.1
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

    const svg = select(svgRef.current)
    const currentWidth = width;
    const currentHeight = height;

    // Initialize or Update Simulation
    if (!simulationRef.current) {
        simulationRef.current = forceSimulation<D3Node>()
            // .force('charge', forceManyBody().strength(-120).distanceMax(currentWidth / 4)) // Temporarily disable charge
            .force('x', forceX(currentWidth / 2).strength(0.02)) // Weak centering force X
            .force('y', forceY(currentHeight / 2).strength(0.02)) // Weak centering force Y
            .force('center', forceCenter(currentWidth / 2, currentHeight / 2).strength(0.04))
            .force('collision', forceCollide<D3Node>().radius(d => {
                 const radius = getNodeRadius(d) + 6;
                 if (radius <= 0) {
                     console.warn(`[D3 Collision] Node ${d.id} has non-positive collision radius: ${radius}`);
                     return 1; // Return a minimum positive value to prevent NaN
                 }
                 return radius;
            }).strength(0.7))
            .alphaDecay(0.02);

        simulationRef.current.on('tick', () => {
            // Update node positions
            if (nodeGroupRef.current) {
                select(nodeGroupRef.current).selectAll<SVGGElement, D3Node>('g.node-container')
                    .attr('transform', d => `translate(${d.x ?? d.initialX},${d.y ?? d.initialY})`);
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
        graphContentRef.current = g.node();

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
    } else {
        graphContentRef.current = g.node();
    }

    // --- D3 Zoom Behavior ---
    svg.call(
      zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 5])
        .on('zoom', (event) => {
          if (graphContentRef.current) {
            select(graphContentRef.current)
              .attr('transform', event.transform.toString());
            if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
            zoomTimeoutRef.current = setTimeout(() => {
              setZoomScale(event.transform.k);
            }, 50);
          }
        })
    );

    // --- Drag Handling --- (Defined inside useEffect to capture simulation)
    const dragBehavior = (simulation: Simulation<D3Node, D3Link>) => {
      function dragstarted(this: SVGGElement, event: D3DragEvent<SVGGElement, D3Node, unknown>, d: D3Node) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        select(this).raise(); // Bring dragged node to front
      }
      function dragged(event: D3DragEvent<SVGGElement, D3Node, unknown>, d: D3Node) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event: D3DragEvent<SVGGElement, D3Node, unknown>, d: D3Node) {
        if (!event.active) simulation.alphaTarget(0);
        // Keep node fixed after drag - comment out if you want it to drift
        // d.fx = event.x;
        // d.fy = event.y;
        // Release node after drag:
        d.fx = null;
        d.fy = null;
      }
      return drag<SVGGElement, D3Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    // --- Node Element Selection and Data Binding ---
    const nodeSelection = select(nodeGroupRef.current!)
      .selectAll<SVGGElement, D3Node>('g.node-container')
      .data(nodes, (d: D3Node): string => d.id);

    // Enter: Create new node groups
    const nodeEnter = nodeSelection.enter().append('g')
        .attr('class', 'node-container')
        .style('cursor', 'pointer')
        .attr('opacity', 0) // Start transparent for fade-in
        .call(dragBehavior(simulationRef.current!) as any);

    nodeEnter.append('circle')
        .attr('class', 'node-circle')
        .attr('r', d => getNodeRadius(d))
        .attr('fill', d => getTypeColor(d))
        .attr('stroke', d => getTypeStrokeColor(d))
        .attr('stroke-width', 1.5);

    nodeEnter.append('text')
        .attr('class', 'node-label')
        .text(d => d.name)
        .attr('x', 0)
        .attr('y', d => getNodeRadius(d) + 5)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Inter, sans-serif')
        .attr('font-size', d => `${Math.max(11, 16 / zoomScale)}px`) // Dynamic font size
        .attr('font-weight', 'bold') // Make text bolder
        .attr('stroke', '#222') // Add dark stroke for contrast
        .attr('stroke-width', 0.8)
        .attr('paint-order', 'stroke')
        .attr('fill', COLOR_LABEL)
        .style('pointer-events', 'none')
        .attr('opacity', OPACITY_LABEL_HIDDEN);

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

    // Update font size on zoom
    nodeEnter.merge(nodeSelection).select('text.node-label')
      .attr('font-size', d => `${Math.max(11, 16 / zoomScale)}px`)
      .attr('font-weight', 'bold')
      .attr('stroke', '#222')
      .attr('stroke-width', 0.8)
      .attr('paint-order', 'stroke');

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

  }, [nodes, width, height, setSelectedUniversity, setHoverUniversityName, zoomScale]) // Dependencies for initial setup & node binding


  // --- Effect for Calculating and Updating Dynamic Links & Neighbors ---
  useEffect(() => {
    const selectedNodeId = selectedUniversity?.name;
    const selectedNodeData = selectedNodeId ? nodeMapRef.current.get(selectedNodeId) : null;

    // Links = related schools (programs that closely match), value = tier 1..3
    const calculateLinks = (selectedNode: D3Node | null | undefined): D3Link[] => {
        if (!selectedNode) return [];
        return (schoolRelations.get(selectedNode.university.id) ?? []).flatMap((r) => {
            const other = universityById.get(r.schoolId);
            if (!other || !nodeMapRef.current.has(other.name)) return [];
            if (!doesNodeMatchFilters(nodeMapRef.current.get(other.name)!, filters)) return [];
            return [{ source: selectedNode.id, target: other.name, value: r.tier, type: 'program' } as D3Link];
        });
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUniversity, nodes, schoolRelations, universityById, filterKey]);


  // --- Effect for Handling Selection, Hover, Filter Updates, and Link Drawing ---
  useEffect(() => {
    if (!nodeGroupRef.current || !linkGroupRef.current || !svgRef.current) return;

    const selectedNodeId = selectedUniversity?.name;
    const hoveredNodeId = hoverUniversityName;
    const neighborsOfSelected = selectedNodeId ? neighborMap.get(selectedNodeId) : null;
    const neighborsOfHovered = hoveredNodeId ? neighborMap.get(hoveredNodeId) : null; // Get neighbors if hovered

    // Select node and link groups
    const nodeGroupSelection = select(nodeGroupRef.current);
    const linkGroupSelection = select(linkGroupRef.current);
    if (!nodeGroupSelection.node() || !linkGroupSelection.node()) return;

    const nodeContainers = nodeGroupSelection.selectAll<SVGGElement, D3Node>('g.node-container');

    // Update Node Styles based on selection, hover, and filters
    nodeContainers.each(function (d: D3Node) {
        const nodeElement = select(this);
        const circle = nodeElement.select<SVGCircleElement>('circle.node-circle');
        const label = nodeElement.select<SVGTextElement>('text.node-label');

        const isSelected = d.id === selectedNodeId;
        const isHovered = d.id === hoveredNodeId;
        const matchesFilters = doesNodeMatchFilters(d, filters);
        const isNeighborOfSelected = !!(selectedNodeId && neighborsOfSelected?.has(d.id));
        const isNeighborOfHovered = !!(hoveredNodeId && neighborsOfHovered?.has(d.id)); // Check if neighbor of hovered

        // Determine target styles
        let targetNodeOpacity = OPACITY_NODE_DEFAULT;
        let targetLabelOpacity = OPACITY_LABEL_HIDDEN;
        let targetScale = 1.0;
        let targetFilter = null;
        let targetFill = getTypeColor(d);
        let targetStroke = getTypeStrokeColor(d);
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
            } else if (isHovered) {
                // Show hovered node's label even when another node is selected
                targetNodeOpacity = OPACITY_NODE_DEFAULT;
                targetLabelOpacity = OPACITY_LABEL_VISIBLE;
                targetScale = HOVER_SCALE;
                targetFilter = 'url(#glow)';
                targetFill = COLOR_HOVER;
                targetStroke = COLOR_STROKE_HOVER;
                targetStrokeWidth = 2;
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
        .attr('stroke-width', (d: D3Link) => d.value)
        .attr('stroke', KIN_COLOR)
        .attr('stroke-opacity', 0) // Start transparent
        .attr('x1', d => {
          const n = typeof d.source === 'string' ? nodeMapRef.current.get(d.source) : d.source as D3Node;
          return n?.x ?? n?.initialX ?? 0;
        })
        .attr('y1', d => {
          const n = typeof d.source === 'string' ? nodeMapRef.current.get(d.source) : d.source as D3Node;
          return n?.y ?? n?.initialY ?? 0;
        })
        .attr('x2', d => {
          const n = typeof d.target === 'string' ? nodeMapRef.current.get(d.target) : d.target as D3Node;
          return n?.x ?? n?.initialX ?? 0;
        })
        .attr('y2', d => {
          const n = typeof d.target === 'string' ? nodeMapRef.current.get(d.target) : d.target as D3Node;
          return n?.y ?? n?.initialY ?? 0;
        });

    // Update + Enter links (style update)
    linkEnter.merge(linkSelection)
        .transition('linkStyle').duration(TRANSITION_DURATION).ease(EASING_FUNCTION)
        .attr('stroke', KIN_COLOR)
        .attr('stroke-opacity', (d: D3Link) => TIER_OPACITY[d.value] * 0.9)
        .attr('stroke-width', (d: D3Link) => d.value); // Fade in/update active links
        // Default/dimmed link styles are handled by the base group attributes
        // We only explicitly style the *active* links when a node is selected


  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
      selectedUniversity,
      hoverUniversityName,
      filterKey,
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
