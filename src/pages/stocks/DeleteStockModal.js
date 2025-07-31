import React from "react";
import { Modal, Button } from "@themesberg/react-bootstrap";

const DeleteStockModal = ({ show, onCancel, onConfirm, deleting, stock }) => {
  if (!stock) return null;

  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">
          <i className="fa fa-exclamation-triangle me-2" />
          Confirm Delete
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">Are you sure you want to delete this stock entry?</p>
        <div className="bg-light p-3 rounded mb-3">
          <div className="d-flex align-items-center mb-2">
            {stock.product_image ? (
              <img
                src={stock.product_image}
                alt={stock.product_name}
                className="rounded me-3"
                style={{ width: "40px", height: "40px", objectFit: "cover" }}
              />
            ) : (
              <div
                className="bg-secondary rounded d-flex align-items-center justify-content-center text-white me-3"
                style={{ width: "40px", height: "40px" }}
              >
                <i className="fa fa-image" />
              </div>
            )}
            <div>
              <div className="fw-semibold">{stock.product_name}</div>
              <small className="text-muted">
                Purchase ID: {stock.order.tracking_id}
              </small>
            </div>
          </div>
          <div className="small text-muted">
            <div>Branch: {stock.branch_name}</div>
            <div>Initial Stock: {stock.stock_quantity}</div>
            <div>Quantity Sold: {stock.quantity_sold}</div>
          </div>
        </div>
        <div className="alert alert-warning">
          <i className="fa fa-info-circle me-2" />
          <strong>Warning:</strong> This action cannot be undone. The stock entry will be permanently removed.
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={deleting}
          className="d-flex align-items-center gap-2"
        >
          {deleting ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              Deleting...
            </>
          ) : (
            <>
              <i className="fa fa-trash" />
              Delete Stock
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteStockModal;
