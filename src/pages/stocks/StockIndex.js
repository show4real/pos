import React, { Component } from "react";
import { Input, Media } from "reactstrap";
import { getStock, deleteStock, moveStock, createStock } from "../../services/stockService";
import { getAllBranches, getProducts } from "../../services/branchService";
import CreateStockModal from "./CreateStockModal";
import DeleteStockModal from "./DeleteStockModal";
import MoveStockModal from "./MoveStockModal";

import { toast } from "react-toastify";
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
import Select from 'react-select';
import dayjs from 'dayjs';

import { Pagination } from "antd";
import EditBarcode from "../purchase/EditBarcode";
import EditStock from "./EditStock";
import StockMovementHistory from "./StockMovementHistory";

export class StockIndex extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      page: 1,
      rows: 10,
      loading: false,
      stocks: [],
      products: [],
      total_cost: [],
      order: "",
      value: "",
      total: 0,
      total_cart: 0,
      branch_id: props.match.params.id,
      // Add stock summary metrics
      totalStockQuantity: 0,
      totalQuantitySold: 0,
      totalInStock: 0,
      // Add date filters
      start_date: "",
      end_date: "",
      // For searchable dropdown
      selectedProduct: null,
      productOptions: [],
      // For delete confirmation modal
      showDeleteModal: false,
      stockToDelete: null,
      deleting: false,
      editBarcode: null,
      // For move stock modal
      showMoveModal: false,
      stockToMove: null,
      moving: false,
      branches: [],
      selectedToBranch: null,
      moveQuantity: 0,
      maxMoveQuantity: 0,
      branchOptions: [],
      // For branch info
      currentBranch: null,
      // For create stock modal
      showCreateModal: false,
      showEditModal:false,
      creating: false,
      allProducts: [],
      allSuppliers: [],
      createForm: {
        product_id: null,
        supplier_id: null,
        stock_quantity: '',
        unit_price: '',
        unit_selling_price: '',
        expiry_date: '',
        batch_number: '',
        barcode: '',
        notes: ''
      },
      createProductOptions: [],
      createSupplierOptions: [],
      selectedCreateProduct: null,
      selectedCreateSupplier: null,
      // Add missing state
      showFilter: false,
      addToCart: false,
      // Form data and errors for CreateStockModal
      formData: {
        product_id: null,
        supplier_id: null,
        stock_quantity: '',
        unit_price: '',
        unit_selling_price: '',
        expiry_date: '',
        batch_number: '',
        barcode: '',
        notes: ''
      },
      formErrors: {}
    };

    // Create refs
    this.barcodeInputRef = React.createRef();
  }

  componentDidMount() {
    this.getStocks();
    this.getBranches();
    this.getAllProducts();
  }

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "success" }}>{msg}</div>);
  };

  showErrorToast = (msg) => {
    toast.error(<div style={{ padding: 20 }}>{msg}</div>);
  };

  getBranches = () => {
    getAllBranches().then(
      (res) => {
        const branches = res.branches || [];
        const currentBranch = branches.find(branch => branch.id === parseInt(this.state.branch_id));

        this.setState({
          branches: branches,
          currentBranch: currentBranch,
        });
      },
      (error) => {
        console.error("Error fetching branches:", error);
      }
    );
  };

  getAllProducts = () => {
    getProducts().then(
      (res) => {
        const products = res.products || [];
        const createProductOptions = products.map(product => ({
          value: product.id,
          label: product.name,
        }));

        this.setState({
          allProducts: products,
          createProductOptions: createProductOptions,
        });
      },
      (error) => {
        console.error("Error fetching products:", error);
      }
    );
  };

  getStocks = () => {
    const { page, rows, order, search, branch_id, start_date, end_date } = this.state;
    console.log(order);
    this.setState({ loading: true });

    getStock({
      page,
      rows,
      order,
      branch_id,
      search,
      start_date,
      end_date
    }).then(
      (res) => {
        console.log(res);

        // Update product options for searchable dropdown
        const productOptions = res.products.data.map(product => ({
          value: product.id,
          label: product.name,
        }));

        this.setState({
          loading: false,
          stocks: res.stocks.data,
          products: res.products.data,
          productOptions: productOptions,
          total_cost: 0,
          total: res.stocks.total,
          initialPurchaseOrders: { ...res.stocks.data },
          // Use stock summary metrics from response root level
          totalStockQuantity: res.stock_quantity || 0,
          totalQuantitySold: res.quantity_sold || 0,
          totalInStock: res.instock || 0,
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  // Create stock functionality
  handleCreateStock = () => {
    const initialFormData = {
      product_id: null,
      supplier_id: null,
      stock_quantity: '',
      unit_price: '',
      unit_selling_price: '',
      expiry_date: '',
      batch_number: '',
      barcode: '',
      notes: ''
    };

    this.setState({
      showCreateModal: true,
      createForm: initialFormData,
      formData: initialFormData,
      selectedCreateProduct: null,
      selectedCreateSupplier: null,
      formErrors: {}
    });
  };

  handleCreateFormChange = (field, value) => {
    this.setState({
      createForm: {
        ...this.state.createForm,
        [field]: value
      },
      formData: {
        ...this.state.formData,
        [field]: value
      }
    });
  };

  handleCreateProductSelect = (selectedOption) => {
    this.setState({
      selectedCreateProduct: selectedOption,
      createForm: {
        ...this.state.createForm,
        product_id: selectedOption ? selectedOption.value : null
      },
      formData: {
        ...this.state.formData,
        product_id: selectedOption ? selectedOption.value : null
      }
    });
  };

  // Form handlers for CreateStockModal props
  handleFormChange = (field, value) => {
    this.setState({
      formData: {
        ...this.state.formData,
        [field]: value
      },
      createForm: {
        ...this.state.createForm,
        [field]: value
      }
    });
  };

  handleSelectChange = (field, value) => {
    this.setState({
      formData: {
        ...this.state.formData,
        [field]: value
      },
      createForm: {
        ...this.state.createForm,
        [field]: value
      }
    });
  };

  // Handle products update after creating new product
  handleProductsUpdate = async () => {
    try {
      const res = await getProducts();
      const products = res.products || [];
      const createProductOptions = products.map(product => ({
        value: product.id,
        label: product.name,
      }));

      this.setState({
        allProducts: products,
        createProductOptions: createProductOptions,
        products: products, // Update the products used in the modal
      });
    } catch (error) {
      console.error("Error updating products:", error);
    }
  };

  validateCreateForm = () => {
    const { createForm } = this.state;
    const errors = {};

    if (!createForm.product_id) errors.product_id = "Product is required";
    if (!createForm.supplier_id) errors.supplier_id = "Supplier is required";
    if (!createForm.stock_quantity || parseFloat(createForm.stock_quantity) <= 0) {
      errors.stock_quantity = "Stock quantity must be greater than 0";
    }
    if (!createForm.unit_price || parseFloat(createForm.unit_price) <= 0) {
      errors.unit_price = "Unit price must be greater than 0";
    }
    if (!createForm.unit_selling_price || parseFloat(createForm.unit_selling_price) <= 0) {
      errors.unit_selling_price = "Unit selling price must be greater than 0";
    }

    this.setState({ formErrors: errors });
    return Object.keys(errors).length === 0;
  };

  confirmCreateStock = async () => {
    
    this.setState({
      showCreateModal: false,
      selectedCreateProduct: null,
      selectedCreateSupplier: null,
      formErrors: {}
    });
    this.getStocks();
  };

  cancelCreateStock = () => {
    const initialFormData = {
      product_id: null,
      supplier_id: null,
      stock_quantity: '',
      unit_price: '',
      unit_selling_price: '',
      expiry_date: '',
      batch_number: '',
      barcode: '',
      notes: ''
    };

    this.setState({
      showCreateModal: false,
      createForm: initialFormData,
      formData: initialFormData,
      selectedCreateProduct: null,
      selectedCreateSupplier: null,
      formErrors: {}
    });
  };

   cancelEditStock = () => {
    this.setState({
      showEditModal: false,
      
    });
    this.getStocks();
  };

  // Delete stock functionality
  handleDeleteStock = (stock) => {
    this.setState({
      showDeleteModal: true,
      stockToDelete: stock,
    });
  };

  confirmDeleteStock = async () => {
    const { stockToDelete } = this.state;

    this.setState({ deleting: true });

    try {
      const res = await deleteStock(stockToDelete.id);

      this.setState({
        deleting: false,
        showDeleteModal: false,
        stockToDelete: null,
      }, () => {
        this.getStocks();
      });

      this.showToast("Stock deleted successfully!");

    } catch (error) {
      console.error("Error deleting stock:", error);
      this.showErrorToast("Stock cannot be deleted");
      this.setState({ deleting: false });
    }
  };

  cancelDeleteStock = () => {
    this.setState({
      showDeleteModal: false,
      stockToDelete: null,
    });
  };

  // Move stock functionality
  handleMoveStock = (stock) => {
    const maxMoveQuantity = stock.in_stock;
    const branchOptions = this.state.branches
      .filter(branch => branch.id !== parseInt(this.state.branch_id))
      .map(branch => ({
        value: branch.id,
        label: branch.name,
      }));

    this.setState({
      showMoveModal: true,
      stockToMove: stock,
      maxMoveQuantity: maxMoveQuantity,
      moveQuantity: maxMoveQuantity > 0 ? 1 : 0,
      selectedToBranch: null,
      branchOptions: branchOptions,
    });
  };

  handleMoveQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    const { maxMoveQuantity } = this.state;

    if (value <= maxMoveQuantity && value >= 0) {
      this.setState({ moveQuantity: value });
    }
  };

  handleToBranchSelect = (selectedOption) => {
    this.setState({ selectedToBranch: selectedOption });
  };

  confirmMoveStock = async () => {
    const { stockToMove, selectedToBranch, moveQuantity } = this.state;

    if (!selectedToBranch) {
      this.showErrorToast("Please select a destination branch");
      return;
    }

    if (moveQuantity <= 0) {
      this.showErrorToast("Please enter a valid quantity to move");
      return;
    }

    if (moveQuantity > stockToMove.in_stock) {
      this.showErrorToast("Cannot move more than available stock");
      return;
    }

    this.setState({ moving: true });

    try {
      const res = await moveStock({
        stock_id: stockToMove.id,
        from_branch_id: this.state.branch_id,
        to_branch_id: selectedToBranch.value,
        quantity: moveQuantity,
        product_id: stockToMove.order.product_id,
        order_id: stockToMove.order.id,
      });

      this.setState({
        moving: false,
        showMoveModal: false,
        stockToMove: null,
        selectedToBranch: null,
        moveQuantity: 0,
      }, () => {
        this.getStocks();
      });

      this.showToast(`Successfully moved ${moveQuantity} units to ${selectedToBranch.label}`);

    } catch (error) {
      console.error("Error moving stock:", error);
      this.showErrorToast("Failed to move stock. Please try again.");
      this.setState({ moving: false });
    }
  };

  cancelMoveStock = () => {
    this.setState({
      showMoveModal: false,
      stockToMove: null,
      selectedToBranch: null,
      moveQuantity: 0,
    });
  };

  sleep = (ms) =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });

  loadOptions = async (search, prevOptions) => {
    let options = [];
    options = this.state.products.map((product, key) => {
      return {
        value: product.id,
        label: product.name,
      };
    });
    await this.sleep(1000);

    let filteredOptions;
    if (!search) {
      filteredOptions = options;
    } else {
      const searchLower = search.toLowerCase();

      filteredOptions = options.filter(({ label }) =>
        label.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = filteredOptions.length > prevOptions.length + 10;
    const slicedOptions = filteredOptions.slice(
      prevOptions.length,
      prevOptions.length + 10
    );

    return {
      options: slicedOptions,
      hasMore,
    };
  };

  onPage = async (page, rows) => {
    await this.setState({ page, rows });
    await this.getStocks();
  };

  onFilter = async (e, filter) => {
    console.log(filter);
    await this.setState({ [filter]: e });
    await this.getStocks();
  };

  onChange = (e, state) => {
    this.setState({ [state]: e });
  };

  // Handle product selection from searchable dropdown
  handleProductSelect = (selectedOption) => {
    this.setState({
      selectedProduct: selectedOption,
      order: selectedOption ? selectedOption.value : ""
    }, () => {
      this.getStocks();
    });
  };

  // Handle date filter changes
  handleDateFilter = (field, value) => {
    this.setState({ [field]: value }, () => {
      this.getStocks();
    });
  };

  toggleCloseBarcode = () => {
    this.setState({ editBarcode: !this.state.editBarcode });
    this.getStocks();
  };

  toggleUpdateBarcode = (editBarcode) => {
    this.setState({ editBarcode });
  };

  toggleCloseUpdateStock = () => {
    this.setState({ updateStock: !this.state.updateStock });
    this.getStocks();
  };

  toggleUpdateStock = (updateStock) => {
    
    this.setState({showEditModal:true})
    this.setState({ updateStock });
  };



  // Clear all filters
  clearAllFilters = () => {
    this.setState({
      order: "",
      selectedProduct: null,
      start_date: "",
      end_date: "",
    }, () => {
      this.getStocks();
    });
  };

  formatCurrency(x) {
    if (x !== "null" && x !== "0") {
      const parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return `\u20a6${parts.join(".")}`;
    }
    return "0";
  }

  toggleFilter = () => {
    this.setState({ showFilter: !this.state.showFilter });
  };

  render() {
    const {
      stocks,
      order,
      showFilter,
      total,
      page,
      rows,
      search,
      loading,
      addToCart,
      totalStockQuantity,
      totalQuantitySold,
      totalInStock,
      start_date,
      end_date,
      selectedProduct,
      productOptions,
      showDeleteModal,
      stockToDelete,
      deleting,
      editBarcode,
      updateStock,
      // Move stock state
      showMoveModal,
      stockToMove,
      moving,
      selectedToBranch,
      branchOptions,
      moveQuantity,
      maxMoveQuantity,
      // Branch info
      currentBranch,
      // Create stock state
      showCreateModal,
      showEditModal,
      creating,
      createForm,
      createProductOptions,
      createSupplierOptions,
      selectedCreateProduct,
      selectedCreateSupplier,
      products,
      formData,
      formErrors,
      allProducts

    } = this.state;

    // Custom styles for react-select
    const selectStyles = {
      control: (provided) => ({
        ...provided,
        minHeight: '38px',
        borderColor: '#d1d5db',
        '&:hover': {
          borderColor: '#9ca3af'
        }
      }),
      menu: (provided) => ({
        ...provided,
        zIndex: 9999
      })
    };

    return (
      <>
        {loading && <SpinDiv text={"Loading..."} />}

        {editBarcode && (
          <EditBarcode stock={editBarcode} toggle={() => this.toggleCloseBarcode()} />
        )}

        
        {/* Header with Breadcrumb */}
        <Row className="mb-4">
          <Col lg="12">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4 border-bottom">
              <div className="d-block mb-4 mb-md-0">
                <Breadcrumb listProps={{ className: "breadcrumb-text-dark text-primary mb-0" }}>
                  <Breadcrumb.Item href="/" className="text-muted">Home</Breadcrumb.Item>
                  <Breadcrumb.Item href="/stocked" className="text-primary fw-semibold">Stocks</Breadcrumb.Item>
                </Breadcrumb>
                {currentBranch && (
                  <div className="mt-2">
                    <span className="text-muted" style={{fontSize:30}}>Branch: </span>
                    <span className="fw-semibold text-primary" style={{fontSize:30}}>{currentBranch.name}</span>
                  </div>
                )}
              </div>

              {/* Create Stock Button */}
              <div className="btn-toolbar mb-2 mb-md-0">
                <Button
                  variant="primary"
                  onClick={this.handleCreateStock}
                  className="d-flex align-items-center gap-2"
                >
                  <i className="fa fa-plus" />
                  Create Stock
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Stock Summary Cards - Show only when filtering by product */}
        {order && (
          <Row className="mb-4">
            <Col lg="3">
              <Card className="border-0 shadow-sm bg-primary text-white">
                <Card.Body className="text-center py-4">
                  <div className="mb-2">
                    <i className="fa fa-boxes fa-2x opacity-75" />
                  </div>
                  <h4 className="mb-1 fw-bold">{totalStockQuantity.toLocaleString()}</h4>
                  <p className="mb-0 small opacity-75">Total Initial Stock</p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg="3">
              <Card className="border-0 shadow-sm bg-success text-white">
                <Card.Body className="text-center py-4">
                  <div className="mb-2">
                    <i className="fa fa-shopping-cart fa-2x opacity-75" />
                  </div>
                  <h4 className="mb-1 fw-bold">{totalQuantitySold.toLocaleString()}</h4>
                  <p className="mb-0 small opacity-75">Total Quantity Sold</p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg="3">
              <Card className="border-0 shadow-sm bg-info text-white">
                <Card.Body className="text-center py-4">
                  <div className="mb-2">
                    <i className="fa fa-warehouse fa-2x opacity-75" />
                  </div>
                  <h4 className="mb-1 fw-bold">{totalInStock.toLocaleString()}</h4>
                  <p className="mb-0 small opacity-75">Total In Stock</p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg="3">
              <Card className="border-0 shadow-sm bg-warning text-white">
                <Card.Body className="text-center py-4">
                  <div className="mb-2">
                    <i className="fa fa-percentage fa-2x opacity-75" />
                  </div>
                  <h4 className="mb-1 fw-bold">
                    {totalStockQuantity > 0 ? ((totalQuantitySold / totalStockQuantity) * 100).toFixed(1) : 0}%
                  </h4>
                  <p className="mb-0 small opacity-75">Sales Rate</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Controls Row */}
        <Row className="mb-4 align-items-center">
          <Col lg="6">
            <div className="d-flex align-items-center">
              <h4 className="mb-0 me-3">Stocks</h4>
              <span className="badge bg-primary rounded-pill fs-6">({total})</span>
              {(order || start_date || end_date) && (
                <span className="badge bg-secondary rounded-pill fs-6 ms-2">
                  Filtered
                </span>
              )}
            </div>
          </Col>

          <Col lg="2">
            {!showFilter && (
              <Button
                variant="outline-warning"
                size="sm"
                onClick={this.toggleFilter}
                className="d-flex align-items-center gap-2"
              >
                <i className="fa fa-filter" />
                Filter
              </Button>
            )}
          </Col>

          <Col lg="4">
            <div className="input-group">
              <Input
                placeholder="Search stocks..."
                className="form-control"
                value={search}
                onChange={(e) => this.onChange(e.target.value, "search")}
                autoFocus
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    this.getStocks();
                    this.setState({ search: "" });
                  }
                }}
              />
              <Button
                variant="secondary"
                onClick={this.getStocks}
                className="btn-icon d-flex align-items-center justify-content-center"
              >
                <i className="fa fa-search" />
              </Button>
            </div>
          </Col>
        </Row>

        {/* Filter Row */}
        {showFilter && (
          <Row className="mb-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <Row className="align-items-end">
                    <Col md={3}>
                      <Form.Label className="form-label fw-semibold mb-2">Filter by Product</Form.Label>
                      <Select
                        value={selectedProduct}
                        onChange={this.handleProductSelect}
                        options={productOptions}
                        placeholder="Search and select product..."
                        isClearable
                        isSearchable
                        styles={selectStyles}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Label className="form-label fw-semibold mb-2">Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={start_date}
                        onChange={(e) => this.handleDateFilter('start_date', e.target.value)}
                        className="form-control"
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Label className="form-label fw-semibold mb-2">End Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={end_date}
                        onChange={(e) => this.handleDateFilter('end_date', e.target.value)}
                        className="form-control"
                      />
                    </Col>
                    <Col md={2}>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={this.toggleFilter}
                        className="d-flex align-items-center gap-2"
                      >
                        <i className="fa fa-eye-slash" />
                        Hide Filters
                      </Button>
                    </Col>
                    {(order || start_date || end_date) && (
                      <Col md={3}>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={this.clearAllFilters}
                          className="d-flex align-items-center gap-2"
                        >
                          <i className="fa fa-times" />
                          Clear All Filters
                        </Button>
                      </Col>
                    )}
                  </Row>

                  {/* Active Filters Display */}
                  {(order || start_date || end_date) && (
                    <Row className="mt-3">
                      <Col md={12}>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="text-muted small fw-semibold">Active Filters:</span>
                          {order && (
                            <span className="badge bg-primary">
                              Product: {selectedProduct?.label}
                              <button
                                className="btn btn-sm ms-1 p-0 border-0 bg-transparent text-white"
                                onClick={() => this.handleProductSelect(null)}
                                style={{ fontSize: '10px' }}
                              >
                                ×
                              </button>
                            </span>
                          )}
                          {start_date && (
                            <span className="badge bg-info">
                              From: {start_date}
                              <button
                                className="btn btn-sm ms-1 p-0 border-0 bg-transparent text-white"
                                onClick={() => this.handleDateFilter('start_date', '')}
                                style={{ fontSize: '10px' }}
                              >
                                ×
                              </button>
                            </span>
                          )}
                          {end_date && (
                            <span className="badge bg-warning">
                              To: {end_date}
                              <button
                                className="btn btn-sm ms-1 p-0 border-0 bg-transparent text-white"
                                onClick={() => this.handleDateFilter('end_date', '')}
                                style={{ fontSize: '10px' }}
                              >
                                ×
                              </button>
                            </span>
                          )}
                        </div>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Main Table Card */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase tracking-wider">
                      Product
                    </th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase tracking-wider">
                      Stock Details
                    </th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase tracking-wider">
                      Sold
                    </th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock, key) => (
                    <tr key={key} className="border-bottom">
                      <td className="py-4 px-4">
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            {stock.product_image ? (
                              <img
                                src={stock.product_image}
                                alt={stock.product_name}
                                className="rounded"
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="bg-light rounded d-flex align-items-center justify-content-center text-muted"
                                style={{ width: '50px', height: '50px' }}
                              >
                                <i className="fa fa-image" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{stock.product_name}</div>
                            {order && (
                              <small className="text-muted">
                                <i className="fa fa-filter me-1" />
                                Filtered Item
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-muted">{stock.branch_name}</span>
                        <div className="text-muted">
                          {dayjs(stock.created_at).format('MMMM D, YYYY h:mm A')}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="small">
                          <div className="mb-2">
                            <span className="fw-semibold text-success">Selling Price: </span>
                            <span className="text-dark">{this.formatCurrency(stock.order.unit_selling_price)}</span>
                          </div>
                          <div className="mb-2">
                            <span className="fw-semibold text-warning">Cost Price: </span>
                            <span className="text-dark">{this.formatCurrency(stock.order.unit_price)}</span>
                          </div>
                          <div className="mb-2">
                            <span className="fw-semibold text-primary">Initial Stock: </span>
                            <span className="text-dark fw-bold">{stock.stock_quantity}</span>
                            {order && (
                              <i className="fa fa-info-circle text-primary ms-1" title="Included in summary above" />
                            )}
                          </div>
                          <div className="mb-2">
                            <span className="fw-semibold text-danger">Sold: </span>
                            <span className="text-dark fw-bold">{stock.quantity_sold}</span>
                            {order && (
                              <i className="fa fa-info-circle text-success ms-1" title="Included in summary above" />
                            )}
                          </div>
                          <div className="mb-2">
                            <span className="fw-semibold text-info">In Stock: </span>
                            <span className="text-dark fw-bold">{stock.in_stock}</span>
                            {order && (
                              <i className="fa fa-info-circle text-info ms-1" title="Included in summary above" />
                            )}
                          </div>
                          <div>
                            <span className="fw-semibold text-muted">Purchase ID: </span>
                            <code className="text-primary">{stock.order.tracking_id}</code>
                          </div>
                          <div>
                            <span className="fw-semibold text-muted">Barcode: </span>
                            <code className="text-primary">{stock.order.barcode ?? "N/A"}</code>
                          </div>
                            <StockMovementHistory stock={stock} />
                          
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-muted">{stock.order.supplier_name}</span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="badge bg-success rounded-pill fs-6">
                          {stock.quantity_sold}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="fw-semibold text-success fs-6">
                          {this.formatCurrency(stock.quantity_sold * stock.order.unit_selling_price)}
                        </span>
                      </td>
                     

                      <td className="py-4 px-4">
                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              type="submit"
                              className="d-flex align-items-center gap-2"
                              size="sm"
                              onClick={() =>
                                this.toggleUpdateBarcode(stock.order)
                              }
                            >
                              <i className="fa fa-barcode" />
                              Update Barcode
                            </Button>

                            {/* Move Stock Button - Show only when there's stock to move */}
                            {stock.in_stock > 0 && (
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => this.handleMoveStock(stock)}
                                className="d-flex align-items-center gap-2"
                                title={`Move stock to another branch (${stock.in_stock} available)`}
                              >
                                <i className="fa fa-exchange-alt" />
                                Move Stock
                              </Button>
                            )}
                          </div>
                        

                        {(!stock.movements_from?.length && !stock.movements_to?.length) && (
                            <Button
                              variant="outline-primary"
                              type="submit"
                              className="d-flex align-items-center gap-2"
                              size="sm"
                              onClick={() => this.toggleUpdateStock(stock)}
                            >
                              <i className="fa fa-edit" />
                              Edit Stock
                            </Button>
                          )}
                                                  
                         {(stock.quantity_sold === 0 && (!stock.movements_from?.length && !stock.movements_to?.length)) && (
  <Button
    variant="outline-danger"
    size="sm"
    onClick={() => this.handleDeleteStock(stock)}
    className="d-flex align-items-center gap-2"
    title="Delete stock (only available when no items have been sold or moved)"
  >
    <i className="fa fa-trash" />
    Delete
  </Button>
)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Footer with Pagination */}
            <div className="px-4 py-3 bg-light border-top">
              {stocks.length < 1 && (
                <div className="text-center py-5">
                  <div className="text-muted">
                    <i className="fa fa-inbox fa-2x mb-3 d-block" />
                    <h6 className="mb-2">No Stocks Found</h6>
                    <p className="mb-0 small">
                      {order || start_date || end_date
                        ? 'No stocks available for the selected filters'
                        : 'No stocks available for the selected date range'
                      }
                    </p>
                  </div>
                </div>
              )}

              {stocks.length > 0 && (
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted small">
                    Showing {((page - 1) * rows) + 1} to {Math.min(page * rows, total)} of {total} stocks
                    {(order || start_date || end_date) && (
                      <span className="ms-2 text-primary">
                        (Filtered Results)
                      </span>
                    )}
                  </div>
                  <Pagination
                    total={total}
                    showTotal={(total) => `Total ${total} Stocks`}
                    onChange={this.onPage}
                    pageSize={rows}
                    current={page}
                    className="mb-0"
                  />
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Modal Components */}
        <CreateStockModal
          show={showCreateModal}
          onCancel={this.cancelCreateStock}
          onConfirm={this.confirmCreateStock}
          creating={creating}
          products={allProducts} // Use allProducts instead of products
          currentBranch={currentBranch}
          formData={formData}
          formErrors={formErrors}
          handleFormChange={this.handleFormChange}
          handleSelectChange={this.handleSelectChange}
          barcodeInputRef={this.barcodeInputRef}
          onProductsUpdate={this.handleProductsUpdate}
          //onStockCreated={reloadStockData}
        />

        <EditStock currentBranch={currentBranch} show={showEditModal} stock={updateStock} products={allProducts} onClose={this.cancelEditStock}  onProductsUpdate={this.handleProductsUpdate} />

        <MoveStockModal
          show={showMoveModal}
          onCancel={this.cancelMoveStock}
          onConfirm={this.confirmMoveStock}
          stock={stockToMove}
          selectedToBranch={selectedToBranch}
          branchOptions={branchOptions}
          handleToBranchSelect={this.handleToBranchSelect}
          moveQuantity={moveQuantity}
          handleMoveQuantityChange={this.handleMoveQuantityChange}
          maxMoveQuantity={maxMoveQuantity}
          moving={moving}
          formatCurrency={this.formatCurrency}
        />

        <DeleteStockModal
          show={showDeleteModal}
          onCancel={this.cancelDeleteStock}
          onConfirm={this.confirmDeleteStock}
          deleting={deleting}
          stock={stockToDelete}
        />
      </>
    );
  }
}

export default StockIndex;