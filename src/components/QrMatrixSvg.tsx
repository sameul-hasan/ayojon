"use client";

import React from "react";

export function QrMatrixSvg({
  tokenHash,
  size = 136,
}: {
  tokenHash: string;
  size?: number;
}) {
  const grid = 21;
  const cells: boolean[][] = Array.from({ length: grid }, () =>
    Array.from({ length: grid }, () => false)
  );

  // Draw standard QR finder patterns in 3 corners
  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, grid - 7);
  drawFinder(grid - 7, 0);

  // Fill data modules deterministically from SHA-256 tokenHash
  let bitIdx = 0;
  const cleanHex = (tokenHash || "aayojon2026bd").padEnd(64, "f");

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= grid - 8;
      const inBottomLeft = r >= grid - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      const hexChar = cleanHex[bitIdx % cleanHex.length];
      const val = parseInt(hexChar, 16) || 0;
      const bit = ((val >> (bitIdx % 4)) & 1) === 1;
      cells[r][c] = bit || (r + c) % 5 === 0;
      bitIdx++;
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${grid + 4} ${grid + 4}`}
      className="rounded-xl bg-white p-1.5 border border-slate-200 shadow-sm"
      role="img"
      aria-label="Ticket QR Code"
    >
      <rect width={grid + 4} height={grid + 4} fill="#ffffff" rx={1.5} />
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c + 2}
              y={r + 2}
              width={1}
              height={1}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
}

