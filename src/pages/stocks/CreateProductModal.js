import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "@themesberg/react-bootstrap";
import { Select } from "antd";
import { getcategories } from "../../services/categoryService";
import { addProduct } from "../../services/productService";
import { toast } from "react-toastify";
 const CreateProductModal = ({
  show,
  onCancel,
  onConfirm,
  creating
}) => {
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: null,
    description: ''
  });
  const [productErrors, setProductErrors] = useState({});

  useEffect(() => {
    if (show) {
      fetchCategories();
    }
  }, [show]);

  const fetchCategories = async () => {
    try {
      const res = await getcategories();
      setCategories(res.categories.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (productErrors[name]) {
      setProductErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCategorySelect = (value) => {
    setProductForm(prev => ({
      ...prev,
      category_id: value
    }));
    if (productErrors.category_id) {
      setProductErrors(prev => ({ ...prev, category_id: '' }));
    }
  };

  const validateProductForm = () => {
    const errors = {};
    if (!productForm.name.trim()) errors.name = "Product name is required";
    if (!productForm.category_id) errors.category_id = "Category is required";
    
    setProductErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateProductForm()) return;

    try {
      const newProduct = await addProduct(productForm);
      onConfirm(newProduct); // Pass the new product back to parent
      handleCancel(); // Reset form
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    }
  };

  const handleCancel = () => {
    setProductForm({
      name: '',
      category_id: null,
      description: ''
    });
    setProductErrors({});
    onCancel();
  };

  return (
    <Modal show={show} onHide={handleCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title className="text-success">
          <i className="fa fa-plus me-2" />
          Create New Product
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row className="g-3">
            <Col md="12">
              <Form.Group>
                <Form.Label className="fw-bold">
                  Product Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductFormChange}
                  placeholder="Enter product name"
                  isInvalid={!!productErrors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {productErrors.name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md="12">
              <Form.Group>
                <Form.Label className="fw-bold">
                  Category <span className="text-danger">*</span>
                </Form.Label>
                <Select
                  showSearch
                  placeholder="Select a category"
                  value={productForm.category_id || undefined}
                  onChange={handleCategorySelect}
                  style={{ width: "100%" }}
                  filterOption={(input, option) =>
                    option?.children?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {categories.map((category) => (
                    <Select.Option key={category.id} value={category.id}>
                      {category.name}
                    </Select.Option>
                  ))}
                </Select>
                {productErrors.category_id && (
                  <div className="text-danger mt-1 small">{productErrors.category_id}</div>
                )}
              </Form.Group>
            </Col>

            
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel} disabled={creating}>
          Cancel
        </Button>
        <Button
          variant="success"
          onClick={handleSubmit}
          disabled={creating || !productForm.name.trim() || !productForm.category_id}
          className="d-flex align-items-center gap-2"
        >
          {creating ? (
            <>
              <span className="spinner-border spinner-border-sm" />
              Creating Product...
            </>
          ) : (
            <>
              <i className="fa fa-plus" />
              Create Product
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
export default CreateProductModal;