import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Theme } from '@/constants/Colors';

function EyeMesh() {
    const meshRef = useRef<Mesh>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshStandardMaterial color={Theme.colors.primary} wireframe />
        </mesh>
    );
}

export default function PeepEye({ style }: { style?: any }) {
    return (
        <Canvas style={style}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <EyeMesh />
        </Canvas>
    );
}
