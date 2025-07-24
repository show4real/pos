import React, { Component } from "react";

import { ChoosePhotoWidget, ProfileCardWidget } from "../../components/Widgets";
import { getProduct } from "../../services/productService";
import AttributeOptions from "../products/AttributeOptions";
import { toast } from "react-toastify";
import {
  Col,
  Row,
  Card,
  Table,
  Form,
  ButtonGroup,
  InputGroup,
} from "@themesberg/react-bootstrap";
import { Input } from "reactstrap";
import { Pagination } from "antd";

import {
  faEnvelope,
  faPhone,
  faLock,
  faPencilAlt,
  faAddressCard,
  faTimes,
  faPlus,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Profile3 from "../../assets/img/team/profile-picture-3.jpg";
import SpinDiv from "../components/SpinDiv";
import axios from "axios";
import settings from "../../services/settings";
import { authHeader } from "../../services/authHeader";
import { authService } from "../../services/authService";
import AddAttribute from "../products/AddAttribute";
import { getSinglePurchaseOrder } from "../../services/purchaseOrderService";
import { updatePurchaseOrder } from "../../services/purchaseOrderService";
import moment from "moment";
import productss from "../data/products";
import ConfirmOrder from "./ConfirmOrder";
import { formatCurrency, format } from "../../services/formatCurrencyService";
import { Button } from "antd";
import MovedOrder from "./MovedOrder";
import EditSerial from "./EditSerial";
import ReturnOrder from "./ReturnOrder";
import { Tooltip } from "antd";
import EditPrice from "./EditPrice";
import AddMoreOrder from "./AddMoreOrder";
import EditBarcode from "./EditBarcode";

export class Order extends Component {
  constructor(props) {
    super(props);
    const { location: state } = props;

    this.state = {
      loading: false,
      edit: false,
      editProduct: false,
      change: false,
      product: {},
      attributes: [],
      attribute_col: [],
      branches: [],
      suppliers: [],
      validation: {},
      product_attributes_values: [],
      rows: 10,
      page: 1,
      total: 0,
      submitted: false,
      stock: state && state.project ? state.project : null,
      selectedTitle: "",
      validation: {},
      valerror: "red",
      id: props.match.params.id,
      product_id: props.match.params.product_id,
      company: JSON.parse(localStorage.getItem("company")),
      purchase_serials: [],
      movedItem: [],
    };
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.getProduct();
    this.getPurchaseOrders();
  }
  handleKeyPress = (event) => {
    this.setState({
      valerror: "",
    });
  };

  toggleAddAttribute = () => {
    this.setState({ addAttributes: !this.state.addAttributes });
  };

  getProduct = () => {
    const { product_id } = this.state;
    this.setState({ loading: true });
    getProduct(product_id).then(
      (res) => {
        console.log(res.attributes);
        this.setState({
          loading: false,
          product: res.product,
          attributes: res.attributes,
          initialProduct: { ...res.product },
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  toggleAttributeValue = (addAttributeValue) => {
    this.setState({ addAttributeValue });
  };

  toggleConfirmOrder = (confirmOrder) => {
    this.setState({ confirmOrder });
  };

  toggleReturnOrder = () => {
    const { id } = this.state;
    this.setState({ returnOrder: id });
  };

  toggleViewMovedOrder = () => {
    const { movedItem } = this.state;
    this.setState({ viewMovedOrder: movedItem });
  };

  getPurchaseOrders = () => {
    const { product_id, rows, page, id } = this.state;
    getSinglePurchaseOrder({ rows, page, product_id, id }).then(
      (res) => {
        console.log(res);
        this.setState({
          loading: false,
          stock: { ...res.purchase_order },
          suppliers: res.suppliers,
          branches: res.branches,
          initialStock: { ...res.purchase_order },
          purchase_serials:
            res.purchase_order_serials !== null
              ? res.purchase_order_serials.data
              : [],
          total: res.purchase_order_serials.total,
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  toggleEdit = () => {
    const { initialStock } = this.state;
    this.setState({ edit: !this.state.edit, stock: { ...initialStock } });
  };

  toggleEditProduct = () => {
    const { initialProduct } = this.state;
    this.setState({ editProduct: !this.state.editProduct });
  };

  validationRules = (field) => {
    if (field === "stock_quantity") {
      return "stock quantity is required";
    } else if (field === "unit_price") {
      return "Unit price is required";
    } else if (field === "supplier") {
      return "supplier is required";
    } else if (field === "branch") {
      return "Branch is required";
    }
  };

  formatNumber = (number) => {
    return format(number);
  };

  formatC = (x) => {
    return formatCurrency(x);
  };

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "success" }}>{msg}</div>);
  };

  onPage = async (page, rows) => {
    await this.setState({ page, rows });
    await this.getPurchaseOrders();
  };

  onupdateStock = async (e) => {
    e.preventDefault();
    await toast.dismiss();
    const { stock, validation, product_attributes_values } = this.state;
    const { stock_quantity, unit_price, supplier, branch_id } = stock;
    await this.setState({
      validation: {
        ...validation,
        stock_quantity: stock.stock_quantity !== "",
        unit_price: stock.unit_price !== "",
        supplier: stock.supplier !== "",
        branch_id: stock.branch_id !== "",
      },
    });
    console.log(this.state.validation.stock_quantity);
    if (Object.values(this.state.validation).every(Boolean)) {
      this.saveStock();
    } else {
      this.setState({ valerror: "red" });
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

    const { product_attributes_values, stock, id, product_id } = this.state;

    let attribute_values = "";
    let attribute_keys = "";
    let data = new FormData();
    for (let x in product_attributes_values) {
      attribute_values += product_attributes_values[x] + ",";
      let attribute_values_1 = attribute_values.slice(0, -1);
      data.set("product_attributes", JSON.stringify(attribute_values_1));
    }
    let product_attribute_keys = Object.keys(product_attributes_values);
    for (let x in product_attribute_keys) {
      attribute_keys += product_attribute_keys[x] + ",";
      let attribute_keys_1 = attribute_keys.slice(0, -1);
      data.set("product_attributes_keys", JSON.stringify(attribute_keys_1));
    }
    data.set("unit_price", stock.unit_price);
    data.set("product_id", product_id);
    data.set("stock_quantity", stock.stock_quantity);
    data.set("supplier", stock.supplier_id);
    data.set("branch_id", stock.branch_id);
    return axios
      .post(
        `${settings.API_URL}updatepurchase_order/${id}`,
        data,
        {
          headers: authHeader(),
        },
        authService.handleResponse
      )
      .then((res) => {
        console.log(res.data);
        this.setState({ saving: false, edit: false });
        this.getPurchaseOrders(id);

        this.showToast("Purchae order Updated");
      })
      .catch((err) => {
        console.log(err);
        this.setState({
          errorMessage: err.response.data,
          show: true,
        });
        if (this.state.errorMessage) {
          this.showToast(this.state.errorMessage);
        }
        this.setState({ saving: false });
      });
  };

  onChange = (e, state) => {
    const { stock } = this.state;

    this.setState({ stock: { ...stock, [state]: e } });
    console.log(stock);
  };

  handleChange = (event) => {
    const { value, name } = event.target;
    const { product_attributes_values } = this.state;
    this.setState({
      product_attributes_values: {
        ...product_attributes_values,
        [name]: value,
      },
    });
  };
  attributeCols = (pd) => {
    let temp = new Array();
    temp = pd.split(",");

    return temp.map((attrs, key) => {
      return (
        <td>{attrs.replace(/^"(.*)"$/, "$1").replace(/^"(.*)"$/, "$1")}</td>
      );
    });
  };

  toggleMoveOrder = (movedOrder) => {
    var orders = this.state.movedItem === null ? [] : [...this.state.movedItem];

    var order = orders.find((order) => order.id === movedOrder.id);
    orders.push(movedOrder);

    this.setState({ movedItem: orders });
    localStorage.setItem("orders", JSON.stringify(orders));
  };

  inCart = (movedID) => {
    let inCartIds = this.state.movedItem;

    if (inCartIds !== null) {
      var result = inCartIds.map((order, key) => {
        return order.id;
      });
      let validateId = result.includes(movedID);

      return validateId;
    } else {
      return false;
    }
  };

  clearOrder() {
    this.setState({ movedItem: [] });
    this.getPurchaseOrders();
  }

  toggleEditSerial = (editSerial) => {
    this.setState({ editSerial });
  };
  toggle = () => {
    this.setState({ editSerial: !this.state.editSerial });
    this.getPurchaseOrders();
  };

  toggleClosePrice = () => {
    this.setState({ editPrice: !this.state.editPrice });
    this.getPurchaseOrders();
  };

  toggleCloseBarcode = () => {
    this.setState({ editBarcode: !this.state.editBarcode });
    this.getPurchaseOrders();
  };

  toggleCloseAddOrder = () => {
    this.setState({ addOrder: !this.state.addOrder });
    this.getPurchaseOrders();
  };

  toggleChangePrice = (editPrice) => {
    this.setState({ editPrice });
    this.getPurchaseOrders();
  };

  toggleUpdateBarcode = (editBarcode) => {
    this.setState({ editBarcode });
    this.getPurchaseOrders();
  };

  toggleAddMoreOrder = (addOrder) => {
    this.setState({ addOrder });
    this.getPurchaseOrders();
  };

  render() {
    const {
      product,
      purchase_order,
      validation,
      addAttributes,
      addAttributeValue,
      purchase_serials,
      rows,
      page,
      id,
      total,
      company,
      submitted,
      movedItem,
      confirmOrder,
      attributes,
      categories,
      branches,
      suppliers,
      saving,
      stock,
      loading,
      edit,
      editProduct,
      editSerial,
      valerror,
      viewMovedOrder,
      editPrice,
      returnOrder,
      addOrder,
      editBarcode
    } = this.state;

    return (
      <>
        {addAttributeValue && (
          <AttributeOptions
            saved={this.getProduct}
            addAttributeValue={addAttributeValue}
            toggle={() => this.setState({ addAttributeValue: null })}
          />
        )}

        {confirmOrder && (
          <ConfirmOrder
            saved={this.getPurchaseOrders}
            branches={branches}
            confirmOrder={confirmOrder}
            toggle={() => this.setState({ confirmOrder: null })}
          />
        )}

        {returnOrder && (
          <ReturnOrder
            saved={this.getPurchaseOrders}
            branches={branches}
            serial={returnOrder}
            toggle={() => this.setState({ returnOrder: null })}
          />
        )}
        {viewMovedOrder && (
          <MovedOrder
            saved={this.getPurchaseOrders}
            branches={branches}
            movedOrder={movedItem}
            id={id}
            toggle={() =>
              this.setState({ viewMovedOrder: null, movedItem: [] })
            }
          />
        )}

        {editSerial && (
          <EditSerial serial={editSerial} toggle={() => this.toggle()} />
        )}

        {editPrice && (
          <EditPrice stock={editPrice} toggle={() => this.toggleClosePrice()} />
        )}

        {editBarcode && (
          <EditBarcode stock={editBarcode} toggle={() => this.toggleCloseBarcode()} />
        )}

        {addOrder && (
          <AddMoreOrder
            stock={addOrder}
            toggle={() => this.toggleCloseAddOrder()}
          />
        )}

        {addAttributes && (
          <AddAttribute
            saved={this.getPurchaseOrders}
            product_id={product.id}
            addAttributes={addAttributes}
            toggle={() => this.setState({ addAttributes: null })}
          />
        )}
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
          <div className="d-flex"></div>
        </div>
        <Row>
          <Col lg="7">
            <h6>Purchase Order</h6>
          </Col>
        </Row>
        {stock && (
          <>
            <Row>
              <Col xs={12} xl={6}>
                <Row>
                  <Card border="light" className="bg-white shadow-sm mb-4">
                    <Card.Body>
                      <Row>
                        {saving && <SpinDiv text={"Saving..."} />}
                        <Col md={12} className="mb-3">
                          <Row>
                            <Col
                              className="text-left"
                              md={12}
                              style={{ marginBottom: 10 }}
                            >
                              {stock.status !== "Confirmed" ? (
                                <Button
                                  variant={edit ? "secondary" : "primary"}
                                  onClick={this.toggleEdit}
                                  size="sm"
                                >
                                  {edit
                                    ? "Discard Changes"
                                    : "EDIT PURCHASE ORDER"}
                                </Button>
                              ) : (
                                ""
                              )}
                            </Col>
                          </Row>
                          <Row>
                            <Col md={8}>
                              <Form.Group id="lastName">
                                <Form.Label>Product Name</Form.Label>

                                <Form.Control
                                  required
                                  type="text"
                                  value={stock.product_name}
                                  disabled
                                />
                              </Form.Group>
                            </Col>
                            {/* <Col md={4} style={{ paddingTop: 30 }}>
                            <ButtonGroup>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => this.toggleAddAttribute()}
                              >
                                ADD PRODUCT VARIANT
                              </Button>


                            </ButtonGroup>
                          </Col> */}
                          </Row>

                          {edit &&
                            attributes &&
                            attributes.map((attribute, key) => {
                              return (
                                <Row>
                                  <Col md={7} className="mb-3">
                                    <Form.Group className="mb-2">
                                      <Form.Label
                                        style={{ paddingTop: "10px" }}
                                      >
                                        Select {attribute.name}
                                      </Form.Label>

                                      <Form.Select
                                        id="state"
                                        disabled={!edit}
                                        required
                                        onselect={this.handleKeyPress.bind(
                                          this
                                        )}
                                        name={`${attribute.name}`}
                                        onChange={this.handleChange}
                                      >
                                        <option value="">
                                          choose {attribute.name}{" "}
                                        </option>
                                        {attribute.attributevalues.map(
                                          (p, index) => (
                                            <option
                                              value={p.attribute_value}
                                              key={p}
                                            >
                                              {p.attribute_value}
                                            </option>
                                          )
                                        )}
                                      </Form.Select>
                                    </Form.Group>
                                  </Col>
                                  <Col md={5} style={{ paddingTop: 20 }}>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      style={{
                                        marginTop: "30px",
                                        textTransform: "uppercase",
                                      }}
                                      onClick={() =>
                                        this.toggleAttributeValue(attribute)
                                      }
                                    >
                                      ADD VALUES TO &nbsp;
                                      <b>{attribute.name}</b> &nbsp;VARIANT
                                    </Button>
                                  </Col>
                                </Row>
                              );
                            })}
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Group id="lastName">
                            <Form.Label>Purchae order Unit</Form.Label>

                            <Form.Control
                              type="number"
                              disabled={!edit}
                              onKeyUp={this.handleKeyPress.bind(this)}
                              style={{
                                marginRight: 10,
                                width: "100%",
                                color:
                                  validation.stock_quantity === false
                                    ? valerror
                                    : null,
                              }}
                              value={
                                stock.stock_quantity == null
                                  ? (stock.stock_quantity = "")
                                  : stock.stock_quantity
                              }
                              onChange={async (e) => {
                                await this.onChange(
                                  e.target.value,
                                  "stock_quantity"
                                );
                              }}
                            />
                            {console.log(validation.stock_quantity)}
                          </Form.Group>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Group id="lastName">
                            <Form.Label>Unit Price</Form.Label>

                            <Input
                              type="number"
                              disabled={!edit}
                              value={
                                stock.unit_price == null
                                  ? (stock.unit_price = "")
                                  : stock.unit_price
                              }
                              onKeyUp={this.handleKeyPress.bind(this)}
                              onChange={async (e) => {
                                await this.onChange(
                                  e.target.value,
                                  "unit_price"
                                );
                              }}
                              style={{
                                marginRight: 10,
                                width: "100%",
                                color:
                                  validation.unit_price === false
                                    ? valerror
                                    : null,
                              }}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Group id="lastName">
                            <Form.Label>Supplier</Form.Label>

                            <Form.Select
                              id="state"
                              required
                              value={stock.supplier_id}
                              onChange={async (e) => {
                                await this.onChange(
                                  e.target.value,
                                  "supplier_id"
                                );
                              }}
                              style={{
                                marginRight: 10,
                                width: "100%",
                                color:
                                  validation.supplier === false
                                    ? valerror
                                    : null,
                              }}
                              onKeyUp={this.handleKeyPress.bind(this)}
                            >
                              <option value="">Select Supplier</option>
                              {suppliers.map((p, index) => (
                                <option value={p.id} key={p}>
                                  {p.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>

                        <div className="mt-3">
                          {edit && (
                            <div>
                              <Button
                                variant="primary"
                                type="submit"
                                disabled={saving}
                                onClick={this.onupdateStock}
                              >
                                Save Purchase order
                              </Button>
                            </div>
                          )}
                        </div>
                      </Row>
                    </Card.Body>
                  </Card>
                </Row>
                
              </Col>
            </Row>
            <Row>
              <Col xs={12} xl={12}>
                <Row>
                  <h5 style={{ paddingTop: "15px" }}>Order Overview</h5>
                  <Col xs={12}>
                    <Card.Body className="bg-white shadow-sm mb-4">
                      <Table
                        responsive
                        className="table-centered table-nowrap rounded mb-0"
                      >
                        <thead className="thead-light">
                          <tr>
                            <th className="border-0">Product</th>
                            <th className="border-0">Barcode</th>
                            <th className="border-0">Instock</th>

                            <th className="border-0">Order unit</th>
                            <th className="border-0">Purchase Price</th>
                            <th className="border-0">Selling Price</th>
                            <th className="border-0">Action</th>
                            
                          </tr>
                        </thead>
                        <tbody>
                          {
                            <tr>
                              <td>{stock.product_name}</td>
                              <td>{stock.barcode}</td>
                              <td>{this.formatNumber(stock.in_stock)}</td>
                              <td>{this.formatNumber(stock.stock_quantity)}</td>
                              <td>{this.formatC(stock.unit_price)}</td>
                              <td>{this.formatC(stock.unit_selling_price)}</td>
                              <td>
                                <ButtonGroup>
                                  
                                  <Button
                                    variant="outline-primary"
                                    type="submit"
                                    disabled={saving}
                                    onClick={() =>
                                      this.toggleUpdateBarcode(stock)
                                    }
                                  >
                                    Update Barcode
                                  </Button>
                                
                                  {stock.unit_selling_price !== null && (
                                  <Button
                                    variant="outline-primary"
                                    type="submit"
                                    disabled={saving}
                                    onClick={() =>
                                      this.toggleChangePrice(stock)
                                    }
                                  >
                                    Edit Prices
                                  </Button>
                                )}
                                {stock.quantity_moved > 0 && (
                                  <Button
                                    variant="outline-primary"
                                    type="submit"
                                    disabled={saving}
                                    onClick={() =>
                                      this.toggleAddMoreOrder(stock)
                                    }
                                  >
                                    Add more Quantity
                                  </Button>
                                )}
                                </ButtonGroup>
                                
                              </td>
                              
                            </tr>
                          }
                        </tbody>
                      </Table>
                      
                    </Card.Body>
                  </Col>
                  <Col xs={12}>
                    <Card.Body className="bg-white shadow-sm mb-4">
                      <Row>
                        <h5 style={{ paddingTop: "15px" }}>
                          Purchase Order Status
                        </h5>
                        <Table
                          responsive
                          className="table-centered table-nowrap rounded mb-0"
                        >
                          <thead className="thead-light">
                            <tr>
                              <th className="border-0">Tracking Id</th>
                              <th className="border-0">Status</th>
                              <th className="border-0">Returned Qty</th>
                              <th className="border-0">Moved Qty</th>
                              <th className="border-0">created at</th>
                              <th className="border-0">Received at</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{stock.tracking_id}</td>
                              <td>{stock.status}</td>
                              <td>{stock.quantity_returned}</td>
                              <td>{stock.quantity_moved}</td>
                              <td>
                                {moment(stock.created_at).format("MMM DD YYYY")}
                              </td>
                              <td>
                                {stock.received_at !== null
                                  ? moment(stock.received_at).format(
                                      "MMM DD YYYY"
                                    )
                                  : ""}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <ButtonGroup>
                                {stock.status == "Pending" && (
                                  <Button
                                    variant="outline-primary"
                                    type="submit"
                                    disabled={saving}
                                    onClick={() =>
                                      this.toggleConfirmOrder({
                                        ...stock,
                                        ...{ cancel: 1 },
                                      })
                                    }
                                  >
                                    Reject order
                                  </Button>
                                )}
                                {stock.status == "Confirmed" &&
                                      stock.stock_quantity !==
                                        stock.quantity_moved &&
                                      company.sell_by_serial_no !== 1 && (
                                        <Button
                                          variant="outline-primary"
                                          type="submit"
                                          disabled={saving}
                                          onClick={() =>
                                            this.toggleConfirmOrder({
                                              ...stock,
                                              ...{ return: 1 },
                                            })
                                          }
                                        >
                                          Return Order
                                        </Button>
                                      )}
                                       {stock.status == "Confirmed" &&
                                      company.sell_by_serial_no == 1 && (
                                        <Button
                                          variant="outline-primary"
                                          type="submit"
                                          disabled={saving}
                                          onClick={() =>
                                            this.toggleReturnOrder()
                                          }
                                        >
                                          Return Order
                                        </Button>
                                      )}
                                       {stock.status == "Confirmed" &&
                                      stock.in_stock > 0 &&
                                      company.sell_by_serial_no !== 1 && (
                                        <Button
                                          variant="outline-primary"
                                          type="submit"
                                          disabled={saving}
                                          onClick={() =>
                                            this.toggleConfirmOrder({
                                              ...stock,
                                              ...{ move: 1 },
                                            })
                                          }
                                        >
                                          Move Order
                                        </Button>
                                      )}
                                       {stock.status === "Confirmed" ? (
                                  <Button
                                    variant="outline-success"
                                    type="submit"
                                    onClick={() => {
                                      //console.log('111')
                                      this.props.history.push("/stocked");
                                    }}
                                  >
                                    View Stock
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline-primary"
                                    type="submit"
                                    disabled={saving}
                                    onClick={() =>
                                      this.toggleConfirmOrder({
                                        ...stock,
                                        ...{ confirm: 1 },
                                      })
                                    }
                                  >
                                    {stock.status == "Rejected"
                                      ? "Cancel Rejection"
                                      : "Confirm Order"}
                                  </Button>
                                )}
                                </ButtonGroup>
                              </td>
                              
                            </tr>
                          </tbody>
                        </Table>
                      </Row>
                    </Card.Body>
                  </Col>
                </Row>
              </Col>
            </Row>
          </>
        )}
      </>
    );
  }
}

export default Order;
