import React, { useState } from 'react';
import { Box, Circle, Triangle, Cylinder, Cone, Cherry as Sphere, Plus, Move, RotateCw, Scale, Edit, MousePointer, ChevronDown, Lightbulb, Sun, Zap, TreePine, Flower, Mountain, Heart, Star, Dot, Minus, Type } from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';
import * as THREE from 'three';

const Toolbar: React.FC = () => {
  const { 
    selectedObject, 
    transformMode, 
    editMode, 
    setTransformMode, 
    setEditMode,
    startObjectPlacement,
    addLight
  } = useSceneStore();
  
  const [showObjectMenu, setShowObjectMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [textInput, setTextInput] = useState('Hello World');
  const [showTextInput, setShowTextInput] = useState(false);

  // Custom Circle Icon Component for Sphere
  const CircleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );

  // Custom Donut Icon Component for Torus
  const DonutIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );

  // Complete alphabet function to create letter shapes
  const createLetterShape = (char: string) => {
    const shape = new THREE.Shape();
    const charWidth = 0.8;
    const charHeight = 1.2;
    
    // Handle both uppercase and lowercase
    const upperChar = char.toUpperCase();
    const isLowercase = char !== upperChar;
    
    // Adjust dimensions for lowercase letters
    const height = isLowercase ? charHeight * 0.7 : charHeight;
    const width = charWidth;
    
    switch (upperChar) {
      case 'A':
        if (isLowercase) {
          // Lowercase 'a' - circular with vertical line
          shape.moveTo(width * 0.3, 0);
          shape.bezierCurveTo(width * 0.1, 0, 0, height * 0.2, 0, height * 0.4);
          shape.bezierCurveTo(0, height * 0.6, width * 0.1, height * 0.8, width * 0.3, height * 0.8);
          shape.lineTo(width * 0.7, height * 0.8);
          shape.lineTo(width * 0.7, 0);
          shape.lineTo(width * 0.5, 0);
          shape.lineTo(width * 0.5, height * 0.6);
          shape.lineTo(width * 0.3, height * 0.6);
          shape.bezierCurveTo(width * 0.2, height * 0.6, width * 0.15, height * 0.5, width * 0.15, height * 0.4);
          shape.bezierCurveTo(width * 0.15, height * 0.3, width * 0.2, height * 0.2, width * 0.3, height * 0.2);
          shape.lineTo(width * 0.5, height * 0.2);
          shape.lineTo(width * 0.5, 0);
          shape.lineTo(width * 0.3, 0);
        } else {
          // Uppercase 'A'
          shape.moveTo(width * 0.1, 0);
          shape.lineTo(width * 0.5, height);
          shape.lineTo(width * 0.9, 0);
          shape.lineTo(width * 0.75, 0);
          shape.lineTo(width * 0.65, height * 0.3);
          shape.lineTo(width * 0.35, height * 0.3);
          shape.lineTo(width * 0.25, 0);
          shape.lineTo(width * 0.1, 0);
          
          // Create hole for crossbar
          const hole = new THREE.Path();
          hole.moveTo(width * 0.42, height * 0.45);
          hole.lineTo(width * 0.58, height * 0.45);
          hole.lineTo(width * 0.55, height * 0.55);
          hole.lineTo(width * 0.45, height * 0.55);
          hole.lineTo(width * 0.42, height * 0.45);
          shape.holes.push(hole);
        }
        break;
        
      case 'B':
        if (isLowercase) {
          // Lowercase 'b'
          shape.moveTo(0, 0);
          shape.lineTo(0, height * 1.4); // Ascender
          shape.lineTo(width * 0.15, height * 1.4);
          shape.lineTo(width * 0.15, height * 0.8);
          shape.lineTo(width * 0.6, height * 0.8);
          shape.bezierCurveTo(width * 0.85, height * 0.8, width, height * 0.65, width, height * 0.4);
          shape.bezierCurveTo(width, height * 0.15, width * 0.85, 0, width * 0.6, 0);
          shape.lineTo(0, 0);
          
          // Create hole
          const hole = new THREE.Path();
          hole.moveTo(width * 0.15, height * 0.15);
          hole.lineTo(width * 0.6, height * 0.15);
          hole.bezierCurveTo(width * 0.75, height * 0.15, width * 0.85, height * 0.25, width * 0.85, height * 0.4);
          hole.bezierCurveTo(width * 0.85, height * 0.55, width * 0.75, height * 0.65, width * 0.6, height * 0.65);
          hole.lineTo(width * 0.15, height * 0.65);
          hole.lineTo(width * 0.15, height * 0.15);
          shape.holes.push(hole);
        } else {
          // Uppercase 'B'
          shape.moveTo(0, 0);
          shape.lineTo(0, height);
          shape.lineTo(width * 0.6, height);
          shape.bezierCurveTo(width * 0.8, height, width * 0.9, height * 0.85, width * 0.9, height * 0.75);
          shape.bezierCurveTo(width * 0.9, height * 0.65, width * 0.85, height * 0.55, width * 0.75, height * 0.5);
          shape.bezierCurveTo(width * 0.85, height * 0.45, width * 0.9, height * 0.35, width * 0.9, height * 0.25);
          shape.bezierCurveTo(width * 0.9, height * 0.15, width * 0.8, 0, width * 0.6, 0);
          shape.lineTo(0, 0);
          
          // Create holes for both bumps
          const hole1 = new THREE.Path();
          hole1.moveTo(width * 0.15, height * 0.55);
          hole1.lineTo(width * 0.6, height * 0.55);
          hole1.bezierCurveTo(width * 0.7, height * 0.55, width * 0.75, height * 0.65, width * 0.75, height * 0.75);
          hole1.bezierCurveTo(width * 0.75, height * 0.8, width * 0.7, height * 0.85, width * 0.6, height * 0.85);
          hole1.lineTo(width * 0.15, height * 0.85);
          hole1.lineTo(width * 0.15, height * 0.55);
          shape.holes.push(hole1);
          
          const hole2 = new THREE.Path();
          hole2.moveTo(width * 0.15, height * 0.15);
          hole2.lineTo(width * 0.6, height * 0.15);
          hole2.bezierCurveTo(width * 0.7, height * 0.15, width * 0.75, height * 0.2, width * 0.75, height * 0.25);
          hole2.bezierCurveTo(width * 0.75, height * 0.35, width * 0.7, height * 0.4, width * 0.6, height * 0.4);
          hole2.lineTo(width * 0.15, height * 0.4);
          hole2.lineTo(width * 0.15, height * 0.15);
          shape.holes.push(hole2);
        }
        break;
        
      case 'C':
        if (isLowercase) {
          // Lowercase 'c'
          shape.moveTo(width * 0.8, height * 0.3);
          shape.bezierCurveTo(width * 0.8, height * 0.1, width * 0.65, 0, width * 0.4, 0);
          shape.bezierCurveTo(width * 0.15, 0, 0, height * 0.15, 0, height * 0.4);
          shape.bezierCurveTo(0, height * 0.65, width * 0.15, height * 0.8, width * 0.4, height * 0.8);
          shape.bezierCurveTo(width * 0.65, height * 0.8, width * 0.8, height * 0.7, width * 0.8, height * 0.5);
          shape.lineTo(width * 0.65, height * 0.5);
          shape.bezierCurveTo(width * 0.65, height * 0.6, width * 0.55, height * 0.65, width * 0.4, height * 0.65);
          shape.bezierCurveTo(width * 0.25, height * 0.65, width * 0.15, height * 0.55, width * 0.15, height * 0.4);
          shape.bezierCurveTo(width * 0.15, height * 0.25, width * 0.25, height * 0.15, width * 0.4, height * 0.15);
          shape.bezierCurveTo(width * 0.55, height * 0.15, width * 0.65, height * 0.2, width * 0.65, height * 0.3);
          shape.lineTo(width * 0.8, height * 0.3);
        } else {
          // Uppercase 'C'
          shape.moveTo(width, height * 0.8);
          shape.bezierCurveTo(width, height, width * 0.8, height, width * 0.5, height);
          shape.bezierCurveTo(width * 0.2, height, 0, height * 0.8, 0, height * 0.5);
          shape.bezierCurveTo(0, height * 0.2, width * 0.2, 0, width * 0.5, 0);
          shape.bezierCurveTo(width * 0.8, 0, width, height * 0.2, width, height * 0.2);
          shape.lineTo(width * 0.8, height * 0.3);
          shape.bezierCurveTo(width * 0.8, height * 0.15, width * 0.7, height * 0.15, width * 0.5, height * 0.15);
          shape.bezierCurveTo(width * 0.3, height * 0.15, width * 0.15, height * 0.3, width * 0.15, height * 0.5);
          shape.bezierCurveTo(width * 0.15, height * 0.7, width * 0.3, height * 0.85, width * 0.5, height * 0.85);
          shape.bezierCurveTo(width * 0.7, height * 0.85, width * 0.8, height * 0.7, width * 0.8, height * 0.7);
          shape.lineTo(width, height * 0.8);
        }
        break;
        
      case 'D':
        if (isLowercase) {
          // Lowercase 'd'
          shape.moveTo(width * 0.7, 0);
          shape.lineTo(width * 0.7, height * 1.4); // Ascender
          shape.lineTo(width * 0.85, height * 1.4);
          shape.lineTo(width * 0.85, 0);
          shape.lineTo(width * 0.4, 0);
          shape.bezierCurveTo(width * 0.15, 0, 0, height * 0.15, 0, height * 0.4);
          shape.bezierCurveTo(0, height * 0.65, width * 0.15, height * 0.8, width * 0.4, height * 0.8);
          shape.lineTo(width * 0.7, height * 0.8);
          shape.lineTo(width * 0.7, 0);
          
          // Create hole
          const hole = new THREE.Path();
          hole.moveTo(width * 0.15, height * 0.4);
          hole.bezierCurveTo(width * 0.15, height * 0.25, width * 0.25, height * 0.15, width * 0.4, height * 0.15);
          hole.lineTo(width * 0.7, height * 0.15);
          hole.lineTo(width * 0.7, height * 0.65);
          hole.lineTo(width * 0.4, height * 0.65);
          hole.bezierCurveTo(width * 0.25, height * 0.65, width * 0.15, height * 0.55, width * 0.15, height * 0.4);
          shape.holes.push(hole);
        } else {
          // Uppercase 'D'
          shape.moveTo(0, 0);
          shape.lineTo(0, height);
          shape.lineTo(width * 0.6, height);
          shape.bezierCurveTo(width * 0.85, height, width, height * 0.8, width, height * 0.5);
          shape.bezierCurveTo(width, height * 0.2, width * 0.85, 0, width * 0.6, 0);
          shape.lineTo(0, 0);
          
          // Create hole
          const hole = new THREE.Path();
          hole.moveTo(width * 0.15, height * 0.15);
          hole.lineTo(width * 0.6, height * 0.15);
          hole.bezierCurveTo(width * 0.75, height * 0.15, width * 0.85, height * 0.25, width * 0.85, height * 0.5);
          hole.bezierCurveTo(width * 0.85, height * 0.75, width * 0.75, height * 0.85, width * 0.6, height * 0.85);
          hole.lineTo(width * 0.15, height * 0.85);
          hole.lineTo(width * 0.15, height * 0.15);
          shape.holes.push(hole);
        }
        break;
        
      case 'E':
        if (isLowercase) {
          // Lowercase 'e'
          shape.moveTo(width * 0.8, height * 0.3);
          shape.lineTo(width * 0.15, height * 0.3);
          shape.lineTo(width * 0.15, height * 0.45);
          shape.lineTo(width * 0.7, height * 0.45);
          shape.bezierCurveTo(width * 0.8, height * 0.5, width * 0.85, height * 0.6, width * 0.85, height * 0.7);
          shape.bezierCurveTo(width * 0.85, height * 0.75, width * 0.7, height * 0.8, width * 0.4, height * 0.8);
          shape.bezierCurveTo(width * 0.15, height * 0.8, 0, height * 0.65, 0, height * 0.4);
          shape.bezierCurveTo(0, height * 0.15, width * 0.15, 0, width * 0.4, 0);
          shape.bezierCurveTo(width * 0.65, 0, width * 0.8, height * 0.1, width * 0.8, height * 0.3);
          
          // Create hole
          const hole = new THREE.Path();
          hole.moveTo(width * 0.15, height * 0.15);
          hole.bezierCurveTo(width * 0.25, height * 0.15, width * 0.7, height * 0.15, width * 0.7, height * 0.15);
          hole.lineTo(width * 0.7, height * 0.3);
          hole.lineTo(width * 0.15, height * 0.3);
          hole.lineTo(width * 0.15, height * 0.15);
          shape.holes.push(hole);
        } else {
          // Uppercase 'E'
          shape.moveTo(0, 0);
          shape.lineTo(0, height);
          shape.lineTo(width, height);
          shape.lineTo(width, height * 0.85);
          shape.lineTo(width * 0.15, height * 0.85);
          shape.lineTo(width * 0.15, height * 0.6);
          shape.lineTo(width * 0.8, height * 0.6);
          shape.lineTo(width * 0.8, height * 0.4);
          shape.lineTo(width * 0.15, height * 0.4);
          shape.lineTo(width * 0.15, height * 0.15);
          shape.lineTo(width, height * 0.15);
          shape.lineTo(width, 0);
          shape.lineTo(0, 0);
        }
        break;
        
      case 'F':
        if (isLowercase) {
          // Lowercase 'f'
          shape.moveTo(width * 0.3, 0);
          shape.lineTo(width * 0.3, height * 1.1);
          shape.bezierCurveTo(width * 0.3, height * 1.3, width * 0.4, height * 1.4, width * 0.6, height * 1.4);
          shape.lineTo(width * 0.8, height * 1.4);
          shape.lineTo(width * 0.8, height * 1.25);
          shape.lineTo(width * 0.6, height * 1.25);
          shape.bezierCurveTo(width * 0.5, height * 1.25, width * 0.45, height * 1.2, width * 0.45, height * 1.1);
          shape.lineTo(width * 0.45, height * 0.8);
          shape.lineTo(width * 0.7, height * 0.8);
          shape.lineTo(width * 0.7, height * 0.65);
          shape.lineTo(width * 0.45, height * 0.65);
          shape.lineTo(width * 0.45, 0);
          shape.lineTo(width * 0.3, 0);
        } else {
          // Uppercase 'F'
          shape.moveTo(0, 0);
          shape.lineTo(0, height);
          shape.lineTo(width, height);
          shape.lineTo(width, height * 0.85);
          shape.lineTo(width * 0.15, height * 0.85);
          shape.lineTo(width * 0.15, height * 0.6);
          shape.lineTo(width * 0.8, height * 0.6);
          shape.lineTo(width * 0.8, height * 0.4);
          shape.lineTo(width * 0.15, height * 0.4);
          shape.lineTo(width * 0.15, 0);
          shape.lineTo(0, 0);
        }
        break;
        
      case 'G':
        if (isLowercase) {
          // Lowercase 'g'
          shape.moveTo(width * 0.85, height * 0.8);
          shape.lineTo(width * 0.85, height * -0.3); // Descender
          shape.bezierCurveTo(width * 0.85, height * -0.5, width * 0.7, height * -0.6, width * 0.4, height * -0.6);
          shape.lineTo(width * 0.2, height * -0.6);
          shape.lineTo(width * 0.2, height * -0.45);
          shape.lineTo(width * 0.4, height * -0.45);
          shape.bezierCurveTo(width * 0.6, height * -0.45, width * 0.7, height * -0.4, width * 0.7, height * -0.3);
          shape.lineTo(width * 0.7, 0);
          shape.lineTo(width * 0.4, 0);
          shape.bezierCurveTo(width * 0.15, 0, 0, height * 0.15, 0, height * 0.4);
          shape.bezierCurveTo(0, height * 0.65, width * 0.15, height * 0.8, width * 0.4, height * 0.8);
          shape.lineTo(width * 0.85, height * 0.8);
          
          // Create hole
          const hole = new THREE.Path();
          hole.moveTo(width * 0.15, height * 0.4);
          hole.bezierCurveTo(width * 0.15, height * 0.25, width * 0.25, height * 0.15, width * 0.4, height * 0.15);
          hole.lineTo(width * 0.7, height * 0.15);
          hole.lineTo(width * 0.7, height * 0.65);
          hole.lineTo(width * 0.4, height * 0.65);
          hole.bezierCurveTo(width * 0.25, height * 0.65, width * 0.15, height * 0.55, width * 0.15, height * 0.4);
          shape.holes.push(hole);
        } else {
          // Uppercase 'G'
          shape.moveTo(width, height * 0.8);
          shape.bezierCurveTo(width, height, width * 0.8, height, width * 0.5, height);
          shape.bezierCurveTo(width * 0.2, height, 0, height * 0.8, 0, height * 0.5);
          shape.bezierCurveTo(0, height * 0.2, width * 0.2, 0, width * 0.5, 0);
          shape.bezierCurveTo(width * 0.8, 0, width, height * 0.2, width, height * 0.4);
          shape.lineTo(width * 0.6, height * 0.4);
          shape.lineTo(width * 0.6, height * 0.55);
          shape.lineTo(width * 0.85, height * 0.55);
          shape.lineTo(width * 0.85, height * 0.3);
          shape.bezierCurveTo(width * 0.85, height * 0.15, width * 0.7, height * 0.15, width * 0.5, height * 0.15);
          shape.bezierCurveTo(width * 0.3, height * 0.15, width * 0.15, height * 0.3, width * 0.15, height * 0.5);
          shape.bezierCurveTo(width * 0.15, height * 0.7, width * 0.3, height * 0.85, width * 0.5, height * 0.85);
          shape.bezierCurveTo(width * 0.7, height * 0.85, width * 0.85, height * 0.7, width * 0.85, height * 0.7);
          shape.lineTo(width, height * 0.8);
        }
        break;
        
      case 'H':
        if (isLowercase) {
          // Lowercase 'h'
          shape.moveTo(0, 0);
          shape.lineTo(0, height * 1.4); // Ascender
          shape.lineTo(width * 0.15, height * 1.4);
          shape.lineTo(width * 0.15, height * 0.5);
          shape.lineTo(width * 0.65, height * 0.5);
          shape.lineTo(width * 0.65, height * 1.4);
          shape.lineTo(width * 0.8, height * 1.4);
          shape.lineTo(width * 0.8, 0);
          shape.lineTo(width * 0.65, 0);
          shape.lineTo(width * 0.65, height * 0.35);
          shape.lineTo(width * 0.15, height * 0.35);
          shape.lineTo(width * 0.15, 0);
          shape.lineTo(0, 0);
        } else {
          // Uppercase 'H'
          shape.moveTo(0, 0);
          shape.lineTo(0, height);
          shape.lineTo(width * 0.15, height);
          shape.lineTo(width * 0.15, height * 0.6);
          shape.lineTo(width * 0.65, height * 0.6);
          shape.lineTo(width * 0.65, height);
          shape.lineTo(width * 0.8, height);
          shape.lineTo(width * 0.8, 0);
          shape.lineTo(width * 0.65, 0);
          shape.lineTo(width * 0.65, height * 0.4);
          shape.lineTo(width * 0.15, height * 0.4);
          shape.lineTo(width * 0.15, 0);
          shape.lineTo(0, 0);
        }
        break;
        
      case 'I':
        if (isLowercase) {
          // Lowercase 'i'
          shape.moveTo(width * 0.3, 0);
          shape.lineTo(width * 0.3, height * 0.8);
          shape.lineTo(width * 0.5, height * 0.8);
          shape.lineTo(width * 0.5, 0);
          shape.lineTo(width * 0.3, 0);
          
          // Dot above
          shape.moveTo(width * 0.3, height * 1.0);
          shape.lineTo(width * 0.5, height * 1.0);
          shape.lineTo(width * 0.5, height * 1.2);
          shape.lineTo(width * 0.3, height * 1.2);
          shape.lineTo(width * 0.3, height * 1.0);
        } else {
          // Uppercase 'I'
          shape.moveTo(0, 0);
          shape.lineTo(0, height * 0.15);
          shape.lineTo(width * 0.3, height * 0.15);
          shape.lineTo(width * 0.3, height * 0.85);
          shape.lineTo(0, height * 0.85);
          shape.lineTo(0, height);
          shape.lineTo(width, height);
          shape.lineTo(width, height * 0.85);
          shape.lineTo(width * 0.7, height * 0.85);
          shape.lineTo(width * 0.7, height * 0.15);
          shape.lineTo(width, height * 0.15);
          shape.lineTo(width, 0);
          shape.lineTo(0, 0);
        }
        break;
        
      case 'J':
        if (isLowercase) {
          // Lowercase 'j'
          shape.moveTo(width * 0.4, height * -0.6); // Descender
          shape.bezierCurveTo(width * 0.2, height * -0.6, 0, height * -0.5, 0, height * -0.3);
          shape.lineTo(0, height * -0.15);
          shape.bezierCurveTo(0, height * -0.35, width * 0.1, height * -0.45, width * 0.4, height * -0.45);
          shape.bezierCurveTo(width * 0.6, height * -0.45, width * 0.7, height * -0.35, width * 0.7, height * -0.15);
          shape.lineTo(width * 0.7, height * 0.8);
          shape.lineTo(width * 0.85, height * 0.8);
          shape.lineTo(width * 0.85, height * -0.15);
          shape.bezierCurveTo(width * 0.85, height * -0.45, width * 0.7, height * -0.6, width * 0.4, height * -0.6);
          
          // Dot above
          shape.moveTo(width * 0.7, height * 1.0);
          shape.lineTo(width * 0.85, height * 1.0);
          shape.lineTo(width * 0.85, height * 1.2);
          shape.lineTo(width * 0.7, height * 1.2);
          shape.lineTo(width * 0.7, height * 1.0);
        } else {
          // Uppercase 'J'
          shape.moveTo(width * 0.3, 0);
          shape.bezierCurveTo(width * 0.1, 0, 0, height * 0.1, 0, height * 0.3);
          shape.lineTo(0, height * 0.45);
          shape.bezierCurveTo(0, height * 0.2, width * 0.2, height * 0.15, width * 0.3, height * 0.15);
          shape.bezierCurveTo(width * 0.5, height * 0.15, width * 0.65, height * 0.2, width * 0.65, height * 0.45);
          shape.lineTo(width * 0.65, height * 0.85);
          shape.lineTo(width * 0.3, height * 0.85);
          shape.lineTo(width * 0.3, height);
          shape.lineTo(width, height);
          shape.lineTo(width, 0);
          shape.lineTo(width * 0.3, 0);
        }
        break;
        
      case 'K':
        if (isLowercase) {
          // Lowercase 'k'
          shape.moveTo(0, 0);
          shape.lineTo(0, height * 1.4); // Ascender
          shape.lineTo(width * 0.15, height * 1.4);
          shape.lineTo(width * 0.15, height * 0.5);
          shape.lineTo(width * 0.4, height * 0.5);
          shape.lineTo(width * 0.7, height * 0.8);
          shape.lineTo(width * 0.9, height * 0.8);
          shape.lineTo(width * 0.55, height * 0.4);
          shape.lineTo(width * 0.9, 0);
          shape.lineTo(width * 0.7, 0);
          shape.lineTo(width * 0.4, height * 0.35);
          shape.lineTo(width * 0.15, height * 0.35);
          shape.lineTo(width * 0.15, 0);
          shape.lineTo(0, 0);
        } else {
          // Uppercase 'K'
          shape.moveTo(0, 0);
          shape.lineTo(0, height);
          shape.lineTo(width * 0.15, height);
          shape.lineTo(width * 0.15, height * 0.6);
          shape.lineTo(width * 0.4, height * 0.6);
          shape.lineTo(width * 0.8, height);
          shape.lineTo(width, height);
          shape.lineTo(width * 0.55, height * 0.5);
          shape.lineTo(width, 0);
          shape.lineTo(width * 0.8, 0);
          shape.lineTo(width * 0.4, height * 0.4);
          shape.lineTo(width * 0.15, height * 0.4);
          shape.lineTo(width * 0.15, 0);
          shape.lineTo(0, 0);
        }
        break;
        
      case 'L':
        if (isLowercase) {
          // Lowercase 'l'
          shape.moveTo(width * 0.3, 0);
          shape.lineTo(width * 0.3, height * 1.4); // Ascender
          shape.lineTo(width * 0.5, height * 1.4);
          shape.lineTo(width * 0.5, 0);
          shape.lineTo(width * 0.3, 0);
        } else {
          // Uppercase 'L'
          shape.moveTo(0, 0);
          shape.lineTo(0, height);
          shape.lineTo(width * 0.15, height);
          shape.lineTo(width * 0.15, height * 0.15);
          shape.lineTo(width, height * 0.15);
          shape.lineTo(width, 0);
          shape.lineTo(0, 0);
        }
        break;
        
      case 'M':
        if (isLowercase) {
          // Lowercase 'm'
          shape.moveTo(0, 0);
          shape.lineTo(0, height * 0.8);
          shape.lineTo(width * 0.12, height * 0.8);
          shape.lineTo(width * 0.12, height * 0.15);
          shape.lineTo(width * 0.25, height * 0.15);
          shape.lineTo(width * 0.25, height * 0.8);
          shape.lineTo(width * 0.37, height * 0.8);
          shape.lineTo(width * 0.37, height * 0.15);
          shape.lineTo(width * 0.5, height * 0.15);
          shape.lineTo(width * 0.5, height * 0.8);
          shape.lineTo(width * 0.62, height * 0.8);
          shape.lineTo(width * 0.62, height * 0.15);
          shape.lineTo(width * 0.75, height * 0.15);
          shape.lineTo(width * 0.75, height * 0.8);
          shape.lineTo(width * 0.87, height * 0.8);
          shape.lineTo(width * 0.87, 0);
          shape.lineTo(0, 0);
        } else {
          // Uppercase 'M'
          shape.moveTo(0, 0);
          shape.lineTo(0, height);
          shape.lineTo(width * 0.15, height);
          shape.lineTo(width * 0.15, height * 0.3);
          shape.lineTo(width * 0.4, height * 0.8);
          shape.lineTo(width * 0.6, height * 0.8);
          shape.lineTo(width * 0.85, height * 0.3);
          shape.lineTo(width * 0.85, height);
          shape.lineTo(width, height);
          shape.lineTo(width, 0);
          shape.lineTo(width * 0.85, 0);
          shape.lineTo(width * 0.85, height * 0.7);
          shape.lineTo(width * 0.65, height * 0.3);
          shape.lineTo(width * 0.35, height * 0.3);
          shape.lineTo(width * 0.15, height * 0.7);
          shape.lineTo(width * 0.15, 0);
          shape.lineTo(0, 0);
        }
        break;
        
      case 'N':
        if (isLowercase) {
          // Lowercase 'n'
          shape.moveTo(0, 0);
          shape.lineTo(0, height * 0.8);
          shape.lineTo(width * 0.15, height * 0.8);
          shape.lineTo(width * 0.15, height * 0.15);
          shape.lineTo(width * 0.65, height * 0.15);
          shape.lineTo(width * 0.65, height * 0.8);
          shape.lineTo(width * 0.8, height * 0.8);
          shape.lineTo(width * 0.8, 0);
          shape.lineTo(0, 0);
        } else {
          // Uppercase 'N'
          shape.moveTo(0, 0);
          shape.lineTo(0, height);
          shape.lineTo(width * 0.15, height);
          shape.lineTo(width * 0.15, height * 0.3);
          shape.lineTo(width * 0.65, height * 0.8);
          shape.lineTo(width * 0.8, height * 0.8);
          shape.lineTo(width * 0.8, 0);
          shape.lineTo(width * 0.65, 0);
          shape.lineTo(width * 0.65, height * 0.7);
          shape.lineTo(width * 0.15, height * 0.2);
          shape.lineTo(0, height * 0.2);
          shape.lineTo(0, 0);
        }
        break;
        
      case 'O':
        if (isLowercase) {
          // Lowercase 'o'
          shape.moveTo(width * 0.4, 0);
          shape.bezierCurveTo(width * 0.15, 0, 0, height * 0.15, 0, height * 0.4);
          shape.bezierCurveTo(0, height * 0.65, width * 0.15, height * 0.8, width * 0.4, height * 0.8);
          shape.bezierCurveTo(width * 0.65, height * 0.8, width * 0.8, height * 0.65, width * 0.8, height * 0.4);
          shape.bezierCurveTo(width * 0.8, height * 0.15, width * 0.65, 0, width * 0.4, 0);
          
          // Create hole
          const hole = new THREE.Path();
          hole.moveTo(width * 0.4, height * 0.15);
          hole.bezierCurveTo(width * 0.55, height * 0.15, width * 0.65, height * 0.25, width * 0.65, height * 0.4);
          hole.bezierCurveTo(width * 0.65, height * 0.55, width * 0.55, height * 0.65, width * 0.4, height * 0.65);
          hole.bezierCurveTo(width * 0.25, height * 0.65, width * 0.15, height * 0.55, width * 0.15, height * 0.4);
          hole.bezierCurveTo(width * 0.15, height * 0.25, width * 0.25, height * 0.15, width * 0.4, height * 0.15);
          shape.holes.push(hole);
        } else {
          // Uppercase 'O'
          shape.moveTo(width * 0.5, 0);
          shape.bezierCurveTo(width * 0.8, 0, width, height * 0.2, width, height * 0.5);
          shape.bezierCurveTo(width, height * 0.8, width * 0.8, height, width * 0.5, height);
          shape.bezierCurveTo(width * 0.2, height, 0, height * 0.8, 0, height * 0.5);
          shape.bezierCurveTo(0, height * 0.2, width * 0.2, 0, width * 0.5, 0);
          
          // Create hole
          const hole = new THREE.Path();
          hole.moveTo(width * 0.5, height * 0.15);
          hole.bezierCurveTo(width * 0.7, height * 0.15, width * 0.85, height * 0.3, width * 0.85, height * 0.5);
          hole.bezierCurveTo(width * 0.85, height * 0.7, width * 0.7, height * 0.85, width * 0.5, height * 0.85);
          hole.bezierCurveTo(width * 0.3, height * 0.85, width * 0.15, height * 0.7, width * 0.15, height * 0.5);
          hole.bezierCurveTo(width * 0.15, height * 0.3, width * 0.3, height * 0.15, width * 0.5, height * 0.15);
          shape.holes.push(hole);
        }
        break;
        
      case 'P':
        if (isLowercase) {
          // Lowercase 'p'
          shape.moveTo(0, height * -0.6); // Descender
          shape.lineTo(0, height * 0.8);
          shape.lineTo(width * 0.6, height * 0.8);
          shape.bezierCurveTo(width * 0.85, height * 0.8, width, height * 0.65, width, height * 0.4);
          shape.bezierCurveTo(width, height * 0.15, width * 0.85, 0, width * 0.6, 0);
          shape.lineTo(width * 0.15, 0);
          shape.lineTo(width * 0.15, height * -0.6);
          shape.lineTo(0, height * -0.6);
          
          // Create hole
          const hole = new THREE.Path();
          hole.moveTo(width * 0.15, height * 0.15);
          hole.lineTo(width * 0.6, height * 0.15);
          hole.bezierCurveTo(width * 0.75, height * 0.15, width * 0.85, height * 0.25, width * 0.85, height * 0.4);
          hole.bezierCurveTo(width * 0.85, height * 0.55, width * 0.75, height * 0.65, width * 0.6, height * 0.65);
          hole.lineTo(width * 0.15, height * 0.65);
          hole.lineTo(width * 0.15, height * 0.15);
          shape.holes.push(hole);
        } else {
          // Uppercase 'P'
          shape.moveTo(0, 0);
          shape.lineTo(0, height);
          shape.lineTo(width * 0.6, height);
          shape.bezierCurveTo(width * 0.85, height, width, height * 0.8, width, height * 0.65);
          shape.bezierCurveTo(width, height * 0.5, width * 0.85, height * 0.4, width * 0.6, height * 0.4);
          shape.lineTo(width * 0.15, height * 0.4);
          shape.lineTo(width * 0.15, 0);
          shape.lineTo(0, 0);
          
          // Create hole
          const hole = new THREE.Path();
          hole.moveTo(width * 0.15, height * 0.55);
          hole.lineTo(width * 0.6, height * 0.55);
          hole.bezierCurveTo(width * 0.75, height * 0.55, width * 0.85, height * 0.65, width * 0.85, height * 0.75);
          hole.bezierCurveTo(width * 0.85, height * 0.8, width * 0.75, height * 0.85, width * 0.6, height * 0.85);
          hole.lineTo(width * 0.15, height * 0.85);
          hole.lineTo(width * 0.15, height * 0.55);
          shape.holes.push(hole);
        }
        break;
        
      case 'Q':
        if (isLowercase) {
          // Lowercase 'q'
          shape.moveTo(width * 0.85, height * -0.6); // Descender
          shape.lineTo(width * 0.85, height * 0.8);
          shape.lineTo(width * 0.4, height * 0.8);
          shape.bezierCurveTo(width * 0.15, height * 0.8, 0, height * 0.65, 0, height * 0.4);
          shape.bezierCurveTo(0, height * 0.15, width * 0.15, 0, width * 0.4, 0);
          shape.lineTo(width * 0.7, 0);
          shape.lineTo(width * 0.7, height * -0.6);
          shape.lineTo(width * 0.85, height * -0.6);
          
          // Create hole
          const hole = new THREE.Path();
          hole.moveTo(width * 0.15, height * 0.4);
          hole.bezierCurveTo(width * 0.15, height * 0.25, width * 0.25, height * 0.15, width * 0.4, height * 0.15);
          hole.lineTo(width * 0.7, height * 0.15);
          hole.lineTo(width * 0.7, height * 0.65);
          hole.lineTo(width * 0.4, height * 0.65);
          hole.bezierCurveTo(width * 0.25, height * 0.65, width * 0.15, height * 0.55, width * 0.15, height * 0.4);
          shape.holes.push(hole);
        } else {
          // Uppercase 'Q'
          shape.moveTo(width * 0.5, 0);
          shape.bezierCurveTo(width * 0.8, 0, width, height * 0.2, width, height * 0.5);
          shape.bezierCurveTo(width, height * 0.8, width * 0.8, height, width * 0.5, height);
          shape.bezierCurveTo(width * 0.2, height, 0, height * 0.8, 0, height * 0.5);
          shape.bezierCurveTo(0, height * 0.2, width * 0.2, 0, width * 0.5, 0);
          
          // Add tail
          shape.moveTo(width * 0.7, height * 0.3);
          shape.lineTo(width * 0.9, height * 0.1);
          shape.lineTo(width, height * 0.2);
          shape.lineTo(width * 0.8, height * 0.4);
          shape.lineTo(width * 0.7, height * 0.3);
          
          // Create hole
          const hole = new THREE.Path();
          hole.moveTo(width * 0.5, height * 0.15);
          hole.bezierCurveTo(width * 0.7, height * 0.15, width * 0.85, height * 0.3, width * 0.85, height * 0.5);
          hole.bezierCurveTo(width * 0.85, height * 0.7, width * 0.7, height * 0.85, width * 0.5, height * 0.85);
          hole.bezierCurveTo(width * 0.3, height * 0.85, width * 0.15, height * 0.7, width * 0.15, height * 0.5);
          hole.bezierCurveTo(width * 0.15, height * 0.3, width * 0.3, height * 0.15, width * 0.5, height * 0.15);
          shape.holes.push(hole);
        }
        break;
        
      case 'R':
        if (isLowercase) {
          // Lowercase 'r'
          shape.moveTo(0, 0);
          shape.lineTo(0, height * 0.8);
          shape.lineTo(width * 0.15, height * 0.8);
          shape.lineTo(width * 0.15, height * 0.65);
          shape.lineTo(width * 0.4, height * 0.65);
          shape.bezierCurveTo(width * 0.6, height * 0.65, width * 0.7, height * 0.7, width * 0.7, height * 0.8);
          shape.lineTo(width * 0.85, height * 0.8);
          shape.bezierCurveTo(width * 0.85, height * 0.6, width * 0.7, height * 0.5, width * 0.4, height * 0.5);
          shape.lineTo(width * 0.15, height * 0.5);
          shape.lineTo(width * 0.15, 0);
          shape.lineTo(0, 0);
        } else {
          // Uppercase 'R'
          shape.moveTo(0, 0);
          shape.lineTo(0, height);
          shape.lineTo(width * 0.6, height);
          shape.bezierCurveTo(width * 0.85, height, width, height * 0.8, width, height * 0.65);
          shape.bezierCurveTo(width, height * 0.5, width * 0.85, height * 0.4, width * 0.6, height * 0.4);
          shape.lineTo(width * 0.8, 0);
          shape.lineTo(width * 0.6, 0);
          shape.lineTo(width * 0.4, height * 0.4);
          shape.lineTo(width * 0.15, height * 0.4);
          shape.lineTo(width * 0.15, 0);
          shape.lineTo(0, 0);
          
          // Create hole
          const hole = new THREE.Path();
          hole.moveTo(width * 0.15, height * 0.55);
          hole.lineTo(width * 0.6, height * 0.55);
          hole.bezierCurveTo(width * 0.75, height * 0.55, width * 0.85, height * 0.65, width * 0.85, height * 0.75);
          hole.bezierCurveTo(width * 0.85, height * 0.8, width * 0.75, height * 0.85, width * 0.6, height * 0.85);
          hole.lineTo(width * 0.15, height * 0.85);
          hole.lineTo(width * 0.15, height * 0.55);
          shape.holes.push(hole);
        }
        break;
        
      case 'S':
        if (isLowercase) {
          // Lowercase 's'
          shape.moveTo(width * 0.7, height * 0.2);
          shape.bezierCurveTo(width * 0.7, height * 0.1, width * 0.6, 0, width * 0.4, 0);
          shape.bezierCurveTo(width * 0.2, 0, 0, height * 0.1, 0, height * 0.25);
          shape.bezierCurveTo(0, height * 0.35, width * 0.1, height * 0.4, width * 0.3, height * 0.4);
          shape.lineTo(width * 0.5, height * 0.4);
          shape.bezierCurveTo(width * 0.6, height * 0.4, width * 0.7, height * 0.45, width * 0.7, height * 0.55);
          shape.bezierCurveTo(width * 0.7, height * 0.65, width * 0.6, height * 0.8, width * 0.4, height * 0.8);
          shape.bezierCurveTo(width * 0.2, height * 0.8, 0, height * 0.7, 0, height * 0.6);
          shape.lineTo(width * 0.15, height * 0.6);
          shape.bezierCurveTo(width * 0.15, height * 0.65, width * 0.25, height * 0.65, width * 0.4, height * 0.65);
          shape.bezierCurveTo(width * 0.5, height * 0.65, width * 0.55, height * 0.6, width * 0.55, height * 0.55);
          shape.bezierCurveTo(width * 0.55, height * 0.5, width * 0.5, height * 0.55, width * 0.4, height * 0.55);
          shape.lineTo(width * 0.3, height * 0.55);
          shape.bezierCurveTo(width * 0.1, height * 0.55, 0, height * 0.45, 0, height * 0.25);
          shape.bezierCurveTo(0, height * 0.1, width * 0.1, 0, width * 0.4, 0);
          shape.bezierCurveTo(width * 0.6, 0, width * 0.7, height * 0.1, width * 0.7, height * 0.2);
        } else {
          // Uppercase 'S'
          shape.moveTo(width, height * 0.8);
          shape.bezierCurveTo(width, height, width * 0.8, height, width * 0.5, height);
          shape.bezierCurveTo(width * 0.2, height, 0, height * 0.8, 0, height * 0.6);
          shape.bezierCurveTo(0, height * 0.4, width * 0.2, height * 0.5, width * 0.5, height * 0.5);
          shape.bezierCurveTo(width * 0.8, height * 0.5, width, height * 0.4, width, height * 0.2);
          shape.bezierCurveTo(width, 0, width * 0.8, 0, width * 0.5, 0);
          shape.bezierCurveTo(width * 0.2, 0, 0, height * 0.2, 0, height * 0.2);
          shape.lineTo(width * 0.2, height * 0.3);
          shape.bezierCurveTo(width * 0.2, height * 0.15, width * 0.3, height * 0.15, width * 0.5, height * 0.15);
          shape.bezierCurveTo(width * 0.7, height * 0.15, width * 0.8, height * 0.25, width * 0.8, height * 0.35);
          shape.bezierCurveTo(width * 0.8, height * 0.45, width * 0.7, height * 0.35, width * 0.5, height * 0.35);
          shape.bezierCurveTo(width * 0.3, height * 0.35, width * 0.2, height * 0.55, width * 0.2, height * 0.65);
          shape.bezierCurveTo(width * 0.2, height * 0.75, width * 0.3, height * 0.85, width * 0.5, height * 0.85);
          shape.bezierCurveTo(width * 0.7, height * 0.85, width * 0.8, height * 0.75, width * 0.8, height * 0.7);
          shape.lineTo(width, height * 0.8);
        }
        break;
        
      case 'T':
        if (isLowercase) {
          // Lowercase 't'
          shape.moveTo(width * 0.3, 0);
          shape.lineTo(width * 0.3, height * 1.1);
          shape.lineTo(width * 0.45, height * 1.1);
          shape.lineTo(width * 0.45, height * 0.8);
          shape.lineTo(width * 0.7, height * 0.8);
          shape.lineTo(width * 0.7, height * 0.65);
          shape.lineTo(width * 0.45, height * 0.65);
          shape.lineTo(width * 0.45, 0);
          shape.lineTo(width * 0.3, 0);
        } else {
          // Uppercase 'T'
          shape.moveTo(0, height * 0.85);
          shape.lineTo(0, height);
          shape.lineTo(width, height);
          shape.lineTo(width, height * 0.85);
          shape.lineTo(width * 0.575, height * 0.85);
          shape.lineTo(width * 0.575, 0);
          shape.lineTo(width * 0.425, 0);
          shape.lineTo(width * 0.425, height * 0.85);
          shape.lineTo(0, height * 0.85);
        }
        break;
        
      case 'U':
        if (isLowercase) {
          // Lowercase 'u'
          shape.moveTo(0, height * 0.8);
          shape.lineTo(0, height * 0.25);
          shape.bezierCurveTo(0, height * 0.1, width * 0.1, 0, width * 0.25, 0);
          shape.lineTo(width * 0.55, 0);
          shape.bezierCurveTo(width * 0.7, 0, width * 0.8, height * 0.1, width * 0.8, height * 0.25);
          shape.lineTo(width * 0.8, height * 0.8);
          shape.lineTo(width * 0.65, height * 0.8);
          shape.lineTo(width * 0.65, height * 0.25);
          shape.bezierCurveTo(width * 0.65, height * 0.2, width * 0.6, height * 0.15, width * 0.55, height * 0.15);
          shape.lineTo(width * 0.25, height * 0.15);
          shape.bezierCurveTo(width * 0.2, height * 0.15, width * 0.15, height * 0.2, width * 0.15, height * 0.25);
          shape.lineTo(width * 0.15, height * 0.8);
          shape.lineTo(0, height * 0.8);
        } else {
          // Uppercase 'U'
          shape.moveTo(0, height);
          shape.lineTo(0, height * 0.3);
          shape.bezierCurveTo(0, height * 0.1, width * 0.2, 0, width * 0.5, 0);
          shape.bezierCurveTo(width * 0.8, 0, width, height * 0.1, width, height * 0.3);
          shape.lineTo(width, height);
          shape.lineTo(width * 0.85, height);
          shape.lineTo(width * 0.85, height * 0.3);
          shape.bezierCurveTo(width * 0.85, height * 0.2, width * 0.7, height * 0.15, width * 0.5, height * 0.15);
          shape.bezierCurveTo(width * 0.3, height * 0.15, width * 0.15, height * 0.2, width * 0.15, height * 0.3);
          shape.lineTo(width * 0.15, height);
          shape.lineTo(0, height);
        }
        break;
        
      case 'V':
        if (isLowercase) {
          // Lowercase 'v'
          shape.moveTo(0, height * 0.8);
          shape.lineTo(width * 0.35, 0);
          shape.lineTo(width * 0.45, 0);
          shape.lineTo(width * 0.8, height * 0.8);
          shape.lineTo(width * 0.65, height * 0.8);
          shape.lineTo(width * 0.4, height * 0.2);
          shape.lineTo(width * 0.15, height * 0.8);
          shape.lineTo(0, height * 0.8);
        } else {
          // Uppercase 'V'
          shape.moveTo(0, height);
          shape.lineTo(width * 0.4, 0);
          shape.lineTo(width * 0.6, 0);
          shape.lineTo(width, height);
          shape.lineTo(width * 0.85, height);
          shape.lineTo(width * 0.5, height * 0.2);
          shape.lineTo(width * 0.15, height);
          shape.lineTo(0, height);
        }
        break;
        
      case 'W':
        if (isLowercase) {
          // Lowercase 'w'
          shape.moveTo(0, height * 0.8);
          shape.lineTo(width * 0.15, 0);
          shape.lineTo(width * 0.25, 0);
          shape.lineTo(width * 0.35, height * 0.6);
          shape.lineTo(width * 0.45, 0);
          shape.lineTo(width * 0.55, 0);
          shape.lineTo(width * 0.65, height * 0.6);
          shape.lineTo(width * 0.75, 0);
          shape.lineTo(width * 0.85, 0);
          shape.lineTo(width, height * 0.8);
          shape.lineTo(width * 0.85, height * 0.8);
          shape.lineTo(width * 0.75, height * 0.2);
          shape.lineTo(width * 0.65, height * 0.8);
          shape.lineTo(width * 0.55, height * 0.8);
          shape.lineTo(width * 0.45, height * 0.2);
          shape.lineTo(width * 0.35, height * 0.8);
          shape.lineTo(width * 0.25, height * 0.8);
          shape.lineTo(width * 0.15, height * 0.2);
          shape.lineTo(0, height * 0.8);
        } else {
          // Uppercase 'W'
          shape.moveTo(0, height);
          shape.lineTo(width * 0.2, 0);
          shape.lineTo(width * 0.35, 0);
          shape.lineTo(width * 0.5, height * 0.7);
          shape.lineTo(width * 0.65, 0);
          shape.lineTo(width * 0.8, 0);
          shape.lineTo(width, height);
          shape.lineTo(width * 0.85, height);
          shape.lineTo(width * 0.7, height * 0.2);
          shape.lineTo(width * 0.5, height);
          shape.lineTo(width * 0.3, height * 0.2);
          shape.lineTo(width * 0.15, height);
          shape.lineTo(0, height);
        }
        break;
        
      case 'X':
        if (isLowercase) {
          // Lowercase 'x'
          shape.moveTo(0, height * 0.8);
          shape.lineTo(width * 0.25, height * 0.5);
          shape.lineTo(0, 0);
          shape.lineTo(width * 0.2, 0);
          shape.lineTo(width * 0.4, height * 0.35);
          shape.lineTo(width * 0.6, 0);
          shape.lineTo(width * 0.8, 0);
          shape.lineTo(width * 0.55, height * 0.5);
          shape.lineTo(width * 0.8, height * 0.8);
          shape.lineTo(width * 0.6, height * 0.8);
          shape.lineTo(width * 0.4, height * 0.65);
          shape.lineTo(width * 0.2, height * 0.8);
          shape.lineTo(0, height * 0.8);
        } else {
          // Uppercase 'X'
          shape.moveTo(0, height);
          shape.lineTo(width * 0.35, height * 0.5);
          shape.lineTo(0, 0);
          shape.lineTo(width * 0.2, 0);
          shape.lineTo(width * 0.5, height * 0.35);
          shape.lineTo(width * 0.8, 0);
          shape.lineTo(width, 0);
          shape.lineTo(width * 0.65, height * 0.5);
          shape.lineTo(width, height);
          shape.lineTo(width * 0.8, height);
          shape.lineTo(width * 0.5, height * 0.65);
          shape.lineTo(width * 0.2, height);
          shape.lineTo(0, height);
        }
        break;
        
      case 'Y':
        if (isLowercase) {
          // Lowercase 'y'
          shape.moveTo(0, height * 0.8);
          shape.lineTo(width * 0.35, height * 0.3);
          shape.lineTo(width * 0.35, height * -0.6); // Descender
          shape.lineTo(width * 0.5, height * -0.6);
          shape.lineTo(width * 0.5, height * 0.3);
          shape.lineTo(width * 0.8, height * 0.8);
          shape.lineTo(width * 0.65, height * 0.8);
          shape.lineTo(width * 0.425, height * 0.5);
          shape.lineTo(width * 0.15, height * 0.8);
          shape.lineTo(0, height * 0.8);
        } else {
          // Uppercase 'Y'
          shape.moveTo(0, height);
          shape.lineTo(width * 0.425, height * 0.5);
          shape.lineTo(width * 0.425, 0);
          shape.lineTo(width * 0.575, 0);
          shape.lineTo(width * 0.575, height * 0.5);
          shape.lineTo(width, height);
          shape.lineTo(width * 0.8, height);
          shape.lineTo(width * 0.5, height * 0.65);
          shape.lineTo(width * 0.2, height);
          shape.lineTo(0, height);
        }
        break;
        
      case 'Z':
        if (isLowercase) {
          // Lowercase 'z'
          shape.moveTo(0, height * 0.8);
          shape.lineTo(0, height * 0.65);
          shape.lineTo(width * 0.6, height * 0.65);
          shape.lineTo(0, height * 0.15);
          shape.lineTo(0, 0);
          shape.lineTo(width * 0.8, 0);
          shape.lineTo(width * 0.8, height * 0.15);
          shape.lineTo(width * 0.2, height * 0.15);
          shape.lineTo(width * 0.8, height * 0.65);
          shape.lineTo(width * 0.8, height * 0.8);
          shape.lineTo(0, height * 0.8);
        } else {
          // Uppercase 'Z'
          shape.moveTo(0, height);
          shape.lineTo(0, height * 0.85);
          shape.lineTo(width * 0.7, height * 0.85);
          shape.lineTo(0, height * 0.15);
          shape.lineTo(0, 0);
          shape.lineTo(width, 0);
          shape.lineTo(width, height * 0.15);
          shape.lineTo(width * 0.3, height * 0.15);
          shape.lineTo(width, height * 0.85);
          shape.lineTo(width, height);
          shape.lineTo(0, height);
        }
        break;
        
      case ' ':
        // Space character - empty shape
        shape.moveTo(0, 0);
        shape.lineTo(width * 0.3, 0);
        shape.lineTo(width * 0.3, height * 0.1);
        shape.lineTo(0, height * 0.1);
        shape.lineTo(0, 0);
        break;
        
      default:
        // Default rectangular shape for other characters
        if (isLowercase) {
          shape.moveTo(0, 0);
          shape.lineTo(width, 0);
          shape.lineTo(width, height);
          shape.lineTo(0, height);
          shape.lineTo(0, 0);
        } else {
          shape.moveTo(0, 0);
          shape.lineTo(width, 0);
          shape.lineTo(width, height);
          shape.lineTo(0, height);
          shape.lineTo(0, 0);
        }
        break;
    }
    
    return shape;
  };

  // Enhanced function to create 3D text geometry
  const create3DText = (text: string) => {
    const group = new THREE.Group();
    
    const chars = text.split('');
    let xOffset = 0;
    const charWidth = 0.8;
    const charSpacing = 0.1;
    const extrudeDepth = 0.2;
    
    chars.forEach((char, index) => {
      if (char === ' ') {
        xOffset += charWidth * 0.5;
        return;
      }
      
      const charShape = createLetterShape(char);
      
      const extrudeSettings = {
        depth: extrudeDepth,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 0.02,
        bevelThickness: 0.02
      };
      
      const charGeometry = new THREE.ExtrudeGeometry(charShape, extrudeSettings);
      const charMaterial = new THREE.MeshStandardMaterial({ color: '#4a90e2' });
      const charMesh = new THREE.Mesh(charGeometry, charMaterial);
      
      charMesh.position.x = xOffset;
      charMesh.position.y = -0.6; // Center vertically
      
      group.add(charMesh);
      xOffset += charWidth + charSpacing;
    });
    
    // Center the entire text group
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.position.x = -center.x;
    
    return group;
  };

  // Basic geometric shapes
  const basicShapes = [
    {
      name: 'Cube',
      icon: Box,
      geometry: () => new THREE.BoxGeometry(1, 1, 1),
      color: '#44aa88'
    },
    {
      name: 'Sphere',
      icon: CircleIcon,
      geometry: () => new THREE.SphereGeometry(0.5, 32, 16),
      color: '#aa4488'
    },
    {
      name: 'Cylinder',
      icon: Cylinder,
      geometry: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
      color: '#4488aa'
    },
    {
      name: 'Cone',
      icon: Cone,
      geometry: () => new THREE.ConeGeometry(0.5, 1, 32),
      color: '#88aa44'
    },
    {
      name: 'Plane',
      icon: Triangle,
      geometry: () => new THREE.PlaneGeometry(2, 2),
      color: '#aa8844'
    },
    {
      name: 'Torus',
      icon: DonutIcon,
      geometry: () => new THREE.TorusGeometry(0.5, 0.2, 16, 100),
      color: '#8844aa'
    },
    {
      name: 'Heart',
      icon: Heart,
      geometry: () => {
        // Create a heart shape using a custom geometry
        const heartShape = new THREE.Shape();
        
        const x = 0, y = 0;
        heartShape.moveTo(x + 5, y + 5);
        heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
        heartShape.bezierCurveTo(x - 6, y, x - 6, y + 3.5, x - 6, y + 3.5);
        heartShape.bezierCurveTo(x - 6, y + 5.5, x - 4, y + 7.7, x + 5, y + 15);
        heartShape.bezierCurveTo(x + 12, y + 7.7, x + 14, y + 5.5, x + 14, y + 3.5);
        heartShape.bezierCurveTo(x + 14, y + 3.5, x + 14, y, x + 10, y);
        heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

        const extrudeSettings = {
          depth: 2,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 2,
          bevelSize: 0.5,
          bevelThickness: 0.5
        };

        const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        
        // Scale and center the heart
        geometry.scale(0.05, 0.05, 0.05);
        geometry.center();
        
        return geometry;
      },
      color: '#ff6b9d'
    },
    {
      name: 'Star',
      icon: Star,
      geometry: () => {
        // Create a star shape
        const starShape = new THREE.Shape();
        const outerRadius = 10;
        const innerRadius = 4;
        const spikes = 5;
        
        let rot = Math.PI / 2 * 3;
        let x = 0;
        let y = outerRadius;
        const step = Math.PI / spikes;

        starShape.moveTo(0, outerRadius);
        
        for (let i = 0; i < spikes; i++) {
          x = Math.cos(rot) * outerRadius;
          y = Math.sin(rot) * outerRadius;
          starShape.lineTo(x, y);
          rot += step;

          x = Math.cos(rot) * innerRadius;
          y = Math.sin(rot) * innerRadius;
          starShape.lineTo(x, y);
          rot += step;
        }
        
        starShape.lineTo(0, outerRadius);

        const extrudeSettings = {
          depth: 2,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 2,
          bevelSize: 0.3,
          bevelThickness: 0.3
        };

        const geometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
        
        // Scale and center the star
        geometry.scale(0.05, 0.05, 0.05);
        geometry.center();
        
        return geometry;
      },
      color: '#ffd700'
    }
  ];

  // Nature objects - trees, flowers, and rocks (removed Pebble and Sunflower)
  const natureObjects = [
    {
      name: 'Pine Tree',
      icon: TreePine,
      geometry: () => {
        const group = new THREE.Group();
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#8B4513' });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.5;
        group.add(trunk);
        
        // Tree layers (3 cone layers)
        const layerColors = ['#228B22', '#32CD32', '#90EE90'];
        const layerSizes = [0.8, 0.6, 0.4];
        const layerHeights = [0.8, 0.6, 0.4];
        const layerPositions = [1.2, 1.6, 1.9];
        
        layerSizes.forEach((size, i) => {
          const layerGeometry = new THREE.ConeGeometry(size, layerHeights[i], 8);
          const layerMaterial = new THREE.MeshStandardMaterial({ color: layerColors[i] });
          const layer = new THREE.Mesh(layerGeometry, layerMaterial);
          layer.position.y = layerPositions[i];
          group.add(layer);
        });
        
        return group;
      },
      color: '#228B22'
    },
    {
      name: 'Oak Tree',
      icon: TreePine,
      geometry: () => {
        const group = new THREE.Group();
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.12, 0.18, 1.2, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#8B4513' });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.6;
        group.add(trunk);
        
        // Tree crown (sphere)
        const crownGeometry = new THREE.SphereGeometry(0.9, 16, 12);
        const crownMaterial = new THREE.MeshStandardMaterial({ color: '#228B22' });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 1.5;
        crown.scale.y = 0.8; // Slightly flatten the crown
        group.add(crown);
        
        return group;
      },
      color: '#228B22'
    },
    {
      name: 'Flower',
      icon: Flower,
      geometry: () => {
        const group = new THREE.Group();
        
        // Flower stem
        const stemGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.8, 6);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: '#228B22' });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.4;
        group.add(stem);
        
        // Flower center
        const centerGeometry = new THREE.SphereGeometry(0.08, 8, 6);
        const centerMaterial = new THREE.MeshStandardMaterial({ color: '#FFD700' });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.8;
        group.add(center);
        
        // Flower petals
        const petalGeometry = new THREE.SphereGeometry(0.12, 8, 6);
        const petalMaterial = new THREE.MeshStandardMaterial({ color: '#FF69B4' });
        
        for (let i = 0; i < 6; i++) {
          const petal = new THREE.Mesh(petalGeometry, petalMaterial);
          const angle = (i / 6) * Math.PI * 2;
          petal.position.x = Math.cos(angle) * 0.15;
          petal.position.z = Math.sin(angle) * 0.15;
          petal.position.y = 0.8;
          petal.scale.set(0.8, 0.4, 0.8);
          group.add(petal);
        }
        
        return group;
      },
      color: '#FF69B4'
    },
    {
      name: 'Boulder',
      icon: Mountain,
      geometry: () => {
        // Create an irregular rock shape using a modified sphere
        const geometry = new THREE.SphereGeometry(0.6, 8, 6);
        const positions = geometry.attributes.position;
        
        // Randomly modify vertices to create irregular rock shape
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const y = positions.getY(i);
          const z = positions.getZ(i);
          
          // Add some randomness to make it look more rock-like
          const noise = (Math.random() - 0.5) * 0.3;
          const length = Math.sqrt(x * x + y * y + z * z);
          const newLength = length + noise;
          
          positions.setXYZ(
            i,
            (x / length) * newLength,
            (y / length) * newLength * (0.7 + Math.random() * 0.3), // Make it flatter
            (z / length) * newLength
          );
        }
        
        geometry.computeVertexNormals();
        return geometry;
      },
      color: '#696969'
    },
    {
      name: 'Small Rock',
      icon: Mountain,
      geometry: () => {
        // Create a smaller, more angular rock
        const geometry = new THREE.DodecahedronGeometry(0.3);
        const positions = geometry.attributes.position;
        
        // Slightly modify vertices for more natural look
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const y = positions.getY(i);
          const z = positions.getZ(i);
          
          const noise = (Math.random() - 0.5) * 0.1;
          const length = Math.sqrt(x * x + y * y + z * z);
          const newLength = length + noise;
          
          positions.setXYZ(
            i,
            (x / length) * newLength,
            (y / length) * newLength,
            (z / length) * newLength
          );
        }
        
        geometry.computeVertexNormals();
        return geometry;
      },
      color: '#A0A0A0'
    },
    {
      name: 'Grass Patch',
      icon: TreePine,
      geometry: () => {
        const group = new THREE.Group();
        
        // Create multiple grass blades
        const bladeGeometry = new THREE.BoxGeometry(0.02, 0.3, 0.01);
        const bladeMaterial = new THREE.MeshStandardMaterial({ color: '#32CD32' });
        
        for (let i = 0; i < 20; i++) {
          const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
          
          // Random position within a small area
          blade.position.x = (Math.random() - 0.5) * 0.6;
          blade.position.z = (Math.random() - 0.5) * 0.6;
          blade.position.y = 0.15;
          
          // Random rotation and slight scale variation
          blade.rotation.y = Math.random() * Math.PI * 2;
          blade.rotation.x = (Math.random() - 0.5) * 0.2;
          blade.scale.y = 0.8 + Math.random() * 0.4;
          
          group.add(blade);
        }
        
        return group;
      },
      color: '#32CD32'
    }
  ];

  const handleObjectSelect = (shape: typeof basicShapes[0] | typeof natureObjects[0]) => {
    startObjectPlacement({
      geometry: shape.geometry,
      name: shape.name,
      color: shape.color
    });
    setShowObjectMenu(false);
  };

  const handleTextCreate = () => {
    if (!textInput.trim()) return;
    
    startObjectPlacement({
      geometry: () => create3DText(textInput.trim()),
      name: `3D Text: ${textInput.trim()}`,
      color: '#4a90e2'
    });
    setShowObjectMenu(false);
    setShowTextInput(false);
  };

  const handleLightAdd = (type: 'directional' | 'point' | 'spot') => {
    const position = selectedObject 
      ? [
          selectedObject.position.x + 2,
          selectedObject.position.y + 2,
          selectedObject.position.z + 2
        ]
      : [2, 2, 2];

    addLight(type, position);
  };

  const transformTools = [
    {
      icon: MousePointer,
      mode: null,
      title: 'Select',
      shortcut: 'Q'
    },
    {
      icon: Move,
      mode: 'translate' as const,
      title: 'Move',
      shortcut: 'G'
    },
    {
      icon: RotateCw,
      mode: 'rotate' as const,
      title: 'Rotate',
      shortcut: 'R'
    },
    {
      icon: Scale,
      mode: 'scale' as const,
      title: 'Scale',
      shortcut: 'S'
    }
  ];

  const editTools = [
    {
      icon: Dot,
      mode: 'vertex' as const,
      title: 'Edit Vertices',
      shortcut: 'V'
    },
    {
      icon: Minus,
      mode: 'edge' as const,
      title: 'Edit Edges',
      shortcut: 'E'
    }
  ];

  const lightTools = [
    {
      icon: Sun,
      type: 'directional' as const,
      title: 'Directional Light',
      description: 'Parallel rays like sunlight'
    },
    {
      icon: Lightbulb,
      type: 'point' as const,
      title: 'Point Light',
      description: 'Omnidirectional like a bulb'
    },
    {
      icon: Zap,
      type: 'spot' as const,
      title: 'Spot Light',
      description: 'Focused cone of light'
    }
  ];

  const tabs = [
    { id: 'basic', name: 'Basic', icon: Box },
    { id: 'nature', name: 'Nature', icon: TreePine },
    { id: 'text', name: 'Text', icon: Type }
  ];

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-3 border border-white/5 z-10">
      <div className="flex flex-col gap-2">
        {/* Add Object Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowObjectMenu(!showObjectMenu)}
            className="p-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 transition-all duration-200 flex items-center justify-center group relative hover:scale-105 active:scale-95"
            title="Add Object (A)"
          >
            <Plus className="w-5 h-5" />
            <ChevronDown className="w-3 h-3 ml-1" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              Add Object (A)
            </div>
          </button>

          {/* Object Menu */}
          {showObjectMenu && (
            <div className="absolute left-full ml-2 top-0 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-lg z-20 min-w-80">
              {/* Header */}
              <div className="p-3 border-b border-white/10">
                <h3 className="text-sm font-medium text-white/90">Add 3D Object</h3>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 p-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-500'
                        : 'text-white/70 hover:text-white/90 hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-3">
                {activeTab === 'basic' && (
                  <div className="grid grid-cols-2 gap-2">
                    {basicShapes.map((shape) => (
                      <button
                        key={shape.name}
                        onClick={() => handleObjectSelect(shape)}
                        className="p-3 rounded-lg hover:bg-white/5 flex flex-col items-center gap-2 transition-colors group"
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: shape.color + '20', color: shape.color }}
                        >
                          <shape.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-white/90 group-hover:text-white">
                          {shape.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'nature' && (
                  <div className="grid grid-cols-2 gap-2">
                    {natureObjects.map((obj) => (
                      <button
                        key={obj.name}
                        onClick={() => handleObjectSelect(obj)}
                        className="p-3 rounded-lg hover:bg-white/5 flex flex-col items-center gap-2 transition-colors group"
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: obj.color + '20', color: obj.color }}
                        >
                          <obj.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-white/90 group-hover:text-white text-center">
                          {obj.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'text' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div 
                        className="w-16 h-16 mx-auto rounded-lg flex items-center justify-center mb-3"
                        style={{ backgroundColor: '#4a90e2' + '20', color: '#4a90e2' }}
                      >
                        <Type className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-medium text-white/90 mb-2">Create 3D Text</h4>
                      <p className="text-xs text-white/60 mb-4">
                        Enter text to convert into a 3D extruded object
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-2">
                          Text Content
                        </label>
                        <input
                          type="text"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleTextCreate();
                            }
                          }}
                          placeholder="Enter your text..."
                          className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50 focus:bg-[#0a0a0a]"
                          maxLength={20}
                        />
                        <div className="text-xs text-white/50 mt-1">
                          {textInput.length}/20 characters
                        </div>
                      </div>

                      <button
                        onClick={handleTextCreate}
                        disabled={!textInput.trim()}
                        className={`w-full p-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                          textInput.trim()
                            ? 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105 active:scale-95'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        Create 3D Text
                      </button>
                    </div>

                    <div className="text-xs text-white/50 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="font-medium text-blue-400 mb-1">🔤 Complete Alphabet Support:</div>
                      <ul className="space-y-1">
                        <li>• <strong>All 26 letters</strong> - A-Z with unique shapes</li>
                        <li>• <strong>Uppercase & Lowercase</strong> - Proper typography</li>
                        <li>• <strong>Authentic Letters</strong> - A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z</li>
                        <li>• <strong>Professional 3D</strong> - Extruded with bevels</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Lights Section */}
              <div className="border-t border-white/10 p-3">
                <h4 className="text-xs font-medium text-white/70 mb-2 uppercase tracking-wider">
                  Lights
                </h4>
                <div className="space-y-1">
                  {lightTools.map((light) => (
                    <button
                      key={light.type}
                      onClick={() => handleLightAdd(light.type)}
                      className="w-full p-2 rounded-lg hover:bg-white/5 flex items-center gap-3 transition-colors group"
                    >
                      <light.icon className="w-4 h-4 text-yellow-400" />
                      <div className="text-left">
                        <div className="text-sm text-white/90 group-hover:text-white">
                          {light.title}
                        </div>
                        <div className="text-xs text-white/60">
                          {light.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-white/10" />

        {/* Transform Tools */}
        {transformTools.map(({ icon: Icon, mode, title, shortcut }) => (
          <button
            key={title}
            onClick={() => setTransformMode(mode)}
            className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center group relative hover:scale-105 active:scale-95 ${
              transformMode === mode
                ? 'bg-blue-500/30 text-blue-300'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
            title={`${title} (${shortcut})`}
          >
            <Icon className="w-5 h-5" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              {title} ({shortcut})
            </div>
          </button>
        ))}

        {/* Separator */}
        <div className="w-full h-px bg-white/10" />

        {/* Edit Tools */}
        {editTools.map(({ icon: Icon, mode, title, shortcut }) => {
          // Check if edge mode should be disabled for certain geometries
          const isDisabled = mode === 'edge' && selectedObject instanceof THREE.Mesh && (
            selectedObject.geometry instanceof THREE.CylinderGeometry ||
            selectedObject.geometry instanceof THREE.ConeGeometry ||
            selectedObject.geometry instanceof THREE.SphereGeometry
          );

          return (
            <button
              key={title}
              onClick={() => !isDisabled && setEditMode(mode)}
              disabled={isDisabled}
              className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center group relative ${
                isDisabled
                  ? 'text-white/30 cursor-not-allowed'
                  : editMode === mode
                    ? 'bg-green-500/30 text-green-300 hover:scale-105 active:scale-95'
                    : 'text-white/90 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95'
              }`}
              title={isDisabled ? `${title} (Not available for this geometry)` : `${title} (${shortcut})`}
            >
              <Icon className="w-5 h-5" />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                {isDisabled ? `${title} (Not available)` : `${title} (${shortcut})`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Toolbar;