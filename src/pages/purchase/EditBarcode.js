import React, { Component, createRef } from "react";
import { CardHeader, Media, Input, Modal } from "reactstrap";
import {
  Col,
  Row,
  Form,
} from "@themesberg/react-bootstrap";
import { Button } from "antd";
import { editBarcode } from "../../services/purchaseOrderService";
import SpinDiv from "../components/SpinDiv";
import { toast } from "react-toastify";

export class EditBarcode extends Component {
  constructor(props) {
    super(props);
    this.state = {
      saving: false,
      loading: false,
      barcode: props.stock.barcode || '',
      id: props.stock.id,
      submitted: false,
      scannedBarcodes: [],
    };
    this.inputRef = createRef();
  }

  componentDidMount() {
    // Focus the input when component mounts
    setTimeout(() => {
      if (this.inputRef.current) {
        this.inputRef.current.focus();
      }
    }, 100);
  }

  onChange = (e, state) => {
    this.setState({ [state]: e });
  };

  handleBarcodeChange = (e) => {
    this.setState({
      barcode: e.target.value,
    });
  };

  handleKeyPress = (e) => {
    if (e.key === 'Enter' && this.state.barcode.trim()) {
      this.addScannedBarcode();
    }
  };

  addScannedBarcode = () => {
    const { barcode, scannedBarcodes } = this.state;
    const trimmedBarcode = barcode.trim();
    
    if (!trimmedBarcode) return;

    // Remove existing barcode if it exists, then add the new one
    const filteredBarcodes = scannedBarcodes.filter(item => item.code !== trimmedBarcode);
    const newBarcode = {
      code: trimmedBarcode,
      timestamp: new Date().toLocaleTimeString(),
      id: Date.now()
    };

    this.setState({
      scannedBarcodes: [...filteredBarcodes, newBarcode],
    });

    // Refocus input for next scan and select text
    setTimeout(() => {
      if (this.inputRef.current) {
        this.inputRef.current.focus();
        this.inputRef.current.select();
      }
    }, 0);
  };

  removeScannedBarcode = (id) => {
    this.setState({
      scannedBarcodes: this.state.scannedBarcodes.filter(item => item.id !== id)
    });
  };

  saveBarcode = async () => {
    await toast.dismiss();
    this.setState({ saving: true, submitted: true });

    const { barcode, id } = this.state;
    
    if (!barcode.trim()) {
      this.setState({ saving: false });
      return;
    }

    editBarcode({
      barcode: barcode.trim(),
      id: id,
    }).then(
      (res) => {
        this.setState({ loading: false, saving: false });
        this.showToast("Barcode has been updated");
        this.props.toggle();
      },
      (error) => {
        this.setState({ loading: false, saving: false });
        alert("Please set barcode");
      }
    );
  };

  onSave = () => {
    this.saveBarcode();
  };

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "green" }}>{msg}</div>);
  };

  render() {
    const { stock, toggle } = this.props;

    const { saving, submitted, barcode, loading, scannedBarcodes } = this.state;
    
    return (
      <>
        {saving && <SpinDiv text={"Saving..."} />}
        {loading && <SpinDiv text={"loading..."} />}
        <Modal
          className="modal-dialog modal-dialog-centered"
          isOpen={stock != null}
          toggle={() => !loading && !saving && toggle}
          style={{ maxWidth: 600 }}
        >
          <div className="modal-header" style={{ padding: "1rem" }}>
            <h5>Update Barcode</h5>

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={toggle}
            ></button>
          </div>
          <Row>
            <Col md={12}>
              <Row style={{ marginBottom: 10 }}>
                <Col md={1}></Col>
                <Col md={10}>
                  <Form.Group>
                    <Form.Label>Barcode</Form.Label>
                    <Input
                      ref={this.inputRef}
                      type="text"
                      value={barcode}
                      onChange={this.handleBarcodeChange}
                      onKeyPress={this.handleKeyPress}
                      placeholder="Scan or enter barcode here"
                      style={{
                        padding: '10px',
                        fontSize: '16px',
                        borderRadius: '6px',
                      }}
                    />
                  </Form.Group>
                  {submitted && !barcode && (
                    <div style={{ color: "red" }}>Barcode is required</div>
                  )}
                  

                  {scannedBarcodes.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                      <h6>Recently Scanned ({scannedBarcodes.length})</h6>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {scannedBarcodes.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              padding: '8px',
                              margin: '5px 0',
                              backgroundColor: '#f8f9fa',
                              border: '1px solid #e9ecef',
                              borderRadius: '4px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <strong>{item.code}</strong>
                              <br />
                              <small style={{ color: '#666' }}>
                                Scanned at: {item.timestamp}
                              </small>
                            </div>
                            <div>
                              
                              <Button
                                size="small"
                                danger
                                onClick={() => this.removeScannedBarcode(item.id)}
                                style={{
                                  fontSize: '12px'
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Col>
                <Col md={1}></Col>
              </Row>
            </Col>
          </Row>
          <Row>
            <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            padding: '15px 20px',
            borderTop: '1px solid #e9ecef',
            marginTop: '10px'
          }}>
            <Button
              type="primary"
              onClick={this.onSave}
              disabled={saving || !barcode.trim()}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          </Row>
        </Modal>
      </>
    );
  }
}

export default EditBarcode;