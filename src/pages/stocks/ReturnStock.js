import React, { Component } from "react";
import { Modal } from "reactstrap";
import {
  Col,
  Row,
  Card,
  Form,
} from "@themesberg/react-bootstrap";
import { Button } from "antd";
import "@pathofdev/react-tag-input/build/index.css";
import SpinDiv from "../components/SpinDiv";
import { toast } from "react-toastify";

import moment from "moment";
import Select from 'react-select';
import { getSerialNos } from "../../services/stockService";
import { returnStock } from "../../services/stockService";

export class ReturnStock extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stock: props.serial,
      loading: false,
      search: "",
      validation: {},
      quantity_returned: '',
      stock_id: props.serial.id,
      stock_serials: [],
      selectedSerials: [],
      fromdate: moment().startOf('month'),
      todate: moment().endOf('day'),
      submitted: false,
      saving: false,
      company: JSON.parse(localStorage.getItem('company') || '{}'),
    };
  }

  componentDidMount() {
    toast.configure({ hideProgressBar: true, closeButton: false });
    this.getSerialNos();
  }

  // Add missing onChange method
  onChange = (value, field) => {
    this.setState({ [field]: value });
  }

  handleInputChange = (selectedSerials) => {
    this.setState({ selectedSerials });
    console.log(selectedSerials); // Fixed: log the parameter directly
  }

  selectQuantity = (stock) => {
    let options = [];
    for (let i = 1; i <= stock; i++) {
      options.push(
        <option value={i} key={i}>
          {i}
        </option>
      );
    }
    return options;
  };

  onReturnStock = async (e) => {
    e.preventDefault();
    await toast.dismiss();
    const { selectedSerials, company, quantity_returned } = this.state;
    this.setState({ submitted: true });

    // Fixed validation logic
    if (company.sell_by_serial_no == 1) {
      if (selectedSerials.length > 0) {
        this.updateStock();
      }
    } else if (quantity_returned !== '') {
      this.updateStock();
    }
  };

  getSerialNos = () => {
    this.setState({ loading: true });
    const { stock_id } = this.state;
    
    getSerialNos({ stock_id }).then(
      (res) => {
        this.setState({
          loading: false,
          stock_serials: res.stock_serials
            ?.filter(serial => serial.sold_at === null)
            ?.map((opt) => ({
              label: opt.serial_no || 'No Serial Number',
              value: opt.id,
            })) || [],
        });
      },
      (error) => {
        console.error('Error fetching serial numbers:', error);
        this.setState({ loading: false });
        toast.error("Failed to load serial numbers");
      }
    );
  }

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "green" }}>{msg}</div>);
  };

  updateStock = () => {
    this.setState({ loading: true, saving: true });
    const { selectedSerials, quantity_returned, stock_id } = this.state;

    console.log('Updating stock with:', { selectedSerials, quantity_returned, stock_id });
    
    returnStock({ selectedSerials, quantity_returned, stock_id }).then(
      (res) => {
        console.log('Stock return response:', res);
        this.setState({ loading: false, saving: false });
        this.props.toggle();
        this.showToast("Stock Returned Successfully");
      },
      (error) => {
        console.error('Stock return error:', error);
        this.setState({ loading: false, saving: false });
        toast.error("Stock cannot be returned. Please try again.");
      }
    );
  };

  render() {
    const { serial, toggle } = this.props;
    const { 
      saving, 
      submitted, 
      company, 
      selectedSerials, 
      stock_serials, 
      quantity_returned, 
      loading, 
      stock 
    } = this.state;

    return (
      <>
        <Modal
          className="modal-dialog modal-dialog-centered"
          isOpen={serial != null}
          toggle={() => !loading && !saving && toggle()}
          backdrop={loading || saving ? "static" : true}
          keyboard={!loading && !saving}
        >
          {loading && <SpinDiv text={"Loading..."} />}
          
          <div className="modal-header" style={{ padding: "1rem", borderBottom: "1px solid #dee2e6" }}>
            <h3 className="modal-title" id="exampleModalLabel" style={{ margin: 0, fontSize: "1.25rem" }}>
              Return Order {stock.tracking}
            </h3>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={toggle}
              disabled={loading || saving}
              style={{ 
                background: "none", 
                border: "none", 
                fontSize: "1.25rem",
                cursor: loading || saving ? "not-allowed" : "pointer"
              }}
            >
              ×
            </button>
          </div>

          <Card border="light" className="shadow-sm mb-4" style={{ border: "none", borderRadius: 0 }}>
            <Card.Body className="pb-0" style={{ padding: "1.5rem" }}>
              <Form onSubmit={this.onReturnStock}>
                <Row>
                  <Col md={12} className="mb-3">
                    {company.sell_by_serial_no == 1 ? (
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                            Select Products to be Returned
                          </Form.Label>
                          <Select
                            value={selectedSerials}
                            onChange={this.handleInputChange}
                            options={stock_serials}
                            isMulti
                            placeholder="Choose products to return..."
                            isDisabled={loading || saving}
                            styles={{
                              control: (base, state) => ({
                                ...base,
                                minHeight: "40px",
                                borderColor: submitted && selectedSerials.length < 1 ? "#dc3545" : "#ced4da",
                                boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(0,123,255,.25)" : null,
                                "&:hover": {
                                  borderColor: submitted && selectedSerials.length < 1 ? "#dc3545" : "#80bdff"
                                }
                              }),
                              multiValue: (base) => ({
                                ...base,
                                backgroundColor: "#e7f3ff"
                              }),
                              multiValueLabel: (base) => ({
                                ...base,
                                color: "#0056b3"
                              })
                            }}
                          />
                          {submitted && selectedSerials.length < 1 && (
                            <div style={{ 
                              color: "#dc3545", 
                              fontSize: "0.875rem", 
                              marginTop: "0.25rem" 
                            }}>
                              Product to be returned is required
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    ) : (
                      <Col md={12}>
                        <Form.Group className="mb-2">
                          <Form.Label style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                            Select Quantity to Return
                          </Form.Label>
                          <Form.Select
                            required
                            value={quantity_returned}
                            onChange={(e) => {
                              this.onChange(e.target.value, "quantity_returned");
                            }}
                            disabled={loading || saving}
                            style={{
                              width: "100%",
                              padding: "0.375rem 0.75rem",
                              fontSize: "1rem",
                              lineHeight: "1.5",
                              borderColor: submitted && quantity_returned === '' ? "#dc3545" : "#ced4da"
                            }}
                          >
                            <option value="">Select quantity to return</option>
                            {this.selectQuantity(stock.in_stock)}
                          </Form.Select>
                          {submitted && quantity_returned === '' && (
                            <div style={{ 
                              color: "#dc3545", 
                              fontSize: "0.875rem", 
                              marginTop: "0.25rem" 
                            }}>
                              Quantity is required
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    )}
                  </Col>
                </Row>

                <Row style={{ marginTop: "20px", borderTop: "1px solid #dee2e6", paddingTop: "15px" }}>
                  <Col md={12}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                      <Button
                        type="button"
                        size="middle"
                        disabled={saving || loading}
                        onClick={toggle}
                        style={{
                          backgroundColor: "transparent",
                          border: "1px solid #6c757d",
                          color: "#6c757d",
                          minWidth: "80px"
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        size="middle"
                        disabled={saving || loading}
                        loading={saving}
                        onClick={this.onReturnStock}
                        style={{
                          minWidth: "80px"
                        }}
                      >
                        {saving ? "Returning..." : "Return Stock"}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Modal>
      </>
    );
  }
}

export default ReturnStock;