import React, { Component, createRef } from "react";
import { CardHeader, Media, Input, Modal } from "reactstrap";
import {
    Col,
    Row,
    Form,
} from "@themesberg/react-bootstrap";
import { Button } from "antd";
import { editPriceWithQty } from "../../services/purchaseOrderService";
import SpinDiv from "../components/SpinDiv";
import { toast } from "react-toastify";

export class EditPrice extends Component {
    constructor(props) {
        super(props);
        this.state = {
            saving: false,
            loading: false,
            barcode: props.stock.barcode || '',
            product_name: props.stock.product_name || '',
            id: props.stock.id,
            stock_quantity:  0,
            unit_selling_price: props.stock.unit_selling_price || 0,
            submitted: false,
        };

        this.inputRef = React.createRef();
    }

    componentDidMount() {
       
    }

    componentWillUnmount() {
       
    }

    onChange = (e, state) => {
        this.setState({ [state]: e });
    };

    onInputChange = (e) => {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    };

    handleSave = async () => {
        const { stock_quantity, unit_selling_price, id } = this.state;
        
    
        
        if (!unit_selling_price || unit_selling_price <= 0) {
            toast.error("Please enter a valid selling price");
            return;
        }

        this.setState({ saving: true, submitted: true });

        try {
            const payload = {
                id: id,
                stock_quantity: parseFloat(stock_quantity),
                unit_selling_price: parseFloat(unit_selling_price)
            };

            const response = await editPriceWithQty(payload);
            this.props.toggle();
            
            if (response && response.success) {

                this.showToast("Price and quantity updated successfully!");
               this.props.toggle();
            } else {
                toast.error(response?.message || "Failed to update price and quantity");
            }
        } catch (error) {
            console.error("Error updating price:", error);
            toast.error("An error occurred while updating price and quantity");
        } finally {
            this.setState({ saving: false });
        }
    };
    
    showToast = (msg) => {
        toast(<div style={{ padding: 20, color: "green" }}>{msg}</div>);
    };

    render() {
        const { stock, toggle } = this.props;
        const { saving, loading, stock_quantity, unit_selling_price, submitted } = this.state;

        return (
            <>
                {saving && <SpinDiv text={"Saving..."} />}
                {loading && <SpinDiv text={"loading..."} />}
                <Modal
                    className="modal-dialog modal-dialog-centered"
                    isOpen={stock != null}
                    toggle={() => !loading && !saving && toggle()}
                    style={{ maxWidth: 650 }}
                >
                    {/* Modal Header */}
                    <div className="modal-header border-bottom" style={{ padding: "1.5rem" }}>
                        <h4 className="modal-title mb-0 text-primary">
                            <i className="fas fa-barcode me-2"></i>
                            Edit Price and Quantity
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
                    <div className="modal-body" style={{ padding: "1.5rem" }}>
                        <Form>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <div className="form-group">
                                        <label className="form-label">
                                            <i className="fas fa-barcode me-2"></i>
                                            Barcode
                                        </label>
                                        <Input
                                            type="text"
                                            value={this.state.barcode}
                                            disabled
                                            className="form-control"
                                            style={{ backgroundColor: '#f8f9fa' }}
                                        />
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="form-group">
                                        <label className="form-label">
                                            <i className="fas fa-hashtag me-2"></i>
                                            Product Name
                                        </label>
                                        <Input
                                            type="text"
                                            value={this.state.product_name}
                                            disabled
                                            className="form-control"
                                            style={{ backgroundColor: '#f8f9fa' }}
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <div className="form-group">
                                        <label className="form-label">
                                            <i className="fas fa-boxes me-2"></i>
                                            Add more Qty *
                                        </label>
                                        <Input
                                            type="number"
                                            name="stock_quantity"
                                        
                                            onChange={this.onInputChange}
                                            placeholder="Enter stock quantity"
                                            className="form-control"
                                            min="0"
                                            step="1"
                                            disabled={saving || loading}
                                        />
                                       
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="form-group">
                                        <label className="form-label">
                                            <i className="fas fa-dollar-sign me-2"></i>
                                            Unit Selling Price *
                                        </label>
                                        <Input
                                            type="number"
                                            name="unit_selling_price"
                                            value={unit_selling_price}
                                            onChange={this.onInputChange}
                                            placeholder="Enter selling price"
                                            className="form-control"
                                            min="0"
                                            step="0.01"
                                            disabled={saving || loading}
                                        />
                                        {submitted && (!unit_selling_price || unit_selling_price <= 0) && (
                                            <small className="text-danger">
                                                Valid selling price is required
                                            </small>
                                        )}
                                    </div>
                                </Col>
                            </Row>

                            {stock && (
                                <div className="alert alert-info">
                                    <small>
                                        <strong>Current Values:</strong><br/>
                                        Quantity: {stock.stock_quantity || 'N/A'} | 
                                        Price: NGN{stock.unit_selling_price || 'N/A'}
                                    </small>
                                </div>
                            )}
                        </Form>
                    </div>

                    {/* Modal Footer */}
                    <div className="modal-footer border-top" style={{ padding: "1.5rem" }}>
                        <Button
                            type="default"
                            onClick={toggle}
                            disabled={saving || loading}
                            className="me-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            onClick={this.handleSave}
                            loading={saving}
                            disabled={loading}
                            icon={<i className="fas fa-save"></i>}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </Modal>
            </>
        );
    }
}

export default EditPrice;