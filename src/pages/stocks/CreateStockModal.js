import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "@themesberg/react-bootstrap";
import { Select } from "antd";
import { getcategories } from "../../services/categoryService";
import { addProduct } from "../../services/productService";
import { toast } from "react-toastify";
import CreateProductModal from "./CreateProductModal";
import { createStock } from "../../services/stockService";

const CreateStockModal = ({
  show,
  onCancel,
  onConfirm,
  creating,
  products,
  currentBranch,
  formData,
  formErrors,
  handleFormChange,
  handleSelectChange,
  barcodeInputRef,
  onProductsUpdate, // New prop to update products list
  onStockCreated // New prop to reload parent state
}) => {
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [creatingStock, setCreatingStock] = useState(false);

  // Fixed form change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    handleFormChange(name, value);
  };

  // Fixed select change handler
  const handleProductSelect = (value) => {
    handleSelectChange("product_id", value);
  };

  const handleCreateProduct = () => {
    setShowCreateProductModal(true);
  };

  const handleProductCreated = async (newProduct) => {
    setCreatingProduct(true);
    try {
      // Update the products list in parent component
      if (onProductsUpdate) {
        await onProductsUpdate();
      }
      
      // Auto-select the newly created product
      handleSelectChange("product_id", newProduct.id);
      
      toast.success("Product created successfully!");
    } catch (error) {
      console.error("Error updating products:", error);
    } finally {
      setCreatingProduct(false);
      setShowCreateProductModal(false);
    }
  };

  const handleCancelCreateProduct = () => {
    setShowCreateProductModal(false);
  };

  // Handle stock creation
  const handleCreateStock = async () => {
    setCreatingStock(true);
    try {
      // Prepare stock data
      const stockData = {
        product_id: formData.product_id,
        branch_id: currentBranch?.id,
        barcode: formData.barcode || null,
        stock_quantity: parseInt(formData.stock_quantity),
        unit_price: parseFloat(formData.unit_price),
        unit_selling_price: parseFloat(formData.unit_selling_price),
        expiry_date: formData.expiry_date || null
      };

      // Call the createStock service
      const result = await createStock(stockData);
      
      toast.success("Stock created successfully!");
      
      // Reload parent state if callback provided
      if (onStockCreated) {
        await onStockCreated();
      }
      
      // Call the parent's onConfirm callback with the result
      if (onConfirm) {
        onConfirm(result);
      }

      // Close the modal
      onCancel();
      
    } catch (error) {
      console.error("Error creating stock:", error);
      toast.error(error.message || "Failed to create stock");
    } finally {
      setCreatingStock(false);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onCancel} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="text-primary">
            <i className="fa fa-plus me-2" />
            Create New Stock
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
                    value={formData.product_id || undefined}
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
                    value={formData.barcode || ''}
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
                    value={formData.stock_quantity || ''}
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
                    value={formData.unit_price || ''}
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
                    value={formData.unit_selling_price || ''}
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

            <Row className="g-3 mt-2">
              <Col md="12">
                <Form.Group>
                  <Form.Label className="fw-bold">Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date || ''}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.expiry_date}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.expiry_date}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Leave empty if product doesn't expire
                  </Form.Text>
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
          <Button variant="secondary" onClick={onCancel} disabled={creatingStock}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateStock}
            disabled={
              creatingStock ||
              !formData.product_id ||
              !formData.stock_quantity ||
              !formData.unit_price ||
              !formData.unit_selling_price
            }
            className="d-flex align-items-center gap-2"
          >
            {creatingStock ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                Creating Stock...
              </>
            ) : (
              <>
                <i className="fa fa-plus" />
                Create Stock
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

export default CreateStockModal;