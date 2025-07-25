import React, { Component } from "react";

import {
  Col,
  Row,
  Nav,
  Card,
  Table,
  Form,
  ButtonGroup,
  Breadcrumb,
  InputGroup,
  Dropdown,
  Container,
  Badge
} from "@themesberg/react-bootstrap";
import {
  faEnvelope,
  faPhone,
  faLock,
  faPencilAlt,
  faAddressCard,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import SpinDiv from "../components/SpinDiv";
import axios from "axios";
import settings from "../../services/settings";
import { authHeader } from "../../services/authHeader";
import { authService } from "../../services/authService";
import { toast } from "react-toastify";
import { FormGroup, CardHeader, Media, Input, Modal } from "reactstrap";
import moment from "moment";
import ReactDatetime from "react-datetime";
import AddClient from "../clients/AddClient";
import { getInvoiceId } from "../../services/invoiceService";
import { getClients } from "../../services/clientService";
import { currencies } from "./Currency";
import ReactToPrint from "react-to-print";
import { InputNumber, Popover, Button, Select, Spin } from "antd";

import Invoice2 from "./Invoice2";

const { Option } = Select;

const InvoiceOverview = (
  <div>
    <Card border="light" className="shadow-sm mb-4">
      <Card.Body className="pb-0">
        <h4>How to use Invoice</h4>
        <h5 style={{ paddingLeft: 5 }}>
          {" "}
          Please Note the following steps to create an Invoice
        </h5>
        <p>
          <ul>
            <li>
              <b>Credits</b> i.e Money received from your Clients, irrespective
              of your transaction (No Outstanding)
            </li>
            <li>
              <b>Debtors</b> Transactions that involves user not making full
              payment i.e having an outstanding
            </li>
            <li>
              <b>Invoice No</b>You are to input the invoice-No, Note this is
              generated automatically
            </li>
            <li>
              <b>Issue Date</b>You are to choose the date when the transaction
              was done
            </li>
            <li>
              <b>Due Date</b> Date at which the client is suppose to pay their
              Outstandings
            </li>
            <li>
              <b>Amount Received</b>This is the amount you are been paid by the
              customer
            </li>
            <li>
              <b>Currency</b>You are allowed to choose the currency at which the
              transaction was performed
            </li>
          </ul>
        </p>
        <h3>Also Note:</h3>
        <ul>
          <li>
            If your the amount paid is equal to the total transaction, this
            invoice is categorized as a credit
          </li>
          <li>
            If your the amount paid is less than the total transaction, the
            balance is place under debts
          </li>
        </ul>
      </Card.Body>
    </Card>
  </div>
);

export class AddInvoice extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rows: 10,
      page: 1,
      loading: false,
      client_id: "",
      invoice_no: "",
      new_items: [],
      items: [{ name: "", item_description: "", quantity: 0, rate: 0 }],
      amount_paid: 0,
      currency: "",
      purchase_order_no: "",
      description: "",
      validation: {},
      errors: {},
      issue_date: moment().startOf("day"),
      due_date: moment().startOf("day"),
      clients: [],
      currencies: currencies,
      invoice_last_id: "",
      submitted: false,
      invalidItems: [],
      receipt: {},
      hideNav: false,
      company: JSON.parse(localStorage.getItem("company")),
      user: JSON.parse(localStorage.getItem("user")),
      english_ordinal_rules: new Intl.PluralRules("en", { type: "ordinal" }),
      suffixes: { one: "st", two: "nd", few: "rd", other: "th" },
      total_balance: 0,
      prev_balance: 0,
      pos_items: [],
    };
    this.baseState = this.state;
  }

  resetForm = () => {
    window.location.reload();
  };

  validationRules = (field) => {
    if (field === "invoice_no") {
      return "Invoice number is required";
    } else if (field === "issue_date") {
      return "Issue date is required";
    } else if (field === "due_date") {
      return "Due date is required";
    } else if (field === "client_id") {
      return "Client is required";
    } else if (field === "currency") {
      return "Currency is required";
      // }else if(field === 'purchase_order_no'){
      //     return "Purchase Order No is required";
    } else if (field === "amount_paid") {
      return "Deposit field is required";
    }
  };

  ordinal(number) {
    const { suffixes, english_ordinal_rules } = this.state;
    const suffix = suffixes[english_ordinal_rules.select(number)];
    return number + suffix;
  }

  isNumberKey(evt) {
    var charCode = evt.which ? evt.which : evt.keyCode;
    if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57))
      return false;

    return true;
  }

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "success" }}>{msg}</div>);
  };
  showToastError = (msg) => {
    toast(<div style={{ padding: 20, color: "red" }}>{msg}</div>);
  };
  componentDidMount = () => {
    window.addEventListener("resize", this.resize.bind(this));
    this.getClients();
    this.getInvoiceId();

    toast.dismiss();
    toast.configure({ hideProgressBar: true, closeButton: false });
  };

  resize() {
    this.setState({ hideNav: window.innerWidth <= 760 });
  }

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

  getClients = () => {
    const { page, rows, search, clients } = this.state;
    this.setState({ loading: true });
    getClients({ page, rows, search }).then(
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
    this.setState({ search: value, page: 1, clients: [], hasMore: true }, () =>
      this.getClients()
    );
  };

  handleClientChange = (selected) => {
    this.setState({
      client_id: selected.value,
    });
  };

  onSaveInvoice = async (e) => {
    e.preventDefault();
    //e.target.reset();
    await toast.dismiss();
    const {
      items,
      validation,
      invoice_no,
      purchase_order_no,
      client_id,
      amount_paid,
      cashier_id,
      currency,
      due_date,
      issue_date,
    } = this.state;

    this.setState({ submitted: true });

    let check_description = items.some((ele) => ele.item_description === "");
    let check_quantity =
      items.some((ele) => ele.quantity === 0) ||
      items.some((ele) => ele.quantity === "");
    let check_rate =
      items.some((ele) => ele.rate === 0) ||
      items.some((ele) => ele.rate === "");
    console.log(amount_paid);
    await this.setState({
      validation: {
        ...validation,
        invoice_no: invoice_no !== "",
        client_id: client_id !== "",
        due_date: due_date !== "",
        currency: currency !== "",
        issue_date: issue_date !== "",
        amount_paid: amount_paid !== "" && amount_paid !== null,
      },
    });
    if (
      Object.values(this.state.validation).every(Boolean) &&
      //   !check_payment &&
      !check_description &&
      !check_rate &&
      !check_quantity
    ) {
      this.setState({ submitted: false });
      this.saveInvoice();
    } else {
      const errorss = Object.keys(this.state.validation).filter((id) => {
        return !this.state.validation[id];
      });
      toast.dismiss();
      toast.configure({ hideProgressBar: true, closeButton: false });
      toast(
        <div style={{ padding: "10px 20px" }}>
          <p style={{ margin: 0, fontWeight: "bold", color: "red" }}>Errors:</p>
          {errorss.map((v) => (
            <p key={v} style={{ margin: 0, fontSize: 14, color: "red" }}>
              * {this.validationRules(v)}
            </p>
          ))}
        </div>
      );
    }
  };

  formatCurrency(x) {
    if (x !== null && x !== "0" && x !== undefined) {
      const parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return `${parts.join(".")}`;
    }
    return "0";
  }

  saveInvoice = () => {
    this.setState({ saving: true });

    const {
      invoice_no,
      purchase_order_no,
      description,
      amount_paid,
      items,
      client_id,
      currency,
      due_date,
      issue_date,
    } = this.state;

    let data = new FormData();
    var balance = this.totalCost() - amount_paid;
    data.set("invoice_no", invoice_no);
    data.set("purchase_order_no", purchase_order_no);
    data.set("description", description);
    data.set("client_id", client_id);
    data.set("currency", currency);
    data.set("due_date", due_date);
    data.set("issue_date", issue_date);
    data.set("total_amount", this.totalCost());
    data.set("balance", balance);
    data.set("amount_paid", amount_paid);
    for (var i in items) {
      // data.set(`name[${i}]`, items[i].name);
      data.set(`quantity[${i}]`, items[i].quantity);
      data.set(`rate[${i}]`, items[i].rate);
      data.set(`amount[${i}]`, items[i].rate * items[i].quantity);
      data.set(`item_description[${i}]`, items[i].item_description);
    }

    return axios
      .post(
        `${settings.API_URL}addinvoice`,
        data,
        {
          headers: authHeader(),
        },
        authService.handleResponse
      )
      .then((res) => {
        this.setState({
          saving: false,
          client_id: "",
          invoice_no: "",
          new_items: [],
          items: [{ name: "", item_description: "", quantity: 0, rate: 0 }],
          amount_paid: 0,
          currency: "",
          purchase_order_no: "",
          description: "",
          receipt: res.data.invoice,
          new_items: res.data.items,
          total_balance: res.data.total_balance,
          prev_balance: res.data.prev_balance,
        });
        this.getInvoiceId();
        this.getClients();

        {
          console.log(res);
        }
        this.showToast("Invoice created");
      })
      .catch((err) => {
        if (err) {
          toast.dismiss();
          toast.configure({ hideProgressBar: true, closeButton: false });
          this.showToastError(
            "Network Error: Please check your Internet connection or refresh page"
          );

          this.setState({ saving: false });
        }
      });
  };

  onChange = (e, state) => {
    this.setState({ [state]: e });
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

  handleAddItem = () => {
    this.setState({
      items: this.state.items.concat([
        { name: "", rate: 0, quantity: 0, item_description: "" },
      ]),
    });
  };

  handleRemoveItem = (idx) => () => {
    this.setState({
      items: this.state.items.filter((s, sidx) => idx !== sidx),
    });
  };

  totalCost = () => {
    const { items } = this.state;
    var total = 0;
    for (let v = 0; v < items.length; v++) {
      total += items[v].rate * items[v].quantity;
    }
    return total;
  };

  render() {
    const {
      loading,
      user,
      hideNav,
      currencies,
      new_items,
      total_balance,
      description,
      company,
      receipt,
      submitted,
      invoice_no,
      amount_paid,
      clients,
      addClient,
      items,
      issue_date,
      currency,
      due_date,
      saving,
      pos_items,
      prev_balance,
    } = this.state;
    return (
      <>
        {receipt && (
          <div style={{ display: "none" }}>
            <Invoice2
              pos_items={pos_items}
              items={new_items}
              invoice={receipt}
              company={company}
              user={user}
              total_balance={total_balance}
              prev_balance={prev_balance}
              ref={(el) => (this.componentRef = el)}
              toggle={() => this.setState({ receipt: [] })}
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
        <Row style={{}}>
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
                  <Breadcrumb.Item href="/new/invoice">
                    New Invoice
                  </Breadcrumb.Item>
                </Breadcrumb>
              </div>
              {!hideNav && (
                <div className="btn-toolbar mb-2 mb-md-0">


                  <ButtonGroup>
                    {Object.keys(receipt).length !== 0 ? (
                      <ReactToPrint
                        trigger={() => {
                          return (
                            <Button
                              variant="outline-success"
                              href="#"
                              size="sm"
                            >
                              Print Invoice
                            </Button>
                          );
                        }}
                        content={() => this.componentRef}
                      />
                    ) : (
                      ""
                    )}
                  </ButtonGroup>
                </div>
              )}
            </div>
          </Col>
        </Row>

        <Container fluid className="py-4">
          {/* Header Section */}
          <Row className="align-items-center mb-4">
            <Col>
              <div className="d-flex align-items-center">
                <div className="bg-gradient-primary rounded-3 p-3 me-3 shadow-sm">
                  <i className="fas fa-file-invoice text-white fs-4"></i>
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-dark">Create New Invoice</h4>
                  <p className="text-muted mb-0 small">Generate professional invoices for your clients</p>
                </div>
              </div>
            </Col>
          </Row>

          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              {saving && (
                <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-90 rounded" style={{ zIndex: 10 }}>
                  <SpinDiv text={"Saving invoice..."} />
                </div>
              )}

              {/* Invoice Header Section */}
              <div className="bg-light border-bottom p-4">
                <h5 className="mb-3 fw-bold text-primary">
                  <i className="fas fa-info-circle me-2"></i>Invoice Information
                </h5>
                <Row className="g-4">
                  <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark mb-2">
                            <i className="fas fa-hashtag text-primary me-2"></i>Invoice Number
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text className="bg-light border-end-0">
                              <FontAwesomeIcon icon={faPencilAlt} className="text-muted" />
                            </InputGroup.Text>
                            <Input
                              type="text"
                              placeholder="Enter Invoice Number"
                              name="invoice_no"
                              value={invoice_no}
                              onChange={async (e) => {
                                await this.onChange(e.target.value, "invoice_no");
                              }}
                              className="border-start-0 ps-0"
                              required
                            />
                          </InputGroup>
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark mb-2">
                            <i className="fas fa-calendar text-success me-2"></i>Issue Date
                          </Form.Label>
                          <ReactDatetime
                            value={issue_date}
                            dateFormat={"MMM D, YYYY"}
                            closeOnSelect
                            onChange={(e) => this.onChange(e, "issue_date")}
                            inputProps={{
                              required: true,
                              className: "form-control",
                              placeholder: "Select issue date"
                            }}
                            timeFormat={false}
                          />
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Due Date Section */}
              <div className="bg-light border-bottom p-4">
                <Row className="g-4">
                  <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark mb-2">
                            <i className="fas fa-clock text-warning me-2"></i>Due Date
                          </Form.Label>
                          <ReactDatetime
                            value={due_date}
                            dateFormat={"MMM D, YYYY"}
                            closeOnSelect
                            onChange={(e) => this.onChange(e, "due_date")}
                            inputProps={{
                              required: true,
                              className: "form-control",
                              placeholder: "Select due date"
                            }}
                            timeFormat={false}
                          />
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Client Selection Section */}
              <div className="bg-light border-bottom p-4">
                <h5 className="mb-3 fw-bold text-primary">
                  <i className="fas fa-users me-2"></i>Client Information
                </h5>
                <Row className="g-4">
                  <Col md={8}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark mb-2">
                            <i className="fas fa-user text-info me-2"></i>Select Client
                          </Form.Label>
                          <Select
                            showSearch
                            labelInValue
                            placeholder="Search and select a client..."
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
                                <div className="d-flex align-items-center">
                                  <i className="fas fa-user-circle text-primary me-2"></i>
                                  {client.name}
                                </div>
                              </Option>
                            ))}
                          </Select>
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body className="d-flex flex-column justify-content-center">
                        <Form.Label className="fw-semibold text-dark mb-2">
                          <i className="fas fa-plus text-success me-2"></i>Add New Client
                        </Form.Label>
                        <Button
                          variant="outline-success"
                          className="d-flex align-items-center justify-content-center gap-2"
                          onClick={() => this.toggleAddClient()}
                        >
                          <i className="fas fa-user-plus"></i>
                          New Client
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Invoice Description Section */}
              <div className="bg-light border-bottom p-4">
                <Row className="g-4">
                  <Col md={8}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark mb-2">
                            <i className="fas fa-align-left text-secondary me-2"></i>Invoice Description
                          </Form.Label>
                          <Input
                            type="textarea"
                            rows={4}
                            placeholder="Enter invoice description or additional notes..."
                            value={description}
                            onChange={async (e) => {
                              await this.onChange(e.target.value, "description");
                            }}
                            className="resize-none"
                          />
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm bg-gradient-success text-white">
                      <Card.Body className="d-flex flex-column justify-content-center text-center">
                        <i className="fas fa-calculator fs-2 mb-3 text-white-50"></i>
                        <Form.Label className="text-white-50 mb-1 small">TOTAL AMOUNT</Form.Label>
                        <h3 className="fw-bold mb-0">
                          {currency}{this.formatCurrency(this.totalCost() + ".00")}
                        </h3>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Items Section */}
              <div className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h5 className="mb-0 fw-bold text-primary">
                    <i className="fas fa-list me-2"></i>Invoice Items
                  </h5>
                  <Badge bg="info" className="fs-6 px-3 py-2">
                    {items.length} Item{items.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {items.map((item, key) => (
                  <Card key={key} className="mb-4 border shadow-sm">
                    <Card.Header className="bg-light border-0 py-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <h6 className="mb-0 fw-semibold text-dark d-flex align-items-center">
                          <div className="bg-primary rounded-circle text-white d-flex align-items-center justify-content-center me-3" style={{ width: 32, height: 32, fontSize: '14px' }}>
                            {key + 1}
                          </div>
                          {this.ordinal(key + 1)} Item
                        </h6>
                        <div className="d-flex gap-2">
                          {items.length - 1 === key && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={this.handleAddItem}
                              className="d-flex align-items-center gap-1"
                            >
                              <i className="fas fa-plus" style={{ fontSize: '12px' }}></i>
                              Add Item
                            </Button>
                          )}
                          {items.length !== 1 && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={this.handleRemoveItem(key)}
                              className="d-flex align-items-center gap-1"
                            >
                              <i className="fas fa-trash" style={{ fontSize: '12px' }}></i>
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card.Header>

                    <Card.Body>
                      <Row className="g-4">
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold text-dark mb-2">
                              <i className="fas fa-align-left text-primary me-2"></i>Item Description
                            </Form.Label>
                            <InputGroup>
                              <InputGroup.Text className="bg-light border-end-0">
                                <FontAwesomeIcon icon={faPencilAlt} className="text-muted" />
                              </InputGroup.Text>
                              <Input
                                type="textarea"
                                rows={3}
                                placeholder="Enter item name and description..."
                                value={item.item_description}
                                onChange={(e) => this.handleInputChange(e, key)}
                                name="item_description"
                                className="border-start-0 ps-2"
                              />
                            </InputGroup>
                            {submitted && !item.item_description && (
                              <div className="text-danger small mt-1">
                                <i className="fas fa-exclamation-circle me-1"></i>
                                Description is required
                              </div>
                            )}
                          </Form.Group>

                          <Form.Group>
                            <Form.Label className="fw-semibold text-dark mb-2">
                              <i className="fas fa-sort-numeric-up text-success me-2"></i>Quantity
                            </Form.Label>
                            <InputGroup>
                              <InputGroup.Text className="bg-light border-end-0">
                                <FontAwesomeIcon icon={faPencilAlt} className="text-muted" />
                              </InputGroup.Text>
                              <Input
                                type="text"
                                name="quantity"
                                placeholder="Enter quantity"
                                value={item.quantity}
                                onChange={(e) => this.handleInputNumericChange(e, key)}
                                className="border-start-0 ps-2"
                              />
                            </InputGroup>
                            {submitted && !item.quantity && (
                              <div className="text-danger small mt-1">
                                <i className="fas fa-exclamation-circle me-1"></i>
                                Quantity is required
                              </div>
                            )}
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Row className="g-3">
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="fw-semibold text-dark mb-2">
                                  <i className="fas fa-tag text-warning me-2"></i>Unit Price
                                </Form.Label>
                                <InputGroup>
                                  <InputGroup.Text className="bg-light border-end-0">
                                    <FontAwesomeIcon icon={faPencilAlt} className="text-muted" />
                                  </InputGroup.Text>
                                  <Input
                                    type="text"
                                    placeholder="Enter price"
                                    value={item.rate}
                                    onChange={(e) => this.handleInputNumericChange(e, key)}
                                    name="rate"
                                    className="border-start-0 ps-2"
                                  />
                                </InputGroup>
                                {submitted && !item.rate && (
                                  <div className="text-danger small mt-1">
                                    <i className="fas fa-exclamation-circle me-1"></i>
                                    Price is required
                                  </div>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="fw-semibold text-dark mb-2">
                                  <i className="fas fa-calculator text-info me-2"></i>Total Amount
                                </Form.Label>
                                <div className="bg-light rounded p-3 text-center">
                                  <h5 className="mb-0 fw-bold text-success">
                                    {currency || "₦"}{this.formatCurrency(item.quantity * item.rate || 0)}
                                  </h5>
                                </div>
                              </Form.Group>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}

                {/* Payment Section */}
                <Card className="border-0 shadow-sm bg-light">
                  <Card.Body>
                    <h5 className="mb-4 fw-bold text-primary">
                      <i className="fas fa-money-bill-wave me-2"></i>Payment Details
                    </h5>
                    <Row className="g-4">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark mb-2">
                            <i className="fas fa-coins text-warning me-2"></i>Currency
                          </Form.Label>
                          <Form.Select
                            onChange={async (e) => {
                              await this.onChange(e.target.value, "currency");
                            }}
                            className="form-select"
                          >
                            <option value="">Select Currency</option>
                            {currencies.map((p, index) => (
                              <option value={p.abbrev} key={p.id || index}>
                                {p.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark mb-2">
                            <i className="fas fa-hand-holding-usd text-success me-2"></i>Amount Received
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text className="bg-success text-white fw-bold">
                              {currency || "₦"}
                            </InputGroup.Text>
                            <InputNumber
                              style={{
                                width: "100%",
                                height: 48,
                                borderRadius: "0 6px 6px 0",
                                fontSize: 16,
                              }}
                              formatter={(value) =>
                                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                              }
                              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                              onKeyPress={(event) => {
                                if (!/[0-9.]/.test(event.key)) {
                                  event.preventDefault();
                                }
                              }}
                              placeholder="Enter amount received"
                              onChange={(e) => this.onChange(e, "amount_paid")}
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <div className="bg-white rounded-3 p-4 border h-100 d-flex flex-column justify-content-center">
                          <div className="text-center">
                            <i className="fas fa-receipt text-primary fs-2 mb-2"></i>
                            <div className="small text-muted mb-1">INVOICE SUMMARY</div>
                            <div className="fw-bold text-dark">Items: {items.length}</div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Invoice Summary */}
                <Card className="mt-4 border-0 shadow-lg">
                  <Card.Body className="bg-gradient-primary text-white">
                    <Row className="g-4">
                      <Col md={8}></Col>
                      <Col md={4}>
                        <div className="text-end">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-white-50">Subtotal:</span>
                            <h6 className="mb-0 fw-bold">{currency || "₦"}{this.formatCurrency(this.totalCost())}</h6>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-white-50">Total:</span>
                            <h5 className="mb-0 fw-bold">{currency || "₦"}{this.formatCurrency(this.totalCost())}</h5>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-white-50">Amount Received:</span>
                            <h6 className="mb-0 fw-bold">{currency || "₦"}{this.formatCurrency(amount_paid)}</h6>
                          </div>
                          <hr className="border-white-50" />
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Balance:</span>
                            <h4 className="mb-0 fw-bold text-warning">
                              {currency || "₦"}{this.formatCurrency(this.totalCost() - amount_paid)}
                            </h4>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="border-top bg-light p-4">
                <div className="d-flex gap-3 justify-content-end">
                  <Button
                    variant="success"
                    size="lg"
                    disabled={saving}
                    onClick={this.onSaveInvoice}
                    className="px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i>
                        Save Invoice
                      </>
                    )}
                  </Button>

                  {!hideNav && Object.keys(receipt).length !== 0 && (
                    <ReactToPrint
                      trigger={() => (
                        <Button
                          variant="outline-primary"
                          size="lg"
                          className="px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                        >
                          <i className="fas fa-print"></i>
                          Print Invoice
                        </Button>
                      )}
                      content={() => this.componentRef}
                    />
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Container>

        <style jsx>{`
  .custom-select .ant-select-selector {
    border-radius: 6px !important;
    border: 1px solid #dee2e6 !important;
    height: 48px !important;
    display: flex !important;
    align-items: center !important;
  }
  
  .custom-select .ant-select-selection-placeholder {
    color: #6c757d !important;
  }
  
  .resize-none {
    resize: none !important;
  }
  
  .bg-gradient-primary {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
  }
  
  .bg-gradient-success {
    background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%) !important;
  }
`}</style>
      </>
    );
  }
}

export default AddInvoice;
