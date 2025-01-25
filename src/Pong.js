import React, { useRef, useEffect, useState } from "react";

const Scoreboard = ({ score }) => (
  <div className="scoreboard">
    <div className="score-container player">
      <h2 style={{ color: "#ffff00" }}>Player</h2>
      <div className="score" style={{ color: "#ffff00" }}>{score.player}</div>
    </div>
    <div className="score-container ai">
      <h2 style={{ color: "#ff69b4" }}>AI</h2>
      <div className="score" style={{ color: "#ff69b4" }}>{score.ai}</div>
    </div>
  </div>
);

const Pong = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [isGameRunning, setIsGameRunning] = useState(false);

  // Add sound effects
  const paddleHitSound = new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==');
  const scoreSound = new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==');

  // Oscillator function for sound effects
  const playSound = (frequency, duration) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, duration);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;

    // Ensure canvas dimensions are set
    canvas.width = 800;
    canvas.height = 400;

    // Game settings
    const paddleWidth = 10;
    const paddleHeight = 100;
    const ballSize = 20; // Increased size for ghost
    const playerX = 10;
    const aiX = canvas.width - paddleWidth - 10;
    const paddleSpeed = 5;

    // Player and ball state
    let playerY = canvas.height / 2 - paddleHeight / 2;
    let aiY = canvas.height / 2 - paddleHeight / 2;
    let ballX = canvas.width / 2 - ballSize / 2;
    let ballY = canvas.height / 2 - ballSize / 2;
    let ballSpeedX = 4;
    let ballSpeedY = 4;

    // Add ghost drawing function
    const drawGhost = (x, y, size) => {
      ctx.save();
      ctx.fillStyle = "#FFFF00"; // Snapchat yellow
      
      // Main ghost body
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, Math.PI, 0, false);
      ctx.lineTo(x + size, y + size);
      
      // Ghost feet
      const feetWidth = size/3;
      for(let i = 0; i < 3; i++) {
        ctx.lineTo(x + size - (i * feetWidth), y + size);
        ctx.arc(x + size - (i * feetWidth) - feetWidth/2, y + size,
                feetWidth/2, 0, Math.PI, true);
      }
      
      ctx.lineTo(x, y + size/2);
      ctx.fill();
      
      // Ghost eyes
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(x + size/3, y + size/2, size/8, 0, Math.PI * 2);
      ctx.arc(x + (size/3 * 2), y + size/2, size/8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const resetBall = () => {
      ballX = canvas.width / 2 - ballSize / 2;
      ballY = canvas.height / 2 - ballSize / 2;
      ballSpeedX = 4 * (Math.random() < 0.5 ? 1 : -1);
      ballSpeedY = 4 * (Math.random() < 0.5 ? 1 : -1);
      playSound(220, 100);
    };

    const gameLoop = () => {
      if (!isGameRunning) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw paddles
      ctx.fillStyle = "#ffff00";  // Yellow paddle
      ctx.fillRect(playerX, playerY, paddleWidth, paddleHeight);
      
      ctx.fillStyle = "#ff69b4";  // Pink paddle
      ctx.fillRect(aiX, aiY, paddleWidth, paddleHeight);

      // Draw ghost instead of ball
      drawGhost(ballX - ballSize/2, ballY - ballSize/2, ballSize * 2);

      // Ball movement
      ballX += ballSpeedX;
      ballY += ballSpeedY;

      // Ball collision with top and bottom
      if (ballY <= 0 || ballY + ballSize >= canvas.height) {
        ballSpeedY *= -1;
        playSound(300, 50); // Play bounce sound
      }

      // Ball collision with paddles
      if (
        (ballX <= playerX + paddleWidth &&
          ballY + ballSize >= playerY &&
          ballY <= playerY + paddleHeight) ||
        (ballX + ballSize >= aiX &&
          ballY + ballSize >= aiY &&
          ballY <= aiY + paddleHeight)
      ) {
        ballSpeedX *= -1;
        playSound(400, 50); // Play paddle hit sound
      }

      // Ball out of bounds
      if (ballX <= 0) {
        setScore((prev) => ({ ...prev, ai: prev.ai + 1 }));
        resetBall();
      } else if (ballX + ballSize >= canvas.width) {
        setScore((prev) => ({ ...prev, player: prev.player + 1 }));
        resetBall();
      }

      // AI paddle movement
      if (aiY + paddleHeight / 2 < ballY) {
        aiY = Math.min(aiY + paddleSpeed, canvas.height - paddleHeight);
      } else {
        aiY = Math.max(aiY - paddleSpeed, 0);
      }

      // Score text in yellow
      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 20px Arial";
      ctx.fillText(`Player: ${score.player}`, 20, 30);
      ctx.fillText(`AI: ${score.ai}`, canvas.width - 100, 30);

      animationId = requestAnimationFrame(gameLoop);
    };

    const handleMouseMove = (e) => {
      if (!isGameRunning) return;
      const rect = canvas.getBoundingClientRect();
      playerY = e.clientY - rect.top - paddleHeight / 2;
      if (playerY < 0) playerY = 0;
      if (playerY + paddleHeight > canvas.height)
        playerY = canvas.height - paddleHeight;
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    // Start the game loop
    animationId = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [isGameRunning, score.player, score.ai]); // Added score dependencies

  const handleStartReset = () => {
    setIsGameRunning(!isGameRunning);
    setScore({ player: 0, ai: 0 });
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>👻 GHOST PONG 👻</h1>
      <Scoreboard score={score} />
      <button 
        onClick={handleStartReset}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          marginBottom: "20px",
          backgroundColor: isGameRunning ? "#ff69b4" : "#ffff00",
          color: isGameRunning ? "white" : "black",
          border: "none",
          borderRadius: "25px",
          cursor: "pointer",
          fontWeight: "bold",
          boxShadow: "0 0 15px rgba(255,255,255,0.3)",
          transition: "all 0.3s ease"
        }}
      >
        {isGameRunning ? "Reset Game" : "Start Game"}
      </button>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        style={{
          border: "3px solid yellow",
          background: "rgba(0,0,0,0.8)",
          display: "block",
          margin: "0 auto",
          borderRadius: "10px",
          boxShadow: "0 0 20px rgba(255,255,255,0.3)"
        }}
      ></canvas>
    </div>
  );
};

export default Pong;