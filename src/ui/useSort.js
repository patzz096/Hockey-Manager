import { useState } from "react";

export function useSort(initialKey, initialDir = "desc") {
  const [sortKey, setSortKey] = useState(initialKey);
  const [sortDir, setSortDir] = useState(initialDir);
  function toggle(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }
  return [sortKey, sortDir, toggle];
}

export function sortRows(rows, key, dir, accessor) {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = accessor(a, key), bv = accessor(b, key);
    if (typeof av === "string") return sign * av.localeCompare(bv);
    return sign * ((av ?? 0) - (bv ?? 0));
  });
}
