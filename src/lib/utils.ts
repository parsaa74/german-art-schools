import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import * as THREE from 'three'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const latLongToVector3 = (
  lat: number, 
  lng: number, 
  radius: number = 1,
  height: number = 0
) => {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  const x = -(radius + height) * Math.sin(phi) * Math.cos(theta)
  const y = (radius + height) * Math.cos(phi)
  const z = (radius + height) * Math.sin(phi) * Math.sin(theta)

  return new THREE.Vector3(x, y, z)
} 