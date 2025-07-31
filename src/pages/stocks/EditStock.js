import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Row, Col } from "@themesberg/react-bootstrap";
import { Select } from "antd";
import { toast } from "react-toastify";
import CreateProductModal from "./CreateProductModal";
import { editStock } from "../../services/stockService";

const EditStock = ({
  onClose,
  stock:initialStock,
  show,
  products = [],
  currentBranch,
  onProductsUpdate,
}) => {
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [creatingStock, setCreatingStock] = useState(false);
  const [stockData, setStockData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    if (initialStock) {
      setStockData(initialStock);
      setFormErrors({});
    }
  }, [initialStock]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStockData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (name, value) => {
    setStockData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleProductSelect = (value) => {
    handleSelectChange("product_id", value);
  };

  const handleCreateProduct = () => {
    setShowCreateProductModal(true);
  };

  const handleProductCreated = async (newProduct) => {
    setCreatingProduct(true);
    try {
      if (onProductsUpdate) {
        await onProductsUpdate();
      }
      handleSelectChange("product_id", newProduct.id);
      toast.success("Product created successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update products list");
    } finally {
      setCreatingProduct(false);
      setShowCreateProductModal(false);
    }
  };

  const handleCancelCreateProduct = () => {
    setShowCreateProductModal(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!stockData.product_id) errors.product_id = "Please select a product";
    if (!stockData.stock_quantity || parseInt(stockData.stock_quantity) < 1)
      errors.stock_quantity = "Stock quantity must be at least 1";
    if (!stockData.unit_price || parseFloat(stockData.unit_price) <= 0)
      errors.unit_price = "Unit price must be greater than 0";
    if (!stockData.unit_selling_price || parseFloat(stockData.unit_selling_price) <= 0)
      errors.unit_selling_price = "Selling price must be greater than 0";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditStock = async () => {
    if (!validateForm()) return;

    setCreatingStock(true);
    try {
      const stockPayload = {
        id: stockData.id,
        product_id: stockData.product_id,
        branch_id: currentBranch?.id,
        barcode: stockData.barcode || null,
        stock_quantity: parseInt(stockData.stock_quantity),
        unit_price: parseFloat(stockData.unit_price),
        unit_selling_price: parseFloat(stockData.unit_selling_price),
      };

      await editStock(stockPayload);
      toast.success("Stock updated successfully!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to update stock");
    } finally {
      setCreatingStock(false);
    }
  };

  const handleCancel = () => {
    setFormErrors({});
    onClose();
  };

  return (
    <>
      <Modal show={show} onHide={handleCancel} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="text-primary">
            <i className="fa fa-edit me-2" />
            Edit Stock
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col md="12">
                <Form.Group>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="fw-bold mb-0">
                      Product <span className="text-danger">*</span>
                    </Form.Label>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={handleCreateProduct}
                      className="d-flex align-items-center gap-2"
                    >
                      <i className="fa fa-plus" />
                      Create Product
                    </Button>
                  </div>
                  <Select
                    showSearch
                    placeholder="Search and select a product"
                    value={stockData.product_id || undefined}
                    onChange={handleProductSelect}
                    style={{ width: "100%" }}
                    filterOption={(input, option) =>
                      option?.children?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {products.map((product) => (
                      <Select.Option key={product.id} value={product.id}>
                        {product.name}
                      </Select.Option>
                    ))}
                  </Select>
                  {formErrors.product_id && (
                    <div className="text-danger mt-1 small">{formErrors.product_id}</div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mt-2">
              <Col md="6">
                <Form.Group>
                  <Form.Label className="fw-bold">Barcode</Form.Label>
                  <Form.Control
                    ref={barcodeInputRef}
                    type="text"
                    name="barcode"
                    value={stockData.barcode || ""}
                    onChange={handleInputChange}
                    placeholder="Scan or enter barcode"
                    isInvalid={!!formErrors.barcode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.barcode}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md="6">
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Stock Quantity <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="stock_quantity"
                    value={stockData.stock_quantity || ""}
                    onChange={handleInputChange}
                    placeholder="Enter quantity"
                    min="1"
                    isInvalid={!!formErrors.stock_quantity}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.stock_quantity}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mt-2">
              <Col md="6">
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Unit Price <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="unit_price"
                    value={stockData.unit_price || ""}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    isInvalid={!!formErrors.unit_price}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.unit_price}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md="6">
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Selling Price <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="unit_selling_price"
                    value={stockData.unit_selling_price || ""}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    isInvalid={!!formErrors.unit_selling_price}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.unit_selling_price}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {currentBranch && (
              <div className="alert alert-light mt-3">
                <i className="fa fa-building me-2" />
                <strong>Target Branch:</strong> {currentBranch.name}
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancel} disabled={creatingStock}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEditStock}
            disabled={
              
              !stockData.product_id ||
              !stockData.stock_quantity ||
              !stockData.unit_price ||
              !stockData.unit_selling_price
            }
            className="d-flex align-items-center gap-2"
          >
            {creatingStock ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                Updating Stock...
              </>
            ) : (
              <>
                <i className="fa fa-save" />
                Update Stock
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Product Modal */}
      <CreateProductModal
        show={showCreateProductModal}
        onCancel={handleCancelCreateProduct}
        onConfirm={handleProductCreated}
        creating={creatingProduct}
      />
    </>
  );
};

export default EditStock;
