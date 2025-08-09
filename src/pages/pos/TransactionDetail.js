import React, { Component } from "react";
import { Input, Media, Modal } from "reactstrap";
import { toast } from "react-toastify";
import {
  Button,
} from "@themesberg/react-bootstrap";
import SpinDiv from "../components/SpinDiv";
import { getTransactionDetails } from "../../services/posOrderService";
import moment from "moment";
import TransactionPrintComponent from "./TransactionPrintComponent";


// Thermal Print Component for 80mm thermal printer
class ThermalPrintComponent extends Component {
  // Helper method to consolidate products with same id and price
  consolidateProducts = (transaction_detail) => {
    if (!transaction_detail || !Array.isArray(transaction_detail)) {
      return [];
    }

    const consolidated = {};
    
    transaction_detail.forEach(item => {
      // Create a unique key based on product ID and selling price
      const key = `${item.product_id || item.id || item.product_name}_${item.selling_price}`;
      
      if (consolidated[key]) {
        // If item already exists, add to quantity
        consolidated[key].qty_sold += item.qty_sold;
      } else {
        // If new item, create a copy
        consolidated[key] = { ...item };
      }
    });

    // Convert back to array
    return Object.values(consolidated);
  };

  render() {
    const { 
      transaction_detail, 
      company, 
      invoice_data, 
      transaction_id,
      transaction_date_time,
      payment_mode,
      cashier_name,
      transaction_total,
      balance,
      prev_balance,
      total_balance 
    } = this.props;

    // Consolidate products with same ID and price
    const consolidatedItems = this.consolidateProducts(transaction_detail);

    return (
      <div className="thermal-print-container" style={{ display: 'none' }}>
        <div className="thermal-print-content" style={{
          width: '80mm',
          maxWidth: '300px',
          padding: '10px',
          margin: '0 auto',
          backgroundColor: 'white',
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          lineHeight: '1.2',
          color: '#000'
        }}>
          {/* Header Section */}
          <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '3px' }}>
              {company?.name || 'STORE NAME'}
            </div>
            {company?.invoice_header && (
              <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                {company.invoice_header}
              </div>
            )}
            {company?.address && (
              <div style={{ fontSize: '10px', marginBottom: '3px' }}>
                {company.address}
              </div>
            )}
            <div style={{ fontSize: '10px' }}>
              {company?.phone_one && `Tel: ${company.phone_one}`}
              {company?.phone_one && company?.phone_two && ' | '}
              {company?.phone_two && `${company.phone_two}`}
            </div>
            {company?.email && (
              <div style={{ fontSize: '10px' }}>
                {company.email}
              </div>
            )}
          </div>

