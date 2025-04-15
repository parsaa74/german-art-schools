import {
	BufferAttribute,
	MathUtils,
	Matrix4,
	Mesh,
	Vector3,
	Color
} from 'three';

/**
 * Utility class for sampling weighted random points on the surface of a mesh.
 *
 * Building the sampler is a one-time O(N) operation. Once built, sampling is O(1). Landmarking is O(L).
 *
 * @method MeshSurfaceSampler
 * @param {THREE.Mesh} mesh The mesh to sample from.
 * @constructor
 */
class MeshSurfaceSampler {

	constructor( mesh ) {

		let geometry = mesh.geometry;

		if ( ! geometry.isBufferGeometry || geometry.attributes.position.itemSize !== 3 ) {

			throw new Error( 'MeshSurfaceSampler: Requires BufferGeometry triangle mesh.' );

		}

		if ( geometry.index ) {

			console.warn( 'MeshSurfaceSampler: Converting geometry to non-indexed BufferGeometry.' );

			geometry = geometry.toNonIndexed();

		}

		this.geometry = geometry;
		this.randomFunction = Math.random;

		this.positionAttribute = this.geometry.getAttribute( 'position' );
		this.colorAttribute = this.geometry.getAttribute( 'color' );
		this.weightAttribute = null;

		this.distribution = null;

	}

	/**
	 * Sets a vertex attribute to be used as weights for faces instead of face area.
	 * Note: This needs to be called before build().
	 * @method setWeightAttribute
	 * @param {string} name Name of attribute to use.
	 * @return {MeshSurfaceSampler}
	 */
	setWeightAttribute( name ) {

		this.weightAttribute = name ? this.geometry.getAttribute( name ) : null;

		return this;

	}

	/**
	 * Builds the sampler distribution.
	 * @method build
	 * @return {MeshSurfaceSampler}
	 */
	build() {

		const positionAttribute = this.positionAttribute;
		const weightAttribute = this.weightAttribute;

		const faceWeights = new Float32Array( positionAttribute.count / 3 );

		// Accumulate weights for each mesh face.

		for ( let i = 0; i < positionAttribute.count / 3; i ++ ) {

			let faceWeight = 1;

			if ( weightAttribute ) {

				faceWeight = weightAttribute.getX( i * 3 ) +
					weightAttribute.getX( i * 3 + 1 ) +
					weightAttribute.getX( i * 3 + 2 );

			}

			_face.a.fromBufferAttribute( positionAttribute, i * 3 );
			_face.b.fromBufferAttribute( positionAttribute, i * 3 + 1 );
			_face.c.fromBufferAttribute( positionAttribute, i * 3 + 2 );
			faceWeight *= _face.getArea();

			faceWeights[ i ] = faceWeight;

		}

		// Store cumulative weights.
		this.distribution = new Float32Array( positionAttribute.count / 3 );

		let cumulativeTotal = 0;

		for ( let i = 0; i < faceWeights.length; i ++ ) {

			cumulativeTotal += faceWeights[ i ];
			this.distribution[ i ] = cumulativeTotal;

		}

		this.cumulativeTotal = cumulativeTotal;

		return this;

	}

	/**
	 * Sets the random function to use in the sampler. Defaults to Math.random.
	 * @method setRandomFunction
	 * @param {function} randomFunction
	 * @return {MeshSurfaceSampler}
	 */
	setRandomFunction( randomFunction ) {

		this.randomFunction = randomFunction;
		return this;

	}

	/**
	 * Sample a single point on the mesh surface.
	 * @method sample
	 * @param {Vector3} targetPosition Vector to copy position into.
	 * @param {Vector3} targetNormal Vector to copy normal into.
	 * @param {THREE.Color} targetColor Vector to copy color into.
	 * @return {MeshSurfaceSampler}
	 */
	sample( targetPosition, targetNormal, targetColor ) {

		const cumulativeTotal = this.cumulativeTotal;
		const faceIndex = this.binarySearch( this.randomFunction() * cumulativeTotal );

		return this.sampleFace( faceIndex, targetPosition, targetNormal, targetColor );

	}

	/**
	 * Samples a single point on the given face index.
	 * @method sampleFace
	 * @param {number} faceIndex Index of the face to sample.
	 * @param {Vector3} targetPosition Vector to copy position into.
	 * @param {Vector3} targetNormal Vector to copy normal into.
	 * @param {THREE.Color} targetColor Vector to copy color into.
	 * @return {MeshSurfaceSampler}
	 */
	sampleFace( faceIndex, targetPosition, targetNormal, targetColor ) {

		let u = this.randomFunction();
		let v = this.randomFunction();

		if ( u + v > 1 ) {

			u = 1 - u;
			v = 1 - v;

		}

		_face.a.fromBufferAttribute( this.positionAttribute, faceIndex * 3 );
		_face.b.fromBufferAttribute( this.positionAttribute, faceIndex * 3 + 1 );
		_face.c.fromBufferAttribute( this.positionAttribute, faceIndex * 3 + 2 );

		targetPosition
			.set( 0, 0, 0 )
			.addScaledVector( _face.a, u )
			.addScaledVector( _face.b, v )
			.addScaledVector( _face.c, 1 - ( u + v ) );

		if ( targetNormal !== undefined ) {

			_face.getNormal( targetNormal );

		}

		if ( targetColor !== undefined && this.colorAttribute !== undefined ) {

			_face.a.fromBufferAttribute( this.colorAttribute, faceIndex * 3 );
			_face.b.fromBufferAttribute( this.colorAttribute, faceIndex * 3 + 1 );
			_face.c.fromBufferAttribute( this.colorAttribute, faceIndex * 3 + 2 );

			_color
				.set( 0, 0, 0 )
				.addScaledVector( _face.a, u )
				.addScaledVector( _face.b, v )
				.addScaledVector( _face.c, 1 - ( u + v ) );

			targetColor.set( _color.x, _color.y, _color.z );

		}

		return this;

	}

	binarySearch( x ) {

		const dist = this.distribution;
		let start = 0;
		let end = dist.length - 1;

		let index = - 1;

		while ( start <= end ) {

			const mid = Math.ceil( ( start + end ) / 2 );

			if ( mid === 0 || dist[ mid - 1 ] <= x && dist[ mid ] > x ) {

				index = mid;
				break;

			} else if ( x < dist[ mid ] ) {

				end = mid - 1;

			} else if ( x > dist[ mid ] ) {

				start = mid + 1;

			}

		}

		return index;

	}

}

// Triangle instance for reuse

const _face = { a: new Vector3(), b: new Vector3(), c: new Vector3(), getArea: null, getNormal: null };
_face.getArea = function () {

	_v1$2.subVectors( this.c, this.b );
	_v2$2.subVectors( this.a, this.b );
	return _v1$2.cross( _v2$2 ).length() * 0.5;

};
_face.getNormal = function ( target ) {

	_v1$2.subVectors( this.c, this.b );
	_v2$2.subVectors( this.a, this.b );
	_v1$2.cross( _v2$2 );

	target.copy( _v1$2 ).normalize();

	return target;
};

const _color = { a: new Color(), b: new Color(), c: new Color() };

const _v1$2 = new Vector3();
const _v2$2 = new Vector3();


export { MeshSurfaceSampler }; 