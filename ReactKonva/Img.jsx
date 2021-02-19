import React , {useRef , useEffect} from "react";
import { Image, Transformer } from "react-konva";
import useImage from "use-image";

export const Img = ({
  shapeProps,
  isSelected,
  onSelect,
  onChange,
  width,
  height,
  printArea,
  // canvasRef,
}) => {
  const shapeRef =  useRef();
  const trRef = useRef();
  const [image] = useImage(shapeProps.imgUrl);

  const rotationSnaps = [0, 90, 180, 270];

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Image
        image={image}
        // onDragMove={(a) => {
        // console.log(canvasRef);
        //   console.log(a);
        //   }
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        // dragBoundFunc={dragBoundFunc}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          onDragMove={console.log(trRef)}
          // centeredScaling={true}
          rotationSnaps={rotationSnaps}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};
