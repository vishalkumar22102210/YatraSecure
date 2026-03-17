"use client";

import React, { useContext } from "react";
import { TravelThemeContext, normalizeCategoryKey } from "@/app/TravelThemeProvider";

/* ─── Individual SVG characters ───────────────────────────────────────────── */

// Default – backpacker with map
function DefaultChar() {
  return (
    <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="18" r="11" fill="var(--accent)" opacity="0.9"/>
      <rect x="28" y="31" width="24" height="28" rx="6" fill="var(--accent)" opacity="0.85"/>
      <rect x="50" y="34" width="16" height="22" rx="5" fill="var(--accent-hover)" opacity="0.75"/>
      <rect x="53" y="30" width="10" height="6" rx="3" fill="var(--accent-hover)" opacity="0.65"/>
      <rect x="10" y="32" width="16" height="8" rx="3" fill="white" opacity="0.4"/>
      <line x1="13" y1="36" x2="23" y2="36" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5"/>
      <line x1="13" y1="38" x2="20" y2="38" stroke="var(--accent)" strokeWidth="1" opacity="0.4"/>
      <rect x="30" y="57" width="8" height="26" rx="4" fill="var(--accent)" opacity="0.75"/>
      <rect x="42" y="57" width="8" height="26" rx="4" fill="var(--accent)" opacity="0.75"/>
      <circle cx="63" cy="52" r="7" fill="none" stroke="var(--accent-hover)" strokeWidth="2" opacity="0.8"/>
      <line x1="63" y1="47" x2="63" y2="57" stroke="var(--accent-hover)" strokeWidth="1.5" opacity="0.7"/>
      <line x1="58" y1="52" x2="68" y2="52" stroke="var(--accent-hover)" strokeWidth="1.5" opacity="0.7"/>
    </svg>
  );
}

