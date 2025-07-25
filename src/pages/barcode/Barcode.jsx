import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Input } from "reactstrap";
import { getbarcodes } from "../../services/brandService";
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
} from "@themesberg/react-bootstrap";

import SpinDiv from "../components/SpinDiv";

export class Barcode extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      page: 1,
      rows: 10,
      loading: false,
      barcodes: [],
      value:"",
      total: 0,
    }
  }

  componentDidMount() {
   this.getBarcodes();
  }
  

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "green" }}>{msg}</div>);
  };
  getBarcodes = () => {

    const { page, rows, search} = this.state;
    this.setState({ loading: true });
    getbarcodes({ page, rows, search }).then(
      (res) => {
        this.setState({
          loading: false,
          barcodes:res.barcodes.data,
          total:res.barcodes.total
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  
  
  onChange = (e, state) => {
    this.setState({ [state]: e });
  };

  
  
  render() {
    const {
      barcodes,
      total,
      search,
      loading
    } = this.state;
    return (
      <>
      
        

       

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
                  <Breadcrumb.Item href="#products">Barcodes</Breadcrumb.Item>
                </Breadcrumb>
              </div>
              <div className="btn-toolbar mb-2 mb-md-0">
                <ButtonGroup>
                  
                  <Button variant="outline-primary" size="sm"  
                  onClick={() => {this.props.history.push('/products')}}

                  >
                    Barcode
                  </Button>
                  
                 
                </ButtonGroup>
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col lg="7">
            <h6>Barcode({total})</h6>
           
          </Col>
          
          <Col lg="4" className="">
            <div style={{ display: "flex" }}>
              <Input
                placeholder="Search..."
                id="show"
                style={{ maxHeight: 45, marginRight: 5, marginBottom: 10 }}
                value={search}
                onChange={(e) => this.onChange(e.target.value, "search")}
                autoFocus
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    this.getBarcodes();
                    this.setState({
                      search: "",
                    });
                  }
                }}
              />
              <Button
                className="btn-icon btn-2"
                color="secondary"
                style={{ maxHeight: 45 }}
                size="sm"
                onClick={this.getBarcodes}
              >
                <i className="fa fa-search" />
              </Button>
            </div>
          </Col>
        </Row>
        
        <Card border="light" className="shadow-sm mb-4">
          
          <Card.Body className="pb-0">
            <Table
              responsive
              className="table-centered table-nowrap rounded mb-0"
            >
              <thead className="thead-light">
                <tr>
                  <th className="border-0">Barcode</th>
                  <th className="border-0">Product name</th>
                </tr>
              </thead>
              <tbody>
            
                {barcodes.map((barcode, key) => {
                  return (
                    <tr key={key}>
                      <td>{barcode.barcode}</td>
                      <td>{barcode.product_name}</td>
                      <td>
                            <Button
                              color="secondary"
                           
                              size="sm"
                            >
                              Print
                            </Button>
                      </td>
                      
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </>
    );
  }
}

export default Barcode;
