import React, { Component } from "react";
import { Input } from "reactstrap";
import { getPosTransactions, getProducts } from "../../services/posOrderService";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import moment from "moment";
import {
  Col,
  Row,
  Card,
  Table,
  Button,
  ButtonGroup,
  Breadcrumb,
  Form,
  Alert,
} from "@themesberg/react-bootstrap";
import SpinDiv from "../components/SpinDiv";
import "antd/dist/antd.css";
import { Pagination } from "antd";
import ReactDatetime from "react-datetime";

export class SalesOrderIndex extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Search and pagination
      search: "",
      page: 1,
      rows: 10,
      total: 0,
      
      // Loading states
      loading: false,
      exportLoading: false,
      
      // Filter states
      showFilter: false,
      order: "",
      product: "",
      user: "",
      fromdate: moment().startOf("month"),
      todate: moment().endOf("day"),
      
      // Data
      pos_sales: [],
      products: [],
      users: [],
      
      // Product totals
      total_instock: 0,
      total_sold: 0,
      total_amount: 0,
      
      // User info
      u: this.getUserFromStorage(),
      
      // Error handling
      error: null,
    };
  }

  componentDidMount() {
    this.initializeData();
  }

  // Helper Methods
  getUserFromStorage = () => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      this.showErrorToast("Error loading user data");
      return null;
    }
  };

  initializeData = async () => {
    try {
      await this.getPosTransactions();
    } catch (error) {
      console.error("Error initializing data:", error);
      this.setState({ error: "Failed to load initial data" });
    }
  };

  showToast = (msg, type = "success") => {
    const toastConfig = {
      success: { color: "success" },
      error: { color: "error" },
      warning: { color: "warning" },
    };
    
    toast(
      <div style={{ padding: 20, color: toastConfig[type]?.color || "success" }}>
        {msg}
      </div>
    );
  };

  showErrorToast = (msg) => this.showToast(msg, "error");
  showSuccessToast = (msg) => this.showToast(msg, "success");

  // API Methods
  getPosTransactions = async () => {
    const { page, rows, order, todate, fromdate, search, user, product } = this.state;
    
    this.setState({ loading: true, error: null });
    
    try {
      const response = await getPosTransactions({
        page,
        rows,
        fromdate: fromdate.format ? fromdate.format() : fromdate,
        todate: todate.format ? todate.format() : todate,
        order,
        user,
        product,
        search,
      });

      if (response && response.pos_sales) {
        this.setState({
          loading: false,
          pos_sales: response.pos_sales.data || [],
          users: response.users || [],
          total: response.pos_sales.total || 0,
          // Update product totals from response
          total_instock: response.total_instock || 0,
          total_sold: response.total_sold || 0,
          total_amount: response.total || 0,
          error: null,
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching POS transactions:", error);
      this.setState({
        loading: false,
        error: "Failed to load transactions. Please try again.",
        pos_sales: [],
        users: [],
        total: 0,
        total_instock: 0,
        total_sold: 0,
        total_amount: 0,
      });
      this.showErrorToast("Failed to load transactions");
    }
  };

  getProducts = async () => {
    this.setState({ loading: true });
    
    try {
      const response = await getProducts();
      
      if (response && response.products) {
        this.setState({
          loading: false,
          products: response.products,
          error: null,
        });
      } else {
        throw new Error("Invalid products response");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      this.setState({
        loading: false,
        products: [],
      });
      this.showErrorToast("Failed to load products");
    }
  };

  // Export functionality
  export = async () => {
    const { page, total, order, todate, fromdate, search, user, product } = this.state;
    
    if (total < 1) {
      this.showErrorToast("No transactions available to export.");
      return;
    }

    this.setState({ exportLoading: true });

    try {
      const response = await getPosTransactions({
        page,
        rows: 10000, // Get all records for export
        fromdate: fromdate.format ? fromdate.format() : fromdate,
        todate: todate.format ? todate.format() : todate,
        order,
        user,
        product,
        search,
      });

      if (!response?.pos_sales?.data) {
        throw new Error("No data received for export");
      }

      const exportData = response.pos_sales.data.map((transaction) => ({
        cashier: transaction.cashier_name || "N/A",
        branch: transaction.stock?.branch_name || "N/A",
        product: transaction.stock?.product_name || "N/A",
        quantity: transaction.qty_sold || 0,
        price: transaction.order?.unit_selling_price || 0,
        cost: (transaction.qty_sold || 0) * (transaction.order?.unit_selling_price || 0),
        purchase_id: transaction.order?.tracking_id || "N/A",
        created_on: moment(transaction.created_at).format("MMM DD YYYY"),
      }));

      this.generateExcelFile(exportData, fromdate, todate);
      this.showSuccessToast("Export completed successfully!");
      
    } catch (error) {
      console.error("Error exporting data:", error);
      this.showErrorToast("Failed to export data. Please try again.");
    } finally {
      this.setState({ exportLoading: false });
    }
  };

  generateExcelFile = (exportData, fromdate, todate) => {
    try {
      const headers = [
        "cashier",
        "branch", 
        "product",
        "quantity",
        "price",
        "cost",
        "purchase_id",
        "created_on",
      ];
      
      const columnWidths = [30, 20, 15, 20, 40, 20, 20, 20];
      const cols = columnWidths.map((width) => ({ wch: width }));
      
      const sheetData = exportData.map((item) => 
        headers.map((header) => item[header])
      );
      
      const allData = [headers].concat(sheetData);
      const worksheet = XLSX.utils.aoa_to_sheet(allData);
      const workbook = XLSX.utils.book_new();
      
      worksheet["!cols"] = cols;
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");
      
      const filename = `Sales-data-from-${moment(fromdate).format("YYYY-MM-DD")}-to-${moment(todate).format("YYYY-MM-DD")}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
    } catch (error) {
      console.error("Error generating Excel file:", error);
      throw new Error("Failed to generate Excel file");
    }
  };

  // Calculation methods
  totalSales = () => {
    const { pos_sales } = this.state;
    
    if (!Array.isArray(pos_sales) || pos_sales.length === 0) {
      return this.formatCurrency(0);
    }

    try {
      const total = pos_sales.reduce((sum, sale) => {
        const quantity = sale.qty_sold || 0;
        const price = sale.order?.unit_selling_price || 0;
        return sum + (quantity * price);
      }, 0);

      return this.formatCurrency(total);
    } catch (error) {
      console.error("Error calculating total sales:", error);
      return this.formatCurrency(0);
    }
  };

  formatCurrency = (amount) => {
    try {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return "₦0";
      }
      
      const parts = amount.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return `₦${parts.join(".")}`;
    } catch (error) {
      console.error("Error formatting currency:", error);
      return "₦0";
    }
  };

  formatNumber = (number) => {
    try {
      if (number === null || number === undefined || isNaN(number)) {
        return "0";
      }
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch (error) {
      console.error("Error formatting number:", error);
      return "0";
    }
  };

  // Event handlers
  toggleFilter = async () => {
    const { showFilter } = this.state;
    this.setState({ showFilter: !showFilter });
    
    if (!showFilter) {
      await this.getProducts();
    }
  };

  onPage = async (page, rows) => {
    try {
      await this.setState({ page, rows });
      await this.getPosTransactions();
    } catch (error) {
      console.error("Error changing page:", error);
      this.showErrorToast("Error loading page");
    }
  };

  onFilter = async (value, filterType) => {
    try {
      await this.setState({ 
        [filterType]: value,
        page: 1 // Reset to first page when filtering
      });
      await this.getPosTransactions();
    } catch (error) {
      console.error(`Error applying ${filterType} filter:`, error);
      this.showErrorToast(`Error applying ${filterType} filter`);
    }
  };

  onChange = (value, state) => {
    this.setState({ [state]: value });
  };

  handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      this.handleSearch();
    }
  };

  handleSearch = async () => {
    try {
      await this.setState({ page: 1 }); // Reset to first page for new search
      await this.getPosTransactions();
      this.setState({ search: "" }); // Clear search input after search
    } catch (error) {
      console.error("Error performing search:", error);
      this.showErrorToast("Search failed");
    }
  };

  // Render methods
  renderErrorAlert = () => {
    const { error } = this.state;
    if (!error) return null;

    return (
      <Alert variant="danger" className="mb-4">
        <Alert.Heading>
          <i className="fas fa-exclamation-triangle me-2"></i>
          Error
        </Alert.Heading>
        <p className="mb-0">{error}</p>
        <hr />
        <Button 
          variant="outline-danger" 
          size="sm" 
          onClick={() => this.setState({ error: null })}
        >
          Dismiss
        </Button>
      </Alert>
    );
  };

  renderProductTotalCards = () => {
    const { product, total_instock, total_sold, total_amount } = this.state;
    
    // Only show totals when a specific product is selected
    if (!product) return null;

    return (
      <Row className="mb-4">
         <Col md={4}>
          <Card className="border-success">
            <Card.Body className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="fas fa-boxes text-success fa-2x me-2"></i>
                <div>
                  <h5 className="mb-0 text-success">{(total_amount)}</h5>
                  <small className="text-muted fw-bold">Total Stock</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-info">
            <Card.Body className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="fas fa-boxes text-info fa-2x me-2"></i>
                <div>
                  <h5 className="mb-0 text-info">{this.formatNumber(total_instock)}</h5>
                  <small className="text-muted fw-bold">Instock</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="border-warning">
            <Card.Body className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="fas fa-shopping-cart text-warning fa-2x me-2"></i>
                <div>
                  <h5 className="mb-0 text-warning">{this.formatNumber(total_sold)}</h5>
                  <small className="text-muted fw-bold">Total Sold</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
       
      </Row>
    );
  };

  renderFilterSection = () => {
    const { showFilter, order, product, user, products, users, u } = this.state;
    
    if (!showFilter) return null;

    return (
      <Card className="mb-3 border-warning">
        <Card.Header className="bg-warning-subtle">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold">
              <i className="fas fa-filter me-2"></i>
              Advanced Filters
            </h6>
            <Button
              variant="outline-warning"
              size="sm"
              onClick={this.toggleFilter}
            >
              <i className="fas fa-times me-1"></i>
              Hide Filters
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <i className="fas fa-store me-1"></i>
                  Sales Channel
                </Form.Label>
                <Form.Select
                  value={order}
                  onChange={(e) => this.onFilter(e.target.value, "order")}
                >
                  <option value="">All Channels</option>
                  <option value="pos_order">POS Sales</option>
                  <option value="sales_order">Internal Sales</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <i className="fas fa-box me-1"></i>
                  Product
                </Form.Label>
                <Form.Select
                  value={product}
                  onChange={(e) => this.onFilter(e.target.value, "product")}
                >
                  <option value="">All Products</option>
                  {products.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {u?.admin === 1 && (
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <i className="fas fa-user me-1"></i>
                    User
                  </Form.Label>
                  <Form.Select
                    value={user}
                    onChange={(e) => this.onFilter(e.target.value, "user")}
                  >
                    <option value="">All Users</option>
                    {users.map((u) => (
                      <option value={u.id} key={u.id}>
                        {`${u.firstname} ${u.lastname}`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>
    );
  };

  renderSalesTable = () => {
    const { pos_sales, loading } = this.state;

    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading transactions...</p>
        </div>
      );
    }

    if (!Array.isArray(pos_sales) || pos_sales.length === 0) {
      return (
        <div className="text-center py-5 text-muted">
          <i className="fas fa-inbox fa-3x mb-3"></i>
          <h5>No Transactions Found</h5>
          <p>No sales transactions found for the selected date range and filters.</p>
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <Table hover className="table-centered table-nowrap mb-0">
          <thead className="table-light">
            <tr>
              <th className="border-0 fw-semibold">Cashier</th>
              <th className="border-0 fw-semibold">Branch</th>
              <th className="border-0 fw-semibold">Product</th>
              <th className="border-0 fw-semibold">Quantity</th>
              <th className="border-0 fw-semibold">Unit Price</th>
              <th className="border-0 fw-semibold">Total Amount</th>
              <th className="border-0 fw-semibold">Order ID</th>
              <th className="border-0 fw-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {pos_sales.map((transaction, index) => (
              <tr key={`${transaction.id}-${index}`}>
                <td className="fw-medium">{transaction.cashier_name || "N/A"}</td>
                <td>{transaction.stock?.branch_name || "N/A"}</td>
                <td>{transaction.stock?.product_name || "N/A"}</td>
                <td>
                  <span className="badge bg-primary-subtle text-primary">
                    {transaction.qty_sold || 0}
                  </span>
                </td>
                <td className="text-success fw-medium">
                  {this.formatCurrency(transaction.order?.unit_selling_price || 0)}
                </td>
                <td className="text-success fw-bold">
                  {this.formatCurrency(
                    (transaction.qty_sold || 0) * (transaction.order?.unit_selling_price || 0)
                  )}
                </td>
                <td>
                  <code>{transaction.order?.tracking_id || "N/A"}</code>
                </td>
                <td>
                  {moment(transaction.created_at).format("MMM DD, YYYY")}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  render() {
    const {
      page,
      rows,
      search,
      loading,
      exportLoading,
      showFilter,
      total,
      fromdate,
      todate,
      pos_sales,
    } = this.state;

    return (
      <>
        {(loading || exportLoading) && (
          <SpinDiv text={exportLoading ? "Exporting..." : "Loading..."} />
        )}

        {/* Header Section */}
        <Row className="mb-4">
          <Col lg="12">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
              <div className="d-block mb-4 mb-md-0">
                <Breadcrumb
                  listProps={{
                    className: "breadcrumb-text-dark text-primary",
                  }}
                >
                  <Breadcrumb.Item href="/">
                    <i className="fas fa-home me-1"></i>
                    Home
                  </Breadcrumb.Item>
                  <Breadcrumb.Item active>
                    <i className="fas fa-receipt me-1"></i>
                    Sales Order
                  </Breadcrumb.Item>
                </Breadcrumb>
                <h2 className="h4 mb-0">Sales Order</h2>
              </div>
              <div className="btn-toolbar mb-2 mb-md-0">
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={this.export}
                  disabled={exportLoading || total === 0}
                  className="me-2"
                >
                  <i className="fas fa-download me-1"></i>
                  {exportLoading ? "Exporting..." : "Export Sales"}
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {this.renderErrorAlert()}

        {/* Product Total Cards - Only shown when product is selected */}
        {this.renderProductTotalCards()}

        {/* Filters and Search Section */}
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Row className="align-items-end g-3">
              <Col md={2}>
                <div className="d-flex align-items-center">
                  <h5 className="mb-0 text-primary fw-bold">
                    <i className="fas fa-receipt me-2"></i>
                    Sales
                  </h5>
                  <span className="badge bg-primary ms-2 rounded-pill">
                    {total}
                  </span>
                </div>
              </Col>
              
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold">From Date</Form.Label>
                  <ReactDatetime
                    value={fromdate}
                    dateFormat="MMM D, YYYY"
                    closeOnSelect
                    onChange={(e) => this.onFilter(e, "fromdate")}
                    inputProps={{
                      required: true,
                      className: "form-control",
                      style: { height: "38px" }
                    }}
                    timeFormat={false}
                  />
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold">To Date</Form.Label>
                  <ReactDatetime
                    value={todate}
                    dateFormat="MMM D, YYYY"
                    closeOnSelect
                    onChange={(e) => this.onFilter(e, "todate")}
                    inputProps={{
                      required: true,
                      className: "form-control",
                      style: { height: "38px" }
                    }}
                    timeFormat={false}
                  />
                </Form.Group>
              </Col>

             
              {/* <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Search</Form.Label>
                  <div className="input-group">
                    <Input
                      placeholder="Search transactions..."
                      value={search}
                      onChange={(e) => this.onChange(e.target.value, "search")}
                      onKeyUp={this.handleSearchKeyPress}
                      style={{ height: "38px" }}
                    />
                    <Button
                      variant="secondary"
                      onClick={this.handleSearch}
                      disabled={loading}
                    >
                      <i className="fas fa-search" />
                    </Button>
                  </div>
                </Form.Group>
              </Col> */}
              <Col md={2}>
                <Button
                  variant={showFilter ? "warning" : "outline-warning"}
                  size="sm"
                  onClick={this.toggleFilter}
                  className="w-100"
                >
                  <i className="fas fa-filter me-1"></i>
                  {showFilter ? "Hide" : "Filter"}
                </Button>
              </Col>

              <Col md={3}>
                <div className="text-success fw-bold text-center">
                  <small className="d-block text-muted">Total Sales</small>
                  <span className="h6">{this.totalSales()}</span>
                </div>
              </Col>
              
            </Row>
          </Card.Body>
        </Card>

        {this.renderFilterSection()}

        {/* Main Content */}
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            {this.renderSalesTable()}
            
            {/* Pagination */}
            {pos_sales.length > 0 && (
              <div className="d-flex justify-content-center p-3 border-top">
                <Pagination
                  total={total}
                  showTotal={(total, range) => 
                    `Showing ${range[0]}-${range[1]} of ${total} Sales`
                  }
                  onChange={this.onPage}
                  pageSize={rows}
                  current={page}
                  showSizeChanger
                  showQuickJumper
                />
              </div>
            )}
          </Card.Body>
        </Card>
      </>
    );
  }
}

export default SalesOrderIndex;