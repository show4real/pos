import React, { Component } from "react";
import { Input, Media } from "reactstrap";
import { getStock } from "../../services/purchaseOrderService";
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
import { addSales, editSales } from "../../services/posOrderService";
import ReactToPrint from "react-to-print";
import { Invoice } from "./Invoice";
import { getBranchStocks, getBranchStocks2 } from "../../services/stockService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import AddClient from "../clients/AddClient";
import moment from "moment";
import { InputNumber, Pagination, Select, Spin } from "antd";
import { getCompany } from "../../services/companyService";
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
      sales: [],
      clients: [],
      invoice_last_id: "",
      transaction_id: "",
      sold_at: "",
      created_at: "",
      products: [],
      total_cost: [],
      order: "",
      value: "",
      total: 0,
      total_cart: 0,
      close: false,
      cartItem: [],
      options: [],
      serials2: [],
      payment_mode: "",
      amount_paid: 0,
      client_id: "",
      selectedClient: { value: "", label: "" },
      total_purchase: 0,
      user: JSON.parse(localStorage.getItem("user")),
      company: {},
      due_date: moment().startOf("month"),
      invoice: {},
      pos_items: [],
      stock_pos_items: [],
      total_balance: 0,
      loading: false,
      invoice_id: props.match.params.id,
      prev_balance: 0,
    };

    this.searchDebounced = debounce(this.getPurchaseOrders, 500);
    this.searchThrottled = throttle(this.getPurchaseOrders, 500);
  }

  componentDidMount() {
    this.getPurchaseOrders();
    this.getClients();
    this.getCompany();
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

  getCompany = () => {
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

  handleClientChange = (selected) => {
    this.setState({
      selectedClient: selected,
      client_id: selected.value,
    });
  };

  toggleAddClient = () => {
    this.setState({ addClient: !this.state.addClient });
  };

  onChange = (e, state) => {
    this.setState({ [state]: e });
  };

  incrementCount(item, index) {
    const items = this.state.cartItem;
    console.log(items);
    let inStock =
      item.stock_quantity - item.quantity_sold - item.quantity_returned;
    if (item.quantity < inStock) {
      item.quantity = Number(item.quantity) + 1;
      console.log(item.quantity);
    }
    items.splice(index, 1, item);
    this.setState({ cartItem: items });
  }

  decrementCount(item, index) {
    const items = this.state.cartItem;
    if (item.quantity > 1) {
      item.quantity -= 1;
    }
    items.splice(index, 1, item);

    this.setState({ cartItem: items });
  }

  showToastError = (msg) => {
    toast(<div style={{ padding: 20, color: "red" }}>*{msg}</div>);
  };

  onSaveSales = async (e) => {
    e.preventDefault();
    await toast.dismiss();
    const { cartItem, payment_mode, amount_paid, client_id } = this.state;
    console.log(client_id);

    let check_qty =
      cartItem.some((ele) => ele.quantity === 0) ||
      cartItem.some((ele) => ele.quantity === undefined);

    toast.dismiss();
    toast.configure({ hideProgressBar: true, closeButton: false });

    if (check_qty) {
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
    this.setState({ cartItem: list });
  }

  saveSales = () => {
    this.setState({ loading: true, saving: true });

    const {
      cartItem,
      payment_mode,
      total_purchase,
      client_id,
      due_date,
      amount_paid,
      invoice_id,
    } = this.state;
    editSales({
      cart_items: cartItem,
      payment_mode: payment_mode,
      tracking_id: cartItem.tracking_id,
      amount_paid: amount_paid,
      client_id: client_id,
      due_date: due_date,
      total_purchase: total_purchase,
      invoice_id: invoice_id,
    }).then(
      (res) => {
        this.setState({ loading: false, saving: false });

        this.setState({
          sales: res.pos_items,
          transaction_id: res.pos_order.transaction_id,
          invoice: res.invoice,
          pos_items: res.pos_items,
          total_balance: res.total_balance,
          prev_balance: res.prev_balance,
          cartItem: [],
        });

        this.showToast("Sales has been created");
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

  totalCartP() {
    const { cartItem, company } = this.state;
    let sum = 0;
    for (let i = 0; i < cartItem.length; i += 1) {
      sum +=
        cartItem[i].quantity !== 0
          ? cartItem[i].quantity * cartItem[i].order.unit_selling_price
          : 0 * cartItem[i].order.unit_selling_price;
    }
    console.log(cartItem);
    return this.formatCurrency(sum);
  }

  clearCart() {
    this.setState({
      cartItem: [],
      sales: [],
    });
    this.getPurchaseOrders();
  }

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "success" }}>{msg}</div>);
  };

  onPage = async (page, rows) => {
    await this.setState({ page, rows });
    await this.getPurchaseOrders();
  };

  updateCartItemInLocalStorage = () => {
    localStorage.setItem("cartItem", JSON.stringify(this.state.cartItem));
  };

  getPurchaseOrders = () => {
    const { page, rows, order, search, invoice_id } = this.state;

    this.setState({ loading: true });
    getBranchStocks2({ page, rows, order, search, invoice_id }).then(
      (res) => {
        this.setState({
          loading: false,
          stocks: res.stocks.data,
          cartItem: res.sold_stocks,
          amount_paid: res.prev_invoice.amount_paid,
          payment_mode: res.prev_invoice.payment_mode,
          client_id: res.prev_invoice.client_id,
          selectedClient: {
            value: res.prev_invoice.client_id,
            label: res.prev_invoice.client_name,
          },
          total_cost: 0,
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

  onFilter = async (e, filter) => {
    console.log(filter);
    await this.setState({ [filter]: e });
    await this.getPurchaseOrders();
  };

  toggleAddToCart = (addToCart) => {
    var items = this.state.cartItem === null ? [] : [...this.state.cartItem];
    items.push(addToCart);
    this.setState({ cartItem: items });
  };

  inCart = (cartId) => {
    let inCartIds = this.state.cartItem;

    if (inCartIds !== null) {
      var result = inCartIds.map((stock, key) => {
        return stock.id;
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

    this.setState({ cartItem: updatedCartItems });
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
      sales,
      pos_items,
      total_balance,
      invoice,
      user,
      saving,
      loading,
      selectedClient,
      amount_paid,
      prev_balance,
    } = this.state;
    return (
      <>
        {sales && (
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

        <div className="p-3">
          {/* Header with Breadcrumb */}
          <Row className="mb-4">
            <Col lg="12">
              <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4 border-bottom">
                <div className="d-block mb-4 mb-md-0">
                  <Breadcrumb listProps={{ className: "breadcrumb-text-dark text-primary mb-0" }}>
                    <Breadcrumb.Item href="/" className="text-muted">Home</Breadcrumb.Item>
                    <Breadcrumb.Item href="/invoices" className="text-muted">Invoices</Breadcrumb.Item>
                    <Breadcrumb.Item href="/pos" className="text-primary fw-semibold">New POS</Breadcrumb.Item>
                  </Breadcrumb>
                </div>
              </div>
            </Col>
          </Row>

          {/* Stock Count Header */}
          <Row className="mb-3">
            <Col lg="7">
              <div className="d-flex align-items-center">
                <h4 className="mb-0 me-3">Available Stocks</h4>
                <span className="badge bg-primary rounded-pill fs-6">({total})</span>
              </div>
            </Col>
          </Row>

          {/* Main POS Interface Card */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              {/* Top Controls Row */}
              <Row className="mb-4 align-items-center">
                <Col md={8}>
                  <Row>
                    <Col md="6">
                      <div className="input-group">
                        <Input
                          placeholder="Search products..."
                          className="form-control"
                          value={search}
                          onChange={this.handleSearch}
                          autoFocus
                        />
                        <Button variant="secondary" className="btn-icon">
                          <i className="fa fa-search" />
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Col>
                <Col md={4}>
                  <div className="d-flex justify-content-end gap-2 flex-wrap">
                    {cartItem !== null && cartItem.length > 0 && (
                      <>
                        <Button variant="outline-success" size="sm" className="d-flex align-items-center gap-2">
                          <i className="fa fa-shopping-cart" />
                          Cart ({cartItem.length})
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => this.clearCart()}
                          className="d-flex align-items-center gap-2"
                        >
                          <i className="fa fa-trash" />
                          Clear Cart
                        </Button>
                      </>
                    )}
                    {sales.length > 0 && (
                      <ReactToPrint
                        trigger={() => (
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="d-flex align-items-center gap-2"
                          >
                            <i className="fa fa-print" />
                            Print Invoice
                          </Button>
                        )}
                        content={() => this.componentRef}
                      />
                    )}
                  </div>
                </Col>
              </Row>

              {/* Two-Column Layout */}
              <Row>
                {/* Left Column - Product List */}
                <Col md={6}>
                  <Card className="h-100 border">
                    <Card.Header className="bg-primary text-white">
                      <h6 className="mb-0 fw-semibold">Available Products</h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                        <Table className="table-hover mb-0">
                          <thead className="bg-light sticky-top">
                            <tr>
                              <th className="border-0 py-3 px-4 fw-semibold">Product Details</th>
                              <th className="border-0 py-3 px-4 fw-semibold">Price</th>
                              <th className="border-0 py-3 px-4 fw-semibold">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stocks
                              .filter((stock) => stock.in_stock > 0)
                              .map((stock, key) => {
                                const alreadyAdded = this.inCart(stock.id);
                                return (
                                  <tr key={key} className="border-bottom">
                                    <td className="py-3 px-4">
                                      <div>
                                        <div className="fw-bold text-dark mb-2">{stock.product_name}</div>
                                        <div className="small text-muted">
                                          <div className="mb-1">
                                            <span className="fw-semibold">Code:</span> {stock.tracking}
                                          </div>
                                          <div className="mb-1">
                                            <span className="fw-semibold text-success">In Stock:</span>
                                            <span className="fw-bold text-success ms-1">{stock.in_stock}</span>
                                          </div>
                                          <div>
                                            <span className="fw-semibold text-info">Total Stock:</span>
                                            <span className="fw-bold text-info ms-1">{stock.stock_quantity}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="fw-bold fs-6 text-success">
                                        {this.formatCurrency(stock.order.fixed_price)}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      {stock.in_stock <= 0 ? (
                                        <Button disabled variant="secondary" size="sm" className="d-flex align-items-center gap-2">
                                          <i className="fa fa-ban" />
                                          Out of Stock
                                        </Button>
                                      ) : alreadyAdded === false ? (
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() => this.toggleAddToCart(stock)}
                                          className="d-flex align-items-center gap-2"
                                        >
                                          <FontAwesomeIcon icon={faPlus} />
                                          Add
                                        </Button>
                                      ) : (
                                        <Button variant="success" size="sm" disabled className="d-flex align-items-center gap-2">
                                          <FontAwesomeIcon icon={faCheck} />
                                          Added
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </Table>
                      </div>

                      {/* Pagination Footer */}
                      <div className="px-4 py-3 bg-light border-top">
                        {stocks.filter((stock) => stock.in_stock > 0).length > 0 ? (
                          <Pagination
                            showSizeChanger
                            defaultCurrent={6}
                            total={total}
                            showTotal={(total) => `Total ${total} products available`}
                            onChange={this.onPage}
                            pageSize={rows}
                            current={page}
                          />
                        ) : (
                          <div className="text-center py-3">
                            <div className="text-muted">
                              <i className="fa fa-inbox fa-2x mb-3 d-block" />
                              <h6 className="mb-2">No Products Available</h6>
                              <p className="mb-0 small">No products found in stock</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Right Column - Cart & Checkout */}
                <Col md={6}>
                  <Card className="h-100 border">
                    <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-semibold">Shopping Cart</h6>
                      {cartItem.length > 0 && (
                        <div className="fs-5 fw-bold">
                          Total: {this.totalCartP()}
                        </div>
                      )}
                    </Card.Header>
                    <Card.Body className="p-0">
                      {sales.length === 0 ? (
                        <>
                          {/* Cart Items */}
                          <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                            <Table className="table-hover mb-0">
                              <thead className="bg-light sticky-top">
                                <tr>
                                  <th className="border-0 py-2 px-3 fw-semibold">Product</th>
                                  <th className="border-0 py-2 px-3 fw-semibold">Price</th>
                                  <th className="border-0 py-2 px-3 fw-semibold">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cartItem.map((sale, key) => (
                                  <tr key={key} className="border-bottom">
                                    <td className="py-3 px-3">
                                      <div>
                                        <div className="fw-bold text-dark mb-2">
                                          {sale.product_name} × {sale.quantity}
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => this.removeFromCart(key)}
                                            title="Remove from cart"
                                          >
                                            <i className="fa fa-trash" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            onClick={() => this.decrementCount(sale, key)}
                                          >
                                            -
                                          </Button>
                                          <span className="fw-bold px-2">{sale.quantity}</span>
                                          <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            onClick={() => this.incrementCount(sale, key)}
                                          >
                                            +
                                          </Button>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-3">
                                      <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        style={{ width: "80px", fontSize: "14px" }}
                                        onKeyPress={(event) => {
                                          if (!/[0-9]/.test(event.key)) {
                                            event.preventDefault();
                                          }
                                        }}
                                        value={sale.order.unit_selling_price}
                                        onChange={(event) => this.handlePriceChange(event, key)}
                                      />
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className="fw-bold text-success">
                                        {this.formatCurrency(sale.quantity * sale.order.unit_selling_price)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>

                          {/* Checkout Form */}
                          <div className="p-4 bg-light">
                            {/* Client Selection */}
                            <Card className="border mb-3">
                              <Card.Body>
                                <Row>
                                  <Col md={6} className="mb-3">
                                    <Form.Group>
                                      <Form.Label className="fw-semibold">Select Client</Form.Label>
                                      <Select
                                        showSearch
                                        labelInValue
                                        placeholder="Search clients..."
                                        filterOption={false}
                                        onSearch={this.handleSearchClient}
                                        onPopupScroll={this.handlePopupScroll}
                                        onChange={this.handleClientChange}
                                        notFoundContent={loading ? <Spin size="small" /> : null}
                                        style={{ width: "100%" }}
                                        value={selectedClient}
                                      >
                                        {clients.map((client) => (
                                          <Option key={client.id} value={client.id} label={client.name}>
                                            {client.name}
                                          </Option>
                                        ))}
                                      </Select>
                                    </Form.Group>
                                  </Col>
                                  <Col md={6} className="mb-3 d-flex align-items-end">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => this.toggleAddClient()}
                                      className="d-flex align-items-center gap-2"
                                    >
                                      <i className="fa fa-plus" />
                                      New Client
                                    </Button>
                                  </Col>
                                </Row>

                                <Row>
                                  <Col md={12}>
                                    <Form.Group>
                                      <Form.Label className="fw-semibold">Payment Method</Form.Label>
                                      <Form.Select
                                        required
                                        name="payment_mode"
                                        value={payment_mode}
                                        onChange={(e) => this.onChange(e.target.value, "payment_mode")}
                                        className="form-select"
                                      >
                                        <option value="">Select payment method</option>
                                        <option value="cash">💰 Cash</option>
                                        <option value="card">💳 Card</option>
                                        <option value="transfer">🏦 Bank Transfer</option>
                                      </Form.Select>
                                    </Form.Group>
                                  </Col>
                                </Row>
                              </Card.Body>
                            </Card>

                            {/* Payment & Checkout */}
                            {cartItem.length > 0 && (
                              <Card className="border">
                                <Card.Body>
                                  <Row className="align-items-end">
                                    <Col md={6} className="mb-3">
                                      <Form.Group>
                                        <Form.Label className="fw-semibold">Amount Received</Form.Label>
                                        <InputNumber
                                          style={{
                                            width: "100%",
                                            height: 40,
                                            fontSize: 16,
                                          }}
                                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                          onKeyPress={(event) => {
                                            if (!/[0-9]/.test(event.key)) {
                                              event.preventDefault();
                                            }
                                          }}
                                          value={amount_paid}
                                          onChange={(e) => this.onChange(e, "amount_paid")}
                                          placeholder="Enter amount received"
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                      <div className="d-grid">
                                        <Button
                                          variant="success"
                                          size="lg"
                                          type="submit"
                                          disabled={saving || cartItem.length === 0}
                                          onClick={this.onSaveSales}
                                          className="d-flex align-items-center justify-content-center gap-2"
                                        >
                                          {saving ? (
                                            <>
                                              <i className="fa fa-spinner fa-spin" />
                                              Processing...
                                            </>
                                          ) : (
                                            <>
                                              <i className="fa fa-check" />
                                              Checkout
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </Col>
                                  </Row>
                                </Card.Body>
                              </Card>
                            )}
                          </div>
                        </>
                      ) : (
                        /* Success Message */
                        <div className="p-5 text-center">
                          <div className="mb-4">
                            <i className="fa fa-check-circle fa-4x text-success mb-3" />
                            <h4 className="text-success fw-bold mb-3">Sale Completed Successfully!</h4>
                            <p className="text-muted">
                              Your transaction has been processed. You can print the invoice using the button above.
                            </p>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      </>
    );
  }
}

export default PosOrderIndex;