          {/* Transaction Info */}
          <div style={{ marginBottom: '15px', fontSize: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Receipt #:</span>
              <span>{transaction_id}</span>
            </div>
            {invoice_data?.invoice_no && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Invoice #:</span>
                <span>{invoice_data.invoice_no}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Date:</span>
              <span>{moment(transaction_date_time).format("DD/MM/YYYY HH:mm")}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Cashier:</span>
              <span>{cashier_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Payment:</span>
              <span>{payment_mode}</span>
            </div>
            {invoice_data?.client_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Customer:</span>
                <span>{invoice_data.client_name}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', paddingTop: '5px', paddingBottom: '5px', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '5px', textAlign: 'center' }}>
              ITEMS PURCHASED
            </div>
            {consolidatedItems.map((item, index) => (
              <div key={index} style={{ marginBottom: '8px', fontSize: '10px' }}>
                <div style={{ fontWeight: 'bold' }}>
                  {item.product_name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span>{item.qty_sold} x {(company?.currency || '')} {this.props.formatNumber(item.selling_price)}</span>
                  <span>{(company?.currency || '')} {this.props.formatNumber(item.qty_sold * item.selling_price)}</span>
                </div>
                {/* {item.supplier_name && (
                  <div style={{ fontSize: '9px', color: '#666', marginTop: '1px' }}>
                    Supplier: {item.supplier_name}
                  </div>
                )} */}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ fontSize: '11px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>
              <span>TOTAL:</span>
              <span>{(company?.currency || '')} {this.props.formatNumber(invoice_data?.total || transaction_total)}</span>
            </div>
            
            {invoice_data?.amount_paid !== undefined && invoice_data?.amount_paid !== null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Paid:</span>
                <span>{(company?.currency || '')} {this.props.formatNumber(invoice_data.amount_paid)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Curr Balance:</span>
              <span>{(company?.currency || '')} {this.props.formatNumber(balance !== undefined && balance !== null ? balance : 0)}</span>
            </div>

            {prev_balance !== undefined && prev_balance !== null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Prev Balance:</span>
                <span>{(company?.currency || '')} {this.props.formatNumber(prev_balance)}</span>
              </div>
            )}

            {total_balance !== undefined && total_balance !== null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', borderTop: '1px dashed #000', paddingTop: '3px', fontWeight: 'bold' }}>
                <span>TOTAL BALANCE:</span>
                <span>{(company?.currency || '')} {this.props.formatNumber(total_balance)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: '9px', borderTop: '1px dashed #000', paddingTop: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
              {company?.invoice_footer_one || 'Thank you for your business!'}
            </div>
            <div style={{ marginBottom: '5px' }}>
              {company?.invoice_footer_two || 'Goods sold in good condition are not returnable'}
            </div>
            <div>
              {moment().format("DD/MM/YYYY HH:mm")}
            </div>
            <div style={{ marginTop: '5px' }}>
              {company?.website || ''}
            </div>
          </div>
        </div>
      </div>
    );
  }
}


export class TransactionDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      page: 1,
      rows: 10,
      loading: false,
      transaction_detail: [],
      transaction_id: props.transaction_id,
      toggle: props.toggle,
      company: JSON.parse(localStorage.getItem("company")),
      invoice_data: null, // Store invoice data
      balance: 0,
      prev_balance: 0,
      total_balance: 0,
      delivery_fee: 0
    };
  }

  componentDidMount() {
    this.getTransactionDetails();
  }

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "success" }}>{msg}</div>);
  };

  getTransactionDetails = () => {
    const { transaction_id } = this.state;
    this.setState({ loading: true });
    getTransactionDetails({ transaction_id }).then(
      (res) => {
        this.setState({
          loading: false,
          transaction_detail: res.transaction_detail,
          invoice_data: res.invoice, // Store invoice data
          delivery_fee : res.invoice.delivery_fee,
          balance: res.balance,
          prev_balance: res.prev_balance,
          total_balance: res.total_balance,
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  toggleFilter = () => {
    this.setState({ showFilter: !this.state.showFilter });
  };
 
  formatNumber = (number) => {
    if (number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  };

  // Custom print function for A4
  handlePrint = () => {
    const printContent = document.querySelector('.print-container');
    const originalContent = document.body.innerHTML;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Transaction Receipt</title>
          <style>
            @media print {
              body { margin: 0; }
              .print-content { display: block !important; }
            }
            @page {
              size: A4;
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Custom print function for Thermal
  handleThermalPrint = () => {
    const printContent = document.querySelector('.thermal-print-container');
    
    // Create a new window for thermal printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Thermal Receipt</title>
          <style>
            @media print {
              body { margin: 0; }
              .thermal-print-content { display: block !important; }
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  attributeCols = (attribute_name, attribute_value) => {
    if (attribute_name !== null) {
      let attributes = new Array();
      let values = new Array();
      attributes = attribute_name.split(",");
      values = attribute_value.split(",");
      return values.map((attrs, key) => {
        return (
          <p className="mb-0 text-sm" style={{ textTransform: "capitalize" }}>
            <span style={{ fontWeight: "bold" }}>{attrs + ":" + "  "}</span>
            {attributes[key]}
          </p>
        );
      });
    } else {
      return "";
    }
  };

  render() {
    const {
      transaction_detail,
      search,
      loading,
      toggle,
      transaction_id,
      company,
      invoice_data,
      balance,
      prev_balance,
      total_balance,
      delivery_fee
    } = this.state;

    var p_mode = transaction_detail.map(function (p) {
      return p.payment_mode;
    });
    var transaction_date_time = transaction_detail.map(function (p) {
      return p.created_at;
    });
    var cashier_name = transaction_detail.map(function (p) {
      return p.cashier_name;
    });
    const transaction_total = transaction_detail
      .map((p) => p.selling_price * p.qty_sold)
      .reduce((prev, curr) => prev + curr, 0);
      const discount = invoice_data?.discount;
      console.log(discount)

    return (
      <>
        {/* Print Components - Hidden */}
        <TransactionPrintComponent
          transaction_detail={transaction_detail}
          company={company}
          invoice_data={invoice_data}
          transaction_id={transaction_id}
          transaction_date_time={transaction_date_time[0]}
          payment_mode={p_mode[0]}
          cashier_name={cashier_name[0]}
          transaction_total={transaction_total + delivery_fee - discount}
          balance={this.state.balance}
          prev_balance={this.state.prev_balance}
          total_balance={this.state.total_balance}
          formatNumber={this.formatNumber}
          delivery_fee ={delivery_fee}
          discount = {discount}
        />

        

        <ThermalPrintComponent
          transaction_detail={transaction_detail}
          company={company}
          invoice_data={invoice_data}
          transaction_id={transaction_id}
          transaction_date_time={transaction_date_time[0]}
          payment_mode={p_mode[0]}
          cashier_name={cashier_name[0]}
          transaction_total={transaction_total + delivery_fee - discount}
          balance={this.state.balance}
          prev_balance={this.state.prev_balance}
          total_balance={this.state.total_balance}
          formatNumber={this.formatNumber}
          delivery_fee ={delivery_fee}
          discount={discount}
        />

        {loading && <SpinDiv text={"Loading..."} />}

        <Modal
          className="modal-dialog-full"
          isOpen={transaction_id != null}
          toggle={() => !loading && toggle}
          style={{
            maxWidth: "70%",
            marginLeft: "350px", // Replace 280px with your actual sidebar width
            marginRight: "auto"
          }}
          centered
        >
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title mb-0">Transaction Details</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={toggle}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body p-4">
            {/* Transaction Info Cards */}
            <div className="row g-3 mb-4">
              {/* Client Name Card */}
              <div className="col-lg-2 col-md-4 col-sm-6">
                <div className="info-card h-100 border-secondary">
                  <div className="card-body text-center">
                    <div className="info-icon mb-2">
                      <i className="fas fa-user text-secondary fs-4"></i>
                    </div>
                    <p className="text-muted mb-1 small">Client</p>
                    <h6 className="mb-0 fw-bold text-secondary">
                      {invoice_data?.client_name || 'Walk-in Customer'}
                    </h6>
                  </div>
                </div>
              </div>

              {/* Cashier Card */}
              <div className="col-lg-2 col-md-4 col-sm-6">
                <div className="info-card h-100">
                  <div className="card-body text-center">
                    <div className="info-icon mb-2">
                      <i className="fas fa-user-tie text-primary fs-4"></i>
                    </div>
                    <p className="text-muted mb-1 small">Cashier</p>
                    <h6 className="mb-0 fw-bold">{cashier_name[0]}</h6>
                  </div>
                </div>
              </div>

              {/* Transaction ID Card */}
              <div className="col-lg-2 col-md-4 col-sm-6">
                <div className="info-card h-100 border-success">
                  <div className="card-body text-center">
                    <div className="info-icon mb-2">
                      <i className="fas fa-receipt text-success fs-4"></i>
                    </div>
                    <p className="text-muted mb-1 small">Transaction ID</p>
                    <h6 className="mb-0 fw-bold text-success">{transaction_id}</h6>
                  </div>
                </div>
              </div>

              {/* Payment Mode Card */}
              <div className="col-lg-2 col-md-4 col-sm-6">
                <div className="info-card h-100">
                  <div className="card-body text-center">
                    <div className="info-icon mb-2">
                      <i className="fas fa-credit-card text-info fs-4"></i>
                    </div>
                    <p className="text-muted mb-1 small">Payment Mode</p>
                    <h6 className="mb-0 fw-bold text-info">{p_mode[0]}</h6>
                  </div>
                </div>
              </div>

              {/* Transaction Time Card */}
              <div className="col-lg-2 col-md-4 col-sm-6">
                <div className="info-card h-100">
                  <div className="card-body text-center">
                    <div className="info-icon mb-2">
                      <i className="fas fa-clock text-warning fs-4"></i>
                    </div>
                    <p className="text-muted mb-1 small">Transaction Time</p>
                    <h6 className="mb-0 fw-bold text-warning">
                      {moment(transaction_date_time[0]).format("MMM D, YYYY")}
                      <small className="d-block text-muted">
                        {moment(transaction_date_time[0]).format("hh:mm A")}
                      </small>
                    </h6>
                  </div>
                </div>
              </div>

              {/* Total Card */}
              <div className="col-lg-2 col-md-4 col-sm-6">
                <div className="info-card h-100 border-primary">
                  <div className="card-body text-center">
                    <div className="info-icon mb-2">
                      <i className="fas fa-calculator text-primary fs-4"></i>
                    </div>
                    <p className="text-muted mb-1 small">Total</p>
                    <h6 className="mb-0 fw-bold text-primary">
                      {company?.currency || ''} {this.formatNumber(invoice_data?.total || transaction_total)}
                    </h6>
                  </div>
                </div>
              </div>

             
            </div>

            {/* Balance Cards Row */}
            <div className="row g-3 mb-4">
               

              <div className="col-lg-3 col-md-6">
                <div className="info-card h-100 border-success">
                  <div className="card-body text-center">
                    <div className="info-icon mb-2">
                      <i className="fas fa-car text-success fs-4"></i>
                    </div>
                    <p className="text-muted mb-1 small">Delivery Fee</p>
                    <h6 className="mb-0 fw-bold text-success">
                      {company?.currency || ''} {this.formatNumber(invoice_data?.delivery_fee || 0)}
                    </h6>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="info-card h-100 border-success">
                  <div className="card-body text-center">
                    <div className="info-icon mb-2">
                      <i className="fas fa-money-bill-wave text-success fs-4"></i>
                    </div>
                    <p className="text-muted mb-1 small">Discount</p>
                    <h6 className="mb-0 fw-bold text-success">
                      {company?.currency || ''} {this.formatNumber(-invoice_data?.discount || 0)}
                    </h6>
                  </div>
                </div>
              </div>
              {/* Amount Paid Card */}
              <div className="col-lg-3 col-md-6">
                <div className="info-card h-100 border-success">
                  <div className="card-body text-center">
                    <div className="info-icon mb-2">
                      <i className="fas fa-money-bill-wave text-success fs-4"></i>
                    </div>
                    <p className="text-muted mb-1 small">Amount</p>
                    <h6 className="mb-0 fw-bold text-success">
                      {company?.currency || ''} {this.formatNumber(invoice_data?.amount || 0)}
                    </h6>
                  </div>
                </div>
              </div>

              {/* Amount Paid Card */}
              <div className="col-lg-3 col-md-6">
                <div className="info-card h-100 border-success">
                  <div className="card-body text-center">
                    <div className="info-icon mb-2">
                      <i className="fas fa-money-bill-wave text-success fs-4"></i>
                    </div>
                    <p className="text-muted mb-1 small">Amount Paid</p>
                    <h6 className="mb-0 fw-bold text-success">
                      {company?.currency || ''} {this.formatNumber(invoice_data?.amount_paid || 0)}
                    </h6>
                  </div>
                </div>
              </div>
              
              {/* Current Balance Card */}
              <div className="col-lg-3 col-md-6">
                <div className="info-card h-100 border-info">
                  <div className="card-body text-center">
                    <div className="info-icon mb-2">
                      <i className="fas fa-balance-scale text-info fs-4"></i>
                    </div>
                    <p className="text-muted mb-1 small">Current Balance</p>
                    <h6 className="mb-0 fw-bold text-info">
                      {company?.currency || ''} {this.formatNumber(balance !== undefined && balance !== null ? balance : 0)}
                    </h6>
                  </div>
                </div>
              </div>

              {/* Previous Balance Card */}
              <div className="col-lg-3 col-md-6">
                <div className="info-card h-100 border-warning">
                  <div className="card-body text-center">
                    <div className="info-icon mb-2">
                      <i className="fas fa-history text-warning fs-4"></i>
                    </div>
                    <p className="text-muted mb-1 small">Previous Balance</p>
                    <h6 className="mb-0 fw-bold text-warning">
                      {company?.currency || ''} {this.formatNumber(prev_balance || 0)}
                    </h6>
                  </div>
                </div>
              </div>

              {/* Total Balance Card */}
              <div className="col-lg-3 col-md-6">
                <div className="info-card h-100 border-danger">
                  <div className="card-body text-center">
                    <div className="info-icon mb-2">
                      <i className="fas fa-wallet text-danger fs-4"></i>
                    </div>
                    <p className="text-muted mb-1 small">Total Balance</p>
                    <h6 className="mb-0 fw-bold text-danger">
                      {company?.currency || ''} {this.formatNumber(total_balance || 0)}
                    </h6>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Details Table */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light">
                <h6 className="mb-0 fw-bold">
                  <i className="fas fa-shopping-cart me-2"></i>
                  Items Purchased
                </h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th className="border-0 ps-4">Product</th>
                        <th className="border-0 text-center">Price</th>
                        {company.sell_by_serial_no == 1 && (
                          <th className="border-0 text-center">Serial Numbers</th>
                        )}
                        <th className="border-0 text-center">Quantity</th>
                        <th className="border-0 text-center">Supplier</th>
                        <th className="border-0 text-end pe-4">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transaction_detail.map((stock, key) => (
                        <tr key={key} className="align-middle">
                          <td className="ps-4">
                            <div className="d-flex align-items-center">
                              <div className="product-icon me-3">
                                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                  <i className="fas fa-box text-primary"></i>
                                </div>
                              </div>
                              <div>
                                <h6 className="mb-1 fw-semibold">
                                  {stock.product_name}
                                </h6>
                              </div>
                            </div>
                          </td>

                          <td className="text-center">
                            <span className="badge bg-light text-dark fs-6 fw-semibold">
                              {company?.currency || ''} {this.formatNumber(stock.selling_price)}
                            </span>
                          </td>

                          <td className="text-center">
                            <span className="text-primary px-3 py-2">
                              {stock.qty_sold}
                            </span>
                          </td>

                          <td className="text-center">
                            <span className="text-muted">{stock.supplier_name}</span>
                          </td>

                          <td className="text-end pe-4">
                            <span className="fw-bold text-success fs-6">
                              {company?.currency || ''} {this.formatNumber(stock.qty_sold * stock.selling_price)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Section */}
              <div className="card-footer bg-dark text-white">
                <div className="row align-items-center">
                  <div className="col">
                    <h5 className="mb-0 fw-bold">
                      <i className="fas fa-calculator me-2"></i>
                      Transaction Total
                    </h5>
                  </div>
                  <div className="col-auto">
                    <h4 className="mb-0 fw-bold text-warning">
                      {company?.currency || ''} {this.formatNumber(transaction_total)}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-light">
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={loading}
                onClick={this.handlePrint}
              >
                <i className="fas fa-print me-2"></i>
                Print A4 Receipt
              </Button>
              <Button
                variant="outline-info"
                size="sm"
                disabled={loading}
                onClick={this.handleThermalPrint}
              >
                <i className="fas fa-receipt me-2"></i>
                Print Thermal Receipt
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={loading}
                onClick={toggle}
              >
                <i className="fas fa-times me-2"></i>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }
}

export default TransactionDetail;