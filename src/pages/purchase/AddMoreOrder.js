import React, { Component } from "react";
import { CardHeader, Media, Input, Modal } from "reactstrap";
import { Col, Row, Form } from "@themesberg/react-bootstrap";
import { Button, InputNumber } from "antd";
import { moreOrder, moreOrder2 } from "../../services/purchaseOrderService";
import SpinDiv from "../components/SpinDiv";
import { toast } from "react-toastify";

export class AddMoreOrder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      saving: false,
      loading: false,
      unit_order: 0,
      id: props.stock.id,
      submitted: false,
    };
  }

  onChange = (e, state) => {
    this.setState({ [state]: e });
  };

  onSave = async () => {
    await toast.dismiss();
    const { unit_order } = this.state;
    this.setState({ submitted: true });
    let check_order = unit_order == 0;

    if (check_order == 0 || check_order == "") {
      this.saveOrder();
    } else {
      this.setState({ loading: false, saving: false });
    }
  };

  saveOrder = async () => {
    await toast.dismiss();
    this.setState({ saving: true });

    const { unit_order, id } = this.state;
    this.setState({ saving: true });
    moreOrder2({
      quantity: unit_order,
      id: id,
    }).then(
      (res) => {
        this.setState({ loading: false, saving: false });
        this.showToast("Order has been updated");
        this.props.toggle();
      },
      (error) => {
        this.setState({ loading: false, saving: false });
        alert("Order Could not be saved checK network");
      }
    );
  };

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "green" }}>{msg}</div>);
  };

  render() {
    const { stock, toggle } = this.props;

    const { saving, submitted, unit_order, loading } = this.state;
    return (
      <>
        {saving && <SpinDiv text={"Saving..."} />}
        {loading && <SpinDiv text={"loading..."} />}
        <Modal
          className="modal-dialog modal-dialog-centered"
          isOpen={stock != null}
          toggle={() => !loading && !saving && toggle}
          style={{ maxWidth: 500 }}
        >
          {/* Modal Header */}
          <div
            className="modal-header"
            style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid #e9ecef",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <h5 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
              Add More Quantity to Order
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={toggle}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                padding: "4px"
              }}
            />
          </div>

          {/* Modal Body */}
          <div style={{ padding: "24px" }}>
            <Form.Group style={{ marginBottom: "20px" }}>
              <Form.Label
                style={{
                  fontWeight: "500",
                  marginBottom: "8px",
                  display: "block",
                  color: "#495057"
                }}
              >
                Quantity
              </Form.Label>
              <InputNumber
                value={unit_order}
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                onKeyPress={(event) => {
                  if (!/[0-9]/.test(event.key)) {
                    event.preventDefault();
                  }
                }}
                onChange={(e) => this.onChange(e, "unit_order")}
                style={{
                  width: "100%",
                  height: "40px",
                  fontSize: "16px"
                }}
                placeholder="Enter quantity"
              />
              {submitted && !unit_order && (
                <div
                  style={{
                    color: "#dc3545",
                    fontSize: "14px",
                    marginTop: "6px",
                    fontWeight: "500"
                  }}
                >
                  Order Quantity is required
                </div>
              )}
            </Form.Group>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '16px 24px 24px',
              borderTop: '1px solid #e9ecef',
              gap: '12px'
            }}
          >
            <Button
              onClick={toggle}
              style={{
                backgroundColor: "#6c757d",
                borderColor: "#6c757d",
                color: "white",
                padding: "8px 20px",
                height: "auto"
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => {
                this.onSave();
              }}
              disabled={saving || !unit_order}
              style={{
                padding: "8px 20px",
                height: "auto"
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </Modal>
      </>
    );
  }
}

export default AddMoreOrder;
