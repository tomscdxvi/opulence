import React from "react";

export default function GemButton({ gemName, gemCount, onTake, imageSrc, selected, selectedCount, disabled }) {
  return (
    <button
      onClick={onTake}
      disabled={disabled}
      style={{
        position: "relative",
        border: selected ? "2px solid gold" : "1px solid gray",
        borderRadius: "50%",
        padding: 12,
        margin: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        backgroundColor: selected ? "#ddd" : "#fff",
      }}
    >
      <img src={imageSrc} alt={gemName} width={60} height={60} />
      {selectedCount > 1 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            backgroundColor: "red",
            color: "white",
            borderRadius: "50%",
            width: 18,
            height: 18,
            fontSize: 12,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selectedCount}
        </div>
      )}
    </button>
  );
}

