import React from 'react'

import NobleDeck from '../noble-deck'
import YellowDeck from '../yellow-deck'
import BlueDeck from '../blue-deck'
import GreenDeck from '../green-deck'

export default function PlayBoard() {
  return (
    <div style={{ display: 'grid' }}>
        <NobleDeck />
        <BlueDeck />
        <GreenDeck />
        <YellowDeck />
    </div>
  )
}
