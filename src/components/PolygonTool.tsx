import React, { useState } from 'react';
import { Stage, Layer, Line, Circle, Text } from 'react-konva';

interface Point {
  x: number;
  y: number;
}

const PolygonTool: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([
    { x: 100, y: 100 },
    { x: 200, y: 50 },
    { x: 300, y: 150 },
    { x: 200, y: 250 },
    { x: 100, y: 200 }
  ]);

  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const handleDragMove = (index: number, e: any) => {
    const newPoints = points.map((point, i) =>
      i === index
        ? {
            x: e.target.x(),
            y: e.target.y()
          }
        : point
    );
    setPoints(newPoints);
  };

  const handleMouseEnterEdge = (start: Point, end: Point) => {
    const distance = calculateDistance(start, end);
    setTooltip({
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2 - 20,
      text: `Length: ${distance.toFixed(2)}`
    });
  };

  const handleMouseLeaveEdge = () => {
    setTooltip(null);
  };

  const calculateDistance = (p1: Point, p2: Point) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const linePoints = points.flatMap((p) => [p.x, p.y]);

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Line
          points={linePoints}
          fill="lightblue"
          stroke="blue"
          strokeWidth={3}
          closed
        />

        {points.map((point, index) => {
          const nextIndex = (index + 1) % points.length;
          const nextPoint = points[nextIndex];
          return (
            <Line
              key={index}
              points={[point.x, point.y, nextPoint.x, nextPoint.y]}
              stroke="transparent"
              strokeWidth={10}
              onMouseEnter={() => handleMouseEnterEdge(point, nextPoint)}
              onMouseLeave={handleMouseLeaveEdge}
            />
          );
        })}

        {points.map((point, index) => (
          <Circle
            key={index}
            x={point.x}
            y={point.y}
            radius={8}
            fill="red"
            draggable
            onDragMove={(e) => handleDragMove(index, e)}
          />
        ))}

        {tooltip && (
          <Text
            x={tooltip.x}
            y={tooltip.y}
            text={tooltip.text}
            fontSize={16}
            fill="black"
            padding={5}
            backgroundColor="white"
          />
        )}
      </Layer>
    </Stage>
  );
};

export default PolygonTool;
