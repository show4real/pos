import React, { useState } from "react";

const StockMovementHistory = ({ stock }) => {
  const [showMovements, setShowMovements] = useState(false);

  const hasMovements =
    (stock.movements_from && stock.movements_from.length > 0) ||
    (stock.movements_to && stock.movements_to.length > 0);

  return (
    <div>
      {hasMovements && (
        <button
          onClick={() => setShowMovements((prev) => !prev)}
          className="btn btn-xs btn-outline-primary mb-2 mt-2"
        >
          {showMovements ? "Hide Movement History" : "Show Movement History"}
        </button>
      )}

      {showMovements && (
        <div>
          {stock.movements_from?.map((movement, index) => (
            <div className="fw-semibold text-muted" key={`out-${index}`}>
              Moved OUT: <b>{movement.quantity}</b> → To Branch{" "}
              {movement.to_branch?.name ?? "N/A"} at{" "}
              {new Date(movement.created_at).toLocaleString()}
            </div>
          ))}

          {stock.movements_to?.map((movement, index) => (
            <div className="fw-semibold text-muted" key={`in-${index}`}>
              Moved IN: <b>{movement.quantity}</b> ← From Branch{" "}
              {movement.from_branch?.name ?? "N/A"} at{" "}
              {new Date(movement.created_at).toLocaleString()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockMovementHistory;
