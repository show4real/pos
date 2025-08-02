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
  Modal,
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
import { getAllClients, getInvoiceId, addClient } from "../../services/invoiceService";
import moment from "moment";
import { InputNumber } from "antd";
import { getClients } from "../../services/clientService";
import TransactionPrintComponent from "./TransactionPrintComponent";

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
      delivery_fee: 0,
      discount_percent: 0,
      discount: 0,
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
      // Modal states
      showCustomerModal: false,
      addClient: false,
      selectedClientName: "",
    };

    this.searchDebounced = debounce(this.getPurchaseOrders, 500);
    this.searchThrottled = throttle(this.getPurchaseOrders, 500);
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    this.getPurchaseOrders();
    this.getCompany();
    this.getClients();
    this.getInvoiceId();

    const savedCartItem = JSON.parse(localStorage.getItem("cartItem")) || [];
    this.setState({ cartItem: savedCartItem });

    window.addEventListener("keydown", this.handleKeyPress);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyPress);
  }

  handleKeyPress = (e) => {
    const { showCustomerModal, addClient } = this.state;
    const activeElement = document.activeElement;
    const tag = activeElement.tagName;

    // Don't interfere with typing when modals are open (state check)
    if (showCustomerModal || addClient) {
      return;
    }

    // Always allow typing in input fields or textareas
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
      return;
    }

    // Check if active element is inside any modal (Bootstrap or Reactstrap)
    const isInBootstrapModal = activeElement.closest('.modal') !== null;
    const isInReactstrapModal = activeElement.closest('.modal-dialog') !== null;
    const isInAnyModal = isInBootstrapModal || isInReactstrapModal;
    
    if (isInAnyModal) {
      return;
    }

    // Check for any modal backdrop
    const hasModalBackdrop = document.querySelector('.modal-backdrop') !== null;
    if (hasModalBackdrop) {
      return;
    }

    // Check for Reactstrap modal overlay
    const hasReactstrapOverlay = document.querySelector('.modal.fade.show') !== null;
    if (hasReactstrapOverlay) {
      return;
    }

    // Check if any modal is currently visible in the DOM
    const visibleModals = document.querySelectorAll('.modal[style*="display: block"], .modal.show, .modal.fade.show');
    if (visibleModals.length > 0) {
      return;
    }

    // Only proceed with global search if no modals are detected and not in input field
    if (this.inputRef.current && !this.inputRef.current.matches(':focus')) {
      this.inputRef.current.focus();
    }

    if (/^[a-zA-Z0-9]$/.test(e.key)) {
      this.setState((prev) => ({
        input: (prev.input || '') + e.key,
      }));
    }

    if (e.key === "Enter") {
      console.log("Submitted input:", this.state.input);
      this.setState({ input: "" });
    }
  };

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
    if (selected) {
      this.setState({
        client_id: selected.value,
        selectedClientName: selected.label
      });
    }
  };

  // Add new method to handle clearing the selection
  handleClientClear = () => {
    this.setState({
      client_id: "",
      selectedClientName: "",
      search_client: "",
      clients: [], // Clear the current clients list
      page: 1, // Reset pagination
      hasMore: true
    }, () => {
      // Reload all clients when cleared
      this.getClients();
    });
  };


  getInvoiceId = () => {
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

  // Modal control methods
  toggleCustomerModal = () => {
    this.setState({ showCustomerModal: !this.state.showCustomerModal });
  };

  toggleAddClient = () => {
    this.setState({ addClient: !this.state.addClient });
  };

  // Updated method to handle opening checkout modal
  handleCheckoutClick = () => {
    const { cartItem } = this.state;
    
    if (cartItem.length === 0) {
      this.showToastError("Please add items to cart first");
      return;
    }
    
    let check_quantity =
      cartItem.some((ele) => ele.quantity === 0) ||
      cartItem.some((ele) => ele.quantity === undefined);

    if (check_quantity) {
      this.showToastError("Please Select Quantity for all items");
      return;
    }

    // Open the customer modal
    this.toggleCustomerModal();
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
    this.setState({ [state]: e }, () => {
      // Recalculate discount when discount_percent changes
      if (state === 'discount_percent') {
        this.calculateDiscount();
      }
    });
  };

  // New method to calculate discount
  calculateDiscount = () => {
    const { cartItem, discount_percent } = this.state;
    let subtotal = 0;
    
    for (let i = 0; i < cartItem.length; i += 1) {
      subtotal += cartItem[i].quantity !== 0
        ? cartItem[i].quantity * cartItem[i].order.unit_selling_price
        : 0;
    }
    
    const calculatedDiscount = (subtotal * discount_percent) / 100;
    this.setState({ discount: calculatedDiscount });
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

    this.setState({ cartItem: items }, () => {
      this.updateCartItemInLocalStorage();
      this.calculateDiscount(); // Recalculate discount when cart changes
    });
  }

  decrementCount(item, index) {
    // index will be the key value
    const items = this.state.cartItem;
    if (item.quantity > 1) {
      item.quantity -= 1;
    }
    items.splice(index, 1, item);
    this.setState({ cartItem: items }, () => {
      this.updateCartItemInLocalStorage();
      this.calculateDiscount(); // Recalculate discount when cart changes
    });
  }

  showToastError = (msg) => {
    toast(<div style={{ padding: 20, color: "red" }}>*{msg}</div>);
  };

  onSaveSales = async (e) => {
    e.preventDefault();
    await toast.dismiss();
    const { cartItem, company, payment_mode, amount_paid, client_id, delivery_fee } =
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
    this.setState({ cartItem: list }, () => {
      this.updateCartItemInLocalStorage();
      this.calculateDiscount(); // Recalculate discount when item is removed
    });
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
      delivery_fee,
      discount,
      discount_percent
    } = this.state;
    
    addSales({
      cart_items: cartItem,
      payment_mode: payment_mode,
      tracking_id: cartItem.tracking_id,
      amount_paid: amount_paid,
      delivery_fee: delivery_fee,
      discount: discount,
      discount_percent: discount_percent,
      client_id: client_id,
      due_date: due_date,
      invoice_no: invoice_no,
      total_purchase: total_purchase,
    }).then(
      (res) => {
        this.setState({ 
          loading: false, 
          saving: false,
          showCustomerModal: false // Close modal after successful save
        });

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
        this.setState({ loading: false, saving: false });
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

  // Updated totalCartP method to include discount calculation
  totalCartP() {
    const { cartItem, delivery_fee, discount } = this.state;
    let sum = 0;
    
    for (let i = 0; i < cartItem.length; i += 1) {
      sum +=
        cartItem[i].quantity !== 0
          ? cartItem[i].quantity * cartItem[i].order.unit_selling_price
          : 0 * cartItem[i].order.unit_selling_price;
    }
    
    const finalTotal = sum + delivery_fee - discount;
    return this.formatCurrency(finalTotal);
  }

  // Method to get subtotal (before delivery fee and discount)
  getSubtotal() {
    const { cartItem } = this.state;
    let sum = 0;
    
    for (let i = 0; i < cartItem.length; i += 1) {
      sum +=
        cartItem[i].quantity !== 0
          ? cartItem[i].quantity * cartItem[i].order.unit_selling_price
          : 0 * cartItem[i].order.unit_selling_price;
    }
    
    return sum;
  }

  clearCart = () => {
    this.setState({ 
      cartItem: [], 
      cart_details: [],
      discount: 0,
      discount_percent: 0,
      delivery_fee:0
    }, () => {
      localStorage.removeItem("cartItem");
      localStorage.removeItem("cart_details");
    });
  };

  clearSearch = () => {
    this.setState({ search: "" }, () => {
      const val = this.state.search;
      if (val.length < 5) {
        this.searchThrottled(val);
      } else {
        this.searchDebounced(val);
      }
    });
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

    this.setState({ cartItem: items }, () => {
      this.updateCartItemInLocalStorage();
      this.calculateDiscount(); // Recalculate discount when item is added
    });

    this.setState({ search: "" }, () => {
      if (this.state.search < 5) {
        this.searchThrottled(this.state.search);
      } else {
        this.searchDebounced(this.state.search);
      }
    });
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
      () => {
        this.updateCartItemInLocalStorage();
        this.calculateDiscount(); // Recalculate discount when price changes
      }
    );
  };

  handlePrint = () => {
    const printContent = document.querySelector('.print-container');
    const originalContent = document.body.innerHTML;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Transaction Receipt</title>
          <style>
            @media print {
              body { margin: 0; }
              .print-content { display: block !important; }
            }
            @page {
              size: A4;
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  formatNumber = (number) => {
    if (number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  };

  // Method to handle successful client addition
  handleSaveNewClient = () => {
    const { newClientName, newClientEmail, newClientPhone, newClientCompany, newClientAddress } = this.state;
    
    if (!newClientName || newClientName.trim() === '') {
      this.showToastError("Customer name is required");
      return;
    }

    this.setState({ savingClient: true });

    // Import addClient from services
    addClient({
      name: newClientName,
      email: newClientEmail || '',
      phone: newClientPhone || '',
      company_name: newClientCompany || '',
      address: newClientAddress || ''
    }).then(
      (res) => {
        this.setState({ 
          savingClient: false,
          addClient: false,
          // Clear form
          newClientName: '',
          newClientEmail: '',
          newClientPhone: '',
          newClientCompany: '',
          newClientAddress: '',
          // Set the newly created client as selected
          client_id: res.client.id
        });
        
        this.showToast("Customer added successfully");
        this.getClients(); // Refresh clients list
      },
      (error) => {
        this.setState({ savingClient: false });
        this.showToastError("Failed to add customer. Please try again.");
        console.error(error);
      }
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
      delivery_fee,
      discount,
      discount_percent,
      showCustomerModal
    } = this.state;

    var p_mode = pos_items.map(function (p) {
      return p.payment_mode;
    });
    var transaction_date_time = pos_items.map(function (p) {
      return p.created_at;
    });
    var cashier_name = pos_items.map(function (p) {
      return p.cashier_name;
    });
    const transaction_total = pos_items
      .map((p) => p.selling_price * p.qty_sold)
      .reduce((prev, curr) => prev + curr, 0);

    const subtotal = this.getSubtotal();

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
              delivery_fee={delivery_fee}
              discount={discount}
              discount_percent={discount_percent}
              user={user}
              ref={(el) => (this.componentRef = el)}
              toggle={() => this.setState({ invoice: {} })}
            />
          </div>
        )}
        
        <TransactionPrintComponent
          transaction_detail={pos_items}
          company={company}
          invoice_data={invoice}
          transaction_id={invoice.transaction_id}
          transaction_date_time={transaction_date_time[0]}
          payment_mode={p_mode[0]}
          cashier_name={cashier_name[0]}
          transaction_total={transaction_total + delivery_fee - discount}
          balance={invoice.balance}
          prev_balance={prev_balance}
          total_balance={total_balance}
          delivery_fee={delivery_fee}
          discount={discount}
          discount_percent={discount_percent}
          formatNumber={this.formatNumber}
        />

        {/* Customer Details Modal */}
        <Modal 
          show={showCustomerModal} 
          onHide={this.toggleCustomerModal} 
          size="xl"
          centered
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-user-circle me-2"></i>
              Complete Your Sale
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              {/* Left Column - Customer Details */}
              <Col md={addClient ? 6 : 12}>
                <Form onSubmit={this.onSaveSales}>
                  <h6 className="mb-3 fw-semibold text-muted">
                    <i className="fas fa-info-circle me-2"></i>
                    Customer & Payment Details
                  </h6>
                  
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold mb-2">
                          <i className="fas fa-user me-2"></i>
                          Select Customer *
                        </Form.Label>
                        <Select
                          showSearch
                          labelInValue
                          allowClear
                          placeholder="Search customers..."
                          filterOption={false}
                          onSearch={this.handleSearchClient}
                          onPopupScroll={this.handlePopupScroll}
                          onChange={this.handleClientChange}
                          onClear={this.handleClientClear}
                          notFoundContent={loading ? <Spin size="small" /> : null}
                          style={{ width: "100%", height: "45px" }}
                          className="custom-select"
                          value={this.state.client_id ? { 
                            value: this.state.client_id, 
                            label: this.state.selectedClientName || 'Select Customer' 
                          } : undefined}
                        >
                          {clients.map((client) => (
                            <Option key={client.id} value={client.id}>
                              {client.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold mb-2">
                          <i className="fas fa-plus me-2"></i>
                          New Customer
                        </Form.Label>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={this.toggleAddClient}
                          className="w-100"
                          style={{ height: "45px" }}
                        >
                          <i className="fas fa-user-plus me-2"></i>
                          {addClient ? 'Cancel Add Customer' : 'Add New Customer'}
                        </Button>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold mb-2">
                          <i className="fas fa-credit-card me-2"></i>
                          Payment Method *
                        </Form.Label>
                        <Form.Select
                          required
                          name="payment_mode"
                          value={payment_mode}
                          onChange={(e) => this.onChange(e.target.value, "payment_mode")}
                          style={{ height: "45px", fontSize: "14px" }}
                        >
                          <option value="">Select payment method</option>
                          <option value="cash">💵 Cash</option>
                          <option value="card">💳 Card</option>
                          <option value="transfer">🏦 Bank Transfer</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

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
                      <Form.Group>
                        <Form.Label className="fw-semibold mb-2">
                          <i className="fas fa-truck me-2"></i>
                          Delivery Fee
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
                          onChange={(e) => this.onChange(e, "delivery_fee")}
                          placeholder="Enter delivery fee"
                          value={delivery_fee}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold mb-2">
                          <i className="fas fa-percentage me-2"></i>
                          Discount (%)
                        </Form.Label>
                        <InputNumber
                          style={{
                            width: "100%",
                            height: "45px",
                            borderRadius: "8px",
                            fontSize: "16px"
                          }}
                          min={0}
                          max={100}
                          formatter={(value) => `${value}%`}
                          parser={(value) => value.replace('%', '')}
                          onChange={(e) => this.onChange(e, "discount_percent")}
                          placeholder="Enter discount %"
                          value={discount_percent}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Order Summary */}
                  <div className="mt-4 p-3 border rounded bg-light">
                    <h6 className="mb-3 fw-semibold text-muted">
                      <i className="fas fa-calculator me-2"></i>
                      Order Summary
                    </h6>
                    <div className="order-summary">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span className="fw-semibold">{this.formatCurrency(subtotal)}</span>
                      </div>
                      
                      {discount_percent > 0 && (
                        <div className="d-flex justify-content-between mb-2 text-success">
                          <span>Discount ({discount_percent}%):</span>
                          <span className="fw-semibold">-{this.formatCurrency(discount)}</span>
                        </div>
                      )}
                      
                      {delivery_fee > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>Delivery Fee:</span>
                          <span className="fw-semibold">{this.formatCurrency(delivery_fee)}</span>
                        </div>
                      )}
                      
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between">
                        <span className="fw-bold fs-5">Total:</span>
                        <span className="fw-bold fs-5 text-success">{this.totalCartP()}</span>
                      </div>
                    </div>
                  </div>
                </Form>
              </Col>

              {/* Right Column - Add New Customer Form */}
              {addClient && (
                <Col md={6}>
                  <Card className="h-100 border-2 border-success">
                    <Card.Header className="bg-success text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-user-plus me-2"></i>
                        Add New Customer
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-3">
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold mb-2">
                              <i className="fas fa-user me-2"></i>
                              Customer Name *
                            </Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter customer name"
                              value={this.state.newClientName || ''}
                              onChange={(e) => this.setState({ newClientName: e.target.value })}
                              style={{ height: "45px" }}
                            />
                          </Form.Group>
                        </Col>

                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold mb-2">
                              <i className="fas fa-envelope me-2"></i>
                              Email Address
                            </Form.Label>
                            <Form.Control
                              type="email"
                              placeholder="Enter email address"
                              value={this.state.newClientEmail || ''}
                              onChange={(e) => this.setState({ newClientEmail: e.target.value })}
                              style={{ height: "45px" }}
                            />
                          </Form.Group>
                        </Col>

                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold mb-2">
                              <i className="fas fa-phone me-2"></i>
                              Phone Number
                            </Form.Label>
                            <Form.Control
                              type="tel"
                              placeholder="Enter phone number"
                              value={this.state.newClientPhone || ''}
                              onChange={(e) => this.setState({ newClientPhone: e.target.value })}
                              style={{ height: "45px" }}
                            />
                          </Form.Group>
                        </Col>

                        {/* <Col md={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold mb-2">
                              <i className="fas fa-building me-2"></i>
                              Company Name
                            </Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter company name"
                              value={this.state.newClientCompany || ''}
                              onChange={(e) => this.setState({ newClientCompany: e.target.value })}
                              style={{ height: "45px" }}
                            />
                          </Form.Group>
                        </Col>

                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold mb-2">
                              <i className="fas fa-map-marker-alt me-2"></i>
                              Address
                            </Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              placeholder="Enter customer address"
                              value={this.state.newClientAddress || ''}
                              onChange={(e) => this.setState({ newClientAddress: e.target.value })}
                            />
                          </Form.Group>
                        </Col> */}

                        <Col md={12}>
                          <Button
                            variant="success"
                            className="w-100"
                            onClick={this.handleSaveNewClient}
                            disabled={this.state.savingClient || !this.state.newClientName}
                            style={{ height: "45px" }}
                          >
                            {this.state.savingClient ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Saving Customer...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-save me-2"></i>
                                Save Customer
                              </>
                            )}
                          </Button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.toggleCustomerModal}>
              <i className="fas fa-times me-2"></i>
              Cancel
            </Button>
            <Button
              variant="success"
              disabled={saving}
              onClick={this.onSaveSales}
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
          </Modal.Footer>
        </Modal>

        {/* Add Client Modal */}
        {/* Removed - AddClient is now integrated within the customer modal */}

        {/* {loading && <SpinDiv text={"Loading..."} />} */}
        <div style={{ margin: 5 }}>
          <Row>
            
          </Row>
          <Row className="mb-2">
            <Col lg="12">
          

              {/* Stock summary cards */}
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
                          <div className="d-block" style={{ fontSize: 20 }}>Available  <h4 className="mb-1 text-primary fw-bold">
                         <a  href="/"> <i className="fas fa-cube me-2"></i></a>
                          Stock Inventory
                        </h4></div>
                          <span className="fw-bold text-success">{total} Items</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md={5}>
                    <div style={{ maxWidth: "100%", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <input
                          ref={this.inputRef}
                          id="show"
                          value={search}
                          onChange={this.handleSearch}
                          autoFocus
                          placeholder="Search for products using barcode scanner or type manually..."
                          style={{
                            flex: 1,
                            height: "55px",
                            padding: "0 12px",
                            fontSize: "16px",
                            border: "1px solid black",
                            borderTopLeftRadius: "5px",
                            borderBottomLeftRadius: "5px",
                            borderRight: search ? "none" : "1px solid #ccc",
                            outline: "none",
                          }}
                        />
                        {search && (
                          <button
                            onClick={this.clearSearch}
                            style={{
                              height: "55px",
                              width: "50px",
                              fontSize: "24px",
                              backgroundColor: "#f8f9fa",
                              border: "1px solid #ccc",
                              borderLeft: "none",
                              borderTopRightRadius: "5px",
                              borderBottomRightRadius: "5px",
                              cursor: "pointer",
                            }}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </div>
                  </Col>
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
                          <>
                          <ReactToPrint
                            trigger={() => (
                              <Button variant="outline-success" size="sm">
                                Print Invoice
                              </Button>
                            )}
                            content={() => this.componentRef}
                          />
                           <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={this.handlePrint}
                          >
                            <i className="fas fa-print me-2"></i>
                            Print A4 Receipt
                          </Button>
                          </>
                        )}
                      </ButtonGroup>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          <Card border="light" className="shadow-sm mb-4">
            <Row className="g-4">
              {/* Left Column - Product Inventory */}
              <Col md={6}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Header className="bg-primary text-white py-3">
                    <h5 className="mb-0">
                      <i className="fas fa-boxes me-2"></i>
                      Available Products
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div style={{ maxHeight: "700px", overflowY: "auto" }} className="custom-scrollbar">
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
                                      <div>
                                        <span className="badge bg-secondary me-2" style={{ fontSize: 15 }}>
                                          <i className="fas fa-barcode me-1"></i>
                                          Barcode {stock.barcode}
                                        </span>
                                      </div>
                                      <div className="product-meta" style={{ fontSize: 20 }}>
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
              <Col md={6}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Header className="bg-success text-white">
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
                        <div style={{ maxHeight: "600px", overflowY: "auto" }} className="custom-scrollbar">
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
                                        disabled={user.admin !== 1}
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

                        {/* Simplified Checkout Button */}
                        {cartItem.length > 0 && (
                          <div className="p-3 border-top bg-light">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <span className="fw-bold fs-5">Cart Total:</span>
                              <span className="fw-bold fs-4 text-success">{this.totalCartP()}</span>
                            </div>
                            <Button
                              variant="success"
                              size="lg"
                              onClick={this.handleCheckoutClick}
                              className="w-100"
                              style={{
                                height: "50px",
                                borderRadius: "8px",
                                fontWeight: "600",
                                boxShadow: "0 2px 4px rgba(40,167,69,0.3)"
                              }}
                            >
                              <i className="fas fa-arrow-right me-2"></i>
                              Proceed to Checkout
                            </Button>
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
                
                .modal-lg {
                  max-width: 800px;
                }
                
                .ant-select-selector {
                  height: 45px !important;
                  display: flex;
                  align-items: center;
                }
                
                .ant-input-number {
                  border-radius: 8px;
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