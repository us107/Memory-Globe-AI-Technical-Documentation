
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as cam from '@mediapipe/camera_utils';
import * as hands from '@mediapipe/hands';
import * as drawing from '@mediapipe/drawing_utils';
import { ChevronLeft, Loader2, Zap, RotateCcw, Github, Mail } from 'lucide-react';
import { MemoryImage } from '../types';

/**
 * Helper to extract constructors from MediaPipe modules.
 */
const getConstructor = (module: any, className: string) => {
  if (!module) return (window as any)[className];
  if (module[className]) return module[className];
  if (module.default && module.default[className]) return module.default[className];
  return (window as any)[className];
};

const Hands = getConstructor(hands, 'Hands');
const Camera = getConstructor(cam, 'Camera');
const HAND_CONNECTIONS = (hands as any).HAND_CONNECTIONS || (hands as any).default?.HAND_CONNECTIONS || (window as any).HAND_CONNECTIONS;
const drawConnectors = (drawing as any).drawConnectors || (drawing as any).default?.drawConnectors || (window as any).drawConnectors;
const drawLandmarks = (drawing as any).drawLandmarks || (drawing as any).default?.drawLandmarks || (window as any).drawLandmarks;

interface Props {
  images: MemoryImage[];
  onBack: () => void;
}

