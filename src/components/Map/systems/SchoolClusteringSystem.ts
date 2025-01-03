import * as THREE from 'three';
import KDBush from 'kdbush';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { School } from '@/types/school';
import { latLongToVector3 } from '@/utils';
import { createRoot } from 'react-dom/client';
import { ClusterOverlay, ClusterContent, SchoolItem } from '../styles/cluster-overlay';

interface SchoolMarkerData {
  marker: THREE.Mesh;
  data: School;
  position: THREE.Vector3;
}

interface Cluster {
  id: string;
  points: Array<{ id: string; screenX: number; screenY: number; visible: boolean }>;
  center: THREE.Vector3;
}

export class SchoolClusteringSystem {
  private scene: THREE.Scene;
  private globe: THREE.Object3D;
  private schools: Map<string, SchoolMarkerData>;
  private clusters: Map<string, { marker: THREE.Mesh; points: any[] }>;
  private index: KDBush;
  private clusterRadius: number;
  private lastCameraPosition: THREE.Vector3;
  private cameraMoved: boolean;
  
  private clusterGeometry: THREE.SphereGeometry;
  private clusterMaterial: THREE.MeshPhongMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.schools = new Map();
    this.clusters = new Map();
    this.index = null;
    this.clusterRadius = 30;
    
    this.clusterGeometry = new THREE.SphereGeometry(0.02, 32, 32);
    this.clusterMaterial = new THREE.MeshPhongMaterial({
      color: 0x4285f4,
      emissive: 0x1a73e8,
      transparent: true,
      opacity: 0.8
    });
    
    this.lastCameraPosition = new THREE.Vector3();
    this.cameraMoved = false;

