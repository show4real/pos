import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CardHeader,
  //UncontrolledTooltip,
  Media,
  Input,
} from "reactstrap";
import {
  faAngleDown,
  faAngleUp,
  faCheck,
  faCog,
  faHome,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
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
import {addProduct, deleteProduct, getProducts } from "../../services/productService";
import SpinDiv from "../components/SpinDiv";
import { getcategories } from "../../services/categoryService";
import AddProduct from "./AddProduct";
import AddCategories from "./AddCategories";
// import AddBrands from "./AddBrands";
import moment from "moment";
import 'antd/dist/antd.css';
import { Pagination } from 'antd';
import DeleteProduct from "./DeleteProduct";
import { throttle, debounce } from "../debounce"

export class Product extends Component {
  constructor(props) {
    super(props);
    
    // Get saved state from sessionStorage or use defaults
    const savedState = this.getSavedState();
    
    this.state = {
      search: savedState.search || "",
      page: savedState.page || 1,
      rows: savedState.rows || 10,
      category: savedState.category || '',
      loading: false,
      products: [],
      total: 0,
      total_cart: 0,
      cartItem: [],
      categories: [],
      cat: '',
      br: '',
      brand: '', // Added missing brand state
      showFilter: savedState.showFilter || false,
    };
    
    this.cartItem = JSON.parse(localStorage.getItem("cart"));
    this.setState({ cartItem: this.cartItem });
    this.searchDebounced = debounce(this.searchProducts, 500);
    this.searchThrottled = throttle(this.searchProducts, 500);
  }

  // Method to get saved state from sessionStorage
  getSavedState = () => {
    try {
      const savedState = sessionStorage.getItem('productPageState');
      return savedState ? JSON.parse(savedState) : {};
    } catch (error) {
      console.error('Error parsing saved state:', error);
      return {};
    }
  };

  // Method to save current state to sessionStorage
  saveState = () => {
    const stateToSave = {
      search: this.state.search,
      page: this.state.page,
      rows: this.state.rows,
      category: this.state.category,
      showFilter: this.state.showFilter,
    };
    
    try {
      sessionStorage.setItem('productPageState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  componentDidMount() {
    // Load categories first, then search products
    this.getCategories();
    this.searchProducts();
    this.cartItem = localStorage.removeItem("cart");
  }

  componentDidUpdate(prevProps, prevState) {
    // Save state whenever relevant state changes
    if (
      prevState.search !== this.state.search ||
      prevState.page !== this.state.page ||
      prevState.rows !== this.state.rows ||
      prevState.category !== this.state.category ||
      prevState.showFilter !== this.state.showFilter
    ) {
      this.saveState();
    }
  }

  handleSearch = event => {
    this.setState({ search: event.target.value, page: 1 }, () => {
      if(this.state.search < 5){
        this.searchThrottled(this.state.search);
      }else{
        this.searchDebounced(this.state.search);
      }
    });
  };

  onPage = async (page, rows) => {
    await this.setState({page, rows});
    await this.searchProducts();
  }

  getCategories = () => {
    this.setState({ loading: true });
    getcategories().then(
      (res) => {
        this.setState({
          categories: res.categories.data,
          loading: false
        });
      },
      (error) => {
        console.error('Error fetching categories:', error);
        this.setState({ loading: false });
      }
    );
  };

  searchProducts = () => {
    const { page, rows, search, category, brand } = this.state;
    this.setState({ loading: true });
    
    // Fixed: Removed 'products' from the API call parameters
    const searchParams = { 
      page, 
      rows, 
      search,
      ...(category && { category }), // Only include category if it has a value
      ...(brand && { brand }) // Only include brand if it has a value
    };
    
    getProducts(searchParams).then(
      (res) => {
        const newProducts = res.products.data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at,
          brand_name: item.brand_name,
          category_name: item.category_name,
        }));
          
        this.setState({
          products: newProducts,
          page: res.products.current_page,
          total: res.products.total,
          loading: false,
        });
      },
      (error) => {
        console.error('Error fetching products:', error);
        this.setState({ loading: false });
      }
    );
  };

  toggleFilter = (e) => {
    this.setState({ 
      cat: 'hello', 
      showFilter: !this.state.showFilter 
    }, () => {
      console.log(this.state.cat);
      // Only fetch categories if we don't have them or if showing filter
      if (this.state.showFilter && this.state.categories.length === 0) {
        this.getCategories();
      }
    });
  }

  onFilter = async (e, filter) => {
    console.log('Filtering by:', filter, 'Value:', e);
    await this.setState({[filter]: e, page: 1}); // Reset to page 1 when filtering
    await this.searchProducts();
  }

  // Clear all filters
  clearFilters = async () => {
    await this.setState({
      category: '',
      brand: '',
      search: '',
      page: 1
    });
    await this.searchProducts();
  }

  toggleCart = (cartCheckout) => {
    this.setState({ cartCheckout });
  };

  toggleAddProduct = () => {
    this.setState({addProduct: !this.state.addProduct});
  }

  toggleDeleteProduct = (deleteP) => {
    this.setState({deleteP});
  }

  toggleAddCategory = () => {
    this.setState({addCategories: !this.state.addCategories});
  }

  onChange = (e, state) => {
    this.setState({ [state]: e });
  };

  // Enhanced navigation method that saves state before navigating
  navigateToProduct = (productId) => {
    this.saveState(); // Ensure state is saved before navigation
    this.props.history.push('/products/' + productId);
  };

  render() {
    const { 
      products,
      categories,
      brand,
      category,
      total,
      showFilter,
      addProduct, 
      deleteP,
      addCategories, 
      page, 
      rows,
      search, 
      loading, 
      addToCart 
    } = this.state;
    
    return (
      <>
        {addProduct && (
          <AddProduct
            saved={this.searchProducts}
            addProduct={addProduct}
            toggle={() => this.setState({ addProduct: null })}
          />
        )}

        {deleteP && (
          <DeleteProduct
            saved={this.searchProducts}
            deleteP={deleteP}
            toggle={() => this.setState({ deleteP: null })}
          />
        )}
        
        {addCategories && (
          <AddCategories
            saved={this.searchProducts}
            addCategories={addCategories}
            toggle={() => this.setState({ addCategories: null })}
          />
        )}
        
        {loading && <SpinDiv text={"Loading..."} />}

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
                  <Breadcrumb.Item href="#products">products</Breadcrumb.Item>
                </Breadcrumb>
              </div>
              <div className="btn-toolbar mb-2 mb-md-0">
                <ButtonGroup>
                  <Button variant="outline-primary" size="sm"  
                    onClick={() => this.toggleAddProduct()} 
                  >
                    Add product
                  </Button>
                  <Button variant="outline-primary" size="sm"  
                    onClick={() => this.toggleAddCategory()} 
                  >
                    Create categories
                  </Button>
                  
                  <Button variant="outline-primary" size="sm"  
                    onClick={() => {this.props.history.push('/purchase_orders')}}
                  >
                    Purchase Order
                  </Button>

                  <Button variant="outline-primary" size="sm"  
                    onClick={() => {this.props.history.push('/stocked')}}
                  >
                    Stocks
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          </Col>
        </Row>
        
        <Row>
          <Col lg="6">
            <h6>Products({total})</h6>
          </Col>
          <Col lg="2">
            {!showFilter && (
              <div style={{ display: "flex", marginTop: 10 }}>
                <Button
                  variant="outline-primary"
                  id='filter'
                  onClick={this.toggleFilter}
                  size="sm"
                  style={{ marginRight: 10 }}
                >
                  Filter
                </Button>
              </div>
            )}
          </Col>
          <Col lg="4" className="">
            <div style={{ display: "flex" }}>
              <Input
                placeholder="Search..."
                autoFocus
                id="show"
                value={search}
                style={{ maxHeight: 45, marginRight: 5, marginBottom: 10 }}
                onChange={this.handleSearch}
              />
            </div>
          </Col>
        </Row>
        
        <Row>
          {showFilter && (
            <Row>
              <Col md={3} style={{fontWeight:"bold"}}>
                <Form.Group>
                  <Form.Label>Filter By Category</Form.Label>
                  <Form.Select
                    value={category}
                    type="select"
                    style={{ marginRight: 10, width: "fit-content" }}
                    onChange={(e) => this.onFilter(e.target.value, "category")}
                  >
                    <option value="">All Categories</option>
                    {categories.map((p, index) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={2} style={{marginTop:32}}>
                <Button
                  variant="outline-warning"
                  onClick={this.toggleFilter}
                  size="sm"
                  style={{ marginRight: 10 }}
                >
                  Hide Filters
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={this.clearFilters}
                  size="sm"
                >
                  Clear All
                </Button>
              </Col>
            </Row>
          )}
        </Row>

        <Card border="light" className="shadow-sm mb-4">
          <Card.Body className="pb-0">
            <Table
              responsive
              className="table-centered table-nowrap rounded mb-0"
            >
              <thead className="thead-light">
                <tr>
                  <th className="border-0">S/N</th>
                  <th className="border-0">Product</th>
                  <th className="border-0">category</th>
                  <th className="border-0">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, key) => {
                  return (
                    <tr key={product.id} style={{fontWeight:"bold",textTransform:"capitalize"}}>
                      <td>{key+1}</td>
                      <td>{product.name}</td>                
                      <td className="hover-list" onClick={() => {
                          this.navigateToProduct(product.id);
                        }}>{product.category_name}</td>
                      <td>
                        <ButtonGroup>
                          <Button
                            variant="outline-primary"
                            onClick={() => {
                              this.navigateToProduct(product.id);
                            }}
                            size="sm"
                          >
                            View
                          </Button>
                          <Button
                            variant="outline-danger"
                            onClick={() => {
                              this.toggleDeleteProduct(product)
                            }}            
                            size="sm"
                          >
                            Delete
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Row>
              <Col md={12} style={{fontWeight:"bold",paddingTop:3}}>
                {products.length < 1 &&
                  <div style={{color: '#ccc', alignSelf: 'center', padding: 10, fontSize: 13}}>
                    <i className="fa fa-ban" style={{marginRight: 5}}/>
                    No Products Found
                  </div>
                }
                {products.length > 0 && 
                  <Pagination
                    showSizeChanger
                    defaultCurrent={6}
                    total={total}
                    showTotal={total => `Total ${total} products`}
                    onChange={this.onPage}
                    pageSize={rows}
                    current={page}
                  />
                }
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </>
    );
  }
}

export default Product;