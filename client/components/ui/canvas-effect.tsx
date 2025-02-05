"use client";

import React, { useEffect, useRef } from 'react'

interface CanvasRevealEffectProps {
  colors?: number[][]
  dotSize?: number
  animationSpeed?: number
  opacities?: number[]
  containerClassName?: string
}

export function CanvasRevealEffect({
  colors = [[255, 255, 255]],
  dotSize = 2,
  animationSpeed = 5,
  opacities = [1],
  containerClassName = '',
}: CanvasRevealEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${containerClassName}`}
    />
  )
}
