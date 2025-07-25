import React, { Component } from "react";
import { CardHeader, Media, Input, Modal } from "reactstrap";
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
import ReactTagInput from "@pathofdev/react-tag-input";
import "@pathofdev/react-tag-input/build/index.css";
import SpinDiv from "../components/SpinDiv";
import { toast } from "react-toastify";
import {
  confirmOrder,
  returnOrder,
  moveOrder,
} from "../../services/purchaseOrderService";
import { formatCurrency, format } from "../../services/formatCurrencyService";
import CurrencyInput from "react-currency-input-field";
import { InputNumber } from "antd";

import ReactDatetime from "react-datetime";
import moment from "moment";
import { AsyncPaginate } from "react-select-async-paginate";

export class ConfirmOrder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stock: props.confirmOrder,
      branches: props.branches.map((opt) => ({
        label: opt.name,
        value: opt.id,
      })),
      loading: false,
      search: "",
      validation: {},
      branch_id: "",
      quantity_moved: "",
      quantity_returned: "",
      name: "",
      received_at: "",
      selling_price: "",

      fromdate: moment().startOf("month"),
      todate: moment().endOf("day"),
    };
  }

  componentDidMount() {
    toast.configure({ hideProgressBar: true, closeButton: false });
    console.log(this.state.stock);
    //this.filter()
  }

  selectQuantity = (instock) => {
    let text = [];
    for (let i = 1; i <= instock; i++) {
      text.push(
        <option value={i} key={i}>
          {i}
        </option>
      );
    }
    return text;
  };

  formatNumber = (number) => {
    return format(number);
  };

  formatC = (x) => {
    return formatCurrency(x);
  };

  onConfirmOrder = async (e) => {
    e.preventDefault();
    await toast.dismiss();
    const {
      stock,
      validation,
      selling_price,
      branch_id,
      quantity_moved,
      quantity_returned,
      received_at,
    } = this.state;
    const { id } = stock;
    if (stock.confirm === 1) {
      await this.setState({
        validation: {
          ...validation,
          received_at: received_at !== "",
          selling_price: selling_price !== "",
        },
      });
    } else if (stock.move === 1) {
      await this.setState({
        validation: {
          ...validation,
          branch_id: branch_id !== "",
          quantity_moved: quantity_moved !== "",
        },
      });
    } else if (stock.return == 1) {
      await this.setState({
        validation: {
          ...validation,
          //branch_id: branch_id !== "",
          quantity_returned: quantity_returned !== "",
        },
      });
    }

    if (Object.values(this.state.validation).every(Boolean)) {
      this.updateStock();
    } else {
      const errors = Object.keys(this.state.validation).filter((id) => {
        return !this.state.validation[id];
      });
      //await toast.configure({hideProgressBar: true, closeButton: false});
      await setTimeout(
        () =>
          toast.error(
            <div style={{ padding: "10px 20px" }}>
              <p style={{ margin: 0, fontWeight: "bold" }}>Errors:</p>
              {errors.map((v) => (
                <p key={v} style={{ margin: 0, fontSize: 14 }}>
                  * {this.validationRules(v)}
                </p>
              ))}
            </div>
          ),
        250
      );
    }
  };

  loadOptions = async (search, prevOptions) => {
    //await this.sleep(1000);

    let filteredOptions;
    if (!search) {
      filteredOptions = this.state.branches;
    } else {
      const searchLower = search.toLowerCase();

      filteredOptions = this.state.branches.filter(({ label }) =>
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

  validationRules = (field) => {
    if (field === "received_at") {
      return "Date Received is required";
    } else if (field === "selling_price") {
      return "Selling price is required";
    } else if (field === "branch_id") {
      return "Branch is required";
    } else if (field === "quantity_moved") {
      return "Quantity moved is required";
    } else if (field === "quantity_returned") {
      return "Quantity Returned is required";
    }
  };

  stripComma = (a) => {
    a = a.replace(/\,/g, "");
    a = parseInt(a, 10);
    return a;
  };

  updateStock = () => {
    this.setState({ loading: true });
    if (this.state.stock.cancel == 1) {
      const received_at = "";
      const { id } = this.state.stock;
      confirmOrder({ received_at, id }).then(
        (res) => {
          console.log(res);
          this.setState({ loading: false });
          this.props.saved();
          this.props.toggle();
          this.showToast(
            res.status === "Rejected" ? "Order Rejected" : "Order Confirmed"
          );
        },
        (error) => {
          console.log(error);
          if (error) {
            toast.error("Order cannot be confirmed");
          }
          this.setState({ loading: false });
        }
      );
    } else if (this.state.stock.return == 1) {
      const { quantity_returned } = this.state;
      const { id } = this.state.stock;

      returnOrder({ quantity_returned, id }).then(
        (res) => {
          console.log(res);
          this.setState({ loading: false });
          this.props.saved();
          this.props.toggle();
          this.showToast("Order Returned");
        },
        (error) => {
          console.log(error);
          if (error) {
            toast.error("Order cannot be returned");
          }
          this.setState({ loading: false });
        }
      );
    } else if (this.state.stock.move == 1) {
      const { branch_id, quantity_moved } = this.state;
      const { id, product_id, supplier_id } = this.state.stock;

      moveOrder({
        quantity_moved,
        product_id,
        branch_id,
        supplier_id,
        id,
      }).then(
        (res) => {
          console.log(res);
          this.setState({ loading: false });
          this.props.saved();
          this.props.toggle();
          this.showToast("Order Moved");
        },
        (error) => {
          console.log(error);
          if (error) {
            toast.error("Order cannot be returned");
          }
          this.setState({ loading: false });
        }
      );
    } else {
      const { received_at, selling_price } = this.state;
      const { id } = this.state.stock;
      console.log(received_at);
      confirmOrder({ received_at, selling_price, id }).then(
        (res) => {
          console.log(res);
          this.setState({ loading: false });
          this.props.saved();
          this.props.toggle();
          this.showToast("Order Confirmed");
        },
        (error) => {
          console.log(error);
          if (error) {
            toast.error("Order cannot be confirmed");
          }
          this.setState({ loading: false });
        }
      );
    }
  };
  handleBranchChange = (branch) => {
    this.setState({ branch_id: branch.value });
  };

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "green" }}>{msg}</div>);
  };

  onChange = (e, state) => {
    this.setState({ [state]: e });
  };

  render() {
    const { confirmOrder, toggle } = this.props;

    const {
      saving,
      quantity_returned,
      selling_price,
      quantity_moved,
      branches,
      received_at,
      fromdate,
      todate,
      loading,
      stock,
    } = this.state;
    return (
      <>
        <Modal
          className="modal-dialog modal-dialog-top"
          isOpen={confirmOrder != null}
          toggle={() => !loading && !saving && toggle}
        >
          {loading && <SpinDiv text={"Saving..."} />}

          {/* Modal Header */}
          <div className="modal-header border-bottom" style={{ padding: "1.5rem" }}>
            <div>
              {stock.cancel == 1 && (
                <h3 className="modal-title mb-0 text-danger" id="exampleModalLabel">
                  <i className="fas fa-times-circle me-2"></i>
                  Cancel Order {stock.tracking_id}
                </h3>
              )}
              {stock.return == 1 && (
                <h3 className="modal-title mb-0 text-warning" id="exampleModalLabel">
                  <i className="fas fa-undo me-2"></i>
                  Return Order {stock.tracking_id}
                </h3>
              )}
              {stock.confirm == 1 && (
                <h3 className="modal-title mb-0 text-success" id="exampleModalLabel">
                  <i className="fas fa-check-circle me-2"></i>
                  Confirm Order {stock.tracking_id}
                </h3>
              )}
              {stock.move == 1 && (
                <h3 className="modal-title mb-0 text-primary" id="exampleModalLabel">
                  <i className="fas fa-arrows-alt me-2"></i>
                  Move Order {stock.tracking_id}
                </h3>
              )}
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={toggle}
              disabled={loading || saving}
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body" style={{ padding: "1.5rem", minHeight: "200px" }}>
            <Card border="light" className="shadow-sm">
              <Card.Body>

                {/* Confirm Order Section */}
                {stock.confirm == 1 && (
                  <div className="confirm-section">
                    <div className="cost-price-display mb-4 p-3 bg-light rounded">
                      <h5 className="text-muted mb-0">
                        <i className="fas fa-tag me-2"></i>
                        Cost Price: <span className="text-dark fw-bold">{this.formatC(stock.unit_price)}</span>
                      </h5>
                    </div>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold mb-2">
                            <i className="fas fa-dollar-sign me-2"></i>
                            Unit Selling Price
                          </Form.Label>
                          <InputNumber
                            style={{
                              width: "100%",
                              height: "45px",
                              borderRadius: "8px",
                              fontSize: "16px",
                              border: "2px solid #e9ecef"
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
                            placeholder="Enter unit selling price"
                            onChange={(e) => this.onChange(e, "selling_price")}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold mb-2">
                            <i className="fas fa-calendar-alt me-2"></i>
                            Date Received
                          </Form.Label>
                          <ReactDatetime
                            value={received_at}
                            dateFormat={"MMM DD, YYYY"}
                            closeOnSelect
                            onChange={(e) => this.onChange(e, "received_at")}
                            inputProps={{
                              required: true,
                              className: "form-control",
                              style: {
                                height: "45px",
                                borderRadius: "8px",
                                border: "2px solid #e9ecef",
                                fontSize: "16px"
                              },
                              placeholder: "Select date received"
                            }}
                            timeFormat={false}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Cancel Order Section */}
                {stock.cancel == 1 && (
                  <div className="cancel-section">
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="fas fa-exclamation-triangle me-3 fs-4"></i>
                      <div>
                        <h6 className="alert-heading mb-1">Confirm Cancellation</h6>
                        <p className="mb-0">Are you sure you want to reject this order? This action cannot be undone.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Return Order Section */}
                {stock.return == 1 && (
                  <div className="return-section">
                    <div className="alert alert-warning d-flex align-items-center mb-3" role="alert">
                      <i className="fas fa-info-circle me-3 fs-4"></i>
                      <div>
                        <h6 className="alert-heading mb-1">Return Order</h6>
                        <p className="mb-0">Select the quantity you want to return from this order.</p>
                      </div>
                    </div>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold mb-2">
                            <i className="fas fa-boxes me-2"></i>
                            Quantity to Return
                          </Form.Label>
                          <Form.Select
                            value={quantity_returned}
                            onChange={(e) => {
                              this.onChange(e.target.value, "quantity_returned");
                            }}
                            style={{
                              height: "45px",
                              borderRadius: "8px",
                              border: "2px solid #e9ecef"
                            }}
                          >
                            <option value="">Select quantity to return</option>
                            {this.selectQuantity(stock.in_stock)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Move Order Section */}
                {stock.move == 1 && (
                  <div className="move-section">
                    <div className="alert alert-info d-flex align-items-center mb-3" role="alert">
                      <i className="fas fa-info-circle me-3 fs-4"></i>
                      <div>
                        <h6 className="alert-heading mb-1">Move Order</h6>
                        <p className="mb-0">Specify the destination branch and quantity to move.</p>
                      </div>
                    </div>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold mb-2">
                            <i className="fas fa-building me-2"></i>
                            Destination Branch
                          </Form.Label>
                          <AsyncPaginate
                            onChange={this.handleBranchChange}
                            loadOptions={this.loadOptions}
                            placeholder="Select branch..."
                            styles={{
                              control: (base) => ({
                                ...base,
                                height: "45px",
                                borderRadius: "8px",
                                border: "2px solid #e9ecef"
                              })
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold mb-2">
                            <i className="fas fa-boxes me-2"></i>
                            Quantity to Move
                          </Form.Label>
                          <Form.Select
                            value={quantity_moved}
                            onChange={(e) => {
                              this.onChange(e.target.value, "quantity_moved");
                            }}
                            style={{
                              height: "45px",
                              borderRadius: "8px",
                              border: "2px solid #e9ecef"
                            }}
                          >
                            <option value="">Select quantity to move</option>
                            {this.selectQuantity(stock.in_stock)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

              </Card.Body>
            </Card>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer border-top" style={{ padding: "1.5rem", backgroundColor: "#f8f9fa" }}>
            <div className="d-flex justify-content-end gap-2 w-100">
              <Button
                variant="outline-secondary"
                size="lg"
                disabled={saving || loading}
                onClick={toggle}
                style={{
                  borderRadius: "8px",
                  paddingLeft: "2rem",
                  paddingRight: "2rem",
                  fontWeight: "500"
                }}
              >
                <i className="fas fa-times me-2"></i>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                disabled={saving || loading}
                onClick={this.onConfirmOrder}
                style={{
                  borderRadius: "8px",
                  paddingLeft: "2rem",
                  paddingRight: "2rem",
                  fontWeight: "500",
                  boxShadow: "0 2px 4px rgba(0,123,255,0.3)"
                }}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }
}

export default ConfirmOrder;
