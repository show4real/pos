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
        
        this.inputRef = React.createRef();
    }

   componentDidMount() {
      
   
        window.addEventListener("keydown", this.handleKeyPress);
     }

    componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyPress);
  }

  handleKeyPress = (e) => {
    const tag = document.activeElement.tagName;

    // If not typing in input or textarea, allow global input
    if (tag !== "INPUT" && tag !== "TEXTAREA") {
      if (this.inputRef.current) {
        this.inputRef.current.focus(); // autofocus input
      }

      if (/^[a-zA-Z0-9]$/.test(e.key)) {
        this.setState((prev) => ({
          input: prev.input + e.key,
        }));
      }

      if (e.key === "Enter") {
        this.addScannedBarcode();
        this.setState({ input: "" });
      }
    }
  };

    onChange = (e, state) => {
        this.setState({ [state]: e });
    };

    handleBarcodeChange = (e) => {
        this.setState({
            barcode: e.target.value,
        });
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
                    style={{ maxWidth: 650 }}
                >
                    {/* Modal Header */}
                    <div className="modal-header border-bottom" style={{ padding: "1.5rem" }}>
                        <h4 className="modal-title mb-0 text-primary">
                            <i className="fas fa-barcode me-2"></i>
                            Update Barcode
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
                        <div className="barcode-input-section mb-4">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold mb-2" style={{ fontSize: "16px" }}>
                                    <i className="fas fa-qrcode me-2"></i>
                                    Barcode Scanner
                                </Form.Label>
                                <div className="input-group" style={{ height: "50px" }}>
                                    <span className="input-group-text bg-light" style={{ borderRadius: "8px 0 0 8px" }}>
                                        <i className="fas fa-scan text-muted"></i>
                                    </span>
                                    <input
                                        ref={this.inputRef}
                                        type="text"
                                        value={barcode}
                                        onChange={this.handleBarcodeChange}
                                       
                                        placeholder="Scan or enter barcode here"
                                        style={{
                                            height: "50px",
                                            fontSize: "16px",
                                            borderRadius: "0 8px 8px 0",
                                            border: "2px solid #e9ecef",
                                            borderLeft: "none",
                                            paddingLeft: "15px"
                                        }}
                                        className="form-control"
                                    />
                                </div>
                                {submitted && !barcode && (
                                    <div className="text-danger mt-2" style={{ fontSize: "14px" }}>
                                        <i className="fas fa-exclamation-circle me-1"></i>
                                        Barcode is required
                                    </div>
                                )}
                            </Form.Group>

                            {/* Scan Instructions */}
                            <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
                                <i className="fas fa-info-circle me-3 fs-5"></i>
                                <div>
                                    <small className="mb-0">
                                        <strong>Instructions:</strong> Point your scanner at the barcode or manually type the code above.
                                        Press Enter or click Save to confirm.
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Scanned Barcodes History */}
                        {scannedBarcodes.length > 0 && (
                            <div className="scanned-history-section">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h6 className="mb-0 fw-semibold">
                                        <i className="fas fa-history me-2 text-muted"></i>
                                        Recently Scanned
                                    </h6>
                                    <span className="badge bg-primary rounded-pill">
                                        {scannedBarcodes.length}
                                    </span>
                                </div>

                                <div
                                    className="scanned-list border rounded"
                                    style={{
                                        maxHeight: "220px",
                                        overflowY: "auto",
                                        backgroundColor: "#f8f9fa"
                                    }}
                                >
                                    {scannedBarcodes.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className={`d-flex justify-content-between align-items-center p-3 ${index !== scannedBarcodes.length - 1 ? 'border-bottom' : ''
                                                }`}
                                            style={{
                                                backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                                                transition: "background-color 0.2s ease"
                                            }}
                                        >
                                            <div className="flex-grow-1">
                                                <div className="d-flex align-items-center mb-1">
                                                    <i className="fas fa-barcode me-2 text-primary"></i>
                                                    <strong style={{ fontSize: "15px" }}>{item.code}</strong>
                                                </div>
                                                <small className="text-muted">
                                                    <i className="fas fa-clock me-1"></i>
                                                    Scanned: {item.timestamp}
                                                </small>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                onClick={() => this.removeScannedBarcode(item.id)}
                                                style={{
                                                    borderRadius: "6px",
                                                    fontSize: "12px",
                                                    padding: "4px 8px"
                                                }}
                                                title="Remove this barcode"
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div
                        className="modal-footer border-top d-flex justify-content-end gap-2"
                        style={{
                            padding: "1.5rem",
                            backgroundColor: "#f8f9fa"
                        }}
                    >
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
                            variant="primary"
                            size="lg"
                            onClick={this.onSave}
                            disabled={saving || !barcode.trim() || loading}
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
                                    Save Barcode
                                </>
                            )}
                        </Button>
                    </div>
                </Modal>
            </>
        );
    }
}

export default EditBarcode;