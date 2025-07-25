import React, { Component } from "react";
import {
  Col,
  Row,
  Nav,
  Card,
  Table,
  Form,
  Button,
  ButtonGroup,
  Breadcrumb,
  InputGroup,
  Dropdown,
} from "@themesberg/react-bootstrap";
import { FormGroup, CardHeader, Media, Input, Modal } from "reactstrap";
import Select from "react-select";
import {
  faEnvelope,
  faPhone,
  faLock,
  faPencilAlt,
  faAddressCard,
  faUnlockAlt,
  faEyeSlash,
  faEye,
  faLocationArrow,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SpinDiv from "../components/SpinDiv";
import { toast } from "react-toastify";
import axios from "axios";
import settings from "../../services/settings";
import { authHeader } from "../../services/authHeader";
import { authService } from "../../services/authService";
import AddClient from "../clients/AddClient";
import AddPayment from "./AddPayment";
import EditPayment from "./EditPayment";
import ReactDatetime from "react-datetime";
import moment from "moment";
import {
  getClients,
  getInvoiceId,
  getInvoice,
} from "../../services/invoiceService";
import { currencies } from "./Currency";
import Invoice from "./Invoice";
import Invoice2 from "./Invoice2";
import ReactToPrint from "react-to-print";
import { InputNumber } from "antd";

export class EditInvoice extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      search: "",
      validation: {},
      show: false,
      edit: false,
      submitted: false,
      invoice: [],
      items: [],
      user: JSON.parse(localStorage.getItem("user")),
      company: JSON.parse(localStorage.getItem("company")),
      pos_items: [],
      payments: [],
      total_amount: 0,
      total_balance: 0,
      previous_payment: 0,
      balance: 0,
      english_ordinal_rules: new Intl.PluralRules("en", { type: "ordinal" }),
      suffixes: { one: "st", two: "nd", few: "rd", other: "th" },

      id: props.match.params.id,
      clients: [],
      currencies: [],
      hideNav: false,
      prev_balance: 0,
    };
  }

  componentDidMount() {
    toast.configure({ hideProgressBar: true, closeButton: false });
    window.addEventListener("resize", this.resize.bind(this));
    this.resize();
    this.getInvoice();
    this.getClients();
    this.getBalance();
  }

  resize() {
    this.setState({ hideNav: window.innerWidth <= 760 });
  }

  ordinal(number) {
    const { suffixes, english_ordinal_rules } = this.state;
    const suffix = suffixes[english_ordinal_rules.select(number)];
    return number + suffix;
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resize.bind(this));
  }

  getClients = () => {
    //this.setState({loading:true})

    getClients().then(
      (res) => {
        this.setState({
          clients: res.clients.data,
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  onSaveInvoice = async (e) => {
    e.preventDefault();
    await toast.dismiss();
    const { invoice, payments, items, validation } = this.state;
    const {
      invoice_no,
      description,
      purchase_order_no,
      amount_paid,
      client_id,
      cashier_id,
      currency,
      due_date,
      issued_date,
    } = invoice;

    this.setState({ submitted: true });
    let check_payment = amount_paid > this.totalCost();
    // let check_name = items.some(ele => ele.name === '');
    // let check_name_length = items.some(ele => ele.name.length > 24);
    let check_description = items.some((ele) => ele.description === "");
    let check_quantity =
      items.some((ele) => ele.quantity === 0) ||
      items.some((ele) => ele.quantity === "");
    let check_rate =
      items.some((ele) => ele.rate === 0) ||
      items.some((ele) => ele.rate === "");

    await this.setState({
      validation: {
        ...validation,
        invoice_no: invoice_no !== "",
        client_id: client_id !== "",
        due_date: due_date !== "",
        currency: currency !== "",
        issued_date: issued_date !== "",
        amount_paid: amount_paid !== "",
        // purchase_order_no: purchase_order_no !== ''
      },
    });
    if (
      Object.values(this.state.validation).every(Boolean) &&
      !check_payment &&
      !check_description &&
      !check_rate &&
      !check_quantity
    ) {
      this.setState({ submitted: false });
      this.saveInvoice();
    } else {
      const errors = Object.keys(this.state.validation).filter((id) => {
        return !this.state.validation[id];
      });
      await setTimeout(
        () =>
          toast.error(
            <div style={{ padding: "10px 20px" }}>
              <p style={{ margin: 0, fontWeight: "bold", color: "white" }}>
                Errors:
              </p>
              {errors.map((v) => (
                <p key={v} style={{ margin: 0, fontSize: 14, color: "white" }}>
                  * {this.validationRules(v)}
                </p>
              ))}
            </div>
          ),
        250
      );
    }
  };

  validationRules = (field) => {
    if (field === "invoice_no") {
      return "Invoice number is required";
    } else if (field === "issued_date") {
      return "Issue date is required";
    } else if (field === "due_date") {
      return "Due date is required";
    } else if (field === "client_id") {
      return "Client is required";
    } else if (field === "cashier_id") {
      return "Cashier is required";
    }
  };

  saveInvoice = () => {
    this.setState({ saving: true });
    const { items, invoice } = this.state;
    const {
      amount_paid,
      purchase_order_no,
      client_id,
      description,
      currency,
      due_date,
      issued_date,
    } = invoice;

    let data = new FormData();
    var balance = this.totalCost() - amount_paid;
    data.set("purchase_order_no", purchase_order_no);
    data.set("invoice_description", description);
    data.set("client_id", client_id);
    data.set("currency", currency);
    data.set("due_date", due_date);
    data.set("issued_date", issued_date);
    data.set("total_amount", this.totalCost());
    data.set("balance", balance);
    data.set("amount_paid", amount_paid);

    for (var i in items) {
      data.set(`quantity[${i}]`, items[i].quantity);
      data.set(`rate[${i}]`, items[i].rate);
      data.set(`amount[${i}]`, items[i].rate * items[i].quantity);
      data.set(`description[${i}]`, items[i].description);
    }

    return axios
      .post(
        `${settings.API_URL}updateinvoice/${this.state.invoice.id}`,
        data,
        {
          headers: authHeader(),
        },
        authService.handleResponse
      )
      .then((res) => {
        this.setState({ saving: false, edit: false });
        this.getInvoice();
        //this.props.saved();
        //this.props.toggle();
        this.showToast("Invoice updated");
      })
      .catch((err) => {
        if (err) {
          toast.dismiss();
          console.log(err);
          toast.configure({ hideProgressBar: true, closeButton: false });
          this.showToastError(
            "An Invoice with this invoice number address already exist"
          );
          this.setState({ saving: false });
        }
      });
  };

  handleAddItem = () => {
    this.setState({
      items: this.state.items.concat([
        { name: "", rate: 0, quantity: 0, description: "" },
      ]),
    });
  };

  handleRemoveItem = (idx) => () => {
    this.setState({
      items: this.state.items.filter((s, sidx) => idx !== sidx),
    });
  };

  onChange = (e, state) => {
    const { invoice } = this.state;

    this.setState({ invoice: { ...invoice, [state]: e } });
  };

  toggleEditPayment = (payment) => {
    this.setState({ payment });
    this.getInvoice();
  };

  handleInputChange = (e, index) => {
    const { name, value } = e.target;
    const { items } = this.state;
    const list = [...items];
    list[index][name] = value;
    this.setState({ items: list });
  };

  handleInputNumericChange = (e, index) => {
    const { name, value } = e.target;
    const { items } = this.state;
    const list = [...items];
    list[index][name] = value.replace(/\D/g, "");
    this.setState({ items: list });
  };

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "green" }}>{msg}</div>);
  };
  showToastError = (msg) => {
    toast(<div style={{ padding: 20, color: "white" }}>{msg}</div>);
  };

  onChange = (e, state) => {
    const { invoice } = this.state;
    this.setState({ invoice: { ...invoice, [state]: e } });
  };

  toggleEdit = () => {
    this.setState({ edit: !this.state.edit });
  };

  getInvoice = () => {
    const { id } = this.state;
    this.setState({ loading: true });
    getInvoice(id).then(
      (res) => {
        this.setState({
          invoice: res.invoice,
          payments: res.payments,
          items: res.items,
          pos_items: res.pos_items,
          total_balance: res.total_balance,
          prev_balance: res.prev_balance,
          loading: false,
          edit: false,
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  toggleAddPayment = () => {
    this.setState({ addPayment: !this.state.addPayment });
  };

  toggleAddClient = () => {
    this.setState({ addClient: !this.state.addClient });
  };

  totalCost = () => {
    const { items } = this.state;

    var total = 0;
    for (let v = 0; v < items.length; v++) {
      total += items[v].rate * items[v].quantity;
    }
    return total;
  };

  formatCurrency(x) {
    if (x !== null && x !== 0 && x !== undefined) {
      const parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return `${parts.join(".")}`;
    }
    return "0";
  }

  getBalance() {
    const { payments, invoice } = this.state;
    const total_amount = invoice.amount;
    return this.setState({
      total_amount: total_amount,
    });
  }

  render() {
    const {
      saving,
      hideNav,
      addPayment,
      pos_items,
      user,
      company,
      payment,
      total_amount,
      previous_payment,
      balance,
      clients,
      submitted,
      currency,
      addClient,
      edit,
      items,
      payments,
      loading,
      invoice,
      show,
      total_balance,
      prev_balance,
    } = this.state;
    return (
      <>
        {loading && <SpinDiv text={"Loading..."} />}

        {invoice && (
          <div style={{ display: "none" }}>
            <Invoice2
              pos_items={pos_items}
              items={items}
              invoice={invoice}
              company={company}
              user={user}
              total_balance={total_balance}
              prev_balance={prev_balance}
              ref={(el) => (this.componentRef2 = el)}
              toggle={() => this.setState({ invoice: [] })}
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

        {addPayment && (
          <AddPayment
            saved={this.getInvoice}
            addPayment={addPayment}
            payments={payments}
            invoice={invoice}
            toggle={() => this.setState({ addPayment: null })}
          />
        )}

        {payment && (
          <EditPayment
            saved={this.getInvoice}
            payment={payment}
            payments={payments}
            invoice={invoice}
            toggle={() => this.setState({ payment: null })}
          />
        )}
      {/* Header with Breadcrumb and Actions */}
  <Row className="mb-4">
    <Col lg="12">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4 border-bottom">
        <div className="d-block mb-4 mb-md-0">
          <Breadcrumb listProps={{ className: "breadcrumb-text-dark text-primary mb-0" }}>
            <Breadcrumb.Item href="/" className="text-muted">Home</Breadcrumb.Item>
            <Breadcrumb.Item href="/invoices" className="text-primary fw-semibold">Invoices</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <div className="btn-toolbar mb-2 mb-md-0">
          {!hideNav && (
            <ButtonGroup className="gap-2">
              {(user.admin === 1 || user.id === invoice.cashier_id) && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => this.toggleAddPayment()}
                  className="d-flex align-items-center gap-2"
                >
                  <i className="fa fa-plus" />
                  New Payment
                </Button>
              )}

              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  this.props.history.push("/new/invoice");
                }}
                className="d-flex align-items-center gap-2"
              >
                <i className="fa fa-plus" />
                New Invoice
              </Button>

              {Object.keys(invoice).length !== 0 ? (
                <ReactToPrint
                  trigger={() => {
                    return (
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="d-flex align-items-center gap-2"
                      >
                        <i className="fa fa-print" />
                        Print Invoice
                      </Button>
                    );
                  }}
                  content={() => this.componentRef2}
                />
              ) : null}
            </ButtonGroup>
          )}
        </div>
      </div>
    </Col>
  </Row>

  {/* Main Invoice Card */}
  <Card className="border-0 shadow-sm mb-4">
    <Card.Body className="p-4">
      
      {/* Invoice Summary Row */}
      <Row className="mb-4">
        <Col md={12}>
          <Row className="mb-3 p-3 bg-light rounded">
            <Col md={2}>
              {(user.admin === 1 || user.id === invoice.cashier_id) &&
                invoice.payment_type === "MANUAL" &&
                payments.length <= 1 && (
                <Button
                  variant={edit ? "outline-danger" : "outline-success"}
                  onClick={this.toggleEdit}
                  size="sm"
                  className="d-flex align-items-center gap-2"
                >
                  <i className={`fa ${edit ? 'fa-times' : 'fa-edit'}`} />
                  {edit ? "Discard Changes" : "Edit Invoice"}
                </Button>
              )}
            </Col>
            <Col md={3}>
              <div className="text-center">
                <div className="fs-6 fw-bold text-primary">Invoice Amount</div>
                <div className="fs-5 fw-bold text-dark">
                  <span className="text-muted">{invoice.currency}</span>
                  {this.formatCurrency(invoice.amount)}
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center">
                <div className="fs-6 fw-bold text-success">Paid</div>
                <div className="fs-5 fw-bold text-dark">
                  <span className="text-muted">{invoice.currency}</span>
                  {this.formatCurrency(invoice.total_payment)}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center">
                <div className="fs-6 fw-bold text-warning">Invoice Balance</div>
                <div className="fs-5 fw-bold text-dark">
                  <span className="text-muted">{invoice.currency}</span>
                  {this.formatCurrency(invoice.balance)}
                </div>
              </div>
            </Col>
          </Row>
          
          <Row className="mb-3 p-3 bg-light rounded">
            <Col md={4}>
              <div className="text-center">
                <div className="fs-6 fw-bold text-info">Previous Client Balance</div>
                <div className="fs-6 fw-bold text-dark">
                  <span className="text-muted">{invoice.currency}</span>
                  {this.formatCurrency(prev_balance)}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center">
                <div className="fs-6 fw-bold text-danger">Total Client Balance</div>
                <div className="fs-6 fw-bold text-dark">
                  <span className="text-muted">{invoice.currency}</span>
                  {this.formatCurrency(total_balance)}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center">
                <div className="fs-6 fw-bold text-secondary">Cashier</div>
                <div className="fs-6 fw-bold text-dark">{invoice.cashier_name}</div>
              </div>
            </Col>
          </Row>

          {/* Invoice Details Form */}
          <Card className="border mb-4">
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-semibold">Invoice No</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light">
                        <FontAwesomeIcon icon={faPencilAlt} />
                      </InputGroup.Text>
                      <Input
                        type="text"
                        name="invoice_no"
                        disabled
                        value={invoice.invoice_no || ""}
                        onChange={async (e) => {
                          await this.onChange(e.target.value, "invoice_no");
                        }}
                        className="form-control"
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>

                <Col md="3" className="mb-3">
                  <FormGroup>
                    <Form.Label className="fw-semibold">Date</Form.Label>
                    <ReactDatetime
                      value={moment(invoice.issued_date).format("MMM DD, YYYY") || ""}
                      disabled={!edit}
                      dateFormat={"MMM D, YYYY"}
                      closeOnSelect
                      onChange={(e) => this.onChange(e, "issued_date")}
                      inputProps={{
                        required: true,
                        className: "form-control",
                      }}
                      timeFormat={false}
                    />
                  </FormGroup>
                </Col>

                <Col md="3" className="mb-3">
                  <FormGroup>
                    <Form.Label className="fw-semibold">Due Date</Form.Label>
                    <ReactDatetime
                      value={moment(invoice.due_date).format("MMM DD, YYYY") || ""}
                      dateFormat={"MMM D, YYYY"}
                      closeOnSelect
                      onChange={(e) => this.onChange(e, "due_date")}
                      inputProps={{
                        required: true,
                        className: "form-control",
                      }}
                      timeFormat={false}
                      disabled={!edit}
                    />
                  </FormGroup>
                </Col>

                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-semibold">Total Purchase</Form.Label>
                    <InputGroup>
                      <Input
                        type="text"
                        value={invoice.currency + this.formatCurrency(this.totalCost() + ".00")}
                        disabled
                        className="form-control bg-light"
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Payment Details Form */}
          <Card className="border mb-4">
            <Card.Body>
              <Row>
                <Col md={5} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-semibold">Amount Received</Form.Label>
                    <InputGroup>
                      
                      <InputNumber
                        style={{
                          width: "100%",
                          height: 40,
                          paddingTop: 5,
                          borderRadius: 5,
                          fontSize: 16,
                        }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        onKeyPress={(event) => {
                          if (!/[0-9]/.test(event.key)) {
                            event.preventDefault();
                          }
                        }}
                        disabled
                        value={invoice.total_payment}
                        onChange={(e) => this.onChange(e, "amount_paid")}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>

                <Col md={4} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-semibold">Clients</Form.Label>
                    <Form.Select
                      onChange={async (e) => {
                        await this.onChange(e.target.value, "client_id");
                      }}
                      value={invoice.client_id}
                      disabled={!edit}
                      className="form-select"
                    >
                      <option value="">Select Client</option>
                      {clients.length === 0 && ""}
                      {clients.map((p, index) => (
                        <option value={p.id} key={index}>
                          {p.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3} className="mb-3 d-flex align-items-end">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={!edit}
                    onClick={() => this.toggleAddClient()}
                    className="d-flex align-items-center gap-2"
                  >
                    <i className="fa fa-plus" />
                    New Client
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Items Section */}
      <Card className="border mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0 fw-semibold">ITEMS</h5>
        </Card.Header>
        <Card.Body>
          {items.length > 0 &&
            items.map((item, key) => (
              <Card key={key} className="border mb-3">
                <Card.Body>
                  <Row>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold">Description</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light">
                            <FontAwesomeIcon icon={faPencilAlt} />
                          </InputGroup.Text>
                          <Input
                            type="text"
                            disabled={!edit}
                            placeholder={`Item description ${key + 1}`}
                            value={item.description}
                            onChange={(e) => this.handleInputChange(e, key)}
                            name="description"
                            className="form-control"
                          />
                        </InputGroup>
                        {submitted && !item.description && (
                          <div className="text-danger small mt-1">Description is required</div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={2} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold">Quantity</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light">
                            <FontAwesomeIcon icon={faPencilAlt} />
                          </InputGroup.Text>
                          <Input
                            type="text"
                            disabled={!edit}
                            name="quantity"
                            placeholder={`Qty ${key + 1}`}
                            value={item.quantity}
                            onChange={(e) => this.handleInputNumericChange(e, key)}
                            className="form-control"
                          />
                        </InputGroup>
                        {submitted && !item.quantity && (
                          <div className="text-danger small mt-1">Quantity is required</div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={2} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold">Price</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light">
                            <FontAwesomeIcon icon={faPencilAlt} />
                          </InputGroup.Text>
                          <Input
                            type="text"
                            disabled={!edit}
                            placeholder={`Price ${key + 1}`}
                            value={item.rate}
                            onChange={(e) => this.handleInputNumericChange(e, key)}
                            name="rate"
                            className="form-control"
                          />
                        </InputGroup>
                        {submitted && !item.rate && (
                          <div className="text-danger small mt-1">Price is required</div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold">Amount</Form.Label>
                        <InputGroup>
                          <Input
                            disabled
                            type="text"
                            value={item.quantity * item.rate}
                            className="form-control bg-light fw-bold"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={2} className="mb-3 d-flex flex-column">
                      <Form.Label className="fw-semibold">Actions</Form.Label>
                      <ButtonGroup>
                        {items.length && items.length - 1 === key && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            disabled={!edit}
                            onClick={this.handleAddItem}
                            title="Add Item"
                          >
                            <i className="fa fa-plus" />
                          </Button>
                        )}
                        {items.length && items.length !== 1 && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            disabled={!edit}
                            onClick={this.handleRemoveItem(key)}
                            title="Remove Item"
                          >
                            <i className="fa fa-times" />
                          </Button>
                        )}
                      </ButtonGroup>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}

          {pos_items.length > 0 &&
            pos_items.map((item, key) => (
              <Card key={key} className="border mb-3 bg-light">
                <Card.Body>
                  <Row>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold">Description</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light">
                            <FontAwesomeIcon icon={faPencilAlt} />
                          </InputGroup.Text>
                          <Input
                            type="text"
                            disabled={!edit}
                            value={item.product_name}
                            name="description"
                            className="form-control"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={2} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold">Quantity</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light">
                            <FontAwesomeIcon icon={faPencilAlt} />
                          </InputGroup.Text>
                          <Input
                            type="text"
                            disabled={!edit}
                            name="quantity"
                            value={item.qty_sold}
                            onChange={(e) => this.handleInputNumericChange(e, key)}
                            className="form-control"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold">Price</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light">
                            <FontAwesomeIcon icon={faPencilAlt} />
                          </InputGroup.Text>
                          <Input
                            type="text"
                            disabled={!edit}
                            value={item.selling_price}
                            name="rate"
                            className="form-control"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold">Amount</Form.Label>
                        <InputGroup>
                          <Input
                            disabled
                            type="text"
                            value={item.qty_sold * item.selling_price}
                            className="form-control bg-light fw-bold"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}

          {/* Totals Section */}
          <Row className="mt-4">
            <Col md={8}></Col>
            <Col md={4}>
              <Card className="border-0 bg-light">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold">Subtotal:</span>
                    <span className="fw-bold">
                      <span className="text-muted small">{invoice.currency}</span>
                      {this.formatCurrency(invoice.amount)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold">Total Cost:</span>
                    <span className="fw-bold">
                      <span className="text-muted small">{invoice.currency}</span>
                      {this.formatCurrency(invoice.amount)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold text-success">Amount Received:</span>
                    <span className="fw-bold text-success">
                      <span className="text-muted small">{invoice.currency}</span>
                      {this.formatCurrency(invoice.total_payment)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold text-warning">Balance:</span>
                    <span className="fw-bold text-warning">
                      <span className="text-muted small">{invoice.currency}</span>
                      {this.formatCurrency(invoice.total_balance)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold text-info">Prev Balance:</span>
                    <span className="fw-bold text-info">
                      <span className="text-muted small">{invoice.currency}</span>
                      {this.formatCurrency(prev_balance)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3 border-top pt-2">
                    <span className="fw-bold text-danger">Total Balance:</span>
                    <span className="fw-bold text-danger fs-5">
                      <span className="text-muted small">{invoice.currency}</span>
                      {this.formatCurrency(total_balance)}
                    </span>
                  </div>
                  {edit && (
                    <div className="d-grid">
                      <Button
                        variant="primary"
                        size="lg"
                        disabled={saving}
                        onClick={this.onSaveInvoice}
                        className="d-flex align-items-center justify-content-center gap-2"
                      >
                        {saving ? (
                          <><i className="fa fa-spinner fa-spin" /> Updating...</>
                        ) : (
                          <><i className="fa fa-save" /> Update Invoice</>
                        )}
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Payments Section */}
      {hideNav === true ? (
        <Card className="border mb-4">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0 fw-semibold">Payments</h5>
          </Card.Header>
          <Card.Body>
            {payments.map((payment, key) => (
              <Card key={key} className="border mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0 fw-semibold">{this.ordinal(key + 1)} Payment</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold">Invoice No</Form.Label>
                        <Input value={payment.invoice_num} disabled className="form-control bg-light" />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold">Amount</Form.Label>
                        <Input
                          value={`${invoice.currency}${this.formatCurrency(payment.amount)}`}
                          disabled
                          className="form-control bg-light"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold">Paid</Form.Label>
                        <Input
                          value={`${invoice.currency}${this.formatCurrency(payment.amount_paid)}`}
                          disabled
                          className="form-control bg-light"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold">Transaction Date</Form.Label>
                        <Input
                          value={moment(payment.created_at).format("MMM DD YYYY")}
                          disabled
                          className="form-control bg-light"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  {user.admin === 1 && payments.length >= 1 && (
                    <div className="d-flex justify-content-end">
                      <Button
                        variant="outline-primary"
                        onClick={() => this.toggleEditPayment(payment)}
                        size="sm"
                        className="d-flex align-items-center gap-2"
                      >
                        <i className="fa fa-edit" />
                        Edit
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            ))}
          </Card.Body>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-semibold">Payments History</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 py-3 px-4 fw-semibold">Invoice No</th>
                    <th className="border-0 py-3 px-4 fw-semibold">Amount</th>
                    <th className="border-0 py-3 px-4 fw-semibold">Paid</th>
                    <th className="border-0 py-3 px-4 fw-semibold">Transaction Date</th>
                    <th className="border-0 py-3 px-4 fw-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, key) => (
                    <tr key={key} className="border-bottom">
                      <td className="py-3 px-4 fw-semibold">{payment.invoice_num}</td>
                      <td className="py-3 px-4">
                        <span className="text-muted small">{invoice.currency}</span>
                        <span className="fw-bold">{this.formatCurrency(payment.amount)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-muted small">{invoice.currency}</span>
                        <span className="fw-bold text-success">{this.formatCurrency(payment.amount_paid)}</span>
                      </td>
                      <td className="py-3 px-4">
                        {moment(payment.created_at).format("MMM DD YYYY")}
                      </td>
                      <td className="py-3 px-4">
                        {user.admin === 1 && payments.length >= 1 && (
                          <Button
                            variant="outline-primary"
                            onClick={() => this.toggleEditPayment(payment)}
                            size="sm"
                            className="d-flex align-items-center gap-2"
                          >
                            <i className="fa fa-edit" />
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-light border-top-2">
                    <td colSpan={2} className="py-3 px-4"></td>
                    <td className="py-3 px-4">
                      <div className="fw-bold text-success">
                        Total Payments: <span className="text-muted small">{invoice.currency}</span>
                        {this.formatCurrency(invoice.total_payment)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="fw-bold text-warning">
                        Balance: <span className="text-muted small">{invoice.currency}</span>
                        {this.formatCurrency(invoice.total_balance)}
                      </div>
                    </td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </Card.Body>
  </Card>
      </>
    );
  }
}

export default EditInvoice;