const MemoryGlobe: React.FC<Props> = ({ images, onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    globeGroup: THREE.Group;
    targetRotation: { x: number, y: number };
    currentRotation: { x: number, y: number };
    rotationVelocity: { x: number, y: number };
    memoryMeshes: THREE.Mesh[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [pulseScale, setPulseScale] = useState(1);
  const [resetPulse, setResetPulse] = useState(false);
  const [loadCount, setLoadCount] = useState(0);

  // Interaction State
  const gestureState = useRef({
    // Left Hand (Zoom - Depth Control)
    leftPinching: false,
    prevLeftPinching: false,
    zoomStartY: 0,
    zoomStartVal: 12,
    // Right Hand (Rotation - Heavy Tactile Physics)
    rightPinching: false,
    prevRightPinching: false,
    rightGrabStartPos: { x: 0, y: 0 },
    rightGrabStartRotation: { x: 0, y: 0 },
    lastRightPinchTime: 0,
    // General
    zoomLevel: 12,
    targetZoom: 12,
    openness: 1,
    isInteracting: false,
    isFist: false,
    // Physics constants
    rotationSensitivity: 3.5, 
    zoomSensitivity: 30.0, 
    inertiaFriction: 0.9,
    momentumFactor: 0.15,
    pinchEntryThreshold: 0.08,
    pinchStickyThreshold: 0.15,
    minZoom: 7.0,
    maxZoom: 45.0,
  });

  const resetGlobe = () => {
    if (!sceneRef.current) return;
    const state = gestureState.current;
    sceneRef.current.targetRotation = { x: 0, y: 0 };
    sceneRef.current.rotationVelocity = { x: 0, y: 0 };
    state.targetZoom = 12;
    setResetPulse(true);
    triggerSFX('release');
    setTimeout(() => setResetPulse(false), 500);
  };

  const triggerSFX = (type: 'pinch' | 'release' | 'fist' | 'palm') => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    switch (type) {
      case 'pinch':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(1300, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      case 'release':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      case 'fist':
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'palm':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.1);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
    }
  };

  useEffect(() => {
    if (!containerRef.current || !Hands || !Camera) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.01);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.z = gestureState.current.zoomLevel;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 18000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPos[i] = (Math.random() - 0.5) * 4000;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 1.0, 
      transparent: true, 
      opacity: 0.25,
      sizeAttenuation: true
    });
    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    const textureLoader = new THREE.TextureLoader();
    const radius = 13.0;
    const sharedBoxGeo = new THREE.BoxGeometry(1, 1, 0.05);
    const memoryMeshes: THREE.Mesh[] = [];

    const frameColor = new THREE.Color(0xffffff);
    const placeholderMaterial = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.2 });

    images.forEach((_, i) => {
      const phi = Math.acos(-1 + (2 * i) / images.length);
      const theta = Math.sqrt(images.length * Math.PI) * phi;
      
      const materials = [
        new THREE.MeshBasicMaterial({ color: frameColor }),
        new THREE.MeshBasicMaterial({ color: frameColor }),
        new THREE.MeshBasicMaterial({ color: frameColor }),
        new THREE.MeshBasicMaterial({ color: frameColor }),
        placeholderMaterial.clone(),
        placeholderMaterial.clone(),
      ];

      const mesh = new THREE.Mesh(sharedBoxGeo, materials);
      mesh.position.set(
        radius * Math.cos(theta) * Math.sin(phi), 
        radius * Math.sin(theta) * Math.sin(phi), 
        radius * Math.cos(phi)
      );
      mesh.lookAt(0, 0, 0);
      mesh.scale.set(1.2, 1.2, 1);
      globeGroup.add(mesh);
      memoryMeshes.push(mesh);
    });

    scene.add(new THREE.AmbientLight(0xffffff, 3.2));
    sceneRef.current = { 
      scene, camera, renderer, globeGroup, 
      targetRotation: { x: 0, y: 0 },
      currentRotation: { x: 0, y: 0 },
      rotationVelocity: { x: 0, y: 0 },
      memoryMeshes
    };

    let loadIndex = 0;
    const loadNextBatch = () => {
      if (loadIndex >= images.length) return;
      
      const batchSize = 3;
      const currentBatch = images.slice(loadIndex, loadIndex + batchSize);
      
      currentBatch.forEach((img, batchI) => {
        const globalI = loadIndex + batchI;
        textureLoader.load(img.url, (tex) => {
          const mesh = memoryMeshes[globalI];
          if (!mesh) return;

          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          tex.minFilter = THREE.LinearFilter;
          
          const aspect = tex.image.width / tex.image.height;
          const maxDim = 1.8;
          let targetW = maxDim, targetH = maxDim;
          if (aspect > 1) targetH = maxDim / aspect;
          else targetW = maxDim * aspect;

          const cardWidth = targetW + 0.1;
          const cardHeight = targetH + 0.1;

          const imageMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 });
          (mesh.material as THREE.Material[])[4] = imageMat;
          (mesh.material as THREE.Material[])[5] = imageMat;
          
          let progress = 0;
          const initialScale = mesh.scale.clone();
          const transitionInterval = setInterval(() => {
            progress += 0.04;
            if (progress >= 1) {
              imageMat.opacity = 1;
              mesh.scale.set(cardWidth, cardHeight, 1);
              clearInterval(transitionInterval);
            } else {
              imageMat.opacity = progress;
              const curW = THREE.MathUtils.lerp(initialScale.x, cardWidth, progress);
              const curH = THREE.MathUtils.lerp(initialScale.y, cardHeight, progress);
              mesh.scale.set(curW, curH, 1);
            }
          }, 16);

          setLoadCount(prev => prev + 1);
        });
      });

      loadIndex += batchSize;
      if (loadIndex < images.length) {
        setTimeout(loadNextBatch, 100);
      }
    };
    loadNextBatch();

    const handleResize = () => {
      if (!sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      if (!sceneRef.current) return;
      const { renderer, scene, camera, globeGroup, targetRotation, currentRotation, rotationVelocity } = sceneRef.current;
      const state = gestureState.current;

      starPoints.rotation.y += 0.0001;

      if (!state.rightPinching) {
        rotationVelocity.x *= state.inertiaFriction;
        rotationVelocity.y *= state.inertiaFriction;
        if (Math.abs(rotationVelocity.x) < 0.0001) rotationVelocity.x = 0;
        if (Math.abs(rotationVelocity.y) < 0.0001) rotationVelocity.y = 0;
        targetRotation.x += rotationVelocity.x;
        targetRotation.y += rotationVelocity.y;
      }

      currentRotation.x = THREE.MathUtils.lerp(currentRotation.x, targetRotation.x, 0.1);
      currentRotation.y = THREE.MathUtils.lerp(currentRotation.y, targetRotation.y, 0.1);

      globeGroup.rotation.x = currentRotation.x;
      globeGroup.rotation.y = currentRotation.y;

      state.zoomLevel = THREE.MathUtils.lerp(state.zoomLevel, state.targetZoom, 0.1);
      camera.position.z = state.zoomLevel;

      renderer.render(scene, camera);
      setPulseScale(1 + Math.sin(Date.now() * 0.007) * 0.1);
    };
    animate();

    const handsDetector = new Hands({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
    handsDetector.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.8, minTrackingConfidence: 0.8 });

    handsDetector.onResults((res: any) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || !canvasRef.current) return;
      ctx.save();
      ctx.clearRect(0, 0, 640, 480);
      
      const state = gestureState.current;
      state.prevLeftPinching = state.leftPinching;
      state.prevRightPinching = state.rightPinching;
      
      let interacting = false;

      if (res.multiHandLandmarks) {
        res.multiHandLandmarks.forEach((marks: any, i: number) => {
          const label = res.multiHandedness[i].label;
          const thumb = marks[4], index = marks[8], wrist = marks[0];
          const rawDist = Math.sqrt(Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2));
          
          let isPinching = false;
          if (label === 'Left') {
            isPinching = state.prevLeftPinching ? rawDist < state.pinchStickyThreshold : rawDist < state.pinchEntryThreshold;
          } else {
            isPinching = state.prevRightPinching ? rawDist < state.pinchStickyThreshold : rawDist < state.pinchEntryThreshold;
          }

          if (isPinching) interacting = true;

          const wave = (Math.sin(Date.now() * 0.008) + 1) / 2;
          const color = isPinching ? `rgba(0, 255, 255, ${0.4 + wave * 0.4})` : 'rgba(0, 150, 255, 0.3)';
          drawConnectors(ctx, marks, HAND_CONNECTIONS, { color: color, lineWidth: isPinching ? 4 : 2 });
          drawLandmarks(ctx, marks, { color: isPinching ? '#fff' : '#0ff', lineWidth: 1, radius: isPinching ? 3 : 2 });

          ctx.font = 'bold 24px monospace';
          ctx.fillStyle = isPinching ? '#0ff' : 'rgba(255,255,255,0.5)';
          const uiLabel = label === 'Left' ? 'DEPTH' : 'ROTATE';
          ctx.fillText(uiLabel, wrist.x * 640, wrist.y * 480 - 40);

          if (isPinching) {
             ctx.beginPath();
             ctx.arc(index.x * 640, index.y * 480, 22 * pulseScale, 0, Math.PI * 2);
             ctx.strokeStyle = color;
             ctx.lineWidth = 2;
             ctx.stroke();
          }

          if (label === 'Left') {
            state.leftPinching = isPinching;
            if (state.leftPinching && !state.prevLeftPinching) {
              triggerSFX('pinch');
              state.zoomStartY = index.y;
              state.zoomStartVal = state.targetZoom;
            }
            if (!state.leftPinching && state.prevLeftPinching) triggerSFX('release');
            if (state.leftPinching) {
              const deltaY = index.y - state.zoomStartY;
              const nextTarget = THREE.MathUtils.clamp(state.zoomStartVal + (deltaY * state.zoomSensitivity), state.minZoom, state.maxZoom);
              state.targetZoom = THREE.MathUtils.lerp(state.targetZoom, nextTarget, 0.15);
            }
            const avgD = [8, 12, 16, 20].reduce((s, id) => s + Math.sqrt(Math.pow(marks[id].x - wrist.x, 2) + Math.pow(marks[id].y - wrist.y, 2)), 0) / 4;
            const op = THREE.MathUtils.clamp((avgD - 0.15) / 0.42, 0.1, 4.0);
            state.openness = THREE.MathUtils.lerp(state.openness, op, 0.08);
            if (state.openness < 0.4 && !state.isFist) { triggerSFX('fist'); state.isFist = true; }
            if (state.openness >= 0.4 && state.isFist) { triggerSFX('palm'); state.isFist = false; }
          } else {
            state.rightPinching = isPinching;
            if (state.rightPinching && !state.prevRightPinching) {
              const now = Date.now();
              if (now - state.lastRightPinchTime < 350) resetGlobe();
              state.lastRightPinchTime = now;
              triggerSFX('pinch');
              state.rightGrabStartPos = { x: index.x, y: index.y };
              if (sceneRef.current) {
                state.rightGrabStartRotation = { x: sceneRef.current.targetRotation.x, y: sceneRef.current.targetRotation.y };
                sceneRef.current.rotationVelocity = { x: 0, y: 0 };
              }
            }
            if (!state.rightPinching && state.prevRightPinching) triggerSFX('release');
            if (state.rightPinching && sceneRef.current) {
              const dx = (index.x - state.rightGrabStartPos.x);
              const dy = (index.y - state.rightGrabStartPos.y);
              const prevTargetX = sceneRef.current.targetRotation.x;
              const prevTargetY = sceneRef.current.targetRotation.y;
              sceneRef.current.targetRotation.y = state.rightGrabStartRotation.y + (dx * state.rotationSensitivity);
              sceneRef.current.targetRotation.x = state.rightGrabStartRotation.x + (dy * state.rotationSensitivity);
              sceneRef.current.rotationVelocity.x = (sceneRef.current.targetRotation.x - prevTargetX) * state.momentumFactor;
              sceneRef.current.rotationVelocity.y = (sceneRef.current.targetRotation.y - prevTargetY) * state.momentumFactor;
            }
          }
        });
      } else {
        state.rightPinching = false;
        state.leftPinching = false;
      }
      state.isInteracting = interacting;
      ctx.restore();
    });

    const camInstance = new Camera(videoRef.current!, {
      onFrame: async () => { if (videoRef.current) await handsDetector.send({ image: videoRef.current }); },
      width: 640, height: 480
    });
    camInstance.start().then(() => {
      setTimeout(() => setIsLoading(false), 800);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      camInstance.stop();
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch(e) {}
      }
    };
  }, [images]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black selection:bg-cyan-500/30 font-mono">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Reset Flash */}
      <div className={`fixed inset-0 z-[60] bg-white pointer-events-none transition-opacity duration-500 ${resetPulse ? 'opacity-20' : 'opacity-0'}`} />

      {/* Calibration Overlay */}
      <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ease-in-out pointer-events-none ${isLoading ? 'opacity-100' : 'opacity-0'}`}>
        <div className="relative">
          <Loader2 className="animate-spin text-cyan-500 mb-6 md:mb-8" size={48} md-size={64} strokeWidth={1} />
          <div className="absolute inset-0 animate-ping bg-cyan-500/10 rounded-full blur-2xl" />
        </div>
        <h2 className="text-white text-xl md:text-3xl font-thin tracking-[1em] md:tracking-[1.5em] uppercase animate-pulse text-center px-4">Neural Sync</h2>
        <p className="text-zinc-600 text-[8px] md:text-[10px] tracking-[0.3em] md:tracking-[0.5em] uppercase mt-4">Establishing Link...</p>
      </div>

      {/* Top Controls & Navigation - Responsive Grid */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-8 z-10 flex flex-col gap-4 pointer-events-none">
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col gap-3">
            {!isLoading && (
              <div className="animate-in fade-in slide-in-from-left duration-1000">
                <span className="text-cyan-400 text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.4em] uppercase font-mono bg-black/60 px-3 md:px-4 py-1.5 md:py-2 rounded-sm border-l-2 border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.1)] select-none whitespace-nowrap">
                  WELCOME, TRAVELLER.
                </span>
              </div>
            )}

            <div className="flex gap-2 md:gap-4 text-white">
              <button onClick={onBack} className="pointer-events-auto flex items-center gap-2 md:gap-3 px-4 md:px-8 py-2 md:py-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all backdrop-blur-xl active:scale-95 group">
                <ChevronLeft size={16} md-size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-light tracking-widest uppercase text-[8px] md:text-[9px]">Vault</span>
              </button>
              
              <button onClick={resetGlobe} className="pointer-events-auto flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all backdrop-blur-xl active:scale-95 group">
                <RotateCcw size={12} md-size={14} className="group-hover:rotate-[-45deg] transition-transform" />
                <span className="font-light tracking-widest uppercase text-[8px] md:text-[9px]">Reset</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
             <button onClick={() => setShowDebug(!showDebug)} className={`pointer-events-auto flex items-center gap-2 md:gap-3 px-4 md:px-8 py-2 md:py-3 rounded-full border transition-all backdrop-blur-xl active:scale-95 ${showDebug ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
              <Zap size={14} md-size={16} />
              <span className="font-light tracking-widest uppercase text-[8px] md:text-[10px]">{showDebug ? 'Hide' : 'Feed'}</span>
            </button>
            
            <div className="hidden sm:flex flex-col items-end justify-center px-4">
              <span className="text-[7px] md:text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1 opacity-60">Syncing Matrix</span>
              <div className="flex gap-1 h-0.5 md:h-1 w-24 md:w-32 bg-white/5 rounded-full overflow-hidden border border-white/5">
                 <div className="h-full bg-cyan-500 transition-all duration-300 shadow-[0_0_10px_cyan]" style={{ width: `${(loadCount / images.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Preview - Stacked on Mobile */}
      <div className={`absolute bottom-4 right-4 md:bottom-8 md:right-8 z-20 transition-all duration-700 transform ${showDebug ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
        <div className="relative rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-black ring-1 ring-white/5 w-40 sm:w-64 md:w-80">
          <video ref={videoRef} className="w-full h-auto transform scale-x-[-1] transition-all object-cover" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]" width={640} height={480} />
          <div className="absolute top-3 left-3 md:top-6 md:left-6 flex items-center gap-2 md:gap-3">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]" />
            <span className="text-[7px] md:text-[9px] text-white font-bold tracking-[0.2em] uppercase opacity-70">Link Active</span>
          </div>
        </div>
      </div>

      {/* Telemetry Display - Dynamic placement */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 md:bottom-12 md:left-12 z-10 flex flex-row md:flex-col gap-4 md:gap-8 pointer-events-none">
          <div className="flex items-center gap-3 md:gap-6 group">
            <div className="w-0.5 md:w-1 h-12 md:h-24 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
              <div 
                className="absolute inset-x-0 bg-cyan-400 transition-all duration-500 shadow-[0_0_15px_cyan]" 
                style={{ height: `${THREE.MathUtils.clamp(((gestureState.current.zoomLevel - gestureState.current.minZoom) / (gestureState.current.maxZoom - gestureState.current.minZoom)) * 100, 0, 100)}%`, bottom: 0 }} 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] md:text-[9px] text-zinc-500 font-bold tracking-widest uppercase mb-0.5 opacity-60">Depth</span>
              <span className="text-white/80 font-mono text-xs md:text-xl">{(gestureState.current.zoomLevel).toFixed(1)}u</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6 group">
            <div className="w-0.5 md:w-1 h-12 md:h-24 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
              <div className="absolute inset-x-0 bg-purple-500 transition-all duration-500 shadow-[0_0_15px_purple]" style={{ height: `${THREE.MathUtils.clamp((gestureState.current.openness / 3.5) * 100, 0, 100)}%`, bottom: 0 }} />
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] md:text-[9px] text-zinc-500 font-bold tracking-widest uppercase mb-0.5 opacity-60">Flow</span>
              <span className="text-white/80 font-mono text-xs md:text-xl">{Math.round(gestureState.current.openness * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Developer Credit Floating */}
      {!isLoading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none opacity-40 hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
          <span className="text-[7px] md:text-[9px] text-zinc-400 font-mono tracking-widest uppercase">
            CREATED BY TRISHA SHARMA | US107
          </span>
          <span className="text-[6px] md:text-[8px] text-zinc-600 font-mono tracking-[0.2em] uppercase">
            TRISH2582@GMAIL.COM
          </span>
        </div>
      )}

      {/* Focus Reticle - Scaled for screens */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
         <div className="w-20 h-20 md:w-32 md:h-32 border border-white/5 rounded-full animate-[pulse_3s_ease-in-out_infinite] flex items-center justify-center opacity-20">
            <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-cyan-500 rounded-full shadow-[0_0_15px_cyan]" />
         </div>
      </div>
    </div>
  );
};

export default MemoryGlobe;
