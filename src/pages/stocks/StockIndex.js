import React, { Component } from "react";
import { Input, Media } from "reactstrap";
import { getStock } from "../../services/stockService";
import { toast } from "react-toastify";
import Cart from "../products/Cart";
import {
  Col,
  Row,
  Card,
  Table,
  Button,
  ButtonGroup,
  Breadcrumb,
  Form,
} from "@themesberg/react-bootstrap";
import SpinDiv from "../components/SpinDiv";

import { Pagination } from "antd";

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
    };
  }

  componentDidMount() {
    this.getStocks();
  }

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "success" }}>{msg}</div>);
  };
  getStocks = () => {
    const { page, rows, order, search, branch_id, products } = this.state;
    console.log(order);
    this.setState({ loading: true });
    getStock({ page, rows, order, branch_id, search }).then(
      (res) => {
        console.log(res);
        this.setState({
          loading: false,
          stocks: res.stocks.data,
          products: res.products.data,
          total_cost: 0,
          suppliers: res.suppliers.data,
          total: res.stocks.total,
          initialPurchaseOrders: { ...res.stocks.data },
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  sleep = (ms) =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });

  loadOptions = async (search, prevOptions) => {
    options = [];
    var options = this.state.products.map((product, key) => {
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
      value,
      order,
      products,
      attributes,
      showFilter,
      total,
      cart_sold,
      cart_details,
      total_cost,
      addStock,
      addSales,
      editStock,
      suppliers,
      total_cart,
      page,
      cartCheckout,
      cartItem,
      rows,
      search,
      loading,
      addToCart,
    } = this.state;
    return (
     <>
  {loading && <SpinDiv text={"Loading..."} />}
  
  {/* Header with Breadcrumb */}
  <Row className="mb-4">
    <Col lg="12">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4 border-bottom">
        <div className="d-block mb-4 mb-md-0">
          <Breadcrumb listProps={{ className: "breadcrumb-text-dark text-primary mb-0" }}>
            <Breadcrumb.Item href="/" className="text-muted">Home</Breadcrumb.Item>
            <Breadcrumb.Item href="#stocks" className="text-primary fw-semibold">Stocks</Breadcrumb.Item>
          </Breadcrumb>
        </div>
      </div>
    </Col>
  </Row>

  {/* Controls Row */}
  <Row className="mb-4 align-items-center">
    <Col lg="7">
      <div className="d-flex align-items-center">
        <h4 className="mb-0 me-3">Stocks</h4>
        <span className="badge bg-primary rounded-pill fs-6">({total})</span>
      </div>
    </Col>
    
    <Col lg="1">
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
              <Col md={4}>
                <Form.Label className="form-label fw-semibold mb-2">Filter by Product</Form.Label>
                <Form.Select
                  value={order}
                  onChange={(e) => this.onFilter(e.target.value, "order")}
                  className="form-select"
                >
                  <option value="">All Products</option>
                  {products.map((p, index) => (
                    <option value={p.id} key={index}>
                      {p.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={4}>
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
            </Row>
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
                    </div>
                  </div>
                </td>
                
                <td className="py-4 px-4">
                  <span className="text-muted">{stock.branch_name}</span>
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
                      <span className="text-dark">{stock.stock_quantity}</span>
                    </div>
                    <div className="mb-2">
                      <span className="fw-semibold text-danger">Sold: </span>
                      <span className="text-dark">{stock.quantity_sold}</span>
                    </div>
                    <div className="mb-2">
                      <span className="fw-semibold text-info">In Stock: </span>
                      <span className="text-dark">{stock.in_stock}</span>
                    </div>
                    <div>
                      <span className="fw-semibold text-muted">Purchase ID: </span>
                      <code className="text-primary">{stock.order.tracking_id}</code>
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
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      this.props.history.push(
                        `/stock/${stock.id}/product/${stock.order.product_id}`
                      );
                    }}
                    className="d-flex align-items-center gap-2"
                  >
                    <i className="fa fa-eye" />
                    View
                  </Button>
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
              <p className="mb-0 small">No stocks available for the selected date range</p>
            </div>
          </div>
        )}
        
        {stocks.length > 0 && (
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              Showing {((page - 1) * rows) + 1} to {Math.min(page * rows, total)} of {total} stocks
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
</>
    );
  }
}

export default StockIndex;
