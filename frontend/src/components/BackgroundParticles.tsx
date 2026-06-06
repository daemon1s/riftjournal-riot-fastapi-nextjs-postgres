"use client";

import React, { useEffect, useRef } from "react";

const PALETTE = {
  bgStart: "#030712",
  bgEnd: "#000000",
  starColors: [
    "rgba(255, 255, 255, ",
    "rgba(0, 210, 255, ",
    "rgba(56, 182, 255, ",
    "rgba(255, 159, 67, ",
  ]
};

interface Star {
  x: number;
  y: number;
  size: number;
  colorTemplate: string;
  twinkleSpeed: number;
  twinklePhase: number;
  baseAlpha: number;
  driftX: number;
  driftY: number;
  isFlare: boolean;
}

export default function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const stars: Star[] = [];
    const starCount = 85;

    for (let i = 0; i < starCount; i++) {
      const size = 0.3 + Math.random() * 0.6;
      const isFlare = size > 0.75 && Math.random() < 0.2;

      stars.push({
        x: Math.random() * width,
        y: 180 + Math.random() * (height - 180),
        size,
        colorTemplate: PALETTE.starColors[Math.floor(Math.random() * PALETTE.starColors.length)],
        twinkleSpeed: 0.01 + Math.random() * 0.018,
        twinklePhase: Math.random() * Math.PI * 2,
        baseAlpha: 0.35 + Math.random() * 0.55,
        driftX: (Math.random() - 0.5) * 0.04,
        driftY: (Math.random() - 0.5) * 0.04,
        isFlare
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const animate = () => {
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height));
      bgGrad.addColorStop(0, PALETTE.bgStart);
      bgGrad.addColorStop(1, PALETTE.bgEnd);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      stars.forEach((star) => {
        star.x += star.driftX;
        star.y += star.driftY;

        const headerHeight = 180;
        const wrapPadding = 20;
        if (star.x < -wrapPadding) star.x = width + wrapPadding;
        if (star.x > width + wrapPadding) star.x = -wrapPadding;
        if (star.y < headerHeight - wrapPadding) star.y = height + wrapPadding;
        if (star.y > height + wrapPadding) star.y = headerHeight - wrapPadding;

        star.twinklePhase += star.twinkleSpeed;
        const twinkleAlpha = star.baseAlpha * (0.3 + 0.7 * Math.abs(Math.sin(star.twinklePhase)));

        let fadeFactor = 1;
        if (star.y < 220) {
          fadeFactor = Math.max(0, (star.y - 180) / 40);
        }

        const finalAlpha = twinkleAlpha * fadeFactor;

        if (finalAlpha > 0.01) {
          ctx.beginPath();
          ctx.fillStyle = `${star.colorTemplate}${finalAlpha})`;
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();

          if (star.isFlare) {
            ctx.beginPath();
            ctx.strokeStyle = `${star.colorTemplate}${finalAlpha * 0.55})`;
            ctx.lineWidth = 0.4;

            ctx.moveTo(star.x - star.size * 2.5, star.y);
            ctx.lineTo(star.x + star.size * 2.5, star.y);

            ctx.moveTo(star.x, star.y - star.size * 2.5);
            ctx.lineTo(star.x, star.y + star.size * 2.5);
            ctx.stroke();

            const glowGrad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 1.5);
            glowGrad.addColorStop(0, `${star.colorTemplate}${finalAlpha * 0.4})`);
            glowGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
