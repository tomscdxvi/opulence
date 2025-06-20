import React from "react";

import useWindowSize from "../../util/useWindowSize";

export default function GemButton({
  gemName,
  gemCount,
  onTake,
  imageSrc,
  selected,
  selectedCount,
  disabled,
}) {

  const { isLaptop } = useWindowSize();

  // Adjust sizes based on laptop breakpoint
  const buttonSize = isLaptop ? 60 : 80;
  const fontSize = isLaptop ? 10 : 12;
  const selectedCountSize = isLaptop ? 16 : 20;


  return (
    <button
      onClick={onTake}
      disabled={disabled}
      style={{
        position: "relative",
        width: buttonSize,
        height: buttonSize,
        borderRadius: "50%",
        padding: 10,
        margin: 6,
        backgroundColor: selected ? "rgba(255, 223, 100, 0.3)" : "rgba(255, 255, 255, 0.15)",
        border: selected ? "2px solid gold" : "1px solid #ccc",
        boxShadow: selected
          ? "0 4px 12px rgba(255, 215, 0, 0.5)"
          : "0 2px 6px rgba(0, 0, 0, 0.1)",
        cursor: disabled ? "not-allowed" : "pointer",
        backdropFilter: "blur(6px)",
        transition: "all 0.25s ease-in-out",
        transform: selected ? "scale(1.05)" : "scale(1)",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <img
        src={imageSrc}
        alt={gemName}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />

      {/* Gem Count (bottom center) */}
      <div
        style={{
          position: "absolute",
          bottom: -6,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#333",
          color: "#fff",
          padding: "2px 6px",
          borderRadius: "12px",
          fontSize: fontSize,
          fontWeight: "bold",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      >
        {gemCount}
      </div>

      {/* Selected Count (top right badge) */}
      {selectedCount > 1 && (
        <div
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            backgroundColor: "crimson",
            color: "white",
            borderRadius: "50%",
            width: selectedCountSize,
            height: selectedCountSize,
            fontSize: fontSize,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          {selectedCount}
        </div>
      )}
    </button>
  );
}
