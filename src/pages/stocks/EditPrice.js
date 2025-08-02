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
            quantity_operation: 'add', // 'add' or 'subtract'
            add_quantity: 0,
            subtract_quantity: 0,
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

    onOperationChange = (operation) => {
        this.setState({ 
            quantity_operation: operation,
            // Reset the other quantity field when switching operations
            add_quantity: operation === 'add' ? this.state.add_quantity : 0,
            subtract_quantity: operation === 'subtract' ? this.state.subtract_quantity : 0
        });
    };

    handleSave = async () => {
        const { 
            quantity_operation, 
            add_quantity, 
            subtract_quantity, 
            unit_selling_price, 
            id 
        } = this.state;
        
        const currentQuantity = quantity_operation === 'add' ? add_quantity : subtract_quantity;
        
        if (!unit_selling_price || unit_selling_price <= 0) {
            toast.error("Please enter a valid selling price");
            return;
        }

        if (!currentQuantity || currentQuantity <= 0) {
            toast.error(`Please enter a valid quantity to ${quantity_operation}`);
            return;
        }

        // Check if subtract operation would result in negative stock
        if (quantity_operation === 'subtract' && this.props.stock.stock_quantity) {
            const remainingStock = this.props.stock.stock_quantity - parseFloat(subtract_quantity);
            if (remainingStock < 0) {
                toast.error(`Cannot subtract ${subtract_quantity}. Only ${this.props.stock.stock_quantity} items in stock.`);
                return;
            }
        }

        this.setState({ saving: true, submitted: true });

        try {
            const payload = {
                id: id,
                stock_quantity: parseFloat(currentQuantity),
                quantity_operation: quantity_operation, // Send operation type to backend
                unit_selling_price: parseFloat(unit_selling_price)
            };

            const response = await editPriceWithQty(payload);
            this.props.toggle()
            
            if (response && response.success) {
                const action = quantity_operation === 'add' ? 'added' : 'subtracted';
                this.showToast(`Price updated and ${currentQuantity} items ${action} successfully!`);
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
        const { 
            saving, 
            loading, 
            quantity_operation,
            add_quantity, 
            subtract_quantity,
            unit_selling_price, 
            submitted 
        } = this.state;

        const currentQuantity = quantity_operation === 'add' ? add_quantity : subtract_quantity;

        return (
            <>
                {saving && <SpinDiv text={"Saving..."} />}
                {loading && <SpinDiv text={"loading..."} />}
                <Modal
                    className="modal-dialog modal-dialog-centered"
                    isOpen={stock != null}
                    toggle={() => !loading && !saving && toggle()}
                    style={{ maxWidth: 700 }}
                >
                    {/* Modal Header */}
                    <div className="modal-header border-bottom" style={{ padding: "1.5rem" }}>
                        <h4 className="modal-title mb-0 text-primary">
                            <i className="fas fa-edit me-2"></i>
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
                            {/* Product Info Row */}
                            <Row className="mb-4">
                                <Col md={6}>
                                    <div className="form-group">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-barcode me-2 text-muted"></i>
                                            Barcode
                                        </label>
                                        <Input
                                            type="text"
                                            value={this.state.barcode}
                                            disabled
                                            className="form-control"
                                            style={{ backgroundColor: '#f8f9fa', fontWeight: '500' }}
                                        />
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="form-group">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-tag me-2 text-muted"></i>
                                            Product Name
                                        </label>
                                        <Input
                                            type="text"
                                            value={this.state.product_name}
                                            disabled
                                            className="form-control"
                                            style={{ backgroundColor: '#f8f9fa', fontWeight: '500' }}
                                        />
                                    </div>
                                </Col>
                            </Row>

                            {/* Current Stock Info */}
                            {stock && (
                                <div className="alert alert-light border mb-4">
                                    <div className="d-flex align-items-center">
                                        <i className="fas fa-info-circle text-info me-2"></i>
                                        <div>
                                            <strong className="text-dark">Current Stock:</strong>
                                            <span className="ms-2 badge bg-secondary">{stock.stock_quantity || 0} items</span>
                                            <span className="ms-3"><strong>Current Price:</strong> NGN {stock.unit_selling_price || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quantity Operation Selection */}
                            <div className="mb-4">
                                <label className="form-label fw-bold mb-3">
                                    <i className="fas fa-exchange-alt me-2 text-muted"></i>
                                    Quantity Operation
                                </label>
                                <div className="d-flex gap-3">
                                    <div className="flex-fill">
                                        <div 
                                            className={`card h-100 cursor-pointer border-2 ${quantity_operation === 'add' ? 'border-success bg-light-success' : 'border-light'}`}
                                            onClick={() => this.onOperationChange('add')}
                                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            <div className="card-body text-center py-3">
                                                <i className={`fas fa-plus-circle fa-2x mb-2 ${quantity_operation === 'add' ? 'text-success' : 'text-muted'}`}></i>
                                                <h6 className={`mb-0 ${quantity_operation === 'add' ? 'text-success fw-bold' : 'text-muted'}`}>
                                                    Add Stock
                                                </h6>
                                                <small className="text-muted">Increase inventory</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-fill">
                                        <div 
                                            className={`card h-100 cursor-pointer border-2 ${quantity_operation === 'subtract' ? 'border-warning bg-light-warning' : 'border-light'}`}
                                            onClick={() => this.onOperationChange('subtract')}
                                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            <div className="card-body text-center py-3">
                                                <i className={`fas fa-minus-circle fa-2x mb-2 ${quantity_operation === 'subtract' ? 'text-warning' : 'text-muted'}`}></i>
                                                <h6 className={`mb-0 ${quantity_operation === 'subtract' ? 'text-warning fw-bold' : 'text-muted'}`}>
                                                    Remove Stock
                                                </h6>
                                                <small className="text-muted">Reduce inventory</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quantity and Price Row */}
                            <Row className="mb-3">
                                <Col md={6}>
                                    <div className="form-group">
                                        <label className="form-label fw-bold">
                                            <i className={`fas ${quantity_operation === 'add' ? 'fa-plus text-success' : 'fa-minus text-warning'} me-2`}></i>
                                            {quantity_operation === 'add' ? 'Quantity to Add' : 'Quantity to Remove'} *
                                        </label>
                                        {quantity_operation === 'add' ? (
                                            <Input
                                                type="number"
                                                name="add_quantity"
                                                value={add_quantity}
                                                onChange={this.onInputChange}
                                                placeholder="Enter quantity to add"
                                                className="form-control"
                                                min="1"
                                                step="1"
                                                disabled={saving || loading}
                                            />
                                        ) : (
                                            <Input
                                                type="number"
                                                name="subtract_quantity"
                                                value={subtract_quantity}
                                                onChange={this.onInputChange}
                                                placeholder="Enter quantity to remove"
                                                className="form-control"
                                                min="1"
                                                max={stock?.stock_quantity || 999999}
                                                step="1"
                                                disabled={saving || loading}
                                            />
                                        )}
                                        {submitted && (!currentQuantity || currentQuantity <= 0) && (
                                            <small className="text-danger">
                                                <i className="fas fa-exclamation-triangle me-1"></i>
                                                Valid quantity is required
                                            </small>
                                        )}
                                        {quantity_operation === 'subtract' && stock?.stock_quantity && subtract_quantity > stock.stock_quantity && (
                                            <small className="text-danger">
                                                <i className="fas fa-exclamation-triangle me-1"></i>
                                                Cannot remove more than available stock ({stock.stock_quantity})
                                            </small>
                                        )}
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="form-group">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-dollar-sign me-2 text-muted"></i>
                                            Unit Selling Price *
                                        </label>
                                        <Input
                                            type="number"
                                            name="unit_selling_price"
                                            value={unit_selling_price}
                                            onChange={this.onInputChange}
                                            placeholder="Enter selling price"
                                            className="form-control"
                                            min="0.01"
                                            step="0.01"
                                            disabled={saving || loading}
                                        />
                                        {submitted && (!unit_selling_price || unit_selling_price <= 0) && (
                                            <small className="text-danger">
                                                <i className="fas fa-exclamation-triangle me-1"></i>
                                                Valid selling price is required
                                            </small>
                                        )}
                                    </div>
                                </Col>
                            </Row>

                            {/* Preview of changes */}
                            {currentQuantity > 0 && stock && (
                                <div className={`alert ${quantity_operation === 'add' ? 'alert-success' : 'alert-warning'} border-0`}>
                                    <div className="d-flex align-items-center">
                                        <i className={`fas ${quantity_operation === 'add' ? 'fa-arrow-up' : 'fa-arrow-down'} me-2`}></i>
                                        <div>
                                            <strong>Preview:</strong> 
                                            <span className="ms-2">
                                                Stock will {quantity_operation === 'add' ? 'increase' : 'decrease'} from {stock.stock_quantity || 0} to{' '}
                                                <strong>
                                                    {quantity_operation === 'add' 
                                                        ? (parseInt(stock.stock_quantity || 0) + parseInt(currentQuantity))
                                                        : (parseInt(stock.stock_quantity || 0) - parseInt(currentQuantity))
                                                    }
                                                </strong> items
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Form>
                    </div>

                    {/* Modal Footer */}
                    <div className="modal-footer border-top bg-light" style={{ padding: "1.5rem" }}>
                        <Button
                            type="default"
                            onClick={toggle}
                            disabled={saving || loading}
                            className="me-2"
                            size="large"
                        >
                            <i className="fas fa-times me-2"></i>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            onClick={this.handleSave}
                            loading={saving}
                            disabled={loading}
                            size="large"
                            className="px-4"
                        >
                            <i className="fas fa-save me-2"></i>
                            {saving ? 'Saving Changes...' : 'Save Changes'}
                        </Button>
                    </div>
                </Modal>
            </>
        );
    }
}

export default EditPrice;