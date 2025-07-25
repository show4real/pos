import React, { Component } from "react";

import { Col, Row, Card, Form } from "@themesberg/react-bootstrap";

import { Button, InputNumber, Spin, Select } from "antd";

import SpinDiv from "../components/SpinDiv";
import axios from "axios";
import settings from "../../services/settings";
import { authHeader } from "../../services/authHeader";
import { authService } from "../../services/authService";
import { toast } from "react-toastify";
import { Modal } from "reactstrap";
import moment from "moment";
import { getProducts } from "../../services/productService";

const { Option } = Select;

export class AddOrder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      page: 1,
      selectedTitle: "",
      inputValue: "",
      product_id: "",
      rows: 10,
      loading: false,
      tags: [],
      attributes: [],
      validation: {},
      products: [],
      suppliers: [],
      supplier: 1,
      // suppliers: props.suppliers.map((opt) => ({
      //   label: opt.name,
      //   value: opt.id,
      // })),
      fromdate: moment().startOf("month"),
    };
  }

  componentDidMount() {
    this.getProducts();
  }

  // getSuppliers = (page, search) => {
  //   const { rows } = this.state;
  //   getSuppliers({ rows, page, search }).then(
  //     (res) => {
  //       this.setState({
  //         suppliers: res.suppliers.data.map((opt) => ({
  //           label: opt.name,
  //           value: opt.id,
  //         })),
  //       });
  //     },
  //     (error) => {
  //       this.setState({ loading: false });
  //     }
  //   );
  // };

  getProducts = () => {
    const { page, rows, search, products } = this.state;
    this.setState({ loading: true });
    getProducts({ page, rows, search }).then(
      (res) => {
        this.setState({
          products: [...products, ...res.products.data],
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
        () => this.getProducts()
      );
    }
  };

  // Handle search input
  handleSearch = (value) => {
    this.setState({ search: value, page: 1, products: [], hasMore: true }, () =>
      this.getProducts()
    );
  };

  validationRules = (field) => {
    if (field === "stock_quantity") {
      return "stock quantity is required";
    } else if (field === "unit_price") {
      return "Unit price is required";
    } else if (field === "supplier") {
      return "supplier is required";
    } else if (field === "product") {
      return "product is required";
    }
  };

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "success" }}>{msg}</div>);
  };

  onSaveStock = async (e) => {
    e.preventDefault();

    await toast.dismiss();
    const { stock_quantity, unit_price, supplier, validation, product_id } =
      this.state;
    console.log(product_id);
    await this.setState({
      validation: {
        ...validation,
        stock_quantity: stock_quantity !== "" && stock_quantity !== undefined,
        unit_price: unit_price !== "" && unit_price !== undefined,
        product: product_id !== "",
        // supplier: supplier !== "" && supplier !== undefined,
      },
    });
    if (Object.values(this.state.validation).every(Boolean)) {
      this.saveStock();
    } else {
      const errors = Object.keys(this.state.validation).filter((id) => {
        return !this.state.validation[id];
      });
      toast.dismiss();
      toast.configure({ hideProgressBar: true, closeButton: false });
      toast(
        <div style={{ padding: "10px 20px" }}>
          <p style={{ margin: 0, fontWeight: "bold", color: "red" }}>Errors:</p>
          {errors.map((v) => (
            <p key={v} style={{ margin: 0, fontSize: 14, color: "red" }}>
              * {this.validationRules(v)}
            </p>
          ))}
        </div>
      );
    }
  };

  saveStock = () => {
    this.setState({ saving: true });

    const { unit_price, stock_quantity, supplier, product_id } = this.state;

    let data = new FormData();

    data.set("unit_price", unit_price);
    data.set("product_id", product_id);
    data.set("stock_quantity", stock_quantity);
    //data.set("supplier", supplier);
    return axios
      .post(
        `${settings.API_URL}purchase_order`,
        data,
        {
          headers: authHeader(),
        },
        authService.handleResponse
      )
      .then((res) => {
        console.log(res.data);
        this.setState({ saving: false, edit: false });
        this.props.saved();
        this.props.toggle();

        this.showToast("Purchase order created");
      })
      .catch((err) => {
        console.log(err);
        this.setState({
          errorMessage: err.response.data,
          show: true,
        });
        if (this.state.errorMessage) {
          this.showToast("Server error");
        }
        this.setState({ saving: false });
      });
  };

  onChange = (e, state) => {
    this.setState({ [state]: e });
  };

  onChange2 = (value) => {
    this.setState({ product_id: value });
  };

  render() {
    const { addStock, toggle } = this.props;
    const { loading, products, addSupplier, saving } = this.state;
    return (
      <>
        <Modal
          className="modal-dialog modal-dialog-centered"
          isOpen={addStock != null}
          toggle={() => !loading && !saving && toggle}
          style={{ maxWidth: 750 }}
        >
          {/* Loading Overlay */}
          {loading && (
            <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 rounded" style={{ zIndex: 10 }}>
              <SpinDiv text={"Loading..."} />
            </div>
          )}

          {/* Modal Header */}
          <div className="modal-header border-0 pb-2" style={{ padding: "1.5rem 1.5rem 0.5rem" }}>
            <div className="d-flex align-items-center">
              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: 40, height: 40 }}>
                <i className="fas fa-shopping-cart text-white"></i>
              </div>
              <div>
                <h5 className="mb-0 fw-bold text-dark">Create Purchase Order</h5>
                <small className="text-muted">Add new inventory items</small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={toggle}
              disabled={loading || saving}
              style={{ fontSize: '0.875rem' }}
            ></button>
          </div>

          {/* Modal Body */}
          <Card border="0" className="shadow-none">
            <Card.Body style={{ padding: "0 1.5rem 1.5rem" }}>
              <Row className="g-4">
                {/* Product Selection */}
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark mb-2 small">
                      <i className="fas fa-search text-primary me-2"></i>
                      Select Product
                    </Form.Label>
                    <Select
                      showSearch
                      placeholder="Search and select a product..."
                      filterOption={false}
                      onSearch={this.handleSearch}
                      onPopupScroll={this.handlePopupScroll}
                      onChange={this.onChange2}
                      notFoundContent={loading ? <Spin size="small" /> : null}
                      style={{
                        width: "100%",
                        borderRadius: '8px'
                      }}
                      className="custom-select"
                    >
                      {products.map((product) => (
                        <Option key={product.id} value={product.id}>
                          <div className="d-flex align-items-center">
                            <span className="fw-medium">{product.name}</span>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Group>
                </Col>

                {/* Quantity and Price Row */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark mb-2 small">
                      <i className="fas fa-boxes text-success me-2"></i>
                      Purchase Order Units
                    </Form.Label>
                    <InputNumber
                      style={{
                        width: "100%",
                        height: 48,
                        borderRadius: 8,
                        fontSize: 16,
                      }}
                      className="custom-input-number"
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      onKeyPress={(event) => {
                        if (!/[0-9]/.test(event.key)) {
                          event.preventDefault();
                        }
                      }}
                      placeholder="Enter quantity"
                      onChange={(e) => this.onChange(e, "stock_quantity")}
                      min={1}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark mb-2 small">
                      <i className="fas fa-dollar-sign text-warning me-2"></i>
                      Unit Price
                    </Form.Label>
                    <InputNumber
                      style={{
                        width: "100%",
                        height: 48,
                        borderRadius: 8,
                        fontSize: 16,
                      }}
                      className="custom-input-number"
                      formatter={(value) =>
                        `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                      onKeyPress={(event) => {
                        if (!/[0-9.]/.test(event.key)) {
                          event.preventDefault();
                        }
                      }}
                      placeholder="Enter unit price"
                      onChange={(e) => this.onChange(e, "unit_price")}
                      min={0}
                      step={0.01}
                    />
                  </Form.Group>
                </Col>

                {/* Total Summary Card */}
                <Col md={12}>
                  <div className="bg-light rounded-3 p-3 border">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Estimated Total:</span>
                      <span className="fw-bold text-primary h6 mb-0">
                        ₦ {((this.state?.stock_quantity || 0) * (this.state?.unit_price || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Col>

                {/* Action Button */}
                <Col md={12}>
                  <div className="d-grid gap-2 mt-2 pb-3">
                    <Button
                      variant="primary"
                      size="lg"
                      disabled={saving}
                      onClick={this.onSaveStock}
                      className="py-3 fw-semibold rounded-3"
                      style={{
                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        border: 'none',
                        boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)',
                        height:45,
                        paddingBottom:10
                      }}
                    >
                      {saving ? (
                        <div className="d-flex align-items-center justify-content-center">
                          <Spin size="small" className="me-2" />
                          <span>Saving Purchase Order...</span>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="fas fa-save me-2"></i>
                          <span>Save Purchase Order</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Modal>

        <style jsx>{`
  .custom-select .ant-select-selector {
    border-radius: 8px !important;
    border: 1px solid #dee2e6 !important;
    height: 48px !important;
    display: flex !important;
    align-items: center !important;
  }
  
  .custom-select .ant-select-selection-placeholder {
    color: #6c757d !important;
  }
  
  .custom-input-number .ant-input-number {
    border: 1px solid #dee2e6 !important;
  }
  
  .custom-input-number .ant-input-number:hover {
    border-color: #007bff !important;
  }
  
  .custom-input-number .ant-input-number:focus {
    border-color: #007bff !important;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
  }
`}</style>
      </>
    );
  }
}

export default AddOrder;
