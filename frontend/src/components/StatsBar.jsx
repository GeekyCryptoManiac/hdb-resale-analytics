import React from "react";
import { Card } from "react-bootstrap";

function StatsBar({ results }) {
  if (!results || results.length === 0) return null;

  // Filter out entries with invalid price or price_per_sqm
  const validPrices = results.map(r => Number(r.price)).filter(p => !isNaN(p));
  const validPsm = results.map(r => Number(r.price_per_sqm)).filter(p => !isNaN(p));

  const avgPrice =
    validPrices.length > 0
      ? validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length
      : 0;

  const avgPsm =
    validPsm.length > 0
      ? validPsm.reduce((sum, p) => sum + p, 0) / validPsm.length
      : 0;

  return (
    <Card className="mb-3">
      <Card.Body className="d-flex justify-content-between">
        <div><strong>Total Results:</strong> {results.length}</div>
        <div><strong>Average Price:</strong> ${avgPrice.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
        <div><strong>Average $/sqm:</strong> ${avgPsm.toFixed(2)}</div>
      </Card.Body>
    </Card>
  );
}

export default StatsBar;
