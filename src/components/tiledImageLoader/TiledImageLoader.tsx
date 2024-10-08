"use client";

import React, {
  Dispatch,
  type FC,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

const DEFAULT_TILE_SIZE = 292;

type TiledImageLoaderProps = {
  tiledImagePath: string;
  renderTileContent?: (row: number, col: number) => JSX.Element | null;
  cols: number;
  rows: number;
  loadAllImagesOnStart?: boolean;
};

const TiledImageLoader: FC<TiledImageLoaderProps> = ({
  tiledImagePath,
  renderTileContent,
  cols,
  rows,
  loadAllImagesOnStart,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [hasTransformed, setHasTransformed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const viewport = useMemo(() => {
    if (typeof window === "undefined") return { width: 0, height: 0 };

    const rect = containerRef.current?.getBoundingClientRect();
    return {
      width: rect?.width || window.innerWidth,
      height: rect?.height || window.innerHeight,
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollLeft =
        (container.scrollWidth - container.clientWidth) / 2;
    }
  }, []);

  const [tilesDistanceToViewport, setTilesDistanceToViewport] = useState<{
    [key: string]: number;
  }>({});
  const [loadedTiles, setLoadedTiles] = useState<{ [key: string]: boolean }>(
    {}
  );

  const tilesOrderedByDistance = useMemo(() => {
    return Object.entries(tilesDistanceToViewport)
      .sort((a, b) => a[1] - b[1])
      .map(([key]) => key);
  }, [tilesDistanceToViewport]);

  useEffect(() => {
    if (!loadAllImagesOnStart) return;

    const loadImage = (key: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = `${tiledImagePath}/row-${key.split("-")[0]}-column-${
          key.split("-")[1]
        }.webp`;
        img.onload = () => {
          setLoadedTiles((prev) => ({ ...prev, [key]: true }));
          resolve();
        };
        img.onerror = reject;
      });
    };

    const loadImagesSequentially = async () => {
      for (const key of tilesOrderedByDistance) {
        try {
          await loadImage(key);
        } catch (error) {
          console.error(`Failed to load image: ${key}`, error);
        }
      }
    };

    loadImagesSequentially();
  }, [tiledImagePath, tilesOrderedByDistance, loadAllImagesOnStart]);

  useEffect(() => {
    if (!hasTransformed) return;

    const timeout = setTimeout(() => {
      setHasTransformed(false);

      clearTimeout(timeout);
    }, 100);
    return () => {
      clearTimeout(timeout);
    };
  }, [hasTransformed]);

  useEffect(() => {
    // Function to handle window refocus
    const handleFocus = () => {
      console.log("Window has been refocused");
      setHasTransformed(true);
    };

    // Function to handle window blur (unfocus)
    const handleBlur = () => {
      console.log("Window has lost focus");
    };

    // Add event listeners for window focus and blur
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Cleanup function to remove event listeners when component unmounts
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return (
    <div
      className="size-full"
      ref={containerRef}
      onPointerUp={() => setHasTransformed(true)}
    >
      <TransformWrapper
        initialScale={0.675}
        minScale={0.3}
        maxScale={1}
        centerOnInit
        centerZoomedOut
        limitToBounds
        disablePadding
        onInit={() => {
          setIsReady(true);
          setHasTransformed(true);
        }}
        onPanningStop={() => setHasTransformed(true)}
        onZoomStop={() => setHasTransformed(true)}
        panning={{
          velocityDisabled: true,
        }}
        pinch={{ step: 0.001 }}
      >
        <TransformComponent
          wrapperStyle={{
            width: "100%",
            height: "100%",
          }}
        >
          <div
            className="grid"
            style={{
              width: `${cols * DEFAULT_TILE_SIZE}px`,
              height: `${rows * DEFAULT_TILE_SIZE}px`,
              gridTemplateColumns: `repeat(${
                cols - 1
              }, ${DEFAULT_TILE_SIZE}px) auto`,
              gridTemplateRows: `repeat(${
                rows - 1
              }, ${DEFAULT_TILE_SIZE}px) auto`,
            }}
          >
            {rows * cols
              ? Array.from({ length: rows * cols }).map((_, index) => {
                  const currentRow = Math.floor(index / cols) + 1;
                  const currentCol = (index % cols) + 1;

                  return (
                    <Tile
                      key={"cell-" + index}
                      index={index}
                      isReady={isReady}
                      tiledImagePath={tiledImagePath}
                      renderTileContent={renderTileContent}
                      currentRow={currentRow}
                      currentCol={currentCol}
                      viewport={viewport}
                      setTilesDistanceToViewport={setTilesDistanceToViewport}
                      imagePreloaded={
                        loadedTiles[`${currentRow}-${currentCol}`]
                      }
                      tileSize={DEFAULT_TILE_SIZE}
                      hasTransformed={hasTransformed}
                    />
                  );
                })
              : null}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default TiledImageLoader;

type TileProps = {
  isReady: boolean;
  index: number;
  tiledImagePath: string;
  renderTileContent?: (row: number, col: number) => JSX.Element | null;
  currentRow: number;
  currentCol: number;
  viewport: {
    width: number;
    height: number;
  };
  setTilesDistanceToViewport: Dispatch<
    SetStateAction<{ [key: string]: number }>
  >;
  imagePreloaded: boolean;
  tileSize: number;
  hasTransformed: boolean;
};

const Tile: FC<TileProps> = ({
  tiledImagePath,
  isReady,
  index,
  renderTileContent,
  currentRow,
  currentCol,
  viewport,
  setTilesDistanceToViewport,
  imagePreloaded = false,
  tileSize,
  hasTransformed,
}) => {
  const tileRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log("hasTransformed", hasTransformed);
    if (isVisible) return;

    if (tileRef.current) {
      const tileRect = tileRef.current.getBoundingClientRect();
      const isHorizontallyVisible =
        (tileRect.left >= 0 && tileRect.left <= window.innerWidth) ||
        (tileRect.right >= 0 && tileRect.right <= window.innerWidth);

      const isVerticallyVisible =
        (tileRect.top >= 0 && tileRect.top <= window.innerHeight) ||
        (tileRect.bottom >= 0 && tileRect.bottom <= window.innerHeight);

      const visible = isHorizontallyVisible && isVerticallyVisible;
      setIsVisible(visible);
    }
  }, [hasTransformed, index, isVisible]);

  useEffect(() => {
    if (!isReady) return;

    if (tileRef.current) {
      const tileRect = tileRef.current.getBoundingClientRect();
      const tileMidX = tileRect.left + tileRect.width / 2;
      const tileMidY = tileRect.top + tileRect.height / 2;

      const viewportMidX = viewport.width / 2;
      const viewportMidY = viewport.height / 2;

      const distanceX = Math.abs(tileMidX - viewportMidX);
      const distanceY = Math.abs(tileMidY - viewportMidY);

      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

      setTilesDistanceToViewport((prev) => ({
        ...prev,
        [`${currentRow}-${currentCol}`]: distance,
      }));
    }
  }, [
    isReady,
    index,
    viewport,
    currentRow,
    currentCol,
    setTilesDistanceToViewport,
  ]);

  return (
    <div
      id={`tile-${currentRow}-${currentCol}`}
      ref={tileRef}
      className="relative transition-all duration-1000 opacity-0 size-full"
      style={{
        maxWidth: tileSize,
        maxHeight: tileSize,
      }}
    >
      {imagePreloaded || isVisible ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${tiledImagePath}/row-${currentRow}-column-${currentCol}.webp`}
          alt=""
          onLoad={() => {
            if (!tileRef.current) return;
            tileRef.current.style.opacity = "1";
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      ) : null}
      {imagePreloaded ||
        (isVisible && (
          <div className="absolute top-0 left-0 size-full">
            {renderTileContent?.(currentRow, currentCol)}
          </div>
        ))}
    </div>
  );
};
