import React, { useState, useEffect, useCallback } from "react";
import { Input } from "reactstrap";
import { getAllBranches, getProducts, getBranches } from "../../services/branchService";
import { createStock } from "../../services/stockService";
import { toast } from "react-toastify";
import { Pagination, Select } from "antd";
import { 
  PlusOutlined, 
  SearchOutlined, 
  EyeOutlined, 
  StopOutlined,
  LoadingOutlined
} from "@ant-design/icons";
import {
  Col,
  Row,
  Card,
  Table,
  Button,
  ButtonGroup,
  Breadcrumb,
  Form,
  Modal,
} from "@themesberg/react-bootstrap";

import SpinDiv from "../components/SpinDiv";

const BranchIndex = ({ history }) => {
  // State management
  const [state, setState] = useState({
    search: "",
    page: 1,
    rows: 10,
    loading: false,
    branches: [],
    total: 0,
    showCreateModal: false,
  });

  const [formData, setFormData] = useState({
    product_id: "",
    branch_id: "",
    barcode: "",
    unit_price: "",
    stock_quantity: "",
    unit_selling_price: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [existingBarcodes, setExistingBarcodes] = useState([]);

  // Destructure state for cleaner code
  const { search, page, rows, loading, branches, total, showCreateModal } = state;

  // Show toast notification
  const showToast = useCallback((msg, type = "success") => {
    const color = type === "success" ? "green" : "red";
    toast(<div style={{ padding: 20, color }}>{msg}</div>);
  }, []);

  // Fetch products and branches for form dropdowns
  const fetchFormOptions = useCallback(async () => {
    setLoadingOptions(true);
    
    try {
      const [productsResponse, branchesResponse] = await Promise.all([
        getProducts(),
        getAllBranches()
      ]);
      
      setProducts(productsResponse.products || []);
      setAllBranches(branchesResponse.branches || []);
      
      // Extract existing barcodes to prevent duplicates
      const barcodes = [];
      if (productsResponse.products) {
        productsResponse.products.forEach(product => {
          if (product.stocks) {
            product.stocks.forEach(stock => {
              if (stock.barcode) barcodes.push(stock.barcode);
            });
          }
        });
      }
      setExistingBarcodes(barcodes);
      
    } catch (error) {
      showToast("Failed to fetch form options", "error");
    } finally {
      setLoadingOptions(false);
    }
  }, [showToast]);

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch products and branches for form when modal opens
  useEffect(() => {
    if (showCreateModal) {
      fetchFormOptions();
    }
  }, [showCreateModal, fetchFormOptions]);

  // Fetch branches from API
  const fetchBranches = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await getBranches({ page, rows, search });
      setState(prev => ({
        ...prev,
        loading: false,
        branches: response.branches.data,
        total: response.branches.total,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      showToast("Failed to fetch branches", "error");
    }
  }, [page, rows, search, showToast]);

  // Handle state changes
  const handleStateChange = useCallback((value, key) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle pagination
  const handlePageChange = useCallback(async (newPage, newRows) => {
    setState(prev => ({ ...prev, page: newPage, rows: newRows }));
    // Trigger fetch with new pagination values
    setTimeout(fetchBranches, 0);
  }, [fetchBranches]);

  // Handle search
  const handleSearch = useCallback(() => {
    setState(prev => ({ ...prev, page: 1 })); // Reset to first page
    fetchBranches();
  }, [fetchBranches]);

  // Handle search input key press
  const handleSearchKeyPress = useCallback((e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // Handle form input changes
  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  }, [formErrors]);

  // Validate form
  const validateForm = useCallback(() => {
    const errors = {};
    const requiredFields = ["product_id", "branch_id", "unit_price", "stock_quantity", "unit_selling_price"];
    
    requiredFields.forEach(field => {
      if (!formData[field]?.toString().trim()) {
        const fieldName = field.replace(/_id$/, '').replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        errors[field] = `${fieldName} is required`;
      }
    });

    // Check for barcode duplication
    if (formData.barcode && existingBarcodes.includes(formData.barcode)) {
      errors.barcode = "This barcode already exists";
    }

    // Additional validation for numeric fields
    const numericFields = ["unit_price", "stock_quantity", "unit_selling_price"];
    numericFields.forEach(field => {
      if (formData[field] && isNaN(Number(formData[field]))) {
        errors[field] = `${field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} must be a number`;
      }
      if (formData[field] && Number(formData[field]) < 0) {
        errors[field] = `${field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} must be positive`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, existingBarcodes]);

  // Handle form submission
  const handleCreateStock = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      await createStock(formData);
      
      showToast("Stock created successfully!");
      setState(prev => ({ ...prev, showCreateModal: false, loading: false }));
      setFormData({
        product_id: "",
        branch_id: "",
        barcode: "",
        unit_price: "",
        stock_quantity: "",
        unit_selling_price: "",
      });
      setFormErrors({});
      fetchBranches(); // Refresh the list
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      showToast(error.response?.data?.message || "Failed to create stock", "error");
    }
  }, [formData, validateForm, showToast, fetchBranches]);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setState(prev => ({ ...prev, showCreateModal: false }));
    setFormData({
      product_id: "",
      branch_id: "",
      barcode: "",
      unit_price: "",
      stock_quantity: "",
      unit_selling_price: "",
    });
    setFormErrors({});
    setProducts([]);
    setAllBranches([]);
    setExistingBarcodes([]);
  }, []);

  // Handle dropdown changes for Select components
  const handleSelectChange = useCallback((value, name) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  }, [formErrors]);

  // Navigate to stocks page
  const navigateToStocks = useCallback((branchId) => {
    history.push(`/stocks/${branchId}`);
  }, [history]);

  return (
    <>
      {loading && <SpinDiv text="Loading..." />}
      
      {/* Header Section */}
      <Row>
        <Col lg="12">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
            <div className="d-block mb-4 mb-md-0">
              <Breadcrumb
                listProps={{
                  className: "breadcrumb-text-dark text-primary",
                }}
              >
                <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                <Breadcrumb.Item href="#products">Stock Branches</Breadcrumb.Item>
              </Breadcrumb>
            </div>
            <div className="btn-toolbar mb-2 mb-md-0">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStateChange(true, "showCreateModal")}
              >
                <PlusOutlined className="me-2" />
                Create Stock
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Search and Title Section */}
      <Row className="mb-3">
        <Col lg="7">
          <h6>Branches ({total})</h6>
        </Col>
        <Col lg="5">
          <div className="d-flex">
            <Input
              placeholder="Search branches..."
              style={{ maxHeight: 45, marginRight: 5 }}
              value={search}
              onChange={(e) => handleStateChange(e.target.value, "search")}
              onKeyUp={handleSearchKeyPress}
              autoFocus
            />
            <Button
              color="secondary"
              style={{ maxHeight: 45 }}
              size="sm"
              onClick={handleSearch}
            >
              <SearchOutlined />
            </Button>
          </div>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card border="light" className="shadow-sm mb-4">
        <Card.Body className="pb-0">
          <Table responsive className="table-centered table-nowrap rounded mb-0">
            <thead className="thead-light">
              <tr>
                <th className="border-0">Branch</th>
                <th className="border-0">No of Stocks</th>
                <th className="border-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch, index) => (
                <tr key={branch.id || index}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div>
                        <h6 className="mb-0">{branch.name}</h6>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-secondary">{branch.stocks_count}</span>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigateToStocks(branch.id)}
                    >
                      <EyeOutlined className="me-1" />
                      View Stocks
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* No Data Message */}
          {branches.length === 0 && !loading && (
            <div className="text-center py-4">
              <StopOutlined className="text-muted me-2" />
              <span className="text-muted">No branches found</span>
            </div>
          )}

          {/* Pagination */}
          {branches.length > 0 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination
                showSizeChanger
                total={total}
                showTotal={(total) => `Total ${total} branches`}
                onChange={handlePageChange}
                pageSize={rows}
                current={page}
                showQuickJumper
              />
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create Stock Modal */}
      <Modal
        show={showCreateModal}
        onHide={handleCloseModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <PlusOutlined className="me-2" />
            Create New Stock
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateStock}>
          <Modal.Body className="p-3">
            {loadingOptions && (
              <div className="text-center mb-3 p-2 bg-light rounded">
                <LoadingOutlined className="me-2 text-primary" />
                <span className="text-muted">Loading options...</span>
              </div>
            )}
            
            <Row className="g-3">
              <Col md="6">
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Product <span className="text-danger">*</span>
                  </Form.Label>
                  <Select
                    showSearch
                    placeholder="Search and select a product"
                    value={formData.product_id || undefined}
                    onChange={(value) => handleSelectChange(value, "product_id")}
                    disabled={loadingOptions}
                    style={{ width: '100%' }}
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
                    <div className="text-danger mt-1 small">
                      {formErrors.product_id}
                    </div>
                  )}
                </Form.Group>
              </Col>
              
              <Col md="6">
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Branch <span className="text-danger">*</span>
                  </Form.Label>
                  <Select
                    showSearch
                    placeholder="Search and select a branch"
                    value={formData.branch_id || undefined}
                    onChange={(value) => handleSelectChange(value, "branch_id")}
                    disabled={loadingOptions}
                    style={{ width: '100%' }}
                    filterOption={(input, option) =>
                      option?.children?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {allBranches.map((branch) => (
                      <Select.Option key={branch.id} value={branch.id}>
                        {branch.name}
                      </Select.Option>
                    ))}
                  </Select>
                  {formErrors.branch_id && (
                    <div className="text-danger mt-1 small">
                      {formErrors.branch_id}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mt-2">
              <Col md="6">
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Barcode
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleFormChange}
                    placeholder="Scan or enter barcode"
                    //isInvalid={!!formErrors.barcode}
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
                    value={formData.stock_quantity}
                    onChange={handleFormChange}
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
                    value={formData.unit_price}
                    onChange={handleFormChange}
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
                    value={formData.unit_selling_price}
                    onChange={handleFormChange}
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
          </Modal.Body>
          
          <Modal.Footer className="p-3">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading || loadingOptions}
            >
              {loading ? (
                <>
                  <LoadingOutlined className="me-2" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusOutlined className="me-2" />
                  Create Stock
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default BranchIndex;