    this.globe = this.createGlobe();
    this.scene.add(this.globe);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
  }

  addSchool(school: School, marker: THREE.Mesh) {
    const position = latLongToVector3(school.lat, school.lng, 1.02);
    
    this.schools.set(school.id, {
      marker,
      data: school,
      position
    });
    
    this.rebuildIndex();
  }

  private rebuildIndex() {
    const points = Array.from(this.schools.values()).map(school => ({
      id: school.data.id,
      x: school.data.lng,
      y: school.data.lat
    }));
    
    this.index = new KDBush(points);
  }

  update(camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    if (this.globe) {
      this.globe.rotation.y += 0.001;
    }

    if (camera.position.distanceTo(this.lastCameraPosition) > 0.01) {
      this.cameraMoved = true;
      this.lastCameraPosition.copy(camera.position);
    }

    if (!this.cameraMoved) return;
    this.cameraMoved = false;

    console.log('Updating clusters...');

    this.clusters.forEach(cluster => {
      this.globe.remove(cluster.marker);
    });
    this.clusters.clear();

    const clusters = this.calculateClusters(camera, renderer);
    console.log('Found clusters:', clusters.length);

    clusters.forEach(cluster => {
      if (cluster.points.length < 2) {
        const school = this.schools.get(cluster.points[0].id);
        if (school) {
          school.marker.visible = true;
        }
      } else {
        const clusterMarker = this.createClusterMarker(cluster);
        this.clusters.set(cluster.id, {
          marker: clusterMarker,
          points: cluster.points
        });
        this.globe.add(clusterMarker);
        console.log('Created cluster with', cluster.points.length, 'points');
        
        cluster.points.forEach(point => {
          const school = this.schools.get(point.id);
          if (school) {
            school.marker.visible = false;
          }
        });
      }
    });
  }

  private calculateClusters(camera: THREE.Camera, renderer: THREE.WebGLRenderer): Cluster[] {
    const clusters: Cluster[] = [];
    const processed = new Set<string>();
    
    const screenPoints = Array.from(this.schools.values()).map(school => {
      const screenPos = this.worldToScreen(school.position, camera, renderer);
      return {
        id: school.data.id,
        screenX: screenPos.x,
        screenY: screenPos.y,
        visible: this.isPointVisible(school.position, camera)
      };
    });

    screenPoints.forEach(point => {
      if (processed.has(point.id) || !point.visible) return;

      const cluster: Cluster = {
        id: `cluster-${clusters.length}`,
        points: [point],
        center: new THREE.Vector3()
      };

      screenPoints.forEach(otherPoint => {
        if (point.id === otherPoint.id || processed.has(otherPoint.id) || !otherPoint.visible) return;

        const distance = Math.hypot(
          point.screenX - otherPoint.screenX,
          point.screenY - otherPoint.screenY
        );

        if (distance <= this.clusterRadius) {
          cluster.points.push(otherPoint);
          processed.add(otherPoint.id);
        }
      });

      if (cluster.points.length > 1) {
        const centerPos = this.calculateClusterCenter(cluster.points);
        cluster.center.copy(centerPos);
        clusters.push(cluster);
      }
    });

    return clusters;
  }

  private createClusterMarker(cluster: Cluster): THREE.Mesh {
    const marker = new THREE.Mesh(this.clusterGeometry, this.clusterMaterial);
    marker.position.copy(cluster.center);
    
    marker.userData = {
      isCluster: true,
      points: cluster.points,
      onClick: () => this.handleClusterClick(cluster)
    };
    
    const labelDiv = document.createElement('div');
    labelDiv.className = 'cluster-label';
    labelDiv.textContent = `${cluster.points.length} schools`;
    const label = new CSS2DObject(labelDiv);
    marker.add(label);
    
    return marker;
  }

  private handleClusterClick(cluster: Cluster) {
    const schools = cluster.points.map(point => 
      this.schools.get(point.id)?.data
    ).filter(Boolean);
    
    const overlayContainer = document.createElement('div');
    const root = createRoot(overlayContainer);
    
    root.render(
      <ClusterOverlay
        isVisible={true}
        onClose={() => {
          document.body.removeChild(overlayContainer);
          root.unmount();
        }}
      >
        <ClusterContent title={`${schools.length} Art Schools in this area`}>
          <div className="divide-y">
            {schools.map(school => (
              <SchoolItem
                key={school.id}
                name={school.name}
                programCount={school.programs?.length || 0}
                onClick={() => {
                  // Handle school selection
                  // You might want to zoom to the school or show more details
                  const schoolData = this.schools.get(school.id);
                  if (schoolData) {
                    // Trigger camera movement to school position
                    // You'll need to implement this functionality
                    this.focusOnSchool(schoolData.position);
                  }
                }}
              />
            ))}
          </div>
        </ClusterContent>
      </ClusterOverlay>
    );
    
    document.body.appendChild(overlayContainer);
  }

  private focusOnSchool(position: THREE.Vector3) {
    // You can implement camera animation here
    // For example, using GSAP or your preferred animation library
    // This is just a placeholder for the functionality
  }

  private worldToScreen(position: THREE.Vector3, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    const vector = position.clone();
    vector.project(camera);
    
    return {
      x: (vector.x * 0.5 + 0.5) * renderer.domElement.width,
      y: (-vector.y * 0.5 + 0.5) * renderer.domElement.height
    };
  }

  private isPointVisible(position: THREE.Vector3, camera: THREE.Camera): boolean {
    const vector = position.clone();
    vector.project(camera);
    return vector.z < 1;
  }

  private calculateClusterCenter(points: any[]): THREE.Vector3 {
    const center = new THREE.Vector3();
    points.forEach(point => {
      const school = this.schools.get(point.id);
      center.add(school.position);
    });
    center.divideScalar(points.length);
    
    center.normalize().multiplyScalar(1.02); // Match our globe radius
    return center;
  }

  private createGlobe(): THREE.Object3D {
    // Create minimal globe structure
    const globeGeometry = new THREE.SphereGeometry(1, 16, 16);
    const edges = new THREE.EdgesGeometry(globeGeometry);
    const globe = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x333333 })
    );
    
    // Add latitude/longitude lines
    const latitudeCount = 8;
    const longitudeCount = 12;
    const radius = 1;
    
    // Create latitude circles
    for (let i = 0; i < latitudeCount; i++) {
      const phi = (Math.PI * i) / latitudeCount;
      const circleGeometry = new THREE.CircleGeometry(
        Math.sin(phi) * radius,
        32
      );
      const points = [];
      for (let j = 1; j < circleGeometry.attributes.position.count; j++) {
        points.push(new THREE.Vector3(
          circleGeometry.attributes.position.getX(j),
          circleGeometry.attributes.position.getY(j),
          0
        ));
      }
      const circlePoints = new THREE.BufferGeometry().setFromPoints(points);
      const circle = new THREE.Line(
        circlePoints,
        new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.3 })
      );
      circle.rotation.x = Math.PI / 2;
      circle.position.y = Math.cos(phi) * radius;
      globe.add(circle);
    }
    
    // Create longitude lines
    for (let i = 0; i < longitudeCount; i++) {
      const curve = new THREE.EllipseCurve(
        0, 0,
        radius, radius,
        0, 2 * Math.PI,
        false,
        0
      );
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.3 })
      );
      line.rotation.y = (i / longitudeCount) * Math.PI * 2;
      globe.add(line);
    }

    return globe;
  }

  public init(): void {
    // ... existing init code ...
    
    // Replace the existing globe creation with the new line art globe
    const globe = this.createGlobe();
    this.scene.add(globe);
    
    // Add ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // ... rest of init code ...
  }

  public update(): void {
    // ... existing update code ...
    
    // Add slow rotation to the globe
    const globe = this.scene.children.find(child => child instanceof THREE.LineSegments);
    if (globe) {
      globe.rotation.y += 0.001;
    }
    
    // ... rest of update code ...
  }
} 