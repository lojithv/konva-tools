import React, { useRef, useState } from 'react';
import { Stage, Layer, Line, Circle, Text } from 'react-konva';

interface Point {
  x: number;
  y: number;
}

interface Polygon {
  points: Point[];
  isCompleted: boolean;
}

// Utility function to calculate the polygon's area using the Shoelace theorem
const calculatePolygonArea = (points: Point[], scale: number, dpi: number) => {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const { x: x1, y: y1 } = points[i];
    const { x: x2, y: y2 } = points[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2) * (scale / dpi) * (scale / dpi);
};

// Helper function to calculate the centroid of a polygon
const calculateCentroid = (points: Point[]) => {
  let xSum = 0, ySum = 0;
  points.forEach((p) => {
    xSum += p.x;
    ySum += p.y;
  });
  const xCenter = xSum / points.length;
  const yCenter = ySum / points.length;
  return { x: xCenter, y: yCenter };
};

// Helper function to calculate the distance between two points (Euclidean distance)
const calculateDistance = (p1: Point, p2: Point, scale:number, dpi: number) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy) * (scale / dpi); // Convert to feet using the scale
};

// Helper function to calculate the midpoint between two points
const calculateMidpoint = (p1: Point, p2: Point) => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
};

// Helper function to check if a click is near the first point (within a tolerance)
const isCloseToFirstPoint = (firstPoint: Point, newPoint: Point, tolerance = 10) => {
  const dx = firstPoint.x - newPoint.x;
  const dy = firstPoint.y - newPoint.y;
  return Math.sqrt(dx * dx + dy * dy) < tolerance;
};

const PolygonDrawingTool: React.FC = () => {
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);
  const [scale, setScale] = useState(10); // Default scale (1 inch = 10 feet)
  const [dpi, setDpi] = useState(72); // Default DPI

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle stage click to add points to the current polygon
  const handleStageClick = (e: any) => {
    if (!isDrawingEnabled) return;

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();

    if (pointerPosition) {
      if (currentPolygon.length === 0) {
        // Start drawing by adding the first point
        setCurrentPolygon([pointerPosition]);
      } else {
        // Check if we are closing the polygon by clicking near the first point
        if (isCloseToFirstPoint(currentPolygon[0], pointerPosition)) {
          // Calculate the polygon area


          // Create a completed polygon and add it to the array
          const newPolygon: Polygon = {
            points: currentPolygon,
            isCompleted: true,
          };
          setPolygons([...polygons, newPolygon]);
          setCurrentPolygon([]);
        } else {
          // Continue adding points to the current polygon
          setCurrentPolygon([...currentPolygon, pointerPosition]);
        }
      }
    }
  };

  // Enable/Disable the drawing mode
  const toggleDrawingMode = () => {
    setIsDrawingEnabled(!isDrawingEnabled);
    if (!isDrawingEnabled) {
      // Reset the current polygon when re-enabling drawing mode
      setCurrentPolygon([]);
    }
  };

  // Handle drag of individual points (vertices) of polygons
  const handleDragMove = (polygonIndex: number, pointIndex: number, e: any) => {
    const newPolygons = polygons.map((polygon, pIndex) => {
      if (polygonIndex === pIndex) {
        const newPoints = polygon.points.map((point, i) =>
          i === pointIndex
            ? { x: e.target.x(), y: e.target.y() }
            : point
        );
        return {
          ...polygon,
          points: newPoints,
        };
      }
      return polygon;
    });
    setPolygons(newPolygons);
  };

  // Convert points array to Line component compatible format
  const convertPointsToLine = (points: Point[]) => points.flatMap((p) => [p.x, p.y]);

  function saveDrawing(): void {
    //save konva stage as a json file, save the scale and DPI value as well

    const json = JSON.stringify({polygons:polygons, scale:scale, dpi:dpi});
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href  = url;
    a.download = 'drawing.json';
    a.click();
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContents = e.target?.result as string;
        try {
          const parsed = JSON.parse(fileContents);
          setPolygons(parsed.polygons);
          setScale(parsed.scale);
          setDpi(parsed.dpi);
          console.log('Parsed JSON:', parsed);
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      };
      reader.readAsText(file); // Read file as text
    } else {
      console.error('Please upload a valid JSON file.');
    }
  };

  function importDrawing(): void {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Programmatically click the file input
    }
  }

  return (
    <div>
      <div className="flex gap-5">
      <button className='border p-2 m-2' onClick={toggleDrawingMode}>
        {isDrawingEnabled ? 'Disable Drawing' : 'Enable Drawing'}
      </button>

      <button className='border p-2 m-2' onClick={saveDrawing}>
        Save Drawing
      </button>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button className='border p-2 m-2' onClick={importDrawing}>
        Import Drawing
      </button>
      </div>

      {/* Input fields for scale and DPI */}
      <div>
        <label>
          Scale (1 inch = 
          <input
            type="number"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            style={{ width: '80px', marginLeft: '5px' }}
          />
          feet)
        </label>
        <label style={{ marginLeft: '20px' }}>
          DPI: 
          <input
            type="number"
            value={dpi}
            onChange={(e) => setDpi(Number(e.target.value))}
            style={{ width: '60px', marginLeft: '5px' }}
          />
        </label>
      </div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onClick={handleStageClick}
      >
        <Layer>
          {/* Render all polygons */}
          {polygons.map((polygon, polygonIndex) => (
            <React.Fragment key={polygonIndex}>
              <Line
                points={convertPointsToLine(polygon.points)}
                fill="lightblue"
                stroke="blue"
                strokeWidth={2}
                closed
              />
              {/* Render draggable handles (circles) for each point of the polygon */}
              {polygon.points.map((point, pointIndex) => (
                <Circle
                  key={pointIndex}
                  x={point.x}
                  y={point.y}
                  radius={5}
                  fill="red"
                  draggable
                  onDragMove={(e) => handleDragMove(polygonIndex, pointIndex, e)}
                />
              ))}
              {/* Display the area at the center of the polygon */}
              <Text
                x={calculateCentroid(polygon.points).x}
                y={calculateCentroid(polygon.points).y}
                text={`Area: ${calculatePolygonArea(polygon.points, scale, dpi).toFixed(2)} sq ft`}
                fontSize={18}
                fill="black"
              />
              {/* Render lengths for each side */}
              {polygon.points.map((point, index) => {
                const nextPoint = polygon.points[(index + 1) % polygon.points.length];
                const distance = calculateDistance(point, nextPoint, scale, dpi);
                const midpoint = calculateMidpoint(point, nextPoint);

                return (
                  <Text
                    key={`length-${index}`}
                    x={midpoint.x}
                    y={midpoint.y}
                    text={`${distance.toFixed(2)} ft`} // Keep in feet
                    fontSize={14}
                    fill="green"
                  />
                );
              })}
            </React.Fragment>
          ))}

          {/* Render the current polygon being drawn */}
          {currentPolygon.length > 1 && (
            <Line
              points={convertPointsToLine(currentPolygon)}
              fill="transparent"
              stroke="blue"
              strokeWidth={2}
              closed={false}
            />
          )}

          {/* Render draggable handles (circles) for current polygon */}
          {currentPolygon.map((point, index) => (
            <Circle
              key={index}
              x={point.x}
              y={point.y}
              radius={5}
              fill="red"
              draggable={false} // Handles for the current polygon are not draggable until finalized
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default PolygonDrawingTool;
