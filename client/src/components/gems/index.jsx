import React, { useState } from "react";
import GemButton from "./gemButton";
import gemImages from "../gems/gems";
import { socket } from "../../util/socket";

export default function Gems({ gemBank, currentPlayer, roomId, playerId, currentPlayerId }) {
  const [selectedGems, setSelectedGems] = useState({});

  if (!currentPlayer || !gemBank) return null;

  const totalSelected = Object.values(selectedGems).reduce((sum, val) => sum + val, 0);
  const gemTypes = ["white", "black", "green", "orange", "purple"];

  const isTurn = playerId === currentPlayerId;

  const handleGemClick = (gem) => {
    const bankAmount = gemBank[gem] || 0;
    const current = selectedGems[gem] || 0;

    let newSelection = { ...selectedGems };

    if (current === 1) {
      if (bankAmount >= 4) {
        // Upgrade to 2 of same gem
        // But first, check if any other gem already has 2 selected (should not happen, but safeguard)
        const hasAnotherDouble = Object.entries(newSelection).some(
          ([key, count]) => key !== gem && count === 2
        );
        if (!hasAnotherDouble) {
          newSelection[gem] = 2;
        }
      } else {
        delete newSelection[gem];
      }
    } else if (current === 2) {
      // Clicking again unselects the double
      delete newSelection[gem];
    } else {
      // Not selected yet

      // If already have one gem double selected, cannot select any other gem
      const hasTwoOfSameGem = Object.values(newSelection).some(count => count === 2);
      if (hasTwoOfSameGem && !newSelection[gem]) {
        return; // block selecting another gem if we already have a double gem selected
      }

      const alreadySelected = Object.keys(newSelection);
      const alreadyTotal = Object.values(newSelection).reduce((a, b) => a + b, 0);

      if (alreadySelected.length < 3 && alreadyTotal < 3) {
        newSelection[gem] = 1;
      }
    }

    setSelectedGems(newSelection);
  };

  const handleConfirm = () => {
    if (!isTurn || totalSelected < 2 || totalSelected > 3) {
      alert("Invalid gem selection.");
      return;
    }

    socket.emit("player_action", {
      action: "collect_gems",
      roomId,
      payload: {
        selectedGems,
      },
    });

    setSelectedGems({});
  };

  if (currentPlayer.mustReturnGems) {
    return (
      <div
        style={{
          backgroundColor: "#ffeaea",
          border: "1px solid #ff4d4f",
          padding: "12px",
          borderRadius: "8px",
          fontWeight: "bold",
          marginBottom: "16px",
        }}
      >
        You have 10 or more gems! Please purchase, reserve, or skip your turn.
      </div>
    );
  }

  const totalHeldGems = Object.entries(currentPlayer.gems || {})
    .filter(([gem]) => gem !== "_id")
    .reduce((sum, [, count]) => sum + count, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "start" }}>
      {gemTypes.map((gem) => (
        <GemButton
          key={gem}
          gemName={gem}
          gemCount={gemBank[gem] || 0}
          onTake={() => handleGemClick(gem)}
          imageSrc={gemImages[gem]}
          selected={!!selectedGems[gem]}
          selectedCount={selectedGems[gem] || 0}
          disabled={
            !isTurn ||
            currentPlayer.mustReturnGems ||
            totalHeldGems >= 10 ||
            (gemBank[gem] || 0) <= 0
          }
        />
      ))}

      {isTurn && totalSelected > 0 && (
        <button
          onClick={handleConfirm}
          style={{
            width: 100,
            marginTop: "24px",
            padding: "8px 16px",
            backgroundColor: "green",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            alignSelf: "center", // center confirm button horizontally
          }}
        >
          Confirm Gems
        </button>
      )}
    </div>
  );
}