// Forest – person under tree with falling leaves
function ForestChar() {
  return (
    <svg width="90" height="110" viewBox="0 0 90 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes leafDrop1 { 0%{transform:translate(0,0) rotate(0deg);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translate(-12px,50px) rotate(180deg);opacity:0} }
        @keyframes leafDrop2 { 0%{transform:translate(0,0) rotate(0deg);opacity:0} 15%{opacity:1} 85%{opacity:.8} 100%{transform:translate(10px,55px) rotate(-140deg);opacity:0} }
      `}</style>
      {/* Tree trunk */}
      <rect x="40" y="55" width="10" height="30" rx="4" fill="var(--accent)" opacity="0.4"/>
      {/* Tree canopy */}
      <ellipse cx="45" cy="35" rx="28" ry="22" fill="var(--accent)" opacity="0.5"/>
      <ellipse cx="45" cy="28" rx="20" ry="16" fill="var(--accent-hover)" opacity="0.4"/>
      {/* Falling leaves */}
      <ellipse cx="25" cy="15" rx="5" ry="3" fill="var(--accent)" opacity="0.7" style={{animation:'leafDrop1 4s ease-in infinite'}}/>
      <ellipse cx="60" cy="10" rx="4" ry="2.5" fill="var(--accent-hover)" opacity="0.7" style={{animation:'leafDrop2 5s ease-in infinite 1.5s'}}/>
      <ellipse cx="35" cy="5"  rx="3.5" ry="2" fill="var(--accent)" opacity="0.6" style={{animation:'leafDrop1 6s ease-in infinite 2.5s'}}/>
      {/* Person */}
      <circle cx="60" cy="72" r="7" fill="var(--accent)" opacity="0.9"/>
      <rect x="52" y="81" width="16" height="18" rx="5" fill="var(--accent)" opacity="0.85"/>
      <rect x="48" y="97" width="8" height="13" rx="4" fill="var(--accent)" opacity="0.75"/>
      <rect x="60" y="97" width="8" height="13" rx="4" fill="var(--accent)" opacity="0.75"/>
    </svg>
  );
}

// Mountains – hiker looking up
function MountainsChar() {
  return (
    <svg width="90" height="110" viewBox="0 0 90 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`@keyframes breathe { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.04) translateY(-1px)} }`}</style>
      {/* Mountain peak */}
      <polygon points="45,5 15,50 75,50" fill="var(--accent)" opacity="0.25"/>
      <polygon points="45,12 25,50 65,50" fill="var(--accent-hover)" opacity="0.2"/>
      {/* Person with breathe */}
      <g style={{animation:'breathe 3s ease-in-out infinite', transformOrigin:'45px 90px'}}>
        <circle cx="45" cy="62" r="9" fill="var(--accent)" opacity="0.9"/>
        {/* Backpack */}
        <rect x="53" y="68" width="13" height="18" rx="4" fill="var(--accent-hover)" opacity="0.8"/>
        <rect x="55" y="64" width="9" height="5" rx="2" fill="var(--accent-hover)" opacity="0.7"/>
        {/* Body */}
        <rect x="34" y="73" width="20" height="22" rx="6" fill="var(--accent)" opacity="0.85"/>
        {/* Legs */}
        <rect x="36" y="93" width="8" height="17" rx="4" fill="var(--accent)" opacity="0.75"/>
        <rect x="46" y="93" width="8" height="17" rx="4" fill="var(--accent)" opacity="0.75"/>
        {/* Staff */}
        <rect x="28" y="65" width="3" height="40" rx="1.5" fill="var(--accent)" opacity="0.5"/>
      </g>
    </svg>
  );
}

// Beach – person sitting watching waves
function BeachChar() {
  return (
    <svg width="90" height="100" viewBox="0 0 90 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`@keyframes sway { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(3deg)} }`}</style>
      {/* Waves */}
      <path d="M0,80 Q22,72 45,80 Q68,88 90,80" stroke="var(--accent)" strokeWidth="2.5" fill="none" opacity="0.5"/>
      <path d="M0,88 Q22,80 45,88 Q68,96 90,88" stroke="var(--accent)" strokeWidth="2" fill="none" opacity="0.3"/>
      {/* Person sitting */}
      <g style={{animation:'sway 4s ease-in-out infinite', transformOrigin:'45px 70px'}}>
        <circle cx="45" cy="45" r="10" fill="var(--accent)" opacity="0.9"/>
        {/* Body */}
        <rect x="33" y="57" width="24" height="18" rx="6" fill="var(--accent)" opacity="0.85"/>
        {/* Legs stretched */}
        <rect x="20" y="73" width="22" height="8" rx="4" fill="var(--accent)" opacity="0.75" transform="rotate(-10 20 73)"/>
        <rect x="48" y="71" width="22" height="8" rx="4" fill="var(--accent)" opacity="0.75" transform="rotate(10 48 71)"/>
        {/* Sun hat */}
        <ellipse cx="45" cy="38" rx="14" ry="4" fill="var(--accent-hover)" opacity="0.8"/>
        <ellipse cx="45" cy="36" rx="9" ry="7" fill="var(--accent-hover)" opacity="0.7"/>
      </g>
    </svg>
  );
}

// Desert – camel silhouette
function DesertChar() {
  return (
    <svg width="100" height="90" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes camelWalk { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-4px)} }
        @keyframes legSwing  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(8deg)} }
      `}</style>
      {/* Dune */}
      <path d="M0,80 Q50,55 100,80 L100,90 L0,90Z" fill="var(--accent)" opacity="0.2"/>
      {/* Camel */}
      <g style={{animation:'camelWalk 2s ease-in-out infinite'}}>
        {/* Body */}
        <ellipse cx="52" cy="56" rx="22" ry="13" fill="var(--accent)" opacity="0.65"/>
        {/* Hump */}
        <ellipse cx="44" cy="42" rx="10" ry="9" fill="var(--accent)" opacity="0.55"/>
        {/* Head */}
        <ellipse cx="72" cy="48" rx="8" ry="6" fill="var(--accent)" opacity="0.7"/>
        {/* Neck */}
        <rect x="64" y="44" width="10" height="16" rx="4" fill="var(--accent)" opacity="0.6"/>
        {/* Legs */}
        <rect x="36" y="66" width="6" height="18" rx="3" fill="var(--accent)" opacity="0.6" style={{animation:'legSwing 2s ease-in-out infinite', transformOrigin:'39px 66px'}}/>
        <rect x="46" y="66" width="6" height="18" rx="3" fill="var(--accent)" opacity="0.6" style={{animation:'legSwing 2s ease-in-out infinite 0.5s', transformOrigin:'49px 66px'}}/>
        <rect x="56" y="66" width="6" height="18" rx="3" fill="var(--accent)" opacity="0.6" style={{animation:'legSwing 2s ease-in-out infinite 0.3s', transformOrigin:'59px 66px'}}/>
        {/* Rider */}
        <circle cx="50" cy="33" r="7" fill="var(--accent)" opacity="0.9"/>
        <rect x="40" y="40" width="20" height="14" rx="5" fill="var(--accent)" opacity="0.85"/>
      </g>
    </svg>
  );
}

