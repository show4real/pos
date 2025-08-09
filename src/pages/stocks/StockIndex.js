import React, { Component } from "react";
import { Input } from "reactstrap";
import { getStock, deleteStock, moveStock } from "../../services/stockService";
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
  Breadcrumb,
  Form,
  Alert,
} from "@themesberg/react-bootstrap";
import SpinDiv from "../components/SpinDiv";
import Select from 'react-select';
import dayjs from 'dayjs';

import { Pagination } from "antd";
import EditBarcode from "../purchase/EditBarcode";
import EditStock from "./EditStock";
import StockMovementHistory from "./StockMovementHistory";
import EditPrice from "./EditPrice";

export class StockIndex extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      page: 1,
      rows: 10,
      loading: false,
      stocks: [],
      total: 0,
      branch_id: props.match.params.id,
      
      // Stock summary metrics
      totalStockQuantity: 0,
      totalQuantitySold: 0,
      totalInStock: 0,
      
      // Filters
      order: "",
      start_date: "",
      end_date: "",
      expiry_date:"",
      showFilter: false,
      selectedProduct: null,
      productOptions: [],
      
      // Modals and editing
      showDeleteModal: false,
      stockToDelete: null,
      deleting: false,
      editBarcode: null,
      editPrice: null,
      
      // Move stock
      showMoveModal: false,
      stockToMove: null,
      moving: false,
      branches: [],
      selectedToBranch: null,
      moveQuantity: 0,
      maxMoveQuantity: 0,
      branchOptions: [],
      
      // Branch info
      currentBranch: null,
      
      // Create stock
      showCreateModal: false,
      showEditModal: false,
      allProducts: [],
      
      // Form data for CreateStockModal
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
      formErrors: {},
      updateStock: null,
      
      // Stock actions and details
      showStockActions: {},
      expandedStockDetails: {},
      
      // Expiry notifications
      expiryAlerts: [],
      showExpiryAlert: true
    };

    this.barcodeInputRef = React.createRef();
  }

  componentDidMount() {
    this.getStocks();
    this.getBranches();
    this.getAllProducts();
  }

  // Calculate expiry status and generate alerts
  calculateExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { status: 'no-expiry', daysToExpiry: null, className: '', message: '' };
    
    const today = dayjs();
    const expiry = dayjs(expiryDate);
    const daysToExpiry = expiry.diff(today, 'day');
    const monthsToExpiry = expiry.diff(today, 'month');
    
    if (daysToExpiry < 0) {
      return {
        status: 'expired',
        daysToExpiry,
        className: 'bg-danger text-white',
        message: `Expired ${Math.abs(daysToExpiry)} days ago`
      };
    } else if (daysToExpiry <= 30) {
      return {
        status: 'expiring-soon',
        daysToExpiry,
        className: 'bg-warning text-dark',
        message: daysToExpiry === 0 ? 'Expires today' : `Expires in ${daysToExpiry} day${daysToExpiry !== 1 ? 's' : ''}`
      };
    } else if (daysToExpiry >= 30) {
      return {
        status: 'expiring-month',
        daysToExpiry,
        className: 'bg-info text-white',
        message: `Expires in ${monthsToExpiry} months`
      };
    } else {
      return {
        status: 'good',
        daysToExpiry,
        className: 'bg-success text-white',
        message: `${daysToExpiry} days remaining`
      };
    }
  };

  // Generate expiry alerts for dashboard
  generateExpiryAlerts = (stocks) => {
    const alerts = [];
    const expiredItems = [];
    const expiringSoonItems = [];
    
    stocks.forEach(stock => {
      if (stock?.expiry_date) {
        const expiryStatus = this.calculateExpiryStatus(stock.expiry_date);
        
        if (expiryStatus.status === 'expired') {
          expiredItems.push({
            ...stock,
            expiryStatus
          });
        } else if (expiryStatus.status === 'expiring-soon') {
          expiringSoonItems.push({
            ...stock,
            expiryStatus
          });
        }
      }
    });

    if (expiredItems.length > 0) {
      alerts.push({
        type: 'danger',
        title: 'Expired Items',
        message: `${expiredItems.length} item${expiredItems.length !== 1 ? 's have' : ' has'} expired`,
        items: expiredItems
      });
    }

    if (expiringSoonItems.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Items Expiring Soon',
        message: `${expiringSoonItems.length} item${expiringSoonItems.length !== 1 ? 's expire' : ' expires'} within 7 days`,
        items: expiringSoonItems
      });
    }

    this.setState({ expiryAlerts: alerts });
  };

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
        const productOptions = products.map(product => ({
          value: product.id,
          label: product.name,
        }));

        this.setState({
          allProducts: products,
          productOptions: productOptions,
        });
      },
      (error) => {
        console.error("Error fetching products:", error);
      }
    );
  };

  getStocks = () => {
    const { page, rows, order, search, branch_id, start_date, end_date, expiry_date } = this.state;
    this.setState({ loading: true });

    getStock({
      page,
      rows,
      order,
      branch_id,
      search,
      start_date,
      end_date,
      expiry_date
    }).then(
      (res) => {
        const stocks = res.stocks.data || [];
        
        this.setState({
          loading: false,
          stocks: stocks,
          total: res.stocks.total,
          totalStockQuantity: res.stock_quantity || 0,
          totalQuantitySold: res.quantity_sold || 0,
          totalInStock: res.instock || 0,
        });

        // Generate expiry alerts after stocks are loaded
        this.generateExpiryAlerts(stocks);
      },
      (error) => {
        this.setState({ loading: false });
        this.showErrorToast("Failed to load stocks");
      }
    );
  };

  // Modal handlers
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
      formData: initialFormData,
      formErrors: {}
    });
  };

  handleFormChange = (field, value) => {
    this.setState({
      formData: {
        ...this.state.formData,
        [field]: value
      }
    });
  };

  handleSelectChange = (field, value) => {
    this.setState({
      formData: {
        ...this.state.formData,
        [field]: value
      }
    });
  };

  confirmCreateStock = async () => {
    this.setState({ showCreateModal: false });
    this.getStocks(); // Reload data
    this.getAllProducts();
  };

  cancelCreateStock = () => {
    this.setState({ showCreateModal: false });
  };

  // Delete stock
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
      await deleteStock(stockToDelete.id);
      this.setState({
        deleting: false,
        showDeleteModal: false,
        stockToDelete: null,
      });
      this.showToast("Stock deleted successfully!");
      this.getStocks();
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

  // Move stock
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

    if (moveQuantity <= 0 || moveQuantity > stockToMove.in_stock) {
      this.showErrorToast("Please enter a valid quantity to move");
      return;
    }

    this.setState({ moving: true });

    try {
      await moveStock({
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
      });

      this.showToast(`Successfully moved ${moveQuantity} units to ${selectedToBranch.label}`);
      this.getStocks();
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

  // Pagination and filtering
  onPage = async (page, rows) => {
    await this.setState({ page, rows });
    await this.getStocks();
  };

  onChange = (e, state) => {
    this.setState({ [state]: e });
  };

  handleProductSelect = (selectedOption) => {
    this.setState({
      selectedProduct: selectedOption,
      order: selectedOption ? selectedOption.value : ""
    }, () => {
      this.getStocks();
    });
  };

  handleDateFilter = (field, value) => {
    this.setState({ [field]: value }, () => {
      this.getStocks();
    });
  };

  // Edit handlers
  toggleCloseBarcode = () => {
    this.setState({ editBarcode: null });
    this.getStocks();
  };

  toggleCloseEditPrice = () => {
    this.setState({ editPrice: null });
    this.getStocks();
  };

  toggleUpdateBarcode = (editBarcode) => {
    this.setState({ editBarcode });
  };

  toggleUpdatePrice = (editPrice) => {
    this.setState({ editPrice });
  };

  toggleCloseUpdateStock = () => {
    this.setState({
      updateStock: null,
      showEditModal: false
    });
    this.getStocks();
  };

  toggleUpdateStock = (updateStock) => {
    this.setState({
      showEditModal: true,
      updateStock
    });
  };

  // UI toggles
  toggleStockActions = (stockId) => {
    this.setState(prevState => ({
      showStockActions: {
        ...prevState.showStockActions,
        [stockId]: !prevState.showStockActions?.[stockId]
      }
    }));
  }

  toggleStockDetails = (stockId) => {
    this.setState(prevState => ({
      expandedStockDetails: {
        ...prevState.expandedStockDetails,
        [stockId]: !prevState.expandedStockDetails?.[stockId]
      }
    }));
  }

  clearAllFilters = () => {
    this.setState({
      order: "",
      selectedProduct: null,
      start_date: "",
      end_date: "",
      expiry_date: ""
    }, () => {
      this.getStocks();
    });
  };

  formatCurrency(x) {
    if (x !== "null" && x !== "0") {
      const parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return `₦${parts.join(".")}`;
    }
    return "₦0";
  }

  toggleFilter = () => {
    this.setState({ showFilter: !this.state.showFilter });
  };

  dismissExpiryAlert = () => {
    this.setState({ showExpiryAlert: false });
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
      totalStockQuantity,
      totalQuantitySold,
      totalInStock,
      start_date,
      end_date,
      expiry_date,
      selectedProduct,
      productOptions,
      showDeleteModal,
      stockToDelete,
      deleting,
      editBarcode,
      editPrice,
      updateStock,
      showMoveModal,
      stockToMove,
      moving,
      selectedToBranch,
      branchOptions,
      moveQuantity,
      maxMoveQuantity,
      currentBranch,
      showCreateModal,
      showEditModal,
      formData,
      formErrors,
      allProducts,
      expandedStockDetails,
      expiryAlerts,
      showExpiryAlert
    } = this.state;

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

        {editPrice && (
          <EditPrice stock={editPrice} toggle={() => this.toggleCloseEditPrice()} />
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
                    <span className="text-muted" style={{ fontSize: 30 }}>Branch: </span>
                    <span className="fw-semibold text-primary" style={{ fontSize: 30 }}>{currentBranch.name}</span>
                  </div>
                )}
              </div>

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

        {/* Expiry Alerts */}
        {expiryAlerts.length > 0 && showExpiryAlert && (
          <Row className="mb-4">
            <Col lg="12">
              {expiryAlerts.map((alert, index) => (
                <Alert 
                  key={index} 
                  variant={alert.type} 
                  dismissible 
                  onClose={this.dismissExpiryAlert}
                  className="d-flex align-items-center justify-content-between"
                >
                  <div className="d-flex align-items-center">
                    <i className={`fa ${alert.type === 'danger' ? 'fa-exclamation-triangle' : 'fa-clock'} me-2`} />
                    <div>
                      <strong>{alert.title}:</strong> {alert.message}
                      <div className="small mt-1">
                        {alert.items.slice(0, 3).map((item, i) => (
                          <span key={i} className="me-3">
                            {item.product_name} ({item.expiryStatus.message})
                          </span>
                        ))}
                        {alert.items.length > 3 && <span>... and {alert.items.length - 3} more</span>}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </Col>
          </Row>
        )}

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
                      <Form.Label className="form-label fw-semibold mb-2">Expiry Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={expiry_date}
                        onChange={(e) => this.handleDateFilter('expiry_date', e.target.value)}
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
                    {(order || start_date || end_date || expiry_date) && (
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
                      Branch & Date
                    </th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase tracking-wider">
                      Stock Details
                    </th>
                    {/* <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase tracking-wider">
                      Expiry Status
                    </th> */}
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock, key) => {
                     const totalMovedOut = stock.movements_from && Array.isArray(stock.movements_from) 
                      ? stock.movements_from.reduce((total, movement) => total + (movement.quantity || 0), 0)
                      : 0;
                     const stockId = stock.id || stock.order?.id || key;
                     const isExpanded = expandedStockDetails[stockId];
                     const expiryStatus = this.calculateExpiryStatus(stock?.expiry_date);
                    
                    return (
                    <tr key={key} className="border-bottom">
                      <td className="py-4 px-4">
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            {stock.product_image ? (
                              <img
                                src={stock.product_image}
                                alt={stock.product_name}
                                className="rounded shadow-sm"
                                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="bg-light rounded d-flex align-items-center justify-content-center text-muted border"
                                style={{ width: '60px', height: '60px' }}
                              >
                                <i className="fa fa-image fa-lg" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="fw-bold text-dark mb-1">{stock.product_name}</div>
                             <div className="text-center">
                          {stock?.expiry_date ? (
                            <div>
                              <div className={`badge ${expiryStatus.className} mb-2 px-3 py-2`}>
                                <div className="d-flex align-items-center gap-2">
                                  <i className={`fa ${
                                    expiryStatus.status === 'expired' ? 'fa-exclamation-triangle' :
                                    expiryStatus.status === 'expiring-soon' ? 'fa-clock' :
                                    expiryStatus.status === 'expiring-month' ? 'fa-calendar' : 'fa-check-circle'
                                  }`} />
                                  <span className="small fw-bold">{expiryStatus.message}</span>
                                </div>
                              </div>
                              <div className="small text-muted">
                                Expires: {dayjs(stock.expiry_date).format('MMM D, YYYY')}
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted small">
                              <i className="fa fa-infinity" />
                              <div>No Expiry Date</div>
                            </div>
                          )}
                        </div>
                            {order && (
                              <span className="badge bg-primary-soft text-primary small">
                                <i className="fa fa-filter me-1" />
                                Filtered Item
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="mb-2">
                          <span className="fw-semibold text-dark">{stock.branch_name}</span>
                        </div>
                        <div className="text-muted small">
                          <i className="fa fa-calendar me-1" />
                          {dayjs(stock.created_at).format('MMM D, YYYY')}
                        </div>
                        <div className="text-muted small">
                          <i className="fa fa-clock me-1" />
                          {dayjs(stock.created_at).format('h:mm A')}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="stock-details">
                          {/* Always visible essential info */}
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="fw-semibold text-success">Selling Price:</span>
                              <span className="text-dark fw-bold">{this.formatCurrency(stock.order.unit_selling_price)}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="fw-semibold text-warning">Cost Price:</span>
                              <span className="text-dark">{this.formatCurrency(stock.order.unit_price)}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-semibold text-info">Current Stock:</span>
                              <span className="badge bg-info text-white fs-6">{stock.in_stock}</span>
                            </div>
                          </div>

                          {/* Expandable details */}
                          {isExpanded && (
                            <div className="expanded-details border-top pt-3">
                              <div className="row g-2 mb-3">
                                <div className="col-6">
                                  <div className="d-flex small">
                                    <span className="text-muted">Initial Stock:</span>&nbsp;&nbsp;&nbsp;
                                    <span className="fw-semibold">{totalMovedOut + stock.stock_quantity}</span>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="d-flex small">
                                    <span className="text-muted">Moved Out:</span>&nbsp;&nbsp;&nbsp;
                                    <span className="fw-semibold text-warning">{totalMovedOut}</span>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="d-flex small">
                                    <span className="text-muted">Branch Stock:</span>&nbsp;&nbsp;&nbsp;
                                    <span className="fw-semibold">{stock.stock_quantity}</span>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="d-flex small">
                                    <span className="text-muted">Sold:</span>&nbsp;&nbsp;&nbsp;
                                    <span className="fw-semibold text-danger">{stock.quantity_sold}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="mb-3">
                                <div className="small text-muted mb-1">Purchase Details:</div>
                                <div className="bg-light p-2 rounded small">
                                  <div className="d-flex justify-content-between mb-1">
                                    <span>Purchase ID:</span>
                                    <code className="text-primary">{stock.order.tracking_id}</code>
                                  </div>
                                  <div className="d-flex justify-content-between">
                                    <span>Barcode:</span>
                                    <code className="text-primary">{stock.order.barcode || "N/A"}</code>
                                  </div>
                                </div>
                              </div>

                              <div className="mb-3">
                                <StockMovementHistory stock={stock} />
                              </div>
                            </div>
                          )}

                          {/* Toggle button */}
                          <div className="mt-2">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => this.toggleStockDetails(stockId)}
                              className="d-flex align-items-center gap-1 w-100"
                            >
                              <i className={`fa fa-chevron-${isExpanded ? 'up' : 'down'}`} />
                              <span className="small">{isExpanded ? 'Show Less' : 'View More'}</span>
                            </Button>
                          </div>
                        </div>
                      </td>

                      {/* <td className="py-4 px-4">
                       
                      </td> */}

                      <td className="py-4 px-4">
                        <div className="text-dark fw-semibold mb-1">{stock.order.supplier_name}</div>
                        <div className="text-muted small">Supplier</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="mb-2">
                          <span className="badge bg-success rounded-pill">
                            <i className="fa fa-shopping-cart me-1" />
                            {stock.quantity_sold} sold
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="badge bg-info rounded-pill">
                            <i className="fa fa-warehouse me-1" />
                            {stock.in_stock} remaining
                          </span>
                        </div>
                        {stock.quantity_sold > 0 && (
                          <div className="small text-muted">
                            Sales Rate: {stock.stock_quantity > 0 ? ((stock.quantity_sold / (stock.quantity_sold + stock.in_stock)) * 100).toFixed(1) : 0}%
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="mb-2">
                          <div className="fw-bold text-success fs-6">
                            {this.formatCurrency(stock.quantity_sold * stock.order.unit_selling_price)}
                          </div>
                          <div className="small text-muted">Total Revenue</div>
                        </div>
                        <div>
                          <div className="fw-semibold text-primary small">
                            {this.formatCurrency((stock.order.unit_selling_price - stock.order.unit_price) * stock.quantity_sold)}
                          </div>
                          <div className="small text-muted">Profit Earned</div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="d-flex flex-column gap-2">
                          {/* Settings Toggle Button */}
                          <div className="d-flex justify-content-end">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => this.toggleStockActions(stock.id || stock.order)}
                              className="d-flex align-items-center"
                              title="Toggle stock actions"
                            >
                              <i className={`fa fa-cog ${this.state.showStockActions?.[stock.id || stock.order] ? 'fa-spin' : ''}`} />
                            </Button>
                          </div>

                          {/* Collapsible Actions */}
                          {this.state.showStockActions?.[stock.id || stock.order] && (
                            <div className="d-flex flex-column gap-2">
                              <div className="d-grid gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => this.toggleUpdateBarcode(stock.order)}
                                  className="d-flex align-items-center gap-2 justify-content-center"
                                >
                                  <i className="fa fa-barcode" />
                                  Update Barcode
                                </Button>
                                
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => this.toggleUpdatePrice(stock)}
                                  className="d-flex align-items-center gap-2 justify-content-center"
                                  title = "Edit Price, Quantity and Expiry Date"
                                >
                                  <i className="fa fa-edit" />
                                  Special Edit
                                </Button>

                                {/* Move Stock Button - Show only when there's stock to move */}
                                {stock.in_stock > 0 && (
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    onClick={() => this.handleMoveStock(stock)}
                                    className="d-flex align-items-center gap-2 justify-content-center"
                                    title={`Move stock to another branch (${stock.in_stock} available)`}
                                  >
                                    <i className="fa fa-exchange-alt" />
                                    Move Stock
                                  </Button>
                                )}

                                {(stock.quantity_sold === 0 && !stock.movements_from?.length && !stock.movements_to?.length) && (
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    onClick={() => this.toggleUpdateStock(stock)}
                                    className="d-flex align-items-center gap-2 justify-content-center"
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
                                    className="d-flex align-items-center gap-2 justify-content-center"
                                    title="Delete stock (only available when no items have been sold or moved)"
                                  >
                                    <i className="fa fa-trash" />
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </Table>
            </div>

            {/* Footer with Pagination */}
            <div className="px-4 py-3 bg-light border-top">
              {stocks.length < 1 && (
                <div className="text-center py-5">
                  <div className="text-muted">
                    <i className="fa fa-inbox fa-3x mb-3 d-block opacity-50" />
                    <h5 className="mb-2">No Stocks Found</h5>
                    <p className="mb-0">
                      {order || start_date || end_date
                        ? 'No stocks match your current filter criteria. Try adjusting your filters.'
                        : 'No stocks are available for this branch yet. Create your first stock entry.'
                      }
                    </p>
                    {!order && !start_date && !end_date && (
                      <div className="mt-3">
                        <Button
                          variant="primary"
                          onClick={this.handleCreateStock}
                          className="d-flex align-items-center gap-2 mx-auto"
                        >
                          <i className="fa fa-plus" />
                          Create First Stock
                        </Button>
                      </div>
                    )}
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
          onProductsUpdate={this.getAllProducts}
          products={allProducts}
          currentBranch={currentBranch}
          formData={formData}
          formErrors={formErrors}
          handleFormChange={this.handleFormChange}
          handleSelectChange={this.handleSelectChange}
          barcodeInputRef={this.barcodeInputRef}
        />

        <EditStock
          currentBranch={currentBranch}
          show={showEditModal}
          stock={updateStock}
          products={allProducts}
          onClose={this.cancelEditStock}
        />

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

        <style jsx>{`
          .stock-details {
            min-width: 280px;
          }
          
          .expanded-details {
            animation: slideDown 0.3s ease-in-out;
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              max-height: 0;
            }
            to {
              opacity: 1;
              max-height: 500px;
            }
          }
          
          .bg-primary-soft {
            background-color: rgba(13, 110, 253, 0.1);
          }
          
          .table-hover tbody tr:hover {
            background-color: rgba(0, 0, 0, 0.02);
          }
          
          .badge {
            font-weight: 500;
          }
          
          .tracking-wider {
            letter-spacing: 0.05em;
          }
          
          .btn-icon {
            width: 38px;
            height: 38px;
          }
          
          .react-select-container .react-select__control {
            border-color: #d1d5db;
            box-shadow: none;
          }
          
          .react-select-container .react-select__control:hover {
            border-color: #9ca3af;
          }
          
          .react-select-container .react-select__control--is-focused {
            border-color: #3b82f6;
            box-shadow: 0 0 0 1px #3b82f6;
          }

          /* Expiry status badges */
          .badge.bg-danger {
            background-color: #dc3545 !important;
          }
          
          .badge.bg-warning {
            background-color: #fd7e14 !important;
          }
          
          .badge.bg-info {
            background-color: #0dcaf0 !important;
          }
          
          .badge.bg-success {
            background-color: #198754 !important;
          }

          /* Alert animations */
          .alert {
            animation: fadeIn 0.5s ease-in-out;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Responsive improvements */
          @media (max-width: 768px) {
            .stock-details {
              min-width: 200px;
            }
            
            .table-responsive {
              font-size: 0.875rem;
            }
            
            .badge {
              font-size: 0.75rem;
            }
          }
        `}</style>
      </>
    );
  }
}

export default StockIndex;