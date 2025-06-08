import React from 'react'
import RedGem from './red-gem'
import GreenGem from './green-gem'
import BlackGem from './black-gem'
import WhiteGem from './white-gem'
import WildGem from './wild-gem'
import OrangeGem from './orange-gem'
import PurpleGem from './purple-gem'

export default function Gems() {
  return (
    <div style={{ margin: 0, padding: 0 }}>
        <WildGem />
        <OrangeGem />
        <GreenGem />
        <PurpleGem />
        <BlackGem />
        <WhiteGem />
    </div>
  )
}
