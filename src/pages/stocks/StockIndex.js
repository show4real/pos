import React, { Component } from "react";
import { Input, Media } from "reactstrap";
import { getStock, deleteStock, moveStock } from "../../services/stockService";
import { getAllBranches } from "../../services/branchService";
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
    };
  }

  componentDidMount() {
    this.getStocks();
    this.getBranches();
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
        this.setState({
          branches: res.branches || [],
        });
      },
      (error) => {
        console.error("Error fetching branches:", error);
      }
    );
  };

  getStocks = () => {
    const { page, rows, order, search, branch_id, products, start_date, end_date } = this.state;
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
          suppliers: res.suppliers.data,
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
    this.getStocks();
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
      // Assuming you have a moveStock service function
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

  attributeCols = (attribute_name, attribute_value) => {
    if (attribute_name !== null) {
      let attributes = new Array();
      let values = new Array();
      attributes = attribute_name.split(",");
      values = attribute_value.split(",");
      return values.map((attrs, key) => {
        return (
          <p className="mb-0 text-sm" style={{ textTransform: "capitalize" }}>
            <span style={{ fontWeight: "bold" }}>{attrs + ":" + "  "}</span>
            {attributes[key]}
          </p>
        );
      });
    } else {
      return <p style={{ fontWeight: "bold" }}>No variants</p>;
    }
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
      // Move stock state
      showMoveModal,
      stockToMove,
      moving,
      selectedToBranch,
      branchOptions,
      moveQuantity,
      maxMoveQuantity,
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
                    
                    {/* Show delete button only when quantity sold is 0 */}
                    {stock.quantity_sold == 0 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => this.handleDeleteStock(stock)}
                        className="d-flex align-items-center gap-2"
                        title="Delete stock (only available when no items have been sold)"
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

  {/* Delete Confirmation Modal */}
  <Modal show={showDeleteModal} onHide={this.cancelDeleteStock} centered>
    <Modal.Header closeButton>
      <Modal.Title className="text-danger">
        <i className="fa fa-exclamation-triangle me-2" />
        Confirm Delete
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {stockToDelete && (
        <div>
          <p className="mb-3">
            Are you sure you want to delete this stock entry?
          </p>
          <div className="bg-light p-3 rounded mb-3">
            <div className="d-flex align-items-center mb-2">
              {stockToDelete.product_image ? (
                <img
                  src={stockToDelete.product_image}
                  alt={stockToDelete.product_name}
                  className="rounded me-3"
                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                />
              ) : (
                <div 
                  className="bg-secondary rounded d-flex align-items-center justify-content-center text-white me-3"
                  style={{ width: '40px', height: '40px' }}
                >
                  <i className="fa fa-image" />
                </div>
              )}
              <div>
                <div className="fw-semibold">{stockToDelete.product_name}</div>
                <small className="text-muted">
                  Purchase ID: {stockToDelete.order.tracking_id}
                </small>
              </div>
            </div>
            <div className="small text-muted">
              <div>Branch: {stockToDelete.branch_name}</div>
              <div>Initial Stock: {stockToDelete.stock_quantity}</div>
              <div>Quantity Sold: {stockToDelete.quantity_sold}</div>
            </div>
          </div>
          <div className="alert alert-warning">
            <i className="fa fa-info-circle me-2" />
            <strong>Warning:</strong> This action cannot be undone. The stock entry will be permanently removed from the system.
          </div>
        </div>
      )}
    </Modal.Body>
    <Modal.Footer>
      <Button
        variant="secondary"
        onClick={this.cancelDeleteStock}
        disabled={deleting}
      >
        Cancel
      </Button>
      <Button
        variant="danger"
        onClick={this.confirmDeleteStock}
        disabled={deleting}
        className="d-flex align-items-center gap-2"
      >
        {deleting ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
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

  {/* Move Stock Modal */}
  <Modal show={showMoveModal} onHide={this.cancelMoveStock} centered size="lg">
    <Modal.Header closeButton>
      <Modal.Title className="text-info">
        <i className="fa fa-exchange-alt me-2" />
        Move Stock to Another Branch
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {stockToMove && (
        <div>
          {/* Stock Information */}
          <div className="bg-light p-3 rounded mb-4">
            <h6 className="fw-semibold mb-3 text-muted">Stock Information</h6>
            <div className="d-flex align-items-center mb-3">
              {stockToMove.product_image ? (
                <img
                  src={stockToMove.product_image}
                  alt={stockToMove.product_name}
                  className="rounded me-3"
                  style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                />
              ) : (
                <div 
                  className="bg-secondary rounded d-flex align-items-center justify-content-center text-white me-3"
                  style={{ width: '60px', height: '60px' }}
                >
                  <i className="fa fa-image" />
                </div>
              )}
              <div className="flex-grow-1">
                <div className="fw-semibold h5 mb-1">{stockToMove.product_name}</div>
                <div className="text-muted small">
                  Purchase ID: {stockToMove.order.tracking_id}
                </div>
                <div className="text-muted small">
                  Current Branch: <span className="fw-semibold">{stockToMove.branch_name}</span>
                </div>
              </div>
            </div>
            
            <Row>
              <Col md={4}>
                <div className="text-center p-2 bg-white rounded">
                  <div className="text-muted small">Available Stock</div>
                  <div className="fw-bold text-success h4">{stockToMove.in_stock}</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-center p-2 bg-white rounded">
                  <div className="text-muted small">Selling Price</div>
                  <div className="fw-bold text-primary">{this.formatCurrency(stockToMove.order.unit_selling_price)}</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-center p-2 bg-white rounded">
                  <div className="text-muted small">Total Value</div>
                  <div className="fw-bold text-warning">
                    {this.formatCurrency(stockToMove.in_stock * stockToMove.order.unit_selling_price)}
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
                  onChange={this.handleToBranchSelect}
                  options={branchOptions}
                  placeholder="Choose a branch to move stock to..."
                  isClearable
                  isSearchable
                  styles={selectStyles}
                  className="react-select-container"
                  classNamePrefix="react-select"
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
                  onChange={this.handleMoveQuantityChange}
                  placeholder="Enter quantity"
                />
                <Form.Text className="text-muted">
                  Max: {maxMoveQuantity} units
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Move Summary */}
          {selectedToBranch && moveQuantity > 0 && (
            <div className="alert alert-info">
              <h6 className="fw-semibold mb-2">
                <i className="fa fa-info-circle me-2" />
                Move Summary
              </h6>
              <div className="mb-2">
                <strong>Moving:</strong> {moveQuantity} units of {stockToMove.product_name}
              </div>
              <div className="mb-2">
                <strong>From:</strong> {stockToMove.branch_name}
              </div>
              <div className="mb-2">
                <strong>To:</strong> {selectedToBranch.label}
              </div>
              <div className="mb-2">
                <strong>Total Value:</strong> {this.formatCurrency(moveQuantity * stockToMove.order.unit_selling_price)}
              </div>
              <div>
                <strong>Remaining in Current Branch:</strong> {stockToMove.in_stock - moveQuantity} units
              </div>
            </div>
          )}

          {/* Validation Messages */}
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
        </div>
      )}
    </Modal.Body>
    <Modal.Footer>
      <Button
        variant="secondary"
        onClick={this.cancelMoveStock}
        disabled={moving}
      >
        Cancel
      </Button>
      <Button
        variant="info"
        onClick={this.confirmMoveStock}
        disabled={moving || !selectedToBranch || moveQuantity <= 0 || moveQuantity > maxMoveQuantity}
        className="d-flex align-items-center gap-2"
      >
        {moving ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
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
</>
    );
  }
}

export default StockIndex;