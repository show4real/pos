import React, { Component } from "react";
import { Input, Media } from "reactstrap";
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
  InputGroup,
} from "@themesberg/react-bootstrap";
import { throttle, debounce } from "../debounce";
import { addSales } from "../../services/posOrderService";
import ReactToPrint from "react-to-print";
import { Invoice } from "./Invoice";
import { Pagination, Select, Spin } from "antd";
import { getBranchStocks } from "../../services/stockService";
import { getCompany } from "../../services/companyService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import { getAllClients, getInvoiceId } from "../../services/invoiceService";
import AddClient from "../clients/AddClient";
import moment from "moment";
import { InputNumber } from "antd";
import { getClients } from "../../services/clientService";

const { Option } = Select;

export class PosOrderIndex extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      search_client: "",
      page: 1,
      rows: 20,
      loading: false,
      saving: false,
      stocks: [],
      cart_details: [],
      clients: [],
      transaction_id: "",
      products: [],
      total_cost: 0,
      invoice_no: "",
      total: 0,
      total_cart: 0,
      close: false,
      cartItem: [],
      payment_mode: "",
      amount_paid: 0,
      client_id: "",
      total_purchase: 0,
      user: JSON.parse(localStorage.getItem("user")),
      company: {},
      due_date: moment().startOf("month"),
      invoice: {},
      pos_items: [],
      total_balance: 0,
      prev_balance: 0,
      loading: false,
    };

    this.searchDebounced = debounce(this.getPurchaseOrders, 500);
    this.searchThrottled = throttle(this.getPurchaseOrders, 500);
  }

  componentDidMount() {
    this.getPurchaseOrders();
    this.getCompany();
    this.getClients();
    this.getInvoiceId();

    const savedCartItem = JSON.parse(localStorage.getItem("cartItem")) || [];
    this.setState({ cartItem: savedCartItem });
  }

  getClients = () => {
    const { page, rows, search, clients, search_client } = this.state;
    this.setState({ loading: true });
    getClients({ page, rows, search: search_client }).then(
      (res) => {
        this.setState({
          clients: [...clients, ...res.clients.data],
          loading: false,
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  handlePopupScroll = (e) => {
    const { loading, hasMore } = this.state;

    if (loading || !hasMore) return;

    const { target } = e;
    if (target.scrollTop + target.offsetHeight === target.scrollHeight) {
      this.setState(
        (prevState) => ({ page: prevState.page + 1 }),
        () => this.getClients()
      );
    }
  };

  handleSearchClient = (value) => {
    this.setState(
      { search_client: value, page: 1, clients: [], hasMore: true },
      () => this.getClients()
    );
  };

  handleClientChange = (selected) => {
    this.setState({
      client_id: selected.value,
    });
  };

  getInvoiceId = () => {
    //this.setState({loading:true})

    getInvoiceId().then(
      (res) => {
        this.setState({
          invoice_no: res.invoice ? "INV-" + (res.invoice.id + 1) : "INV-1",
          items: [{ name: "", item_description: "", quantity: 0, rate: 0 }],
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  toggleAddClient = () => {
    this.setState({ addClient: !this.state.addClient });
  };

  getCompany = () => {
    const { product_id, id, rows, page } = this.state;
    console.log(page);
    this.setState({ loading: true });
    getCompany().then(
      (res) => {
        this.setState({
          loading: false,
          company: res.company,
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  onChange = (e, state) => {
    this.setState({ [state]: e });
  };

  incrementCount(item, index) {
    // index will be the key value
    const items = this.state.cartItem;
    console.log(items);
    let inStock =
      item.stock_quantity - item.quantity_sold - item.quantity_returned;
    if (item.quantity < inStock) {
      item.quantity = Number(item.quantity) + 1;
      console.log(item.quantity);
    }
    items.splice(index, 1, item);

    this.setState({ cartItem: items }, this.updateCartItemInLocalStorage);
  }

  decrementCount(item, index) {
    // index will be the key value
    const items = this.state.cartItem;
    if (item.quantity > 1) {
      item.quantity -= 1;
    }
    items.splice(index, 1, item);
    this.setState({ cartItem: items }, this.updateCartItemInLocalStorage);
  }

  showToastError = (msg) => {
    toast(<div style={{ padding: 20, color: "red" }}>*{msg}</div>);
  };

  onSaveSales = async (e) => {
    e.preventDefault();
    await toast.dismiss();
    const { cartItem, company, payment_mode, amount_paid, client_id } =
      this.state;

    let check_quantity =
      cartItem.some((ele) => ele.quantity === 0) ||
      cartItem.some((ele) => ele.quantity === undefined);

    toast.dismiss();
    toast.configure({ hideProgressBar: true, closeButton: false });

    if (check_quantity) {
      this.showToastError("Please Select Quantity");
    } else if (payment_mode == "") {
      this.showToastError("Please Add Payment Mode");
    } else if (client_id == "") {
      this.showToastError("Please Select a client");
    } else {
      this.saveSales();
    }
  };

  removeFromCart(index) {
    const list = this.state.cartItem;

    list.splice(index, 1);
    this.setState({ cartItem: list }, this.updateCartItemInLocalStorage);
  }

  saveSales = () => {
    this.setState({ loading: true, saving: true });

    const {
      cartItem,
      payment_mode,
      total_purchase,
      invoice_no,
      client_id,
      due_date,
      amount_paid,
    } = this.state;
    addSales({
      cart_items: cartItem,
      payment_mode: payment_mode,
      tracking_id: cartItem.tracking_id,
      amount_paid: amount_paid,
      client_id: client_id,
      due_date: due_date,
      invoice_no: invoice_no,
      total_purchase: total_purchase,
    }).then(
      (res) => {
        this.setState({ loading: false, saving: false });

        this.setState({
          cart_details: res.pos_items,
          transaction_id: res.pos_order.transaction_id,
          invoice: res.invoice,
          pos_items: res.pos_items,
          total_balance: res.total_balance,
          prev_balance: res.prev_balance,
          cartItem: [],
        });
        this.showToast("Sales has been created");
        localStorage.removeItem("cartItem");
      },
      (error) => {
        console.log(error);
        this.setState({ loading: false });
      }
    );
  };

  showToast = (msg) => {
    toast(<div style={{ padding: 20 }}>{msg}</div>);
  };

  selectQuantity = (quantity) => {
    let text = [];
    for (let i = 1; i <= quantity.length; i++) {
      text.push(
        <option value={i} key={i}>
          {i}
        </option>
      );
    }
    return text;
  };

  totalCartP() {
    const { cartItem, company } = this.state;
    let sum = 0;
    if (company.sell_by_serial_no == 1) {
      for (let i = 0; i < cartItem.length; i += 1) {
        sum +=
          cartItem[i].new_serials !== undefined
            ? cartItem[i].new_serials.length *
            cartItem[i].order.unit_selling_price
            : 0 * cartItem[i].order.unit_selling_price;
      }
      return this.formatCurrency(sum);
    } else {
      for (let i = 0; i < cartItem.length; i += 1) {
        sum +=
          cartItem[i].quantity !== 0
            ? cartItem[i].quantity * cartItem[i].order.unit_selling_price
            : 0 * cartItem[i].order.unit_selling_price;
      }
      return this.formatCurrency(sum);
    }
  }



  clearCart = () => {
    this.setState({ cartItem: [], cart_details: [], }); // or whatever state you want to reset
  };


  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "success" }}>{msg}</div>);
  };

  onPage = async (page, rows) => {
    await this.setState({ page, rows });
    await this.getPurchaseOrders();
  };
  getPurchaseOrders = () => {
    const { page, rows, order, search } = this.state;
    this.setState({ loading: true });
    getBranchStocks({ page, rows, order, search }).then(
      (res) => {
        console.log(res);
        this.setState({
          loading: false,
          stocks: res.stocks.data,
          attributes: res.attributes,
          products: res.products.data,
          total_cost: 0,
          suppliers: res.suppliers.data,
          branches: res.branches.data,
          total: res.stocks.total,
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  toggleFilter = () => {
    this.setState({ showFilter: !this.state.showFilter });
  };
  sleep = (ms) =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });

  updateCartItemInLocalStorage = () => {
    localStorage.setItem("cartItem", JSON.stringify(this.state.cartItem));
  };

  toggleAddToCart = (addToCart) => {
    var items = this.state.cartItem === null ? [] : [...this.state.cartItem];

    var item = items.find((item) => item.id === addToCart.id);

    if (item) {
      item.quantity += 1;
    } else {
      items.push(addToCart);
    }
    this.setState({ cartItem: items }, this.updateCartItemInLocalStorage);
  };

  inCart = (cartId) => {
    let inCartIds = this.state.cartItem;

    if (inCartIds !== null) {
      var result = inCartIds.map((product, key) => {
        return product.id;
      });
      let validateId = result.includes(cartId);

      return validateId;
    } else {
      return false;
    }
  };

  totalCart() {
    if (this.state.cartItem !== null) {
      let total_cart = this.state.cartItem.reduce(function (sum, item) {
        return (sum = sum + item.quantity);
      }, 0);
      return total_cart;
    } else {
      return 0;
    }
  }

  formatCurrency(x) {
    if (x !== null && x !== 0) {
      const parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return `\u20a6${parts.join(".")}`;
    }
    return 0;
  }

  handleSearch = (event) => {
    this.setState({ search: event.target.value }, () => {
      if (this.state.search < 5) {
        this.searchThrottled(this.state.search);
      } else {
        this.searchDebounced(this.state.search);
      }
    });
  };

  handlePriceChange = (event, index) => {
    const newPrice = parseFloat(event.target.value) || 0;
    const updatedCartItems = [...this.state.cartItem];

    updatedCartItems[index].order.unit_selling_price = newPrice;

    this.setState(
      { cartItem: updatedCartItems },
      this.updateCartItemInLocalStorage
    );
  };

  render() {
    const {
      stocks,
      company,
      payment_mode,
      rows,
      total,
      clients,
      page,
      cartItem,
      due_date,
      search,
      addClient,
      cart_details,
      pos_items,
      total_balance,
      prev_balance,
      invoice,
      user,
      saving,
      loading,
    } = this.state;
    return (
      <>
        {cart_details && (
          <div style={{ display: "none" }}>
            <Invoice
              pos_items={pos_items}
              invoice={invoice}
              company={company}
              total_balance={total_balance}
              prev_balance={prev_balance}
              user={user}
              ref={(el) => (this.componentRef = el)}
              toggle={() => this.setState({ invoice: {} })}
            />
          </div>
        )}

        {addClient && (
          <AddClient
            saved={this.getClients}
            addClient={addClient}
            toggle={() => this.setState({ addClient: null })}
          />
        )}

        {/* {loading && <SpinDiv text={"Loading..."} />} */}
        <div style={{ margin: 5 }}>
          <Row>
            <Col lg="12">
              <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
                <div className="d-block mb-4 mb-md-0">
                  <Breadcrumb
                    listProps={{
                      className: " breadcrumb-text-dark text-primary",
                    }}
                  >
                    <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                    <Breadcrumb.Item href="/invoices">Invoices</Breadcrumb.Item>
                    <Breadcrumb.Item href="#">POS</Breadcrumb.Item>
                  </Breadcrumb>
                </div>
              </div>
            </Col>
          </Row>
          <Row className="mb-4">
            <Col lg="12">
              <div className="d-flex align-items-center justify-content-between">
                <div className="stock-header">
                  <h4 className="mb-1 text-primary fw-bold">
                    <i className="fas fa-cube me-2"></i>
                    Stock Inventory
                  </h4>
                  <div className="stock-count d-flex align-items-center">
                    <span className="badge bg-primary-subtle text-primary fs-6 px-3 py-2 rounded-pill">
                      <i className="fas fa-boxes me-1"></i>
                      {total} {total === 1 ? 'Item' : 'Items'} Available
                    </span>
                  </div>
                </div>

                {/* Optional: Add action buttons or filters */}
                {/* <div className="stock-actions">
                  <div className="btn-group" role="group" aria-label="Stock actions">
                    <button type="button" className="btn btn-outline-primary btn-sm">
                      <i className="fas fa-filter me-1"></i>
                      Filter
                    </button>
                    <button type="button" className="btn btn-outline-success btn-sm">
                      <i className="fas fa-plus me-1"></i>
                      Add Stock
                    </button>
                  </div>
                </div> */}
              </div>

              {/* Optional: Stock summary cards */}
              <div className="stock-summary mt-2">
                <Row className="g-2">
                  <Col md={3}>
                    <div className="stock-card bg-success-subtle border border-success-subtle rounded p-2">
                      <div className="d-flex align-items-center">
                        <div className="icon-wrapper bg-success text-white rounded-circle me-2"
                          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-check-circle fa-sm"></i>
                        </div>
                        <div>
                          <small className="text-muted d-block">In Stock</small>
                          <span className="fw-bold text-success">{total}</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  {/* <Col md={3}>
                    <div className="stock-card bg-warning-subtle border border-warning-subtle rounded p-2">
                      <div className="d-flex align-items-center">
                        <div className="icon-wrapper bg-warning text-white rounded-circle me-2"
                          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-exclamation-triangle fa-sm"></i>
                        </div>
                        <div>
                          <small className="text-muted d-block">Low Stock</small>
                          <span className="fw-bold text-warning">0</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="stock-card bg-danger-subtle border border-danger-subtle rounded p-2">
                      <div className="d-flex align-items-center">
                        <div className="icon-wrapper bg-danger text-white rounded-circle me-2"
                          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-times-circle fa-sm"></i>
                        </div>
                        <div>
                          <small className="text-muted d-block">Out of Stock</small>
                          <span className="fw-bold text-danger">0</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="stock-card bg-info-subtle border border-info-subtle rounded p-2">
                      <div className="d-flex align-items-center">
                        <div className="icon-wrapper bg-info text-white rounded-circle me-2"
                          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-chart-line fa-sm"></i>
                        </div>
                        <div>
                          <small className="text-muted d-block">Total Value</small>
                          <span className="fw-bold text-info">₦0</span>
                        </div>
                      </div>
                    </div>
                  </Col> */}
                </Row>
              </div>
            </Col>
          </Row>

          <Card border="light" className="shadow-sm mb-4">
            <Row className="align-items-center mb-3">
              {/* Search Input Section */}
              <Col md={8}>
                <Row>
                  <Col md={5}>
                    <InputGroup style={{ marginBottom: '10px' }}>
                      <Input
                        placeholder="Search..."
                        id="show"
                        value={search}
                        onChange={this.handleSearch}
                        autoFocus
                        style={{
                          height: '45px',
                          borderTopLeftRadius: '5px',
                          borderBottomLeftRadius: '5px',
                        }}
                      />
                      {search && (
                        <Button
                          variant="outline-secondary"
                          onClick={() => this.setState({ search: "" }, () => {
                            if (this.state.search < 5) {
                              this.searchThrottled(this.state.search);
                            } else {
                              this.searchDebounced(this.state.search);
                            }
                          })}
                          style={{
                            height: '45px',
                            borderTopRightRadius: '5px',
                            borderBottomRightRadius: '5px',
                          }}
                        >
                          &times;
                        </Button>
                      )}
                    </InputGroup>
                  </Col>

                </Row>
              </Col>

              {/* Button Group Section */}
              <Col md={4} className="text-end pt-2">
                <div className="btn-toolbar justify-content-end">
                  <ButtonGroup>
                    {cartItem !== null ? (
                      <>
                        <Button variant="outline-success" size="sm">
                          Cart ({cartItem.length})
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={this.clearCart}
                        >
                          Clear Cart
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => this.props.history.push("/pos_sales")}
                      >
                        View Sales
                      </Button>
                    )}

                    {cart_details.length > 0 && (
                      <ReactToPrint
                        trigger={() => (
                          <Button variant="outline-success" size="sm">
                            Print Invoice
                          </Button>
                        )}
                        content={() => this.componentRef}
                      />
                    )}
                  </ButtonGroup>
                </div>
              </Col>
            </Row>

            <Row className="g-4">
              {/* Left Column - Product Inventory */}
              <Col md={7}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Header className="bg-primary text-white py-3">
                    <h5 className="mb-0">
                      <i className="fas fa-boxes me-2"></i>
                      Available Products
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div style={{ maxHeight: "500px", overflowY: "auto" }} className="custom-scrollbar">
                      <Table responsive className="table-hover mb-0">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th className="border-0 fw-semibold" style={{ padding: "1rem" }}>Product Details</th>
                            <th className="border-0 fw-semibold" style={{ padding: "1rem" }}>Price</th>
                            <th className="border-0 fw-semibold" style={{ padding: "1rem", width: "100px" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stocks
                            .filter((stock) => stock.in_stock > 0)
                            .map((stock, key) => {
                              const alreadyAdded = this.inCart(stock.id);

                              return (
                                <tr key={key} className="border-bottom">
                                  <td style={{ padding: "1.2rem" }}>
                                    <div className="product-info">
                                      <h6 className="mb-2 text-dark fw-bold">
                                        {stock.product_name}
                                      </h6>
                                      <div className="product-meta" style={{ fontSize: 20 }}>
                                        <span className="badge bg-secondary me-2">
                                          <i className="fas fa-barcode me-1"></i>
                                          {stock.tracking}
                                        </span>
                                        <span className="badge bg-secondary me-2">
                                          <i className="fas fa-barcode me-1"></i>
                                          Barcode {stock.barcode}
                                        </span>
                                        <span className="badge bg-success me-2">
                                          <i className="fas fa-cube me-1"></i>
                                          Stock: {stock.in_stock}
                                        </span>
                                        <span className="badge bg-info">
                                          <i className="fas fa-warehouse me-1"></i>
                                          Total: {stock.stock_quantity}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  <td style={{ padding: "1.2rem" }}>
                                    <span className="h6 text-success fw-bold">
                                      {this.formatCurrency(stock.order.fixed_price)}
                                    </span>
                                  </td>

                                  <td style={{ padding: "1.2rem" }}>
                                    {stock.in_stock <= 0 ? (
                                      <Button
                                        disabled
                                        variant="outline-secondary"
                                        size="sm"
                                        className="rounded-pill"
                                      >
                                        <i className="fas fa-times me-1"></i>
                                        Out of Stock
                                      </Button>
                                    ) : alreadyAdded === false ? (
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => this.toggleAddToCart(stock)}
                                        className="rounded-pill px-3"
                                        title="Add to cart"
                                      >
                                        <FontAwesomeIcon icon={faPlus} />
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="success"
                                        size="sm"
                                        disabled
                                        className="rounded-pill px-3"
                                        title="Already in cart"
                                      >
                                        <FontAwesomeIcon icon={faCheck} />
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </Table>
                    </div>

                    {/* Pagination Section */}
                    <div className="p-3 border-top bg-light">
                      {stocks.filter((stock) => stock.in_stock > 0).length > 0 ? (
                        <Pagination
                          showSizeChanger
                          defaultCurrent={6}
                          total={total}
                          showTotal={(total) => `Total ${total} products`}
                          onChange={this.onPage}
                          pageSize={rows}
                          current={page}
                          className="mb-0"
                        />
                      ) : (
                        <div className="text-center text-muted py-4">
                          <i className="fas fa-inbox fa-2x mb-3 d-block"></i>
                          <h6 className="text-muted">No products in stock</h6>
                          <small>Please restock your inventory</small>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Right Column - Shopping Cart & Checkout */}
              <Col md={5}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Header className="bg-success text-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        <i className="fas fa-shopping-cart me-2"></i>
                        Shopping Cart
                      </h5>
                      {cartItem.length > 0 && (
                        <div className="cart-total">
                          <span className="badge bg-light text-dark fs-6 px-3 py-2">
                            Total: {this.totalCartP()}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card.Header>

                  <Card.Body className="p-0">
                    {cart_details.length === 0 ? (
                      <>
                        {/* Cart Items */}
                        <div style={{ maxHeight: "300px", overflowY: "auto" }} className="custom-scrollbar">
                          {cartItem.length === 0 ? (
                            <div className="text-center text-muted py-5">
                              <i className="fas fa-shopping-cart fa-3x mb-3 text-muted"></i>
                              <h6 className="text-muted">Your cart is empty</h6>
                              <small>Add products from the inventory to get started</small>
                            </div>
                          ) : (
                            <Table responsive className="table-hover mb-0">
                              <thead className="table-light sticky-top">
                                <tr>
                                  <th className="border-0 fw-semibold" style={{ padding: "1rem" }}>Product</th>
                                  <th className="border-0 fw-semibold" style={{ padding: "1rem", width: "120px" }}>Price</th>
                                  <th className="border-0 fw-semibold" style={{ padding: "1rem", width: "100px" }}>Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cartItem.map((sale, key) => (
                                  <tr key={key} className="border-bottom">
                                    <td style={{ padding: "1rem" }}>
                                      <div className="cart-item-details">
                                        <h6 className="mb-2 fw-bold">
                                          {sale.product_name}
                                        </h6>

                                        {/* Quantity Controls */}
                                        <div className="quantity-controls d-flex align-items-center gap-2 mb-2">
                                          <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => this.removeFromCart(key)}
                                            className="rounded-circle p-1"
                                            style={{ width: "30px", height: "30px" }}
                                            title="Remove item"
                                          >
                                            <i className="fas fa-trash fa-sm"></i>
                                          </Button>

                                          <div className="quantity-adjuster d-flex align-items-center">
                                            <Button
                                              size="sm"
                                              variant="outline-primary"
                                              onClick={() => this.decrementCount(sale, key)}
                                              className="rounded-circle p-1"
                                              style={{ width: "30px", height: "30px" }}
                                            >
                                              <i className="fas fa-minus fa-sm"></i>
                                            </Button>
                                            <span className="mx-3 fw-bold fs-6">
                                              {sale.quantity}
                                            </span>
                                            <Button
                                              size="sm"
                                              variant="outline-primary"
                                              onClick={() => this.incrementCount(sale, key)}
                                              className="rounded-circle p-1"
                                              style={{ width: "30px", height: "30px" }}
                                            >
                                              <i className="fas fa-plus fa-sm"></i>
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    <td style={{ padding: "1rem" }}>
                                      <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        style={{
                                          width: "100px",
                                          height: "40px",
                                          borderRadius: "8px",
                                          fontSize: "14px"
                                        }}
                                        onKeyPress={(event) => {
                                          if (!/[0-9]/.test(event.key)) {
                                            event.preventDefault();
                                          }
                                        }}
                                        value={sale.order.unit_selling_price}
                                        onChange={(event) => this.handlePriceChange(event, key)}
                                      />
                                    </td>

                                    <td style={{ padding: "1rem" }}>
                                      <span className="fw-bold text-success">
                                        {this.formatCurrency(sale.quantity * sale.order.unit_selling_price)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          )}
                        </div>

                        {/* Checkout Section */}
                        {cartItem.length > 0 && (
                          <div className="checkout-section border-top bg-light">
                            {/* Customer & Payment Info */}
                            <div className="p-3 border-bottom">
                              <h6 className="mb-3 fw-semibold text-muted">
                                <i className="fas fa-user-circle me-2"></i>
                                Customer & Payment Details
                              </h6>
                              <Row className="g-3">
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="fw-semibold mb-2">Customer</Form.Label>
                                    <Select
                                      showSearch
                                      labelInValue
                                      placeholder="Search customers..."
                                      filterOption={false}
                                      onSearch={this.handleSearchClient}
                                      onPopupScroll={this.handlePopupScroll}
                                      onChange={this.handleClientChange}
                                      notFoundContent={loading ? <Spin size="small" /> : null}
                                      style={{ width: "100%" }}
                                      className="custom-select"
                                    >
                                      {clients.map((client) => (
                                        <Option key={client.id} value={client.id}>
                                          {client.name}
                                        </Option>
                                      ))}
                                    </Select>
                                  </Form.Group>
                                </Col>

                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="fw-semibold mb-2">New Customer</Form.Label>
                                    <Button
                                      variant="outline-success"
                                      size="sm"
                                      onClick={() => this.toggleAddClient()}
                                      className="w-100"
                                      style={{ height: "32px" }}
                                    >
                                      <i className="fas fa-user-plus me-2"></i>
                                      Add New Customer
                                    </Button>
                                  </Form.Group>
                                </Col>

                                
                              </Row>
                              <Row>
                                <Col md={4} className="pt-2">
                                  <Form.Group>
                                    <Form.Label className="fw-semibold mb-2">Payment Method</Form.Label>
                                    <Form.Select
                                      required
                                      name="payment_mode"
                                      value={payment_mode}
                                      onChange={(e) => this.onChange(e.target.value, "payment_mode")}
                                      style={{ height: "32px", fontSize: "14px" }}
                                      className="form-select-sm"
                                    >
                                      <option value="">Select payment method</option>
                                      <option value="cash">💵 Cash</option>
                                      <option value="card">💳 Card</option>
                                      <option value="transfer">🏦 Bank Transfer</option>
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                              </Row>
                            </div>

                            {/* Payment Amount & Checkout */}
                            <div className="p-3">
                              <Row className="align-items-end">
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label className="fw-semibold mb-2">
                                      <i className="fas fa-money-bill-wave me-2"></i>
                                      Amount Received
                                    </Form.Label>
                                    <InputNumber
                                      style={{
                                        width: "100%",
                                        height: "45px",
                                        borderRadius: "8px",
                                        fontSize: "16px"
                                      }}
                                      formatter={(value) =>
                                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                      }
                                      parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                      onKeyPress={(event) => {
                                        if (!/[0-9]/.test(event.key)) {
                                          event.preventDefault();
                                        }
                                      }}
                                      onChange={(e) => this.onChange(e, "amount_paid")}
                                      placeholder="Enter amount received"
                                    />
                                  </Form.Group>
                                </Col>

                                <Col md={6}>
                                  <Button
                                    variant="success"
                                    size="lg"
                                    disabled={saving}
                                    onClick={this.onSaveSales}
                                    className="w-100"
                                    style={{
                                      height: "45px",
                                      borderRadius: "8px",
                                      fontWeight: "600",
                                      boxShadow: "0 2px 4px rgba(40,167,69,0.3)"
                                    }}
                                  >
                                    {saving ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <i className="fas fa-cash-register me-2"></i>
                                        Complete Sale
                                      </>
                                    )}
                                  </Button>
                                </Col>
                              </Row>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Sale Completed Message */
                      <div className="text-center py-5">
                        <div className="success-animation mb-4">
                          <i className="fas fa-check-circle fa-4x text-success"></i>
                        </div>
                        <h4 className="text-success mb-3">Sale Completed Successfully!</h4>
                        <p className="text-muted mb-4">
                          The transaction has been processed. You can now print the invoice using the button above.
                        </p>
                        <div className="alert alert-success d-inline-block">
                          <i className="fas fa-print me-2"></i>
                          Ready to print invoice
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #f1f1f1;
                  border-radius: 3px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #c1c1c1;
                  border-radius: 3px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #a8a8a8;
                }
                
                .product-meta .badge {
                  font-size: 0.75em;
                }
                
                .cart-total .badge {
                  font-size: 1rem !important;
                }
                
                .quantity-controls {
                  flex-wrap: wrap;
                }
                
                .success-animation {
                  animation: bounceIn 0.6s ease-out;
                }
                
                @keyframes bounceIn {
                  0% {
                    opacity: 0;
                    transform: scale(0.3);
                  }
                  50% {
                    opacity: 1;
                    transform: scale(1.05);
                  }
                  70% {
                    transform: scale(0.9);
                  }
                  100% {
                    opacity: 1;
                    transform: scale(1);
                  }
                }
                
                .table-hover tbody tr:hover {
                  background-color: rgba(0,123,255,0.05);
                }
              `}</style>
            <Row></Row>
          </Card>
        </div>
      </>
    );
  }
}

export default PosOrderIndex;
