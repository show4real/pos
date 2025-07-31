import React from "react";
import { Modal, Button, Row, Col, Form } from "@themesberg/react-bootstrap";
import Select from "react-select";

const MoveStockModal = ({
  show,
  onCancel,
  onConfirm,
  stock,
  selectedToBranch,
  branchOptions,
  handleToBranchSelect,
  moveQuantity,
  handleMoveQuantityChange,
  maxMoveQuantity,
  moving,
  formatCurrency
}) => {
  if (!stock) return null;

  return (
    <Modal show={show} onHide={onCancel} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="text-info">
          <i className="fa fa-exchange-alt me-2" />
          Move Stock to Another Branch
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Stock Information */}
        <div className="bg-light p-3 rounded mb-4">
          <h6 className="fw-semibold mb-3 text-muted">Stock Information</h6>
          <div className="d-flex align-items-center mb-3">
            {stock.product_image ? (
              <img
                src={stock.product_image}
                alt={stock.product_name}
                className="rounded me-3"
                style={{ width: "60px", height: "60px", objectFit: "cover" }}
              />
            ) : (
              <div
                className="bg-secondary rounded d-flex align-items-center justify-content-center text-white me-3"
                style={{ width: "60px", height: "60px" }}
              >
                <i className="fa fa-image" />
              </div>
            )}
            <div className="flex-grow-1">
              <div className="fw-semibold h5 mb-1">{stock.product_name}</div>
              <div className="text-muted small">
                Purchase ID: {stock.order.tracking_id}
              </div>
              <div className="text-muted small">
                Current Branch: <span className="fw-semibold">{stock.branch_name}</span>
              </div>
            </div>
          </div>

          <Row>
            <Col md={4}>
              <div className="text-center p-2 bg-white rounded">
                <div className="text-muted small">Available Stock</div>
                <div className="fw-bold text-success h4">{stock.in_stock}</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-2 bg-white rounded">
                <div className="text-muted small">Selling Price</div>
                <div className="fw-bold text-primary">
                  {formatCurrency(stock.order.unit_selling_price)}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-2 bg-white rounded">
                <div className="text-muted small">Total Value</div>
                <div className="fw-bold text-warning">
                  {formatCurrency(stock.in_stock * stock.order.unit_selling_price)}
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Move Configuration */}
        <Row>
          <Col md={8}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                <i className="fa fa-building me-2" />
                Select Destination Branch
              </Form.Label>
              <Select
                value={selectedToBranch}
                onChange={handleToBranchSelect}
                options={branchOptions}
                placeholder="Choose a branch to move stock to..."
                isClearable
                isSearchable
              />
              <Form.Text className="text-muted">
                Select the branch where you want to transfer the stock
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                <i className="fa fa-sort-numeric-up me-2" />
                Quantity to Move
              </Form.Label>
              <Form.Control
                type="number"
                min="1"
                max={maxMoveQuantity}
                value={moveQuantity}
                onChange={handleMoveQuantityChange}
                placeholder="Enter quantity"
              />
              <Form.Text className="text-muted">
                Max: {maxMoveQuantity} units
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        {/* Summary and Validation */}
        {selectedToBranch && moveQuantity > 0 && moveQuantity <= maxMoveQuantity && (
          <div className="alert alert-info">
            <h6 className="fw-semibold mb-2">
              <i className="fa fa-info-circle me-2" />
              Move Summary
            </h6>
            <div className="mb-2">
              <strong>Moving:</strong> {moveQuantity} units of {stock.product_name}
            </div>
            <div className="mb-2">
              <strong>From:</strong> {stock.branch_name}
            </div>
            <div className="mb-2">
              <strong>To:</strong> {selectedToBranch.label}
            </div>
            <div className="mb-2">
              <strong>Total Value:</strong> {formatCurrency(moveQuantity * stock.order.unit_selling_price)}
            </div>
            <div>
              <strong>Remaining in Current Branch:</strong> {stock.in_stock - moveQuantity} units
            </div>
          </div>
        )}

        {moveQuantity > maxMoveQuantity && (
          <div className="alert alert-danger">
            <i className="fa fa-exclamation-triangle me-2" />
            Cannot move more than {maxMoveQuantity} units (available stock).
          </div>
        )}

        {moveQuantity <= 0 && (
          <div className="alert alert-warning">
            <i className="fa fa-info-circle me-2" />
            Please enter a valid quantity to move.
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel} disabled={moving}>
          Cancel
        </Button>
        <Button
          variant="info"
          onClick={onConfirm}
          disabled={moving || !selectedToBranch || moveQuantity <= 0 || moveQuantity > maxMoveQuantity}
          className="d-flex align-items-center gap-2"
        >
          {moving ? (
            <>
              <span className="spinner-border spinner-border-sm" />
              Moving Stock...
            </>
          ) : (
            <>
              <i className="fa fa-exchange-alt" />
              Move Stock
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MoveStockModal;
