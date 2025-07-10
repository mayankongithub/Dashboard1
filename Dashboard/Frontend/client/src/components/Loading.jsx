import { useEffect, useRef } from 'react';

const Loading = ({ width = '100%', height = '100vh', color = '#898A8A', speed = 1 }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let frameCount = 0;

    // Cabinet and animation state
    const cabinet = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      drawerOpen: 0, // 0 = closed, 1 = fully open
      drawerTarget: 0,
      drawerSpeed: 0.05,
      files: []
    };

    // Set canvas dimensions with error handling
    const setCanvasDimensions = () => {
      try {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // Ensure we have valid dimensions
        if (rect.width === 0 || rect.height === 0) return;

        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        ctx.scale(devicePixelRatio, devicePixelRatio);

        // Set cabinet dimensions based on canvas size
        cabinet.width = Math.min(rect.width * 0.4, 300);
        cabinet.height = cabinet.width * 1.5;
        cabinet.x = rect.width / 2 - cabinet.width / 2;
        cabinet.y = rect.height / 2 - cabinet.height / 2;
      } catch (error) {
        console.warn('Error setting canvas dimensions:', error);
      }
    };

    // Create a new file
    const createFile = () => {
      const fileWidth = cabinet.width * 0.6;
      const fileHeight = fileWidth * 0.75;

      // Start position (random around the canvas)
      let startX, startY;
      const side = Math.floor(Math.random() * 4);

      switch(side) {
        case 0: // top
          startX = Math.random() * canvas.width;
          startY = -fileHeight;
          break;
        case 1: // right
          startX = canvas.width + fileWidth;
          startY = Math.random() * canvas.height;
          break;
        case 2: // bottom
          startX = Math.random() * canvas.width;
          startY = canvas.height + fileHeight;
          break;
        case 3: // left
          startX = -fileWidth;
          startY = Math.random() * canvas.height;
          break;
      }

      // Target position (drawer opening)
      const targetX = cabinet.x + cabinet.width / 2;
      const targetY = cabinet.y + cabinet.height * 0.4;

      return {
        width: fileWidth,
        height: fileHeight,
        x: startX,
        y: startY,
        targetX: targetX,
        targetY: targetY,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        progress: 0,
        speed: 0.01 + Math.random() * 0.01 * speed,
        color: color,
        entering: true,
        insideCabinet: false,
        exitProgress: 0
      };
    };

    // Draw the filing cabinet
    const drawCabinet = () => {
      const { x, y, width, height, drawerOpen } = cabinet;

      // Cabinet body
      ctx.fillStyle = color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;

      // Main cabinet body
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);

      // Drawer
      const drawerHeight = height * 0.2;
      const drawerY = y + height * 0.3;
      const drawerOffset = width * 0.7 * drawerOpen;

      // Drawer body
      ctx.fillRect(x + drawerOffset, drawerY, width, drawerHeight);
      ctx.strokeRect(x + drawerOffset, drawerY, width, drawerHeight);

      // Drawer handle
      ctx.fillStyle = '#333';
      ctx.fillRect(x + drawerOffset + width * 0.4, drawerY + drawerHeight * 0.4, width * 0.2, drawerHeight * 0.2);

      // Cabinet details - horizontal lines for other drawers
      ctx.beginPath();
      ctx.moveTo(x, y + height * 0.6);
      ctx.lineTo(x + width, y + height * 0.6);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y + height * 0.8);
      ctx.lineTo(x + width, y + height * 0.8);
      ctx.stroke();

      // Cabinet label
      ctx.fillStyle = '#fff';
      ctx.font = `${width * 0.08}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('DATA', x + width / 2, y + height * 0.15);
    };

    // Draw a file
    const drawFile = (file) => {
      const { x, y, width, height, rotation, color } = file;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // File body
      ctx.fillStyle = color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(-width/2, -height/2);
      ctx.lineTo(width/3, -height/2);
      ctx.lineTo(width/2, -height/3);
      ctx.lineTo(width/2, height/2);
      ctx.lineTo(-width/2, height/2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // File fold
      ctx.beginPath();
      ctx.moveTo(width/3, -height/2);
      ctx.lineTo(width/3, -height/3);
      ctx.lineTo(width/2, -height/3);
      ctx.stroke();

      // File lines (content)
      const lineSpacing = height / 5;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-width/3, -height/4 + i * lineSpacing);
        ctx.lineTo(width/3, -height/4 + i * lineSpacing);
        ctx.stroke();
      }

      ctx.restore();
    };

    // Update file position
    const updateFile = (file) => {
      // Update rotation
      file.rotation += file.rotationSpeed;

      if (file.entering && !file.insideCabinet) {
        // Move toward cabinet
        file.progress += file.speed;

        if (file.progress >= 1) {
          file.progress = 1;
          file.insideCabinet = true;

          // Open drawer when file reaches cabinet
          cabinet.drawerTarget = 1;
        }

        // Calculate position based on progress
        file.x = file.x + (file.targetX - file.x) * file.progress;
        file.y = file.y + (file.targetY - file.y) * file.progress;
      } else if (file.insideCabinet) {
        // File is inside cabinet, wait for drawer to close
        if (cabinet.drawerOpen < 0.1) {
          // Start exit process when drawer is mostly closed
          file.entering = false;
          file.exitProgress = 0;

          // Choose a random exit direction
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.max(canvas.width, canvas.height) * 1.5;
          file.exitTargetX = file.x + Math.cos(angle) * distance;
          file.exitTargetY = file.y + Math.sin(angle) * distance;
        }
      } else {
        // File is exiting
        file.exitProgress += file.speed * 1.5;

        if (file.exitProgress >= 1) {
          // Remove file when it's off screen
          return false;
        }

        // Calculate position based on exit progress
        file.x = file.targetX + (file.exitTargetX - file.targetX) * file.exitProgress;
        file.y = file.targetY + (file.exitTargetY - file.targetY) * file.exitProgress;
      }

      return true;
    };

    // Animation loop with improved performance and error handling
    const animate = () => {
      if (!isAnimatingRef.current || !canvas || !ctx) return;

      try {
        frameCount++;

        // Clear canvas with bounds checking
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          ctx.clearRect(0, 0, rect.width, rect.height);
        }

        // Update drawer position with smoother animation
        if (cabinet.drawerOpen !== cabinet.drawerTarget) {
          const smoothSpeed = cabinet.drawerSpeed * speed;
          if (cabinet.drawerTarget === 1) {
            // Opening drawer
            cabinet.drawerOpen += smoothSpeed;
            if (cabinet.drawerOpen >= 1) {
              cabinet.drawerOpen = 1;
              // Start closing after a delay
              setTimeout(() => {
                if (isAnimatingRef.current) {
                  cabinet.drawerTarget = 0;
                }
              }, 1000);
            }
          } else {
            // Closing drawer
            cabinet.drawerOpen -= smoothSpeed;
            if (cabinet.drawerOpen <= 0) {
              cabinet.drawerOpen = 0;
            }
          }
        }

        // Draw cabinet
        drawCabinet();

        // Update and draw files with performance optimization
        cabinet.files = cabinet.files.filter(updateFile);
        cabinet.files.forEach(drawFile);

        // Add new files periodically (reduced frequency for better performance)
        const fileCreationInterval = Math.max(60, 120 / speed);
        if (frameCount % fileCreationInterval === 0 || cabinet.files.length === 0) {
          cabinet.files.push(createFile());
        }

        // Continue animation
        if (isAnimatingRef.current) {
          animationFrameRef.current = window.requestAnimationFrame(animate);
        }
      } catch (error) {
        console.warn('Animation error:', error);
        // Restart animation after a brief delay
        setTimeout(() => {
          if (isAnimatingRef.current) {
            animationFrameRef.current = window.requestAnimationFrame(animate);
          }
        }, 100);
      }
    };

    // Handle resize with debouncing
    const handleResize = () => {
      if (isAnimatingRef.current) {
        setCanvasDimensions();
      }
    };

    // Initialize animation
    const startAnimation = () => {
      isAnimatingRef.current = true;
      setCanvasDimensions();
      animate();
    };

    // Start animation
    startAnimation();

    // Add resize listener with passive option for better performance
    window.addEventListener('resize', handleResize, { passive: true });

    // Cleanup function
    return () => {
      isAnimatingRef.current = false;
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [color, speed]);

  return (
    <div className="loading-container component-transition" style={{ width, height, position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          willChange: 'transform', // Optimize for animations
        }}
      />
      {/* Optional loading text overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          color: color,
          fontSize: '14px',
          fontWeight: '500',
          textAlign: 'center',
          opacity: 0.8,
          pointerEvents: 'none'
        }}
      >
        <div className="animate-pulse">Loading...</div>
      </div>
    </div>
  );
};

export default Loading;
