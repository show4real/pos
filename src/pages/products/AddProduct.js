import React, { Component } from "react";
import SpinDiv from "../components/SpinDiv";
import { toast } from "react-toastify";
import { addProduct } from "../../services/productService";
import AddCategories from "./AddCategories";
import { toggleAddCategory } from "./AddCategories";
import { AsyncPaginate } from "react-select-async-paginate";
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
import { CardHeader, Media, Input, Modal } from "reactstrap";
import { getcategories } from "../../services/categoryService";
// import { getbrands } from "../../services/brandService";
export class AddProduct extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      page: 1,
      rows: 10,
      loading: false,
      //brand_id: "",
      category_id: "",
      description: "",
      product_name: "",
      categories: [],
      // brands:[],
    };
  }
  onChange = (e, state) => {
    this.setState({ [state]: e });
  };

  componentDidMount() {
    this.getCategories();
    // this.getBrands();
  }

  onSaveProduct = async (e) => {
    e.preventDefault();
    await toast.dismiss();
    const { category_id, product_name, brand_id, description, validation } =
      this.state;
    await this.setState({
      validation: {
        ...validation,
        product_name: product_name !== "",
        category_id: category_id !== "",
        // brand_id: brand_id !== "",
        //description: description !== "",
      },
    });
    if (Object.values(this.state.validation).every(Boolean)) {
      this.saveProduct();
    } else {
      const errors = Object.keys(this.state.validation).filter((id) => {
        return !this.state.validation[id];
      });
      //await toast.configure({hideProgressBar: true, closeButton: false});
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
  getCategories = () => {
    getcategories().then(
      (res) => {
        this.setState({
          categories: res.categories.data,
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  

  validationRules = (field) => {
    
    if (field === "category_id") {
      return "Category field is required";
    } else if (field === "product_name") {
      return "product name is required";
    }
  };

  saveProduct = () => {
    this.setState({ loading: true });
    const { history } = this.props;
    const { category_id, product_name, description } = this.state;
    console.log();
    addProduct({
      category_id: category_id,
      product_name: product_name,
      // brand_id: brand_id,
      description: description,
    })
      .then((res) => {
        console.log(res);
        this.setState({ loading: false });
        this.props.toggle();
        this.props.saved();
        this.showToast("Product saved");
      })
      .catch((err) => {
        console.log(err);
        this.setState({
          errorMessage: err,
          show: true,
        });
        if (this.state.errorMessage) {
          this.showToast(this.state.errorMessage);
        }
        this.setState({ saving: false });
      });
  };

  showToast = (msg) => {
    toast(<div style={{ padding: 20 }}>{msg}</div>);
  };

  render() {
    const { addProduct, toggle } = this.props;
    const {
      category_id,
      product_name,
      // brand_id,
      description,
      saving,
      validation,
      loading,
      categories,
      //brands
    } = this.state;
    return (
      <>
        <Modal
          className="modal-dialog modal-dialog-centered"
          isOpen={addProduct}
          toggle={() => !loading && toggle}
          style={{ maxWidth: 700 }}
        >
          {loading && <SpinDiv text={"Saving..."} />}

          {/* Modal Header */}
          <div className="modal-header border-bottom" style={{ padding: "1.5rem" }}>
            <h4 className="modal-title mb-0 text-success">
              <i className="fas fa-plus-circle me-2"></i>
              Create Product
            </h4>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={toggle}
              disabled={loading || saving}
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body" style={{ padding: "2rem" }}>
            <Card border="light" className="shadow-sm">
              <Card.Body>

                {/* Product Information Section */}
                <div className="product-info-section mb-4">
                  <h6 className="text-muted mb-3 fw-semibold">
                    <i className="fas fa-info-circle me-2"></i>
                    Product Information
                  </h6>

                  <Row className="g-3">
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold mb-2">
                          <i className="fas fa-tag me-2"></i>
                          Product Name
                          <span className="text-danger ms-1">*</span>
                        </Form.Label>
                        <Form.Control
                          value={product_name}
                          required
                          type="text"
                          placeholder="Enter product name"
                          onChange={async (e) => {
                            await this.onChange(e.target.value, "product_name");
                          }}
                          style={{
                            height: "45px",
                            borderRadius: "8px",
                            border: "2px solid #e9ecef",
                            fontSize: "16px"
                          }}
                          className="form-control"
                        />
                      </Form.Group>
                    </Col>

                    
                  </Row>
                  <Row>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold mb-2">
                          <i className="fas fa-align-left me-2"></i>
                          Description
                          {/* <span className="text-danger ms-1">*</span> */}
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          required
                          placeholder="Enter product description"
                          onChange={async (e) => {
                            await this.onChange(e.target.value, "description");
                          }}
                          value={description}
                          style={{
                            borderRadius: "8px",
                            border: "2px solid #e9ecef",
                            fontSize: "16px",
                            resize: "vertical"
                          }}
                          className="form-control"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Category Section */}
                <div className="category-section mb-4">
                  <h6 className="text-muted mb-3 fw-semibold">
                    <i className="fas fa-layer-group me-2"></i>
                    Category & Classification
                  </h6>

                  <Row>
                    <Col lg={8}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold mb-2">
                          <i className="fas fa-folder me-2"></i>
                          Category
                          <span className="text-danger ms-1">*</span>
                        </Form.Label>
                        <Form.Select
                          required
                          value={category_id}
                          onChange={async (e) => {
                            await this.onChange(e.target.value, "category_id");
                          }}
                          style={{
                            height: "45px",
                            borderRadius: "8px",
                            border: "2px solid #e9ecef",
                            fontSize: "16px"
                          }}
                          className="form-select"
                        >
                          <option value="">Choose category...</option>
                          {categories.length === 0 && (
                            <option value="" disabled>Loading categories...</option>
                          )}
                          {categories.map((category, index) => (
                            <option value={category.id} key={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </Form.Select>

                        {categories.length === 0 && (
                          <small className="text-muted mt-1 d-block">
                            <i className="fas fa-spinner fa-spin me-1"></i>
                            Loading available categories...
                          </small>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Optional Brand Section (commented out but styled for future use) */}
                {/* 
        <div className="brand-section mb-4">
          <h6 className="text-muted mb-3 fw-semibold">
            <i className="fas fa-copyright me-2"></i>
            Brand Information
          </h6>
          
          <Row>
            <Col lg={8}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold mb-2">
                  <i className="fas fa-award me-2"></i>
                  Brand
                </Form.Label>
                <Form.Select
                  value={brand_id}
                  onChange={async (e) => {
                    await this.onChange(e.target.value, "brand_id");
                  }}
                  style={{
                    height: "45px",
                    borderRadius: "8px",
                    border: "2px solid #e9ecef",
                    fontSize: "16px"
                  }}
                  className="form-select"
                >
                  <option value="">Choose brand...</option>
                  {brands.map((brand, index) => (
                    <option value={brand.id} key={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </div>
        */}

                {/* Form Validation Alert */}
                <div className="alert alert-light border d-flex align-items-center" role="alert">
                  <i className="fas fa-lightbulb me-3 text-warning"></i>
                  <small className="mb-0">
                    <strong>Note:</strong> Fields marked with <span className="text-danger">*</span> are required.
                    Make sure to fill in all required information before saving.
                  </small>
                </div>

              </Card.Body>
            </Card>
          </div>

          {/* Modal Footer */}
          <div
            className="modal-footer border-top d-flex justify-content-between align-items-center"
            style={{
              padding: "1.5rem",
              backgroundColor: "#f8f9fa"
            }}
          >
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              All fields are required unless marked optional
            </small>

            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="lg"
                onClick={toggle}
                disabled={saving || loading}
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
                variant="success"
                size="lg"
                onClick={this.onSaveProduct}
                disabled={saving || loading || !product_name.trim() || !category_id}
                style={{
                  borderRadius: "8px",
                  paddingLeft: "2rem",
                  paddingRight: "2rem",
                  fontWeight: "500",
                  boxShadow: "0 2px 4px rgba(40,167,69,0.3)"
                }}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus me-2"></i>
                    Create Product
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

export default AddProduct;
