import React from "react";

export default function GameOverModal({ winner, finalScore }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "100vw",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "2rem 3rem",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
          maxWidth: "400px",
        }}
      >
        <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>🏆 Game Over!</h2>
        <p style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
          <strong>{winner}</strong> wins the game with <strong>{finalScore}</strong> points!
        </p>
      </div>
    </div>
  );
}