// City – person looking at buildings with bokeh
function CityChar() {
  return (
    <svg width="100" height="110" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes bokehFloat { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:0.6;transform:scale(1.2)} }
      `}</style>
      {/* Buildings */}
      <rect x="5"  y="30" width="18" height="70" rx="2" fill="var(--accent)" opacity="0.15"/>
      <rect x="10" y="20" width="12" height="10" rx="1" fill="var(--accent)" opacity="0.12"/>
      <rect x="70" y="25" width="22" height="75" rx="2" fill="var(--accent)" opacity="0.15"/>
      <rect x="75" y="15" width="12" height="12" rx="1" fill="var(--accent)" opacity="0.12"/>
      <rect x="55" y="40" width="16" height="60" rx="2" fill="var(--accent)" opacity="0.12"/>
      {/* Bokeh dots */}
      {[{cx:20,cy:25,r:6,d:'0s'},{cx:75,cy:20,r:8,d:'1s'},{cx:50,cy:15,r:5,d:'0.5s'},{cx:85,cy:35,r:7,d:'1.5s'},{cx:15,cy:45,r:4,d:'2s'}].map((b,i)=>(
        <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill="var(--accent)" opacity="0.3" style={{animation:`bokehFloat 3s ease-in-out infinite`,animationDelay:b.d}}/>
      ))}
      {/* Person */}
      <circle cx="50" cy="70" r="9" fill="var(--accent)" opacity="0.9"/>
      <rect x="38" y="81" width="24" height="20" rx="6" fill="var(--accent)" opacity="0.85"/>
      <rect x="40" y="99" width="8" height="11" rx="4" fill="var(--accent)" opacity="0.75"/>
      <rect x="52" y="99" width="8" height="11" rx="4" fill="var(--accent)" opacity="0.75"/>
    </svg>
  );
}

// Adventure – rock climber
function AdventureChar() {
  return (
    <svg width="90" height="110" viewBox="0 0 90 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`@keyframes ropeSway { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(2deg)} }`}</style>
      {/* Cliff face */}
      <path d="M55,0 L90,0 L90,110 L55,110 L55,70 Q45,60 55,50Z" fill="var(--accent)" opacity="0.12"/>
      {/* Rope */}
      <line x1="50" y1="0" x2="45" y2="55" stroke="var(--accent)" strokeWidth="2" opacity="0.5" style={{animation:'ropeSway 3s ease-in-out infinite', transformOrigin:'50px 0px'}}/>
      {/* Climber */}
      <circle cx="45" cy="42" r="9" fill="var(--accent)" opacity="0.9"/>
      <rect x="33" y="53" width="24" height="20" rx="6" fill="var(--accent)" opacity="0.85"/>
      {/* Arms reaching up */}
      <rect x="18" y="40" width="16" height="7" rx="3.5" fill="var(--accent)" opacity="0.75" transform="rotate(-35 18 40)"/>
      <rect x="50" y="35" width="16" height="7" rx="3.5" fill="var(--accent)" opacity="0.75" transform="rotate(35 50 35)"/>
      {/* Legs */}
      <rect x="35" y="71" width="8" height="22" rx="4" fill="var(--accent)" opacity="0.75" transform="rotate(15 35 71)"/>
      <rect x="47" y="71" width="8" height="22" rx="4" fill="var(--accent)" opacity="0.75" transform="rotate(-10 47 71)"/>
      {/* Chalk bag / harness hint */}
      <rect x="50" y="60" width="10" height="8" rx="3" fill="var(--accent-hover)" opacity="0.6"/>
    </svg>
  );
}

const CHARS: Record<string, () => React.ReactElement> = {
  forest:    ForestChar,
  mountains: MountainsChar,
  beach:     BeachChar,
  desert:    DesertChar,
  city:      CityChar,
  adventure: AdventureChar,
};

/* ─── Main export ─────────────────────────────────────────────────────────── */
export function CategoryCharacter() {
  const { category } = useContext(TravelThemeContext);
  const key = normalizeCategoryKey(category);
  const Char = key ? CHARS[key] : DefaultChar;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        bottom: 24,
        right: 24,
        zIndex: 50,
        pointerEvents: "none",
        animation: "float 3s ease-in-out infinite",
        opacity: 0.85,
        filter: "drop-shadow(0 8px 24px var(--accent))",
      }}
    >
      <Char />
    </div>
  );
}
